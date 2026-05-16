import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Eye, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function PatientReports() {
  const { profile } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const fetchReports = async () => {
      try {
        const response = await fetch(`/api/reports?patient_id=${profile.id}`);
        if (!response.ok) throw new Error('Failed to fetch reports');
        const data = await response.json();
        setReports(data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [profile]);

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Medical Records</h1>
        <p className="text-muted-foreground">Access your lab results, prescriptions, and AI summaries</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {reports.length === 0 ? (
          <Card className="md:col-span-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <FileText size={48} className="mb-4 opacity-20" />
              <p>No medical records found.</p>
            </CardContent>
          </Card>
        ) : (
          reports.map((report) => (
            <Card key={report.id} className="group hover:shadow-lg transition-all border-l-4 border-l-primary">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText size={18} className="text-primary" />
                      {report.file_name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <Calendar size={14} />
                      {format(new Date(report.created_at), 'PPP')}
                    </CardDescription>
                  </div>
                  <Badge variant={report.ai_risk_level === 'High' ? 'destructive' : 'outline'} className="capitalize">
                    Risk: {report.ai_risk_level || 'Low'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 p-3 rounded-lg text-sm italic">
                  "{report.ai_diagnosis}"
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-2" render={<a href={report.file_url} target="_blank" rel="noopener noreferrer" />} nativeButton={false}>
                      <Eye size={14} />
                      View File
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 gap-2">
                    <Download size={14} />
                    Download
                  </Button>
                </div>

                {report.ai_recommendations && (
                  <div className="pt-2 border-t text-xs text-muted-foreground">
                    <div className="flex items-center gap-1 font-semibold text-foreground mb-1">
                      <AlertCircle size={12} className="text-primary" />
                      Doctor's Notes (AI Summary)
                    </div>
                    {report.ai_recommendations}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
