import mongoose from 'mongoose';

const toolCatalogSchema = new mongoose.Schema(
  {
    toolId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true, index: true },
    description: { type: String, default: '' },
    inputType: { type: String, default: 'search-query' },
    creditCost: {
      student: { type: Number, default: 0 },
      user: { type: Number, default: 0 }
    },
    outputDepth: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    correlationLayers: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    simulatedDelay: { type: Number, default: 0 },
    tags: [{ type: String, trim: true }],
    isEnabled: { type: Boolean, default: true }
  },
  {
    timestamps: true
  }
);

export const ToolCatalog = mongoose.model('ToolCatalog', toolCatalogSchema);
