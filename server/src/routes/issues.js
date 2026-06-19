import { Router } from 'express';
import {
  createIssue, getIssues, getMyIssues, getNearbyIssues,
  getIssueById, updateIssueStatus, upvoteIssue,
  verifyIssue, deleteIssue,
} from '../controllers/issueController.js';
import { authenticate, authorise } from '../middlewares/auth.js';
import { uploadMiddleware, uploadToCloudinary } from '../middlewares/upload.js';
import {
  createIssueValidator, updateStatusValidator, nearbyValidator,
} from '../validators/index.js';

const router = Router();

router.get('/',          getIssues);
router.get('/nearby',    nearbyValidator, getNearbyIssues);
router.get('/my-issues', authenticate, getMyIssues);
router.get('/:id',       getIssueById);

router.post('/',
  authenticate,
  uploadMiddleware.array('images', 5),
  uploadToCloudinary,
  createIssueValidator,
  createIssue
);

router.patch('/:id/status',
  authenticate,
  authorise('official', 'admin'),
  updateStatusValidator,
  updateIssueStatus
);

router.post('/:id/upvote', authenticate, upvoteIssue);
router.post('/:id/verify', authenticate, verifyIssue);
router.delete('/:id',      authenticate, deleteIssue);

export default router;
