import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
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
  idle: { icon: PlayIcon, className: "text-cw-text-muted", label: "Ready" },
  running: { icon: ArrowPathIcon, className: "text-cw-accent-light animate-spin", label: "Running" },
  passed: { icon: CheckCircleIcon, className: "text-emerald-400", label: "Passed" },
  failed: { icon: XCircleIcon, className: "text-rose-400", label: "Failed" },
};

const monacoLanguageMap: Record<string, string> = {
  c: "c",
};

const consolePlaceholder =
  "Welcome to the Orus playground. Run the starter code or write your own solution to see output here.";

const MIN_LEFT_WIDTH = 240;
const MIN_RIGHT_WIDTH = 360;
const RESIZER_WIDTH = 8;

const LessonPage = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef<any>(null);
  const layoutRef = useRef<HTMLDivElement | null>(null);

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
    return (languages[0] as "c") ?? "c";
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
  const [leftPaneWidth, setLeftPaneWidth] = useState<number>(Number.NaN);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    // Focus the editor initially
    editor.focus();
  };

  useEffect(() => {
    setActiveTab("course");
    setLanguage(defaultLanguage);
    setCodeByLanguage({ ...content.exercise.starterCode });
    setConsoleOutput(consolePlaceholder);
    setTestStatuses(content.exercise.tests.map(() => "idle" as TestStatus));
    setSubmissionState("idle");
  }, [content, defaultLanguage]);

  const updateLayoutDimensions = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    const isLgViewport = window.innerWidth >= 1024;
    setIsDesktop(isLgViewport);

    if (!layoutRef.current || !isLgViewport) {
      return;
    }

    const rect = layoutRef.current.getBoundingClientRect();
    const availableWidth = rect.width - RESIZER_WIDTH;
    const defaultWidth = Math.max(availableWidth * 0.4, MIN_LEFT_WIDTH);
    setLeftPaneWidth((current) => {
      if (!Number.isFinite(current)) {
        return Math.min(defaultWidth, Math.max(availableWidth - MIN_RIGHT_WIDTH, MIN_LEFT_WIDTH));
      }

      const maxWidth = Math.max(availableWidth - MIN_RIGHT_WIDTH, MIN_LEFT_WIDTH);
      return Math.min(Math.max(current, MIN_LEFT_WIDTH), maxWidth);
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    updateLayoutDimensions();
    window.addEventListener("resize", updateLayoutDimensions);
    return () => {
      window.removeEventListener("resize", updateLayoutDimensions);
    };
  }, [updateLayoutDimensions]);

  useEffect(() => {
    if (!isDesktop) {
      setIsResizing(false);
    }
  }, [isDesktop]);

  useEffect(() => {
    if (!isResizing || !isDesktop) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (!layoutRef.current) {
        return;
      }

      const rect = layoutRef.current.getBoundingClientRect();
      const availableWidth = rect.width - RESIZER_WIDTH;
      const pointerOffset = Math.min(Math.max(event.clientX - rect.left, MIN_LEFT_WIDTH), availableWidth);
      const maxWidth = Math.max(availableWidth - MIN_RIGHT_WIDTH, MIN_LEFT_WIDTH);
      const nextWidth = Math.min(pointerOffset, maxWidth);
      setLeftPaneWidth(nextWidth);
    };

    const stopResizing = () => {
      setIsResizing(false);
    };

    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopResizing);

    return () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, isDesktop]);

  const handleResizeStart = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!isDesktop) {
      return;
    }
    setIsResizing(true);
  }, [isDesktop]);

  const handleResizeReset = useCallback(() => {
    if (!layoutRef.current || !isDesktop) {
      return;
    }

    const rect = layoutRef.current.getBoundingClientRect();
    const availableWidth = rect.width - RESIZER_WIDTH;
    const defaultWidth = Math.max(availableWidth * 0.4, MIN_LEFT_WIDTH);
    const maxWidth = Math.max(availableWidth - MIN_RIGHT_WIDTH, MIN_LEFT_WIDTH);
    setLeftPaneWidth(Math.min(defaultWidth, maxWidth));
  }, [isDesktop]);

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
    <div className="flex h-screen flex-col overflow-hidden bg-cw-body text-gray-100">
      <header className="flex items-center justify-between border-b border-cw-border bg-cw-surface/90 px-6 py-4 shadow-[0_2px_0_rgba(0,0,0,0.4)] backdrop-blur">
        <div className="flex items-center gap-4">
          <Link to={`/course/${course.slug}`} className="text-sm font-semibold text-cw-accent-light hover:text-cw-accent">
            ORUS School
          </Link>
          <span className="hidden text-xs text-cw-text-muted sm:inline">
            {course.title} · {lesson.title}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden text-xs uppercase tracking-[0.2em] text-cw-text-muted md:block">
            Language · {language.toUpperCase()}
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-cw-border-light bg-cw-panel text-sm font-semibold text-cw-accent-light shadow-inner shadow-black/50">
            {course.title.charAt(0)}
          </div>
        </div>
      </header>

      <div ref={layoutRef} className="flex flex-1 min-h-0 flex-col bg-gradient-to-br from-cw-surface via-cw-body to-cw-panel lg:flex-row">
        <section
          className="flex h-full min-h-0 flex-col overflow-hidden border-b border-cw-border bg-cw-panel/95 lg:border-r lg:flex-shrink-0"
          style={isDesktop && Number.isFinite(leftPaneWidth)
            ? { flexBasis: `${leftPaneWidth}px`, width: `${leftPaneWidth}px` }
            : undefined}
        >
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="border-b border-cw-border-light px-6 py-4 bg-cw-surface/90">
              <p className="text-xs uppercase tracking-[0.3em] text-cw-accent">Lesson {lesson.title}</p>
              <h1 className="mt-2 text-xl font-semibold text-white">{lesson.summary}</h1>
              <p className="mt-2 text-sm text-cw-text-muted">Estimated time · {lesson.duration}</p>
            </div>

            <div className="flex border-b border-cw-border-light bg-cw-surface/60">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    "flex-1 px-4 py-3 text-sm font-medium transition",
                    activeTab === tab.id
                      ? "border-b-2 border-cw-accent text-white"
                      : "border-b border-transparent text-cw-text-muted hover:text-gray-200",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="px-4 py-4">
              {activeTab === "course" && (
                <div className="space-y-4 text-sm text-cw-text-muted">
                  <p className="text-base text-gray-200">{content.intro}</p>
                  {content.courseSections.map((section) => (
                    <div key={section.title} className="space-y-2 rounded-xl border border-cw-border-light bg-cw-panel-alt/90 p-3 shadow-[0_8px_16px_rgba(0,0,0,0.45)]">
                      <h3 className="text-md font-semibold text-white">{section.title}</h3>
                      <p className="text-sm text-cw-text-muted">{section.description}</p>
                      {section.bullets && (
                        <ul className="list-disc space-y-1 pl-4 text-sm text-cw-text-muted">
                          {section.bullets.map((bullet) => (
                            <li key={bullet}>{bullet}</li>
                          ))}
                        </ul>
                      )}
                      {section.codeSample && (
                        <pre className="overflow-x-auto rounded-lg border border-cw-border bg-cw-surface p-3 text-xs text-gray-200 shadow-inner shadow-black/60">
                          <code>{section.codeSample}</code>
                        </pre>
                      )}
                    </div>
                  ))}
                  <div className="rounded-xl border border-cw-border-light bg-cw-panel-alt/80 p-3">
                    <h3 className="text-sm font-semibold text-cw-accent-light">Resources</h3>
                    <ul className="mt-2 space-y-1 text-sm text-cw-text-muted">
                      {content.resources.map((resource) => (
                        <li key={resource.href}>
                          <a
                            className="text-cw-accent-light hover:text-cw-accent"
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
                <div className="space-y-4">
                  <div className="aspect-video overflow-hidden rounded-2xl border border-cw-border shadow-xl shadow-black/50">
                    <iframe
                      src={content.videoUrl}
                      title={`${lesson.title} preview`}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  <p className="text-sm text-cw-text-muted">
                    Watch the guided walkthrough before diving into the exercise. Pause where needed and mirror the steps in the
                    playground to build muscle memory.
                  </p>
                </div>
              )}

              {activeTab === "exercise" && (
                <div className="space-y-4 text-sm text-cw-text-muted">
                  <div>
                    <h3 className="text-md font-semibold text-white">Your mission</h3>
                    <p className="mt-1 text-sm text-gray-200">{content.exercise.prompt}</p>
                  </div>
                  <div>
                    <h4 className="text-xs uppercase tracking-[0.3em] text-cw-accent">Objectives</h4>
                    <ul className="mt-2 list-disc space-y-1 pl-4">
                      {content.exercise.objectives.map((objective) => (
                        <li key={objective}>{objective}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-cw-border bg-cw-surface p-3 text-xs text-cw-text-muted shadow-inner shadow-black/40">
                    <p className="font-semibold text-gray-200">Starter files</p>
                    <p className="mt-1">
                      We load language-specific boilerplate in the playground. Switch languages to compare implementations or port
                      your solution.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3 border-t border-cw-border bg-cw-panel-alt/70 px-4 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-300">Test panel</h2>
                <span className="text-xs text-cw-text-muted">Read only</span>
              </div>
              <ul className="space-y-2 text-sm text-cw-text-muted">
                {content.exercise.tests.map((test, index) => {
                  const status = testStatuses[index] ?? "idle";
                  const { icon: StatusIcon, className, label } = testStatusStyles[status];
                  return (
                    <li key={test.id} className="flex items-start gap-2 rounded-xl border border-cw-border bg-cw-surface/90 p-3 shadow-inner shadow-black/40">
                      <StatusIcon className={clsx("mt-0.5 h-4 w-4", className)} />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-white">{test.name}</p>
                        <p className="text-xs text-cw-text-muted">{test.description}</p>
                        <div className="flex flex-wrap gap-3 text-[10px] uppercase tracking-[0.25em] text-cw-text-muted">
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
                  className="inline-flex items-center gap-2 rounded-full border border-cw-border-light px-3 py-1 text-xs font-semibold text-cw-accent-light transition hover:border-cw-accent hover:text-cw-accent"
                >
                  Next lesson
                  <ArrowRightIcon className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </section>

        <div
          role="separator"
          aria-orientation="vertical"
          className={clsx(
            "hidden lg:block h-full shrink-0 cursor-col-resize select-none bg-cw-border/80 transition-colors",
            isResizing ? "bg-cw-accent" : "hover:bg-cw-accent/60",
          )}
          style={{ width: RESIZER_WIDTH }}
          onMouseDown={handleResizeStart}
          onDoubleClick={handleResizeReset}
          title="Drag to resize panels. Double-click to reset."
        />

        {/* Codewars-style Playground Section */}
        <section className="flex h-full min-h-0 flex-col border-l border-cw-border bg-cw-panel lg:flex-1 lg:min-w-[360px] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          {/* Playground Header */}
          <div className="flex items-center justify-between border-b border-cw-border-light bg-cw-panel-alt/70 px-4 py-3">

            <div className="flex items-center gap-2">
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value as typeof language)}
                className="rounded border border-cw-border bg-cw-panel-alt/80 px-2 py-1 text-xs text-white shadow-inner shadow-black/40 focus:border-cw-accent focus:outline-none"
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
                className="flex items-center space-x-1 rounded border border-cw-border bg-cw-accent px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-cw-accent-light disabled:border-cw-border disabled:bg-cw-accent/50"
              >
                <PlayCircleIcon className="h-3 w-3" />
                <span>Run Code</span>
              </button>
            </div>
          </div>

          {/* Code Editor */}
          <div className="flex flex-1 min-h-0 flex-col">
            <div className="border-b border-cw-border p-2 bg-cw-panel/80">
              <h3 className="text-sm font-semibold text-white">Your Solution</h3>
            </div>
            <div className="flex-1 min-h-[320px] overflow-hidden">
              <Editor
                height="100%"
                language={monacoLanguage}
                theme="vs-dark"
                value={currentCode}
                onChange={updateCode}
                onMount={handleEditorDidMount}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  lineNumbers: "on",
                  renderLineHighlight: "all",
                  scrollbar: {
                    vertical: "visible",
                    horizontal: "visible",
                  },
                }}
              />
            </div>
          </div>

          {/* Console Output */}
          <div className="border-t border-cw-border bg-cw-panel">
            <div className="border-b border-cw-border p-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white">Output Console</h4>
                <span className="text-xs text-cw-text-muted">Execution Results</span>
              </div>
            </div>
            <pre className="max-h-32 overflow-y-auto bg-cw-surface p-2 font-mono text-xs text-gray-300 whitespace-pre-wrap">
              {consoleOutput}
            </pre>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 border-t border-cw-border bg-cw-panel px-4 py-3">
            <div className="flex flex-1 items-center gap-2 text-xs text-cw-text-muted min-w-[200px] sm:flex-none">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                submissionState === "passed" ? "bg-emerald-500/20 text-emerald-300" :
                submissionState === "failed" ? "bg-cw-accent/25 text-cw-accent-light" :
                "bg-cw-border/60 text-cw-text-muted"
              }`}>
                {submissionState === "passed" ? "✅ All Tests Passed" : 
                 submissionState === "failed" ? "❌ Tests Failed" : 
                 "⚡ Ready to Submit"}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 justify-end sm:ml-auto">
              <button
                type="button"
                onClick={() => handleExecute("test")}
                disabled={isRunning}
                className="flex items-center space-x-1 rounded border border-cw-border-light bg-cw-panel-alt px-2 py-1 text-xs font-medium text-white transition-colors hover:border-cw-accent hover:text-cw-accent-light disabled:border-cw-border"
              >
                <ArrowPathIcon className="h-3 w-3" />
                <span>Run Tests</span>
              </button>
              <button
                type="button"
                onClick={() => handleExecute("submit")}
                disabled={isRunning}
                className="flex items-center space-x-1 rounded border border-cw-border bg-cw-accent px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-cw-accent-light disabled:bg-cw-accent/40"
              >
                <CheckCircleIcon className="h-3 w-3" />
                <span>Submit</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LessonPage;
