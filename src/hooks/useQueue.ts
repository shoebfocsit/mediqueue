import { useState, useEffect } from 'react';

export interface QueueEntry {
  id: string;
  patient_id: string;
  doctor_id: string;
  queue_number: number;
  status: 'waiting' | 'in_progress' | 'done' | 'skipped';
  estimated_time: any;
  called_at: any;
  date: string;
}

export function useQueue(patientId?: string, doctorId?: string) {
  const [activeEntry, setActiveEntry] = useState<QueueEntry | null>(null);
  const [patientsAhead, setPatientsAhead] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId && !doctorId) {
      setLoading(false);
      return;
    }

    const fetchQueue = async () => {
      try {
        const params = new URLSearchParams();
        if (patientId) params.append('patient_id', patientId);
        if (doctorId) params.append('doctor_id', doctorId);
        
        const response = await fetch(`/api/queue?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch queue');
        
        const entries: QueueEntry[] = await response.json();
        
        if (patientId) {
          const active = entries.find(e => ['waiting', 'in_progress'].includes(e.status)) || null;
          setActiveEntry(active);
          
          if (active) {
            const docQueueResp = await fetch(`/api/queue?doctor_id=${active.doctor_id}`);
            const docEntries: QueueEntry[] = await docQueueResp.json();
            const ahead = docEntries.filter(e => 
              e.status === 'waiting' && e.queue_number < active.queue_number
            ).length;
            setPatientsAhead(ahead);
          }
        } else {
          // For doctor, entries are filtered by doctor_id already
          setActiveEntry(null); // Doctor doesn't have an "active entry" in the same sense
        }
      } catch (error) {
        console.error('Queue fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQueue();
    const interval = setInterval(fetchQueue, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [patientId, doctorId]);

  return { activeEntry, patientsAhead, loading };
}
