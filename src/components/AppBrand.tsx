import { cn } from '@/lib/utils';

type AppBrandSize = 'sm' | 'md' | 'lg';

const titleClass: Record<AppBrandSize, string> = {
  sm: 'text-lg sm:text-xl',
  md: 'text-xl sm:text-2xl',
  lg: 'text-2xl sm:text-3xl',
};

const subtitleClass: Record<AppBrandSize, string> = {
  sm: 'text-[8px] sm:text-[9px]',
  md: 'text-[9px] sm:text-[10px]',
  lg: 'text-[10px] sm:text-xs',
};

export function AppBrand({
  className,
  size = 'md',
}: {
  className?: string;
  size?: AppBrandSize;
}) {
  return (
    <div className={cn('flex flex-col', className)}>
      <span className={cn('font-bold tracking-tight leading-none text-gradient-brand', titleClass[size])}>
        ArxWiser
      </span>
      <span
        className={cn(
          'mt-1 font-semibold uppercase tracking-[0.22em] text-muted-foreground',
          subtitleClass[size]
        )}
      >
        ARXVI READER
      </span>
    </div>
  );
}
