import express from 'express';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import tripService from '../services/tripService.js';

const router = express.Router();

/**
 * @swagger
 * /api/trips:
 *   post:
 *     summary: Book a cab for a trip
 *     tags: [Trips]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cityId
 *             properties:
 *               cityId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Cab booked successfully
 *       400:
 *         description: No cabs available
 */
router.post(
  '/',
  [
    body('cityId')
      .notEmpty().withMessage('City ID is required')
      .custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('City ID must be a valid MongoDB ObjectId');
        }
        return true;
      })
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const result = await tripService.bookCab(req.body.cityId);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/trips:
 *   get:
 *     summary: Get all trips
 *     tags: [Trips]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, COMPLETED]
 *       - in: query
 *         name: cityId
 *         schema:
 *           type: string
 *       - in: query
 *         name: cabId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of trips
 */
router.get('/', async (req, res, next) => {
  try {
    const trips = await tripService.getAllTrips(req.query);
    res.json({ success: true, data: trips });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/trips/{id}:
 *   get:
 *     summary: Get trip by ID
 *     tags: [Trips]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trip details
 */
router.get('/:id', async (req, res, next) => {
  try {
    const trip = await tripService.getTripById(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    res.json({ success: true, data: trip });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/trips/{id}/complete:
 *   put:
 *     summary: Complete a trip
 *     tags: [Trips]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - endCityId
 *             properties:
 *               endCityId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Trip completed
 */
router.put(
  '/:id/complete',
  [
    body('endCityId')
      .notEmpty().withMessage('End city ID is required')
      .custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('End city ID must be a valid MongoDB ObjectId');
        }
        return true;
      })
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const trip = await tripService.completeTrip(req.params.id, req.body.endCityId);
      res.json({ success: true, data: trip });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
