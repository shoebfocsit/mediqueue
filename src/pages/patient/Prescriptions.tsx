import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Pill, Calendar, Printer, AlertCircle, ShieldCheck
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function PatientPrescriptions() {
  const { profile } = useAuth();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const fetchPrescriptions = async () => {
      try {
        const response = await fetch(`/api/prescriptions?patient_id=${profile.id}`);
        if (!response.ok) throw new Error('Failed to fetch prescriptions');
        const data = await response.json();
        setPrescriptions(data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      } catch (err) {
        console.error(err);
        toast.error('Failed to load prescriptions');
      } finally {
        setLoading(false);
      }
    };
    fetchPrescriptions();
  }, [profile]);

  const handlePrint = (rx: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Prescription - MediQueue</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
            .doctor-info { text-align: right; }
            .rx-symbol { font-size: 40px; font-weight: bold; color: #3b82f6; margin-bottom: 20px; }
            .patient-box { background: #f8fafc; padding: 20px; border-radius: 10px; margin-bottom: 30px; }
            .medications { min-height: 200px; line-height: 1.6; }
            .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <h1>MediQueue Digital Rx</h1>
              <div class="doctor-info">
                <h3>Dr. ${rx.doctor_name}</h3>
                <p>Medical Practitioner</p>
              </div>
            </div>
          </div>
          <div class="patient-box">
            <p><strong>Patient:</strong> ${rx.patient_name}</p>
            <p><strong>Date:</strong> ${format(new Date(rx.created_at), 'PPP')}</p>
            <p><strong>Rx ID:</strong> ${rx.id}</p>
          </div>
          <div class="rx-symbol">Rx</div>
          <div class="medications">
            <h4>Medications & Dosage:</h4>
            <p>${rx.medications.replace(/\n/g, '<br>')}</p>
            
            ${rx.precautions ? `
              <h4>Precautions & Advice:</h4>
              <p>${rx.precautions.replace(/\n/g, '<br>')}</p>
            ` : ''}
          </div>
          <div class="footer">
            <p>This is a digitally generated prescription through MediQueue System.</p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Pill className="animate-bounce text-primary" size={40} />
        <p className="text-sm font-black uppercase tracking-widest text-slate-400">Loading your health history...</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">My Prescriptions</h1>
          <p className="text-slate-400 font-medium">Digital records of your medications and advice</p>
        </div>
        <div className="bg-green-50 px-4 py-2 rounded-full border border-green-100 flex items-center gap-2">
          <ShieldCheck className="text-green-600" size={18} />
          <span className="text-xs font-black uppercase text-green-700 tracking-tight">Verified Digital Records</span>
        </div>
      </div>

      {prescriptions.length === 0 ? (
        <Card className="border-dashed border-2 bg-slate-50/50 py-20 flex flex-col items-center justify-center text-center">
          <div className="size-20 rounded-full bg-white shadow-xl flex items-center justify-center mb-6">
            <Pill size={32} className="text-slate-200" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">No Prescriptions Yet</h3>
          <p className="text-slate-400 max-w-xs mt-2 italic px-8">Your doctor will see you shortly. Prescriptions appear here after consultation.</p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {prescriptions.map((rx) => (
            <Card key={rx.id} className="overflow-hidden border-0 shadow-xl shadow-slate-100 hover:shadow-2xl hover:shadow-primary/5 transition-all group rounded-[2rem]">
              <div className="bg-primary/5 p-6 border-b border-primary/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="size-14 rounded-2xl bg-white shadow-md flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Pill size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-black text-slate-800 uppercase tracking-tight">Dr. {rx.doctor_name}</p>
                      <Badge variant="outline" className="text-[9px] uppercase font-black border-primary/30 text-primary">Consultant</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                      <span className="flex items-center gap-1"><Calendar size={12} /> {format(new Date(rx.created_at), 'PPP')}</span>
                      <span className="flex items-center gap-1"><FileText size={12} /> RX-{rx.id.split('_')[1]}</span>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl h-12 px-6 gap-2 border-slate-200 text-slate-600 hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all w-full sm:w-auto"
                  onClick={() => handlePrint(rx)}
                >
                  <Printer size={16} />
                  <span className="font-black uppercase text-[10px] tracking-widest">Download / Print</span>
                </Button>
              </div>
              <CardContent className="p-8 grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                    <Pill size={14} /> Medication & Dosage
                  </h4>
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] rotate-12">
                      <Pill size={120} />
                    </div>
                    <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap relative z-10">
                      {rx.medications}
                    </p>
                  </div>
                </div>

                {rx.precautions && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 flex items-center gap-2">
                      <AlertCircle size={14} /> Safety Advice
                    </h4>
                    <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100/50">
                      <p className="text-slate-600 font-medium leading-relaxed italic">
                        "{rx.precautions}"
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
