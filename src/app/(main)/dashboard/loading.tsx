export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="hidden lg:block w-64 bg-white border-r border-gray-200 animate-pulse" />
      <main className="flex-1 p-4 lg:p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Carregando...</p>
        </div>
      </main>
    </div>
  );
}
