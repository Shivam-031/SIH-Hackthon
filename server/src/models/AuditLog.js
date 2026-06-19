import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    adminId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action:   { type: String, required: true },
    target:   { type: String, required: true },   // e.g. 'Issue', 'User'
    targetId: { type: mongoose.Schema.Types.ObjectId },
    details:  { type: mongoose.Schema.Types.Mixed },
    ip:       { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('AuditLog', auditLogSchema);
