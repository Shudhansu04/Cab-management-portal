import express from 'express';
import { body, validationResult } from 'express-validator';
import City from '../models/city.js';

const router = express.Router();

/**
 * @swagger
 * /api/cities:
 *   post:
 *     summary: Onboard a new city
 *     tags: [Cities]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *     responses:
 *       201:
 *         description: City onboarded successfully
 */
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('City name is required'),
    body('code').notEmpty().withMessage('City code is required')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { name, code } = req.body;
      const city = new City({ name, code: code.toUpperCase() });
      await city.save();
      res.status(201).json({ success: true, data: city });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'City with this name or code already exists'
        });
      }
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/cities:
 *   get:
 *     summary: Get all cities
 *     tags: [Cities]
 *     responses:
 *       200:
 *         description: List of all cities
 */
router.get('/', async (req, res, next) => {
  try {
    const cities = await City.find().sort({ name: 1 });
    res.json({ success: true, data: cities });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/cities/{id}:
 *   get:
 *     summary: Get city by ID
 *     tags: [Cities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: City details
 */
router.get('/:id', async (req, res, next) => {
  try {
    const city = await City.findById(req.params.id);
    if (!city) {
      return res.status(404).json({ success: false, message: 'City not found' });
    }
    res.json({ success: true, data: city });
  } catch (error) {
    next(error);
  }
});

export default router;
