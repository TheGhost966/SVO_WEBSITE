import { PageSkeletonShell, CardGridSkeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <PageSkeletonShell>
      <CardGridSkeleton count={6} />
    </PageSkeletonShell>
  )
}
