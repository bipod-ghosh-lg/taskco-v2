export default function ProjectLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 flex items-start gap-3">
        <div className="mt-1 h-4 w-4 rounded-full bg-gray-200" />
        <div>
          <div className="h-7 w-56 rounded-lg bg-gray-200" />
          <div className="mt-2 h-4 w-80 rounded bg-gray-200" />
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-lg bg-gray-200" />
        ))}
      </div>

      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 h-5 w-3/4 rounded bg-gray-200" />
            <div className="flex gap-2">
              <div className="h-4 w-16 rounded bg-gray-200" />
              <div className="h-4 w-16 rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
