import { Router } from 'express';
import {
  getDashboard, getAnalytics, getAllUsers,
  toggleUserActive, getAdminIssues,
  adminDeleteIssue, getAuditLogs,
} from '../controllers/adminController.js';
import { authenticate, authorise } from '../middlewares/auth.js';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, authorise('admin'));

router.get('/dashboard',        getDashboard);
router.get('/analytics',        getAnalytics);
router.get('/audit-logs',       getAuditLogs);

router.get('/users',                    getAllUsers);
router.patch('/users/:id/toggle-active', toggleUserActive);

router.get('/issues',      getAdminIssues);
router.delete('/issues/:id', adminDeleteIssue);

export default router;
