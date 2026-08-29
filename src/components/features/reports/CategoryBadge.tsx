import { getCategoryById } from '@/constants/categories';
import { CategoryId } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  categoryId: CategoryId;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export default function CategoryBadge({ categoryId, size = 'md', showLabel = true }: Props) {
  const cat = getCategoryById(categoryId);
  const sizes = { sm: 'text-xs px-2 py-0.5', md: 'text-xs px-2.5 py-1' };

  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full font-medium', sizes[size])}
      style={{ color: cat.color, backgroundColor: cat.bgColor }}>
      <span>{cat.icon}</span>
      {showLabel && <span>{cat.name}</span>}
    </span>
  );
}
