import { db } from '@/db';
import { slips, vessels, users, docks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { BookingForm } from '@/components/booking/booking-form';

interface PageProps {
  searchParams: Promise<{ slipId?: string; date?: string }>;
}

export default async function NewBookingPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const [allSlips, allVessels, allBoaters] = await Promise.all([
    db.query.slips.findMany({ with: { dock: true }, orderBy: (s, { asc }) => [asc(s.number)] }),
    db.query.vessels.findMany({ with: { owner: true } }),
    db.query.users.findMany({ where: eq(users.role, 'boater') }),
  ]);

  const slipOptions = allSlips.map((s) => ({
    id: s.id,
    number: s.number,
    maxLength: s.maxLength,
    maxBeam: s.maxBeam,
    maxDraft: s.maxDraft,
    priceDaily: s.priceDaily,
    priceMonthly: s.priceMonthly,
    dock: { name: s.dock.name },
  }));

  const vesselOptions = allVessels.map((v) => ({
    id: v.id,
    name: v.name,
    type: v.type,
    loa: v.loa,
    beam: v.beam,
    draft: v.draft,
    ownerId: v.ownerId,
  }));

  const boaterOptions = allBoaters.map((b) => ({
    id: b.id,
    name: b.name,
    email: b.email,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">New Booking</h1>
        <p className="text-sm text-muted-foreground">
          Create a transient or seasonal booking for a slip
        </p>
      </div>
      <BookingForm
        slips={slipOptions}
        vessels={vesselOptions}
        boaters={boaterOptions}
        preSelectedSlipId={params.slipId ? Number(params.slipId) : undefined}
        preSelectedDate={params.date}
      />
    </div>
  );
}
