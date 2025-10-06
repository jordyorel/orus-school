import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import CodeEditor from "../components/CodeEditor";
import ConsoleTabs from "../components/ConsoleTabs";
import CourseSidebar, { LessonSidebarItem } from "../components/CourseSidebar";
import InstructionPanel from "../components/InstructionPanel";
import LessonNotes from "../components/LessonNotes";
import ProgressBar from "../components/ProgressBar";
import VideoPlayer from "../components/VideoPlayer";
import { useAuth } from "../context";

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

export type RunCodeResponse = {
  stdout: string;
  stderr: string;
  exit_code: number;
  execution_time: number;
};

export type RunTestsResponse = {
  passed_all: boolean;
  results: TestCaseResult[];
};

export type TestCaseResult = {
  test_id: number;
  passed: boolean;
  stdout: string;
  stderr: string;
  expected_output: string;
  input_data?: string | null;
};

type EditorState = Record<number, Record<string, string>>;

type ConsoleResult = {
  id: number | string;
  title: string;
  passed: boolean;
  stdout: string;
  stderr: string;
  expected?: string;
  input?: string;
};

const CoursePage = () => {
  const { courseId } = useParams();
  const numericCourseId = Number(courseId);
  const { user } = useAuth();

  const [courseData, setCourseData] = useState<CourseLessonsResponse | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<number | null>(null);
  const [activeExerciseId, setActiveExerciseId] = useState<number | null>(null);
  const [editorValues, setEditorValues] = useState<EditorState>({});
  const [selectedLanguage, setSelectedLanguage] = useState<string>("python");
  const [consoleTab, setConsoleTab] = useState<"console" | "tests" | "feedback">("console");
  const [consoleOutput, setConsoleOutput] = useState<string>("");
  const [testResults, setTestResults] = useState<ConsoleResult[]>([]);
  const [isDarkEditor, setIsDarkEditor] = useState(true);
  const [runLoading, setRunLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [lessonMarkLoading, setLessonMarkLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const activeLessonRef = useRef<number | null>(null);
  const activeExerciseRef = useRef<number | null>(null);

  useEffect(() => {
    activeLessonRef.current = activeLessonId;
  }, [activeLessonId]);

  useEffect(() => {
    activeExerciseRef.current = activeExerciseId;
  }, [activeExerciseId]);

  const loadCourse = useCallback(async () => {
    if (!Number.isFinite(numericCourseId)) return;
    const { data } = await api.get<CourseLessonsResponse>(`/lessons/${numericCourseId}`);
    setCourseData(data);

    setEditorValues((prev) => {
      const next: EditorState = { ...prev };
      data.lessons.forEach((lesson) => {
        lesson.exercises.forEach((exercise) => {
          next[exercise.id] = {
            ...exercise.starter_code,
            ...(prev[exercise.id] ?? {})
          };
        });
      });
      return next;
    });

    const previousLessonId = activeLessonRef.current;
    const existingLesson = data.lessons.find((lesson) => lesson.id === (previousLessonId ?? undefined));
    const lessonToUse = existingLesson ?? data.lessons[0] ?? null;
    setActiveLessonId(lessonToUse?.id ?? null);

    const previousExerciseId = activeExerciseRef.current;
    const existingExercise = lessonToUse?.exercises.find((exercise) => exercise.id === (previousExerciseId ?? undefined));
    const exerciseToUse = existingExercise ?? lessonToUse?.exercises[0] ?? null;
    setActiveExerciseId(exerciseToUse?.id ?? null);

    if (exerciseToUse) {
      const starterLanguages = Object.keys(exerciseToUse.starter_code ?? {});
      setSelectedLanguage((prev) => {
        if (exerciseToUse.progress?.last_language && starterLanguages.includes(exerciseToUse.progress.last_language)) {
          return exerciseToUse.progress.last_language;
        }
        if (starterLanguages.includes(prev)) {
          return prev;
        }
        if (starterLanguages.length > 0) {
          return starterLanguages[0];
        }
        return exerciseToUse.default_language ?? "python";
      });
    }
  }, [numericCourseId]);

  useEffect(() => {
    void loadCourse();
  }, [loadCourse]);

  const lessons = useMemo(() => courseData?.lessons ?? [], [courseData]);

  const sortedLessons = useMemo(
    () => [...lessons].sort((a, b) => a.order_index - b.order_index),
    [lessons]
  );

  const lessonStatuses = useMemo(() => {
    const items: LessonSidebarItem[] = [];
    let lockNext = false;
    sortedLessons.forEach((lesson) => {
      let status: LessonSidebarItem["status"];
      if (lockNext) {
        status = "locked";
      } else if (lesson.progress?.completed) {
        status = "completed";
      } else {
        status = "in_progress";
        lockNext = true;
      }
      items.push({ id: lesson.id, title: lesson.title, status });
    });
    return items;
  }, [sortedLessons]);

  const activeLesson = useMemo(
    () => sortedLessons.find((lesson) => lesson.id === activeLessonId) ?? sortedLessons[0] ?? null,
    [sortedLessons, activeLessonId]
  );

  const exercises = activeLesson?.exercises ?? [];

  const activeExercise = useMemo(
    () => exercises.find((exercise) => exercise.id === activeExerciseId) ?? exercises[0] ?? null,
    [exercises, activeExerciseId]
  );

  const availableLanguages = useMemo(() => {
    if (!activeExercise) return [];
    const keys = Object.keys(activeExercise.starter_code ?? {});
    if (keys.length === 0) {
      return [activeExercise.default_language ?? "python"];
    }
    return keys;
  }, [activeExercise]);

  useEffect(() => {
    if (!activeExercise) return;
    const languages = Object.keys(activeExercise.starter_code ?? {});
    if (languages.length === 0) return;
    if (!languages.includes(selectedLanguage)) {
      setSelectedLanguage(languages[0]);
    }
  }, [activeExercise, selectedLanguage]);

  const editorCode = useMemo(() => {
    if (!activeExercise) return "";
    const exerciseState = editorValues[activeExercise.id] ?? {};
    return exerciseState[selectedLanguage] ?? activeExercise.starter_code[selectedLanguage] ?? "";
  }, [activeExercise, editorValues, selectedLanguage]);

  const handleLessonSelect = (lessonId: number) => {
    setSuccessMessage(null);
    setConsoleOutput("");
    setTestResults([]);
    setActiveLessonId(lessonId);
    const lesson = lessons.find((item) => item.id === lessonId);
    const firstExercise = lesson?.exercises[0];
    setActiveExerciseId(firstExercise?.id ?? null);
    if (firstExercise) {
      const languages = Object.keys(firstExercise.starter_code ?? {});
      if (languages.length > 0) {
        setSelectedLanguage(firstExercise.progress?.last_language && languages.includes(firstExercise.progress.last_language)
          ? firstExercise.progress.last_language
          : languages[0]);
      } else {
        setSelectedLanguage(firstExercise.default_language ?? "python");
      }
    }
  };

  const handleExerciseChange = (exerciseId: number) => {
    setSuccessMessage(null);
    setConsoleOutput("");
    setTestResults([]);
    setActiveExerciseId(exerciseId);
    const exercise = exercises.find((item) => item.id === exerciseId);
    if (exercise) {
      const languages = Object.keys(exercise.starter_code ?? {});
      if (languages.length > 0) {
        setSelectedLanguage(exercise.progress?.last_language && languages.includes(exercise.progress.last_language)
          ? exercise.progress.last_language
          : languages[0]);
      } else {
        setSelectedLanguage(exercise.default_language ?? "python");
      }
    }
  };

  const handleEditorChange = (value: string) => {
    if (!activeExercise) return;
    setEditorValues((prev) => ({
      ...prev,
      [activeExercise.id]: {
        ...(prev[activeExercise.id] ?? {}),
        [selectedLanguage]: value
      }
    }));
  };

  const handleRunCode = async () => {
    if (!activeExercise) return;
    setRunLoading(true);
    setConsoleTab("console");
    setSuccessMessage(null);
    try {
      const { data } = await api.post<RunCodeResponse>("/run-code", {
        language: selectedLanguage,
        code: editorCode
      });
      const stderrSegment = data.stderr ? `\n--- stderr ---\n${data.stderr}` : "";
      const formatted = `Exit code: ${data.exit_code}\nTime: ${data.execution_time.toFixed(2)}s\n\n${data.stdout}${stderrSegment}`;
      setConsoleOutput(formatted);
    } finally {
      setRunLoading(false);
    }
  };

  const handleRunTests = async () => {
    if (!activeExercise) return;
    setTestLoading(true);
    setConsoleTab("tests");
    setSuccessMessage(null);
    setTestResults([]);
    try {
      const { data } = await api.post<RunTestsResponse>("/run-tests", {
        exercise_id: activeExercise.id,
        language: selectedLanguage,
        code: editorCode
      });
      const mapped: ConsoleResult[] = data.results.map((result, index) => ({
        id: result.test_id,
        title: `Test ${index + 1}`,
        passed: result.passed,
        stdout: result.stdout.trim(),
        stderr: result.stderr.trim(),
        expected: result.expected_output,
        input: result.input_data ?? undefined
      }));
      setTestResults(mapped);
      if (data.passed_all) {
        setSuccessMessage("Great job 🚀 You’re one step closer to mastering this lesson!");
      }
      await loadCourse();
    } finally {
      setTestLoading(false);
    }
  };

  const handleMarkLessonComplete = async () => {
    if (!activeLesson) return;
    setLessonMarkLoading(true);
    try {
      await api.post("/mark-lesson-complete", { lesson_id: activeLesson.id });
      await loadCourse();
      setSuccessMessage("Lesson marked as complete. Keep the momentum going!");
    } finally {
      setLessonMarkLoading(false);
    }
  };

  if (!user || !courseData) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
        Loading course...
      </div>
    );
  }

  const lessonCompleted = Boolean(activeLesson?.progress?.completed);

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Year {courseData.course.year}</p>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{courseData.course.title}</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{courseData.course.description}</p>
          </div>
          <div className="flex items-center gap-4">
            <ProgressBar value={courseData.course_progress.completion_percentage} label="Course completion" />
            <button
              onClick={() => setIsDarkEditor((value) => !value)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {isDarkEditor ? "☀️ Light editor" : "🌙 Dark editor"}
            </button>
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[280px,minmax(0,1fr),360px]">
        <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <CourseSidebar lessons={lessonStatuses} activeLessonId={activeLesson?.id ?? null} onSelect={handleLessonSelect} />
        </aside>

        <main className="space-y-6">
          {activeLesson ? (
            <div className="space-y-6">
              <VideoPlayer url={activeLesson.video_url} title={activeLesson.title} />
              <LessonNotes content={activeLesson.notes} />

              <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Coding playground</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Write your solution, run quick experiments, and validate against hidden tests.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300" htmlFor="exercise-select">
                      Exercise
                    </label>
                    <select
                      id="exercise-select"
                      value={activeExercise?.id ?? ""}
                      onChange={(event) => handleExerciseChange(Number(event.target.value))}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    >
                      {exercises.map((exercise) => (
                        <option key={exercise.id} value={exercise.id}>
                          {exercise.title}
                        </option>
                      ))}
                    </select>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300" htmlFor="language-select">
                      Language
                    </label>
                    <select
                      id="language-select"
                      value={selectedLanguage}
                      onChange={(event) => setSelectedLanguage(event.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    >
                      {availableLanguages.map((language) => (
                        <option key={language} value={language}>
                          {language.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <CodeEditor
                  language={selectedLanguage}
                  code={editorCode}
                  onChange={handleEditorChange}
                  theme={isDarkEditor ? "dark" : "light"}
                />
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleRunCode}
                    disabled={runLoading}
                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
                  >
                    {runLoading ? "Running..." : "Run code"}
                  </button>
                  <button
                    onClick={handleRunTests}
                    disabled={testLoading}
                    className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:-translate-y-0.5 hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {testLoading ? "Checking tests..." : "Run tests"}
                  </button>
                  <button
                    onClick={handleMarkLessonComplete}
                    disabled={lessonMarkLoading || lessonCompleted}
                    className="rounded-full border border-emerald-400 px-4 py-2 text-sm font-semibold text-emerald-600 transition hover:-translate-y-0.5 hover:shadow disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-500/60 dark:text-emerald-300"
                  >
                    {lessonCompleted ? "Lesson completed" : lessonMarkLoading ? "Marking..." : "Mark lesson complete"}
                  </button>
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {activeExercise?.tests_count ?? 0} tests configured
                  </span>
                </div>
                {successMessage ? (
                  <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 dark:border-emerald-500/50 dark:bg-emerald-500/10 dark:text-emerald-200">
                    {successMessage}
                  </div>
                ) : null}
              </section>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              No lessons available yet.
            </div>
          )}
        </main>

        <aside className="flex flex-col gap-4">
          <InstructionPanel
            title={activeExercise?.title ?? "Exercise"}
            instructions={activeExercise?.instructions ?? "Select an exercise to view the requirements."}
          />
          <ConsoleTabs
            activeTab={consoleTab}
            onTabChange={setConsoleTab}
            consoleOutput={consoleOutput}
            testResults={testResults}
            feedback={successMessage ?? activeExercise?.progress?.last_error ?? undefined}
          />
        </aside>
      </div>
    </div>
  );
};

export default CoursePage;
