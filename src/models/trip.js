import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema({
  cabId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cab',
    required: true
  },
  cityId: {
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
tripSchema.index({ cityId: 1, bookedAt: 1 });

const Trip = mongoose.model('Trip', tripSchema);
export default Trip;
