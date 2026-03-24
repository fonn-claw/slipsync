import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Anchor, Ship, DollarSign, TrendingUp } from "lucide-react";

const stats = [
  {
    title: "Total Slips",
    value: "60",
    description: "Across 4 docks",
    icon: Anchor,
    badge: null,
  },
  {
    title: "Occupancy",
    value: "--",
    description: "Coming in Phase 4",
    icon: Ship,
    badge: "Soon",
  },
  {
    title: "Monthly Revenue",
    value: "--",
    description: "Coming in Phase 4",
    icon: DollarSign,
    badge: "Soon",
  },
  {
    title: "Trend",
    value: "--",
    description: "Coming in Phase 4",
    icon: TrendingUp,
    badge: "Soon",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-muted-foreground">
          Welcome to Sunset Harbor Marina management
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {stat.badge}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Marina Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Anchor className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <h3 className="text-lg font-medium text-foreground">
              Dashboard analytics coming in Phase 4
            </h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Occupancy rates, revenue charts, upcoming arrivals, and waitlist
              management will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
