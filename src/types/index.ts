export type UserRole = 'citizen' | 'organization' | 'admin';
export type ReportStatus = 'new' | 'review' | 'accepted' | 'inprogress' | 'completed' | 'rejected' | 'ignored';
export type CategoryId =
  | 'roads' | 'electricity' | 'water' | 'gas' | 'sewage'
  | 'garbage' | 'streetlights' | 'parks' | 'trees' | 'transport'
  | 'environment' | 'buildings' | 'safety' | 'animals' | 'other';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  phone?: string;
  district?: string;
  createdAt: string;
  reportsCount: number;
  votesCount: number;
  isVerified?: boolean;
  isBlocked?: boolean;
  bio?: string;
}

export interface Category {
  id: CategoryId;
  name: string;
  nameEn: string;
  icon: string;
  color: string;
  bgColor: string;
  organizationId: string;
}

export interface Organization {
  id: string;
  name: string;
  logo?: string;
  description: string;
  categoryIds: CategoryId[];
  phone: string;
  email: string;
  website?: string;
  verified: boolean;
  completedReports: number;
  activeReports: number;
  avgResponseTime: string;
  rating: number;
  district?: string;
  joinedAt: string;
  totalReports: number;
}

export interface Location {
  lat: number;
  lng: number;
  address: string;
  district?: string;
}

export interface TimelineEntry {
  id: string;
  status: ReportStatus;
  note: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  organizationName?: string;
  createdAt: string;
}

export interface CitizenResolution {
  id: string;
  reportId: string;
  solverId: string;
  solverName: string;
  solverAvatar?: string;
  description: string;
  photos: string[];
  status: 'pending' | 'approved' | 'rejected';
  confirmedBy: string[];
  deniedBy: string[];
  createdAt: string;
}

export interface BusinessSponsor {
  id: string;
  reportId: string;
  businessName: string;
  businessDescription?: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  pledgeMessage: string;
  sponsorType: 'full' | 'partial' | 'material';
  status: 'pledged' | 'in_progress' | 'completed' | 'cancelled';
  pledgedAt: string;
  completedAt?: string;
  userId?: string;
}

export interface Comment {
  id: string;
  reportId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole: UserRole;
  text: string;
  images?: string[];
  likes: number;
  parentId?: string;
  replies?: Comment[];
  createdAt: string;
  isLiked: boolean;
}

export interface Report {
  id: string;
  title: string;
  description: string;
  categoryId: CategoryId;
  status: ReportStatus;
  location: Location;
  photos: string[];
  videos?: string[];
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  anonymous: boolean;
  organizationId: string;
  votes: number;
  isVoted: boolean;
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
  timeline: TimelineEntry[];
  completionPhotos?: string[];
  completionDescription?: string;
  completionDate?: string;
  solvedBy?: string;
  priority: Priority;
  viewCount: number;
  citizenResolutions?: CitizenResolution[];
  sponsors?: BusinessSponsor[];
}

export interface Notification {
  id: string;
  userId: string;
  type: 'comment' | 'status_change' | 'vote' | 'assignment' | 'completion';
  title: string;
  message: string;
  reportId?: string;
  read: boolean;
  createdAt: string;
}

export interface RoutingRule {
  categoryId: CategoryId;
  organizationId: string;
  organizationName: string;
}

export type AnnouncementType =
  | 'road_closure'
  | 'road_repair'
  | 'road_diversion'
  | 'water_cutoff'
  | 'electricity_cutoff'
  | 'gas_cutoff'
  | 'event'
  | 'other';

export interface MapAnnouncement {
  id: string;
  organizationId: string;
  organizationName: string;
  type: AnnouncementType;
  title: string;
  description: string;
  route: [number, number][];          // Affected road/area as latlng points
  alternativeRoute?: [number, number][];  // Alternative route
  alternativeDescription?: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'planned' | 'expired';
  createdAt: string;
}

export interface DailyStats {
  date: string;
  count: number;
  resolved: number;
}

export interface MonthlyStats {
  month: string;
  count: number;
  resolved: number;
}
