import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import CodeEditor from "../components/CodeEditor";
import ConsoleTabs from "../components/ConsoleTabs";
import CourseSidebar, { CurriculumSection, LessonStatus } from "../components/CourseSidebar";
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
    video_url: "https://www.youtube.com/embed/d1n2uuMLh9A",
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
    run: (_code: string) =>
      createRunLog("ft_strlen", [
        'Input: "Orus School"',
        "Computed length: 11",
        "Remember: the null terminator is not counted in the length.",
        "",
        "Try modifying the string above to see the log update."
      ]),
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
    run: (_code: string) =>
      createRunLog("ft_strcpy", [
        'Destination buffer before: ""',
        'Copying from src: "pointers rock"',
        'Destination buffer after: "pointers rock"',
        "Return pointer matches dest ✔"
      ]),
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
    run: (_code: string) =>
      createRunLog("ft_strcmp", [
        'Comparing "apple" vs "apple" → 0',
        'Comparing "libft" vs "piscine" → -4',
        'Comparing "xyz" vs "abc" → 23',
        "Cast to unsigned char before subtracting to avoid surprises."
      ]),
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
    run: (_code: string) =>
      createRunLog("ft_calloc", [
        "Request: 5 blocks × 4 bytes",
        "Allocation succeeded → pointer 0x1000",
        "Memory preview: 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00",
        "Remember to free the buffer when you're done."
      ]),
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
  const [isDemoMode, setIsDemoMode] = useState(false);

  const activeLessonRef = useRef<number | null>(null);
  const activeExerciseRef = useRef<number | null>(null);

  useEffect(() => {
    activeLessonRef.current = activeLessonId;
  }, [activeLessonId]);

  useEffect(() => {
    activeExerciseRef.current = activeExerciseId;
  }, [activeExerciseId]);

  const applyCourseData = useCallback((data: CourseLessonsResponse) => {
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
  }, []);

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
    const baseLessonItems = sortedLessons.map((lesson, index) => ({
      id: lesson.id,
      title: lesson.title,
      kind: "lesson" as const,
      meta: `Lesson ${index + 1}`,
      status: lessonStatusMap.get(lesson.id) ?? "locked"
    }));

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
    setConsoleTab("tests");
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
      setSuccessMessage(
        simulation?.message ??
          "Great job 🚀 You’re one step closer to mastering this lesson!"
      );
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
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
        Loading course...
      </div>
    );
  }

  const lessonCompleted = Boolean(activeLesson?.progress?.completed);
  const progressSummary = courseData.course_progress;
  const courseIsLocked = lessonStatusEntries.length > 0 && lessonStatusEntries.every((entry) => entry.status === "locked");
  const courseStatusInfo = courseIsLocked
    ? {
        icon: "🔒",
        label: "Locked",
        badge: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
      }
    : progressSummary.status === "completed"
    ? {
        icon: "✅",
        label: "Completed",
        badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
      }
    : {
        icon: "⏳",
        label: "In progress",
        badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
      };

  const displayName = user?.name ?? "Guest Student";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment.charAt(0).toUpperCase())
    .join("") || "GS";

  const profileSubline = isDemoMode ? "Demo student" : "Student workspace";

  return (
    <div className="space-y-6">
      {isDemoMode ? (
        <div className="rounded-3xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-800 shadow-sm dark:border-amber-400/60 dark:bg-amber-500/10 dark:text-amber-100">
          You are exploring the interactive playground with sample data. Sign in to access your real courses and save progress.
        </div>
      ) : null}
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Year {courseData.course.year} · Foundations
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${courseStatusInfo.badge}`}
              >
                <span aria-hidden="true">{courseStatusInfo.icon}</span>
                <span>{courseStatusInfo.label}</span>
              </span>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{courseData.course.title}</h1>
              <p className="max-w-2xl text-sm text-slate-500 dark:text-slate-400">{courseData.course.description}</p>
            </div>
            <div className="max-w-xs sm:max-w-sm">
              <ProgressBar value={progressSummary.completion_percentage} label="Course completion" size="sm" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-4 sm:flex-row sm:items-center">
            <button
              onClick={() => setIsDarkEditor((value) => !value)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {isDarkEditor ? "☀️ Light editor" : "🌙 Dark editor"}
            </button>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-sm font-semibold text-white">
                {initials}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{displayName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{profileSubline}</p>
              </div>
              <button
                type="button"
                className="text-slate-400 transition hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                aria-label="Open profile menu"
              >
                ▾
              </button>
            </div>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/40">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Lessons completed</p>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
              {progressSummary.lessons_completed} / {progressSummary.lessons_total}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/40">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Exercises passed
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
              {progressSummary.exercises_completed} / {progressSummary.exercises_total}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/40">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</p>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
              {courseStatusInfo.label}
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[280px,minmax(0,1fr),360px]">
        <aside className="space-y-4">
          <CourseSidebar sections={curriculumSections} activeLessonId={activeLesson?.id ?? null} onSelect={handleLessonSelect} />
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
