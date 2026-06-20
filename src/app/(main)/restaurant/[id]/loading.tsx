export default function Loading() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
      <div className="h-48 md:h-72 bg-gray-200 animate-pulse" />
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex gap-8">
          <div className="flex-1 space-y-6">
            <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="grid gap-4">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div key={j} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <aside className="hidden w-96 lg:block">
            <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
          </aside>
        </div>
      </div>
    </div>
  );
}
