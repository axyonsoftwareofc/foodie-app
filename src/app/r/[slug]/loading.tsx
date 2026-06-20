export default function Loading() {
  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: '#f9fafb' }}>
      <div className="h-48 md:h-64 bg-gray-200 animate-pulse" />
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
        <div className="h-8 w-56 bg-gray-200 rounded animate-pulse" />
        <div className="space-y-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-6 w-36 bg-gray-200 rounded animate-pulse" />
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 2 }).map((_, j) => (
                  <div
                    key={j}
                    className="h-28 bg-white rounded-xl border border-gray-100 animate-pulse"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
