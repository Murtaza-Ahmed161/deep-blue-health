import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, Download, TrendingUp, Heart, Activity, Thermometer, Droplet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

interface VitalsEntry {
  id: string;
  created_at: string;
  heart_rate: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  oxygen_saturation: number | null;
  temperature: number | null;
  source: string | null;
}

const VitalsHistory = () => {
  const { user } = useAuth();
  const [vitals, setVitals] = useState<VitalsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'table' | 'chart'>('chart');

  useEffect(() => {
    if (user) {
      fetchVitalsHistory();
    }
  }, [user]);

  const fetchVitalsHistory = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vitals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setVitals(data || []);
    } catch (error) {
      console.error('Error fetching vitals history:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (vitals.length === 0) return;

    const headers = ['Date', 'Time', 'Heart Rate', 'Blood Pressure', 'Oxygen', 'Temperature', 'Source'];
    const rows = vitals.map(v => [
      format(new Date(v.created_at), 'yyyy-MM-dd'),
      format(new Date(v.created_at), 'HH:mm:ss'),
      v.heart_rate || '-',
      v.blood_pressure_systolic && v.blood_pressure_diastolic 
        ? `${v.blood_pressure_systolic}/${v.blood_pressure_diastolic}` 
        : '-',
      v.oxygen_saturation || '-',
      v.temperature || '-',
      v.source || 'manual'
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vitals-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Prepare chart data (reverse for chronological order)
  const chartData = [...vitals].reverse().map(v => ({
    time: format(new Date(v.created_at), 'HH:mm'),
    date: format(new Date(v.created_at), 'MMM dd'),
    heartRate: v.heart_rate,
    systolic: v.blood_pressure_systolic,
    diastolic: v.blood_pressure_diastolic,
    oxygen: v.oxygen_saturation,
    temperature: v.temperature
  }));

  // Calculate statistics
  const stats = {
    avgHeartRate: vitals.length > 0 
      ? Math.round(vitals.reduce((sum, v) => sum + (v.heart_rate || 0), 0) / vitals.filter(v => v.heart_rate).length)
      : 0,
    avgOxygen: vitals.length > 0
      ? Math.round(vitals.reduce((sum, v) => sum + (v.oxygen_saturation || 0), 0) / vitals.filter(v => v.oxygen_saturation).length)
      : 0,
    avgTemp: vitals.length > 0
      ? (vitals.reduce((sum, v) => sum + (v.temperature || 0), 0) / vitals.filter(v => v.temperature).length).toFixed(1)
      : 0,
    totalReadings: vitals.length
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vitals History</CardTitle>
          <CardDescription>Loading your health data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (vitals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vitals History</CardTitle>
          <CardDescription>Your health data timeline</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No vitals recorded yet</p>
            <p className="text-sm mt-2">Start entering your vitals to see trends and history</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-hover">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Heart Rate</p>
                <p className="text-2xl font-bold">{stats.avgHeartRate}</p>
                <p className="text-xs text-muted-foreground">bpm</p>
              </div>
              <Heart className="h-8 w-8 text-destructive opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Oxygen</p>
                <p className="text-2xl font-bold">{stats.avgOxygen}</p>
                <p className="text-xs text-muted-foreground">%</p>
              </div>
              <Droplet className="h-8 w-8 text-secondary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Temp</p>
                <p className="text-2xl font-bold">{stats.avgTemp}</p>
                <p className="text-xs text-muted-foreground">°C</p>
              </div>
              <Thermometer className="h-8 w-8 text-warning opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Readings</p>
                <p className="text-2xl font-bold">{stats.totalReadings}</p>
                <p className="text-xs text-muted-foreground">entries</p>
              </div>
              <Activity className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main History Card */}
      <Card className="animate-fade-in">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Vitals History
              </CardTitle>
              <CardDescription>
                Track your health trends over time
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={view === 'chart' ? 'default' : 'outline'}
                size="sm"
                className="btn-press"
                onClick={() => setView('chart')}
              >
                Chart
              </Button>
              <Button
                variant={view === 'table' ? 'default' : 'outline'}
                size="sm"
                className="btn-press"
                onClick={() => setView('table')}
              >
                Table
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="btn-press"
                onClick={exportToCSV}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {view === 'chart' ? (
            <div className="space-y-6">
              {/* Heart Rate Chart */}
              <div>
                <h4 className="text-sm font-medium mb-2">Heart Rate Trend</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="heartRate" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      dot={{ fill: '#ef4444' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Blood Pressure Chart */}
              <div>
                <h4 className="text-sm font-medium mb-2">Blood Pressure Trend</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="systolic" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Systolic"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="diastolic" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      name="Diastolic"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Oxygen Saturation Chart */}
              <div>
                <h4 className="text-sm font-medium mb-2">Oxygen Saturation Trend</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={[90, 100]} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="oxygen" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ fill: '#10b981' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Heart Rate</TableHead>
                    <TableHead>Blood Pressure</TableHead>
                    <TableHead>Oxygen</TableHead>
                    <TableHead>Temperature</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vitals.map((vital) => (
                    <TableRow key={vital.id}>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {format(new Date(vital.created_at), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-muted-foreground">
                            {format(new Date(vital.created_at), 'HH:mm:ss')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {vital.heart_rate ? (
                          <span className="font-medium">{vital.heart_rate} bpm</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {vital.blood_pressure_systolic && vital.blood_pressure_diastolic ? (
                          <span className="font-medium">
                            {vital.blood_pressure_systolic}/{vital.blood_pressure_diastolic}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {vital.oxygen_saturation ? (
                          <span className="font-medium">{vital.oxygen_saturation}%</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {vital.temperature ? (
                          <span className="font-medium">{vital.temperature}°C</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={vital.source === 'manual' ? 'outline' : 'secondary'}>
                          {vital.source || 'manual'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VitalsHistory;
