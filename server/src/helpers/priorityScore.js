/**
 * Calculates a numeric priority score for an issue based on:
 *  severity, upvotes, verified user count, and age.
 *
 * @param {Object} issue  Mongoose Issue document
 * @returns {number} priority score
 */
export const calcPriorityScore = (issue) => {
  const SEVERITY_WEIGHTS = {
    critical: 50,
    high:     35,
    medium:   20,
    low:      10,
  };

  const severityScore = SEVERITY_WEIGHTS[issue.severity] ?? 20;
  const upvoteScore   = (issue.upvotes?.length ?? 0) * 2;
  const verifyScore   = (issue.verifiedBy?.length ?? 0) * 5;

  const ageInDays = Math.floor((Date.now() - new Date(issue.createdAt)) / 86_400_000);
  const ageScore  = ageInDays >= 5 ? 20 : 0;

  return severityScore + upvoteScore + verifyScore + ageScore;
};
