import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title:   { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'issue_submitted', 'issue_verified', 'issue_approved',
        'issue_rejected', 'issue_assigned', 'issue_completed',
        'reward_earned', 'nearby_issue',
      ],
      required: true,
    },
    issueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', default: null },
    read:    { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
