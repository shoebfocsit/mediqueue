import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/Login';
import Layout from './components/Layout';
import PatientDashboard from './pages/patient/Dashboard';
import PatientChat from './pages/patient/Chat';
import DoctorQueue from './pages/doctor/Queue';
import PatientQueue from './pages/patient/Queue';
import PatientAppointments from './pages/patient/Appointments';
import PatientReports from './pages/patient/Reports';
import PatientPrescriptions from './pages/patient/Prescriptions';
import AdminReports from './pages/admin/Reports';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminAppointments from './pages/admin/Appointments';
import AdminQueue from './pages/admin/Queue';
import DoctorDashboard from './pages/doctor/Dashboard';
import DoctorPatients from './pages/doctor/Patients';
import PublicQueueBoard from './pages/PublicQueue';
import DoctorAppointments from './pages/doctor/Appointments';
import Profile from './pages/shared/Profile';
import ErrorBoundary from './components/ErrorBoundary';

function RootRedirect() {
  const { profile, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/20" />
          <div className="h-4 w-32 rounded bg-muted" />
          <p className="text-sm text-muted-foreground">Initializing MediQueue...</p>
        </div>
      </div>
    );
  }
  
  if (!profile) return <Navigate to="/login" replace />;
  return <Navigate to={`/${profile.role}`} replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <TooltipProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-background">
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                
                {/* Admin Routes */}
                <Route path="/admin" element={<Layout allowedRoles={['admin']} />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="patients" element={<AdminUsers role="patient" />} />
                  <Route path="doctors" element={<AdminUsers role="doctor" />} />
                  <Route path="admins" element={<AdminUsers role="admin" />} />
                  <Route path="appointments" element={<AdminAppointments />} />
                  <Route path="queue" element={<AdminQueue />} />
                  <Route path="reports" element={<AdminReports />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="settings" element={<div className="p-8">Clinic Settings</div>} />
                </Route>

                {/* Doctor Routes */}
                <Route path="/doctor" element={<Layout allowedRoles={['doctor']} />}>
                  <Route index element={<DoctorDashboard />} />
                  <Route path="queue" element={<DoctorQueue />} />
                  <Route path="appointments" element={<DoctorAppointments />} />
                  <Route path="patients" element={<DoctorPatients />} />
                  <Route path="profile" element={<Profile />} />
                </Route>

                {/* Patient Routes */}
                <Route path="/patient" element={<Layout allowedRoles={['patient']} />}>
                  <Route index element={<PatientDashboard />} />
                  <Route path="queue" element={<PatientQueue />} />
                  <Route path="appointments" element={<PatientAppointments />} />
                  <Route path="reports" element={<PatientReports />} />
                  <Route path="prescriptions" element={<PatientPrescriptions />} />
                  <Route path="chat" element={<PatientChat />} />
                  <Route path="profile" element={<Profile />} />
                </Route>

                <Route path="/public-queue" element={<PublicQueueBoard />} />
                <Route path="/" element={<RootRedirect />} />
              </Routes>
              <Toaster position="top-right" />
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
