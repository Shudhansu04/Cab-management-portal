import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import Cab from '../models/cab.js';
import City from '../models/city.js';
import cabService from '../services/cabService.js';

let mongoServer;

describe('CabService', () => {
  let testCity;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  }, 30000);

  beforeEach(async () => {
    // Cleaning the database for isolation
    await mongoose.connection.db.dropDatabase();

    // Create city for testing
    testCity = await City.create({
      name: 'Test City',
      code: 'TC',
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  }, 30000);

  describe('registerCab', () => {
    it('should register a new cab', async () => {
      const cab = await cabService.registerCab('CAB001', testCity._id);

      expect(cab.cabId).toBe('CAB001');
      expect(cab.state).toBe('IDLE');
      expect(cab.cityId.toString()).toBe(testCity._id.toString());
    });

    it('should throw error if city does not exist', async () => {
      const fakeCityId = new mongoose.Types.ObjectId();

      await expect(
        cabService.registerCab('CAB001', fakeCityId)
      ).rejects.toThrow('City not found');
    });

    it('should throw error if cab already exists', async () => {
      await cabService.registerCab('CAB001', testCity._id);

      await expect(
        cabService.registerCab('CAB001', testCity._id)
      ).rejects.toThrow('Cab with this ID already exists');
    });
  });

  describe('updateCabState', () => {
    it('should update cab state to ON_TRIP', async () => {
      await cabService.registerCab('CAB001', testCity._id);

      const updatedCab = await cabService.updateCabState('CAB001', 'ON_TRIP');

      expect(updatedCab.state).toBe('ON_TRIP');
      expect(updatedCab.cityId).toBeNull();
    });

    it('should update cab state to IDLE with city', async () => {
      await cabService.registerCab('CAB001', testCity._id);
      await cabService.updateCabState('CAB001', 'ON_TRIP');

      const updatedCab = await cabService.updateCabState(
        'CAB001',
        'IDLE',
        testCity._id
      );

      expect(updatedCab.state).toBe('IDLE');
      expect(updatedCab.cityId.toString()).toBe(testCity._id.toString());
    });

    it('should throw error if cab does not exist', async () => {
      await expect(
        cabService.updateCabState('INVALID', 'ON_TRIP')
      ).rejects.toThrow('Cab not found');
    });
  });

  describe('getBestAvailableCab', () => {
    it('should return null if no cabs available', async () => {
      const result = await cabService.getBestAvailableCab(testCity._id);
      expect(result).toBeNull();
    });

    it('should return cab with longest idle time', async () => {
      const cab1 = await cabService.registerCab('CAB001', testCity._id);
      const cab2 = await cabService.registerCab('CAB002', testCity._id);

      // Make CAB001 idle longer (deterministic)
      await Cab.findOneAndUpdate(
        { cabId: 'CAB001' },
        { lastIdleAt: new Date(Date.now() - 10_000) }
      );

      const bestCab = await cabService.getBestAvailableCab(testCity._id);

      expect(bestCab.cabId).toBe('CAB001');
    });
  });
});
