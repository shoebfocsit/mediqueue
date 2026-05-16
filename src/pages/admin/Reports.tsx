import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { GoogleGenAI } from '@google/genai';

async function fileToGenerativePart(file: File) {
  const base64EncodedDataPromise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise as string, mimeType: file.type },
  };
}

export default function AdminReports() {
  const { profile } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [patientId, setPatientId] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/reports');
      const data = await response.json();
      setReports(data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleUpload = async () => {
    if (!file || !patientId) {
      toast.error('Please select a file and enter patient ID');
      return;
    }

    setAnalyzing(true);
    try {
      // 1. Upload to Storage
      const storageRef = ref(storage, `reports/${patientId}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const fileUrl = await getDownloadURL(storageRef);

      // 2. Trigger AI Analysis (Frontend)
      if (!process.env.GEMINI_API_KEY) {
        toast.error('Gemini API Key is missing. Check Settings > Secrets.');
        setAnalyzing(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: [
          {
            role: 'user',
            parts: [
              await fileToGenerativePart(file),
              { text: "Analyze this medical report. Return ONLY a raw JSON object with fields: diagnosis, summary, key_findings(array), risk_level(low/medium/high/critical), doctor_recommendations(array). No markdown." }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json'
        }
      });

      const result = await model;
      const analysisText = result.text.replace(/```json|```/g, '').trim();
      const analysis = JSON.parse(analysisText);
      setAnalysisResult(analysis);

      // 3. Save to server JSON
      try {
        const responseSave = await fetch('/api/reports/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient_id: patientId,
            uploaded_by: profile?.id,
            file_url: fileUrl,
            file_name: file.name,
            file_type: file.type,
            ai_diagnosis: analysis.diagnosis,
            ai_summary: analysis.summary,
            ai_recommendations: analysis.doctor_recommendations,
            ai_risk_level: analysis.risk_level,
            processing_status: 'completed'
          })
        });

        if (!responseSave.ok) throw new Error('Failed to save report to server');
        
        toast.success('Report uploaded and analyzed successfully');
        await fetchReports();
        setFile(null);
        setPatientId('');
      } catch (err) {
        console.error('Save error:', err);
        toast.error('Failed to save analysis to server');
      }

    } catch (error) {
      console.error(error);
      toast.error('Failed to process report');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">AI Medical Analysis</h1>
        <p className="text-muted-foreground">Upload lab reports and get instant AI-powered insights.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Report Upload</CardTitle>
            <CardDescription>Supported formats: PDF, Images (Max 10MB)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Patient ID</Label>
              <Input 
                placeholder="Enter patient document ID..." 
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>File</Label>
              <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-3 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => document.getElementById('file-upload')?.click()}>
                <Upload size={32} className="text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {file ? file.name : 'Click to select or drag and drop'}
                </p>
                <input 
                  id="file-upload" 
                  type="file" 
                  className="hidden" 
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            <Button className="w-full" size="lg" disabled={analyzing || !file || !patientId} onClick={handleUpload}>
              {analyzing ? (
                <>
                  <Loader2 className="mr-2 animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                'Upload & Analyze'
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {analysisResult ? (
            <Card className="border-primary/50 overflow-hidden shadow-lg animate-in zoom-in-95 duration-300">
              <CardHeader className="bg-primary/5 pb-4">
                 <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                       <div className="text-primary"><CheckCircle2 size={24} /></div>
                       AI Analysis Result
                    </CardTitle>
                    <Badge className={
                      analysisResult.risk_level === 'critical' ? 'bg-destructive' :
                      analysisResult.risk_level === 'high' ? 'bg-orange-500' :
                      'bg-green-500'
                    }>
                      {analysisResult.risk_level.toUpperCase()} RISK
                    </Badge>
                 </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1">Diagnosis</h4>
                  <p className="text-lg font-semibold">{analysisResult.diagnosis}</p>
                </div>
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1">Summary</h4>
                  <p className="text-sm italic text-muted-foreground leading-relaxed">
                    "{analysisResult.summary}"
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1">Key Findings</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {analysisResult.key_findings.map((f: string, i: number) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-10 text-center opacity-50">
              <AlertCircle size={40} className="text-muted-foreground mb-4" />
              <p>Upload a report to see the AI analysis result here.</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold">Recent System Reports</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loadingReports ? (
             <div className="col-span-full py-10 text-center"><Loader2 className="mx-auto animate-spin" /></div>
          ) : reports.length === 0 ? (
             <p className="col-span-full text-center text-muted-foreground py-10 border rounded-xl border-dashed">No reports processed yet.</p>
          ) : (
             reports.map(r => (
               <Card key={r.id}>
                 <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                       <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">Patient: {r.patient_id}</Badge>
                       <span className="text-[10px] text-muted-foreground">{format(new Date(r.created_at), 'MMM dd')}</span>
                    </div>
                    <p className="font-bold text-sm truncate">{r.file_name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 italic">"{r.ai_diagnosis}"</p>
                    <Button variant="ghost" size="sm" className="w-full h-8 text-xs" render={<a href={r.file_url} target="_blank" rel="noopener noreferrer" />} nativeButton={false}>
                       View Diagnostic
                    </Button>
                 </CardContent>
               </Card>
             ))
          )}
        </div>
      </div>
    </div>
  );
}
