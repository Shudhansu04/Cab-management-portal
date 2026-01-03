import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import dotenv from 'dotenv';
import cabsRouter from './routes/cabs.js';
import citiesRouter from './routes/cities.js';
import tripsRouter from './routes/trips.js';
import insightsRouter from './routes/insights.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/cabs', cabsRouter);
app.use('/api/cities', citiesRouter);
app.use('/api/trips', tripsRouter);
app.use('/api/insights', insightsRouter);

// Checking Health of the server.
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Cab Management Portal API is running' });
});

// Middleware to handle errors.
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// handle 404 errors
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// connecting database
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI ;

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
  });
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});

export default app;
