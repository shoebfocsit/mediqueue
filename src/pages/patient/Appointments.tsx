import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Clock, MapPin, Plus, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function PatientAppointments() {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const fetchAppointments = async () => {
      try {
        const response = await fetch(`/api/appointments?patient_id=${profile.id}`);
        if (!response.ok) throw new Error('Failed to fetch appointments');
        const data = await response.json();
        setAppointments(data.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [profile]);

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground">Manage your clinic visits and history</p>
        </div>
        <Button className="gap-2">
          <Plus size={18} />
          Book New
        </Button>
      </div>

      <div className="grid gap-4">
        {appointments.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarIcon size={40} className="text-muted-foreground/40 mb-4" />
              <h3 className="font-semibold text-lg">No appointments yet</h3>
              <p className="text-muted-foreground max-w-sm">
                You haven't booked any appointments. Start by booking your first consultation.
              </p>
            </CardContent>
          </Card>
        ) : (
          appointments.map((appt) => (
            <Card key={appt.id} className="overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="bg-muted p-6 flex flex-col items-center justify-center text-center min-w-[120px]">
                  <span className="text-sm font-bold uppercase text-muted-foreground">
                    {format(new Date(appt.date), 'MMM')}
                  </span>
                  <span className="text-3xl font-black">
                    {format(new Date(appt.date), 'dd')}
                  </span>
                </div>
                <CardContent className="p-6 flex-1 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg">{appt.doctor_name || 'Clinic Consultation'}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{appt.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin size={14} />
                        <span>Main Hospital Wing</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={
                      appt.status === 'confirmed' ? 'default' : 
                      appt.status === 'pending' ? 'secondary' : 'outline'
                    } className="capitalize">
                      {appt.status}
                    </Badge>
                    <Button variant="ghost" size="sm">Details</Button>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
