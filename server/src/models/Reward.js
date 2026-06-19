import mongoose from 'mongoose';

const rewardSchema = new mongoose.Schema(
  {
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true, index: true },
    issueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', default: null },
    points:  { type: Number, required: true },
    reason:  { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model('Reward', rewardSchema);
