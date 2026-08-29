
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Report, Organization, Notification, RoutingRule, ReportStatus, Comment, CitizenResolution, UserRole, MapAnnouncement, BusinessSponsor } from '@/types';
import { MOCK_REPORTS, MOCK_ORGANIZATIONS, MOCK_USERS, MOCK_NOTIFICATIONS, MOCK_ANNOUNCEMENTS } from '@/lib/mockData';
import { DEFAULT_ROUTING_RULES } from '@/constants/categories';

interface AppStore {
  currentUser: User | null;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'register';
  reports: Report[];
  organizations: Organization[];
  users: User[];
  notifications: Notification[];
  routingRules: RoutingRule[];
  sidebarOpen: boolean;

  login: (user: User) => void;
  logout: () => void;
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  setSidebarOpen: (open: boolean) => void;

  addReport: (report: Report) => void;
  voteReport: (reportId: string) => void;
  updateReportStatus: (reportId: string, status: ReportStatus, note: string) => void;
  addComment: (reportId: string, comment: Comment) => void;
  likeComment: (reportId: string, commentId: string) => void;

  submitCitizenResolution: (reportId: string, data: { solverId: string; solverName: string; solverAvatar?: string; description: string; photos: string[] }) => void;
  voteOnCitizenResolution: (reportId: string, resolutionId: string, vote: 'confirm' | 'deny') => void;
  adminReviewCitizenResolution: (reportId: string, resolutionId: string, decision: 'approve' | 'reject') => void;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addNotification: (n: Notification) => void;

  updateRoutingRule: (categoryId: string, organizationId: string, orgName: string) => void;
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;

  announcements: MapAnnouncement[];
  addAnnouncement: (a: MapAnnouncement) => void;
  updateAnnouncement: (id: string, data: Partial<MapAnnouncement>) => void;
  deleteAnnouncement: (id: string) => void;
  addSponsor: (reportId: string, sponsor: BusinessSponsor) => void;
  updateSponsorStatus: (reportId: string, sponsorId: string, status: BusinessSponsor['status']) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthModalOpen: false,
      authModalTab: 'login',
      reports: MOCK_REPORTS,
      organizations: MOCK_ORGANIZATIONS,
      users: MOCK_USERS,
      notifications: MOCK_NOTIFICATIONS,
      routingRules: DEFAULT_ROUTING_RULES,
      sidebarOpen: true,
      announcements: MOCK_ANNOUNCEMENTS,

      login: (user) => set({ currentUser: user, isAuthModalOpen: false }),
      logout: () => set({ currentUser: null }),
      openAuthModal: (tab = 'login') => set({ isAuthModalOpen: true, authModalTab: tab }),
      closeAuthModal: () => set({ isAuthModalOpen: false }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      addReport: (report) =>
        set((state) => ({ reports: [report, ...state.reports] })),

      voteReport: (reportId) =>
        set((state) => ({
          reports: state.reports.map((r) =>
            r.id === reportId
              ? { ...r, votes: r.isVoted ? r.votes - 1 : r.votes + 1, isVoted: !r.isVoted }
              : r
          ),
        })),

      updateReportStatus: (reportId, status, note) =>
        set((state) => {
          const user = state.currentUser;
          if (!user) return state;
          const newEntry = {
            id: `tl-${Date.now()}`,
            status,
            note,
            authorId: user.id,
            authorName: user.name,
            authorRole: user.role,
            createdAt: new Date().toISOString(),
          };
          return {
            reports: state.reports.map((r) =>
              r.id === reportId
                ? { ...r, status, updatedAt: new Date().toISOString(), timeline: [...r.timeline, newEntry] }
                : r
            ),
          };
        }),

      addComment: (reportId, comment) =>
        set((state) => ({
          reports: state.reports.map((r) =>
            r.id === reportId ? { ...r, comments: [...r.comments, comment] } : r
          ),
        })),

      likeComment: (reportId, commentId) =>
        set((state) => ({
          reports: state.reports.map((r) =>
            r.id === reportId
              ? {
                  ...r,
                  comments: r.comments.map((c) =>
                    c.id === commentId
                      ? { ...c, likes: c.isLiked ? c.likes - 1 : c.likes + 1, isLiked: !c.isLiked }
                      : c
                  ),
                }
              : r
          ),
        })),

      // These three methods were defined twice: once as interface properties (correct)
      // and once as function bodies outside of an object literal (incorrect, causing the parsing error).
      // They are now correctly moved to be defined within the object literal as methods.
      // The original error was 'Parsing error: Expression expected.' because `submitCitizenResolution: (reportId: string, data: { solverId: string; solverName: string; solverAvatar?: string; description: string; photos: string[] }) => void;`
      // was interpreted as an attempt to define an expression outside of a valid context.
      // The solution is to remove these extraneous lines, as the methods are properly defined later in the store.
      // The original code had:
      // submitCitizenResolution: (reportId: string, data: { solverId: string; solverName: string; solverAvatar?: string; description: string; photos: string[] }) => void;
      // voteOnCitizenResolution: (reportId: string, resolutionId: string, vote: 'confirm' | 'deny') => void;
      // adminReviewCitizenResolution: (reportId: string, resolutionId: string, decision: 'approve' | 'reject') => void;
      // These lines were causing the error. They are now removed from this position.

      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),

      markAllNotificationsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),

      addNotification: (notif) =>
        set((state) => ({ notifications: [notif, ...state.notifications] })),

      updateRoutingRule: (categoryId, organizationId, orgName) =>
        set((state) => ({
          routingRules: state.routingRules.map((r) =>
            r.categoryId === categoryId
              ? { ...r, organizationId, organizationName: orgName }
              : r
          ),
        })),

      blockUser: (userId) =>
        set((state) => ({
          users: state.users.map((u) => (u.id === userId ? { ...u, isBlocked: true } : u)),
        })),

      unblockUser: (userId) =>
        set((state) => ({
          users: state.users.map((u) => (u.id === userId ? { ...u, isBlocked: false } : u)),
        })),

      addAnnouncement: (a) =>
        set((state) => ({ announcements: [a, ...state.announcements] })),

      updateAnnouncement: (id, data) =>
        set((state) => ({
          announcements: state.announcements.map(a => a.id === id ? { ...a, ...data } : a),
        })),

      deleteAnnouncement: (id) =>
        set((state) => ({
          announcements: state.announcements.filter(a => a.id !== id),
        })),

      addSponsor: (reportId, sponsor) =>
        set((state) => ({
          reports: state.reports.map(r =>
            r.id === reportId
              ? { ...r, sponsors: [...(r.sponsors || []), sponsor] }
              : r
          ),
        })),

      updateSponsorStatus: (reportId, sponsorId, status) =>
        set((state) => ({
          reports: state.reports.map(r =>
            r.id === reportId
              ? {
                  ...r,
                  sponsors: (r.sponsors || []).map(s =>
                    s.id === sponsorId
                      ? { ...s, status, ...(status === 'completed' ? { completedAt: new Date().toISOString() } : {}) }
                      : s
                  ),
                }
              : r
          ),
        })),

      submitCitizenResolution: (reportId, data) =>
        set((state) => {
          const resolution: CitizenResolution = {
            id: `res-${Date.now()}`,
            reportId,
            ...data,
            status: 'pending',
            confirmedBy: [],
            deniedBy: [],
            createdAt: new Date().toISOString(),
          };
          return {
            reports: state.reports.map(r =>
              r.id === reportId
                ? { ...r, citizenResolutions: [...(r.citizenResolutions || []), resolution] }
                : r
            ),
          };
        }),

      voteOnCitizenResolution: (reportId, resolutionId, vote) =>
        set((state) => {
          const userId = state.currentUser?.id;
          if (!userId) return state;
          return {
            reports: state.reports.map(r => {
              if (r.id !== reportId) return r;
              const updatedResolutions = (r.citizenResolutions || []).map(res => {
                if (res.id !== resolutionId) return res;
                if (res.confirmedBy.includes(userId) || res.deniedBy.includes(userId)) return res;
                if (res.solverId === userId) return res;
                const confirmedBy = vote === 'confirm' ? [...res.confirmedBy, userId] : res.confirmedBy;
                const deniedBy = vote === 'deny' ? [...res.deniedBy, userId] : res.deniedBy;
                const shouldAutoApprove = confirmedBy.length >= 3 && confirmedBy.length > deniedBy.length * 1.5;
                return { ...res, confirmedBy, deniedBy, status: shouldAutoApprove ? ('approved' as const) : res.status };
              });
              const justApproved = updatedResolutions.find(res => {
                const prev = (r.citizenResolutions || []).find(old => old.id === res.id);
                return res.status === 'approved' && prev?.status === 'pending';
              });
              if (justApproved) {
                return {
                  ...r,
                  citizenResolutions: updatedResolutions,
                  status: 'completed' as ReportStatus,
                  solvedBy: justApproved.solverName,
                  completionDescription: justApproved.description,
                  completionPhotos: justApproved.photos,
                  completionDate: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  timeline: [...r.timeline, {
                    id: `tl-${Date.now()}`,
                    status: 'completed' as ReportStatus,
                    note: `Fuqaro tomonidan hal qilindi va jamoat ${justApproved.confirmedBy.length} ovoz bilan tasdiqladi`,
                    authorId: justApproved.solverId,
                    authorName: justApproved.solverName,
                    authorRole: 'citizen' as UserRole,
                    createdAt: new Date().toISOString(),
                  }],
                };
              }
              return { ...r, citizenResolutions: updatedResolutions };
            }),
          };
        }),

      adminReviewCitizenResolution: (reportId, resolutionId, decision) =>
        set((state) => {
          const user = state.currentUser;
          if (!user) return state;
          return {
            reports: state.reports.map(r => {
              if (r.id !== reportId) return r;
              const resolution = (r.citizenResolutions || []).find(res => res.id === resolutionId);
              const updatedResolutions = (r.citizenResolutions || []).map(res =>
                res.id === resolutionId ? { ...res, status: decision === 'approve' ? ('approved' as const) : ('rejected' as const) } : res
              );
              if (!resolution || decision === 'reject') return { ...r, citizenResolutions: updatedResolutions };
              return {
                ...r,
                citizenResolutions: updatedResolutions,
                status: 'completed' as ReportStatus,
                solvedBy: resolution.solverName,
                completionDescription: resolution.description,
                completionPhotos: resolution.photos,
                completionDate: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                timeline: [...r.timeline, {
                  id: `tl-${Date.now()}`,
                  status: 'completed' as ReportStatus,
                  note: `Fuqaro hal qilishi ${user.name} tomonidan tasdiqlandi`,
                  authorId: user.id,
                  authorName: user.name,
                  authorRole: user.role,
                  createdAt: new Date().toISOString(),
                }],
              };
            }),
          };
        }),
    }),
    {
      name: 'opencity-store',
      partialize: (state) => ({
        currentUser: state.currentUser,
        reports: state.reports,
        notifications: state.notifications,
        routingRules: state.routingRules,
        announcements: state.announcements,
      }),
    }
  )
);
