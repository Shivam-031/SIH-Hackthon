import mongoose from 'mongoose';

const verificationSchema = new mongoose.Schema(
  {
    issueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true },
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
    comment: { type: String, default: '' },
    verified:{ type: Boolean, default: true },
  },
  { timestamps: true }
);

// Each user can verify an issue only once
verificationSchema.index({ issueId: 1, userId: 1 }, { unique: true });

export default mongoose.model('Verification', verificationSchema);
