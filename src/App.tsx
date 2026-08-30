import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Header from '@/components/layout/Header';
import AuthModal from '@/components/features/auth/AuthModal';
import SupabaseBootstrap from '@/components/system/SupabaseBootstrap';
import HomePage from '@/pages/HomePage';
import ReportsPage from '@/pages/ReportsPage';
import CreateReportPage from '@/pages/CreateReportPage';
import ReportDetailPage from '@/pages/ReportDetailPage';
import DashboardPage from '@/pages/DashboardPage';
import OrganizationsPage from '@/pages/OrganizationsPage';
import OrganizationDetailPage from '@/pages/OrganizationDetailPage';
import OrganizationDashboardPage from '@/pages/OrganizationDashboardPage';
import AdminPage from '@/pages/AdminPage';
import ProfilePage from '@/pages/ProfilePage';
import NotFound from '@/pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <SupabaseBootstrap />
      <Header />
      <AuthModal />
      <Toaster position="top-right" richColors />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/reports/new" element={<CreateReportPage />} />
          <Route path="/reports/:id" element={<ReportDetailPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/organization-dashboard" element={<OrganizationDashboardPage />} />
          <Route path="/organizations" element={<OrganizationsPage />} />
          <Route path="/organizations/:id" element={<OrganizationDetailPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
