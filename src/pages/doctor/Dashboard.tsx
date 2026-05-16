import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Users, ListOrdered, FileText, Sparkles, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Link } from 'react-router-dom';

export default function DoctorDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    patientsToday: 0,
    queued: 0,
    reports: 0
  });
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const fetchData = async () => {
      try {
        const [apptsResp, queueResp, reportsResp] = await Promise.all([
          fetch(`/api/appointments?doctor_id=${profile.id}`),
          fetch(`/api/queue?doctor_id=${profile.id}`),
          fetch(`/api/reports`) // Basic fetch for reports
        ]);

        const appts = await apptsResp.json();
        const queue = await queueResp.json();
        const reports = await reportsResp.json();

        setAppointments(appts.slice(0, 5));
        setStats({
          patientsToday: appts.length,
          queued: queue.filter((q: any) => q.status === 'waiting').length,
          reports: reports.length
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [profile]);

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Doctor Console</h1>
        <p className="text-muted-foreground mt-1">Manage your consultations and patient records.</p>
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Patients Today</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.patientsToday}</div>
            <p className="text-xs text-muted-foreground">Consultations scheduled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Waiting</CardTitle>
            <ListOrdered className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.queued}</div>
            <p className="text-xs text-muted-foreground">In Queue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reports</CardTitle>
            <FileText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reports}</div>
            <p className="text-xs text-muted-foreground">Medical Records</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rating</CardTitle>
            <Sparkles className="size-4 text-muted-foreground text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5.0/5</div>
            <p className="text-xs text-muted-foreground">Patient Satisfaction</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
               {appointments.length === 0 ? (
                 <p className="text-sm text-muted-foreground py-4 text-center">No upcoming appointments</p>
               ) : appointments.map(appt => (
                 <div key={appt.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 border">
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                      {appt.patient_name?.[0] || 'P'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{appt.patient_name || 'Patient'}</p>
                      <p className="text-xs text-muted-foreground">{appt.type || 'General Checkup'} • {appt.time}</p>
                    </div>
                    <Button variant="ghost" size="icon" render={<Link to="/doctor/appointments" />} nativeButton={false}>
                      <ChevronRight size={16} />
                    </Button>
                 </div>
               ))}
            </div>
            <Button variant="link" className="w-full mt-4" render={<Link to="/doctor/appointments" />} nativeButton={false}>
              View Full Calendar
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

