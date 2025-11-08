import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileText, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ReportUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Mock file URL - in production, would upload to storage
      const mockFileUrl = `https://example.com/reports/${file.name}`;

      // Insert report record
      const { data: report, error: insertError } = await supabase
        .from('medical_reports')
        .insert({
          user_id: user.id,
          file_url: mockFileUrl,
          file_name: file.name,
          file_type: file.type,
          status: 'pending'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Process report with AI
      const { data: functionData, error: functionError } = await supabase.functions.invoke('process-report', {
        body: { reportId: report.id }
      });

      if (functionError) throw functionError;

      toast({
        title: "Report uploaded successfully",
        description: "AI analysis complete",
      });

      // Refresh reports list
      loadReports();
    } catch (error: any) {
      console.error('Error uploading report:', error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const loadReports = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('medical_reports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setReports(data);
    }
  };

  useState(() => {
    loadReports();
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed': return 'default';
      case 'processing': return 'secondary';
      case 'approved': return 'success';
      default: return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Medical Reports
        </CardTitle>
        <CardDescription>Upload and track your medical documents</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
          <Input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="flex flex-col items-center gap-2">
              {uploading ? (
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              ) : (
                <Upload className="h-8 w-8 text-muted-foreground" />
              )}
              <p className="text-sm text-muted-foreground">
                {uploading ? 'Uploading and analyzing...' : 'Click to upload PDF, JPG, or PNG'}
              </p>
            </div>
          </label>
        </div>

        {reports.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Recent Reports</h4>
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-3 border border-border rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{report.file_name}</p>
                    {report.ai_summary && (
                      <p className="text-xs text-muted-foreground truncate">{report.ai_summary}</p>
                    )}
                  </div>
                </div>
                <Badge variant={getStatusColor(report.status) as any}>
                  {report.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReportUpload;