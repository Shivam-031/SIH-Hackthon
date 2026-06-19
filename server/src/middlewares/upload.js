import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import { sendError } from '../utils/apiResponse.js';

// Store files in memory before uploading to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
  }
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

/**
 * Uploads req.files to Cloudinary and attaches the result array to req.uploadedImages.
 * Each entry: { url, publicId }
 */
export const uploadToCloudinary = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    req.uploadedImages = [];
    return next();
  }

  try {
    const uploads = req.files.map((file) =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'civicconnect/issues', resource_type: 'image' },
          (error, result) => {
            if (error) return reject(error);
            resolve({ url: result.secure_url, publicId: result.public_id });
          }
        );
        stream.end(file.buffer);
      })
    );

    req.uploadedImages = await Promise.all(uploads);
    next();
  } catch (error) {
    return sendError(res, 500, 'Image upload failed: ' + error.message);
  }
};
