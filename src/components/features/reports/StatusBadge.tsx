import { STATUS_CONFIG } from '@/constants/categories';
import { ReportStatus } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  status: ReportStatus;
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

export default function StatusBadge({ status, size = 'md', dot = true }: Props) {
  const config = STATUS_CONFIG[status];
  const sizes = { sm: 'text-[10px] px-2 py-0.5', md: 'text-xs px-2.5 py-1', lg: 'text-sm px-3 py-1.5' };

  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full font-semibold', sizes[size])}
      style={{ color: config.color, backgroundColor: config.bgColor, border: `1px solid ${config.borderColor}` }}>
      {dot && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: config.color }} />}
      {config.label}
    </span>
  );
}
