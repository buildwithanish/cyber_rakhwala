import mongoose from 'mongoose';

const threatEventSchema = new mongoose.Schema(
  {
    sourceCity: {
      id: { type: String, default: '' },
      name: { type: String, default: '' },
      country: { type: String, default: '' },
      coords: [{ type: Number }]
    },
    targetCity: {
      id: { type: String, default: '' },
      name: { type: String, default: '' },
      country: { type: String, default: '' },
      coords: [{ type: Number }]
    },
    attackType: { type: String, required: true, index: true },
    severity: { type: Number, default: 1, min: 1, max: 10 },
    packets: { type: Number, default: 0 },
    protocol: { type: String, default: '' },
    detectedAt: { type: Date, default: Date.now, index: true },
    region: { type: String, default: '' },
    source: { type: String, default: 'internal' }
  },
  {
    timestamps: true
  }
);

export const ThreatEvent = mongoose.model('ThreatEvent', threatEventSchema);
