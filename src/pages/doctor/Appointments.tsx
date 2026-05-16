import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Clock, Check, X, Loader2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function DoctorAppointments() {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    if (!profile) return;
    try {
      const response = await fetch(`/api/appointments?doctor_id=${profile.id}`);
      const data = await response.json();
      setAppointments(data.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [profile]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Update failed');
      toast.success(`Appointment ${status}`);
      fetchAppointments();
    } catch {
      toast.error('Failed to update appointment');
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Consultation Schedule</h1>
          <p className="text-muted-foreground">Review and manage your daily bookings</p>
        </div>
        <Button className="gap-2">
          <Plus size={18} />
          New Slot
        </Button>
      </div>

      <div className="grid gap-4">
        {appointments.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed rounded-xl opacity-50">
            <CalendarIcon size={48} className="mx-auto mb-4" />
            <p>No appointments booked for today.</p>
          </div>
        ) : (
          appointments.map((appt) => (
            <Card key={appt.id} className="group overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  <div className={`w-2 ${appt.status === 'confirmed' ? 'bg-green-500' : 'bg-orange-500'}`} />
                  <div className="flex-1 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-full bg-muted flex items-center justify-center font-bold">
                        {appt.patient_name?.[0] || 'P'}
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg">{appt.patient_name}</h3>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>{appt.time}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CalendarIcon size={14} />
                            <span>{format(new Date(appt.date), 'PPP')}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant={appt.status === 'confirmed' ? 'default' : 'secondary'}>
                        {appt.status.toUpperCase()}
                      </Badge>
                      {appt.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => updateStatus(appt.id, 'confirmed')}>
                            <Check size={16} />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => updateStatus(appt.id, 'cancelled')}>
                            <X size={16} />
                          </Button>
                        </div>
                      )}
                      <Button variant="ghost" size="sm">History</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
