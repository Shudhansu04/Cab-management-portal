# Cab Management Portal API

An inter-city cab management portal API built with Node.js, Express, and MongoDB using ES modules. This is a backend-only REST API for managing cabs, cities, trips, and providing insights.

##  API Documentation
-Live Link: [click Here](https://cab-management-portal-qedf.onrender.com/api-docs)
- Swagger Docs URL: [Click Here](https://cab-management-portal-qedf.onrender.com/api-docs)
- Postman Documentation available :- [Click Here](https://shudhansupamdey.postman.co/workspace/74aabce3-b77d-44e6-8adf-c1b77ad6474d/collection/46490544-6c4f85df-8458-4fe0-801e-b53f6530945e?action=share&source=collection_link&creator=46490544)


## Features

### Core Features
-  Register cabs
-  Onboard cities
-  Change cab location (city)
-  Change cab state (IDLE, ON_TRIP)
-  Book cabs with intelligent assignment:
  - Finds cab with longest idle time
  - Randomly assigns in case of tie
-  Bulk update cabs from snapshot
-  Cab idle time analysis for given duration
-  Cab history tracking (all state changes)
-  City demand analysis (high demand cities and peak hours)

## Tech Stack

- **Backend**: Node.js , Express.js, MongoDB, Mongoose
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest

## Project Structure

```
cab-management-portal/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── swagger.js
│   ├── models/
│   │   ├── cab.js
│   │   ├── city.js
│   │   ├── trip.js
│   │   └── cabHistory.js
│   ├── routes/
│   │   ├── cabs.js
│   │   ├── cities.js
│   │   ├── trips.js
│   │   └── insights.js
|   ├── scripts/
|   |   └──fixIndexes.js    
│   ├── services/
│   │   ├── cabService.js
│   │   ├── tripService.js
│   │   └── insightService.js
│   ├── tests/
│   │   ├── cabService.test.js
│   │   ├── tripService.test.js
│   │   └── setup.js
│   └── server.js
├── package.json
└── README.md
```

## Installation

### Prerequisites
- Node.js (v14 or higher with ES modules support)
- MongoDB (running locally or connection string)
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cab-management-portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   PORT=5000
   MONGODB_URI="use your mongodb_uri"
   NODE_ENV=development
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## API Documentation

Once the server is running, access Swagger documentation at:
```
https://cab-management-portal-qedf.onrender.com/api-docs
```

The Swagger UI provides interactive API documentation where you can test all endpoints directly.

## API Endpoints

### Cabs
- `POST /api/cabs` - Register a new cab
- `GET /api/cabs` - Get all cabs
- `GET /api/cabs/:cabId` - Get cab by ID
- `PUT /api/cabs/:cabId/state` - Update cab state
- `PUT /api/cabs/:cabId/location` - Update cab location
- `POST /api/cabs/snapshot` - Bulk update from snapshot

### Cities
- `POST /api/cities` - Onboard a new city
- `GET /api/cities` - Get all cities
- `GET /api/cities/:id` - Get city by ID

### Trips
- `POST /api/trips` - Book a cab
- `GET /api/trips` - Get all trips (with filters)
- `GET /api/trips/:id` - Get trip by ID
- `PUT /api/trips/:id/complete` - Complete a trip

### Insights
- `GET /api/insights/cabs/:cabId/idle-time` - Get cab idle time
- `GET /api/insights/cabs/:cabId/history` - Get cab history
- `GET /api/insights/city-demand` - Get city demand analysis
- `GET /api/insights/cabs/snapshot` - Get all cabs snapshot

## Cab State Machine

Cabs have two states:
- **IDLE**: Cab is available for booking, must have a city location
- **ON_TRIP**: Cab is currently on a trip, city location is indeterminate

## Booking Strategy

When booking a cab:
1. System finds all IDLE cabs in the requested city
2. Selects the cab with the longest idle time
3. If multiple cabs have the same idle time, randomly selects one
4. Cab cannot reject/cancel a trip once assigned

## Testing

**Note**: Make sure MongoDB is running before running tests. Tests use a separate test database: `mongodb-memory-server`

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

**Troubleshooting Tests:**
- If tests timeout, ensure MongoDB is running 
- Tests use database: `mongodb-memory-server` (separate from main database)
- Test timeout is set to 30 seconds

## Usage Examples

### 1. Onboard a City
```bash
curl -X POST http://localhost:5000/api/cities \
  -H "Content-Type: application/json" \
  -d '{"name": "Mumbai", "code": "MUM"}'
```

### 2. Register a Cab
```bash
curl -X POST http://localhost:5000/api/cabs \
  -H "Content-Type: application/json" \
  -d '{"cabId": "CAB001", "cityId": "<city_id>"}'
```

### 3. Book a Cab
```bash
curl -X POST http://localhost:5000/api/trips \
  -H "Content-Type: application/json" \
  -d '{"cityId": "<city_id>"}'
```

### 4. Bulk Update from Snapshot
```bash
curl -X POST http://localhost:5000/api/cabs/snapshot \
  -H "Content-Type: application/json" \
  -d '{
    "snapshot": [
      {"cabId": "CAB001", "cabState": "IDLE", "cityId": "<city_id>"},
      {"cabId": "CAB002", "cabState": "ON_TRIP"}
    ]
  }'
```

### 5. Get Cab Idle Time
```bash
curl "http://localhost:5000/api/insights/cabs/CAB001/idle-time?startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z"
```

### 6. Get City Demand Analysis
```bash
curl "http://localhost:5000/api/insights/city-demand?startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z"
```

## Design Decisions

1. **ES Modules**: All code uses ES6 import/export syntax for modern JavaScript
2. **State Machine**: Simple two-state machine (IDLE, ON_TRIP) with clear transitions
3. **Idle Time Tracking**: Tracks both current idle time and cumulative idle time
4. **History Tracking**: All state and location changes are recorded in CabHistory
5. **Booking Algorithm**: Prioritizes longest idle cabs for fair distribution
6. **Extensibility**: Service layer pattern allows easy extension of business logic
7. **Testability**: Business logic separated into services for easy unit testing
8. **API**: Backend-only API with comprehensive Swagger documentation

## Code Quality

- Clean, functionally correct code
- Extensible architecture (service layer pattern)
- Unit testable (services isolated from routes)
- Properly designed (separation of concerns)
- ES Modules throughout
- Comprehensive API documentation

## Future Enhancements

- Add more cab states (MAINTENANCE, OUT_OF_SERVICE)
- Implement trip cancellation with penalties
- Add driver management
- Implement real-time location tracking
- Add payment integration
- Implement user authentication and authorization
- Add more advanced analytics and reporting

## License

ISC
