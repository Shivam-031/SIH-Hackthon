import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    phone: {
      type: String,
      trim: true,
    },
    profileImage: {
      url:      { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    role: {
      type: String,
      enum: ['citizen', 'official', 'admin'],
      default: 'citizen',
    },
    // Gamification
    points: { type: Number, default: 0 },
    level:  { type: String, default: 'Bronze' },
    badges: [{ type: String }],
    // Relations
    verifiedIssues: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Issue' }],
    reportedIssues: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Issue' }],
    notifications:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Notification' }],
    // Location — stored as GeoJSON for 2dsphere queries
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },
    // FCM push-notification token
    fcmToken: { type: String, default: '' },
    // Refresh token (hashed)
    refreshToken: { type: String, select: false },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

// Geospatial index on user location
userSchema.index({ location: '2dsphere' });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare plaintext password with hash
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Strip sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  return obj;
};

// Auto-assign level based on points
userSchema.methods.updateLevel = function () {
  const p = this.points;
  if (p >= 1000) this.level = 'Citizen Hero';
  else if (p >= 500) this.level = 'Gold';
  else if (p >= 200) this.level = 'Silver';
  else this.level = 'Bronze';
};

export default mongoose.model('User', userSchema);
