export type LessonStatus = "completed" | "available" | "locked";

export interface LessonSummary {
  id: string;
  title: string;
  duration: string;
  status: LessonStatus;
  summary: string;
}

export interface LessonTestCase {
  id: string;
  name: string;
  description: string;
  inputExample?: string;
  expectedOutput?: string;
}

export interface LessonExercise {
  prompt: string;
  objectives: string[];
  starterCode: Record<string, string>;
  defaultLanguage: "c" | "python" | "javascript";
  tests: LessonTestCase[];
}

export interface LessonCourseSection {
  title: string;
  description: string;
  bullets?: string[];
  codeSample?: string;
}

export interface LessonContent {
  id: string;
  intro: string;
  courseSections: LessonCourseSection[];
  videoUrl: string;
  exercise: LessonExercise;
  resources: { label: string; href: string }[];
}

export interface CourseDetail {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  duration: string;
  level: string;
  pace: string;
  prerequisites: string[];
  outcomes: string[];
  practices: string[];
  projects: string[];
  lessons: LessonSummary[];
  nextLessonId: string;
}

export const courseCatalog: Record<string, CourseDetail> = {
  "c-foundations": {
    id: "course-001",
    slug: "c-foundations",
    title: "C Programming Foundations",
    tagline: "Think like a systems engineer and build fluency with low-level code.",
    description:
      "This course builds your intuition for how software really runs. We start with the UNIX shell, master the C toolchain, and progress into memory, pointers, and algorithms while writing a lot of code.",
    duration: "8-week guided journey",
    level: "Beginner → Intermediate",
    pace: "5-7 hours / week",
    prerequisites: [
      "Familiarity with basic command-line navigation",
      "Motivation to learn through practice and iteration",
      "Laptop running macOS, Linux, or WSL on Windows",
    ],
    outcomes: [
      "Compile and debug C programs with confidence",
      "Understand how memory works (stack vs heap, pointers)",
      "Implement core data structures and algorithms from scratch",
      "Collaborate using Git, GitHub, and code reviews",
      "Ship a portfolio-ready systems project",
    ],
    practices: [
      "Daily code kata in the Orus playground",
      "Weekly mentor checkpoints with feedback",
      "Pair-programming labs and retrospectives",
      "Capstone project milestones with peer review",
    ],
    projects: [
      "Static site generator for course notes",
      "Shell mini-clone with custom builtins",
      "Final systems project (choose between compiler front-end or networked service)",
    ],
    lessons: [
      {
        id: "lesson-1",
        title: "Orientation & Environment Setup",
        duration: "35 min",
        status: "completed",
        summary: "Tour the Orus stack, install the toolchain, and push your first Git commit.",
      },
      {
        id: "lesson-2",
        title: "Compiling Your First Program",
        duration: "45 min",
        status: "completed",
        summary: "Use `gcc`, explore compiler flags, and understand the build artifacts you generate.",
      },
      {
        id: "lesson-3",
        title: "Control Flow Deep Dive",
        duration: "55 min",
        status: "available",
        summary: "Master branching, looping, and debugging with `lldb` and playground diagnostics.",
      },
      {
        id: "lesson-4",
        title: "Working with Functions & Header Files",
        duration: "50 min",
        status: "locked",
        summary: "Design reusable interfaces, document your code, and structure multi-file projects.",
      },
      {
        id: "lesson-5",
        title: "Pointers, Memory, and Dynamic Allocation",
        duration: "65 min",
        status: "locked",
        summary: "Visualize pointer arithmetic, manage heap memory, and prevent segmentation faults.",
      },
      {
        id: "lesson-6",
        title: "Data Structures Sprint",
        duration: "70 min",
        status: "locked",
        summary: "Build linked lists, stacks, and queues with rigorous unit tests.",
      },
      {
        id: "lesson-7",
        title: "Algorithms & Complexity",
        duration: "75 min",
        status: "locked",
        summary: "Implement sorting/searching algorithms and measure runtime in the playground.",
      },
      {
        id: "lesson-8",
        title: "Capstone Kickoff",
        duration: "80 min",
        status: "locked",
        summary: "Scope your final project, write a technical design doc, and set success metrics.",
      },
    ],
    nextLessonId: "lesson-3",
  },
};

const lessonContentCatalog: Record<string, LessonContent> = {
  "lesson-1": {
    id: "lesson-1",
    intro:
      "Set up your terminal, compiler, and Git tooling so you can ship C code from day one.",
    courseSections: [
      {
        title: "Touring the Orus environment",
        description:
          "Understand how the Orus workspace mirrors a professional toolchain. You will clone starter repositories, explore the project structure, and learn the guardrails we provide for each assignment.",
        bullets: [
          "Review the provided dotfiles and terminal profile.",
          "Validate `gcc`, `make`, and debugging utilities are available.",
          "Practice committing changes using our Git conventions.",
        ],
      },
      {
        title: "First build pipeline",
        description:
          "Walk through compiling a tiny program manually before introducing build scripts. This helps demystify the compilation stages you will automate later in the course.",
        codeSample: `#include <stdio.h>\n\nint main(void) {\n  printf("Hello, Orus!\\n");\n  return 0;\n}`,
      },
    ],
    videoUrl: "https://www.youtube.com/embed/oHg5SJYRHA0",
    exercise: {
      prompt:
        "Write a CLI program that prints the absolute path to your current working directory and confirms the required tooling is installed.",
      objectives: [
        "Interact with the filesystem via C standard library calls.",
        "Practice logging structured output for automated graders.",
        "Use return codes to signal success or setup issues.",
      ],
      starterCode: {
        c: `#include <stdio.h>\n#include <unistd.h>\n#include <limits.h>\n\nint main(void) {\n    char buffer[PATH_MAX];\n    if (!getcwd(buffer, sizeof(buffer))) {\n        perror("getcwd");\n        return 1;\n    }\n\n    printf("cwd:%s\\n", buffer);\n    printf("tooling:ok\\n");\n    return 0;\n}\n`,
        python: `import os\n\nif __name__ == "__main__":\n    print(f"cwd:{os.getcwd()}")\n    print("tooling:ok")\n`,
        javascript: `console.log(\`cwd:\${process.cwd()}\`);\nconsole.log("tooling:ok");\n`,
      },
      defaultLanguage: "c",
      tests: [
        {
          id: "lesson-1-test-1",
          name: "Includes current working directory",
          description: "Expect the program to emit a line beginning with `cwd:`.",
        },
        {
          id: "lesson-1-test-2",
          name: "Reports tooling status",
          description: "Ensure the output contains `tooling:ok` to mark the setup as complete.",
        },
      ],
    },
    resources: [
      { label: "UNIX Filesystem Primer", href: "https://missing.csail.mit.edu/2020/filesystem/" },
      { label: "GNU Make Manual", href: "https://www.gnu.org/software/make/manual/make.html" },
    ],
  },
  "lesson-2": {
    id: "lesson-2",
    intro: "Compile multi-file C programs and analyze each build artifact along the way.",
    courseSections: [
      {
        title: "Understanding compilation stages",
        description:
          "Map the preprocessor, compiler, assembler, and linker to the artifacts you see in your workspace.",
        bullets: [
          "Trace how header files are expanded before compilation.",
          "Inspect generated assembly to reinforce what the compiler emits.",
          "Link object files into executables and shared libraries.",
        ],
      },
      {
        title: "Debugging your first crash",
        description:
          "Use `lldb` to step through a crashing binary and capture call stacks you can share in mentor sessions.",
      },
    ],
    videoUrl: "https://www.youtube.com/embed/IlU-zDU6aQ0",
    exercise: {
      prompt:
        "Extend the starter program with a reusable logging utility and confirm it compiles with warnings treated as errors.",
      objectives: [
        "Create a dedicated translation unit for logging helpers.",
        "Author a Makefile rule that builds object files and links them.",
        "Demonstrate how to run your executable with flags for verbose logging.",
      ],
      starterCode: {
        c: `#include <stdio.h>\n#include "logger.h"\n\nint main(void) {\n    log_info("Bootstrapping Orus project...");\n    return 0;\n}\n`,
        python: `def log_info(message: str) -> None:\n    print(f"[info] {message}")\n\nif __name__ == "__main__":\n    log_info("Bootstrapping Orus project...")\n`,
        javascript: `const logInfo = (message) => console.log(\`[info] \${message}\`);\n\nlogInfo("Bootstrapping Orus project...");\n`,
      },
      defaultLanguage: "c",
      tests: [
        {
          id: "lesson-2-test-1",
          name: "Links without warnings",
          description: "The build should succeed with `-Wall -Werror` enabled.",
        },
        {
          id: "lesson-2-test-2",
          name: "Logging prefix",
          description: "Output must include the `[info]` prefix for mentor review.",
        },
      ],
    },
    resources: [
      { label: "GCC warning flags cheat sheet", href: "https://gcc.gnu.org/onlinedocs/gcc/Warning-Options.html" },
      { label: "lldb quick start", href: "https://lldb.llvm.org/use/tutorial.html" },
    ],
  },
  "lesson-3": {
    id: "lesson-3",
    intro: "Combine conditionals and loops to solve control-flow problems while practicing readable debugging logs.",
    courseSections: [
      {
        title: "Conditionals in practice",
        description:
          "Translate product requirements into branching logic. We emphasize early returns and guard clauses to keep functions approachable.",
        bullets: [
          "Refactor nested `if` statements into composable helpers.",
          "Model state transitions with enums to document intent.",
        ],
      },
      {
        title: "Iteration patterns",
        description:
          "Contrast `for`, `while`, and `do-while` loops with real-world exercises. You will benchmark each version in the playground.",
      },
      {
        title: "Debugging with lldb",
        description:
          "Capture watchpoints and breakpoints to inspect variable changes as control flow branches.",
        codeSample: `for (int i = 0; i < count; ++i) {\n    if (should_log(i)) {\n        printf("step %d\\n", i);\n    }\n}`,
      },
    ],
    videoUrl: "https://www.youtube.com/embed/SV-VNTnCI6M",
    exercise: {
      prompt:
        "Implement `sum_to_n` that returns the sum of the first `n` natural numbers. Guard against invalid input and make sure your implementation is efficient.",
      objectives: [
        "Handle negative values gracefully using defensive programming techniques.",
        "Demonstrate at least two loop constructs while benchmarking their performance.",
        "Write expressive logging to validate intermediate states when running locally.",
      ],
      starterCode: {
        c: `#include <stdio.h>\n\nlong sum_to_n(long n) {\n    if (n < 0) {\n        return 0;\n    }\n\n    long result = 0;\n    for (long i = 1; i <= n; ++i) {\n        result += i;\n    }\n    return result;\n}\n\nint main(void) {\n    long value = 0;\n    if (scanf("%ld", &value) != 1) {\n        return 1;\n    }\n    printf("%ld\\n", sum_to_n(value));\n    return 0;\n}\n`,
        python: `def sum_to_n(value: int) -> int:\n    if value < 0:\n        return 0\n\n    result = 0\n    for current in range(1, value + 1):\n        result += current\n    return result\n\nif __name__ == "__main__":\n    try:\n        print(sum_to_n(int(input().strip())))\n    except ValueError:\n        print(0)\n`,
        javascript: `const sumToN = (value) => {\n  if (value < 0) return 0;\n  let result = 0;\n  for (let current = 1; current <= value; current += 1) {\n    result += current;\n  }\n  return result;\n};\n\nconst fs = require("fs");\nconst input = fs.readFileSync(0, "utf8").trim();\nconst parsed = Number.parseInt(input, 10);\nconsole.log(sumToN(Number.isNaN(parsed) ? 0 : parsed));\n`,
      },
      defaultLanguage: "c",
      tests: [
        {
          id: "lesson-3-test-1",
          name: "Handles zero",
          description: "Input of 0 should output 0.",
          inputExample: "0",
          expectedOutput: "0",
        },
        {
          id: "lesson-3-test-2",
          name: "Positive range",
          description: "Input of 5 should output 15.",
          inputExample: "5",
          expectedOutput: "15",
        },
        {
          id: "lesson-3-test-3",
          name: "Rejects negatives",
          description: "Negative inputs should fall back to 0.",
          inputExample: "-3",
          expectedOutput: "0",
        },
      ],
    },
    resources: [
      { label: "Loop constructs in C", href: "https://en.cppreference.com/w/c/language/for" },
      { label: "Control flow cheat sheet", href: "https://www.cs.cmu.edu/~15131/f17/topics/control-flow/" },
    ],
  },
};

export const getCourseBySlug = (slug?: string) => {
  if (!slug) return undefined;
  return courseCatalog[slug];
};

export const getLessonById = (lessonId?: string) => {
  if (!lessonId) return undefined;

  for (const course of Object.values(courseCatalog)) {
    const lessonIndex = course.lessons.findIndex((entry) => entry.id === lessonId);
    if (lessonIndex !== -1) {
      const lesson = course.lessons[lessonIndex];
      const nextLesson = course.lessons[lessonIndex + 1];
      const content = lessonContentCatalog[lesson.id];

      return {
        course,
        lesson,
        nextLesson,
        content,
      } as const;
    }
  }

  return undefined;
};

export const getLessonContent = (lessonId: string) => lessonContentCatalog[lessonId];
