import Issue from '../models/Issue.js';
import User from '../models/User.js';
import Verification from '../models/Verification.js';
import cloudinary from '../config/cloudinary.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { calcPriorityScore } from '../helpers/priorityScore.js';
import { createNotification } from '../services/notificationService.js';
import { creditPoints } from '../services/rewardService.js';
import logger from '../utils/logger.js';

// POST /api/issues
export const createIssue = async (req, res) => {
  try {
    const { title, description, category, severity, longitude, latitude, address } = req.body;

    const issue = await Issue.create({
      title,
      description,
      category,
      severity: severity || 'medium',
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
        address: address || '',
      },
      images: req.uploadedImages || [],
      reportedBy: req.user.userId,
      statusHistory: [{ status: 'pending', changedBy: req.user.userId }],
    });

    // Track issue in user's reportedIssues
    await User.findByIdAndUpdate(req.user.userId, {
      $push: { reportedIssues: issue._id },
    });

    // Credit points for reporting
    await creditPoints(req.user.userId, 'issue_reported', issue._id);

    // Notify reporter
    await createNotification(
      req.user.userId,
      'Issue Submitted',
      `Your issue "${issue.title}" has been submitted and is pending review.`,
      'issue_submitted',
      issue._id
    );

    await issue.populate('reportedBy', 'name email');
    sendSuccess(res, 201, 'Issue reported successfully', { issue });
  } catch (error) {
    logger.error('createIssue error:', error);
    sendError(res, 500, 'Failed to create issue');
  }
};

// GET /api/issues  — paginated, filterable
export const getIssues = async (req, res) => {
  try {
    const {
      page = 1, limit = 10,
      status, category, severity,
      search, sortBy = 'createdAt', order = 'desc',
    } = req.query;

    const filter = {};
    if (status)   filter.status   = status;
    if (category) filter.category = category;
    if (severity) filter.severity = severity;
    if (search)   filter.title    = { $regex: search, $options: 'i' };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortDir = order === 'asc' ? 1 : -1;

    const [issues, total] = await Promise.all([
      Issue.find(filter)
        .populate('reportedBy', 'name email')
        .sort({ [sortBy]: sortDir })
        .skip(skip)
        .limit(parseInt(limit)),
      Issue.countDocuments(filter),
    ]);

    sendSuccess(res, 200, 'Issues fetched', {
      issues,
      pagination: { page: +page, limit: +limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logger.error('getIssues error:', error);
    sendError(res, 500, 'Failed to fetch issues');
  }
};

// GET /api/issues/my-issues
export const getMyIssues = async (req, res) => {
  try {
    const issues = await Issue.find({ reportedBy: req.user.userId }).sort({ createdAt: -1 });
    sendSuccess(res, 200, 'Your issues fetched', { issues });
  } catch (error) {
    logger.error('getMyIssues error:', error);
    sendError(res, 500, 'Failed to fetch your issues');
  }
};

// GET /api/issues/nearby
export const getNearbyIssues = async (req, res) => {
  try {
    const { longitude, latitude, radius = 5000 } = req.query;

    const issues = await Issue.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
          $maxDistance: parseInt(radius),
        },
      },
      status: { $nin: ['closed', 'rejected'] },
    }).populate('reportedBy', 'name email');

    sendSuccess(res, 200, 'Nearby issues fetched', { issues });
  } catch (error) {
    logger.error('getNearbyIssues error:', error);
    sendError(res, 500, 'Failed to fetch nearby issues');
  }
};

// GET /api/issues/:id
export const getIssueById = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('verifiedBy', 'name email');

    if (!issue) return sendError(res, 404, 'Issue not found');
    sendSuccess(res, 200, 'Issue fetched', { issue });
  } catch (error) {
    logger.error('getIssueById error:', error);
    sendError(res, 500, 'Failed to fetch issue');
  }
};

// PATCH /api/issues/:id/status  — officials/admins only
export const updateIssueStatus = async (req, res) => {
  try {
    const { status, adminRemarks, assignedDepartment, assignedTo } = req.body;

    const issue = await Issue.findById(req.params.id);
    if (!issue) return sendError(res, 404, 'Issue not found');

    issue.status = status;
    if (adminRemarks)       issue.adminRemarks       = adminRemarks;
    if (assignedDepartment) issue.assignedDepartment = assignedDepartment;
    if (assignedTo)         issue.assignedTo         = assignedTo;
    if (status === 'completed') issue.actualResolution = new Date();

    issue.statusHistory.push({ status, changedBy: req.user.userId, remark: adminRemarks || '' });

    // Recalculate priority score
    issue.priorityScore = calcPriorityScore(issue);

    await issue.save();

    // Notify reporter
    await createNotification(
      issue.reportedBy,
      'Issue Status Updated',
      `Your issue "${issue.title}" status changed to "${status}".`,
      status === 'completed' ? 'issue_completed' : 'issue_assigned',
      issue._id
    );

    // Credit reward if completed
    if (status === 'completed') {
      await creditPoints(issue.reportedBy.toString(), 'issue_completed', issue._id);
    }

    sendSuccess(res, 200, 'Status updated', { issue });
  } catch (error) {
    logger.error('updateIssueStatus error:', error);
    sendError(res, 500, 'Failed to update status');
  }
};

// POST /api/issues/:id/upvote  — toggle upvote
export const upvoteIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return sendError(res, 404, 'Issue not found');

    const userId = req.user.userId;
    const alreadyUpvoted = issue.upvotes.some(id => id.toString() === userId);

    if (alreadyUpvoted) {
      issue.upvotes = issue.upvotes.filter(id => id.toString() !== userId);
    } else {
      issue.upvotes.push(userId);
      // Remove from downvotes if present
      issue.downvotes = issue.downvotes.filter(id => id.toString() !== userId);
    }

    issue.priorityScore = calcPriorityScore(issue);
    await issue.save();

    sendSuccess(res, 200, alreadyUpvoted ? 'Upvote removed' : 'Issue upvoted', {
      upvotes: issue.upvotes.length,
    });
  } catch (error) {
    logger.error('upvoteIssue error:', error);
    sendError(res, 500, 'Upvote failed');
  }
};

// POST /api/issues/:id/verify
export const verifyIssue = async (req, res) => {
  try {
    const { comment } = req.body;
    const userId = req.user.userId;

    const issue = await Issue.findById(req.params.id);
    if (!issue) return sendError(res, 404, 'Issue not found');

    // Prevent self-verification
    if (issue.reportedBy.toString() === userId) {
      return sendError(res, 400, 'You cannot verify your own issue');
    }

    // Prevent duplicate verification — unique index will also guard this
    const existing = await Verification.findOne({ issueId: issue._id, userId });
    if (existing) return sendError(res, 409, 'You already verified this issue');

    await Verification.create({ issueId: issue._id, userId, comment });

    issue.verifiedBy.push(userId);
    issue.priorityScore = calcPriorityScore(issue);
    await issue.save();

    // Track in user's verifiedIssues
    await User.findByIdAndUpdate(userId, { $push: { verifiedIssues: issue._id } });

    // Credit verifier
    await creditPoints(userId, 'community_verify', issue._id);

    sendSuccess(res, 200, 'Issue verified', { verificationCount: issue.verifiedBy.length });
  } catch (error) {
    if (error.code === 11000) return sendError(res, 409, 'Already verified');
    logger.error('verifyIssue error:', error);
    sendError(res, 500, 'Verification failed');
  }
};

// DELETE /api/issues/:id  — reporter or admin
export const deleteIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return sendError(res, 404, 'Issue not found');

    const isOwner = issue.reportedBy.toString() === req.user.userId;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) return sendError(res, 403, 'Not authorised to delete this issue');

    // Delete Cloudinary images
    for (const img of issue.images) {
      if (img.publicId) await cloudinary.uploader.destroy(img.publicId).catch(() => {});
    }

    await issue.deleteOne();
    sendSuccess(res, 200, 'Issue deleted');
  } catch (error) {
    logger.error('deleteIssue error:', error);
    sendError(res, 500, 'Delete failed');
  }
};
