import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { isAxiosError } from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import api, { fetchLesson, fetchNextLesson } from "../api";
import CodeEditor from "../components/CodeEditor";
import CourseSidebar, { CurriculumSection, LessonStatus } from "../components/CourseSidebar";
import ProgressBar from "../components/ProgressBar";
import VideoPlayer from "../components/VideoPlayer";
import { useAuth } from "../context";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { CourseLessonsResponse, ExerciseDetail, LessonDetail } from "../types/course";
import { computeProgressFromLessons } from "../utils/courseProgress";
import { yearOneCourses, defaultYearOneCourseSlug } from "../data/yearOne";

const EMPTY_EXERCISES: ExerciseDetail[] = [];

const DEFAULT_WORKSPACE_LAYOUT: [number, number] = [35, 65];
const DEFAULT_PLAYGROUND_LAYOUT: [number, number] = [60, 40];
const WORKSPACE_LAYOUT_STORAGE_KEY = "course-workspace-layout";
const PLAYGROUND_LAYOUT_STORAGE_KEY = "course-playground-layout";

const sanitizeStoredLayout = (
  value: unknown,
  fallback: [number, number]
): [number, number] => {
  if (!Array.isArray(value) || value.length !== 2) {
    return fallback;
  }

  const [first, second] = value;

  if (typeof first !== "number" || typeof second !== "number") {
    return fallback;
  }

  if (!Number.isFinite(first) || !Number.isFinite(second) || first <= 0 || second <= 0) {
    return fallback;
  }

  const total = first + second;
  if (!Number.isFinite(total) || total <= 0) {
    return fallback;
  }

  const scale = 100 / total;
  const normalized: [number, number] = [
    Math.round(first * scale * 100) / 100,
    Math.round(second * scale * 100) / 100
  ];

  return normalized;
};

const readStoredLayout = (key: string, fallback: [number, number]): [number, number] => {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const stored = window.localStorage.getItem(key);
    if (!stored) {
      return fallback;
    }

    const parsed = JSON.parse(stored) as unknown;
    return sanitizeStoredLayout(parsed, fallback);
  } catch (error) {
    console.warn(`Unable to read saved layout for ${key}`, error);
    return fallback;
  }
};

const FullscreenIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 4h6v2H6v4H4zM20 4v6h-2V6h-4V4zM20 20h-6v-2h4v-4h2zM4 20v-6h2v4h4v2z" />
  </svg>
);

const RefreshIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 1 1-2.64-6.36" />
    <path d="M21 3v6h-6" />
  </svg>
);

const IconButton = ({
  onClick,
  label,
  children,
  disabled,
}: {
  onClick: () => void;
  label: string;
  children: ReactNode;
  disabled?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    title={label}
    className="inline-flex h-10 w-10 items-center justify-center rounded-lg shadow-[inset_0_0_0_1px_rgba(15,23,42,0.8)] border border-[#152842] bg-white/5 text-slate-100 transition hover:-translate-y-0.5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-sky-500/40 disabled:cursor-not-allowed disabled:opacity-60"
  >
    {children}
    <span className="sr-only">{label}</span>
  </button>
);


const cloneCourseData = (source: CourseLessonsResponse): CourseLessonsResponse => {
  const course = { ...source.course };
  const lessons = source.lessons.map((lesson) => ({
    ...lesson,
    progress: lesson.progress ? { ...lesson.progress } : null,
    exercises: lesson.exercises.map((exercise) => ({
      ...exercise,
      starter_code: { ...exercise.starter_code },
      progress: exercise.progress ? { ...exercise.progress } : null
    }))
  }));
  return {
    course,
    lessons,
    course_progress: {
      ...source.course_progress,
      course
    }
  };
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

type EditorState = Record<number, Record<string, Record<string, string>>>;

type ConsoleResult = {
  id: number | string;
  title: string;
  passed: boolean;
  stdout: string;
  stderr: string;
  expected?: string;
  input?: string;
};

type DemoTestCase = {
  id: string;
  title: string;
  stdout: string;
  expected: string;
  passed: boolean;
  input?: string;
};

type DemoSimulation = {
  run: (code: string) => string;
  tests: DemoTestCase[];
  message: string;
};

const toSlug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

const createRunLog = (exerciseSlug: string, lines: string[]): string => {
  const slug = toSlug(exerciseSlug);
  return [
    `gcc ${slug || "demo"}.c -Wall -Wextra -Werror`,
    "./a.out",
    "--------------------------------",
    ...lines
  ].join("\n");
};

const demoExerciseSimulations: Record<number, DemoSimulation> = {
  1001: {
    run: (code: string) => {
      void code;
      return createRunLog("ft_strlen", [
        'Input: "Orus School"',
        "Computed length: 11",
        "Remember: the null terminator is not counted in the length.",
        "",
        "Try modifying the string above to see the log update."
      ]);
    },
    tests: [
      {
        id: "strlen-1",
        title: "Test 1 · hello",
        stdout: 'ft_strlen("hello") → 5',
        expected: "5",
        passed: true
      },
      {
        id: "strlen-2",
        title: "Test 2 · empty string",
        stdout: 'ft_strlen("") → 0',
        expected: "0",
        passed: true
      },
      {
        id: "strlen-3",
        title: "Test 3 · mixed case",
        stdout: 'ft_strlen("Pointer") → 7',
        expected: "7",
        passed: true
      }
    ],
    message: "Nice work! You've reproduced ft_strlen and cleared the first milestone."
  },
  1002: {
    run: (code: string) => {
      void code;
      return createRunLog("ft_strcpy", [
        'Destination buffer before: ""',
        'Copying from src: "pointers rock"',
        'Destination buffer after: "pointers rock"',
        "Return pointer matches dest ✔"
      ]);
    },
    tests: [
      {
        id: "strcpy-1",
        title: "Test 1 · basic copy",
        stdout: 'ft_strcpy(buf, "c99") → "c99"',
        expected: "c99",
        passed: true
      },
      {
        id: "strcpy-2",
        title: "Test 2 · long word",
        stdout: 'ft_strcpy(buf, "memory") → "memory"',
        expected: "memory",
        passed: true
      },
      {
        id: "strcpy-3",
        title: "Test 3 · punctuation",
        stdout: 'ft_strcpy(buf, "libft!") → "libft!"',
        expected: "libft!",
        passed: true
      }
    ],
    message: "Copy complete! Your ft_strcpy behaves like the standard library call."
  },
  1003: {
    run: (code: string) => {
      void code;
      return createRunLog("ft_strcmp", [
        'Comparing "apple" vs "apple" → 0',
        'Comparing "libft" vs "piscine" → -4',
        'Comparing "xyz" vs "abc" → 23',
        "Cast to unsigned char before subtracting to avoid surprises."
      ]);
    },
    tests: [
      {
        id: "strcmp-1",
        title: "Test 1 · identical",
        stdout: 'ft_strcmp("hello", "hello") → 0',
        expected: "0",
        passed: true
      },
      {
        id: "strcmp-2",
        title: "Test 2 · lexicographic",
        stdout: 'ft_strcmp("abc", "abd") → -1',
        expected: "-1",
        passed: true
      },
      {
        id: "strcmp-3",
        title: "Test 3 · reverse",
        stdout: 'ft_strcmp("pool", "book") → 14',
        expected: "14",
        passed: true
      }
    ],
    message: "Pointer wizardry unlocked! ft_strcmp now mirrors the libc behaviour."
  },
  1004: {
    run: (code: string) => {
      void code;
      return createRunLog("ft_calloc", [
        "Request: 5 blocks × 4 bytes",
        "Allocation succeeded → pointer 0x1000",
        "Memory preview: 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00",
        "Remember to free the buffer when you're done."
      ]);
    },
    tests: [
      {
        id: "calloc-1",
        title: "Test 1 · zeroed bytes",
        stdout: "All bytes initialised to 0",
        expected: "0-filled",
        passed: true
      },
      {
        id: "calloc-2",
        title: "Test 2 · overflow guard",
        stdout: "Count × size overflow detected",
        expected: "NULL",
        passed: true
      },
      {
        id: "calloc-3",
        title: "Test 3 · pointer reuse",
        stdout: "Returning stable pointer for repeated calls",
        expected: "stable",
        passed: true
      }
    ],
    message: "All allocation checks passed. You're ready to tackle libft's memory helpers!"
  }
};

const demoExerciseHints: Record<number, string[]> = {
  1001: [
    "Iterate one character at a time and stop when you encounter the null terminator.",
    "Use a size_t accumulator so the function works for long strings."
  ],
  1002: [
    "Copy the terminating null byte after the loop completes.",
    "Returning dest lets callers chain the function just like the standard library."
  ],
  1003: [
    "Compare unsigned char values to avoid surprises with negative chars.",
    "Exit early as soon as characters differ to return the lexicographic gap."
  ],
  1004: [
    "Check if count * size would overflow before allocating.",
    "Use a helper to zero-out the buffer just like memset does."
  ]
};

const CoursePage = () => {
  const params = useParams();
  const courseIdParam = params.courseId;
  const lessonIdParam = params.lessonId;
  const courseId = courseIdParam ?? "demo";
  const numericCourseId = Number(courseId);
  const lessonIdNumber = lessonIdParam ? Number(lessonIdParam) : null;
  const lessonIdFromParam =
    typeof lessonIdNumber === "number" && !Number.isNaN(lessonIdNumber) ? lessonIdNumber : null;
  const isWorkspaceRoute = Boolean(courseIdParam);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const courseRouteBase = useMemo(() => `/app/courses/${courseId}`, [courseId]);
  const handleLogout = useCallback(() => {
    logout();
    navigate("/login");
  }, [logout, navigate]);

  const [courseData, setCourseData] = useState<CourseLessonsResponse | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<number | null>(null);
  const [activeExerciseId, setActiveExerciseId] = useState<number | null>(null);
  const [editorValues, setEditorValues] = useState<EditorState>({});
  const [selectedLanguage, setSelectedLanguage] = useState<string>("python");
  const [solutionTab, setSolutionTab] = useState("solution1");
  const [consoleOutput, setConsoleOutput] = useState<string>("");
  const [outputTab, setOutputTab] = useState<"custom" | "raw">("custom");
  const [testResults, setTestResults] = useState<ConsoleResult[]>([]);
  const [runLoading, setRunLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [lessonMarkLoading, setLessonMarkLoading] = useState(false);
  const [nextLessonLoading, setNextLessonLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [videoWatched, setVideoWatched] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [autoCompleteTriggered, setAutoCompleteTriggered] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [hintStates, setHintStates] = useState<Record<string, boolean>>({});
  const [leftTab, setLeftTab] = useState<"overview" | "lesson" | "video" | "exercise">("lesson");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("orus-course-theme") !== "light";
  });
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);
  const storedWorkspaceLayout = useMemo(
    () => readStoredLayout(WORKSPACE_LAYOUT_STORAGE_KEY, DEFAULT_WORKSPACE_LAYOUT),
    []
  );
  const storedPlaygroundLayout = useMemo(
    () => readStoredLayout(PLAYGROUND_LAYOUT_STORAGE_KEY, DEFAULT_PLAYGROUND_LAYOUT),
    []
  );
  const [isCompactLayout, setIsCompactLayout] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia("(max-width: 1023px)").matches;
  });

  const activeLessonRef = useRef<number | null>(null);
  const activeExerciseRef = useRef<number | null>(null);
  const restoredDraftsRef = useRef<Set<string>>(new Set());
  const storageKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("orus-course-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const body = document.body;
    if (isEditorFullscreen) {
      body.classList.add("overflow-hidden");
    } else {
      body.classList.remove("overflow-hidden");
    }
    return () => {
      body.classList.remove("overflow-hidden");
    };
  }, [isEditorFullscreen]);

  useEffect(() => {
    activeLessonRef.current = activeLessonId;
  }, [activeLessonId]);

  useEffect(() => {
    activeExerciseRef.current = activeExerciseId;
  }, [activeExerciseId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    const handleChange = (event: MediaQueryListEvent) => {
      setIsCompactLayout(event.matches);
    };

    setIsCompactLayout(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => {
        mediaQuery.removeEventListener("change", handleChange);
      };
    }

    mediaQuery.addListener(handleChange);
    return () => {
      mediaQuery.removeListener(handleChange);
    };
  }, []);

  const applyCourseData = useCallback((data: CourseLessonsResponse) => {
    setCourseData(data);

    setEditorValues((prev) => {
      const next: EditorState = { ...prev };
      const solutionKeys = ["solution1"] as const;

      data.lessons.forEach((lesson) => {
        lesson.exercises.forEach((exercise) => {
          const existingExerciseState = next[exercise.id] ?? {};
          const starterEntries = Object.entries(exercise.starter_code ?? {});
          const updatedLanguageState: Record<string, Record<string, string>> = { ...existingExerciseState };

          starterEntries.forEach(([language, starter]) => {
            const existingLanguageState = existingExerciseState[language] ?? {};
            const languageState: Record<string, string> = { ...existingLanguageState };

            solutionKeys.forEach((key, index) => {
              if (!(key in languageState)) {
                languageState[key] = index === 0 ? starter : existingLanguageState[key] ?? starter;
              }
            });

            updatedLanguageState[language] = languageState;
          });

          next[exercise.id] = updatedLanguageState;
        });
      });

      return next;
    });

    const previousLessonId = activeLessonRef.current;
    const lessonFromParam =
      lessonIdFromParam !== null
        ? data.lessons.find((lesson) => lesson.id === lessonIdFromParam) ?? null
        : null;
    const existingLesson = data.lessons.find((lesson) => lesson.id === (previousLessonId ?? undefined));
    const lessonToUse = lessonFromParam ?? existingLesson ?? data.lessons[0] ?? null;
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

    if (isWorkspaceRoute && lessonToUse && lessonToUse.id !== lessonIdFromParam) {
      navigate(`${courseRouteBase}/lesson/${lessonToUse.id}`, { replace: lessonFromParam === null });
    }
  }, [courseRouteBase, isWorkspaceRoute, lessonIdFromParam, navigate]);

  const getFallbackCourse = useCallback((): CourseLessonsResponse => {
    if (courseIdParam && yearOneCourses[courseIdParam]) {
      return yearOneCourses[courseIdParam];
    }

    if (Number.isFinite(numericCourseId)) {
      const candidate = Object.values(yearOneCourses).find(
        (entry) => entry.course.id === numericCourseId
      );
      if (candidate) {
        return candidate;
      }
    }

    return yearOneCourses[defaultYearOneCourseSlug];
  }, [courseIdParam, numericCourseId]);

  const loadCourse = useCallback(async () => {
    const shouldUseDemo = !Number.isFinite(numericCourseId);
    setSuccessMessage(null);
    if (shouldUseDemo) {
      setIsDemoMode(true);
      applyCourseData(cloneCourseData(getFallbackCourse()));
      return;
    }

    try {
      const { data } = await api.get<CourseLessonsResponse>(`/lessons/${numericCourseId}`);
      setIsDemoMode(false);
      applyCourseData(data);
    } catch (error) {
      console.error("Failed to load course", error);
      setIsDemoMode(true);
      applyCourseData(cloneCourseData(getFallbackCourse()));
    }
  }, [numericCourseId, applyCourseData, getFallbackCourse]);

  useEffect(() => {
    void loadCourse();
  }, [loadCourse]);

  const lessons = useMemo(() => courseData?.lessons ?? [], [courseData]);

  const sortedLessons = useMemo(
    () => [...lessons].sort((a, b) => a.order_index - b.order_index),
    [lessons]
  );

  const lessonStatusEntries = useMemo(() => {
    const items: { id: number; title: string; status: LessonStatus }[] = [];
    let encounteredActive = false;
    sortedLessons.forEach((lesson) => {
      let status: LessonStatus;
      if (lesson.progress?.completed) {
        status = "completed";
      } else if (!encounteredActive) {
        status = "in_progress";
        encounteredActive = true;
      } else {
        status = "locked";
      }
      items.push({ id: lesson.id, title: lesson.title, status });
    });
    return items;
  }, [sortedLessons]);

  const lessonStatusMap = useMemo(() => {
    const map = new Map<number, LessonStatus>();
    lessonStatusEntries.forEach((item) => {
      map.set(item.id, item.status);
    });
    return map;
  }, [lessonStatusEntries]);

  const activeLesson = useMemo(
    () => sortedLessons.find((lesson) => lesson.id === activeLessonId) ?? sortedLessons[0] ?? null,
    [sortedLessons, activeLessonId]
  );

  const curriculumSections = useMemo<CurriculumSection[]>(() => {
    const baseLessonItems = sortedLessons.map((lesson, index) => {
      const lessonStatus = lessonStatusMap.get(lesson.id) ?? "locked";
      const exerciseItems = lesson.exercises.map((exercise, exerciseIndex) => {
        const progressStatus = exercise.progress?.status === "passed";
        const status: LessonStatus = lessonStatus === "locked"
          ? "locked"
          : progressStatus
          ? "completed"
          : "in_progress";
        return {
          id: exercise.id,
          title: exercise.title,
          kind: "exercise" as const,
          meta: `Exercise ${exerciseIndex + 1}`,
          lessonId: lesson.id,
          status,
          disabled: lessonStatus === "locked"
        } satisfies CurriculumSection["items"][number];
      });

      return {
        id: lesson.id,
        title: lesson.title,
        kind: "lesson" as const,
        meta: `Lesson ${index + 1}`,
        status: lessonStatus,
        items: exerciseItems
      } satisfies CurriculumSection["items"][number];
    });

    if (isDemoMode) {
      const moduleStatus: LessonStatus = baseLessonItems.every((item) => item.status === "completed")
        ? "completed"
        : baseLessonItems.some((item) => item.status !== "locked")
        ? "in_progress"
        : "locked";

      const module = {
        title: "C Basics (4 lessons, 1 project)",
        kind: "module" as const,
        status: moduleStatus,
        meta: "Track",
        items: [
          ...baseLessonItems,
          {
            title: "Project: libft",
            kind: "project" as const,
            status: "locked" as LessonStatus,
            meta: "Project",
            disabled: true
          }
        ]
      };

      const followUpTracks = [
        {
          title: "Shell & Git",
          kind: "module" as const,
          status: "locked" as LessonStatus,
          meta: "Track",
          disabled: true
        },
        {
          title: "Memory & I/O",
          kind: "module" as const,
          status: "locked" as LessonStatus,
          meta: "Track",
          disabled: true
        },
        {
          title: "Algorithms & Data Structures",
          kind: "module" as const,
          status: "locked" as LessonStatus,
          meta: "Track",
          disabled: true
        }
      ];

      return [
        {
          id: "year-1-foundations",
          title: "Year 1: Foundations",
          subtitle: "Roadmap: C basics, shell mastery, and algorithm prep",
          items: [module, ...followUpTracks]
        }
      ];
    }

    const lessonCount = baseLessonItems.length;

    return [
      {
        id: `course-${courseData?.course.id ?? "outline"}`,
        title: "Course roadmap",
        subtitle: `${lessonCount} lesson${lessonCount === 1 ? "" : "s"}`,
        items: baseLessonItems
      }
    ];
  }, [sortedLessons, lessonStatusMap, isDemoMode, courseData?.course.id]);

  const exercises = activeLesson?.exercises ?? EMPTY_EXERCISES;

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

  const testsPassed = useMemo(
    () => testResults.length > 0 && testResults.every((result) => result.passed),
    [testResults]
  );

  const videoProgressPercent = Math.min(Math.max(Math.round(videoProgress * 100), 0), 100);

  const exerciseHints = useMemo<string[]>(() => {
    if (!activeExercise) {
      return [];
    }
    if (isDemoMode && demoExerciseHints[activeExercise.id]) {
      return demoExerciseHints[activeExercise.id];
    }
    return [
      "Break the problem into small helper functions before coding.",
      "Use the provided tests tab to validate edge cases."
    ];
  }, [activeExercise, isDemoMode]);

  const nextLessonCandidate = useMemo(() => {
    if (!activeLesson) {
      return null;
    }
    const currentLessonIndex = sortedLessons.findIndex((lesson) => lesson.id === activeLesson.id);
    if (currentLessonIndex === -1) {
      return null;
    }
    return sortedLessons[currentLessonIndex + 1] ?? null;
  }, [activeLesson, sortedLessons]);

  const previousLessonCandidate = useMemo(() => {
    if (!activeLesson) {
      return null;
    }
    const currentLessonIndex = sortedLessons.findIndex((lesson) => lesson.id === activeLesson.id);
    if (currentLessonIndex === -1) {
      return null;
    }
    return currentLessonIndex > 0 ? sortedLessons[currentLessonIndex - 1] : null;
  }, [activeLesson, sortedLessons]);

  const nextLessonLabel = useMemo(() => {
    if (!nextLessonCandidate) {
      return "All lessons completed";
    }
    return `Next lesson · ${nextLessonCandidate.title}`;
  }, [nextLessonCandidate]);

  const readyForNextLesson = videoWatched && testsPassed;

  const leftTabs = [
    { id: "overview" as const, label: "Course Overview" },
    { id: "lesson" as const, label: "Current Lesson" },
    { id: "video" as const, label: "Video Explanation" },
    { id: "exercise" as const, label: "Exercise" }
  ];

  const outputTabs = [
    { id: "custom" as const, label: "Custom Output" },
    { id: "raw" as const, label: "Raw Output" }
  ];

  const ResizeHandle = ({ orientation }: { orientation: "horizontal" | "vertical" }) => (
    <PanelResizeHandle
      className={`group flex flex-none items-center justify-center transition ${
        orientation === "vertical"
          ? "w-3 cursor-col-resize"
          : "h-3 cursor-row-resize"
      }`}
    >
      <div
        className={`rounded-full bg-slate-300/80 transition group-hover:bg-sky-400/80 dark:bg-slate-700/80 dark:group-hover:bg-sky-500/80 ${
          orientation === "vertical" ? "h-24 w-1" : "h-1 w-24"
        }`}
      />
    </PanelResizeHandle>
  );

  const CourseTabsPanelContent = () => (
    <div
      className={`flex min-h-0 min-w-0 flex-col overflow-hidden bg-transparent ${
        isCompactLayout ? "h-auto" : "h-full"
      }`}
    >
      <div className="flex items-center gap-4 border-b border-[#152842] bg-[#0d1b33] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
        {leftTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setLeftTab(tab.id)}
            className={`relative pb-2 transition ${
              leftTab === tab.id
                ? "text-slate-900 dark:text-white"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            {tab.label}
            <span
              className={`absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-sky-500 transition ${
                leftTab === tab.id ? "opacity-100" : "opacity-0"
              }`}
            />
          </button>
        ))}
      </div>
      <div className="flex flex-1 min-h-0 overflow-y-auto p-3">
        <div className="flex w-full flex-col gap-6 text-sm text-slate-600 dark:text-slate-300">
          {leftTab === "overview" ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{courseData?.course.title}</h2>
                <p className="text-slate-600 dark:text-slate-300">{courseData?.course.description}</p>
              </div>
              <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white/80 p-6 text-sm text-slate-600 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/80 dark:text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Overall progress
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {Math.round(courseData?.course_progress.completion_percentage ?? 0)}%
                  </span>
                </div>
                <ProgressBar
                  value={courseData?.course_progress.completion_percentage ?? 0}
                  size="lg"
                  label="Completion"
                />
                <div className="grid gap-3 rounded-xl bg-slate-50 p-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:bg-white/5 dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>Lessons</span>
                    <span className="text-sm text-slate-900 dark:text-slate-100">
                      {courseData?.course_progress.lessons_completed ?? 0} / {courseData?.course_progress.lessons_total ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Exercises</span>
                    <span className="text-sm text-slate-900 dark:text-slate-100">
                      {courseData?.course_progress.exercises_completed ?? 0} / {courseData?.course_progress.exercises_total ?? 0}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Curriculum
                </h3>
                <CourseSidebar
                  activeLessonId={activeLessonId}
                  activeExerciseId={activeExerciseId}
                  curriculumSections={curriculumSections}
                  onLessonSelect={(lesson) => handleLessonSelect(lesson.id)}
                  onExerciseSelect={(exercise) => handleExerciseSelect(exercise.lessonId, exercise.id)}
                />
              </div>
            </div>
          ) : null}
          {leftTab === "lesson" ? (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-sky-500">Lesson</p>
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                    {activeLesson ? activeLesson.title : "Select a lesson"}
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300">
                    {activeLesson ? activeLesson.description : "Pick a lesson from the sidebar to begin."}
                  </p>
                </div>
                {activeLesson ? (
                  <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 text-sm text-slate-600 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/90 dark:text-slate-300">
                    <div className="prose prose-slate max-w-none dark:prose-invert">
                      <div dangerouslySetInnerHTML={{ __html: activeLesson.notes }} />
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
                  Exercises in this lesson
                </h3>
                <div className="grid gap-3">
                  {activeLesson?.exercises.map((exercise) => (
                    <button
                      key={exercise.id}
                      onClick={() => handleExerciseSelect(exercise.lesson_id, exercise.id)}
                      className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                        activeExerciseId === exercise.id
                          ? "border-sky-400/70 bg-sky-500/10 text-sky-500"
                          : "border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:bg-sky-50/80 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-500/40 dark:hover:bg-sky-500/10"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{exercise.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{exercise.tests_count} tests</p>
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                        {exercise.progress?.status === "completed" ? "Done" : "Start"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
          {leftTab === "video" ? (
            <div className="space-y-6">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-500">Video</p>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                  {activeLesson ? activeLesson.title : "Select a lesson"}
                </h2>
                <p className="text-slate-600 dark:text-slate-300">
                  {activeLesson ? "Watch the full breakdown and walkthrough." : "Pick a lesson to view the video."}
                </p>
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-black shadow-sm dark:border-slate-800">
                {activeLesson ? (
                  <VideoPlayer
                    url={activeLesson.video_url}
                    title={activeLesson.title}
                    onWatched={() => setVideoWatched(true)}
                    watched={videoWatched}
                    onProgress={handleVideoProgress}
                  />
                ) : (
                  <div className="flex items-center justify-center bg-slate-900/60 p-12 text-sm text-slate-300">
                    Select a lesson to watch the explanation.
                  </div>
                )}
              </div>
              <div className="space-y-3 rounded-xl border border-slate-200 bg-white/80 p-4 text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60 dark:text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Video progress</span>
                  <span className="text-sm text-slate-900 dark:text-white">{videoProgressPercent}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800/50">
                  <div
                    className="h-full rounded-full bg-sky-500 transition-all duration-300 ease-out"
                    style={{ width: `${videoProgressPercent}%` }}
                  />
                </div>
                <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
                  {videoWatched ? "Marked as watched" : "Keep watching to finish this video"}
                </p>
              </div>
            </div>
          ) : null}
          {leftTab === "exercise" ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-500">Exercise prompt</p>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                  {activeExercise ? activeExercise.title : "Select an exercise"}
                </h2>
                <p className="text-slate-600 dark:text-slate-300">
                  {activeExercise ? activeExercise.instructions : "Pick an exercise to view the prompt."}
                </p>
              </div>
              <div className="space-y-4">
                {activeExercise ? (
                  <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/80 p-6 text-sm text-slate-600 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/80 dark:text-slate-300">
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
                        Starter files
                      </h3>
                      <div className="grid gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                        {Object.keys(activeExercise.starter_code ?? {}).map((language) => (
                          <span key={language} className="rounded-md bg-slate-100 px-3 py-1 dark:bg-slate-800">
                            {language.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
                        Helpful hints
                      </h3>
                      <div className="space-y-2">
                        {exerciseHints.map((hint, index) => {
                          const hintId = `${activeExercise.id}-${index}`;
                          const isOpen = hintStates[hintId] ?? false;
                          return (
                            <div key={hintId} className="rounded-xl border border-slate-200 bg-white/60 p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60">
                              <button
                                type="button"
                                onClick={() =>
                                  setHintStates((prev) => ({
                                    ...prev,
                                    [hintId]: !isOpen,
                                  }))
                                }
                                className="flex w-full items-center justify-between text-left text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                              >
                                <span>Hint {index + 1}</span>
                                <span aria-hidden="true">{isOpen ? "−" : "+"}</span>
                              </button>
                              {isOpen ? (
                                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{hint}</p>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p>Select an exercise from the workspace to load the prompt.</p>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <div className="border-t border-slate-200/70 bg-slate-50/70 px-4 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 dark:border-slate-800/60 dark:bg-slate-900/70 dark:text-slate-400">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-full bg-sky-100 px-2 py-1 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300">
              {testsPassed ? "All tests passed" : `${testResults.filter((result) => result.passed).length}/${
                testResults.length
              } tests passed`}
            </span>
            <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200">
              {readyForNextLesson ? "Ready for next lesson" : "Keep going"}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                void handleMarkLessonComplete();
              }}
              disabled={!activeLesson || lessonMarkLoading || lessonAlreadyCompleted}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white/10 dark:hover:bg-white/20"
            >
              {lessonAlreadyCompleted
                ? "Lesson completed"
                : lessonMarkLoading
                ? "Saving..."
                : "Mark lesson complete"}
            </button>
            <button
              onClick={() => {
                void handleGoToLesson("previous");
              }}
              disabled={previousButtonDisabled}
              className="inline-flex items-center gap-2 rounded-full bg-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <span>Previous lesson</span>
            </button>
            <button
              onClick={() => {
                void handleGoToLesson("next");
              }}
              disabled={nextButtonDisabled}
              className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>{nextLessonLoading ? "Loading next lesson..." : nextLessonLabel}</span>
              {nextLessonLoading ? null : <span aria-hidden="true">→</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const PlaygroundPanelContent = () => (
    <div
      className={`flex min-h-0 min-w-0 flex-col overflow-hidden bg-transparent text-slate-100 ${
        isCompactLayout ? "h-auto" : "h-full"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-[#152842] bg-gradient-to-r from-[#0a162b] via-[#10223d] to-[#0a162b] px-2.5 py-1.5">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-white">
          <span className="rounded-l-md bg-[#031025] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-white">Your Solution</span>
          <button
            onClick={() => setSolutionTab("solution1")}
            className={`rounded-none px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40 ${
              solutionTab === "solution1"
                ? "bg-[#17365c] text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.25)]"
                : "bg-[#10223d] text-slate-200 hover:bg-[#163050]"
            }`}
          >
            Your Solution
          </button>
          <span className="text-slate-300">
            {activeExercise ? activeExercise.title : "Select an exercise to begin."}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <IconButton onClick={() => setIsEditorFullscreen(true)} label="Open fullscreen">
            <FullscreenIcon className="h-4 w-4" />
          </IconButton>
          <IconButton
            onClick={handleRunTests}
            label={testLoading ? "Running tests..." : "Run tests"}
            disabled={testLoading}
          >
            <RefreshIcon className={`h-4 w-4 ${testLoading ? "animate-spin" : ""}`} />
          </IconButton>
          <button
            onClick={handleRunCode}
            disabled={runLoading}
            className="inline-flex items-center gap-1 rounded-r-md bg-[#2463eb] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.25)] transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {runLoading ? "Running..." : "Run Code"}
          </button>
        </div>
      </div>
      <div className="flex flex-1 min-h-0 flex-col px-3 py-2.5">
        <PanelGroup
          direction="vertical"
          autoSaveId={PLAYGROUND_LAYOUT_STORAGE_KEY}
          className="flex h-full flex-1 flex-col gap-4 p-3"
        >
          <Panel
            defaultSize={storedPlaygroundLayout[0] ?? DEFAULT_PLAYGROUND_LAYOUT[0]}
            minSize={15}
            maxSize={100}
            collapsible
            collapsedSize={0}
            className="min-h-[200px] overflow-hidden border border-white/10 bg-[#050d1c] shadow-[0_0_0_1px_rgba(15,23,42,0.4)]"
          >
            <div className="flex h-full min-h-0">
              {!isEditorFullscreen ? (
                <CodeEditor
                  language={selectedLanguage}
                  code={editorCode}
                  onChange={handleEditorChange}
                  theme={isDarkMode ? "dark" : "light"}
                  height="100%"
                  className="h-full w-full"
                  textareaClassName="h-full w-full resize-none border-0 bg-transparent p-6 font-mono text-sm text-slate-100 outline-none focus:ring-2 focus:ring-sky-500/40"
                  unstyled
                />
              ) : (
                <div className="flex h-full flex-1 items-center justify-center text-sm text-slate-400">
                  Editor is open in fullscreen mode.
                </div>
              )}
            </div>
          </Panel>
          <ResizeHandle orientation="horizontal" />
          <Panel
            defaultSize={storedPlaygroundLayout[1] ?? DEFAULT_PLAYGROUND_LAYOUT[1]}
            minSize={15}
            maxSize={100}
            collapsible
            collapsedSize={0}
            className="flex min-h-[160px] flex-col border border-white/10 bg-[#0f1b33] p-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {outputTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setOutputTab(tab.id)}
                    className={`rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                      outputTab === tab.id
                        ? "bg-white/15 text-white shadow"
                        : "bg-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <button
                onClick={handleSubmitCode}
                disabled={!activeExercise}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white shadow transition hover:-translate-y-0.5 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Submit Code
              </button>
            </div>
            <div className="mt-3 flex-1 overflow-hidden border border-white/10 bg-[#050d1c] p-3">
              {outputTab === "custom" ? (
                <pre className="h-full w-full overflow-y-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-slate-200">
                  {consoleOutput || "Run or submit code when you're ready."}
                </pre>
              ) : (
                <div className="flex h-full flex-col gap-3 overflow-y-auto text-sm text-slate-200">
                  {testResults.length === 0 && !successMessage && !feedbackHistory ? (
                    <p className="text-slate-400">Run tests or submit code to see results here.</p>
                  ) : null}
                  {testResults.map((result) => (
                    <div
                      key={result.id}
                      className={`rounded-lg border p-4 ${
                        result.passed
                          ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-100"
                          : "border-rose-500/60 bg-rose-500/10 text-rose-100"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide">
                        <span>{result.title}</span>
                        <span>{result.passed ? "Pass" : "Fail"}</span>
                      </div>
                      <div className="mt-3 space-y-1 font-mono text-[11px] text-white/90">
                        {result.input ? (
                          <p>
                            <span className="font-semibold">Input:</span> {result.input}
                          </p>
                        ) : null}
                        <p>
                          <span className="font-semibold">Stdout:</span> {result.stdout || "(empty)"}
                        </p>
                        <p>
                          <span className="font-semibold">Stderr:</span> {result.stderr || "(empty)"}
                        </p>
                        {result.expected ? (
                          <p>
                            <span className="font-semibold">Expected:</span> {result.expected}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                  {successMessage ? (
                    <div className="rounded-lg border border-emerald-400/60 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                      {successMessage}
                    </div>
                  ) : null}
                  {feedbackHistory ? (
                    <pre className="whitespace-pre-wrap rounded-lg border border-white/10 bg-white/5 p-4 font-mono text-xs text-slate-200">
                      {feedbackHistory}
                    </pre>
                  ) : null}
                </div>
              )}
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );

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
    const languageState = exerciseState[selectedLanguage] ?? {};
    return languageState[solutionTab] ?? activeExercise.starter_code[selectedLanguage] ?? "";
  }, [activeExercise, editorValues, selectedLanguage, solutionTab]);

  const storageKey = useMemo(() => {
    if (!activeExercise) return null;
    return `orus-course-${activeExercise.id}-${selectedLanguage}-${solutionTab}`;
  }, [activeExercise, selectedLanguage, solutionTab]);

  useEffect(() => {
    storageKeyRef.current = storageKey;
    if (!storageKey) {
      setAutosaveStatus("idle");
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey || !activeExercise) return;
    if (restoredDraftsRef.current.has(storageKey)) return;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        setEditorValues((prev) => ({
          ...prev,
          [activeExercise.id]: {
            ...(prev[activeExercise.id] ?? {}),
            [selectedLanguage]: {
              ...((prev[activeExercise.id]?.[selectedLanguage] ?? {}) as Record<string, string>),
              [solutionTab]: stored
            }
          }
        }));
        setAutosaveStatus("saved");
      }
    } catch (error) {
      console.warn("Unable to restore saved draft", error);
    } finally {
      restoredDraftsRef.current.add(storageKey);
    }
  }, [storageKey, activeExercise, selectedLanguage, solutionTab]);

  useEffect(() => {
    if (autosaveStatus !== "saving") return;
    const timeout = window.setTimeout(() => setAutosaveStatus("saved"), 500);
    return () => window.clearTimeout(timeout);
  }, [autosaveStatus, editorCode]);

  const handleLessonSelect = useCallback(
    (lessonId: number, options?: { updateUrl?: boolean }) => {
      setSuccessMessage(null);
      setConsoleOutput("");
      setTestResults([]);
      setActiveLessonId(lessonId);
      setLeftTab("lesson");
      setIsEditorFullscreen(false);
      setSolutionTab("solution1");
      setOutputTab("custom");
      setAutosaveStatus("idle");
      setHintStates({});
      const lesson = lessons.find((item) => item.id === lessonId);
      const initialWatched = Boolean(lesson?.progress?.completed);
      setVideoWatched(initialWatched);
      setVideoProgress(initialWatched ? 1 : 0);
      setAutoCompleteTriggered(initialWatched);
      const firstExercise = lesson?.exercises[0];
      setActiveExerciseId(firstExercise?.id ?? null);
      if (firstExercise) {
        const languages = Object.keys(firstExercise.starter_code ?? {});
        if (languages.length > 0) {
          setSelectedLanguage(
            firstExercise.progress?.last_language && languages.includes(firstExercise.progress.last_language)
              ? firstExercise.progress.last_language
              : languages[0]
          );
        } else {
          setSelectedLanguage(firstExercise.default_language ?? "python");
        }
      }

      if (isWorkspaceRoute && options?.updateUrl !== false) {
        if (lessonIdFromParam !== lessonId) {
          navigate(`${courseRouteBase}/lesson/${lessonId}`);
        }
      }
    },
    [courseRouteBase, isWorkspaceRoute, lessonIdFromParam, lessons, navigate]
  );

  const handleExerciseChange = useCallback((exerciseId: number) => {
    setSuccessMessage(null);
    setConsoleOutput("");
    setTestResults([]);
    setActiveExerciseId(exerciseId);
    setSolutionTab("solution1");
    setOutputTab("custom");
    setAutosaveStatus("idle");
    setHintStates({});
    setIsEditorFullscreen(false);
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
  }, [exercises]);

  const handleExerciseSelect = useCallback(
    (lessonId: number, exerciseId: number) => {
      if (activeLessonId !== lessonId) {
        handleLessonSelect(lessonId, { updateUrl: false });
      }
      handleExerciseChange(exerciseId);
      if (isWorkspaceRoute) {
        navigate(`${courseRouteBase}/lesson/${lessonId}`);
      }
    },
    [activeLessonId, courseRouteBase, handleExerciseChange, handleLessonSelect, isWorkspaceRoute, navigate]
  );

  const handleVideoProgress = useCallback((ratio: number) => {
    const clamped = Number.isFinite(ratio) ? Math.min(Math.max(ratio, 0), 1) : 0;
    setVideoProgress(clamped);
  }, []);

  useEffect(() => {
    if (!isWorkspaceRoute) return;
    if (!courseData) return;
    if (lessonIdFromParam === null) return;
    if (activeLessonId === lessonIdFromParam) return;
    const matchingLesson = courseData.lessons.find((lesson) => lesson.id === lessonIdFromParam);
    if (!matchingLesson) return;
    handleLessonSelect(lessonIdFromParam, { updateUrl: false });
  }, [activeLessonId, courseData, handleLessonSelect, isWorkspaceRoute, lessonIdFromParam]);

  useEffect(() => {
    if (!activeLesson) {
      setVideoWatched(false);
      setVideoProgress(0);
      setAutoCompleteTriggered(false);
      return;
    }
    const completed = Boolean(activeLesson.progress?.completed);
    setVideoWatched(completed);
    setVideoProgress(completed ? 1 : 0);
    setAutoCompleteTriggered(completed);
  }, [activeLesson]);

  useEffect(() => {
    setSolutionTab("solution1");
    setOutputTab("custom");
    setAutosaveStatus("idle");
    setHintStates({});
    setIsEditorFullscreen(false);
  }, [activeExerciseId]);

  const handleSubmitCode = () => {
    if (!activeExercise) return;
    if (!testsPassed) {
      setSuccessMessage("Run and pass the tests before submitting.");
      setOutputTab("raw");
      return;
    }
    setSuccessMessage("Submission received 🎉 Your mentor will review it shortly.");
    setOutputTab("raw");
  };

  const handleEditorChange = (value: string) => {
    if (!activeExercise) return;
    setEditorValues((prev) => ({
      ...prev,
      [activeExercise.id]: {
        ...(prev[activeExercise.id] ?? {}),
        [selectedLanguage]: {
          ...((prev[activeExercise.id]?.[selectedLanguage] ?? {}) as Record<string, string>),
          [solutionTab]: value
        }
      }
    }));

    if (storageKeyRef.current) {
      try {
        localStorage.setItem(storageKeyRef.current, value);
        setAutosaveStatus("saving");
      } catch (error) {
        console.warn("Unable to persist draft", error);
      }
    }
  };

  const handleGoToLesson = useCallback(
    async (direction: "previous" | "next") => {
      if (!courseData || !activeLesson) {
        return;
      }

      const targetLesson = direction === "next" ? nextLessonCandidate : previousLessonCandidate;
      if (!targetLesson) {
        setSuccessMessage(
          direction === "next"
            ? "You're all caught up! 🎉 There isn't a next lesson yet."
            : "You're already at the first lesson."
        );
        return;
      }

      setSuccessMessage(null);
      const cachedCompletion = Boolean(targetLesson.progress?.completed);
      setVideoWatched(cachedCompletion);
      setVideoProgress(cachedCompletion ? 1 : 0);
      setAutoCompleteTriggered(cachedCompletion);

      if (isDemoMode) {
        handleLessonSelect(targetLesson.id);
        return;
      }

      const updateLoading = direction === "next";
      if (updateLoading) {
        setNextLessonLoading(true);
      }

      try {
        const lessonResponse =
          direction === "next"
            ? await fetchNextLesson<LessonDetail>(courseData.course.id, activeLesson.id)
            : await fetchLesson<LessonDetail>(courseData.course.id, targetLesson.id);

        setCourseData((prev) => {
          if (!prev) {
            return prev;
          }
          const existingIndex = prev.lessons.findIndex((lesson) => lesson.id === lessonResponse.id);
          const updatedLessons =
            existingIndex === -1
              ? [...prev.lessons, lessonResponse]
              : prev.lessons.map((lesson) => (lesson.id === lessonResponse.id ? lessonResponse : lesson));
          const sortedUpdatedLessons = [...updatedLessons].sort((a, b) => {
            if (a.order_index === b.order_index) {
              return a.id - b.id;
            }
            return a.order_index - b.order_index;
          });
          return {
            ...prev,
            lessons: sortedUpdatedLessons,
            course_progress: computeProgressFromLessons(prev.course, sortedUpdatedLessons),
          };
        });

        setEditorValues((prev) => {
          const nextState: EditorState = { ...prev };
          const solutionKeys = ["solution1"] as const;
          lessonResponse.exercises.forEach((exercise) => {
            const existingExerciseState = nextState[exercise.id] ?? {};
            const updatedLanguageState: Record<string, Record<string, string>> = { ...existingExerciseState };
            Object.entries(exercise.starter_code ?? {}).forEach(([language, starter]) => {
              const existingLanguageState = existingExerciseState[language] ?? {};
              const languageState: Record<string, string> = { ...existingLanguageState };
              solutionKeys.forEach((key, index) => {
                if (!(key in languageState)) {
                  languageState[key] = index === 0 ? starter : existingLanguageState[key] ?? starter;
                }
              });
              updatedLanguageState[language] = languageState;
            });
            nextState[exercise.id] = updatedLanguageState;
          });
          return nextState;
        });

        setConsoleOutput("");
        setTestResults([]);
        setLeftTab("lesson");
        setIsEditorFullscreen(false);
        setSolutionTab("solution1");
        setOutputTab("custom");
        setAutosaveStatus("idle");
        setHintStates({});

        setActiveLessonId(lessonResponse.id);

        const lessonCompleted = Boolean(lessonResponse.progress?.completed);
        setVideoWatched(lessonCompleted);
        setVideoProgress(lessonCompleted ? 1 : 0);
        setAutoCompleteTriggered(lessonCompleted);

        const firstExercise = lessonResponse.exercises[0] ?? null;
        setActiveExerciseId(firstExercise?.id ?? null);
        if (firstExercise) {
          const languages = Object.keys(firstExercise.starter_code ?? {});
          if (languages.length > 0) {
            const preferred = firstExercise.progress?.last_language;
            if (preferred && languages.includes(preferred)) {
              setSelectedLanguage(preferred);
            } else if (firstExercise.default_language && languages.includes(firstExercise.default_language)) {
              setSelectedLanguage(firstExercise.default_language);
            } else {
              setSelectedLanguage(languages[0]);
            }
          } else {
            setSelectedLanguage(firstExercise.default_language ?? "python");
          }
        } else {
          setSelectedLanguage("python");
        }

        if (isWorkspaceRoute) {
          navigate(`${courseRouteBase}/lesson/${lessonResponse.id}`);
        }
      } catch (error) {
        if (direction === "next" && isAxiosError(error) && error.response?.status === 404) {
          setSuccessMessage("You're all caught up! 🎉 There isn't a next lesson yet.");
        } else {
          console.error("Failed to load lesson", error);
          if (typeof window !== "undefined") {
            window.alert("We couldn't load the lesson. Please try again.");
          }
        }
      } finally {
        if (updateLoading) {
          setNextLessonLoading(false);
        }
      }
    },
    [
      activeLesson,
      courseData,
      courseRouteBase,
      handleLessonSelect,
      isDemoMode,
      isWorkspaceRoute,
      navigate,
      nextLessonCandidate,
      previousLessonCandidate,
    ]
  );

  const handleRunCode = async () => {
    if (!activeExercise) return;
    setRunLoading(true);
    setOutputTab("custom");
    setSuccessMessage(null);
    if (isDemoMode) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const simulation = demoExerciseSimulations[activeExercise.id];
      const formatted = simulation
        ? simulation.run(editorCode)
        : createRunLog(activeExercise.title, [
            "Sample execution complete.",
            "Use the tests tab to confirm behaviour against hidden cases."
          ]);
      setConsoleOutput(formatted);
      setSuccessMessage("Sample run executed in demo mode. Jump to the tests tab when you're ready to validate.");
      setRunLoading(false);
      return;
    }
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
    setOutputTab("raw");
    setSuccessMessage(null);
    setTestResults([]);
    if (isDemoMode) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const simulation = demoExerciseSimulations[activeExercise.id];
      const simulatedResults: ConsoleResult[] = (simulation?.tests ?? [
        {
          id: "demo-generic",
          title: "Reference implementation",
          stdout: "All sample cases passed",
          expected: "pass",
          passed: true
        }
      ]).map((test, index) => ({
        id: test.id || `demo-${index + 1}`,
        title: test.title || `Test ${index + 1}`,
        passed: test.passed,
        stdout: test.stdout,
        stderr: "",
        expected: test.expected,
        input: test.input
      }));
      setTestResults(simulatedResults);
      setOutputTab("raw");
      setSuccessMessage(simulation?.message ?? "Great job 🚀 You’re one step closer to mastering this lesson!");
      setCourseData((prev) => {
        if (!prev || !activeLesson) {
          return prev;
        }
        const updatedLessons = prev.lessons.map((lesson) => {
          if (lesson.id !== activeLesson.id) {
            return lesson;
          }
          const updatedExercises = lesson.exercises.map((exercise) => {
            if (exercise.id !== activeExercise.id) {
              return exercise;
            }
            const nextProgress = {
              ...(exercise.progress ?? {}),
              status: "passed",
              completed_at: new Date().toISOString(),
              last_language: selectedLanguage,
              last_run_output: simulatedResults.map((result) => result.stdout).join("\n")
            };
            return {
              ...exercise,
              progress: nextProgress
            };
          });
          const lessonCompleted = updatedExercises.every(
            (exercise) => (exercise.progress?.status ?? "") === "passed"
          );
          return {
            ...lesson,
            exercises: updatedExercises,
            progress: {
              ...(lesson.progress ?? { completed: false }),
              completed: lessonCompleted,
              completed_at: lessonCompleted ? new Date().toISOString() : lesson.progress?.completed_at
            }
          };
        });
        return {
          ...prev,
          lessons: updatedLessons,
          course_progress: computeProgressFromLessons(prev.course, updatedLessons)
        };
      });
      setTestLoading(false);
      return;
    }
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
      setOutputTab("raw");
      if (data.passed_all) {
        setSuccessMessage("All tests passed! Ready for submission.");
      } else {
        setSuccessMessage(null);
      }
      await loadCourse();
    } finally {
      setTestLoading(false);
    }
  };

  const handleMarkLessonComplete = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!activeLesson) return;
      const silent = options?.silent ?? false;

      if (!silent) {
        setLessonMarkLoading(true);
      }

      if (isDemoMode) {
        setCourseData((prev) => {
          if (!prev) {
            return prev;
          }
          const updatedLessons = prev.lessons.map((lesson) => {
            if (lesson.id !== activeLesson.id) {
              return lesson;
            }
            return {
              ...lesson,
              progress: {
                ...(lesson.progress ?? { completed: false }),
                completed: true,
                completed_at: new Date().toISOString()
              }
            };
          });
          return {
            ...prev,
            lessons: updatedLessons,
            course_progress: computeProgressFromLessons(prev.course, updatedLessons)
          };
        });
        if (!silent) {
          setSuccessMessage("Lesson marked as complete. Keep the momentum going!");
          setLessonMarkLoading(false);
        }
        setVideoWatched(true);
        setVideoProgress(1);
        setAutoCompleteTriggered(true);
        return;
      }

      try {
        await api.post("/mark-lesson-complete", { lesson_id: activeLesson.id });
        await loadCourse();
        if (!silent) {
          setSuccessMessage("Lesson marked as complete. Keep the momentum going!");
        }
      } finally {
        if (!silent) {
          setLessonMarkLoading(false);
        }
        setVideoWatched(true);
        setVideoProgress(1);
        setAutoCompleteTriggered(true);
      }
    },
    [activeLesson, isDemoMode, loadCourse]
  );

  useEffect(() => {
    if (!activeLesson) return;
    if (autoCompleteTriggered) return;
    if (videoWatched && testsPassed) {
      setAutoCompleteTriggered(true);
      void handleMarkLessonComplete({ silent: true });
    }
  }, [activeLesson, autoCompleteTriggered, videoWatched, testsPassed, handleMarkLessonComplete]);

  if ((!user && !isDemoMode) || !courseData) {
    return (
      <div className="flex flex-1 items-center justify-center bg-white/80 text-slate-500 dark:bg-slate-900/80 dark:text-slate-300">
        Loading course...
      </div>
    );
  }

  const displayName = user?.name ?? "Guest Student";
  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((segment) => segment.charAt(0).toUpperCase())
      .join("") || "GS";

  const profileSubline = isDemoMode ? "Demo student" : "Student workspace";
  const lessonAlreadyCompleted = Boolean(activeLesson?.progress?.completed);
  const previousButtonDisabled = nextLessonLoading || !previousLessonCandidate;
  const nextButtonDisabled = nextLessonLoading || !nextLessonCandidate;
  const navLanguageDisabled = availableLanguages.length === 0;
  const feedbackHistory = activeExercise?.progress?.last_run_output ?? "";

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-slate-100 dark:bg-slate-950">
      {isWorkspaceRoute ? (
        <nav className="flex h-14 flex-none items-center justify-between gap-6 border-b border-slate-200/70 bg-white/95 px-6 text-sm shadow-sm dark:border-slate-800/70 dark:bg-slate-900/85">
          <div className="flex items-center gap-5">
            <Link
              to="/app"
              className="flex items-center gap-2 text-lg font-semibold text-slate-900 transition-colors hover:text-sky-600 dark:text-white dark:hover:text-sky-400"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-sky-500 text-base font-bold text-white shadow-soft">
                O
              </span>
              <span>Orus School</span>
            </Link>
            <Link
              to="/app"
              className="text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              Dashboard
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsDarkMode((value) => !value)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {isDarkMode ? "☀️ Light" : "🌙 Dark"}
            </button>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <label htmlFor="nav-language" className="text-[11px]">
                Language
              </label>
              <select
                id="nav-language"
                value={navLanguageDisabled ? "" : selectedLanguage}
                onChange={(event) => setSelectedLanguage(event.target.value)}
                disabled={navLanguageDisabled}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              >
                {navLanguageDisabled ? (
                  <option value="" disabled>
                    No languages
                  </option>
                ) : (
                  availableLanguages.map((language) => (
                    <option key={language} value={language}>
                      {language.toUpperCase()}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-800/70">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-sm font-semibold text-white">
                {initials}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-900 leading-tight dark:text-white">{displayName}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{profileSubline}</p>
              </div>
              <button
                type="button"
                className="text-slate-400 transition hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                aria-label="Open profile menu"
              >
                ▾
              </button>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-slate-800 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
            >
              Log out
            </button>
          </div>
        </nav>
      ) : null}
      <div className="h-3 bg-[#050d1c]" />
      <div className="flex flex-1 min-h-0 overflow-hidden px-3 pb-3">
        {isCompactLayout ? (
          <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
            <div className="flex-none min-h-0 overflow-hidden">
              <CourseTabsPanelContent />
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <PlaygroundPanelContent />
            </div>
          </div>
        ) : (
          <PanelGroup
            direction="horizontal"
            autoSaveId={WORKSPACE_LAYOUT_STORAGE_KEY}
            className="flex h-full w-full min-h-0 min-w-0 gap-0"
          >
            <Panel
              defaultSize={storedWorkspaceLayout[0] ?? DEFAULT_WORKSPACE_LAYOUT[0]}
              minSize={20}
              maxSize={100}
              collapsible
              collapsedSize={5}
              className="min-h-0 min-w-0 overflow-hidden"
            >
              <div className="flex h-full w-full flex-col rounded-md border border-[#152842] bg-[#0f202d] shadow-[inset_0_0_0_1px_rgba(15,23,42,0.6)]">
                <CourseTabsPanelContent />
              </div>
            </Panel>
            <ResizeHandle orientation="vertical" />
            <Panel
              defaultSize={storedWorkspaceLayout[1] ?? DEFAULT_WORKSPACE_LAYOUT[1]}
              minSize={20}
              maxSize={100}
              collapsible
              collapsedSize={5}
              className="min-h-0 min-w-0 overflow-hidden"
            >
              <div className="flex h-full w-full flex-col rounded-md border border-[#152842] bg-[#0f202d] shadow-[inset_0_0_0_1px_rgba(15,23,42,0.6)]">
                <PlaygroundPanelContent />
              </div>
            </Panel>
          </PanelGroup>
        )}
      </div>
      {isEditorFullscreen ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/90 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 text-slate-100">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">
                {activeExercise ? activeExercise.title : "Code workspace"}
              </h2>
              <p className="text-sm text-slate-300">{courseData.course.title}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide">
              <button
                onClick={handleRunCode}
                disabled={runLoading}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white shadow transition hover:-translate-y-0.5 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {runLoading ? "Running..." : "Run Code"}
              </button>
              <button
                onClick={handleRunTests}
                disabled={testLoading}
                className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-white shadow transition hover:-translate-y-0.5 hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {testLoading ? "Checking tests..." : "Run Tests"}
              </button>
              <button
                onClick={() => setIsEditorFullscreen(false)}
                className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-xs font-semibold text-white shadow transition hover:-translate-y-0.5 hover:bg-white/30"
              >
                Exit Fullscreen
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <CodeEditor
              language={selectedLanguage}
              code={editorCode}
              onChange={handleEditorChange}
              theme="dark"
              height="100%"
              className="h-full border-slate-800"
            />
          </div>
        </div>
      ) : null}
    </div>
  );

};

export default CoursePage;
