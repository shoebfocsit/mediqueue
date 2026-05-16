import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { QueueEntry } from '@/hooks/useQueue';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { 
  CheckCircle2, Timer, ChevronRight, UserMinus, 
  Bell, Loader2, Stethoscope, Clock, Activity,
  FileText, History, PlusCircle, Pill, Edit2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function DoctorQueue() {
  const { profile } = useAuth();
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [doctorStatus, setDoctorStatus] = useState('Available');
  const [loading, setLoading] = useState(true);
  const [medicalHistory, setMedicalHistory] = useState<{reports: any[], prescriptions: any[]}>({reports: [], prescriptions: []});
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [prescriptionForm, setPrescriptionForm] = useState({
    medications: '',
    precautions: '',
    notes: ''
  });
  const [isSubmittingRx, setIsSubmittingRx] = useState(false);
  const [editingRx, setEditingRx] = useState<any | null>(null);
  const [isRxDialogOpen, setIsRxDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  
  const prevQueueLength = useRef(0);

  const fetchQueue = useCallback(async () => {
    if (!profile) return;
    try {
      const [qRes, dRes] = await Promise.all([
        fetch(`/api/queue?doctor_id=${profile.id}`),
        fetch(`/api/doctors/${profile.id}`)
      ]);

      if (qRes.ok) {
        const data: QueueEntry[] = await qRes.json();
        const activeEntries = data
          .filter(q => ['waiting', 'preparing', 'in_progress'].includes(q.status))
          .sort((a, b) => a.queue_number - b.queue_number);
        
        // Notify if new patient added
        if (activeEntries.length > prevQueueLength.current) {
           const newPatient = activeEntries[activeEntries.length - 1];
           toast(`New Patient Assigned: ${newPatient.patient_name || 'Anonymous'}`, {
             icon: '🔔',
             duration: 5000,
           });
        }
        prevQueueLength.current = activeEntries.length;
        setQueue(activeEntries);
      }
      
      if (dRes.ok) {
        const dData = await dRes.json();
        setDoctorStatus(dData.status || 'Available');
      }
    } catch (error) {
      console.error('Error fetching queue:', error);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  const fetchPatientHistory = async (patientId: string) => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/patient-history/${patientId}`);
      if (res.ok) {
        const data = await res.json();
        setMedicalHistory(data);
      }
    } catch {
      toast.error('Failed to load patient history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handlePrescriptionSubmit = async (patientId: string, patientName: string) => {
    if (!prescriptionForm.medications) {
      toast.error('At least one medication is required');
      return;
    }

    setIsSubmittingRx(true);
    try {
      const url = editingRx ? `/api/prescriptions/${editingRx.id}` : '/api/prescriptions';
      const method = editingRx ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          patient_name: patientName,
          doctor_id: profile?.id,
          doctor_name: profile?.full_name,
          ...prescriptionForm
        })
      });

      if (res.ok) {
        toast.success(editingRx ? 'Prescription updated' : 'Prescription saved');
        setPrescriptionForm({ medications: '', precautions: '', notes: '' });
        setEditingRx(null);
        fetchPatientHistory(patientId);
      }
    } catch {
      toast.error(editingRx ? 'Failed to update' : 'Failed to save');
    } finally {
      setIsSubmittingRx(false);
    }
  };

  const updateStatus = async (status: string) => {
    if (!profile) return;
    try {
      const res = await fetch(`/api/doctors/${profile.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setDoctorStatus(status);
        toast.success(`Status updated to ${status}`);
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleMarkAsDone = async (entryId: string) => {
    try {
      await fetch(`/api/queue/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'done', completed_at: new Date().toISOString() })
      });
      toast.success('Patient visit completed');
      fetchQueue();
    } catch {
      toast.error('Failed to update patient status');
    }
  };

  const startConsultation = async (entryId: string) => {
    try {
      await fetch(`/api/queue/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_progress', called_at: new Date().toISOString() })
      });
      toast.success('Consultation started');
      fetchQueue();
    } catch {
      toast.error('Failed to start consultation');
    }
  };

  const movetoPreparing = async (entryId: string) => {
    try {
      await fetch(`/api/queue/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'preparing', assigned_at: new Date().toISOString() })
      });
      toast.success('Patient notified to prepare (1 min)');
      fetchQueue();
    } catch {
      toast.error('Failed to notify patient');
    }
  };

  const currentPatient = queue.find(q => q.status === 'in_progress' || q.status === 'preparing') || queue[0];
  const upcomingPatients = queue.filter(q => q.id !== currentPatient?.id);

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-8 p-4 lg:p-8">
      {/* Top Bar: Doctor Status */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
           <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <Stethoscope size={32} />
           </div>
           <div>
              <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Consultation Desk</h1>
              <p className="text-slate-400 font-medium text-sm">Managing your daily patient roster</p>
           </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100 w-full md:w-auto">
           <span className="text-xs font-black text-slate-400 uppercase ml-3 mr-2">My Status:</span>
           <div className="flex gap-1 overflow-x-auto pb-1 md:pb-0">
             {['Available', 'In OT', 'On Visit', 'Away'].map(s => (
               <Button 
                key={s}
                variant={doctorStatus === s ? 'default' : 'ghost'} 
                size="sm" 
                className={`rounded-xl text-[10px] font-black uppercase tracking-tight h-10 px-4 ${
                  doctorStatus === s ? 'shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-slate-600'
                }`}
                onClick={() => updateStatus(s)}
               >
                 {s}
               </Button>
             ))}
           </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {currentPatient ? (
            <Card className={`border-0 shadow-2xl overflow-hidden ${
              currentPatient.status === 'in_progress' ? 'ring-2 ring-primary ring-offset-4' : 
              currentPatient.status === 'preparing' ? 'ring-2 ring-amber-500 ring-offset-4' : ''
            }`}>
              <CardHeader className={`${
                 currentPatient.status === 'in_progress' ? 'bg-primary text-white' : 
                 currentPatient.status === 'preparing' ? 'bg-amber-500 text-white' : 'bg-slate-900 text-white'
              } p-8`}>
                <div className="flex justify-between items-start">
                  <div>
                    <Badge variant="outline" className="text-white border-white/30 uppercase font-black text-[10px] tracking-widest mb-4">
                       {currentPatient.status.replace('_', ' ')}
                    </Badge>
                    <CardTitle className="text-4xl font-black uppercase tracking-tighter mb-1">
                      {currentPatient.patient_name || `Patient #${currentPatient.patient_id.slice(-4)}`}
                    </CardTitle>
                    <CardDescription className="text-white/70 font-medium">
                      Token ID: {currentPatient.queue_number.toString().padStart(3, '0')}
                    </CardDescription>
                  </div>
                  <div className="size-20 rounded-2xl bg-white/20 backdrop-blur-md flex flex-col items-center justify-center font-black text-3xl">
                     <span className="text-[10px] uppercase opacity-70">Token</span>
                     {currentPatient.queue_number}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-10 bg-white">
                <div className="grid md:grid-cols-2 gap-8 mb-10">
                   <div className="space-y-4">
                      <div className="flex items-center gap-3 text-slate-500">
                         <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center"><Clock size={18} /></div>
                         <div>
                            <p className="text-[10px] uppercase font-black tracking-widest opacity-60">Arrival Time</p>
                            <p className="font-bold">{format(new Date(currentPatient.created_at || new Date()), 'hh:mm a')}</p>
                         </div>
                      </div>
                      
                      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
                        <DialogTrigger render={
                          <Button variant="outline" className="w-full justify-start h-12 rounded-xl gap-3 border-dashed" onClick={() => fetchPatientHistory(currentPatient.patient_id)}>
                            <History size={18} className="text-primary" />
                            <span className="font-bold text-slate-700">View Medical History & Records</span>
                          </Button>
                        } />
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col rounded-[2rem]">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-2xl font-black uppercase tracking-tight">
                              <History className="text-primary" />
                              Case History: {currentPatient.patient_name}
                            </DialogTitle>
                            <DialogDescription>Review past reports and prescriptions before proceeding.</DialogDescription>
                          </DialogHeader>
                          
                          <ScrollArea className="flex-1 pr-4">
                            <div className="space-y-6 py-4">
                              {loadingHistory ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-3">
                                  <Loader2 size={32} className="animate-spin text-primary" />
                                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Accessing Archives...</p>
                                </div>
                              ) : (
                                <>
                                  <section>
                                    <h4 className="text-[10px] uppercase font-black tracking-widest text-primary mb-4 flex items-center gap-2">
                                      <FileText size={14} /> Medical Reports
                                    </h4>
                                    <div className="grid gap-3">
                                      {medicalHistory.reports.length === 0 ? (
                                        <p className="text-sm text-slate-400 italic bg-slate-50 p-4 rounded-xl">No reports found for this patient.</p>
                                      ) : (
                                        medicalHistory.reports.map((report: any) => (
                                          <div key={report.id} className="p-4 rounded-2xl border bg-white hover:border-primary/30 transition-all">
                                            <div className="flex justify-between items-start mb-2">
                                              <p className="font-bold text-slate-800">{report.file_name}</p>
                                              <Badge variant="secondary" className="text-[10px] uppercase font-black">{report.ai_risk_level || 'Normal'}</Badge>
                                            </div>
                                            <p className="text-xs text-slate-500 mb-3">{report.ai_diagnosis}</p>
                                            <Button size="sm" variant="ghost" className="h-8 text-[10px] font-black uppercase tracking-tight text-primary hover:text-primary hover:bg-primary/5" onClick={() => window.open(report.file_url)}>
                                              View Source Report
                                            </Button>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </section>

                                  <section>
                                    <h4 className="text-[10px] uppercase font-black tracking-widest text-primary mb-4 flex items-center gap-2">
                                      <Pill size={14} /> Past Prescriptions
                                    </h4>
                                    <div className="grid gap-3">
                                      {medicalHistory.prescriptions.length === 0 ? (
                                        <p className="text-sm text-slate-400 italic bg-slate-50 p-4 rounded-xl">No previous prescriptions recorded.</p>
                                      ) : (
                                        medicalHistory.prescriptions.map((px: any) => (
                                          <div key={px.id} className="p-4 rounded-2xl border bg-slate-50 group relative">
                                            <div className="flex justify-between mb-2">
                                              <p className="text-[10px] font-black text-slate-400 uppercase">{format(new Date(px.created_at), 'PPP')}</p>
                                              <div className="flex items-center gap-2">
                                                <p className="text-[10px] font-black text-primary uppercase">Dr. {px.doctor_name}</p>
                                                {px.doctor_id === profile?.id && (
                                                  <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="size-6 rounded-lg text-slate-400 hover:text-white hover:bg-primary opacity-0 group-hover:opacity-100 transition-all"
                                                    onClick={() => {
                                                      setEditingRx(px);
                                                      setPrescriptionForm({
                                                        medications: px.medications,
                                                        precautions: px.precautions || '',
                                                        notes: px.notes || ''
                                                      });
                                                      setIsHistoryDialogOpen(false);
                                                      setIsRxDialogOpen(true);
                                                    }}
                                                  >
                                                    <Edit2 size={12} />
                                                  </Button>
                                                )}
                                              </div>
                                            </div>
                                            <p className="text-xs font-bold text-slate-800 mb-1">Medications:</p>
                                            <p className="text-xs text-slate-600 mb-2">{px.medications}</p>
                                            {px.precautions && (
                                              <>
                                                <p className="text-xs font-bold text-slate-800 mb-1">Precautions:</p>
                                                <p className="text-xs text-slate-600">{px.precautions}</p>
                                              </>
                                            )}
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </section>
                                </>
                              )}
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                   </div>
                   
                   {currentPatient.status === 'preparing' && (
                     <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex flex-col items-center justify-center text-center">
                        <Timer className="text-amber-500 mb-2 animate-spin-slow" size={32} />
                        <p className="text-sm font-bold text-amber-700 uppercase tracking-tight">Patient Preparing...</p>
                        <p className="text-[10px] text-amber-600/70 font-medium">Buffer time allows you to review records.</p>
                     </div>
                   )}

                   {currentPatient.status === 'in_progress' && (
                      <div className="bg-primary/5 p-6 rounded-3xl border border-primary/20 flex flex-col justify-center">
                        <Dialog open={isRxDialogOpen} onOpenChange={setIsRxDialogOpen}>
                          <DialogTrigger render={
                            <Button className="w-full h-14 rounded-2xl font-black uppercase tracking-tight gap-2 shadow-xl shadow-primary/20" onClick={() => {
                              setEditingRx(null);
                              setPrescriptionForm({ medications: '', precautions: '', notes: '' });
                            }}>
                              <PlusCircle size={20} /> Write Prescription
                            </Button>
                          } />
                          <DialogContent className="max-w-md rounded-[2rem]">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2 text-2xl font-black uppercase tracking-tight">
                                {editingRx ? <Edit2 className="text-primary" /> : <PlusCircle className="text-primary" />}
                                {editingRx ? 'Edit Prescription' : 'New Prescription'}
                              </DialogTitle>
                              <DialogDescription>
                                {editingRx ? `Modifying advice for ${currentPatient.patient_name}` : `Adding medical guidance for ${currentPatient.patient_name}`}
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Medications & Dosage</label>
                                <Textarea 
                                  placeholder="e.g. Paracetamol 500mg - 1-0-1 after food (5 days)"
                                  className="min-h-[100px] rounded-2xl resize-none border-slate-200 focus:ring-primary"
                                  value={prescriptionForm.medications}
                                  onChange={(e) => setPrescriptionForm({...prescriptionForm, medications: e.target.value})}
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Precautions & Advice</label>
                                <Textarea 
                                  placeholder="e.g. Avoid cold water, bed rest for 2 days"
                                  className="min-h-[80px] rounded-2xl resize-none border-slate-200 focus:ring-primary"
                                  value={prescriptionForm.precautions}
                                  onChange={(e) => setPrescriptionForm({...prescriptionForm, precautions: e.target.value})}
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Internal Notes (Optional)</label>
                                <Input 
                                  placeholder="Any internal observation"
                                  className="h-12 rounded-xl border-slate-200 focus:ring-primary"
                                  value={prescriptionForm.notes}
                                  onChange={(e) => setPrescriptionForm({...prescriptionForm, notes: e.target.value})}
                                />
                              </div>
                            </div>

                            <DialogFooter>
                              <Button 
                                className="w-full h-14 rounded-2xl font-black uppercase tracking-tight shadow-xl shadow-primary/20"
                                onClick={() => handlePrescriptionSubmit(currentPatient.patient_id, currentPatient.patient_name)}
                                disabled={isSubmittingRx || !prescriptionForm.medications}
                              >
                                {isSubmittingRx ? <Loader2 className="animate-spin" /> : editingRx ? 'Update Prescription' : 'Sign & Complete Prescription'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                   )}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  {currentPatient.status === 'waiting' && (
                    <Button className="flex-1 h-16 text-lg font-black uppercase tracking-tighter gap-3 bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/20" onClick={() => movetoPreparing(currentPatient.id)}>
                      <Bell size={24} /> Call & Wait (1m)
                    </Button>
                  )}
                  {currentPatient.status === 'preparing' && (
                    <Button className="flex-1 h-16 text-lg font-black uppercase tracking-tighter gap-3 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" onClick={() => startConsultation(currentPatient.id)}>
                      <Activity size={24} /> Enter Consultation
                    </Button>
                  )}
                  {currentPatient.status === 'in_progress' && (
                    <Button className="flex-1 h-16 text-lg font-black uppercase tracking-tighter gap-3 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20" onClick={() => handleMarkAsDone(currentPatient.id)}>
                      <CheckCircle2 size={24} /> Complete Visit
                    </Button>
                  )}
                  <Button variant="outline" className="h-16 px-8 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50">
                    <UserMinus size={18} className="mr-2" /> Skip
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="flex flex-col items-center justify-center py-32 text-center border-dashed border-2 border-slate-200 bg-slate-50/50 rounded-[40px]">
              <div className="bg-white p-8 rounded-full mb-6 shadow-xl shadow-slate-200">
                <Timer size={48} className="text-slate-300" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">No Patients Waiting</h3>
              <p className="text-slate-400 font-medium max-w-xs mt-2 italic px-8">Relax Dr! New appointments will appear here with an alert.</p>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold text-slate-800">In Waiting</h2>
            <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-bold">{upcomingPatients.length}</Badge>
          </div>
          <ScrollArea className="h-[calc(100vh-350px)]">
            <div className="space-y-4 pr-4">
              {upcomingPatients.map((entry) => (
                <div key={entry.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between hover:border-primary/30 transition-all cursor-default group shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:text-primary transition-colors">
                      {entry.queue_number}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{entry.patient_name || 'Patient'}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Waiting</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              ))}
              {upcomingPatients.length === 0 && (
                <div className="py-20 text-center space-y-3">
                   <div className="size-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                      <UserMinus size={20} />
                   </div>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Clear Queue</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

