import express from 'express';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import cabService from '../services/cabService.js';

const router = express.Router();

/**
 * @swagger
 * /api/cabs:
 *   post:
 *     summary: Register a new cab
 *     tags: [Cabs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cabId
 *               - cityId
 *             properties:
 *               cabId:
 *                 type: string
 *               cityId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Cab registered successfully
 *       400:
 *         description: Validation error
 */
router.post(
  '/',
  [
    body('cabId').notEmpty().withMessage('Cab ID is required'),
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

      const { cabId, cityId } = req.body;
      const cab = await cabService.registerCab(cabId, cityId);
      res.status(201).json({ success: true, data: cab });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/cabs:
 *   get:
 *     summary: Get all cabs
 *     tags: [Cabs]
 *     responses:
 *       200:
 *         description: List of all cabs
 */
router.get('/', async (req, res, next) => {
  try {
    const cabs = await cabService.getAllCabs();
    res.json({ success: true, data: cabs });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/cabs/{cabId}:
 *   get:
 *     summary: Get cab by ID
 *     tags: [Cabs]
 *     parameters:
 *       - in: path
 *         name: cabId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cab details
 *       404:
 *         description: Cab not found
 */
router.get('/:cabId', async (req, res, next) => {
  try {
    const cab = await cabService.getCabById(req.params.cabId);
    if (!cab) {
      return res.status(404).json({ success: false, message: 'Cab not found' });
    }
    res.json({ success: true, data: cab });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/cabs/{cabId}/state:
 *   put:
 *     summary: Update cab state
 *     description: |
 *       Updates the state of a cab. 
 *       IMPORTANT: If a cab is ON_TRIP with an active trip, it CANNOT be manually 
 *       changed back to IDLE. This enforces the rule that trips cannot be cancelled.
 *       The trip must be completed first.
 *     tags: [Cabs]
 *     parameters:
 *       - in: path
 *         name: cabId
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
 *               - state
 *             properties:
 *               state:
 *                 type: string
 *                 enum: [IDLE, ON_TRIP]
 *               cityId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cab state updated
 *       400:
 *         description: Cannot change state - cab has active trip (trips cannot be cancelled)
 */
router.put(
  '/:cabId/state',
  [
    body('state').isIn(['IDLE', 'ON_TRIP']).withMessage('State must be IDLE or ON_TRIP'),
    body('cityId')
      .optional()
      .custom((value) => {
        if (value && !mongoose.Types.ObjectId.isValid(value)) {
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

      const { state, cityId } = req.body;
      const cab = await cabService.updateCabState(req.params.cabId, state, cityId);
      res.json({ success: true, data: cab });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/cabs/{cabId}/location:
 *   put:
 *     summary: Update cab location
 *     tags: [Cabs]
 *     parameters:
 *       - in: path
 *         name: cabId
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
 *               - cityId
 *             properties:
 *               cityId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cab location updated
 */
router.put(
  '/:cabId/location',
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

      const cab = await cabService.updateCabLocation(req.params.cabId, req.body.cityId);
      res.json({ success: true, data: cab });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/cabs/snapshot:
 *   post:
 *     summary: Bulk update cabs from snapshot
 *     tags: [Cabs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               snapshot:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - cabId
 *                     - cabState
 *                   properties:
 *                     cabId:
 *                       type: string
 *                     cabState:
 *                       type: string
 *                       enum: [IDLE, ON_TRIP]
 *                     cityId:
 *                       type: string
 *     responses:
 *       200:
 *         description: Snapshot processed
 */
router.post(
  '/snapshot',
  [
    body('snapshot').isArray().withMessage('Snapshot must be an array'),
    body('snapshot.*.cabId').notEmpty().withMessage('Cab ID is required'),
    body('snapshot.*.cabState').isIn(['IDLE', 'ON_TRIP']).withMessage('Invalid state'),
    body('snapshot.*.cityId')
      .optional()
      .custom((value) => {
        if (value && !mongoose.Types.ObjectId.isValid(value)) {
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

      const results = await cabService.bulkUpdateFromSnapshot(req.body.snapshot);
      res.json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
