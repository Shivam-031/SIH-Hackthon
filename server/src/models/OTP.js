import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, index: true },
  otpHash: { type: String, required: true },
  purpose: {
    type: String,
    enum: ['email_verification', 'password_reset'],
    default: 'email_verification',
  },
  attempts: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
});

// Auto-delete expired documents
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

otpSchema.methods.compareOTP = async function (candidate) {
  return bcrypt.compare(String(candidate), this.otpHash);
};

export default mongoose.model('OTP', otpSchema);
