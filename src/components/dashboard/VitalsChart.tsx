import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useMemo } from "react";

const VitalsChart = () => {
  // Memoize data to prevent unnecessary re-renders
  const data = useMemo(() => [
    { time: "00:00", heartRate: 72, bp: 120 },
    { time: "04:00", heartRate: 68, bp: 118 },
    { time: "08:00", heartRate: 75, bp: 122 },
    { time: "12:00", heartRate: 82, bp: 128 },
    { time: "16:00", heartRate: 78, bp: 125 },
    { time: "20:00", heartRate: 74, bp: 121 },
  ], []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vitals Trend</CardTitle>
        <CardDescription>Last 24 hours average</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="time" 
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              stroke="hsl(var(--border))"
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              stroke="hsl(var(--border))"
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
              }}
              animationDuration={200}
            />
            <Line 
              type="monotone" 
              dataKey="heartRate" 
              stroke="hsl(var(--destructive))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--destructive))' }}
              isAnimationActive={false}
            />
            <Line 
              type="monotone" 
              dataKey="bp" 
              stroke="hsl(var(--secondary))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--secondary))' }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-destructive" />
            <span className="text-sm text-muted-foreground">Heart Rate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-secondary" />
            <span className="text-sm text-muted-foreground">Blood Pressure</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VitalsChart;
