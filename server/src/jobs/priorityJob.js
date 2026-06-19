import Issue from '../models/Issue.js';
import { calcPriorityScore } from '../helpers/priorityScore.js';
import logger from '../utils/logger.js';

/**
 * Recalculates priorityScore for all open issues.
 * Run this on a schedule (e.g. every hour via setInterval or node-cron).
 */
export const recalcPriorityScores = async () => {
  try {
    const openIssues = await Issue.find({
      status: { $nin: ['closed', 'rejected', 'completed'] },
    });

    const bulkOps = openIssues.map((issue) => ({
      updateOne: {
        filter: { _id: issue._id },
        update: { $set: { priorityScore: calcPriorityScore(issue) } },
      },
    }));

    if (bulkOps.length) {
      await Issue.bulkWrite(bulkOps);
      logger.info(`Priority scores updated for ${bulkOps.length} issues.`);
    }
  } catch (error) {
    logger.error('recalcPriorityScores job error:', error.message);
  }
};

/**
 * Starts the priority recalculation job on a given interval.
 * @param {number} intervalMs  Default: every hour
 */
export const startPriorityJob = (intervalMs = 60 * 60 * 1000) => {
  logger.info(`Priority score job scheduled every ${intervalMs / 60000} min.`);
  setInterval(recalcPriorityScores, intervalMs);
};
