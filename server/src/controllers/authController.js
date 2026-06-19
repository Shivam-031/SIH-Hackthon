import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { sendOTPEmail } from '../services/emailService.js';
import logger from '../utils/logger.js';

// ── Token helpers ─────────────────────────────────────────────────────────────

const signAccessToken = (user) =>
  jwt.sign({ userId: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const signRefreshToken = (user) =>
  jwt.sign({ userId: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });

/** Generate a random 6-digit OTP string */
const generateOTP = () => String(Math.floor(100000 + Math.random() * 900000));

// ── POST /api/auth/send-otp ───────────────────────────────────────────────────
// Step 1: called before register. Sends a verification code to the email.
export const sendOTP = async (req, res) => {
  try {
    const { email, name = 'there' } = req.body;
    if (!email) return sendError(res, 400, 'Email is required');

    // Prevent sending OTP if email is already fully registered
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) return sendError(res, 409, 'Email is already registered');

    // Rate-limit: max 3 OTPs per email per 10 minutes
    const recentCount = await OTP.countDocuments({
      email: email.toLowerCase(),
      expiresAt: { $gt: new Date() },
    });
    if (recentCount >= 3) {
      return sendError(res, 429, 'Too many OTP requests. Please wait a few minutes.');
    }

    // Delete old OTPs for this email
    await OTP.deleteMany({ email: email.toLowerCase() });

    const otp = generateOTP();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);

    await OTP.create({
      email: email.toLowerCase(),
      otpHash,
      purpose: 'email_verification',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    await sendOTPEmail(email, otp, name);

    sendSuccess(res, 200, 'Verification code sent to your email');
  } catch (error) {
    logger.error('sendOTP error:', error);
    // If email sending fails, don't expose internals
    sendError(res, 500, 'Failed to send verification email. Check your email address.');
  }
};

// ── POST /api/auth/verify-otp ─────────────────────────────────────────────────
// Step 2: verify the OTP before completing registration.
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return sendError(res, 400, 'Email and OTP are required');

    const record = await OTP.findOne({
      email: email.toLowerCase(),
      purpose: 'email_verification',
      expiresAt: { $gt: new Date() },
    });

    if (!record) return sendError(res, 400, 'OTP expired or not found. Request a new one.');

    // Track brute-force attempts
    if (record.attempts >= 5) {
      await record.deleteOne();
      return sendError(res, 429, 'Too many failed attempts. Request a new OTP.');
    }

    const valid = await record.compareOTP(otp);
    if (!valid) {
      record.attempts += 1;
      await record.save();
      return sendError(res, 400, `Incorrect code. ${5 - record.attempts} attempt(s) remaining.`);
    }

    // Mark as verified by deleting (used) — registration will proceed next
    await record.deleteOne();

    sendSuccess(res, 200, 'Email verified successfully');
  } catch (error) {
    logger.error('verifyOTP error:', error);
    sendError(res, 500, 'OTP verification failed');
  }
};

// ── POST /api/auth/register ───────────────────────────────────────────────────
// Step 3: actual account creation. OTP must have been verified first.
export const register = async (req, res) => {
  try {
    const { name, email, password, phone, role, officialCode } = req.body;

    // Check email isn't already taken
    const existing = await User.findOne({ email: email?.toLowerCase() });
    if (existing) return sendError(res, 409, 'Email already registered');

    // Validate official secret code
    if (role === 'official' || role === 'admin') {
      const validCode = process.env.OFFICIAL_SECRET_CODE;
      if (!officialCode) {
        return sendError(res, 403, 'Government official secret code is required');
      }
      if (officialCode !== validCode) {
        return sendError(res, 403, 'Invalid official secret code. Contact your administrator.');
      }
    }

    // Ensure OTP was verified — we check by absence of a pending OTP record
    // (verifyOTP deletes the record on success). If a record still exists, they skipped verification.
    // If no record exists AND user is new, that's the happy path after verifyOTP.
    // Extra guard: a fresh OTP record means they never verified.
    const pendingOTP = await OTP.findOne({ email: email.toLowerCase() });
    if (pendingOTP) {
      return sendError(res, 403, 'Please verify your email with the OTP before registering.');
    }

    const user = await User.create({ name, email: email.toLowerCase(), password, phone, role });

    const token = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    user.refreshToken = refreshToken;
    await user.save();

    sendSuccess(res, 201, 'Registration successful', { token, refreshToken, user });
  } catch (error) {
    logger.error('register error:', error);
    sendError(res, 500, 'Registration failed');
  }
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email?.toLowerCase() }).select('+password');
    if (!user)          return sendError(res, 401, 'Invalid credentials');
    if (!user.isActive) return sendError(res, 403, 'Account is deactivated');

    const valid = await user.comparePassword(password);
    if (!valid) return sendError(res, 401, 'Invalid credentials');

    user.lastLogin = new Date();
    const token = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    user.refreshToken = refreshToken;
    await user.save();

    sendSuccess(res, 200, 'Login successful', { token, refreshToken, user });
  } catch (error) {
    logger.error('login error:', error);
    sendError(res, 500, 'Login failed');
  }
};

// ── POST /api/auth/google ─────────────────────────────────────────────────────
// Google accounts bypass OTP — Google already verified the email.
export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return sendError(res, 400, 'Google credential is required');

    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
    );
    if (!response.ok) return sendError(res, 401, 'Invalid Google credential');

    const payload = await response.json();
    if (payload.error) return sendError(res, 401, payload.error_description || 'Google auth failed');

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (clientId && payload.aud !== clientId) {
      return sendError(res, 401, 'Google token audience mismatch');
    }

    const { email, name, picture } = payload;

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      const randomPassword =
        Math.random().toString(36).slice(-16) + Math.random().toString(36).slice(-16);
      user = await User.create({
        name,
        email: email.toLowerCase(),
        password: randomPassword,
        profileImage: picture ? { url: picture, publicId: '' } : undefined,
        role: 'citizen',
      });
    } else {
      if (picture && !user.profileImage?.publicId) {
        user.profileImage = { url: picture, publicId: '' };
      }
    }

    user.lastLogin = new Date();
    const token = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    user.refreshToken = refreshToken;
    await user.save();

    sendSuccess(res, 200, 'Google login successful', { token, refreshToken, user });
  } catch (error) {
    logger.error('googleLogin error:', error);
    sendError(res, 500, 'Google authentication failed');
  }
};

// ── POST /api/auth/refresh ────────────────────────────────────────────────────
export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return sendError(res, 401, 'Refresh token required');

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      return sendError(res, 401, 'Invalid refresh token');
    }

    const newToken = signAccessToken(user);
    sendSuccess(res, 200, 'Token refreshed', { token: newToken });
  } catch {
    sendError(res, 401, 'Invalid or expired refresh token');
  }
};

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
export const logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.userId, { refreshToken: '' });
    sendSuccess(res, 200, 'Logged out successfully');
  } catch (error) {
    logger.error('logout error:', error);
    sendError(res, 500, 'Logout failed');
  }
};

// ── GET /api/auth/profile ─────────────────────────────────────────────────────
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('reportedIssues', 'title status createdAt')
      .lean();
    if (!user) return sendError(res, 404, 'User not found');
    sendSuccess(res, 200, 'Profile fetched', { user });
  } catch (error) {
    logger.error('getProfile error:', error);
    sendError(res, 500, 'Failed to fetch profile');
  }
};

// ── PATCH /api/auth/profile ───────────────────────────────────────────────────
export const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const update = {};
    if (name)  update.name  = name;
    if (phone) update.phone = phone;

    if (req.uploadedImages?.length) {
      update.profileImage = req.uploadedImages[0];
    }

    const user = await User.findByIdAndUpdate(req.user.userId, update, { new: true });
    sendSuccess(res, 200, 'Profile updated', { user });
  } catch (error) {
    logger.error('updateProfile error:', error);
    sendError(res, 500, 'Update failed');
  }
};
