import { Course, CourseProgressSummary, LessonDetail } from "../types/course";

export const computeProgressFromLessons = (
  course: Course,
  lessons: LessonDetail[]
): CourseProgressSummary => {
  const lessonsCompleted = lessons.filter((lesson) => lesson.progress?.completed).length;
  const exercisesTotal = lessons.reduce((total, lesson) => total + lesson.exercises.length, 0);
  const exercisesCompleted = lessons.reduce(
    (total, lesson) =>
      total +
      lesson.exercises.filter((exercise) => (exercise.progress?.status ?? "") === "passed").length,
    0
  );
  const completionPercentage = exercisesTotal === 0 ? 0 : Math.round((exercisesCompleted / exercisesTotal) * 100);

  return {
    course,
    status: completionPercentage === 100 ? "completed" : "in_progress",
    completion_percentage: completionPercentage,
    lessons_completed: lessonsCompleted,
    lessons_total: lessons.length,
    exercises_completed: exercisesCompleted,
    exercises_total: exercisesTotal,
  };
};
