import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Map } from "lucide-react";

export default function OperationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Marina Operations
        </h1>
        <p className="mt-1 text-muted-foreground">
          Dock management and daily operations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Interactive Marina Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Map className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <h3 className="text-lg font-medium text-foreground">
              Marina Map coming in Phase 2
            </h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              The interactive SVG marina map with color-coded slip statuses,
              click-to-inspect details, and real-time occupancy will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
