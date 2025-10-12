export type Course = {
  id: number;
  title: string;
  description: string;
  year: number;
  order_index: number;
};

export type LessonDetail = {
  id: number;
  course_id: number;
  title: string;
  description: string;
  video_url: string;
  notes: string;
  order_index: number;
  progress?: {
    completed: boolean;
    completed_at?: string;
  } | null;
  exercises: ExerciseDetail[];
};

export type ExerciseDetail = {
  id: number;
  lesson_id: number;
  title: string;
  instructions: string;
  starter_code: Record<string, string>;
  default_language: string;
  order_index: number;
  tests_count: number;
  progress?: {
    status: string;
    completed_at?: string;
    last_run_output?: string;
    last_error?: string;
    last_language?: string;
  } | null;
};

export type CourseProgressSummary = {
  course: Course;
  status: "completed" | "in_progress";
  completion_percentage: number;
  lessons_completed: number;
  lessons_total: number;
  exercises_completed: number;
  exercises_total: number;
};

export type CourseLessonsResponse = {
  course: Course;
  lessons: LessonDetail[];
  course_progress: CourseProgressSummary;
};
