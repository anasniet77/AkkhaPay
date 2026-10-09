interface SkeletonProps {
  className?: string;
}

/** Reusable animated skeleton block with Neumorphic recessed style. */
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-neu-base shadow-neu-pressed-sm rounded-xl ${className}`}
      aria-hidden="true"
    />
  );
}

/** Multi-line skeleton for neumorphic card-style content. */
export function CardSkeleton() {
  return (
    <div className="bg-neu-base shadow-neu-flat rounded-3xl p-6 sm:p-8 space-y-4 border border-white/50">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-10 w-1/2" />
      <div className="flex gap-3 pt-2">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-20" />
      </div>
    </div>
  );
}

/** Table row skeleton for neumorphic transaction list. */
export function TableRowSkeleton() {
  return (
    <tr className="border-b border-neu-dark/20">
      <td className="px-5 py-4"><Skeleton className="h-4 w-28" /></td>
      <td className="px-5 py-4"><Skeleton className="h-4 w-16" /></td>
      <td className="px-5 py-4"><Skeleton className="h-4 w-20" /></td>
      <td className="px-5 py-4"><Skeleton className="h-5 w-16" /></td>
      <td className="px-5 py-4"><Skeleton className="h-4 w-32" /></td>
    </tr>
  );
}
