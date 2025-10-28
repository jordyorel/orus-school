import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/Avatar";
import InfoCard from "../components/InfoCard";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getCourseBySlug } from "../data/courseDetails";

const ProfilePage = () => {
  const { student, logout } = useAuth();
  const navigate = useNavigate();
  const enrolledCourse = getCourseBySlug("c-foundations");

  const totalLessons = enrolledCourse?.lessons.length ?? 0;
  const completedLessons = enrolledCourse
    ? enrolledCourse.lessons.filter((lesson) => lesson.status === "completed").length
    : 0;
  const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const nextLesson = enrolledCourse?.lessons.find((lesson) => lesson.status === "available") ??
    enrolledCourse?.lessons[0];
  const hasStartedCourse = completedLessons > 0;
  const resumeCtaLabel = hasStartedCourse ? "Resume where you left off" : "Start learning";

  if (!student) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-editor-surface via-editor-panel to-editor-deep text-gray-200">
        <p className="text-sm text-gray-300">Loading profile…</p>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate("/logout");
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-editor-surface via-editor-panel to-editor-deep text-gray-200">
      <Navbar />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-16 sm:px-6 lg:flex-row lg:gap-16 lg:py-20">
        <section className="w-full lg:w-1/3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-black/40">
            <Avatar name={student.fullName} src={student.avatarUrl} className="mx-auto" />
            <h1 className="mt-6 text-2xl font-semibold text-white">{student.fullName}</h1>
            <p className="mt-2 text-sm text-gray-300">Orus School Student</p>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-8 w-full rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-gray-200 transition hover:border-red-400 hover:text-white"
            >
              Logout
            </button>
          </div>
        </section>
        <section className="w-full space-y-6 lg:w-2/3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/40">
            <p className="text-sm uppercase tracking-[0.3em] text-electric-light">Your profile</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Welcome back, {student.fullName.split(" ")[0]}!</h2>
            <p className="mt-4 text-sm text-gray-300">
              This is the foundation of your Orus School dashboard. As we continue building the experience, this space will grow to
              include roadmap progress, mentor notes, and actionable next steps tailored just for you.
            </p>
          </div>
          {enrolledCourse && (
            <div className="rounded-3xl border border-electric/30 bg-electric/10 p-8 shadow-2xl shadow-electric/20">
              <p className="text-xs uppercase tracking-[0.25em] text-electric-light">Your current track</p>
              <h3 className="mt-3 text-2xl font-semibold text-white">{enrolledCourse.title}</h3>
              <p className="mt-3 text-sm text-gray-200">{enrolledCourse.tagline}</p>
              <div className="mt-6 space-y-3 text-sm text-gray-200">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-300">Progress</p>
                  <div className="mt-2 h-2 rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-electric to-electric-light"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-300">
                    {completedLessons} of {totalLessons} lessons completed · {progress}%
                  </p>
                </div>
                {nextLesson && (
                  <p className="text-xs text-gray-200">
                    {hasStartedCourse ? "Next up:" : "You’ll start with:"}{" "}
                    <span className="text-electric-light">{nextLesson.title}</span>
                  </p>
                )}
              </div>
              <Link
                to={`/course/${enrolledCourse.slug}`}
                className="mt-6 inline-flex items-center justify-center rounded-full bg-electric px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-electric/30 transition hover:bg-electric-light"
              >
                {resumeCtaLabel}
              </Link>
            </div>
          )}
          <div className="grid gap-6 md:grid-cols-2">
            <InfoCard label="Full name" value={student.fullName} />
            <InfoCard label="Email" value={student.email} />
          </div>
          <div className="rounded-3xl border border-electric/30 bg-electric/10 p-8 text-sm text-gray-200">
            <h3 className="text-lg font-semibold text-white">What’s coming next?</h3>
            <p className="mt-3">
              Soon you’ll be able to track your weekly missions, review code submissions, and collaborate with your mentor directly
              from this dashboard. Stay tuned!
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;
