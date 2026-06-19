import jwt from 'jsonwebtoken';
import { sendError } from '../utils/apiResponse.js';

/**
 * Verifies the Bearer token from the Authorization header.
 * Attaches the decoded payload to req.user.
 */
export const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return sendError(res, 401, 'No token provided');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return sendError(res, 401, 'Invalid or expired token');
  }
};

/**
 * Restricts a route to specific roles.
 * @param  {...string} roles
 */
export const authorise = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return sendError(res, 403, 'Access denied: insufficient permissions');
  }
  next();
};
