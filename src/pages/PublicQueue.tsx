import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Stethoscope, Activity, AlertCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

export default function PublicQueueBoard() {
  const [queue, setQueue] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const queueScrollRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    try {
      const [qRes, dRes] = await Promise.all([
        fetch('/api/queue'),
        fetch('/api/doctors')
      ]);
      const qData = await qRes.json();
      const dData = await dRes.json();
      
      setQueue(qData.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
      setDoctors(dData);
    } catch (err) {
      console.error('Failed to fetch public queue data:', err);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    fetchData();
    const interval = setInterval(fetchData, 3000); // Poll every 3s for "live" feel

    return () => {
      clearInterval(timer);
      clearInterval(interval);
    };
  }, []);

  // Auto-scroll logic for both containers
  useEffect(() => {
    if (!isAutoScroll) return;
    
    let animationId: number;
    let drScrollAmount = 0;
    let qScrollAmount = 0;
    const step = 0.4; // Very smooth slow speed

    const scroll = () => {
      if (!isAutoScroll) return;

      // Specialist Rooms Scroll
      if (scrollRef.current) {
        const container = scrollRef.current;
        drScrollAmount += step;
        if (drScrollAmount >= container.scrollHeight / 2) {
          drScrollAmount = 0;
        }
        container.scrollTop = drScrollAmount;
      }

      // Main Queue Scroll
      if (queueScrollRef.current) {
        const qContainer = queueScrollRef.current;
        if (qContainer.scrollHeight > qContainer.clientHeight) {
            qScrollAmount += step;
            if (qScrollAmount >= qContainer.scrollHeight - qContainer.clientHeight) {
                qScrollAmount = -100; // Pause at bottom before reset
            }
            qContainer.scrollTop = Math.max(0, qScrollAmount);
        }
      }

      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationId);
  }, [isAutoScroll, doctors, queue]);

  const getDoctorQueue = (doctorId: string) => {
    const drQueue = queue.filter(q => q.doctor_id === doctorId);
    const serving = drQueue.find(q => q.status === 'in_progress');
    const preparing = drQueue.find(q => q.status === 'preparing');
    const waiting = drQueue.filter(q => q.status === 'waiting');
    
    return {
      serving: serving?.queue_number || (preparing ? 'Req' : '--'),
      next: waiting[0]?.queue_number || '--',
      totalWaiting: waiting.length
    };
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 lg:p-10 font-sans overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6 border-b border-white/10 pb-8 shrink-0">
        <div className="flex items-center gap-6">
          <div className="size-20 bg-primary rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-primary/40 rotate-3">
            <Activity size={40} className="text-white" />
          </div>
          <div>
            <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">
              Live <span className="text-primary italic">Status</span> Board
            </h1>
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs mt-2 flex items-center gap-2">
              <span className="size-2 bg-green-500 rounded-full animate-pulse" />
              Real-time Hospital Queue Management
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-8 bg-slate-900/50 p-6 rounded-3xl border border-white/5 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-4 mr-4 pr-8 border-r border-white/10">
            <div className="text-right">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Display Mode</div>
              <div className="text-sm font-black text-white uppercase italic">{isAutoScroll ? 'Auto Rotating' : 'Static View'}</div>
            </div>
            <button 
              onClick={() => setIsAutoScroll(!isAutoScroll)}
              className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${isAutoScroll ? 'bg-primary' : 'bg-slate-800'}`}
            >
              <div className={`size-6 bg-white rounded-full transition-transform duration-300 ${isAutoScroll ? 'translate-x-6' : 'translate-x-0'} shadow-lg shadow-black/40`} />
            </button>
          </div>
          <div className="text-right">
            <div className="text-5xl font-mono font-black tabular-nums tracking-tighter text-white">
              {format(currentTime, 'HH:mm')}
              <span className="text-2xl ml-1 text-slate-500 font-bold">{format(currentTime, 'ss')}</span>
            </div>
            <div className="text-primary font-black uppercase tracking-widest text-xs mt-1">
              {format(currentTime, 'EEEE, MMMM do')}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-10 flex-1 overflow-hidden">
        {/* Main Queue Column (Left 3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-6 overflow-hidden">
          <div className="flex items-center justify-between px-2 shrink-0">
             <h2 className="flex items-center gap-3 text-2xl font-black uppercase tracking-tight text-white/90">
               <TrendingUp size={24} className="text-primary" /> Active Progression
             </h2>
             <div className="flex gap-2">
                <Badge className="bg-primary/20 text-primary border-primary/20 font-black">Live</Badge>
                <Badge variant="outline" className="text-slate-500 border-white/10">{queue.length} Active</Badge>
             </div>
          </div>

          <div 
            ref={queueScrollRef}
            className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-4"
          >
             <AnimatePresence mode="popLayout">
               {queue.length === 0 ? (
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="h-full flex flex-col items-center justify-center text-slate-500 bg-white/[0.02] rounded-[3rem] border-2 border-dashed border-white/5"
                 >
                   <Users size={120} className="mb-6 opacity-5" />
                   <p className="text-3xl font-black uppercase tracking-tight text-slate-400">Queue Resting</p>
                   <p className="font-bold text-slate-600">Patient updates will appear here automatically.</p>
                 </motion.div>
               ) : (
                 queue.map((entry) => (
                   <motion.div
                     key={entry.id}
                     layout
                     initial={{ x: -50, opacity: 0 }}
                     animate={{ x: 0, opacity: 1 }}
                     exit={{ x: 50, opacity: 0 }}
                     transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                   >
                     <Card className={`overflow-hidden border-0 transition-all duration-500 ${
                       entry.status === 'in_progress' ? 'bg-primary shadow-[0_0_50px_-12px_rgba(59,130,246,0.5)]' : 
                       entry.status === 'preparing' ? 'bg-amber-500 shadow-[0_0_50px_-12px_rgba(245,158,11,0.3)]' : 
                       'bg-white/[0.03] hover:bg-white/[0.06]'
                     }`}>
                       <CardContent className="p-8">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-10">
                               <div className={`size-32 rounded-[2rem] flex flex-col items-center justify-center font-black text-6xl shadow-2xl transition-transform ${
                                 entry.status === 'in_progress' || entry.status === 'preparing' ? 'bg-white text-black scale-110' : 'bg-slate-800 text-primary'
                               }`}>
                                  <span className="text-[12px] uppercase font-black tracking-widest opacity-60 mb-1">Token</span>
                                  {entry.queue_number}
                               </div>
                               <div>
                                  <h3 className={`text-4xl font-black uppercase tracking-tight ${entry.status === 'in_progress' || entry.status === 'preparing' ? 'text-white' : 'text-slate-200'}`}>
                                    {entry.patient_name}
                                  </h3>
                                  <div className="flex flex-wrap items-center gap-6 mt-4">
                                     <span className={`text-lg flex items-center gap-3 font-bold uppercase tracking-tight ${entry.status === 'in_progress' || entry.status === 'preparing' ? 'text-white/80' : 'text-slate-500'}`}>
                                        <div className="size-8 rounded-lg bg-current/10 flex items-center justify-center"><Stethoscope size={18} /></div> 
                                        Dr. {entry.doctor_name || entry.doctor_id}
                                     </span>
                                     <div className={`h-4 w-px ${entry.status === 'in_progress' ? 'bg-white/20' : 'bg-white/10'}`} />
                                     <span className={`text-lg flex items-center gap-3 font-bold uppercase tracking-tight ${entry.status === 'in_progress' || entry.status === 'preparing' ? 'text-white/80' : 'text-slate-500'}`}>
                                        <div className="size-8 rounded-lg bg-current/10 flex items-center justify-center"><Clock size={18} /></div>
                                        {format(new Date(entry.created_at), 'HH:mm')}
                                     </span>
                                  </div>
                               </div>
                            </div>

                            <div className="text-right">
                               <Badge className={`text-lg px-10 py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl ${
                                 entry.status === 'in_progress' ? 'bg-white text-primary' : 
                                 entry.status === 'preparing' ? 'bg-white text-amber-500' : 
                                 'bg-white/10 text-white border-0'
                               }`}>
                                 {entry.status === 'preparing' ? 'Entry Req' : entry.status.replace('_', ' ')}
                               </Badge>
                               {entry.status === 'preparing' && (
                                 <motion.div 
                                   animate={{ scale: [1, 1.1, 1] }} 
                                   transition={{ repeat: Infinity }}
                                   className="mt-4 text-sm font-black text-white uppercase tracking-[0.2em] italic"
                                 >
                                   Room Entry Soon • • •
                                 </motion.div>
                               )}
                            </div>
                         </div>
                       </CardContent>
                     </Card>
                   </motion.div>
                 ))
               )}
             </AnimatePresence>
          </div>
        </div>

        {/* Doctor Consultation Status (Right 2 cols) */}
        <div className="lg:col-span-2 flex flex-col gap-6 overflow-hidden text-slate-300">
          <div className="flex items-center justify-between px-2 shrink-0">
             <h2 className="flex items-center gap-3 text-2xl font-black uppercase tracking-tight text-white/90">
               <Stethoscope size={24} className="text-primary" /> Specialist Rooms
             </h2>
             <Badge variant="outline" className={`transition-all ${isAutoScroll ? 'text-primary border-primary/20 bg-primary/5' : 'text-slate-500 border-white/10'}`}>
                {isAutoScroll ? 'Auto-Scrolling' : 'Manual Scroll'}
             </Badge>
          </div>
          
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-scroll pr-2 no-scrollbar space-y-4"
          >
            {/* Duplicated for infinite scroll effect */}
            {doctors.length > 0 ? (
              [...doctors, ...doctors].map((dr, idx) => {
                const drQueue = getDoctorQueue(dr.id);
                return (
                  <Card 
                    key={`${dr.id}-${idx}`} 
                    className={`bg-slate-900/50 border-white/5 overflow-hidden transition-all duration-300 ${
                      dr.status === 'Available' ? 'hover:border-green-500/30' : 'opacity-80'
                    }`}
                  >
                    <CardContent className="p-0">
                      <div className="p-6 flex items-center justify-between border-b border-white/5">
                        <div className="flex items-center gap-5">
                          <div className={`size-16 rounded-2xl flex items-center justify-center font-black text-2xl border-2 shadow-2xl ${
                            dr.status === 'Available' ? 'border-green-500/50 bg-green-500/10 text-green-500' : 
                            dr.status === 'In OT' ? 'border-red-500/50 bg-red-500/10 text-red-500' : 
                            'border-amber-500/50 bg-amber-500/10 text-amber-500'
                          }`}>
                            {dr.full_name?.[0] || 'D'}
                          </div>
                          <div>
                            <h4 className="text-xl font-black uppercase tracking-tight text-white">Dr. {dr.full_name}</h4>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{dr.specialization || 'Consultant'}</p>
                          </div>
                        </div>
                        <Badge className={`px-4 py-1 rounded-full font-black text-[10px] uppercase tracking-widest ${
                           dr.status === 'Available' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                           dr.status === 'In OT' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                           'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }`} variant="outline">
                          {dr.status?.toUpperCase() || 'BUSY'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 bg-black/20">
                        <div className="p-6 border-r border-white/5 flex flex-col items-center justify-center">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Now Serving</span>
                          <div className={`text-4xl font-mono font-black ${drQueue.serving !== '--' ? 'text-primary animate-pulse' : 'text-slate-700'}`}>
                             {drQueue.serving}
                          </div>
                        </div>
                        <div className="p-6 flex flex-col items-center justify-center">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Next Up</span>
                          <div className={`text-4xl font-mono font-black ${drQueue.next !== '--' ? 'text-white' : 'text-slate-700'}`}>
                             {drQueue.next}
                          </div>
                        </div>
                      </div>

                      {drQueue.totalWaiting > 0 && (
                        <div className="px-6 py-3 bg-primary/5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-primary/70">
                           <span>Waiting in line</span>
                           <span className="flex items-center gap-2">
                             {drQueue.totalWaiting} Patients <ArrowRight size={10} />
                           </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            ) : (
                <div className="p-10 text-center text-slate-700 font-black uppercase tracking-widest border-2 border-dashed border-white/5 rounded-3xl">
                    Loading Room Data
                </div>
            )}
          </div>

          {/* Announcement Area */}
          <div className="shrink-0 p-8 bg-gradient-to-br from-slate-900 to-slate-950 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <AlertCircle size={80} />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                  <AlertCircle size={20} />
                </div>
                <h4 className="text-lg font-black uppercase tracking-tight text-white/90">Hospital Protocol</h4>
              </div>
              <p className="text-sm font-medium leading-relaxed text-slate-500">
                Please have your token ready. <span className="text-slate-300">Wait for your number to turn deep blue</span> before approaching the consultant entrance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
