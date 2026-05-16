import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, User, Stethoscope, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await fetch('/api/appointments');
        const data = await response.json();
        setAppointments(data.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  const filteredAppts = appointments.filter(a => 
    a.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Appointments</h1>
          <p className="text-muted-foreground">Monitoring all scheduled consultations across the clinic</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search any booking..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredAppts.length === 0 ? (
          <div className="py-20 text-center opacity-50">No records matching your search.</div>
        ) : (
          filteredAppts.map((appt) => (
            <Card key={appt.id} className="hover:bg-muted/10 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-primary/10 text-primary">
                      <CalendarIcon size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-lg">{format(new Date(appt.date), 'MMM dd, yyyy')}</span>
                        <Badge variant="outline">{appt.time}</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-muted-foreground/50" />
                          <span className="font-medium text-foreground">Patient:</span> {appt.patient_name}
                        </div>
                        <div className="flex items-center gap-2">
                          <Stethoscope size={14} className="text-muted-foreground/50" />
                          <span className="font-medium text-foreground">Doctor:</span> {appt.doctor_name || 'Dr. Specialist'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 w-full lg:w-auto border-t lg:border-0 pt-4 lg:pt-0">
                    <Badge variant={
                      appt.status === 'confirmed' ? 'default' : 
                      appt.status === 'cancelled' ? 'destructive' : 'secondary'
                    } className="px-3 py-1">
                      {appt.status.toUpperCase()}
                    </Badge>
                    <Button variant="ghost" size="sm" className="ml-auto lg:ml-0">Audit</Button>
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
