import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import {
  ArrowPathIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  PlayCircleIcon,
  PlayIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import clsx from "clsx";
import { getLessonById } from "../data/courseDetails";

const tabs = [
  { id: "course", label: "Course" },
  { id: "video", label: "Video" },
  { id: "exercise", label: "Exercise" },
] as const;

type TabId = (typeof tabs)[number]["id"];

type TestStatus = "idle" | "running" | "passed" | "failed";

const testStatusStyles: Record<TestStatus, { icon: typeof CheckCircleIcon; className: string; label: string }> = {
  idle: { icon: PlayIcon, className: "text-gray-400", label: "Ready" },
  running: { icon: ArrowPathIcon, className: "text-electric-light animate-spin", label: "Running" },
  passed: { icon: CheckCircleIcon, className: "text-emerald-400", label: "Passed" },
  failed: { icon: XCircleIcon, className: "text-rose-400", label: "Failed" },
};

const monacoLanguageMap: Record<string, string> = {
  c: "c",
  python: "python",
  javascript: "javascript",
};

const consolePlaceholder =
  "Welcome to the Orus playground. Run the starter code or write your own solution to see output here.";

const LessonPage = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();

  if (!lessonId) {
    return <Navigate to="/landing" replace />;
  }

  const lessonResult = getLessonById(lessonId);

  if (!lessonResult || !lessonResult.content) {
    return <Navigate to="/course/c-foundations" replace />;
  }

  const { course, lesson, content, nextLesson } = lessonResult;
  const languages = useMemo(() => Object.keys(content.exercise.starterCode), [content.exercise.starterCode]);
  const defaultLanguage = useMemo(() => {
    if (languages.includes(content.exercise.defaultLanguage)) {
      return content.exercise.defaultLanguage;
    }
    return (languages[0] as "c" | "python" | "javascript") ?? "c";
  }, [languages, content.exercise.defaultLanguage]);

  const [activeTab, setActiveTab] = useState<TabId>("course");
  const [language, setLanguage] = useState(defaultLanguage);
  const [codeByLanguage, setCodeByLanguage] = useState<Record<string, string>>({
    ...content.exercise.starterCode,
  });
  const [consoleOutput, setConsoleOutput] = useState(consolePlaceholder);
  const [isRunning, setIsRunning] = useState(false);
  const [testStatuses, setTestStatuses] = useState<TestStatus[]>(
    content.exercise.tests.map(() => "idle" as TestStatus),
  );
  const [submissionState, setSubmissionState] = useState<"idle" | "submitting" | "passed" | "failed">("idle");

  useEffect(() => {
    setActiveTab("course");
    setLanguage(defaultLanguage);
    setCodeByLanguage({ ...content.exercise.starterCode });
    setConsoleOutput(consolePlaceholder);
    setTestStatuses(content.exercise.tests.map(() => "idle" as TestStatus));
    setSubmissionState("idle");
  }, [content, defaultLanguage]);

  const currentCode = codeByLanguage[language] ?? "";
  const monacoLanguage = monacoLanguageMap[language] ?? "plaintext";

  const updateCode = (value: string | undefined) => {
    setCodeByLanguage((previous) => ({
      ...previous,
      [language]: value ?? "",
    }));
  };

  const handleExecute = async (mode: "run" | "test" | "submit") => {
    const isTestFlow = mode !== "run";
    const nextConsoleMessage =
      mode === "run"
        ? "Compiling your program..."
        : mode === "test"
          ? "Running lesson tests..."
          : "Running tests and updating your progress...";

    setConsoleOutput(nextConsoleMessage);
    setIsRunning(true);

    if (isTestFlow) {
      setTestStatuses(content.exercise.tests.map(() => "running" as TestStatus));
    }

    if (mode === "submit") {
      setSubmissionState("submitting");
    }

    let allTestsPassed = !isTestFlow;

    try {
      const response = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          code: currentCode,
          lessonId,
          tests: isTestFlow ? content.exercise.tests : undefined,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMessage =
          (typeof result.error === "string" && result.error) ||
          (typeof result.message === "string" && result.message) ||
          `Run failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      const output =
        typeof result.output === "string"
          ? result.output
          : typeof result.stdout === "string"
            ? result.stdout
            : JSON.stringify(result, null, 2);

      setConsoleOutput(output || "Execution finished with no stdout.");

      if (isTestFlow) {
        const rawResults = Array.isArray(result.results) ? result.results : [];
        const resolvedStatuses = content.exercise.tests.map((test) => {
          const match = rawResults.find(
            (entry: { id?: string; name?: string; passed?: boolean; success?: boolean }) =>
              entry.id === test.id || entry.name === test.name,
          );

          if (!match) {
            allTestsPassed = false;
            return "failed" as TestStatus;
          }

          const didPass = match.passed ?? match.success ?? false;
          if (!didPass) {
            allTestsPassed = false;
          }

          return didPass ? ("passed" as TestStatus) : ("failed" as TestStatus);
        });

        if (rawResults.length === 0) {
          allTestsPassed = false;
        }

        setTestStatuses(resolvedStatuses);
      }

      if (mode === "submit") {
        if (allTestsPassed) {
          try {
            await fetch(`/api/progress/complete/${lesson.id}`, { method: "POST" });
          } catch (progressError) {
            console.error("Failed to persist progress", progressError);
          }
          setSubmissionState("passed");
        } else {
          setSubmissionState("failed");
        }
      }
    } catch (error) {
      console.error("Failed to execute lesson code", error);
      setConsoleOutput(
        error instanceof Error
          ? `We couldn't reach the runtime service: ${error.message}`
          : "We couldn't reach the runtime service. Please try again.",
      );

      if (isTestFlow) {
        setTestStatuses(content.exercise.tests.map(() => "failed" as TestStatus));
      }

      if (mode === "submit") {
        setSubmissionState("failed");
      }
    } finally {
      setIsRunning(false);
      if (mode !== "submit") {
        setSubmissionState((previous) => (previous === "submitting" ? "idle" : previous));
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#04050c] text-gray-100">
      <header className="flex items-center justify-between border-b border-white/10 bg-black/70 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-4">
          <Link to={`/course/${course.slug}`} className="text-sm font-semibold text-electric-light hover:text-electric">
            ORUS School
          </Link>
          <span className="hidden text-xs text-gray-400 sm:inline">
            {course.title} · {lesson.title}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden text-xs uppercase tracking-[0.2em] text-gray-400 md:block">
            Language · {language.toUpperCase()}
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-electric/40 bg-electric/10 text-sm font-semibold text-electric-light">
            {course.title.charAt(0)}
          </div>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 lg:grid-cols-[1.05fr_1.45fr]">
        <section className="flex h-full flex-col border-b border-white/10 bg-[#080a18] lg:border-r">
          <div className="border-b border-white/5 px-6 py-6">
            <p className="text-xs uppercase tracking-[0.3em] text-electric-light">Lesson {lesson.title}</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">{lesson.summary}</h1>
            <p className="mt-3 text-sm text-gray-300">Estimated time · {lesson.duration}</p>
          </div>

          <div className="flex border-b border-white/5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "flex-1 px-6 py-4 text-sm font-medium transition",
                  activeTab === tab.id
                    ? "border-b-2 border-electric text-white"
                    : "border-b border-transparent text-gray-400 hover:text-gray-200",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {activeTab === "course" && (
              <div className="space-y-6 text-sm text-gray-300">
                <p className="text-base text-gray-200">{content.intro}</p>
                {content.courseSections.map((section) => (
                  <div key={section.title} className="space-y-3 rounded-2xl border border-white/5 bg-white/5 p-4">
                    <h3 className="text-lg font-semibold text-white">{section.title}</h3>
                    <p>{section.description}</p>
                    {section.bullets && (
                      <ul className="list-disc space-y-1 pl-5 text-sm text-gray-300">
                        {section.bullets.map((bullet) => (
                          <li key={bullet}>{bullet}</li>
                        ))}
                      </ul>
                    )}
                    {section.codeSample && (
                      <pre className="overflow-x-auto rounded-xl bg-black/60 p-4 text-xs text-gray-200">
                        <code>{section.codeSample}</code>
                      </pre>
                    )}
                  </div>
                ))}
                <div className="rounded-2xl border border-electric/30 bg-electric/10 p-4">
                  <h3 className="text-sm font-semibold text-electric-light">Resources</h3>
                  <ul className="mt-3 space-y-2 text-sm">
                    {content.resources.map((resource) => (
                      <li key={resource.href}>
                        <a
                          className="text-electric-light hover:text-electric"
                          href={resource.href}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {resource.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {activeTab === "video" && (
              <div className="space-y-5">
                <div className="aspect-video overflow-hidden rounded-3xl border border-white/10 shadow-xl shadow-black/40">
                  <iframe
                    src={content.videoUrl}
                    title={`${lesson.title} preview`}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <p className="text-sm text-gray-300">
                  Watch the guided walkthrough before diving into the exercise. Pause where needed and mirror the steps in the
                  playground to build muscle memory.
                </p>
              </div>
            )}

            {activeTab === "exercise" && (
              <div className="space-y-6 text-sm text-gray-300">
                <div>
                  <h3 className="text-lg font-semibold text-white">Your mission</h3>
                  <p className="mt-2 text-sm text-gray-200">{content.exercise.prompt}</p>
                </div>
                <div>
                  <h4 className="text-xs uppercase tracking-[0.3em] text-electric-light">Objectives</h4>
                  <ul className="mt-3 list-disc space-y-2 pl-5">
                    {content.exercise.objectives.map((objective) => (
                      <li key={objective}>{objective}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-white/5 bg-black/40 p-4 text-xs text-gray-300">
                  <p className="font-semibold text-gray-200">Starter files</p>
                  <p className="mt-2">
                    We load language-specific boilerplate in the playground. Switch languages to compare implementations or port
                    your solution.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 border-t border-white/5 bg-black/50 px-6 py-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-300">Test panel</h2>
              <span className="text-xs text-gray-500">Read only</span>
            </div>
            <ul className="space-y-3 text-sm text-gray-300">
              {content.exercise.tests.map((test, index) => {
                const status = testStatuses[index] ?? "idle";
                const { icon: StatusIcon, className, label } = testStatusStyles[status];
                return (
                  <li key={test.id} className="flex items-start gap-3 rounded-2xl border border-white/5 bg-black/40 p-4">
                    <StatusIcon className={clsx("mt-0.5 h-5 w-5", className)} />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-white">{test.name}</p>
                      <p className="text-xs text-gray-400">{test.description}</p>
                      <div className="flex flex-wrap gap-4 text-[11px] uppercase tracking-[0.25em] text-gray-500">
                        <span>Status · {label}</span>
                        {test.inputExample && <span>Input · {test.inputExample}</span>}
                        {test.expectedOutput && <span>Output · {test.expectedOutput}</span>}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            {nextLesson && (
              <button
                type="button"
                onClick={() => navigate(`/lesson/${nextLesson.id}`)}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-electric hover:text-electric"
              >
                Next lesson
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </section>

        <section className="flex h-full flex-col border-t border-white/10 bg-[#040610] lg:border-t-0">
          <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-electric-light">Playground</p>
              <h2 className="text-lg font-semibold text-white">Code directly in the browser</h2>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs uppercase tracking-[0.2em] text-gray-400">Language</label>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value as typeof language)}
                className="rounded-full border border-white/10 bg-black/60 px-3 py-1 text-sm text-gray-200 focus:border-electric focus:outline-none"
              >
                {languages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang.toUpperCase()}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleExecute("run")}
                disabled={isRunning}
                className="inline-flex items-center gap-2 rounded-full bg-electric px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-electric/30 transition hover:bg-electric-light disabled:cursor-not-allowed disabled:opacity-60"
              >
                <PlayCircleIcon className="h-5 w-5" />
                Run
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              language={monacoLanguage}
              theme="vs-dark"
              value={currentCode}
              onChange={updateCode}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>

          <div className="border-t border-white/5 bg-black/70 px-6 py-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-200">Output console</h3>
              <span className="text-xs text-gray-500">Stdout & stderr</span>
            </div>
            <pre className="mt-3 max-h-48 overflow-y-auto rounded-2xl bg-black/60 p-4 text-xs leading-relaxed text-gray-200">
              {consoleOutput}
            </pre>
          </div>

          <div className="flex flex-col gap-3 border-t border-white/5 bg-black/80 px-6 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="rounded-full border border-white/10 px-3 py-1 uppercase tracking-[0.25em]">
                Status · {submissionState === "passed" ? "Complete" : submissionState === "failed" ? "Needs attention" : "In progress"}
              </span>
              {submissionState === "passed" && <CheckCircleIcon className="h-5 w-5 text-emerald-400" />}
              {submissionState === "failed" && <XCircleIcon className="h-5 w-5 text-rose-400" />}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleExecute("test")}
                disabled={isRunning}
                className="inline-flex items-center gap-2 rounded-full border border-electric/40 px-4 py-2 text-sm font-semibold text-electric-light transition hover:border-electric hover:text-electric disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ArrowPathIcon className="h-5 w-5" />
                Test
              </button>
              <button
                type="button"
                onClick={() => handleExecute("submit")}
                disabled={isRunning}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CheckCircleIcon className="h-5 w-5" />
                Submit
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LessonPage;
