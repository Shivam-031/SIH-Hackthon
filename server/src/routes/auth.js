import { Router } from 'express';
import {
  sendOTP, verifyOTP, register, login,
  googleLogin, refreshAccessToken,
  logout, getProfile, updateProfile,
} from '../controllers/authController.js';
import { authenticate } from '../middlewares/auth.js';
import { registerValidator, loginValidator } from '../validators/index.js';
import { uploadMiddleware, uploadToCloudinary } from '../middlewares/upload.js';

const router = Router();

router.post('/send-otp',   sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/register',   registerValidator, register);
router.post('/login',      loginValidator,    login);
router.post('/google',     googleLogin);
router.post('/refresh',    refreshAccessToken);
router.post('/logout',   authenticate, logout);

router.get(  '/profile', authenticate, getProfile);
router.patch('/profile', authenticate,
  uploadMiddleware.array('profileImage', 1),
  uploadToCloudinary,
  updateProfile
);

export default router;
