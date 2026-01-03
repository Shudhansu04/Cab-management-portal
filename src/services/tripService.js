import Trip from '../models/trip.js';
import Cab from '../models/cab.js';
import cabService from './cabService.js';
import { CabState } from '../models/cab.js';

class TripService {
   // For booking a cab
  async bookCab(cityId) {
    // Find best available cab
    const cab = await cabService.getBestAvailableCab(cityId);

    if (!cab) {
      throw new Error('No cabs available in this city');
    }

    // Creating a new trip
    const trip = new Trip({
      cabId: cab._id,
      cityId: cityId,
      status: 'ACTIVE',
      startTime: new Date()
    });

    await trip.save();

    // Updating cab state to ON_TRIP
    await cabService.updateCabState(cab.cabId, CabState.ON_TRIP);

    return {
      trip: await Trip.findById(trip._id).populate('cabId').populate('cityId'),
      cab: await cabService.getCabById(cab.cabId)
    };
  }

   // For completing a trip
  async completeTrip(tripId, endCityId) {
    const trip = await Trip.findById(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    if (trip.status === 'COMPLETED') {
      throw new Error('Trip is already completed');
    }

    trip.status = 'COMPLETED';
    trip.endTime = new Date();
    await trip.save();

    // Updating cab state to IDLE and set location
    const cab = await Cab.findById(trip.cabId);
    await cabService.updateCabState(cab.cabId, CabState.IDLE, endCityId);

    return await Trip.findById(tripId).populate('cabId').populate('cityId');
  }

   // For getting all trips
  async getAllTrips(filters = {}) {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.cityId) query.cityId = filters.cityId;
    if (filters.cabId) {
      const cab = await Cab.findOne({ cabId: filters.cabId });
      if (cab) query.cabId = cab._id;
    }

    return await Trip.find(query)
      .populate('cabId')
      .populate('cityId')
      .sort({ bookedAt: -1 });
  }

   // For getting trip by ID
  async getTripById(tripId) {
    return await Trip.findById(tripId).populate('cabId').populate('cityId');
  }
}

export default new TripService();
