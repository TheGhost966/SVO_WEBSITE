import { PageSkeletonShell, FilterRowSkeleton, CardGridSkeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <PageSkeletonShell>
      <FilterRowSkeleton />
      <CardGridSkeleton count={6} />
    </PageSkeletonShell>
  )
}
