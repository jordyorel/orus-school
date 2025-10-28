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

/**
 * Full page rewrite with AlgoExpert-like gutters (inset content area),
 * while keeping the top navbar full-bleed.
 */

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

const consolePlaceholder = "";

const MIN_LEFT_WIDTH = 240;
const MIN_RIGHT_WIDTH = 400;
const RESIZER_WIDTH = 8;
const DEFAULT_CONSOLE_HEIGHT = 240;
const MIN_CONSOLE_HEIGHT = 0;
const MAX_CONSOLE_HEIGHT = 480;
const DEFAULT_TEST_PANEL_HEIGHT = 240;
const MIN_TEST_PANEL_HEIGHT = 0;

export default function LessonPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef<any>(null);
  const layoutRef = useRef<HTMLDivElement | null>(null);

  if (!lessonId) return <Navigate to="/landing" replace />;

  const lessonResult = getLessonById(lessonId);
  if (!lessonResult || !lessonResult.content) return <Navigate to="/course/c-foundations" replace />;

  const { course, lesson, content, nextLesson } = lessonResult;

  const languages = useMemo(() => Object.keys(content.exercise.starterCode), [content.exercise.starterCode]);
  const defaultLanguage = useMemo(() => {
    if (languages.includes(content.exercise.defaultLanguage)) return content.exercise.defaultLanguage;
    return (languages[0] as "c") ?? "c";
  }, [languages, content.exercise.defaultLanguage]);

  const [activeTab, setActiveTab] = useState<TabId>("course");
  const [language, setLanguage] = useState(defaultLanguage);
  const [codeByLanguage, setCodeByLanguage] = useState<Record<string, string>>({ ...content.exercise.starterCode });
  const [consoleOutput, setConsoleOutput] = useState<string>(consolePlaceholder);
  const [isRunning, setIsRunning] = useState(false);
  const [testStatuses, setTestStatuses] = useState<TestStatus[]>(content.exercise.tests.map(() => "idle" as TestStatus));
  const [submissionState, setSubmissionState] = useState<"idle" | "submitting" | "passed" | "failed">("idle");
  const [leftPaneWidth, setLeftPaneWidth] = useState<number>(Number.NaN);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [consoleHeight, setConsoleHeight] = useState(DEFAULT_CONSOLE_HEIGHT);
  const [isConsoleResizing, setIsConsoleResizing] = useState(false);
  const consoleResizeStateRef = useRef<{ startY: number; startHeight: number }>({ startY: 0, startHeight: DEFAULT_CONSOLE_HEIGHT });
  const [testPanelHeight, setTestPanelHeight] = useState(DEFAULT_TEST_PANEL_HEIGHT);
  const [isTestPanelResizing, setIsTestPanelResizing] = useState(false);
  const testPanelResizeStateRef = useRef<{ startY: number; startHeight: number }>({ startY: 0, startHeight: DEFAULT_TEST_PANEL_HEIGHT });

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    editor.focus();
  };

  // reset on lesson change
  useEffect(() => {
    setActiveTab("course");
    setLanguage(defaultLanguage);
    setCodeByLanguage({ ...content.exercise.starterCode });
    setConsoleOutput(consolePlaceholder);
    setTestStatuses(content.exercise.tests.map(() => "idle" as TestStatus));
    setSubmissionState("idle");
    setConsoleHeight(DEFAULT_CONSOLE_HEIGHT);
    setTestPanelHeight(DEFAULT_TEST_PANEL_HEIGHT);
  }, [content, defaultLanguage]);

  const updateLayoutDimensions = useCallback(() => {
    if (typeof window === "undefined") return;

    const isLgViewport = window.innerWidth >= 1024;
    setIsDesktop(isLgViewport);
    if (!layoutRef.current || !isLgViewport) return;

    const rect = layoutRef.current.getBoundingClientRect();
    const availableWidth = rect.width - RESIZER_WIDTH;
    const defaultWidth = Math.max(availableWidth * 0.35, MIN_LEFT_WIDTH);

    setLeftPaneWidth((current) => {
      if (!Number.isFinite(current)) return Math.min(defaultWidth, Math.max(availableWidth - MIN_RIGHT_WIDTH, MIN_LEFT_WIDTH));
      const maxWidth = Math.max(availableWidth - MIN_RIGHT_WIDTH, MIN_LEFT_WIDTH);
      return Math.min(Math.max(current, MIN_LEFT_WIDTH), maxWidth);
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    updateLayoutDimensions();
    window.addEventListener("resize", updateLayoutDimensions);
    return () => window.removeEventListener("resize", updateLayoutDimensions);
  }, [updateLayoutDimensions]);

  useEffect(() => {
    if (!isDesktop) {
      setIsResizing(false);
      setIsConsoleResizing(false);
      setIsTestPanelResizing(false);
    }
  }, [isDesktop]);

  // vertical resizer between panes
  useEffect(() => {
    if (!isResizing || !isDesktop) return;

    const handleMouseMove = (event: MouseEvent) => {
      if (!layoutRef.current) return;
      const rect = layoutRef.current.getBoundingClientRect();
      const availableWidth = rect.width - RESIZER_WIDTH;
      const pointerOffset = Math.min(Math.max(event.clientX - rect.left, MIN_LEFT_WIDTH), availableWidth);
      const maxWidth = Math.max(availableWidth - MIN_RIGHT_WIDTH, MIN_LEFT_WIDTH);
      setLeftPaneWidth(Math.min(pointerOffset, maxWidth));
    };

    const stopResizing = () => setIsResizing(false);

    const prevCursor = document.body.style.cursor;
    const prevSelect = document.body.style.userSelect;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      document.body.style.cursor = prevCursor;
      document.body.style.userSelect = prevSelect;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, isDesktop]);

  // horizontal console resizer
  useEffect(() => {
    if (!isConsoleResizing) return;
    const handleMouseMove = (event: MouseEvent) => {
      const { startY, startHeight } = consoleResizeStateRef.current;
      const delta = startY - event.clientY;
      setConsoleHeight(Math.min(Math.max(startHeight + delta, MIN_CONSOLE_HEIGHT), MAX_CONSOLE_HEIGHT));
    };
    const stopResize = () => setIsConsoleResizing(false);

    const prevCursor = document.body.style.cursor;
    const prevSelect = document.body.style.userSelect;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopResize);
    return () => {
      document.body.style.cursor = prevCursor;
      document.body.style.userSelect = prevSelect;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopResize);
    };
  }, [isConsoleResizing]);

  // exercise test panel resizer
  useEffect(() => {
    if (!isTestPanelResizing) return;
    const handleMouseMove = (event: MouseEvent) => {
      const { startY, startHeight } = testPanelResizeStateRef.current;
      const delta = startY - event.clientY;
      setTestPanelHeight(Math.max(startHeight + delta, MIN_TEST_PANEL_HEIGHT));
    };
    const stopResize = () => setIsTestPanelResizing(false);

    const prevCursor = document.body.style.cursor;
    const prevSelect = document.body.style.userSelect;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopResize);
    return () => {
      document.body.style.cursor = prevCursor;
      document.body.style.userSelect = prevSelect;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopResize);
    };
  }, [isTestPanelResizing]);

  const handleResizeStart = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!isDesktop) return;
    setIsResizing(true);
  }, [isDesktop]);

  const handleResizeReset = useCallback(() => {
    if (!layoutRef.current || !isDesktop) return;
    const rect = layoutRef.current.getBoundingClientRect();
    const availableWidth = rect.width - RESIZER_WIDTH;
    const defaultWidth = Math.max(availableWidth * 0.4, MIN_LEFT_WIDTH);
    const maxWidth = Math.max(availableWidth - MIN_RIGHT_WIDTH, MIN_LEFT_WIDTH);
    setLeftPaneWidth(Math.min(defaultWidth, maxWidth));
  }, [isDesktop]);

  const handleConsoleResizeStart = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    consoleResizeStateRef.current = { startY: event.clientY, startHeight: consoleHeight };
    setIsConsoleResizing(true);
  }, [consoleHeight]);

  const handleConsoleResizeReset = useCallback(() => setConsoleHeight(DEFAULT_CONSOLE_HEIGHT), []);

  const handleTestPanelResizeStart = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    testPanelResizeStateRef.current = { startY: event.clientY, startHeight: testPanelHeight };
    setIsTestPanelResizing(true);
  }, [testPanelHeight]);

  const handleTestPanelResizeReset = useCallback(() => setTestPanelHeight(DEFAULT_TEST_PANEL_HEIGHT), []);

  const currentCode = codeByLanguage[language] ?? "";
  const monacoLanguage = monacoLanguageMap[language] ?? "plaintext";
  const isConsoleCollapsed = consoleHeight <= MIN_CONSOLE_HEIGHT + 1;
  const isTestPanelCollapsed = testPanelHeight <= MIN_TEST_PANEL_HEIGHT + 1;

  const updateCode = (value: string | undefined) => {
    setCodeByLanguage((prev) => ({ ...prev, [language]: value ?? "" }));
  };

  const handleExecute = async (mode: "run" | "test" | "submit") => {
    const isTestFlow = mode !== "run";

    setIsRunning(true);
    if (isTestFlow) setTestStatuses(content.exercise.tests.map(() => "running" as TestStatus));
    if (mode === "submit") setSubmissionState("submitting");

    let allTestsPassed = !isTestFlow;

    try {
      const response = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code: currentCode, lessonId, tests: isTestFlow ? content.exercise.tests : undefined }),
      });

      const result = await response.json().catch(() => ({} as any));
      if (!response.ok) {
        const errorMessage = (typeof result.error === "string" && result.error)
          || (typeof result.message === "string" && result.message)
          || `Run failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      const output = typeof result.output === "string"
        ? result.output
        : typeof result.stdout === "string"
          ? result.stdout
          : JSON.stringify(result, null, 2);

      setConsoleOutput(output || "Execution finished with no stdout.");

      if (isTestFlow) {
        const rawResults = Array.isArray(result.results) ? result.results : [];
        const resolved = content.exercise.tests.map((test) => {
          const match = rawResults.find((entry: { id?: string; name?: string; passed?: boolean; success?: boolean }) =>
            entry.id === test.id || entry.name === test.name,
          );
          if (!match) { allTestsPassed = false; return "failed" as TestStatus; }
          const didPass = match.passed ?? match.success ?? false;
          if (!didPass) allTestsPassed = false;
          return didPass ? ("passed" as TestStatus) : ("failed" as TestStatus);
        });
        if (rawResults.length === 0) allTestsPassed = false;
        setTestStatuses(resolved);
      }

      if (mode === "submit") {
        if (allTestsPassed) {
          try { await fetch(`/api/progress/complete/${lesson.id}`, { method: "POST" }); } catch { }
          setSubmissionState("passed");
        } else {
          setSubmissionState("failed");
        }
      }
    } catch (error) {
      console.error("Failed to execute lesson code", error);
      setConsoleOutput(error instanceof Error ? `We couldn't reach the runtime service: ${error.message}` : "We couldn't reach the runtime service. Please try again.");
      if (isTestFlow) setTestStatuses(content.exercise.tests.map(() => "failed" as TestStatus));
      if (mode === "submit") setSubmissionState("failed");
    } finally {
      setIsRunning(false);
      if (mode !== "submit") setSubmissionState((p) => (p === "submitting" ? "idle" : p));
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-cw-body text-gray-100">
      {/* Full-bleed navbar (unchanged) */}
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

      {/* Gutters wrapper: centers content and adds top/bottom/side spacing like AlgoExpert */}
      <div className="flex-1 min-h-0">
        <div className="mx-auto h-full w-full max-w-full px-1 sm:px-2 lg:px-3 py-1 lg:py-3">
          {/* Inset card that contains the two-pane layout */}
          <div
            ref={layoutRef}
            className="flex h-full min-h-0 flex-col bg-cw-panel lg:flex-row rounded-xl border border-cw-border/80 shadow-[0_8px_24px_rgba(0,0,0,0.35)] overflow-hidden"
          >
            {/* Left column: lesson content / tabs */}
            <section
              className="flex h-full min-h-0 flex-col overflow-hidden border-b border-cw-border bg-cw-panel/95 lg:border-r lg:flex-shrink-0"
              style={isDesktop && Number.isFinite(leftPaneWidth) ? { flexBasis: `${leftPaneWidth}px`, width: `${leftPaneWidth}px` } : undefined}
            >
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <div className="shrink-0 border-b border-cw-border-light px-6 py-4 bg-cw-surface/90">
                  <p className="text-xs uppercase tracking-[0.3em] text-cw-accent">Lesson {lesson.title}</p>
                  <h1 className="mt-2 text-xl font-semibold text-white">{lesson.summary}</h1>
                </div>

                <div className="flex shrink-0 border-b border-cw-border-light bg-cw-surface/60">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={clsx(
                        "flex-1 px-4 py-3 text-sm font-medium transition",
                        activeTab === tab.id ? "border-b-2 border-cw-accent text-white" : "border-b border-transparent text-cw-text-muted hover:text-gray-200",
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex-1 min-h-0 px-4 py-4 overflow-hidden">
                  {activeTab === "course" && (
                    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-md bg-cw-panel-alt/70 p-4">
                      <article className="flex-1 min-h-0 space-y-6 overflow-y-auto pr-2 pb-2 text-sm text-cw-text-muted">
                        <p className="text-base text-gray-200">{content.intro}</p>
                        {content.courseSections.map((section, index) => (
                          <section key={section.title} className={clsx("space-y-3", index > 0 && "pt-4")}>
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
                          </section>
                        ))}
                        {content.resources.length > 0 && (
                          <footer className="pt-4">
                            <h3 className="text-sm font-semibold text-cw-accent-light">Resources</h3>
                            <ul className="mt-2 space-y-1 text-sm text-cw-text-muted">
                              {content.resources.map((resource) => (
                                <li key={resource.href}>
                                  <a className="text-cw-accent-light hover:text-cw-accent" href={resource.href} target="_blank" rel="noreferrer">
                                    {resource.label}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </footer>
                        )}
                      </article>
                    </div>
                  )}

                  {activeTab === "video" && (
                    <div className="flex h-full min-h-0 flex-col space-y-4 overflow-y-auto pr-2">
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
                    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-md bg-cw-panel-alt/70">
                      <div className="flex-1 min-h-0 px-4 py-4">
                        <article className="flex h-full min-h-0 flex-col space-y-4 overflow-y-auto pr-2 pb-2 text-sm text-cw-text-muted">
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
                              We load language-specific boilerplate in the playground. Switch languages to compare implementations or
                              port your solution.
                            </p>
                          </div>
                        </article>
                      </div>

                      <div
                        role="separator"
                        aria-orientation="horizontal"
                        className={clsx(
                          "relative z-10 flex h-3 shrink-0 cursor-row-resize items-center justify-center bg-transparent",
                          isTestPanelResizing ? "bg-cw-accent/40" : "hover:bg-cw-accent/20",
                        )}
                        onMouseDown={handleTestPanelResizeStart}
                        onDoubleClick={handleTestPanelResizeReset}
                        title="Drag to resize the test panel. Double-click to reset."
                      >
                        <span className="h-1 w-12 rounded-full bg-cw-border" />
                      </div>

                      <div
                        className={clsx(
                          "shrink-0 flex-none border-t border-cw-border bg-cw-panel-alt/80",
                          isTestPanelCollapsed ? "px-0 py-0" : "px-4 py-4",
                        )}
                        style={{
                          height: `${Math.max(testPanelHeight, 0)}px`,
                          flexBasis: `${Math.max(testPanelHeight, 0)}px`,
                          minHeight: `${MIN_TEST_PANEL_HEIGHT}px`,
                        }}
                      >
                        <div className={clsx(
                          "flex h-full flex-col overflow-hidden",
                          isTestPanelCollapsed && "pointer-events-none opacity-0",
                        )}
                        >
                          <div className="flex shrink-0 items-center justify-between">
                            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-300">Test panel</h2>
                          </div>
                          <div className="flex-1 min-h-0 overflow-y-auto pr-2">
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
                          </div>
                          {nextLesson && (
                            <div className="mt-3 shrink-0">
                              <button
                                type="button"
                                onClick={() => navigate(`/lesson/${nextLesson.id}`)}
                                className="inline-flex items-center gap-2 rounded-full border border-cw-border-light px-3 py-1 text-xs font-semibold text-cw-accent-light transition hover:border-cw-accent hover:text-cw-accent"
                              >
                                Next lesson
                                <ArrowRightIcon className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Vertical resizer */}
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

            {/* Right column: editor + console */}
            <section className="flex h-full min-h-0 flex-col border-l border-cw-border bg-cw-panel lg:flex-1 lg:min-w-[360px] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              {/* Playground header */}
              <div className="flex items-center justify-between border-b border-cw-border-light bg-cw-panel-alt/70 px-4 py-3">
                <div className="flex items-center gap-2">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as typeof language)}
                    className="rounded border border-cw-border bg-cw-panel-alt/80 px-2 py-1 text-xs text-white shadow-inner shadow-black/40 focus:border-cw-accent focus:outline-none"
                  >
                    {languages.map((lang) => (
                      <option key={lang} value={lang}>{lang.toUpperCase()}</option>
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

              {/* Editor */}
              <div className="flex flex-1 min-h-0 flex-col">
                <div className="border-b border-cw-border bg-cw-panel/80 p-2">
                  <h3 className="text-sm font-semibold text-white">Your Solution</h3>
                </div>
                <div className="flex-1 min-h-0 overflow-hidden">
                  <Editor
                    height="100%"
                    language={monacoLanguage}
                    theme="vs-dark"
                    value={currentCode}
                    onChange={updateCode}
                    onMount={handleEditorDidMount}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 11,
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      lineNumbers: "on",
                      renderLineHighlight: "all",
                      scrollbar: { vertical: "visible", horizontal: "visible" },
                    }}
                  />
                </div>

                {/* Console resizer */}
                <div
                  role="separator"
                  aria-orientation="horizontal"
                  className={clsx(
                    "h-2 flex-none cursor-row-resize select-none bg-cw-border/70 transition-colors",
                    isConsoleResizing ? "bg-cw-accent" : "hover:bg-cw-accent/60",
                  )}
                  onMouseDown={handleConsoleResizeStart}
                  onDoubleClick={handleConsoleResizeReset}
                  title="Drag to resize the console. Double-click to reset."
                />

                {/* Console */}
                <div
                  className={clsx(
                    "flex flex-none flex-col border-t border-cw-border bg-cw-panel",
                    isConsoleCollapsed && "border-t-transparent",
                  )}
                  style={{ height: `${consoleHeight}px`, flexBasis: `${consoleHeight}px`, minHeight: `${MIN_CONSOLE_HEIGHT}px`, maxHeight: `${MAX_CONSOLE_HEIGHT}px` }}
                >
                  {!isConsoleCollapsed && (
                    <>
                      <div className="flex items-center justify-between border-b border-cw-border-light px-3 py-2">
                        <h4 className="text-sm font-semibold text-white">Output</h4>
                      </div>
                      <pre className="flex-1 overflow-y-auto bg-cw-surface p-3 font-mono text-xs text-gray-300 whitespace-pre-wrap">{consoleOutput}</pre>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3 border-t border-cw-border bg-cw-panel px-4 py-3">
                <div className="flex flex-1 items-center gap-2 text-xs text-cw-text-muted min-w-[200px] sm:flex-none">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${submissionState === "passed"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : submissionState === "failed"
                          ? "bg-cw-accent/25 text-cw-accent-light"
                          : "bg-cw-border/60 text-cw-text-muted"
                      }`}
                  >
                    {submissionState === "passed" ? "✅ All Tests Passed" : submissionState === "failed" ? "❌ Tests Failed" : "⚡ Ready to Submit"}
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
      </div>
    </div>
  );
}
