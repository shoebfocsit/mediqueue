import { Navigate, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from './shared/Sidebar';
import { Button } from '@/components/ui/button';
import { Menu, Bell } from 'lucide-react';

export default function Layout({ allowedRoles }: { allowedRoles?: string[] }) {
  const { profile, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-primary/20" />
        <div className="h-4 w-32 rounded bg-muted" />
      </div>
    </div>
  );

  if (!profile) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to={`/${profile.role}`} replace />;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:block">
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Sidebar - Mobile Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 bg-card animate-in slide-in-from-left duration-300">
            <Sidebar onClose={() => setIsSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b bg-card flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={24} />
            </Button>
            <div className="flex items-center gap-2 lg:hidden font-bold text-primary">
              <div className="size-8 rounded-lg bg-primary text-white flex items-center justify-center text-xs">M</div>
              MediQueue
            </div>
            <h2 className="hidden lg:block text-sm font-semibold capitalize bg-muted/50 px-3 py-1 rounded-full">
              {profile.role} Portal
            </h2>
          </div>

          <div className="flex items-center gap-3">
             <Button variant="ghost" size="icon" className="relative">
                <Bell size={20} />
                <span className="absolute top-2 right-2 size-2 bg-destructive rounded-full border-2 border-card" />
             </Button>
             <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {profile.full_name.charAt(0)}
             </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
