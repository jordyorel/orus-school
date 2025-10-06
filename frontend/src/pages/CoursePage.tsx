import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api";
import CodeEditor from "../components/CodeEditor";
import CourseSidebar, { CurriculumSection, LessonStatus } from "../components/CourseSidebar";
import ProgressBar from "../components/ProgressBar";
import VideoPlayer from "../components/VideoPlayer";
import { useAuth } from "../context";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

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

const persistLayout = (key: string, layout: [number, number]) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(layout));
  } catch (error) {
    console.warn(`Unable to persist layout for ${key}`, error);
  }
};

const useDebouncedLayoutPersistence = (
  key: string,
  layout: [number, number],
  delay = 200
) => {
  const latestLayoutRef = useRef(layout);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    latestLayoutRef.current = layout;
  }, [layout]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      persistLayout(key, latestLayoutRef.current);
      timeoutRef.current = null;
    }, delay);

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [key, delay, layout]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        persistLayout(key, latestLayoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [key]);
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
    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-100 transition hover:-translate-y-0.5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-sky-500/40 disabled:cursor-not-allowed disabled:opacity-60"
  >
    {children}
    <span className="sr-only">{label}</span>
  </button>
);

const demoCourse: Course = {
  id: 0,
  title: "C Basics: Pointers & Memory",
  description:
    "Master fundamental pointer skills, visualise memory, and build the core string utilities required for the Year 1 libft project.",
  year: 1,
  order_index: 1
};

const demoLessons: LessonDetail[] = [
  {
    id: 101,
    course_id: demoCourse.id,
    title: "Variables & Types",
    description: "Track how primitive values are stored in memory and practice reading diagrams.",
    video_url: "https://youtu.be/5ByDKD9-rE4",
    notes: `
      <h3>Variables &amp; Types</h3>
      <p>In C every variable maps to a region of memory. Understanding how bytes are laid out allows you to debug crashes and undefined behaviour.</p>
      <ul>
        <li>Each type (<code>char</code>, <code>int</code>, <code>float</code>) has a specific size.</li>
        <li>Variables are stored at an address that can be inspected with the <code>&amp;</code> operator.</li>
        <li>Strings are just arrays of characters terminated by <code>\0</code>.</li>
      </ul>
      <pre><code class="language-c">int age = 19;
printf("Age: %d\n", age);
printf("Address: %p\n", (void *)&age);
</code></pre>
      <p class="mt-4">Keep mental models of the stack vs. the heap so you know where ownership lives.</p>
    `,
    order_index: 1,
    progress: {
      completed: false
    },
    exercises: [
      {
        id: 1001,
        lesson_id: 101,
        title: "Implement strlen()",
        instructions: `
          <h4>Exercise: Implement <code>ft_strlen</code></h4>
          <p>Write a function that returns the length of a C string. Follow the spec closely:</p>
          <ul>
            <li>Accept a null-terminated <code>const char *</code>.</li>
            <li>Count characters until <code>\0</code> is reached.</li>
            <li>Return the number of characters as a <code>size_t</code>.</li>
          </ul>
          <p class="mt-2"><strong>Example:</strong> <code>ft_strlen("hello") == 5</code></p>
        `,
        starter_code: {
          c: `#include <stddef.h>

size_t  ft_strlen(const char *str)
{
    size_t length;

    (void)str;
    length = 0;
    // TODO: walk through the string until you hit the null terminator
    return length;
}
`
        },
        default_language: "c",
        order_index: 1,
        tests_count: 3,
        progress: null
      }
    ]
  },
  {
    id: 102,
    course_id: demoCourse.id,
    title: "Loops & Functions",
    description: "Use loops to traverse arrays and return values from helpers you can test.",
    video_url: "https://www.youtube.com/embed/8lXdyD2Yzls",
    notes: `
      <h3>Loops &amp; Functions</h3>
      <p>Pure functions are easier to test and reason about. Extract logic into helpers so your main program remains readable.</p>
      <ul>
        <li>Prefer <code>while</code> loops for pointer traversal in C basics.</li>
        <li>Return early when you detect invalid input.</li>
        <li>Document pre-conditions in a block comment.</li>
      </ul>
      <pre><code class="language-c">int sum_until_zero(const int *numbers)
{
    int total = 0;
    while (*numbers != 0)
    {
        total += *numbers;
        numbers++;
    }
    return total;
}
</code></pre>
    `,
    order_index: 2,
    progress: null,
    exercises: [
      {
        id: 1002,
        lesson_id: 102,
        title: "Implement strcpy()",
        instructions: `
          <h4>Exercise: Implement <code>ft_strcpy</code></h4>
          <p>Duplicate the behaviour of the standard library <code>strcpy</code> function.</p>
          <ol>
            <li>Copy characters from <code>src</code> into <code>dest</code>, including the terminating <code>\0</code>.</li>
            <li>Return the <code>dest</code> pointer.</li>
            <li>Assume <code>dest</code> has enough space.</li>
          </ol>
          <p class="mt-2"><strong>Example:</strong> <code>ft_strcpy(buf, "42")</code> stores <code>"42"</code> in <code>buf</code>.</p>
        `,
        starter_code: {
          c: `char    *ft_strcpy(char *dest, const char *src)
{
    (void)dest;
    (void)src;
    // TODO: copy characters until the null terminator and then return dest
    return dest;
}
`
        },
        default_language: "c",
        order_index: 1,
        tests_count: 3,
        progress: null
      }
    ]
  },
  {
    id: 103,
    course_id: demoCourse.id,
    title: "Pointers",
    description: "Trace pointer diagrams, dereference safely, and avoid undefined behaviour.",
    video_url: "https://www.youtube.com/embed/zuegQmMdy8M",
    notes: `
      <h3>Pointers in C</h3>
      <p>Pointers store memory addresses. Dereferencing the pointer lets you access or mutate the data stored at that location.</p>
      <ul>
        <li>Always initialise pointers before dereferencing.</li>
        <li>Use <code>const</code> when you only need to read through a pointer.</li>
        <li>Draw diagrams: boxes for values, arrows for addresses.</li>
      </ul>
      <pre><code class="language-c">int value = 10;
int *ptr = &value;
printf("%d\n", *ptr); // prints 10
</code></pre>
    `,
    order_index: 3,
    progress: null,
    exercises: [
      {
        id: 1003,
        lesson_id: 103,
        title: "Implement strcmp()",
        instructions: `
          <h4>Exercise: Implement <code>ft_strcmp</code></h4>
          <p>Return 0 when strings match, a negative value when <code>s1</code> is less than <code>s2</code>, and positive otherwise.</p>
          <ul>
            <li>Iterate both strings together.</li>
            <li>Stop when characters differ or you reach <code>\0</code>.</li>
            <li>Cast to <code>unsigned char</code> before subtracting to avoid overflow.</li>
          </ul>
        `,
        starter_code: {
          c: `int ft_strcmp(const char *s1, const char *s2)
{
    (void)s1;
    (void)s2;
    // TODO: compare characters and return the first difference
    return 0;
}
`
        },
        default_language: "c",
        order_index: 1,
        tests_count: 3,
        progress: null
      }
    ]
  },
  {
    id: 104,
    course_id: demoCourse.id,
    title: "Memory Management",
    description: "Allocate, zero, and free dynamic memory responsibly.",
    video_url: "https://www.youtube.com/embed/_8-ht2AKyH4",
    notes: `
      <h3>Memory Management</h3>
      <p>Dynamic allocation lets you create buffers sized at runtime. Balance every <code>malloc</code> with a matching <code>free</code>.</p>
      <ol>
        <li>Use <code>calloc</code> when you need zeroed memory.</li>
        <li>Check for allocation failures before using the pointer.</li>
        <li>Encapsulate allocation and cleanup in helpers for clarity.</li>
      </ol>
      <pre><code class="language-c">int *numbers = malloc(sizeof(int) * count);
if (!numbers)
    return NULL;
/* ... */
free(numbers);
</code></pre>
    `,
    order_index: 4,
    progress: null,
    exercises: [
      {
        id: 1004,
        lesson_id: 104,
        title: "Build calloc()",
        instructions: `
          <h4>Exercise: Re-create <code>ft_calloc</code></h4>
          <p>Allocate <code>count</code> blocks of <code>size</code> bytes and zero them.</p>
          <ol>
            <li>Detect overflow before multiplying.</li>
            <li>Use <code>malloc</code> and <code>ft_memset</code> style logic to zero memory.</li>
            <li>Return <code>NULL</code> when allocation fails.</li>
          </ol>
        `,
        starter_code: {
          c: `#include <stdlib.h>
#include <stddef.h>

void    *ft_calloc(size_t count, size_t size)
{
    (void)count;
    (void)size;
    // TODO: guard against overflow, allocate memory, zero it out, and return the pointer
    return NULL;
}
`
        },
        default_language: "c",
        order_index: 1,
        tests_count: 3,
        progress: null
      }
    ]
  }
];

const demoCourseData: CourseLessonsResponse = {
  course: demoCourse,
  lessons: demoLessons,
  course_progress: {
    course: demoCourse,
    status: "in_progress",
    completion_percentage: 0,
    lessons_completed: 0,
    lessons_total: demoLessons.length,
    exercises_completed: 0,
    exercises_total: demoLessons.reduce((total, lesson) => total + lesson.exercises.length, 0)
  }
};

const computeProgressFromLessons = (course: Course, lessons: LessonDetail[]): CourseProgressSummary => {
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
    exercises_total: exercisesTotal
  };
};

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
  const [solutionTab, setSolutionTab] = useState<"solution1" | "solution2" | "solution3">("solution1");
  const [consoleOutput, setConsoleOutput] = useState<string>("");
  const [outputTab, setOutputTab] = useState<"custom" | "raw">("custom");
  const [testResults, setTestResults] = useState<ConsoleResult[]>([]);
  const [runLoading, setRunLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [lessonMarkLoading, setLessonMarkLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [videoWatched, setVideoWatched] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [hintStates, setHintStates] = useState<Record<number, boolean>>({});
  const [leftTab, setLeftTab] = useState<"overview" | "lesson" | "video" | "exercise">("lesson");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("orus-course-theme") !== "light";
  });
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);
  const [workspaceLayout, setWorkspaceLayout] = useState<[number, number]>(() =>
    readStoredLayout(WORKSPACE_LAYOUT_STORAGE_KEY, DEFAULT_WORKSPACE_LAYOUT)
  );
  const [playgroundLayout, setPlaygroundLayout] = useState<[number, number]>(() =>
    readStoredLayout(PLAYGROUND_LAYOUT_STORAGE_KEY, DEFAULT_PLAYGROUND_LAYOUT)
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

  const handleWorkspaceLayoutChange = useCallback((sizes: number[]) => {
    if (sizes.length !== 2) return;
    const next: [number, number] = [sizes[0], sizes[1]];
    setWorkspaceLayout((prev) => {
      if (Math.abs(prev[0] - next[0]) < 0.1 && Math.abs(prev[1] - next[1]) < 0.1) {
        return prev;
      }
      return next;
    });
  }, []);

  const handlePlaygroundLayoutChange = useCallback((sizes: number[]) => {
    if (sizes.length !== 2) return;
    const next: [number, number] = [sizes[0], sizes[1]];
    setPlaygroundLayout((prev) => {
      if (Math.abs(prev[0] - next[0]) < 0.1 && Math.abs(prev[1] - next[1]) < 0.1) {
        return prev;
      }
      return next;
    });
  }, []);

  useDebouncedLayoutPersistence(WORKSPACE_LAYOUT_STORAGE_KEY, workspaceLayout);
  useDebouncedLayoutPersistence(PLAYGROUND_LAYOUT_STORAGE_KEY, playgroundLayout);

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
      const solutionKeys: Array<typeof solutionTab> = ["solution1", "solution2", "solution3"];

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

  const loadCourse = useCallback(async () => {
    const shouldUseDemo = !Number.isFinite(numericCourseId);
    setSuccessMessage(null);
    if (shouldUseDemo) {
      setIsDemoMode(true);
      applyCourseData(cloneCourseData(demoCourseData));
      return;
    }

    try {
      const { data } = await api.get<CourseLessonsResponse>(`/lessons/${numericCourseId}`);
      setIsDemoMode(false);
      applyCourseData(data);
    } catch (error) {
      console.error("Failed to load course", error);
      setIsDemoMode(true);
      applyCourseData(cloneCourseData(demoCourseData));
    }
  }, [numericCourseId, applyCourseData]);

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

  const exercisePosition = useMemo(() => {
    if (!activeLesson || !activeExercise) {
      return null;
    }
    const index = activeLesson.exercises.findIndex((exercise) => exercise.id === activeExercise.id);
    if (index === -1) {
      return null;
    }
    return {
      index,
      number: index + 1,
      total: activeLesson.exercises.length
    };
  }, [activeLesson, activeExercise]);

  const testsPassed = useMemo(
    () => testResults.length > 0 && testResults.every((result) => result.passed),
    [testResults]
  );

  const exerciseHints = useMemo(() => {
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

  const nextExerciseCandidate = useMemo(() => {
    if (!activeLesson) {
      return null;
    }
    if (exercisePosition && exercisePosition.index < activeLesson.exercises.length - 1) {
      return activeLesson.exercises[exercisePosition.index + 1];
    }
    const currentLessonIndex = sortedLessons.findIndex((lesson) => lesson.id === activeLesson.id);
    if (currentLessonIndex === -1) {
      return null;
    }
    for (let index = currentLessonIndex + 1; index < sortedLessons.length; index += 1) {
      const lesson = sortedLessons[index];
      if (lesson.exercises.length > 0) {
        return lesson.exercises[0];
      }
    }
    return null;
  }, [activeLesson, exercisePosition, sortedLessons]);

  const nextExerciseLesson = useMemo(() => {
    if (!nextExerciseCandidate) {
      return null;
    }
    return sortedLessons.find((lesson) => lesson.id === nextExerciseCandidate.lesson_id) ?? null;
  }, [nextExerciseCandidate, sortedLessons]);

  const nextExerciseLabel = useMemo(() => {
    if (!nextExerciseCandidate) {
      return "All exercises completed";
    }
    const isSameLesson = nextExerciseCandidate.lesson_id === activeLesson?.id;
    if (isSameLesson) {
      return `Next exercise · ${nextExerciseCandidate.title}`;
    }
    const nextLessonTitle = nextExerciseLesson?.title;
    return nextLessonTitle ? `Next class · ${nextLessonTitle}` : "Next class";
  }, [nextExerciseCandidate, activeLesson, nextExerciseLesson]);

  const readyForNextLesson = videoWatched && testsPassed;

  const solutionTabs = [
    { id: "solution1" as const, label: "Solution 1" },
    { id: "solution2" as const, label: "Solution 2" },
    { id: "solution3" as const, label: "Solution 3" }
  ];

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
      className={`flex min-h-0 min-w-0 flex-col overflow-hidden bg-white dark:bg-slate-900 ${
        isCompactLayout
          ? "h-auto border-b border-slate-200/70 dark:border-slate-800/60"
          : "h-full border-r border-slate-200/70 dark:border-slate-800/60"
      }`}
    >
      <div className="flex items-center gap-6 border-b border-slate-200/70 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
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
      <div className="flex flex-1 min-h-0 overflow-y-auto p-6">
        <div className="flex w-full flex-col gap-6 text-sm text-slate-600 dark:text-slate-300">
          {leftTab === "overview" ? (
            <div className="space-y-6">
              <div className="space-y-3">
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
                  percentage={courseData?.course_progress.completion_percentage ?? 0}
                  size="lg"
                  showLabel
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
              <div className="space-y-3">
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
              <div className="space-y-3">
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
                    onWatched={() => setVideoWatched(true)}
                    watched={videoWatched}
                  />
                ) : (
                  <div className="flex items-center justify-center bg-slate-900/60 p-12 text-sm text-slate-300">
                    Select a lesson to watch the explanation.
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/80 p-4 text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60 dark:text-slate-400">
                <span>Progress</span>
                <span className="text-sm text-slate-900 dark:text-white">{videoWatched ? "Watched" : "Not started"}</span>
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
                        {(exerciseHints[activeExercise.id] ?? []).map((hint, index) => {
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
      <div className="border-t border-slate-200/70 bg-slate-50/70 px-6 py-4 text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 dark:border-slate-800/60 dark:bg-slate-900/70 dark:text-slate-400">
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
          <div className="flex items-center gap-3">
            <button
              onClick={handleMarkLessonComplete}
              disabled={!activeLesson || lessonMarkLoading}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white/10 dark:hover:bg-white/20"
            >
              {lessonMarkLoading ? "Saving..." : "Mark lesson complete"}
            </button>
            <button
              onClick={handleGoToNextExercise}
              disabled={nextButtonDisabled}
              className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>{nextExerciseLabel}</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const PlaygroundPanelContent = () => (
    <div
      className={`flex min-h-0 min-w-0 flex-col overflow-hidden bg-[#081024] text-slate-100 ${
        isCompactLayout ? "h-auto border-t border-slate-200/70 dark:border-slate-800/60" : "h-full"
      }`}
    >
      <div className="border-b border-white/10 bg-[#0d1b33] px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-400">
              Your Solutions
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {solutionTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSolutionTab(tab.id)}
                  className={`rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                    solutionTab === tab.id
                      ? "bg-sky-500 text-white shadow"
                      : "bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <p className="text-sm text-slate-400">
              {activeExercise ? activeExercise.title : "Select an exercise to begin."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <IconButton onClick={() => setIsEditorFullscreen(true)} label="Open fullscreen">
              <FullscreenIcon className="h-5 w-5" />
            </IconButton>
            <IconButton
              onClick={handleRunTests}
              label={testLoading ? "Running tests..." : "Run tests"}
              disabled={testLoading}
            >
              <RefreshIcon className={`h-5 w-5 ${testLoading ? "animate-spin" : ""}`} />
            </IconButton>
            <button
              onClick={handleRunCode}
              disabled={runLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white shadow transition hover:-translate-y-0.5 hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {runLoading ? "Running..." : "Run Code"}
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-1 min-h-0 flex-col px-6 py-6">
        <PanelGroup
          direction="vertical"
          layout={playgroundLayout}
          onLayout={handlePlaygroundLayoutChange}
          className="flex h-full flex-1 flex-col gap-4"
        >
          <Panel
            defaultSize={playgroundLayout[0] ?? DEFAULT_PLAYGROUND_LAYOUT[0]}
            minSize={15}
            maxSize={100}
            collapsible
            collapsedSize={0}
            className="min-h-[200px] overflow-hidden rounded-2xl border border-white/10 bg-[#050d1c] shadow-[0_0_0_1px_rgba(15,23,42,0.4)]"
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
            defaultSize={playgroundLayout[1] ?? DEFAULT_PLAYGROUND_LAYOUT[1]}
            minSize={15}
            maxSize={100}
            collapsible
            collapsedSize={0}
            className="flex min-h-[160px] flex-col rounded-2xl border border-white/10 bg-[#0f1b33] p-5"
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
            <div className="mt-4 flex-1 overflow-hidden rounded-lg border border-white/10 bg-[#050d1c] p-4">
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
      setVideoWatched(false);
      setSolutionTab("solution1");
      setOutputTab("custom");
      setAutosaveStatus("idle");
      setHintStates({});
      const lesson = lessons.find((item) => item.id === lessonId);
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

  const handleExerciseChange = (exerciseId: number) => {
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
  };

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
    setVideoWatched(false);
  }, [activeLessonId]);

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

  const handleGoToNextExercise = () => {
    if (!nextExerciseCandidate) return;
    if (nextExerciseCandidate.lesson_id === activeLesson?.id) {
      handleExerciseChange(nextExerciseCandidate.id);
    } else {
      handleLessonSelect(nextExerciseCandidate.lesson_id);
    }
  };

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

  const handleMarkLessonComplete = async () => {
    if (!activeLesson) return;
    setLessonMarkLoading(true);
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
      setSuccessMessage("Lesson marked as complete. Keep the momentum going!");
      setLessonMarkLoading(false);
      return;
    }
    try {
      await api.post("/mark-lesson-complete", { lesson_id: activeLesson.id });
      await loadCourse();
      setSuccessMessage("Lesson marked as complete. Keep the momentum going!");
    } finally {
      setLessonMarkLoading(false);
    }
  };

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
  const nextButtonDisabled = !nextExerciseCandidate || !readyForNextLesson;
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
      {isDemoMode ? (
        <div className={`${isWorkspaceRoute ? "px-8" : "px-6"} flex-none border-b border-amber-200/70 bg-amber-50/80 py-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100`}>
          You are exploring the interactive playground with sample data. Sign in to access your real courses and save progress.
        </div>
      ) : null}
      <div className="flex flex-1 min-h-0 overflow-hidden">
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
            layout={workspaceLayout}
            onLayout={handleWorkspaceLayoutChange}
            className="flex h-full w-full min-h-0 min-w-0 gap-0"
          >
            <Panel
              defaultSize={workspaceLayout[0] ?? DEFAULT_WORKSPACE_LAYOUT[0]}
              minSize={20}
              maxSize={100}
              collapsible
              collapsedSize={5}
              className="min-h-0 min-w-0 overflow-hidden"
            >
              <CourseTabsPanelContent />
            </Panel>
            <ResizeHandle orientation="vertical" />
            <Panel
              defaultSize={workspaceLayout[1] ?? DEFAULT_WORKSPACE_LAYOUT[1]}
              minSize={20}
              maxSize={100}
              collapsible
              collapsedSize={5}
              className="min-h-0 min-w-0 overflow-hidden"
            >
              <PlaygroundPanelContent />
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
