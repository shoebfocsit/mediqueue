import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Search, User, FileText, Phone, Mail, Loader2, Filter,
  History, Pill, Edit2, PlusCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function DoctorPatients() {
  const { profile } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [medicalHistory, setMedicalHistory] = useState<{reports: any[], prescriptions: any[]}>({reports: [], prescriptions: []});
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isRxDialogOpen, setIsRxDialogOpen] = useState(false);
  const [editingRx, setEditingRx] = useState<any | null>(null);
  const [prescriptionForm, setPrescriptionForm] = useState({
    medications: '',
    precautions: '',
    notes: ''
  });
  const [isSubmittingRx, setIsSubmittingRx] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/auth/users');
      const data = await response.json();
      setPatients(data.filter((u: any) => u.role === 'patient'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

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

  const handlePrescriptionSubmit = async () => {
    if (!prescriptionForm.medications || !selectedPatient) {
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
          patient_id: selectedPatient.id,
          patient_name: selectedPatient.full_name,
          doctor_id: profile?.id,
          doctor_name: profile?.full_name,
          ...prescriptionForm
        })
      });

      if (res.ok) {
        toast.success(editingRx ? 'Prescription updated' : 'Prescription saved');
        setPrescriptionForm({ medications: '', precautions: '', notes: '' });
        setEditingRx(null);
        setIsRxDialogOpen(false);
        fetchPatientHistory(selectedPatient.id);
      }
    } catch {
      toast.error(editingRx ? 'Failed to update' : 'Failed to save');
    } finally {
      setIsSubmittingRx(false);
    }
  };

  const filteredPatients = patients.filter(p => 
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone?.includes(searchTerm)
  );

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Patient Records</h1>
          <p className="text-muted-foreground">Manage and view histories for all clinical patients</p>
        </div>
        <div className="flex gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline"><Filter size={18} /></Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPatients.length === 0 ? (
          <div className="col-span-full py-20 text-center text-muted-foreground">
            No patients found matching your search.
          </div>
        ) : (
          filteredPatients.map((patient) => (
            <Card key={patient.id} className="hover:shadow-md transition-shadow group">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg group-hover:bg-primary group-hover:text-white transition-colors">
                    {patient.full_name?.[0] || <User size={20} />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <h3 className="font-bold">{patient.full_name || 'Anonymous Patient'}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone size={12} />
                      <span>{patient.phone}</span>
                    </div>
                    {patient.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail size={12} />
                        <span className="truncate max-w-[150px]">{patient.email}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t grid grid-cols-2 gap-2">
                  <Dialog open={isHistoryDialogOpen && selectedPatient?.id === patient.id} onOpenChange={(open) => {
                    setIsHistoryDialogOpen(open);
                    if (open) setSelectedPatient(patient);
                  }}>
                    <DialogTrigger render={
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => fetchPatientHistory(patient.id)}>
                        <FileText size={14} />
                        Records
                      </Button>
                    } />
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col rounded-[2rem]">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-2xl font-black uppercase tracking-tight">
                          <History className="text-primary" />
                          Medical File: {patient.full_name}
                        </DialogTitle>
                        <DialogDescription>Review compiled history and reports.</DialogDescription>
                      </DialogHeader>
                      
                      <ScrollArea className="flex-1 pr-4">
                        <div className="space-y-6 py-4">
                          {loadingHistory ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                              <Loader2 size={32} className="animate-spin text-primary" />
                              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Compiling Records...</p>
                            </div>
                          ) : (
                            <>
                              <section>
                                <h4 className="text-[10px] uppercase font-black tracking-widest text-primary mb-4 flex items-center gap-2">
                                  <FileText size={14} /> Diagnostic Reports
                                </h4>
                                <div className="grid gap-3">
                                  {medicalHistory.reports.length === 0 ? (
                                    <p className="text-sm text-slate-400 italic bg-slate-50 p-4 rounded-xl">No reports found.</p>
                                  ) : (
                                    medicalHistory.reports.map((report: any) => (
                                      <div key={report.id} className="p-4 rounded-2xl border bg-white hover:border-primary/30 transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                          <p className="font-bold text-slate-800">{report.file_name}</p>
                                          <Badge variant="secondary" className="text-[10px] uppercase font-black">{report.ai_risk_level || 'Normal'}</Badge>
                                        </div>
                                        <p className="text-xs text-slate-500 mb-3">{report.ai_diagnosis}</p>
                                        <Button size="sm" variant="ghost" className="h-8 text-[10px] font-black uppercase tracking-tight text-primary hover:text-primary hover:bg-primary/5" onClick={() => window.open(report.file_url)}>
                                          View Full File
                                        </Button>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </section>

                              <section>
                                <h4 className="text-[10px] uppercase font-black tracking-widest text-primary mb-4 flex items-center gap-2">
                                  <Pill size={14} /> Prescriptions
                                </h4>
                                <div className="grid gap-3">
                                  {medicalHistory.prescriptions.length === 0 ? (
                                    <p className="text-sm text-slate-400 italic bg-slate-50 p-4 rounded-xl">No prescriptions recorded.</p>
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
                                            <p className="text-xs font-bold text-slate-800 mb-1">Advice:</p>
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
                  <Button variant="outline" size="sm" className="gap-2" render={<Link to="/doctor/queue" />} nativeButton={false}>
                      <User size={14} />
                      Consult
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Global Prescription Edit Dialog */}
      <Dialog open={isRxDialogOpen} onOpenChange={setIsRxDialogOpen}>
        <DialogContent className="max-w-md rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-black uppercase tracking-tight">
              {editingRx ? <Edit2 className="text-primary" /> : <PlusCircle className="text-primary" />}
              {editingRx ? 'Edit Prescription' : 'New Prescription'}
            </DialogTitle>
            <DialogDescription>
              {editingRx ? `Modifying advice for ${selectedPatient?.full_name}` : `Adding medical guidance for ${selectedPatient?.full_name}`}
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
          </div>

          <DialogFooter>
            <Button 
              className="w-full h-14 rounded-2xl font-black uppercase tracking-tight shadow-xl shadow-primary/20"
              onClick={handlePrescriptionSubmit}
              disabled={isSubmittingRx || !prescriptionForm.medications}
            >
              {isSubmittingRx ? <Loader2 className="animate-spin" /> : editingRx ? 'Update Prescription' : 'Sign & Complete Prescription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
