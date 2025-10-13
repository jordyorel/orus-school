import { CourseLessonsResponse, Course, LessonDetail, ExerciseDetail } from "../types/course";
import { computeProgressFromLessons } from "../utils/courseProgress";

type LessonSeed = Omit<LessonDetail, "progress" | "exercises"> & {
  exercises: Array<Omit<ExerciseDetail, "progress" | "tests_count"> & { tests_count?: number }>;
};

type CourseSeed = {
  course: Course;
  lessons: LessonSeed[];
};

const withDefaults = (lesson: LessonSeed): LessonDetail => ({
  ...lesson,
  progress: null,
  exercises: lesson.exercises.map((exercise, index) => ({
    ...exercise,
    tests_count: exercise.tests_count ?? 3,
    order_index: exercise.order_index ?? index + 1,
    progress: null,
  })),
});

const buildCourseData = ({ course, lessons }: CourseSeed): CourseLessonsResponse => {
  const normalizedLessons = lessons
    .map((lesson, index) =>
      withDefaults({
        ...lesson,
        order_index: lesson.order_index ?? index + 1,
      })
    )
    .sort((a, b) => a.order_index - b.order_index);

  return {
    course,
    lessons: normalizedLessons,
    course_progress: computeProgressFromLessons(course, normalizedLessons),
  };
};

const yearOneSeeds: Record<string, CourseSeed> = {
  "foundations-of-c": {
    course: {
      id: 101,
      title: "Foundations of C Programming",
      description: "Master core syntax, memory, and standard library fundamentals.",
      year: 1,
      order_index: 1,
    },
    lessons: [
      {
        id: 10101,
        course_id: 101,
        title: "C Syntax & Hello World",
        description: "Orientation to the compiler toolchain and program structure.",
        video_url: "https://videos.orus.school/c/10101.mp4",
        notes: `
          <h3>Writing Your First Program</h3>
          <ul>
            <li>Every C program begins execution in <code>main</code>.</li>
            <li>Include only the headers you need.</li>
            <li>Return <code>0</code> from <code>main</code> to signal success.</li>
          </ul>
        `,
        order_index: 1,
        exercises: [
          {
            id: 1010101,
            lesson_id: 10101,
            title: "Warm up: greet Orus",
            instructions: `
              <p>Print <code>Hello world</code> followed by a newline.</p>
              <p>Compile with <code>cc main.c</code> and run <code>./a.out</code>.</p>
            `,
            starter_code: {
              c: `#include <stdio.h>

int main(void)
{
    // TODO: print Hello world and return 0
    return 0;
}
`,
            },
            default_language: "c",
          },
        ],
      },
      {
        id: 10102,
        course_id: 101,
        title: "Variables & Types",
        description: "Primitive types, scope, and formatted I/O.",
        video_url: "https://videos.orus.school/c/10102.mp4",
        notes: `
          <h3>Tracking State</h3>
          <p>Use the narrowest type that fits the data and leverage <code>const</code> for read-only values.</p>
        `,
        order_index: 2,
        exercises: [
          {
            id: 1010201,
            lesson_id: 10102,
            title: "Mini calculator",
            instructions: `
              <p>Read two floating point numbers from standard input and print their sum, difference, and product.</p>
              <p>Format each output on its own line with two decimal places.</p>
            `,
            starter_code: {
              c: `#include <stdio.h>

int main(void)
{
    double a;
    double b;

    // TODO: scan two numbers and print the results
    return 0;
}
`,
            },
            default_language: "c",
          },
        ],
      },
      {
        id: 10103,
        course_id: 101,
        title: "Control Structures",
        description: "Conditionals, loops, and branching.",
        video_url: "https://videos.orus.school/c/10103.mp4",
        notes: `
          <h3>Directing Execution</h3>
          <p><code>if</code>/<code>else</code> decide, loops repeat, and <code>switch</code> handles discrete options.</p>
        `,
        order_index: 3,
        exercises: [
          {
            id: 1010301,
            lesson_id: 10103,
            title: "FizzBuzz reloaded",
            instructions: `
              <p>Print numbers from 1 to 100, replacing multiples of three with "Fizz" and multiples of five with "Buzz".</p>
              <p>Print <code>FizzBuzz</code> for numbers divisible by both.</p>
            `,
            starter_code: {
              c: `#include <stdio.h>

int main(void)
{
    // TODO: loop from 1 to 100 and print the correct label
    return 0;
}
`,
            },
            default_language: "c",
          },
        ],
      },
      {
        id: 10104,
        course_id: 101,
        title: "Functions & Scopes",
        description: "Break logic into helpers and explore recursion.",
        video_url: "https://videos.orus.school/c/10104.mp4",
        notes: `
          <h3>Designing Helpers</h3>
          <ul>
            <li>Forward declare functions before you call them.</li>
            <li>Return early on invalid input to keep code flat.</li>
            <li>Mind recursion depth and base cases.</li>
          </ul>
        `,
        order_index: 4,
        exercises: [
          {
            id: 1010401,
            lesson_id: 10104,
            title: "Factorial helper",
            instructions: `
              <p>Implement <code>ft_factorial</code> that returns the factorial of a non-negative integer.</p>
              <p>Return <code>0</code> for negative inputs.</p>
            `,
            starter_code: {
              c: `#include <stddef.h>

long   ft_factorial(int n)
{
    // TODO: implement recursively or iteratively
    return 0;
}
`,
            },
            default_language: "c",
          },
        ],
      },
      {
        id: 10105,
        course_id: 101,
        title: "Arrays & Pointers I",
        description: "Pointer basics and array traversal.",
        video_url: "https://videos.orus.school/c/10105.mp4",
        notes: `
          <h3>Address Arithmetic</h3>
          <p>Arrays decay to pointers—track length with <code>size_t</code> to stay safe.</p>
        `,
        order_index: 5,
        exercises: [
          {
            id: 1010501,
            lesson_id: 10105,
            title: "Reverse a string",
            instructions: `
              <p>Reverse a null-terminated string in place without allocating new memory.</p>
            `,
            starter_code: {
              c: `#include <stddef.h>

void    ft_strrev(char *str)
{
    // TODO: swap characters until the middle of the string
}
`,
            },
            default_language: "c",
          },
        ],
      },
      {
        id: 10106,
        course_id: 101,
        title: "Arrays & Pointers II",
        description: "Pointer arithmetic and const correctness.",
        video_url: "https://videos.orus.school/c/10106.mp4",
        notes: `
          <h3>Walking Memory Safely</h3>
          <p>Understand how pointer increments move based on the pointed-to type.</p>
        `,
        order_index: 6,
        exercises: [
          {
            id: 1010601,
            lesson_id: 10106,
            title: "Copy a buffer",
            instructions: `
              <p>Implement <code>ft_memcpy</code> that copies <code>n</code> bytes from <code>src</code> to <code>dest</code>.</p>
            `,
            starter_code: {
              c: `#include <stddef.h>

void    *ft_memcpy(void *dest, const void *src, size_t n)
{
    // TODO: copy byte-by-byte using unsigned char pointers
    return dest;
}
`,
            },
            default_language: "c",
          },
        ],
      },
      {
        id: 10107,
        course_id: 101,
        title: "Dynamic Memory",
        description: "Heap allocation, ownership, and cleanup.",
        video_url: "https://videos.orus.school/c/10107.mp4",
        notes: `
          <h3>Managing the Heap</h3>
          <ul>
            <li>Match every <code>malloc</code> with a <code>free</code>.</li>
            <li>Check for allocation failure before dereferencing.</li>
            <li>Encapsulate allocation to avoid leaks.</li>
          </ul>
        `,
        order_index: 7,
        exercises: [
          {
            id: 1010701,
            lesson_id: 10107,
            title: "Dynamic array builder",
            instructions: `
              <p>Allocate an integer array of size <code>count</code>, initialise it with a callback, and return the pointer.</p>
            `,
            starter_code: {
              c: `#include <stdlib.h>

int    *ft_build_array(size_t count, int (*init)(size_t index))
{
    // TODO: allocate memory, fill values, handle failure
    return NULL;
}
`,
            },
            default_language: "c",
          },
        ],
      },
      {
        id: 10108,
        course_id: 101,
        title: "String Library Essentials",
        description: "Recreate key libc functions to prepare for libft.",
        video_url: "https://videos.orus.school/c/10108.mp4",
        notes: `
          <h3>Rebuilding libc</h3>
          <p>Match standard behaviour exactly—including edge cases.</p>
        `,
        order_index: 8,
        exercises: [
          {
            id: 1010801,
            lesson_id: 10108,
            title: "Recreate ft_strlen",
            instructions: `
              <p>Count the characters of a null-terminated string using pointer traversal.</p>
            `,
            starter_code: {
              c: `#include <stddef.h>

size_t  ft_strlen(const char *str)
{
    // TODO: iterate until the null terminator and return the count
    return 0;
}
`,
            },
            default_language: "c",
          },
        ],
      },
    ],
  },
  "shell-and-git": {
    course: {
      id: 102,
      title: "Shell & Git",
      description: "Navigate Unix-like systems, manage permissions, and collaborate effectively.",
      year: 1,
      order_index: 2,
    },
    lessons: [
      {
        id: 10201,
        course_id: 102,
        title: "Linux & Shell Basics",
        description: "Command-line navigation and filesystem exploration.",
        video_url: "https://videos.orus.school/shell/10201.mp4",
        notes: `
          <h3>Building Muscle Memory</h3>
          <p>Memorise frequent commands like <code>pwd</code>, <code>ls</code>, <code>mv</code>, and <code>cat</code>.</p>
        `,
        order_index: 1,
        exercises: [
          {
            id: 1020101,
            lesson_id: 10201,
            title: "Navigation treasure hunt",
            instructions: `
              <p>Write a shell script that prints the working directory, lists files, and outputs the contents of <code>README.md</code> when present.</p>
            `,
            starter_code: {
              bash: "#!/usr/bin/env bash\n\n# TODO: print pwd, list files, and cat README.md when present\n",
            },
            default_language: "bash",
          },
        ],
      },
      {
        id: 10202,
        course_id: 102,
        title: "File Permissions",
        description: "Ownership, modes, and secure defaults.",
        video_url: "https://videos.orus.school/shell/10202.mp4",
        notes: `
          <h3>Controlling Access</h3>
          <p>Understand the <code>rwx</code> triads and how <code>chmod</code> modifies them.</p>
        `,
        order_index: 2,
        exercises: [
          {
            id: 1020201,
            lesson_id: 10202,
            title: "Permissions audit",
            instructions: `
              <p>Create a script that receives a file path and prints its permissions in symbolic form alongside the owning user.</p>
            `,
            starter_code: {
              bash: "#!/usr/bin/env bash\n\nFILE=\"$1\"\n# TODO: inspect permissions and owner\n",
            },
            default_language: "bash",
          },
        ],
      },
      {
        id: 10203,
        course_id: 102,
        title: "Git Foundations",
        description: "Commits, branching strategies, and collaboration workflows.",
        video_url: "https://videos.orus.school/shell/10203.mp4",
        notes: `
          <h3>Version Everything</h3>
          <p>Commit early, branch for features, and write meaningful commit messages.</p>
        `,
        order_index: 3,
        exercises: [
          {
            id: 1020301,
            lesson_id: 10203,
            title: "Feature branch workflow",
            instructions: `
              <p>Document the sequence of commands to create a feature branch, commit changes, rebase on <code>main</code>, and open a pull request.</p>
            `,
            starter_code: {
              markdown: "## Git workflow checklist\n\n1. \n2. \n3. \n4. \n",
            },
            default_language: "markdown",
          },
        ],
      },
      {
        id: 10204,
        course_id: 102,
        title: "Makefiles & Automation",
        description: "Automate builds and manage dependencies with <code>make</code>.",
        video_url: "https://videos.orus.school/shell/10204.mp4",
        notes: `
          <h3>Repeatable Builds</h3>
          <p>Declare targets, prerequisites, and recipes to codify your build process.</p>
        `,
        order_index: 4,
        exercises: [
          {
            id: 1020401,
            lesson_id: 10204,
            title: "Mini build system",
            instructions: `
              <p>Create a Makefile that compiles all <code>.c</code> files in <code>src/</code> into a binary named <code>tool</code>.</p>
              <p>Include targets for <code>all</code>, <code>clean</code>, and <code>re</code>.</p>
            `,
            starter_code: {
              make: `CC = cc
CFLAGS = -Wall -Wextra -Werror
NAME = tool
SRC = $(wildcard src/*.c)
OBJ = $(SRC:.c=.o)

# TODO: add rules here
`,
            },
            default_language: "make",
          },
        ],
      },
    ],
  },
  "algorithms-1": {
    course: {
      id: 103,
      title: "Algorithms & Data Structures I",
      description: "Build algorithmic thinking with complexity analysis and linear data structures.",
      year: 1,
      order_index: 3,
    },
    lessons: [
      {
        id: 10301,
        course_id: 103,
        title: "Big-O Notation",
        description: "Compare algorithmic complexity and reason about growth rates.",
        video_url: "https://videos.orus.school/algos/10301.mp4",
        notes: `
          <h3>Measuring Work</h3>
          <p>Describe runtime in terms of input size <code>n</code>.</p>
        `,
        order_index: 1,
        exercises: [
          {
            id: 1030101,
            lesson_id: 10301,
            title: "Complexity analyzer",
            instructions: `
              <p>Write a function that counts operations in a loop and prints the inferred complexity for sample inputs.</p>
            `,
            starter_code: {
              c: `#include <stdio.h>

void    analyze_complexity(int n)
{
    int ops = 0;

    for (int i = 0; i < n; ++i)
        ops++;

    printf("n=%d ops=%d\n", n, ops);
    // TODO: print a message describing the complexity family
}
`,
            },
            default_language: "c",
          },
        ],
      },
      {
        id: 10302,
        course_id: 103,
        title: "Recursion Deep Dive",
        description: "Understand call stacks, base cases, and recursion tracing.",
        video_url: "https://videos.orus.school/algos/10302.mp4",
        notes: `
          <h3>Think Recursively</h3>
          <p>Every recursive function needs a base case and a step that reduces the problem size.</p>
        `,
        order_index: 2,
        exercises: [
          {
            id: 1030201,
            lesson_id: 10302,
            title: "Maze solver",
            instructions: `
              <p>Implement a recursive depth-first search that finds a path through a maze represented as a grid.</p>
            `,
            starter_code: {
              c: `#define WIDTH 8
#define HEIGHT 8

typedef struct s_point
{
    int x;
    int y;
}   t_point;

int solve_maze(char grid[HEIGHT][WIDTH], t_point start, t_point end);
`,
            },
            default_language: "c",
          },
        ],
      },
      {
        id: 10303,
        course_id: 103,
        title: "Linked Lists",
        description: "Nodes, traversal, insertion, and deletion.",
        video_url: "https://videos.orus.school/algos/10303.mp4",
        notes: `
          <h3>Pointer-Powered Sequences</h3>
          <p>Keep track of head pointers and ensure proper memory management.</p>
        `,
        order_index: 3,
        exercises: [
          {
            id: 1030301,
            lesson_id: 10303,
            title: "List manager",
            instructions: `
              <p>Implement functions to add nodes to the front and back of a singly-linked list, and to free the list.</p>
            `,
            starter_code: {
              c: `#include <stddef.h>

typedef struct s_node
{
    int             value;
    struct s_node  *next;
}   t_node;

void    list_push_front(t_node **head, int value);
void    list_push_back(t_node **head, int value);
void    list_clear(t_node **head);
`,
            },
            default_language: "c",
          },
        ],
      },
      {
        id: 10304,
        course_id: 103,
        title: "Sorting Algorithms",
        description: "Implement bubble, insertion, and quick sort.",
        video_url: "https://videos.orus.school/algos/10304.mp4",
        notes: `
          <h3>Ordering Data</h3>
          <p>Contrast the stability, complexity, and practical use cases of common sorts.</p>
        `,
        order_index: 4,
        exercises: [
          {
            id: 1030401,
            lesson_id: 10304,
            title: "Sorting visualiser",
            instructions: `
              <p>Implement quick sort on an integer array and print the array after each partition.</p>
            `,
            starter_code: {
              c: `#include <stddef.h>

void    quick_sort(int *arr, size_t len);
void    print_array(int *arr, size_t len);
`,
            },
            default_language: "c",
          },
        ],
      },
    ],
  },
  "algorithms-2": {
    course: {
      id: 104,
      title: "Algorithms & Data Structures II",
      description: "Graphs, hash tables, and dynamic programming fundamentals.",
      year: 1,
      order_index: 4,
    },
    lessons: [
      {
        id: 10401,
        course_id: 104,
        title: "Graphs & Adjacency Lists",
        description: "Represent graphs and traverse them effectively.",
        video_url: "https://videos.orus.school/algos/10401.mp4",
        notes: `
          <h3>Connecting Nodes</h3>
          <p>Adjacency lists store sparse graphs efficiently.</p>
        `,
        order_index: 1,
        exercises: [
          {
            id: 1040101,
            lesson_id: 10401,
            title: "Graph builder",
            instructions: `
              <p>Create a graph structure with adjacency lists and implement a print function that lists neighbors for each vertex.</p>
            `,
            starter_code: {
              c: `#include <stddef.h>

typedef struct s_edge
{
    size_t          to;
    struct s_edge  *next;
}   t_edge;

typedef struct s_graph
{
    size_t  size;
    t_edge **adjacency;
}   t_graph;

void    graph_add_edge(t_graph *graph, size_t from, size_t to);
void    graph_print(const t_graph *graph);
`,
            },
            default_language: "c",
          },
        ],
      },
      {
        id: 10402,
        course_id: 104,
        title: "Breadth-First Search",
        description: "Traverse graphs layer by layer and find shortest paths in unweighted graphs.",
        video_url: "https://videos.orus.school/algos/10402.mp4",
        notes: `
          <h3>Exploring Neighbours</h3>
          <p>Use a queue to visit nodes in wavefront order.</p>
        `,
        order_index: 2,
        exercises: [
          {
            id: 1040201,
            lesson_id: 10402,
            title: "City route planner",
            instructions: `
              <p>Implement BFS to determine the minimum number of edges between two nodes in an unweighted graph.</p>
            `,
            starter_code: {
              c: `int shortest_path(const t_graph *graph, size_t start, size_t target);
`,
            },
            default_language: "c",
          },
        ],
      },
      {
        id: 10403,
        course_id: 104,
        title: "Hash Tables",
        description: "Design hash functions and resolve collisions.",
        video_url: "https://videos.orus.school/algos/10403.mp4",
        notes: `
          <h3>Constant-Time Lookups</h3>
          <p>Balance load factor and collision strategy for efficiency.</p>
        `,
        order_index: 3,
        exercises: [
          {
            id: 1040301,
            lesson_id: 10403,
            title: "Symbol table",
            instructions: `
              <p>Implement an open-addressing hash table that stores string keys and integer values.</p>
            `,
            starter_code: {
              c: `typedef struct s_entry
{
    char   *key;
    int     value;
    int     in_use;
}   t_entry;

typedef struct s_table
{
    size_t   capacity;
    t_entry *entries;
}   t_table;

int table_set(t_table *table, const char *key, int value);
int table_get(const t_table *table, const char *key, int *out_value);
`,
            },
            default_language: "c",
          },
        ],
      },
      {
        id: 10404,
        course_id: 104,
        title: "Dynamic Programming",
        description: "Optimise recursive solutions by caching results.",
        video_url: "https://videos.orus.school/algos/10404.mp4",
        notes: `
          <h3>Memoise Everything</h3>
          <p>Store intermediate results to avoid recomputation.</p>
        `,
        order_index: 4,
        exercises: [
          {
            id: 1040401,
            lesson_id: 10404,
            title: "Fibonacci vs DP",
            instructions: `
              <p>Compare naive recursion with a memoised approach for computing Fibonacci numbers.</p>
            `,
            starter_code: {
              c: `long   fib_recursive(int n);
long   fib_memoised(int n, long *cache);
`,
            },
            default_language: "c",
          },
        ],
      },
    ],
  },
  "systems-programming": {
    course: {
      id: 105,
      title: "Memory Management & Systems Programming",
      description: "Dig into processes, memory, and low-level system calls.",
      year: 1,
      order_index: 5,
    },
    lessons: [
      {
        id: 10501,
        course_id: 105,
        title: "Stack vs Heap Deep Dive",
        description: "Inspect addresses and understand lifetime.",
        video_url: "https://videos.orus.school/systems/10501.mp4",
        notes: `
          <h3>Where Data Lives</h3>
          <p>Recognise when values belong on the stack vs the heap.</p>
        `,
        order_index: 1,
        exercises: [
          {
            id: 1050101,
            lesson_id: 10501,
            title: "Memory map tool",
            instructions: `
              <p>Print the addresses of stack variables, heap allocations, and string literals to illustrate layout.</p>
            `,
            starter_code: {
              c: `#include <stdio.h>
#include <stdlib.h>

void    print_memory_map(void)
{
    // TODO: declare stack vars, allocate memory, and print addresses
}
`,
            },
            default_language: "c",
          },
        ],
      },
      {
        id: 10502,
        course_id: 105,
        title: "File I/O",
        description: "Read and write files safely using the C standard library.",
        video_url: "https://videos.orus.school/systems/10502.mp4",
        notes: `
          <h3>Talking to the Filesystem</h3>
          <p>Always check return values when performing I/O.</p>
        `,
        order_index: 2,
        exercises: [
          {
            id: 1050201,
            lesson_id: 10502,
            title: "File copy CLI",
            instructions: `
              <p>Implement a command-line tool that copies one file to another using buffered reads.</p>
            `,
            starter_code: {
              c: `int copy_file(const char *src_path, const char *dst_path);
`,
            },
            default_language: "c",
          },
        ],
      },
      {
        id: 10503,
        course_id: 105,
        title: "Processes & Fork",
        description: "Spawn child processes and execute programs.",
        video_url: "https://videos.orus.school/systems/10503.mp4",
        notes: `
          <h3>Managing Processes</h3>
          <p>Use <code>fork</code>, <code>execve</code>, and <code>waitpid</code> to orchestrate work.</p>
        `,
        order_index: 3,
        exercises: [
          {
            id: 1050301,
            lesson_id: 10503,
            title: "Mini shell",
            instructions: `
              <p>Create a minimal shell that reads a command, forks, executes using <code>execve</code>, and waits for completion.</p>
            `,
            starter_code: {
              c: `int run_shell(void);
`,
            },
            default_language: "c",
          },
        ],
      },
      {
        id: 10504,
        course_id: 105,
        title: "Signals & Pipes",
        description: "Communicate between processes using pipes and handle signals gracefully.",
        video_url: "https://videos.orus.school/systems/10504.mp4",
        notes: `
          <h3>Orchestrating Processes</h3>
          <p>Respond to <code>SIGINT</code> cleanly and use <code>pipe</code> to connect processes.</p>
        `,
        order_index: 4,
        exercises: [
          {
            id: 1050401,
            lesson_id: 10504,
            title: "Pipeline runner",
            instructions: `
              <p>Implement a utility that pipes the output of one command into another, emulating <code>cmd1 | cmd2</code>.</p>
            `,
            starter_code: {
              c: `int run_pipeline(char *const left[], char *const right[]);
`,
            },
            default_language: "c",
          },
        ],
      },
    ],
  },
  networking: {
    course: {
      id: 106,
      title: "Networking Basics",
      description: "Understand the network stack and build TCP servers in C.",
      year: 1,
      order_index: 6,
    },
    lessons: [
      {
        id: 10601,
        course_id: 106,
        title: "OSI & TCP/IP",
        description: "Layered networking model fundamentals.",
        video_url: "https://videos.orus.school/net/10601.mp4",
        notes: `
          <h3>Seven Layers</h3>
          <p>Summarise each layer of the OSI model and map them to real protocols.</p>
        `,
        order_index: 1,
        exercises: [
          {
            id: 1060101,
            lesson_id: 10601,
            title: "Packet simulation",
            instructions: `
              <p>Document how a packet travels from application to physical layer using a short markdown diagram.</p>
            `,
            starter_code: {
              markdown: "# Packet Journey\n\n- Application: \n- Transport: \n- Network: \n- Link: \n- Physical: \n",
            },
            default_language: "markdown",
          },
        ],
      },
      {
        id: 10602,
        course_id: 106,
        title: "TCP Server/Client in C",
        description: "Socket lifecycle: create, bind, listen, accept, connect.",
        video_url: "https://videos.orus.school/net/10602.mp4",
        notes: `
          <h3>Reliable Streams</h3>
          <p>Handle errors robustly and close sockets on failure paths.</p>
        `,
        order_index: 2,
        exercises: [
          {
            id: 1060201,
            lesson_id: 10602,
            title: "Chat server",
            instructions: `
              <p>Implement a TCP server that accepts multiple clients and broadcasts messages to connected peers.</p>
            `,
            starter_code: {
              c: `int start_chat_server(unsigned short port);
`,
            },
            default_language: "c",
          },
        ],
      },
      {
        id: 10603,
        course_id: 106,
        title: "HTTP Fundamentals",
        description: "Understand verbs, headers, and status codes.",
        video_url: "https://videos.orus.school/net/10603.mp4",
        notes: `
          <h3>Speaking HTTP</h3>
          <p>Requests are text-based—practice crafting raw HTTP messages.</p>
        `,
        order_index: 3,
        exercises: [
          {
            id: 1060301,
            lesson_id: 10603,
            title: "HTTP client",
            instructions: `
              <p>Write a small program that performs a GET request using sockets and prints the response headers and body.</p>
            `,
            starter_code: {
              c: `int http_get(const char *host, const char *path);
`,
            },
            default_language: "c",
          },
        ],
      },
    ],
  },
  "python-automation": {
    course: {
      id: 107,
      title: "Python for Automation",
      description: "Leverage Python to script, automate, and integrate services.",
      year: 1,
      order_index: 7,
    },
    lessons: [
      {
        id: 10701,
        course_id: 107,
        title: "Python Syntax vs C",
        description: "Contrast dynamic typing with C's static model.",
        video_url: "https://videos.orus.school/python/10701.mp4",
        notes: `
          <h3>Pythonic Foundations</h3>
          <p>Indentation matters—no braces required.</p>
        `,
        order_index: 1,
        exercises: [
          {
            id: 1070101,
            lesson_id: 10701,
            title: "libft in Python",
            instructions: `
              <p>Re-implement a subset of <code>libft</code> functions (e.g., <code>strlen</code>, <code>strcpy</code>) in Python.</p>
            `,
            starter_code: {
              python: "def ft_strlen(value: str) -> int:\n    # TODO: count characters\n    return 0\n\n",
            },
            default_language: "python",
          },
        ],
      },
      {
        id: 10702,
        course_id: 107,
        title: "File Handling & OS Module",
        description: "Automate filesystem tasks with Python.",
        video_url: "https://videos.orus.school/python/10702.mp4",
        notes: `
          <h3>Automating the CLI</h3>
          <p>Use <code>pathlib</code> and <code>os</code> to manipulate directories and files.</p>
        `,
        order_index: 2,
        exercises: [
          {
            id: 1070201,
            lesson_id: 10702,
            title: "Bulk renamer",
            instructions: `
              <p>Create a script that renames files based on a template and logs actions to stdout.</p>
            `,
            starter_code: {
              python: "from pathlib import Path\n\ndef rename_files(directory: Path, pattern: str) -> None:\n    # TODO: iterate files and rename according to pattern\n    raise NotImplementedError\n",
            },
            default_language: "python",
          },
        ],
      },
      {
        id: 10703,
        course_id: 107,
        title: "API Requests & JSON",
        description: "Call APIs using <code>requests</code> and handle JSON payloads.",
        video_url: "https://videos.orus.school/python/10703.mp4",
        notes: `
          <h3>Integrations</h3>
          <p>Always handle network failures and rate limits.</p>
        `,
        order_index: 3,
        exercises: [
          {
            id: 1070301,
            lesson_id: 10703,
            title: "GitHub fetcher",
            instructions: `
              <p>Fetch repository statistics from the GitHub API and print a summary table.</p>
            `,
            starter_code: {
              python: "import requests\n\ndef fetch_repo(owner: str, name: str) -> dict:\n    # TODO: call GitHub API and return parsed JSON\n    raise NotImplementedError\n",
            },
            default_language: "python",
          },
        ],
      },
      {
        id: 10704,
        course_id: 107,
        title: "CLI Automation Projects",
        description: "Package automation scripts into polished CLI tools.",
        video_url: "https://videos.orus.school/python/10704.mp4",
        notes: `
          <h3>Shipping Scripts</h3>
          <p>Use <code>argparse</code> to provide a friendly interface.</p>
        `,
        order_index: 4,
        exercises: [
          {
            id: 1070401,
            lesson_id: 10704,
            title: "Auto report generator",
            instructions: `
              <p>Generate a weekly learning summary by aggregating JSON progress logs into markdown.</p>
            `,
            starter_code: {
              python: "def generate_report(log_path: str, output_path: str) -> None:\n    # TODO: read JSON, summarise, and write markdown\n    raise NotImplementedError\n",
            },
            default_language: "python",
          },
        ],
      },
    ],
  },
  "backend-foundations": {
    course: {
      id: 108,
      title: "Databases & Backend Basics",
      description: "Build FastAPI services backed by SQLite and JWT auth.",
      year: 1,
      order_index: 8,
    },
    lessons: [
      {
        id: 10801,
        course_id: 108,
        title: "SQL & SQLite",
        description: "Design schemas, query data, and reason about joins.",
        video_url: "https://videos.orus.school/backend/10801.mp4",
        notes: `
          <h3>Relational Thinking</h3>
          <p>Normalise tables and practice SELECT queries.</p>
        `,
        order_index: 1,
        exercises: [
          {
            id: 1080101,
            lesson_id: 10801,
            title: "Student records DB",
            instructions: `
              <p>Create tables for students, courses, and enrollments, then query completion stats.</p>
            `,
            starter_code: {
              sql: "-- TODO: create tables and sample queries\n",
            },
            default_language: "sql",
          },
        ],
      },
      {
        id: 10802,
        course_id: 108,
        title: "FastAPI Basics",
        description: "Define routes, models, and validation.",
        video_url: "https://videos.orus.school/backend/10802.mp4",
        notes: `
          <h3>Python APIs Fast</h3>
          <p>Use Pydantic models to validate input and respond with JSON.</p>
        `,
        order_index: 2,
        exercises: [
          {
            id: 1080201,
            lesson_id: 10802,
            title: "REST API for records",
            instructions: `
              <p>Expose CRUD endpoints for the student database using FastAPI.</p>
            `,
            starter_code: {
              python: "from fastapi import FastAPI\n\napp = FastAPI()\n\n# TODO: add routes here\n",
            },
            default_language: "python",
          },
        ],
      },
      {
        id: 10803,
        course_id: 108,
        title: "Authentication & Security",
        description: "Implement JWT auth, hashing, and access control.",
        video_url: "https://videos.orus.school/backend/10803.mp4",
        notes: `
          <h3>Protecting APIs</h3>
          <p>Never store plaintext passwords—hash with bcrypt and validate tokens.</p>
        `,
        order_index: 3,
        exercises: [
          {
            id: 1080301,
            lesson_id: 10803,
            title: "Auth system",
            instructions: `
              <p>Add login and protected routes to the FastAPI service using JWT tokens.</p>
            `,
            starter_code: {
              python: "from fastapi import Depends\n\n# TODO: wire up authentication dependencies\n",
            },
            default_language: "python",
          },
        ],
      },
    ],
  },
  "frontend-foundations": {
    course: {
      id: 109,
      title: "Frontend Foundations (React)",
      description: "Build interactive interfaces with modern React and TypeScript.",
      year: 1,
      order_index: 9,
    },
    lessons: [
      {
        id: 10901,
        course_id: 109,
        title: "HTML/CSS/JS Refresh",
        description: "Structure content, style with Flexbox, and interact with the DOM.",
        video_url: "https://videos.orus.school/frontend/10901.mp4",
        notes: `
          <h3>Strong Foundations</h3>
          <p>Semantic HTML and responsive layouts make everything easier.</p>
        `,
        order_index: 1,
        exercises: [
          {
            id: 1090101,
            lesson_id: 10901,
            title: "Responsive landing page",
            instructions: `
              <p>Build a landing page hero section with a responsive layout and call-to-action button.</p>
            `,
            starter_code: {
              html: "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\" />\n  <title>Orus Landing</title>\n</head>\n<body>\n  <!-- TODO: add hero markup here -->\n</body>\n</html>\n",
            },
            default_language: "html",
          },
        ],
      },
      {
        id: 10902,
        course_id: 109,
        title: "React Components",
        description: "Compose interfaces with components, props, and hooks.",
        video_url: "https://videos.orus.school/frontend/10902.mp4",
        notes: `
          <h3>Declarative UI</h3>
          <p>Think in components—each with clear inputs and outputs.</p>
        `,
        order_index: 2,
        exercises: [
          {
            id: 1090201,
            lesson_id: 10902,
            title: "Dashboard widgets",
            instructions: `
              <p>Create a React component that displays course progress cards using props.</p>
            `,
            starter_code: {
              tsx: `import type { FC } from "react";

type ProgressCardProps = {
  title: string;
  completion: number;
};

export const ProgressCard: FC<ProgressCardProps> = ({ title, completion }) => {
  // TODO: render card markup
  return null;
};
`,
            },
            default_language: "tsx",
          },
        ],
      },
      {
        id: 10903,
        course_id: 109,
        title: "API Integration",
        description: "Fetch data from FastAPI and handle loading states.",
        video_url: "https://videos.orus.school/frontend/10903.mp4",
        notes: `
          <h3>Data fetching</h3>
          <p>Handle loading, success, and error states gracefully.</p>
        `,
        order_index: 3,
        exercises: [
          {
            id: 1090301,
            lesson_id: 10903,
            title: "Course page prototype",
            instructions: `
              <p>Fetch course data from <code>/api/courses/:id</code> and render lessons in a sidebar.</p>
            `,
            starter_code: {
              tsx: `import { useEffect, useState } from "react";

// TODO: implement CoursePage prototype with fetch
`,
            },
            default_language: "tsx",
          },
        ],
      },
    ],
  },
  "year-one-capstone": {
    course: {
      id: 110,
      title: "Year 1 Final Project",
      description: "Plan, build, test, and present a full-stack capstone.",
      year: 1,
      order_index: 10,
    },
    lessons: [
      {
        id: 11001,
        course_id: 110,
        title: "Project Planning",
        description: "Define scope, milestones, and success criteria.",
        video_url: "https://videos.orus.school/capstone/11001.mp4",
        notes: `
          <h3>Design First</h3>
          <p>Write a concise spec with MVP, stretch goals, and timeline.</p>
        `,
        order_index: 1,
        exercises: [
          {
            id: 1100101,
            lesson_id: 11001,
            title: "Design document",
            instructions: `
              <p>Draft a one-page design doc outlining problem statement, target users, and technical stack.</p>
            `,
            starter_code: {
              markdown: "# Capstone Design Doc\n\n## Problem\n\n## Users\n\n## Architecture\n\n## Milestones\n",
            },
            default_language: "markdown",
          },
        ],
      },
      {
        id: 11002,
        course_id: 110,
        title: "Implementation Sprint",
        description: "Execute iteratively with pair programming and code reviews.",
        video_url: "https://videos.orus.school/capstone/11002.mp4",
        notes: `
          <h3>Ship Incrementally</h3>
          <p>Set up a Kanban board and commit daily progress.</p>
        `,
        order_index: 2,
        exercises: [
          {
            id: 1100201,
            lesson_id: 11002,
            title: "Sprint plan",
            instructions: `
              <p>Break down the project into at least five deliverables with owners and deadlines.</p>
            `,
            starter_code: {
              markdown: "## Sprint Backlog\n\n- [ ] Feature 1\n- [ ] Feature 2\n- [ ] Feature 3\n",
            },
            default_language: "markdown",
          },
        ],
      },
      {
        id: 11003,
        course_id: 110,
        title: "Debugging & Testing",
        description: "Add automated tests and CI pipelines.",
        video_url: "https://videos.orus.school/capstone/11003.mp4",
        notes: `
          <h3>Quality Gate</h3>
          <p>Automate tests and code style checks to avoid regressions.</p>
        `,
        order_index: 3,
        exercises: [
          {
            id: 1100301,
            lesson_id: 11003,
            title: "CI checklist",
            instructions: `
              <p>Configure GitHub Actions (or alternative) to run tests and linters on every push.</p>
            `,
            starter_code: {
              yaml: "name: CI\n\non: [push]\n\n# TODO: add jobs for backend and frontend\n",
            },
            default_language: "yaml",
          },
        ],
      },
      {
        id: 11004,
        course_id: 110,
        title: "Presentation & Reflection",
        description: "Prepare a compelling demo and capture lessons learned.",
        video_url: "https://videos.orus.school/capstone/11004.mp4",
        notes: `
          <h3>Tell the Story</h3>
          <p>Highlight user impact, technical decisions, and key learnings.</p>
        `,
        order_index: 4,
        exercises: [
          {
            id: 1100401,
            lesson_id: 11004,
            title: "Demo script",
            instructions: `
              <p>Create a five-minute demo outline covering context, features, and next steps.</p>
            `,
            starter_code: {
              markdown: "# Demo Outline\n\n1. Intro\n2. Problem & Solution\n3. Live demo\n4. Q&A\n",
            },
            default_language: "markdown",
          },
        ],
      },
    ],
  },
};

export const yearOneCourses: Record<string, CourseLessonsResponse> = Object.fromEntries(
  Object.entries(yearOneSeeds).map(([slug, seed]) => [slug, buildCourseData(seed)])
);

export const yearOneCourseSlugs = Object.keys(yearOneSeeds);

export const defaultYearOneCourseSlug = "foundations-of-c";
