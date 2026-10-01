import { PageSkeletonShell, ListSkeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <PageSkeletonShell>
      <ListSkeleton count={5} />
    </PageSkeletonShell>
  )
}
