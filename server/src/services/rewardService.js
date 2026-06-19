import User from '../models/User.js';
import Reward from '../models/Reward.js';
import logger from '../utils/logger.js';

const POINT_MAP = {
  issue_reported:      30,
  issue_completed:     50,
  community_verify:    10,
  daily_login:          5,
  helping_others:      15,
  top_reporter_month: 100,
};

/**
 * Credit points to a user and record the transaction.
 *
 * @param {string} userId
 * @param {string} reason  key from POINT_MAP or a custom string
 * @param {string|null} issueId
 * @param {number|null} customPoints  override point value
 */
export const creditPoints = async (userId, reason, issueId = null, customPoints = null) => {
  try {
    const points = customPoints ?? POINT_MAP[reason] ?? 0;
    if (points === 0) return;

    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { points } },
      { new: true }
    );

    user.updateLevel();
    await user.save();

    await Reward.create({ userId, issueId, points, reason });

    return user;
  } catch (error) {
    logger.error('creditPoints error:', error.message);
  }
};
