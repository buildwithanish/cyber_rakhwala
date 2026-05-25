import mongoose from 'mongoose';

const caseNoteSchema = new mongoose.Schema(
  {
    content: { type: String, required: true, trim: true },
    authorName: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const caseTimelineSchema = new mongoose.Schema(
  {
    event: { type: String, required: true, trim: true },
    type: { type: String, default: 'action' },
    time: { type: Date, default: Date.now },
    notes: { type: String, default: '' },
    attachments: [{ type: mongoose.Schema.Types.Mixed }],
    isMilestone: { type: Boolean, default: false },
    user: { type: String, default: 'System' }
  },
  { _id: true }
);

const caseTeamMemberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true, trim: true },
    email: { type: String, default: '', trim: true },
    role: { type: String, default: 'viewer' },
    avatar: { type: String, default: '' },
    online: { type: Boolean, default: false }
  },
  { _id: true }
);

const caseSchema = new mongoose.Schema(
  {
    caseNumber: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed', 'pending', 'archived'],
      default: 'active',
      index: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    dataPoints: { type: Number, default: 0 },
    correlations: { type: Number, default: 0 },
    creditsSpent: { type: Number, default: 0 },
    tags: [{ type: String, trim: true }],
    checklist: [{ type: mongoose.Schema.Types.Mixed }],
    team: [caseTeamMemberSchema],
    evidence: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Evidence' }],
    notes: [caseNoteSchema],
    timeline: [caseTimelineSchema],
    graphNodes: [{ type: mongoose.Schema.Types.Mixed }],
    graphEdges: [{ type: mongoose.Schema.Types.Mixed }],
    toolResults: [{ type: mongoose.Schema.Types.Mixed }],
    watchlistItems: [{ type: mongoose.Schema.Types.Mixed }],
    watchlistAlerts: [{ type: mongoose.Schema.Types.Mixed }]
  },
  {
    timestamps: true
  }
);

caseSchema.index({ title: 'text', description: 'text', caseNumber: 'text' });

export const Case = mongoose.model('Case', caseSchema);
