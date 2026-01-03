import mongoose from 'mongoose';

const historySchema = new mongoose.Schema({
  cabId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cab',
    required: true
  },
  previousState: {
    type: String
  },
  newState: {
    type: String,
    required: true
  },
  previousCityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City'
  },
  newCityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City'
  },
  changedAt: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

historySchema.index({ cabId: 1, changedAt: -1 });

const CabHistory = mongoose.model('CabHistory', historySchema);
export default CabHistory;
