export type LessonStatus = "completed" | "available" | "locked";

export interface LessonSummary {
  id: string;
  title: string;
  duration: string;
  status: LessonStatus;
  summary: string;
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

export const getCourseBySlug = (slug?: string) => {
  if (!slug) return undefined;
  return courseCatalog[slug];
};

