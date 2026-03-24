'use client';

import type { SlipWithDetails } from '@/lib/dal/slips';

interface SlipDetailPanelProps {
  slip: SlipWithDetails | null;
  userRole: 'admin' | 'dock_staff' | 'boater';
  onClose: () => void;
}

// Stub - will be fully implemented in Task 2
export function SlipDetailPanel({ slip, userRole, onClose }: SlipDetailPanelProps) {
  return null;
}
