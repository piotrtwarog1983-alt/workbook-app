import { CourseViewerWrapper } from '@/components/CourseViewerWrapper'

// Wymuszamy dynamiczne renderowanie, żeby wykrywanie urządzenia działało poprawnie
export const dynamic = 'force-dynamic'

export default function CoursePage() {
  return (
    <div>
      <CourseViewerWrapper courseSlug="fotografia-kulinarna" />
    </div>
  )
}

