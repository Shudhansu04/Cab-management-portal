import express from 'express';
import { query, validationResult } from 'express-validator';
import insightService from '../services/insightService.js';

const router = express.Router();

/**
 * @swagger
 * /api/insights/cabs/{cabId}/idle-time:
 *   get:
 *     summary: Get idle time for a cab in a given duration
 *     tags: [Insights]
 *     parameters:
 *       - in: path
 *         name: cabId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Idle time calculated
 */
router.get(
  '/cabs/:cabId/idle-time',
  [
    query('startDate').notEmpty().withMessage('Start date is required'),
    query('endDate').notEmpty().withMessage('End date is required')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { cabId } = req.params;
      const startDate = new Date(req.query.startDate);
      const endDate = new Date(req.query.endDate);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format'
        });
      }

      const result = await insightService.getCabIdleTime(cabId, startDate, endDate);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/insights/cabs/{cabId}/history:
 *   get:
 *     summary: Get cab history
 *     tags: [Insights]
 *     parameters:
 *       - in: path
 *         name: cabId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Cab history
 */
router.get('/cabs/:cabId/history', async (req, res, next) => {
  try {
    const { cabId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const history = await insightService.getCabHistory(cabId, limit);
    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/insights/city-demand:
 *   get:
 *     summary: Get city demand analysis
 *     tags: [Insights]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: City demand analysis
 */
router.get(
  '/city-demand',
  [
    query('startDate').notEmpty().withMessage('Start date is required'),
    query('endDate').notEmpty().withMessage('End date is required')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const startDate = new Date(req.query.startDate);
      const endDate = new Date(req.query.endDate);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format'
        });
      }

      const result = await insightService.getCityDemandAnalysis(startDate, endDate);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/insights/cabs/snapshot:
 *   get:
 *     summary: Get snapshot of all cabs
 *     tags: [Insights]
 *     responses:
 *       200:
 *         description: Snapshot of all cabs
 */
router.get('/cabs/snapshot', async (req, res, next) => {
  try {
    const snapshot = await insightService.getAllCabsSnapshot();
    res.json({ success: true, data: snapshot });
  } catch (error) {
    next(error);
  }
});

export default router;
