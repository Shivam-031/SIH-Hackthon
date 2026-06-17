import mongoose from 'mongoose';
import { object } from 'zod';

const issueSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['pothole', 'streetlight', 'garbage', 'water-leak', 'road-damage', 'traffic-signal', 'drainage', 'other']
  },
  location: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    address: {
      type: String,
      required: true
    }
  },
  images: [{
    type: Object, // URLs to uploaded images
    default: []
  }],
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved', 'rejected'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  verificationCount: {
    type: Number,
    default: 0
  },
  estimatedResolution: {
    type: Date
  },
  actualResolution: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for geospatial queries
issueSchema.index({ "location.latitude": 1, "location.longitude": 1 });

// Virtual for issue age
issueSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

export default mongoose.model('Issue', issueSchema);