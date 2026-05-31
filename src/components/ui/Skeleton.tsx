// src/components/ui/Skeleton.tsx
interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg ${className}`}
      style={{ backgroundColor: 'var(--color-bg-secondary)' }}
    />
  );
}

export function RestaurantCardSkeleton() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        borderColor: 'var(--color-border)',
        borderWidth: '1px',
      }}
    >
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function MenuItemSkeleton() {
  return (
    <div
      className="flex gap-4 p-4 rounded-2xl"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        borderColor: 'var(--color-border)',
        borderWidth: '1px',
      }}
    >
      <div className="flex-1 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-6 w-24" />
      </div>
      <Skeleton className="w-28 h-28 rounded-xl shrink-0" />
    </div>
  );
}

export function CategorySkeleton() {
  return (
    <div className="flex gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="w-20 h-24 rounded-2xl shrink-0" />
      ))}
    </div>
  );
}
