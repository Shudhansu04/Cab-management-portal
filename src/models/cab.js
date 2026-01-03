import mongoose from 'mongoose';

export const CabState = {
  IDLE: 'IDLE',
  ON_TRIP: 'ON_TRIP'
};

const cabSchema = new mongoose.Schema({
  cabId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  state: {
    type: String,
    enum: Object.values(CabState),
    default: CabState.IDLE,
    required: true
  },
  cityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: function() {
      return this.state === CabState.IDLE;
    }
  },
  lastIdleTime: {
    type: Date,
    default: Date.now
  },
  totalIdleTime: {
    type: Number,
    default: 0  
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

//  adding Index for efficient queries
cabSchema.index({ cityId: 1, state: 1 });
cabSchema.index({ state: 1, lastIdleTime: 1 });

// function for calculating idle duration
cabSchema.methods.getIdleDuration = function() {
  if (this.state === CabState.IDLE) {
    return Date.now() - this.lastIdleTime.getTime();
  }
  return 0;
};

// Function to get available cabs in a city
cabSchema.statics.getAvailableCabs = function(cityId) {
  return this.find({
    cityId: cityId,
    state: CabState.IDLE
    // Sort by oldest idle time first
  }).sort({ lastIdleTime: 1 }); 
};

const Cab = mongoose.model('Cab', cabSchema);
export default Cab;
