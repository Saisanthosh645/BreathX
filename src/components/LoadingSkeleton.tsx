export function LoadingSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-[#162338]/60 rounded-xl border border-[#1F3045]/40 ${className}`}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Top Banner Skeleton */}
      <div className="h-28 bg-[#111C2D] border border-[#1F3045] rounded-2xl p-6 animate-pulse" />

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-96 lg:col-span-1 bg-[#111C2D] border border-[#1F3045] rounded-2xl animate-pulse" />
        <div className="h-96 lg:col-span-2 bg-[#111C2D] border border-[#1F3045] rounded-2xl animate-pulse" />
      </div>

      {/* Pollutant Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-40 bg-[#111C2D] border border-[#1F3045] rounded-2xl animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
