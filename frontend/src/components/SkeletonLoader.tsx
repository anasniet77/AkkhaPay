interface SkeletonProps {
  className?: string;
}

/** Reusable animated skeleton block for loading states. */
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-stone-200 rounded-sm ${className}`}
      aria-hidden="true"
    />
  );
}

/** Multi-line skeleton for card-style content. */
export function CardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-sm p-6 space-y-4">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-1/4" />
    </div>
  );
}

/** Table row skeleton for transaction list loading state. */
export function TableRowSkeleton() {
  return (
    <tr>
      <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
      <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
      <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
      <td className="px-4 py-3"><Skeleton className="h-4 w-14" /></td>
      <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
    </tr>
  );
}

