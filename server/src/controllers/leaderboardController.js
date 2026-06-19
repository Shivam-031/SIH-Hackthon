import User from '../models/User.js';
import Reward from '../models/Reward.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

// GET /api/leaderboard?period=week|month|overall
export const getLeaderboard = async (req, res) => {
  try {
    const { period = 'overall', limit = 20 } = req.query;

    if (period === 'overall') {
      const users = await User.find({ isActive: true })
        .select('name email points level badges profileImage')
        .sort({ points: -1 })
        .limit(parseInt(limit));

      return sendSuccess(res, 200, 'Leaderboard fetched', { users, period });
    }

    // For week/month, aggregate from Reward collection
    const now = new Date();
    const startDate = new Date();
    if (period === 'week')  startDate.setDate(now.getDate() - 7);
    if (period === 'month') startDate.setMonth(now.getMonth() - 1);

    const topUsers = await Reward.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$userId', totalPoints: { $sum: '$points' } } },
      { $sort: { totalPoints: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          totalPoints: 1,
          name: '$user.name',
          email: '$user.email',
          level: '$user.level',
          badges: '$user.badges',
          profileImage: '$user.profileImage',
        },
      },
    ]);

    sendSuccess(res, 200, 'Leaderboard fetched', { users: topUsers, period });
  } catch (error) {
    logger.error('getLeaderboard error:', error);
    sendError(res, 500, 'Failed to fetch leaderboard');
  }
};
