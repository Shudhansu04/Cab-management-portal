import Cab, { CabState } from '../models/cab.js';
import CabHistory from '../models/cabHistory.js';
import Trip from '../models/trip.js';
import City from '../models/city.js';

class InsightService {
   // For getting cab idle time
  async getCabIdleTime(cabId, startDate, endDate) {
    const cab = await Cab.findOne({ cabId });
    if (!cab) {
      throw new Error('Cab not found');
    }

    const history = await CabHistory.find({
      cabId: cab._id,
      changedAt: { $gte: startDate, $lte: endDate }
    }).sort({ changedAt: 1 });

    let totalIdleTime = 0;
    let idleStartTime = null;

    // Process history to calculate idle time
    for (const record of history) {
      if (record.newState === CabState.IDLE && record.previousState !== CabState.IDLE) {
        idleStartTime = record.changedAt;
      } else if (record.newState !== CabState.IDLE && record.previousState === CabState.IDLE && idleStartTime) {
        totalIdleTime += record.changedAt.getTime() - idleStartTime.getTime();
        idleStartTime = null;
      }
    }

    // Handle current state
    if (cab.state === CabState.IDLE) {
      const currentIdleStart = idleStartTime || cab.lastIdleTime;
      const endTime = endDate > new Date() ? new Date() : endDate;
      if (currentIdleStart <= endTime) {
        totalIdleTime += endTime.getTime() - Math.max(currentIdleStart.getTime(), startDate.getTime());
      }
    }

    return {
      cabId: cab.cabId,
      totalIdleTime: totalIdleTime,  
      totalIdleTimeHours: (totalIdleTime / (1000 * 60 * 60)).toFixed(2),
      startDate,
      endDate
    };
  }

  // For getting cab history
  async getCabHistory(cabId, limit = 50) {
    const cab = await Cab.findOne({ cabId });
    if (!cab) {
      throw new Error('Cab not found');
    }

    return await CabHistory.find({ cabId: cab._id })
      .populate('previousCityId')
      .populate('newCityId')
      .sort({ changedAt: -1 })
      .limit(limit);
  }

  // For getting city demand analysis
  async getCityDemandAnalysis(startDate, endDate) {
    const trips = await Trip.find({
      bookedAt: { $gte: startDate, $lte: endDate }
    }).populate('sourceCityId').populate('destinationCityId');

    // Track demand for both source and destination cities
    const cityDemand = {};
    const cityHourlyDemand = {};

    trips.forEach(trip => {
      // Track source city demand
      const sourceCityId = trip.sourceCityId?._id?.toString() || 'unknown';
      const sourceCityName = trip.sourceCityId?.name || 'Unknown';
      const hour = new Date(trip.bookedAt).getHours();

      if (!cityDemand[sourceCityId]) {
        cityDemand[sourceCityId] = {
          cityId: sourceCityId,
          cityName: sourceCityName,
          totalBookings: 0
        };
        cityHourlyDemand[sourceCityId] = {};
      }

      cityDemand[sourceCityId].totalBookings++;
      
      if (!cityHourlyDemand[sourceCityId][hour]) {
        cityHourlyDemand[sourceCityId][hour] = 0;
      }
      cityHourlyDemand[sourceCityId][hour]++;

      if (!cityDemand[cityId]) {
        cityDemand[cityId] = {
          cityId,
          cityName,
          totalBookings: 0
        };
        cityHourlyDemand[cityId] = {};
      }

      cityDemand[cityId].totalBookings++;
      
      if (!cityHourlyDemand[cityId][hour]) {
        cityHourlyDemand[cityId][hour] = 0;
      }
      cityHourlyDemand[cityId][hour]++;
    });

    //finding peak hours for each city
    const analysis = Object.values(cityDemand).map(city => {
      const hourlyData = cityHourlyDemand[city.cityId];
      let maxDemand = 0;
      let peakHours = [];

      for (const [hour, count] of Object.entries(hourlyData)) {
        if (count > maxDemand) {
          maxDemand = count;
          peakHours = [parseInt(hour)];
        } else if (count === maxDemand) {
          peakHours.push(parseInt(hour));
        }
      }

      return {
        ...city,
        peakHours,
        peakHourDemand: maxDemand,
        hourlyBreakdown: hourlyData
      };
    });

    // Sort by total bookings (highest demand first)
    analysis.sort((a, b) => b.totalBookings - a.totalBookings);

    return {
      period: { startDate, endDate },
      cities: analysis
    };
  }

  // For getting all cabs snapshot
  async getAllCabsSnapshot() {
    const cabs = await Cab.find().populate('cityId');
    return cabs.map(cab => ({
      cabId: cab.cabId,
      cabState: cab.state,
      cityId: cab.cityId?._id?.toString() || null,
      cityName: cab.cityId?.name || null,
      lastIdleTime: cab.lastIdleTime,
      totalIdleTime: cab.totalIdleTime
    }));
  }
}

export default new InsightService();
