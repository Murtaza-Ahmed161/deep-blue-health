import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Loader2, Calendar } from 'lucide-react';
import { useDailyReport } from '@/hooks/useDailyReport';
import { generateDailyReportPdf } from '@/lib/dailyReportPdf';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface DailyReportCardProps {
  /** For doctor view: patient id to generate report for. Omit for patient's own report. */
  patientId?: string;
  /** Optional date (YYYY-MM-DD). Defaults to today. */
  date?: string;
  /** Compact layout for embedding in doctor patient detail */
  compact?: boolean;
}

export default function DailyReportCard({ patientId, date, compact }: DailyReportCardProps) {
  const { toast } = useToast();
  const { fetchReport, loading, error } = useDailyReport(patientId);

  const handleGenerateAndDownload = async () => {
    const report = await fetchReport(date);
    if (!report) {
      toast({
        title: 'Report failed',
        description: error || 'Could not generate report. Try again.',
        variant: 'destructive',
      });
      return;
    }
    try {
      generateDailyReportPdf(report);
      toast({
        title: 'Report downloaded',
        description: `Daily report for ${format(new Date(report.date), 'PPP')} saved.`,
      });
    } catch (e) {
      toast({
        title: 'Download failed',
        description: e instanceof Error ? e.message : 'Could not create PDF.',
        variant: 'destructive',
      });
    }
  };

  const reportDate = date ? format(new Date(date), 'PPP') : 'today';

  if (compact) {
    return (
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Daily report
          </CardTitle>
          <CardDescription>Generate and download PDF for {reportDate}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Button
            onClick={handleGenerateAndDownload}
            disabled={loading}
            size="sm"
            className="w-full sm:w-auto"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {loading ? 'Generating…' : 'Download PDF'}
          </Button>
          {error && (
            <p className="text-sm text-destructive mt-2">{error}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Daily health report
            </CardTitle>
            <CardDescription>
              Generate an end-of-day PDF with vitals summary, flagged events, and recommendations for {reportDate}.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleGenerateAndDownload}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {loading ? 'Generating report…' : 'Generate & download PDF'}
          </Button>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Report date: {reportDate}
          </span>
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}
