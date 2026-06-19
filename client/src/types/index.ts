export interface User {
  _id: string;
  id: string;
  name: string;
  email: string;
  role: 'citizen' | 'official' | 'admin';
  phone?: string;
  points?: number;
  level?: string;
  badges?: string[];
  profileImage?: { url: string; publicId: string };
  civicScore?: number;
  avatar?: string;
  verified?: boolean;
  createdAt?: string;
}

export interface IssueImage {
  url: string;
  publicId: string;
  // legacy local storage fields
  path?: string;
  filename?: string;
}

export interface IssueLocation {
  type?: string;
  coordinates?: [number, number]; // [lng, lat]
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface StatusHistoryEntry {
  status: string;
  changedBy: string | User;
  remark?: string;
  changedAt: string;
}

export interface Issue {
  _id: string;
  title: string;
  description: string;
  category: string;
  severity?: string;
  status: string;
  images: IssueImage[];
  location: IssueLocation;
  reportedBy: User | string;
  assignedTo?: User | string | null;
  assignedDepartment?: string;
  upvotes: string[];
  downvotes?: string[];
  verifiedBy?: string[];
  priorityScore?: number;
  adminRemarks?: string;
  statusHistory?: StatusHistoryEntry[];
  createdAt: string;
  updatedAt?: string;
}

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  issueId?: string;
  read: boolean;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export type IssueStatus =
  | 'pending'
  | 'under-review'
  | 'verified'
  | 'assigned'
  | 'work-started'
  | 'completed'
  | 'closed'
  | 'rejected';
