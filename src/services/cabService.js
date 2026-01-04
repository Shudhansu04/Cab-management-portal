import Cab, { CabState } from '../models/cab.js';
import City from '../models/city.js';
import CabHistory from '../models/cabHistory.js';
import Trip from '../models/trip.js';

class CabService {
  // For registering a new cab
  async registerCab(cabId, cityId) {
    const city = await City.findById(cityId);
    if (!city) {
      throw new Error('City not found');
    }

    const existingCab = await Cab.findOne({ cabId });
    if (existingCab) {
      throw new Error('Cab with this ID already exists');
    }

    const cab = new Cab({
      cabId,
      cityId,
      state: CabState.IDLE,
      lastIdleTime: new Date()
    });

    await cab.save();

    // Record history of the cab
    await this.recordHistory(cab._id, null, CabState.IDLE, null, cityId, {
      action: 'REGISTERED'
    });

    return cab;
  }

   
    // Update cab state. If a cab is ON_TRIP and has an active trip, it cannot be manually
   //  changed back to IDLE. The cab can only become IDLE by completing the trip.
    
  async updateCabState(cabId, newState, cityId = null) {
    const cab = await Cab.findOne({ cabId });
    if (!cab) {
      throw new Error('Cab not found');
    }

    if (!Object.values(CabState).includes(newState)) {
      throw new Error('Invalid cab state');
    }

    // Prevent manually changing cab from ON_TRIP to IDLE if there's an active trip
    if (cab.state === CabState.ON_TRIP && newState === CabState.IDLE) {
      const activeTrip = await Trip.findOne({
        cabId: cab._id,
        status: 'ACTIVE'
      });
      
      if (activeTrip) {
        throw new Error(
          'Cannot change cab state from ON_TRIP to IDLE while trip is active. ' +
          'Trips cannot be cancelled - the trip must be completed first.'
        );
      }
    }

    const previousState = cab.state;
    const previousCityId = cab.cityId;

    // Update state for the cab
    cab.state = newState;

    // Handle status  logic for the cab
    if (newState === CabState.IDLE) {
      if (!cityId) {
        throw new Error('City ID is required when setting cab to IDLE');
      }
      const city = await City.findById(cityId);
      if (!city) {
        throw new Error('City not found');
      }
      cab.cityId = cityId;
      cab.lastIdleTime = new Date();
    } else if (newState === CabState.ON_TRIP) {
      //  calculate and increment total trip time when cab is on trip
      if (previousState === CabState.IDLE) {
        const idleDuration = Date.now() - cab.lastIdleTime.getTime();
        cab.totalIdleTime += idleDuration;
      }
      cab.cityId = null; // City is indeterminate during trip
    }

    cab.updatedAt = new Date();
    await cab.save();

    // Record history for state change
    await this.recordHistory(
      cab._id,
      previousState,
      newState,
      previousCityId,
      cityId || null,
      { action: 'STATE_CHANGE' }
    );

    return cab;
  }

   // For updating cab location
  async updateCabLocation(cabId, cityId) {
    const cab = await Cab.findOne({ cabId });
    if (!cab) {
      throw new Error('Cab not found');
    }

    if (cab.state === CabState.ON_TRIP) {
      throw new Error('Cannot change location of a cab that is ON_TRIP');
    }

    const city = await City.findById(cityId);
    if (!city) {
      throw new Error('City not found');
    }

    const previousCityId = cab.cityId;
    cab.cityId = cityId;
    cab.updatedAt = new Date();
    await cab.save();

    // Record history for location change
    await this.recordHistory(
      cab._id,
      cab.state,
      cab.state,
      previousCityId,
      cityId,
      { action: 'LOCATION_CHANGE' }
    );

    return cab;
  }

  // For getting the best available cab
  async getBestAvailableCab(cityId) {
    const city = await City.findById(cityId);
    if (!city) {
      throw new Error('City not found');
    }

    const availableCabs = await Cab.getAvailableCabs(cityId);

    if (availableCabs.length === 0) {
      return null;
    }

    // Find cab with longest idle time
    let bestCab = availableCabs[0];
    let maxIdleDuration = bestCab.getIdleDuration();

    for (let i = 1; i < availableCabs.length; i++) {
      const idleDuration = availableCabs[i].getIdleDuration();
      if (idleDuration > maxIdleDuration) {
        maxIdleDuration = idleDuration;
        bestCab = availableCabs[i];
      }
    }

    // If there are multiple cabs with same idle duration then randomly select one cab
    const cabsWithSameIdleTime = availableCabs.filter(
      cab => cab.getIdleDuration() === maxIdleDuration
    );

    if (cabsWithSameIdleTime.length > 1) {
      const randomIndex = Math.floor(Math.random() * cabsWithSameIdleTime.length);
      bestCab = cabsWithSameIdleTime[randomIndex];
    }

    return bestCab;
  }

   // For recording cab history
  async recordHistory(cabId, previousState, newState, previousCityId, newCityId, metadata = {}) {
    const history = new CabHistory({
      cabId,
      previousState,
      newState,
      previousCityId,
      newCityId,
      metadata
    });
    await history.save();
  }

   // For getting cab by ID
  async getCabById(cabId) {
    return await Cab.findOne({ cabId }).populate('cityId');
  }

  // For getting all cabs
  async getAllCabs() {
    return await Cab.find().populate('cityId');
  }

  // For bulk updating cabs from snapshot
  async bulkUpdateFromSnapshot(snapshot) {
    const results = {
      updated: [],
      errors: []
    };

    for (const item of snapshot) {
      try {
        const cab = await Cab.findOne({ cabId: item.cabId });
        if (!cab) {
          results.errors.push({
            cabId: item.cabId,
            error: 'Cab not found'
          });
          continue;
        }

        const previousState = cab.state;
        const previousCityId = cab.cityId;

        // Update status for cab
        if (item.cabState !== cab.state) {
          await this.updateCabState(cab.cabId, item.cabState, item.cityId || null);
        }

        // Update location if state is IDLE and city changed
        if (item.cabState === CabState.IDLE && item.cityId) {
          const cityIdStr = cab.cityId?.toString() || '';
          const newCityIdStr = item.cityId.toString();
          if (newCityIdStr !== cityIdStr) {
            await this.updateCabLocation(cab.cabId, item.cityId);
          }
        }

        results.updated.push({
          cabId: item.cabId,
          previousState,
          newState: item.cabState,
          previousCityId,
          newCityId: item.cityId
        });
      } catch (error) {
        results.errors.push({
          cabId: item.cabId,
          error: error.message
        });
      }
    }

    return results;
  }
}

export default new CabService();
