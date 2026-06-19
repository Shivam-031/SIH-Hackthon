import mongoose from 'mongoose';

const CATEGORIES = [
  'road-damage', 'garbage', 'water-leakage', 'electricity',
  'street-light', 'illegal-parking', 'pothole', 'tree-fallen',
  'pollution', 'animal-issue', 'public-safety', 'other',
];

const STATUS_FLOW = [
  'pending', 'under-review', 'verified',
  'assigned', 'work-started', 'completed', 'closed', 'rejected',
];

const issueSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: CATEGORIES,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: STATUS_FLOW,
      default: 'pending',
      index: true,
    },

    // Images stored in Cloudinary
    images: [
      {
        url:      { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],

    // GeoJSON for geospatial queries
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      address: { type: String, default: '' },
    },

    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedDepartment: { type: String, default: '' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // Community
    upvotes:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    downvotes:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    verifiedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Auto-calculated
    priorityScore: { type: Number, default: 0, index: true },

    adminRemarks: { type: String, default: '' },

    // Status history / timeline
    statusHistory: [
      {
        status:    { type: String, enum: STATUS_FLOW },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        remark:    { type: String, default: '' },
        changedAt: { type: Date, default: Date.now },
      },
    ],

    estimatedResolution: { type: Date },
    actualResolution:    { type: Date },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Geospatial index
issueSchema.index({ location: '2dsphere' });
// Compound index for filtered listing
issueSchema.index({ status: 1, priorityScore: -1 });

// Virtual age
issueSchema.virtual('ageInDays').get(function () {
  return Math.floor((Date.now() - this.createdAt) / 86_400_000);
});

export default mongoose.model('Issue', issueSchema);
