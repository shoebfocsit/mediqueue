import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQueue } from '@/hooks/useQueue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Timer, Users, Calendar, ArrowRightCircle, FileText, Pill, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function PatientDashboard() {
  const { profile } = useAuth();
  const { activeEntry, patientsAhead, loading: queueLoading } = useQueue(profile?.id);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const fetchData = async () => {
      try {
        const [apptsResp, reportsResp, rxResp] = await Promise.all([
          fetch(`/api/appointments?patient_id=${profile.id}`),
          fetch(`/api/reports?patient_id=${profile.id}`),
          fetch(`/api/prescriptions?patient_id=${profile.id}`)
        ]);
        setAppointments(await apptsResp.json());
        setReports(await reportsResp.json());
        setPrescriptions(await rxResp.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [profile]);

  if (loading || queueLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin" /></div>;

  const nextAppt = appointments.find(a => new Date(a.date) >= new Date() && a.status === 'confirmed');
  const estimatedWait = patientsAhead * 15;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {profile?.full_name}</h1>
        <p className="text-muted-foreground mt-1">Here is your healthcare overview for today.</p>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90">My Queue Number</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {activeEntry ? `Q-${activeEntry.queue_number.toString().padStart(3, '0')}` : 'N/A'}
            </div>
            <p className="text-xs mt-1 opacity-80">
              {activeEntry?.status === 'in_progress' ? 'It\'s your turn!' : activeEntry ? 'Waiting in line' : 'No active session'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Patients Ahead</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patientsAhead}</div>
            <Progress value={Math.max(0, 100 - (patientsAhead * 20))} className="h-1 mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Est. Wait Time</CardTitle>
            <Timer className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">~{estimatedWait} mins</div>
            <p className="text-xs text-muted-foreground mt-1">Based on avg. consult time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Next appointment</CardTitle>
            <Calendar className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">
              {nextAppt ? format(new Date(nextAppt.date), 'MMM dd') : 'No Booking'}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {nextAppt ? `${nextAppt.time} with ${nextAppt.doctor_name || 'Doctor'}` : 'Click to schedule'}
            </p>
          </CardContent>
        </Card>
      </div>

      {activeEntry?.status === 'in_progress' && (
        <Card className="border-primary bg-primary/5 border-2 animate-pulse">
          <CardContent className="flex items-center gap-6 p-6">
            <div className="bg-primary text-white p-4 rounded-full">
              <ArrowRightCircle size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-primary">Your Turn - Please Proceed</h3>
              <p className="text-muted-foreground">Please move to the consultation area for your checkup.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
         <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No recent records</p>
                ) : reports.slice(0, 3).map(report => (
                  <div key={report.id} className="flex items-start gap-4 p-3 rounded-lg border bg-muted/30">
                    <div className="bg-blue-100 p-2 rounded text-blue-700">
                      <FileText size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium truncate max-w-[200px]">{report.file_name}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(report.created_at), 'PPP')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
         </Card>

         <Card>
            <CardHeader>
              <CardTitle>Prescriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {prescriptions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <Pill size={32} className="mb-2 opacity-20" />
                    <p className="text-sm italic">Digital prescriptions will appear after your next visit.</p>
                  </div>
                ) : prescriptions.slice(0, 3).map(rx => (
                  <div key={rx.id} className="flex items-start gap-4 p-3 rounded-lg border bg-muted/30">
                    <div className="bg-amber-100 p-2 rounded text-amber-700">
                      <Pill size={16} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium">Dr. {rx.doctor_name}</p>
                        <p className="text-[10px] text-muted-foreground">{format(new Date(rx.created_at), 'MMM dd')}</p>
                      </div>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">{rx.medications}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}

