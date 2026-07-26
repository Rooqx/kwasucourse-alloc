import { Badge } from '@/components/ui/badge';

interface AllocationStatusBadgeProps {
  status: 'DRAFT' | 'APPROVED' | 'FLAGGED' | 'RESOLVED' | string;
}

export function AllocationStatusBadge({ status }: AllocationStatusBadgeProps) {
  let bgColor = 'var(--status-draft, #4A6FA5)';
  let color = 'white';

  switch (status.toUpperCase()) {
    case 'APPROVED':
      bgColor = 'var(--status-approved, #256226)';
      break;
    case 'FLAGGED':
      bgColor = 'var(--status-flagged, #C2740A)';
      break;
    case 'RESOLVED':
      bgColor = 'var(--status-draft, #4A6FA5)';
      break;
    case 'DRAFT':
    default:
      bgColor = 'var(--status-draft, #4A6FA5)';
      break;
  }

  return (
    <Badge style={{ backgroundColor: bgColor, color }}>
      {status}
    </Badge>
  );
}
