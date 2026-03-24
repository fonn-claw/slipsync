import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export default function MyBookingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          My Bookings
        </h1>
        <p className="mt-1 text-muted-foreground">
          View and manage your marina reservations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Reservations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <h3 className="text-lg font-medium text-foreground">
              Booking management coming in Phase 3
            </h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Your current and past reservations, booking details, and the
              ability to request new bookings will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
