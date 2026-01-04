import Trip from '../models/trip.js';
import Cab from '../models/cab.js';
import cabService from './cabService.js';
import { CabState } from '../models/cab.js';

class TripService {
  /**
   * Book a cab for a trip from source to destination
   * 
   * Once a cab is assigned a trip, it CANNOT be cancelled or rejected.
   * 
   * @param {string} sourceCityId - Source city ID
   * @param {string} destinationCityId - Destination city ID
   * @returns {Object} Trip and cab details
   * @throws {Error} If no cabs available in source city
   */
  async bookCab(sourceCityId, destinationCityId) {
    // Find best available cab in source city
    const cab = await cabService.getBestAvailableCab(sourceCityId);

    if (!cab) {
      throw new Error('No cabs available in the source city');
    }

    // Create trip with source and destination
    // Once created, this trip cannot be cancelled
    const trip = new Trip({
      cabId: cab._id,
      sourceCityId: sourceCityId,
      destinationCityId: destinationCityId,
      status: 'ACTIVE',
      startTime: new Date()
    });

    await trip.save();

    // Immediately update cab state to ON_TRIP
    // This makes the assignment irreversible - cab cannot reject the trip
    await cabService.updateCabState(cab.cabId, CabState.ON_TRIP);

    return {
      trip: await Trip.findById(trip._id)
        .populate('cabId')
        .populate('sourceCityId')
        .populate('destinationCityId'),
      cab: await cabService.getCabById(cab.cabId)
    };
  }

  /**
   * Complete a trip
   * 
   * Note: Trips can only be completed, never cancelled.
   * 
   * @param {string} tripId - Trip ID to complete
   * @returns {Object} Completed trip details
   * @throws {Error} If trip not found or already completed
   */
  async completeTrip(tripId) {
    const trip = await Trip.findById(tripId)
      .populate('destinationCityId');
    
    if (!trip) {
      throw new Error('Trip not found');
    }

    if (trip.status === 'COMPLETED') {
      throw new Error('Trip is already completed');
    }

    trip.status = 'COMPLETED';
    trip.endTime = new Date();
    await trip.save();

    // Update cab state to IDLE and set location to destination city
    const cab = await Cab.findById(trip.cabId);
    await cabService.updateCabState(cab.cabId, CabState.IDLE, trip.destinationCityId._id);

    return await Trip.findById(tripId)
      .populate('cabId')
      .populate('sourceCityId')
      .populate('destinationCityId');
  }

 
  // Get all trips with filters
  
  async getAllTrips(filters = {}) {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.sourceCityId) query.sourceCityId = filters.sourceCityId;
    if (filters.destinationCityId) query.destinationCityId = filters.destinationCityId;
    if (filters.cabId) {
      const cab = await Cab.findOne({ cabId: filters.cabId });
      if (cab) query.cabId = cab._id;
    }

    return await Trip.find(query)
      .populate('cabId')
      .populate('sourceCityId')
      .populate('destinationCityId')
      .sort({ bookedAt: -1 });
  }

 
   // Get trip by ID
  async getTripById(tripId) {
    return await Trip.findById(tripId)
      .populate('cabId')
      .populate('sourceCityId')
      .populate('destinationCityId');
  }
}

export default new TripService();
