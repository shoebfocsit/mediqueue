import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  UserRound,
  CalendarDays,
  ListOrdered,
  FileText,
  Settings,
  Stethoscope,
  LogOut,
  Pill,
  MessageSquareMore,
  History,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const { profile, logout } = useAuth();
  const location = useLocation();

  if (!profile) return null;

  const links = {
    admin: [
      { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
      { name: 'Patients', path: '/admin/patients', icon: Users },
      { name: 'Doctors', path: '/admin/doctors', icon: Stethoscope },
      { name: 'Admins', path: '/admin/admins', icon: ShieldCheck },
      { name: 'Appointments', path: '/admin/appointments', icon: CalendarDays },
      { name: 'Live Queue', path: '/admin/queue', icon: ListOrdered },
      { name: 'AI Reports', path: '/admin/reports', icon: FileText },
      { name: 'Profile', path: '/admin/profile', icon: UserRound },
      { name: 'Settings', path: '/admin/settings', icon: Settings },
    ],
    doctor: [
      { name: 'Dashboard', path: '/doctor', icon: LayoutDashboard },
      { name: 'My Queue', path: '/doctor/queue', icon: ListOrdered },
      { name: 'Appointments', path: '/doctor/appointments', icon: CalendarDays },
      { name: 'My Patients', path: '/doctor/patients', icon: Users },
      { name: 'Profile', path: '/doctor/profile', icon: UserRound },
    ],
    patient: [
      { name: 'Dashboard', path: '/patient', icon: LayoutDashboard },
      { name: 'Queue Status', path: '/patient/queue', icon: ListOrdered },
      { name: 'Appointments', path: '/patient/appointments', icon: CalendarDays },
      { name: 'My Reports', path: '/patient/reports', icon: History },
      { name: 'Prescriptions', path: '/patient/prescriptions', icon: Pill },
      { name: 'AI Health Bot', path: '/patient/chat', icon: MessageSquareMore },
      { name: 'Profile', path: '/patient/profile', icon: UserRound },
    ]
  };

  const activeLinks = links[profile.role] || [];

  return (
    <div className="flex w-64 flex-col border-r bg-card h-screen shrink-0">
      <div className="p-6">
        <div className="flex items-center gap-2 font-bold text-primary text-xl tracking-tight">
          <div className="size-8 rounded-lg bg-primary text-white flex items-center justify-center">
            M
          </div>
          MediQueue
        </div>
      </div>
      
      <div className="flex-1 px-4 space-y-1">
        {activeLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon size={18} className={cn(isActive ? "" : "text-muted-foreground/70 group-hover:text-accent-foreground")} />
              {link.name}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t space-y-3">
        <div className="px-3 py-2 rounded-lg bg-muted/50">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Logged as</p>
          <p className="text-sm font-medium truncate">{profile.full_name}</p>
          <p className="text-[10px] text-muted-foreground capitalize">{profile.role}</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={logout}
        >
          <LogOut size={16} />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
