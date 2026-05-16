import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Search, Stethoscope, Clock, Activity, Loader2, 
  Plus, UserPlus, MonitorPlay, Check, X, AlertCircle, ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function AdminQueue() {
  const [queue, setQueue] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // New Token Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedDoctor, setSelectedDoctor] = useState('');

  const [viewMode, setViewMode] = useState<'flat' | 'doctor'>('doctor');

  const fetchData = async () => {
    try {
      const [qRes, dRes, pRes] = await Promise.all([
        fetch('/api/queue'),
        fetch('/api/doctors'),
        fetch('/api/auth/users?role=patient')
      ]);
      
      const qData = await qRes.json();
      const dData = await dRes.json();
      const pData = await pRes.json();
      
      setQueue(qData.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
      setDoctors(dData);
      setPatients(pData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const getDoctorQueue = (doctorId: string) => {
    return queue.filter(q => q.doctor_id === doctorId);
  };

  const handleUpdateDoctorStatus = async (doctorId: string, status: string) => {
    try {
      const response = await fetch(`/api/doctors/${doctorId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Update failed');
      toast.success(`Doctor status updated to ${status}`);
      fetchData();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleCreateToken = async () => {
    if (!selectedPatient || !selectedDoctor) {
      toast.error('Please select both patient and doctor');
      return;
    }

    try {
      const response = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          patient_name: selectedPatient.full_name,
          doctor_id: selectedDoctor,
          doctor_name: doctors.find(d => d.id === selectedDoctor)?.full_name || 'Dr.',
          status: 'waiting'
        })
      });

      if (!response.ok) throw new Error('Failed to create token');
      
      toast.success('Queue token issued successfully');
      setShowAddModal(false);
      setSelectedPatient(null);
      setSelectedDoctor('');
      fetchData();
    } catch {
      toast.error('Failed to issue token');
    }
  };

  const filteredPatients = patients.filter(p => 
    p.full_name?.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.id?.includes(patientSearch)
  );

  const filteredQueue = queue.filter(q => 
    q.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.queue_number?.toString().includes(searchTerm)
  );

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen">
      {/* Header with Stats */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Queue Management</h1>
          <p className="text-muted-foreground font-medium">Monitoring clinic flow and doctor availability</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="bg-white p-1 rounded-xl border border-slate-200 flex mr-4 shadow-sm">
            <Button 
              variant={viewMode === 'flat' ? 'default' : 'ghost'} 
              size="sm" 
              className="text-[10px] font-black uppercase h-8 px-4 rounded-lg"
              onClick={() => setViewMode('flat')}
            >
              Flat View
            </Button>
            <Button 
              variant={viewMode === 'doctor' ? 'default' : 'ghost'} 
              size="sm" 
              className="text-[10px] font-black uppercase h-8 px-4 rounded-lg"
              onClick={() => setViewMode('doctor')}
            >
              Doctor Wise
            </Button>
          </div>
          <Button 
            variant="outline" 
            className="gap-2 bg-white" 
            render={(props) => <Link {...props} to="/public-queue" target="_blank" />}
          >
            <MonitorPlay size={18} />
            Public View
          </Button>
          <Button className="gap-2 shadow-lg shadow-primary/20" onClick={() => setShowAddModal(true)}>
            <Plus size={18} />
            Issue New Token
          </Button>
        </div>
      </div>

      <div className="grid xl:grid-cols-4 gap-8">
        {/* Left: Queue List */}
        <div className="xl:col-span-3 space-y-6">
          {viewMode === 'doctor' ? (
            <div className="grid md:grid-cols-2 gap-6">
              {doctors.map(dr => {
                const drQueue = getDoctorQueue(dr.id);
                const active = drQueue.find(q => q.status === 'in_progress' || q.status === 'preparing');
                const waiting = drQueue.filter(q => q.status === 'waiting');

                return (
                  <Card key={dr.id} className="border-0 shadow-md group overflow-hidden bg-white/80 backdrop-blur-sm">
                    <CardHeader className="bg-slate-950 text-white p-6 relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-5 translate-x-4 -translate-y-4">
                          <Stethoscope size={80} />
                       </div>
                       <CardTitle className="relative z-10 flex items-center justify-between">
                          <div>
                            <div className="text-xs font-black text-primary/80 uppercase tracking-widest mb-1 italic">Room Active</div>
                            <div className="text-xl font-black uppercase tracking-tight">Dr. {dr.full_name}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{dr.specialization}</div>
                          </div>
                          <Badge className={`bg-white/10 text-white border-white/20 uppercase text-[10px] tracking-widest ${
                             dr.status === 'Available' ? 'text-green-400' : 
                             dr.status === 'In OT' ? 'text-red-400' : 'text-amber-400'
                          }`}>
                            {dr.status}
                          </Badge>
                       </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                       {/* Active Patient Section */}
                       <div className="p-6 bg-primary/5 border-b border-primary/10">
                          <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">Currently Consulted</div>
                          {active ? (
                            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-primary/20">
                               <div className={`size-14 rounded-xl flex flex-col items-center justify-center font-black text-2xl ${
                                 active.status === 'in_progress' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-amber-500 text-white animate-pulse'
                               }`}>
                                  <span className="text-[9px] uppercase opacity-70 leading-none mb-0.5">No</span>
                                  {active.queue_number}
                               </div>
                               <div>
                                  <div className="font-black text-slate-900 leading-tight">{active.patient_name}</div>
                                  <div className="text-[10px] uppercase font-bold text-slate-400">Started at {format(new Date(active.created_at), 'hh:mm a')}</div>
                               </div>
                               <Badge className="ml-auto bg-primary/10 text-primary border-primary/20 uppercase text-[8px] font-black tracking-widest h-5">
                                 {active.status.replace('_', ' ')}
                               </Badge>
                            </div>
                          ) : (
                            <div className="p-4 rounded-2xl border border-dashed border-primary/20 flex items-center justify-center text-primary/40 italic font-medium text-xs">
                               No active consultation
                            </div>
                          )}
                       </div>

                       {/* Waiting List Section */}
                       <div className="p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                               <Clock size={12} className="text-slate-300" /> Waiting List ({waiting.length})
                            </div>
                          </div>
                          <div className="space-y-2">
                             {waiting.length === 0 ? (
                               <div className="text-center py-6 text-slate-300 text-xs italic font-medium">Clear for now.</div>
                             ) : (
                               waiting.map((q, idx) => (
                                 <div key={q.id} className="group/item flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                    <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500">
                                       {q.queue_number}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                       <div className="text-xs font-bold text-slate-700 truncate">{q.patient_name}</div>
                                       <div className="text-[9px] uppercase font-bold text-slate-400">{idx === 0 ? 'NEXT IN LINE' : `${idx + 1} patients ahead`}</div>
                                    </div>
                                    <div className="opacity-0 group-hover/item:opacity-100 transition-opacity">
                                       <Button variant="ghost" size="icon" className="size-6 text-slate-300 hover:text-primary">
                                          <ArrowRight size={14} />
                                       </Button>
                                    </div>
                                 </div>
                               ))
                             )}
                          </div>
                       </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="bg-white border-b border-slate-100 flex flex-row items-center justify-between space-y-0 p-6">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                 <Activity size={20} className="text-primary" />
                 Live Queue Activity
              </CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search token or name..."
                  className="pl-8 bg-slate-50 border-slate-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {filteredQueue.length === 0 ? (
                  <div className="py-20 text-center text-muted-foreground italic">No tokens active at this moment.</div>
                ) : (
                  filteredQueue.map((item) => (
                    <div key={item.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-5">
                         <div className={`size-14 rounded-2xl flex flex-col items-center justify-center font-black text-2xl border ${
                           item.status === 'in_progress' ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 
                           item.status === 'preparing' ? 'bg-amber-500 text-white border-amber-500 animate-pulse' : 'bg-slate-50 text-slate-400 border-slate-200'
                         }`}>
                           <span className="text-[10px] uppercase font-bold tracking-tighter opacity-70">No</span>
                           {item.queue_number}
                         </div>
                         <div>
                            <h3 className="font-bold text-lg text-slate-800">{item.patient_name}</h3>
                            <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-400">
                               <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md">
                                  <Stethoscope size={12} className="text-primary" />
                                  <span>Assigned: Dr. {item.doctor_name || item.doctor_id}</span>
                               </div>
                               <div className="flex items-center gap-1.5 mt-1">
                                  <Clock size={12} />
                                  <span>Joined {format(new Date(item.created_at), 'hh:mm a')}</span>
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="flex items-center gap-4 w-full md:w-auto">
                        <Badge className={`px-4 py-1.5 rounded-full uppercase tracking-widest text-[10px] font-black ${
                          item.status === 'in_progress' ? 'bg-primary' : 
                          item.status === 'preparing' ? 'bg-amber-500' : 'bg-slate-200 text-slate-600'
                        }`} variant="secondary">
                          {item.status.replace('_', ' ')}
                        </Badge>
                        <div className="flex items-center gap-1 ml-auto md:ml-0">
                          <Button variant="ghost" size="sm" className="text-slate-400 font-bold hover:text-slate-600 uppercase tracking-tighter text-[10px]">
                            Controls
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
          )}
        </div>

        {/* Right: Doctor Status Controls */}
        <div className="space-y-6">
           <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 px-2">
              <Stethoscope size={20} className="text-primary" />
              Doctor Roster
           </h2>
           <div className="grid gap-3">
              {doctors.map((dr) => (
                <Card key={dr.id} className="border-0 shadow-sm bg-white overflow-hidden group">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className={`size-10 rounded-full flex items-center justify-center font-bold text-sm ${
                            dr.status === 'Available' ? 'bg-green-100 text-green-600' : 
                            dr.status === 'In OT' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                          }`}>
                            {dr.full_name?.[0]}
                          </div>
                          <div>
                             <div className="font-bold text-sm text-slate-800">Dr. {dr.full_name}</div>
                             <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">{dr.specialization}</div>
                          </div>
                       </div>
                       <Badge variant="outline" className={`text-[10px] uppercase font-black tracking-tighter ${
                          dr.status === 'Available' ? 'border-green-500 text-green-500' : 
                          dr.status === 'In OT' ? 'border-red-500 text-red-500' : 'border-amber-500 text-amber-500'
                       }`}>
                          {dr.status || 'OFFLINE'}
                       </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50">
                       <Button size="sm" variant="outline" className="text-[10px] font-bold uppercase h-8 hover:bg-green-50 hover:text-green-600 hover:border-green-200" onClick={() => handleUpdateDoctorStatus(dr.id, 'Available')}>
                          <Check size={12} className="mr-1" /> Available
                       </Button>
                       <Button size="sm" variant="outline" className="text-[10px] font-bold uppercase h-8 hover:bg-red-50 hover:text-red-600 hover:border-red-200" onClick={() => handleUpdateDoctorStatus(dr.id, 'In OT')}>
                          <AlertCircle size={12} className="mr-1" /> In OT
                       </Button>
                       <Button size="sm" variant="outline" className="text-[10px] font-bold uppercase h-8 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200" onClick={() => handleUpdateDoctorStatus(dr.id, 'On Visit')}>
                          On Visit
                       </Button>
                       <Button size="sm" variant="outline" className="text-[10px] font-bold uppercase h-8" onClick={() => handleUpdateDoctorStatus(dr.id, 'Away')}>
                          Away
                       </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
           </div>
        </div>
      </div>

      {/* Issuance Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
           <Card className="w-full max-w-lg shadow-2xl border-0 overflow-hidden">
              <CardHeader className="bg-slate-950 text-white p-6">
                 <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-black uppercase tracking-tight">Issue Token</CardTitle>
                      <p className="text-slate-400 text-sm font-medium">Search patient and assign consultation doctor</p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white" onClick={() => setShowAddModal(false)}>
                       <X size={24} />
                    </Button>
                 </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6 bg-white">
                 <div className="space-y-4">
                    <div className="space-y-2">
                       <Label className="text-xs font-black uppercase tracking-widest text-slate-400">1. Select Patient</Label>
                       <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input 
                             placeholder="Search patient by Name or ID..." 
                             className="pl-10 h-12"
                             value={patientSearch}
                             onChange={(e) => setPatientSearch(e.target.value)}
                          />
                       </div>
                       
                       {patientSearch && !selectedPatient && (
                         <div className="mt-2 border rounded-xl max-h-40 overflow-y-auto divide-y shadow-inner bg-slate-50">
                            {filteredPatients.length === 0 ? (
                               <p className="p-4 text-sm text-center text-muted-foreground">No matches found.</p>
                            ) : (
                               filteredPatients.map(p => (
                                 <button 
                                   key={p.id} 
                                   className="w-full p-4 text-left hover:bg-primary/5 flex justify-between items-center transition-colors"
                                   onClick={() => {
                                      setSelectedPatient(p);
                                      setPatientSearch(p.full_name);
                                   }}
                                 >
                                    <div>
                                       <p className="font-bold text-slate-800">{p.full_name}</p>
                                       <p className="text-[10px] text-slate-400 uppercase font-black">ID: {p.id.slice(-8)}</p>
                                    </div>
                                    <Plus size={16} className="text-primary" />
                                 </button>
                               ))
                            )}
                         </div>
                       )}

                       {selectedPatient && (
                          <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-xl">
                             <div className="flex items-center gap-3">
                                <UserPlus className="text-primary" size={18} />
                                <div>
                                   <p className="font-bold text-primary">{selectedPatient.full_name}</p>
                                   <p className="text-[10px] text-primary/70 uppercase font-black">Patient Selected</p>
                                </div>
                             </div>
                             <Button variant="ghost" size="sm" onClick={() => { setSelectedPatient(null); setPatientSearch(''); }}>
                                <X size={14} className="text-primary" />
                             </Button>
                          </div>
                       )}
                    </div>

                    <div className="space-y-2">
                       <Label className="text-xs font-black uppercase tracking-widest text-slate-400">2. Assign Doctor</Label>
                       <select 
                          className="w-full h-12 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                          value={selectedDoctor}
                          onChange={(e) => setSelectedDoctor(e.target.value)}
                       >
                          <option value="">Choose an available doctor...</option>
                          {doctors.map(d => (
                            <option key={d.id} value={d.id} disabled={d.status !== 'Available'}>
                               {d.full_name} ({d.specialization}) - {d.status}
                            </option>
                          ))}
                       </select>
                       <p className="text-[10px] italic text-slate-400">Only "Available" doctors can accept new tokens.</p>
                    </div>
                 </div>

                 <Button 
                    className="w-full h-14 text-lg font-black uppercase tracking-tighter shadow-xl shadow-primary/30" 
                    disabled={!selectedPatient || !selectedDoctor}
                    onClick={handleCreateToken}
                 >
                    Confirm & Issue Token
                 </Button>
              </CardContent>
           </Card>
        </div>
      )}
    </div>
  );
}

