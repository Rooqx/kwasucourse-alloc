import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';

interface ConflictBadgeProps {
  hasConflict: boolean;
}

export function ConflictBadge({ hasConflict }: ConflictBadgeProps) {
  if (!hasConflict) return null;

  return (
    <Badge variant="outline" className="gap-1" style={{ borderColor: 'var(--status-conflict, #B3261E)', color: 'var(--status-conflict, #B3261E)' }}>
      <AlertCircle className="size-3" />
      Conflict
    </Badge>
  );
}
