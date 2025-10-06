export type ConsoleTabsProps = {
  activeTab: "console" | "tests" | "feedback";
  onTabChange: (tab: "console" | "tests" | "feedback") => void;
  consoleOutput: string;
  testResults: { id: number | string; title: string; passed: boolean; stdout: string; stderr: string; expected?: string; input?: string }[];
  feedback?: string;
};

const tabLabels: Record<ConsoleTabsProps["activeTab"], string> = {
  console: "Console",
  tests: "Test Results",
  feedback: "Feedback"
};

const ConsoleTabs = ({ activeTab, onTabChange, consoleOutput, testResults, feedback }: ConsoleTabsProps) => {
  return (
    <section className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex border-b border-slate-200 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">
        {(Object.keys(tabLabels) as ConsoleTabsProps["activeTab"][]).map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`flex-1 px-4 py-3 transition ${
              activeTab === tab
                ? "border-b-2 border-sky-500 text-sky-600 dark:border-sky-400 dark:text-sky-300"
                : "hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4 text-sm">
        {activeTab === "console" ? (
          <pre className="whitespace-pre-wrap rounded-lg bg-slate-900/95 p-4 font-mono text-xs text-emerald-200">
            {consoleOutput || "Run your code to see output"}
          </pre>
        ) : null}
        {activeTab === "tests" ? (
          <div className="space-y-3">
            {testResults.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400">Run tests to see detailed results.</p>
            ) : (
              testResults.map((result) => (
                <div
                  key={result.id}
                  className={`rounded-xl border p-4 ${
                    result.passed
                      ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-100"
                      : "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{result.title}</span>
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      {result.passed ? "Pass" : "Fail"}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2 text-xs">
                    {result.input ? (
                      <p>
                        <span className="font-semibold">Input:</span> <code>{result.input}</code>
                      </p>
                    ) : null}
                    <p>
                      <span className="font-semibold">Stdout:</span> <code>{result.stdout || "(empty)"}</code>
                    </p>
                    <p>
                      <span className="font-semibold">Stderr:</span> <code>{result.stderr || "(empty)"}</code>
                    </p>
                    {result.expected ? (
                      <p>
                        <span className="font-semibold">Expected:</span> <code>{result.expected}</code>
                      </p>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : null}
        {activeTab === "feedback" ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200">
            {feedback ? feedback : "Feedback from your mentor will appear here once your project is reviewed."}
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default ConsoleTabs;
