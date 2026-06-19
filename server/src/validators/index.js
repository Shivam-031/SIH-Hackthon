import { body, param, query, validationResult } from 'express-validator';
import { sendError } from '../utils/apiResponse.js';

/** Run express-validator and return 400 if any errors found */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 400, 'Validation failed', errors.array());
  }
  next();
};

// ── Auth validators ────────────────────────────────────────────────────────────

export const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['citizen', 'official', 'admin']).withMessage('Invalid role'),
  validate,
];

export const loginValidator = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

// ── Issue validators ───────────────────────────────────────────────────────────

const CATEGORIES = [
  'road-damage', 'garbage', 'water-leakage', 'electricity',
  'street-light', 'illegal-parking', 'pothole', 'tree-fallen',
  'pollution', 'animal-issue', 'public-safety', 'other',
];

export const createIssueValidator = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').isIn(CATEGORIES).withMessage('Invalid category'),
  body('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('address').optional().isString(),
  validate,
];

export const updateStatusValidator = [
  param('id').isMongoId().withMessage('Invalid issue ID'),
  body('status').isIn([
    'pending', 'under-review', 'verified',
    'assigned', 'work-started', 'completed', 'closed', 'rejected',
  ]).withMessage('Invalid status'),
  validate,
];

export const nearbyValidator = [
  query('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  query('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  query('radius').optional().isInt({ min: 100, max: 50000 }).withMessage('Radius must be 100–50000 m'),
  validate,
];
