import mongoose from 'mongoose';

//Once a trip is assigned, it cannot be cancelled or rejected
const tripSchema = new mongoose.Schema({
  cabId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cab',
    required: true
  },
  sourceCityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: true
  },
  destinationCityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: true
  },
  startTime: {
    type: Date,
    default: Date.now,
    required: true
  },
  endTime: {
    type: Date
  },
  status: {
    type: String,
    // No CANCELLED or REJECTED status
    enum: ['ACTIVE', 'COMPLETED'], 
    default: 'ACTIVE'
  },
  bookedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

tripSchema.index({ cabId: 1, status: 1 });
tripSchema.index({ sourceCityId: 1, bookedAt: 1 });
tripSchema.index({ destinationCityId: 1, bookedAt: 1 });

const Trip = mongoose.model('Trip', tripSchema);
export default Trip;
