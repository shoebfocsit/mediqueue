import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQueue } from '@/hooks/useQueue';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MapPin, Clock, Bell, Hospital, Timer, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function PatientQueue() {
  const { profile } = useAuth();
  const { activeEntry, patientsAhead, loading } = useQueue(profile?.id);
  const [prepTime, setPrepTime] = useState<number>(0);

  useEffect(() => {
    if (activeEntry?.status === 'preparing' && activeEntry.assigned_at) {
      const assigned = new Date(activeEntry.assigned_at).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, 60 - Math.floor((now - assigned) / 1000));
      setPrepTime(diff);

      const timer = setInterval(() => {
        setPrepTime(prev => {
          if (prev <= 0) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [activeEntry?.status, activeEntry?.assigned_at]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!activeEntry) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-primary border border-primary/20">
          <Hospital size={40} />
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tight mb-2">No Active Token</h2>
        <p className="text-slate-500 mb-6 font-medium">
          You are not currently in any session. Please visit the front desk or book an appointment to join the queue.
        </p>
      </div>
    );
  }

  const progress = activeEntry.status === 'in_progress' ? 100 : activeEntry.status === 'preparing' ? 95 : Math.max(0, 100 - (patientsAhead * 10));

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">Queue Status</h1>
          <p className="text-slate-400 font-medium">Live updates for your consultation</p>
        </div>
        <Badge className={`uppercase tracking-widest text-[10px] font-black px-4 py-1 flex items-center gap-1.5 ${
          activeEntry.status === 'in_progress' ? 'bg-primary' : 
          activeEntry.status === 'preparing' ? 'bg-amber-500 animate-pulse' : 'bg-slate-100 text-slate-500'
        }`}>
          {activeEntry.status === 'preparing' && <Timer size={10} />}
          {activeEntry.status.replace('_', ' ')}
        </Badge>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Card className={`overflow-hidden border-0 shadow-2xl ${
           activeEntry.status === 'preparing' ? 'ring-4 ring-amber-500/20' : 
           activeEntry.status === 'in_progress' ? 'ring-4 ring-primary/20' : ''
        }`}>
          <div className={`${
            activeEntry.status === 'in_progress' ? 'bg-primary' : 
            activeEntry.status === 'preparing' ? 'bg-amber-500' : 'bg-slate-900'
          } p-8 text-white`}>
            <div className="flex justify-between items-start mb-10">
              <div>
                <p className="text-white/60 text-xs font-black uppercase tracking-widest mb-1">Your Token Number</p>
                <div className="text-6xl font-black tracking-tighter">
                  {activeEntry.queue_number.toString().padStart(3, '0')}
                </div>
              </div>
              <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md shadow-inner">
                <Bell size={28} className={activeEntry.status === 'preparing' ? 'animate-bounce' : ''} />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs uppercase font-black tracking-widest opacity-80">
                <span>Visit Progress</span>
                <span>{activeEntry.status === 'in_progress' ? 'It\'s your turn!' : activeEntry.status === 'preparing' ? 'Get Ready!' : `${patientsAhead} ahead`}</span>
              </div>
              <Progress value={progress} className="h-2 bg-white/20" indicatorClassName="bg-white" />
            </div>
          </div>

          <CardContent className="p-8 space-y-8 bg-white">
            <AnimatePresence mode="wait">
              {activeEntry.status === 'preparing' && (
                <motion.div 
                   initial={{ height: 0, opacity: 0 }}
                   animate={{ height: 'auto', opacity: 1 }}
                   className="bg-amber-50 border border-amber-200 p-6 rounded-3xl text-center space-y-3"
                >
                   <div className="flex items-center justify-center gap-3 text-amber-600">
                      <Timer className="animate-spin-slow" size={32} />
                      <span className="text-4xl font-black tabular-nums">{prepTime}s</span>
                   </div>
                   <h3 className="text-xl font-bold text-amber-800 uppercase tracking-tight">Time to move!</h3>
                   <p className="text-sm text-amber-700 font-medium">Please proceed to the doctor's cabin now. The doctor is preparing for you.</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-2 gap-8 divide-x divide-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase font-black tracking-widest mb-2">
                  <MapPin size={12} />
                  <span>Direction</span>
                </div>
                <p className="font-black text-slate-800">Main Clinic<br /> Cabin Room {activeEntry.doctor_id ? '04' : 'Triage'}</p>
              </div>
              <div className="space-y-1 text-right pl-8">
                <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase font-black tracking-widest justify-end mb-2">
                  <Clock size={12} />
                  <span>Wait Est.</span>
                </div>
                <p className="font-black text-slate-800 text-3xl">{activeEntry.status === 'in_progress' ? '0' : patientsAhead * 10} <span className="text-sm">mins</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="space-y-4">
        <h3 className="font-black text-xl uppercase tracking-tight text-slate-800 px-2 italic">Preparation Steps</h3>
        <div className="grid gap-3">
          {[
            { title: 'Check-in confirmed', desc: 'Your arrival has been registered by the front desk.', done: true },
            { title: 'Prepare for consultation', desc: 'The doctor is ready soon. Keep your reports handy.', done: activeEntry.status === 'preparing' || activeEntry.status === 'in_progress' },
            { title: 'Doctor consultation', desc: 'Discuss your symptoms and medical history with the doctor.', done: activeEntry.status === 'in_progress' },
          ].map((step, i) => (
            <div key={i} className={`flex gap-5 p-5 rounded-3xl border transition-all ${step.done ? 'bg-green-50/50 border-green-100 ring-4 ring-green-500/5' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
              <div className={`size-8 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm ${step.done ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-400 font-bold'}`}>
                {step.done ? <CheckCircle2 size={18} /> : i + 1}
              </div>
              <div>
                <p className={`font-black text-sm uppercase tracking-tight ${step.done ? 'text-green-800' : 'text-slate-600'}`}>{step.title}</p>
                <p className="text-xs text-slate-500 font-medium">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

