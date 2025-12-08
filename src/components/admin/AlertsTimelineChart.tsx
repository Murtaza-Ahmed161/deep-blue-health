import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface AlertData {
  date: string;
  critical: number;
  warning: number;
  info: number;
}

interface AlertsTimelineChartProps {
  data: AlertData[];
}

const AlertsTimelineChart = ({ data }: AlertsTimelineChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alerts Timeline</CardTitle>
        <CardDescription>Alert frequency by severity over the past week</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs fill-muted-foreground"
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                className="text-xs fill-muted-foreground"
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Bar dataKey="critical" stackId="a" fill="hsl(var(--destructive))" name="Critical" />
              <Bar dataKey="warning" stackId="a" fill="hsl(var(--warning))" name="Warning" />
              <Bar dataKey="info" stackId="a" fill="hsl(var(--primary))" name="Info" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default AlertsTimelineChart;
