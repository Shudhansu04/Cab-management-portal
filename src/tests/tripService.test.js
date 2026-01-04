import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Trip from '../models/trip.js';
import Cab from '../models/cab.js';
import City from '../models/city.js';
import tripService from '../services/tripService.js';

let mongoServer;

describe('TripService', () => {
  let sourceCity;
  let destinationCity;
  let testCab;

  beforeAll(async () => {
    // Delete Trip model if it exists to clear any cached schema
    if (mongoose.models.Trip) {
      delete mongoose.models.Trip;
    }
    
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }, 30000);

  beforeEach(async () => {
    // Clean the database for isolation
    await mongoose.connection.db.dropDatabase();

    sourceCity = await City.create({ name: 'Mumbai', code: 'MUM' });
    destinationCity = await City.create({ name: 'Delhi', code: 'DEL' });

    testCab = await Cab.create({
      cabId: 'CAB001',
      cityId: sourceCity._id,
      state: 'IDLE',
      lastIdleTime: new Date(),
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  }, 30000);

  describe('bookCab', () => {
    it('should book a cab and create a trip from source to destination', async () => {
      const result = await tripService.bookCab(sourceCity._id, destinationCity._id);

      expect(result.trip).toBeDefined();
      expect(result.trip.status).toBe('ACTIVE');
      expect(result.trip.sourceCityId._id.toString()).toBe(sourceCity._id.toString());
      expect(result.trip.destinationCityId._id.toString()).toBe(destinationCity._id.toString());
      expect(result.cab.state).toBe('ON_TRIP');
    });

    it('should throw error if no cabs available in source city', async () => {
      const newCity = await City.create({ name: 'Empty City', code: 'EC' });

      await expect(
        tripService.bookCab(newCity._id, destinationCity._id)
      ).rejects.toThrow('No cabs available');
    });

    it('should immediately set cab to ON_TRIP after booking (cannot reject)', async () => {
      const result = await tripService.bookCab(sourceCity._id, destinationCity._id);
      
      // Verify cab is immediately set to ON_TRIP
      expect(result.cab.state).toBe('ON_TRIP');
      
      // Verify cab cannot be changed back to IDLE while trip is active
      const cab = await Cab.findById(result.cab._id);
      expect(cab.state).toBe('ON_TRIP');
      expect(cab.cityId).toBeNull(); // City is indeterminate during trip
    });
  });

  describe('completeTrip', () => {
    it('should complete a trip and update cab state to destination city', async () => {
      const result = await tripService.bookCab(sourceCity._id, destinationCity._id);

      const trip = await tripService.completeTrip(result.trip._id);

      expect(trip.status).toBe('COMPLETED');
      expect(trip.endTime).toBeDefined();

      const cab = await Cab.findById(result.cab._id);
      expect(cab.state).toBe('IDLE');
      expect(cab.cityId.toString()).toBe(destinationCity._id.toString());
    });
  });

  describe('Trip Cancellation Prevention', () => {
    it('should not allow trip cancellation - no cancel method exists', async () => {
      const result = await tripService.bookCab(sourceCity._id, destinationCity._id);
      
      // Verify there's no cancel method in tripService
      expect(tripService.cancelTrip).toBeUndefined();
      
      // Verify trip exists and is ACTIVE
      const trip = await Trip.findById(result.trip._id);
      expect(trip).toBeDefined();
      expect(trip.status).toBe('ACTIVE');
      
      // Verify cab remains ON_TRIP (cannot be changed back without completing trip)
      const cab = await Cab.findById(result.cab._id);
      expect(cab.state).toBe('ON_TRIP');
    });

    it('should require trip completion to free the cab', async () => {
      const result = await tripService.bookCab(sourceCity._id, destinationCity._id);
      
      // Cab is ON_TRIP
      let cab = await Cab.findById(result.cab._id);
      expect(cab.state).toBe('ON_TRIP');
      
      // Complete the trip
      await tripService.completeTrip(result.trip._id);
      
      // Now cab is IDLE in destination city
      cab = await Cab.findById(result.cab._id);
      expect(cab.state).toBe('IDLE');
      expect(cab.cityId.toString()).toBe(destinationCity._id.toString());
    });
  });
});
