/**
 * Placeholder UI for the `loading.tsx` boundaries on the routes that read `searchParams`
 * and therefore render per request (`/news`, `/events`, `/experts`, `/guide/[topic]`,
 * `/search`). Without a boundary the browser sits on the previous page with nothing
 * happening until the server responds; with one, the header and page chrome paint at once
 * and only the list streams in.
 *
 * Shapes deliberately mirror the real layout's grid and spacing so the swap doesn't shift
 * anything on screen.
 */

function Bar({ className = '' }: { className?: string }) {
  return <div className={`rounded-md bg-ink/10 ${className}`} />
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid animate-pulse gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="aspect-[16/10] bg-ink/10" />
          <div className="flex flex-col gap-3 p-5">
            <Bar className="h-3 w-24" />
            <Bar className="h-5 w-full" />
            <Bar className="h-5 w-4/5" />
            <Bar className="h-3 w-full" />
            <Bar className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function FilterRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="mb-8 flex animate-pulse flex-wrap gap-2" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <Bar key={i} className="h-9 w-28 rounded-control" />
      ))}
    </div>
  )
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex animate-pulse flex-col gap-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <Bar key={i} className="h-[68px] w-full rounded-2xl" />
      ))}
    </div>
  )
}

/**
 * The page shell every listing skeleton sits in — same paddings and max width as the real
 * pages, so nothing jumps when the content arrives.
 */
export function PageSkeletonShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mx-auto max-w-[1200px] py-12 md:py-[84px]"
      style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
      // Screen readers get one spoken "loading" rather than a tree of meaningless boxes.
      role="status"
      aria-busy="true"
    >
      <span className="sr-only">Loading…</span>
      <div className="mb-8 animate-pulse" aria-hidden="true">
        <Bar className="h-9 w-64 md:h-10" />
      </div>
      {children}
    </div>
  )
}
