import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import Trip from '../models/trip.js';
import Cab from '../models/cab.js';
import City from '../models/city.js';
import tripService from '../services/tripService.js';

let mongoServer;

describe('TripService', () => {
  let testCity;
  let testCab;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }, 30000);

  beforeEach(async () => {
    await Trip.deleteMany({});
    await Cab.deleteMany({});
    await City.deleteMany({});

    testCity = new City({ name: 'Test City', code: 'TC' });
    await testCity.save();

    testCab = new Cab({
      cabId: 'CAB001',
      cityId: testCity._id,
      state: 'IDLE',
      lastIdleAt: new Date(), 
    });
    await testCab.save();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  }, 30000);

  describe('bookCab', () => {
    it('should book a cab and create a trip', async () => {
      const result = await tripService.bookCab(testCity._id);

      expect(result.trip).toBeDefined();
      expect(result.trip.status).toBe('ACTIVE');
      expect(result.cab.state).toBe('ON_TRIP');
    });

    it('should throw error if no cabs available', async () => {
      const newCity = new City({ name: 'Empty City', code: 'EC' });
      await newCity.save();

      await expect(
        tripService.bookCab(newCity._id)
      ).rejects.toThrow('No cabs available');
    });
  });

  describe('completeTrip', () => {
    it('should complete a trip and update cab state', async () => {
      const result = await tripService.bookCab(testCity._id);

      const trip = await tripService.completeTrip(
        result.trip._id,
        testCity._id
      );

      expect(trip.status).toBe('COMPLETED');
      expect(trip.endTime).toBeDefined();

      const cab = await Cab.findById(result.cab._id);
      expect(cab.state).toBe('IDLE');
    });
  });
});
