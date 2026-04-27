import { Badge } from "./ui/badge";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    
    // Selesai / Success states
    if (statusLower.includes('selesai') || statusLower.includes('approved') || statusLower.includes('completed') || statusLower.includes('active') || statusLower.includes('delivered')) {
      return 'bg-success text-success-foreground';
    }
    
    // Proses / In Progress states
    if (statusLower.includes('proses') || statusLower.includes('progress') || statusLower.includes('planned') || statusLower.includes('pending') || statusLower.includes('revision') || statusLower.includes('revisi')) {
      return 'bg-warning text-warning-foreground';
    }
    
    // Draft / New states
    if (statusLower.includes('draft') || statusLower.includes('new') || statusLower.includes('baru')) {
      return 'bg-info text-info-foreground';
    }
    
    // Issue / Problem states
    if (statusLower.includes('issue') || statusLower.includes('rejected') || statusLower.includes('cancelled') || statusLower.includes('overdue') || statusLower.includes('inactive')) {
      return 'bg-destructive text-destructive-foreground';
    }
    
    // Default
    return 'bg-secondary text-secondary-foreground';
  };

  return (
    <Badge className={`${getStatusColor(status)} font-medium text-[10px] px-1.5 py-0`}>
      {status}
    </Badge>
  );
}