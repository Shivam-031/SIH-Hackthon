import Issue from '../models/Issue.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

const logAction = (adminId, action, target, targetId, details, ip) =>
  AuditLog.create({ adminId, action, target, targetId, details, ip }).catch(() => {});

// GET /api/admin/dashboard
export const getDashboard = async (req, res) => {
  try {
    const [
      totalUsers, totalIssues,
      openIssues, closedIssues, rejectedIssues,
      pendingIssues, criticalIssues,
    ] = await Promise.all([
      User.countDocuments(),
      Issue.countDocuments(),
      Issue.countDocuments({ status: { $in: ['pending', 'under-review', 'verified', 'assigned', 'work-started'] } }),
      Issue.countDocuments({ status: 'closed' }),
      Issue.countDocuments({ status: 'rejected' }),
      Issue.countDocuments({ status: 'pending' }),
      Issue.countDocuments({ severity: 'critical', status: { $ne: 'closed' } }),
    ]);

    sendSuccess(res, 200, 'Dashboard data', {
      stats: { totalUsers, totalIssues, openIssues, closedIssues, rejectedIssues, pendingIssues, criticalIssues },
    });
  } catch (error) {
    logger.error('getDashboard error:', error);
    sendError(res, 500, 'Failed to fetch dashboard');
  }
};

// GET /api/admin/analytics
export const getAnalytics = async (req, res) => {
  try {
    const [byCategory, byStatus, bySeverity, byMonth] = await Promise.all([
      Issue.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
      Issue.aggregate([{ $group: { _id: '$status',   count: { $sum: 1 } } }]),
      Issue.aggregate([{ $group: { _id: '$severity', count: { $sum: 1 } } }]),
      Issue.aggregate([
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 },
      ]),
    ]);

    sendSuccess(res, 200, 'Analytics data', { byCategory, byStatus, bySeverity, byMonth });
  } catch (error) {
    logger.error('getAnalytics error:', error);
    sendError(res, 500, 'Failed to fetch analytics');
  }
};

// GET /api/admin/users
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const filter = {};
    if (role)   filter.role  = role;
    if (search) filter.name  = { $regex: search, $options: 'i' };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(filter).skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }),
      User.countDocuments(filter),
    ]);

    sendSuccess(res, 200, 'Users fetched', {
      users,
      pagination: { page: +page, limit: +limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logger.error('getAllUsers error:', error);
    sendError(res, 500, 'Failed to fetch users');
  }
};

// PATCH /api/admin/users/:id/toggle-active
export const toggleUserActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 404, 'User not found');

    user.isActive = !user.isActive;
    await user.save();

    await logAction(req.user.userId, 'TOGGLE_USER_ACTIVE', 'User', user._id, { isActive: user.isActive }, req.ip);

    sendSuccess(res, 200, `User ${user.isActive ? 'activated' : 'deactivated'}`, { user });
  } catch (error) {
    logger.error('toggleUserActive error:', error);
    sendError(res, 500, 'Action failed');
  }
};

// GET /api/admin/issues
export const getAdminIssues = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, category, severity } = req.query;
    const filter = {};
    if (status)   filter.status   = status;
    if (category) filter.category = category;
    if (severity) filter.severity = severity;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [issues, total] = await Promise.all([
      Issue.find(filter)
        .populate('reportedBy', 'name email')
        .populate('assignedTo', 'name email')
        .sort({ priorityScore: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Issue.countDocuments(filter),
    ]);

    sendSuccess(res, 200, 'Issues fetched', {
      issues,
      pagination: { page: +page, limit: +limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logger.error('getAdminIssues error:', error);
    sendError(res, 500, 'Failed to fetch issues');
  }
};

// DELETE /api/admin/issues/:id  — hard delete with audit log
export const adminDeleteIssue = async (req, res) => {
  try {
    const issue = await Issue.findByIdAndDelete(req.params.id);
    if (!issue) return sendError(res, 404, 'Issue not found');

    await logAction(req.user.userId, 'DELETE_ISSUE', 'Issue', issue._id, { title: issue.title }, req.ip);

    sendSuccess(res, 200, 'Issue deleted by admin');
  } catch (error) {
    logger.error('adminDeleteIssue error:', error);
    sendError(res, 500, 'Delete failed');
  }
};

// GET /api/admin/audit-logs
export const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find()
        .populate('adminId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      AuditLog.countDocuments(),
    ]);
    sendSuccess(res, 200, 'Audit logs', {
      logs,
      pagination: { page: +page, limit: +limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logger.error('getAuditLogs error:', error);
    sendError(res, 500, 'Failed to fetch audit logs');
  }
};
