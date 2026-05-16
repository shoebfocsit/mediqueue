import { useState, useEffect } from 'react';
import { Users, CalendarDays, ListOrdered, UserPlus, Stethoscope, UserCog, Loader2, Activity } from 'lucide-react';
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    doctors: 0,
    patients: 0,
    activeQueue: 0,
    appointments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersResp, queueResp, apptsResp] = await Promise.all([
          fetch('/api/auth/users'),
          fetch('/api/queue'),
          fetch('/api/appointments')
        ]);

        const users = await usersResp.json();
        const queue = await queueResp.json();
        const appts = await apptsResp.json();

        setStats({
          doctors: users.filter((u: any) => u.role === 'doctor').length,
          patients: users.filter((u: any) => u.role === 'patient').length,
          activeQueue: queue.filter((q: any) => q.status !== 'done').length,
          appointments: appts.length
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Hospital Administration</h1>
        <p className="text-muted-foreground mt-1">Overview of clinical operations and patient flow.</p>
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.patients}</div>
            <p className="text-xs text-muted-foreground">Registered profiles</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Doctors</CardTitle>
            <Stethoscope className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.doctors}</div>
            <p className="text-xs text-muted-foreground">Verified specialists</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <CalendarDays className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.appointments}</div>
            <p className="text-xs text-muted-foreground">Total records</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Queue Status</CardTitle>
            <ListOrdered className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{stats.activeQueue > 10 ? 'BUSY' : stats.activeQueue > 0 ? 'NORMAL' : 'EMPTY'}</div>
            <p className="text-xs text-muted-foreground">{stats.activeQueue} active patients</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-7">
        <Card className="lg:col-span-4 text-center py-20 bg-muted/20 border-dashed">
            <CardContent>
               <Activity className="size-12 mx-auto text-muted-foreground/20 mb-4" />
               <p className="text-muted-foreground">Live Activity Feed will appear as events occur.</p>
            </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start gap-2" variant="outline" render={<Link to="/admin/patients" />} nativeButton={false}>
               <UserPlus size={16} /> Manage Patients
            </Button>
            <Button className="w-full justify-start gap-2" variant="outline" render={<Link to="/admin/doctors" />} nativeButton={false}>
               <Stethoscope size={16} /> Manage Doctors
            </Button>
            <Button className="w-full justify-start gap-2" variant="outline" render={<Link to="/admin/appointments" />} nativeButton={false}>
               <CalendarDays size={16} /> Appointment Manager
            </Button>
            <Button className="w-full justify-start gap-2" variant="outline" render={<Link to="/admin/reports" />} nativeButton={false}>
               <UserCog size={16} /> Review Reports
            </Button>
            <Button className="w-full justify-start gap-2 bg-slate-900 text-white hover:bg-slate-800" variant="default" render={<Link to="/public-queue" target="_blank" />} nativeButton={false}>
               <Activity size={16} /> Launch Queue Board
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
