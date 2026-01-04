import express from 'express';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import tripService from '../services/tripService.js';

const router = express.Router();

/**
 * @swagger
 * /api/trips:
 *   post:
 *     summary: Book a cab for a trip from source to destination
 *     description: |
 *       Books a cab for a trip. Once a cab is assigned, it CANNOT be cancelled or rejected.
 *       This is a core business rule - the cab must complete the trip.
 *     tags: [Trips]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sourceCityId
 *               - destinationCityId
 *             properties:
 *               sourceCityId:
 *                 type: string
 *               destinationCityId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Cab booked successfully. Trip cannot be cancelled once assigned.
 *       400:
 *         description: No cabs available
 */
router.post(
  '/',
  [
    body('sourceCityId')
      .notEmpty().withMessage('Source city ID is required')
      .custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Source city ID must be a valid MongoDB ObjectId');
        }
        return true;
      }),
    body('destinationCityId')
      .notEmpty().withMessage('Destination city ID is required')
      .custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Destination city ID must be a valid MongoDB ObjectId');
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

      const { sourceCityId, destinationCityId } = req.body;
      const result = await tripService.bookCab(sourceCityId, destinationCityId);
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
 *         name: sourceCityId
 *         schema:
 *           type: string
 *       - in: query
 *         name: destinationCityId
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
 *     description: |
 *       Completes an active trip.Trips cannot be cancelled or rejected once booked.
 *       The only way to end a trip is to complete it.
 *     tags: [Trips]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trip completed (cab will be set to destination city)
 *       404:
 *         description: Trip not found
 *       400:
 *         description: Trip already completed
 */
router.put(
  '/:id/complete',
  async (req, res, next) => {
    try {
      const trip = await tripService.completeTrip(req.params.id);
      res.json({ success: true, data: trip });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
