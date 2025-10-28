import { Link, Navigate, useParams } from "react-router-dom";
import { CheckCircleIcon, LockClosedIcon, PlayCircleIcon } from "@heroicons/react/24/solid";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SectionTitle from "../components/SectionTitle";
import { getCourseBySlug, LessonStatus } from "../data/courseDetails";

const statusConfig: Record<LessonStatus, { label: string; className: string }> = {
  completed: {
    label: "Completed",
    className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  },
  available: {
    label: "Ready to start",
    className: "border-electric/40 bg-electric/15 text-electric-light",
  },
  locked: {
    label: "Locked",
    className: "border-white/10 bg-white/5 text-gray-400",
  },
};

const CoursePage = () => {
  const { courseSlug } = useParams();
  const course = getCourseBySlug(courseSlug) ?? getCourseBySlug("c-foundations");

  if (!course) {
    return <Navigate to="/landing" replace />;
  }

  const totalLessons = course.lessons.length;
  const completedLessons = course.lessons.filter((lesson) => lesson.status === "completed").length;
  const progress = Math.round((completedLessons / totalLessons) * 100);
  const nextLesson = course.lessons.find((lesson) => lesson.status === "available") ?? course.lessons[0];
  const hasStartedCourse = completedLessons > 0;
  const resumeCtaLabel = hasStartedCourse ? "Resume where you left off" : "Start learning";

  return (
    <div className="min-h-screen bg-gradient-to-b from-editor-surface via-editor-panel to-editor-deep text-gray-100">
      <Navbar />
      <main className="px-4 pb-24 pt-16 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-16">
          <section className="space-y-10">
            <div className="space-y-6">
              <Link to="/landing#curriculum" className="inline-flex items-center text-sm text-electric-light transition hover:text-electric">
                ← Back to courses
              </Link>
              <div className="space-y-4">
                <p className="inline-flex items-center rounded-full border border-electric/40 bg-electric/10 px-4 py-1 text-xs font-medium text-electric-light">
                  Systems Track
                </p>
                <h1 className="text-4xl font-semibold text-white sm:text-5xl">{course.title}</h1>
                <p className="text-lg text-gray-300 sm:max-w-3xl">{course.tagline}</p>
              </div>
            </div>
            <div className="grid gap-8 text-sm sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-gray-400">Course length</p>
                <p className="mt-2 text-lg font-semibold text-white">{course.duration}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-gray-400">Designed for</p>
                <p className="mt-2 text-lg font-semibold text-white">{course.level}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-gray-400">Weekly pace</p>
                <p className="mt-2 text-lg font-semibold text-white">{course.pace}</p>
              </div>
            </div>
          </section>

          <section className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
            <div className="space-y-8">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
                <h2 className="text-2xl font-semibold text-white">Overview</h2>
                <p className="mt-4 text-base text-gray-300">{course.description}</p>
                <div className="mt-6">
                  <p className="text-sm font-medium text-gray-300">Progress</p>
                  <div className="mt-3 h-2 rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-electric to-electric-light"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-400">
                    {completedLessons} of {totalLessons} lessons completed · {progress}%
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <SectionTitle
                  eyebrow="Lessons"
                  title="Your roadmap through the course"
                  description="Move from fundamentals to advanced problem solving with instructor-led sessions and guided practice."
                />
                <div className="space-y-3">
                  {course.lessons.map((lesson, index) => {
                    const status = statusConfig[lesson.status];
                    return (
                      <div
                        key={lesson.id}
                        className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-electric/40 hover:bg-electric/5 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/40 text-sm text-gray-300">
                              {index + 1}
                            </span>
                            <h3 className="text-lg font-semibold text-white">{lesson.title}</h3>
                          </div>
                          <p className="text-sm text-gray-400">{lesson.summary}</p>
                          <p className="text-xs uppercase tracking-wide text-gray-500">Estimated time · {lesson.duration}</p>
                        </div>
                        <div className="flex items-center gap-3 self-start sm:self-center">
                          <span className={`rounded-full border px-3 py-1 text-xs font-medium ${status.className}`}>
                            {status.label}
                          </span>
                          {lesson.status === "completed" ? (
                            <CheckCircleIcon className="h-6 w-6 text-emerald-400" />
                          ) : lesson.status === "available" ? (
                            <Link
                              to={`/lesson/${lesson.id}`}
                              className="inline-flex items-center gap-2 rounded-full bg-electric px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-electric/20 transition hover:bg-electric-light"
                            >
                              Start lesson
                            </Link>
                          ) : (
                            <LockClosedIcon className="h-6 w-6 text-gray-500" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <aside className="space-y-8">
              <div className="rounded-3xl border border-electric/30 bg-electric/10 p-8">
                <div className="space-y-4">
                  <div className="relative overflow-hidden rounded-2xl border border-electric/30 bg-black/60">
                    <div className="absolute inset-0 bg-gradient-to-br from-electric/30 via-electric/20 to-transparent" />
                    <div className="relative flex aspect-video items-center justify-center">
                      <PlayCircleIcon className="h-16 w-16 text-electric-light" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-semibold text-white">Preview this course</h2>
                  <p className="text-sm text-gray-200">
                    Watch the first five minutes of the orientation lesson and meet your instructor before diving in.
                  </p>
                  <Link
                    to={`/course/${course.slug}`}
                    className="inline-flex items-center justify-center rounded-full bg-electric px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-electric/30 transition hover:bg-electric-light"
                  >
                    {resumeCtaLabel}
                  </Link>
                  <p className="text-xs text-gray-400">
                    {hasStartedCourse ? "Your next stop:" : "You're starting with:"}{" "}
                    <span className="text-electric-light">{nextLesson.title}</span>
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
                <h3 className="text-xl font-semibold text-white">How you’ll practice</h3>
                <ul className="mt-4 space-y-3 text-sm text-gray-300">
                  {course.practices.map((practice) => (
                    <li key={practice} className="flex items-start gap-3">
                      <CheckCircleIcon className="mt-0.5 h-5 w-5 text-electric-light" />
                      <span>{practice}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
                <h3 className="text-xl font-semibold text-white">Prerequisites</h3>
                <ul className="mt-4 space-y-3 text-sm text-gray-300">
                  {course.prerequisites.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-electric-light" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </section>

          <section className="space-y-10">
            <SectionTitle
              align="center"
              eyebrow="Outcomes"
              title="By the end of this course you will"
              description="Graduate with the confidence to tackle systems-level problems and the portfolio to prove it."
            />
            <div className="grid gap-6 md:grid-cols-2">
              {course.outcomes.map((outcome) => (
                <div key={outcome} className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-gray-200">
                  {outcome}
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <SectionTitle
              eyebrow="Projects"
              title="Capstone milestones"
              description="Ship real artifacts that showcase your systems thinking."
            />
            <div className="grid gap-4 md:grid-cols-2">
              {course.projects.map((project) => (
                <div key={project} className="rounded-2xl border border-electric/30 bg-electric/5 p-6 text-sm text-gray-200">
                  {project}
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CoursePage;
