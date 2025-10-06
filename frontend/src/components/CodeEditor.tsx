import { useEffect, useMemo, useState, type ComponentType } from "react";

export type CodeEditorProps = {
  language: string;
  code: string;
  onChange: (value: string) => void;
  theme: "light" | "dark";
  height?: string | number;
  className?: string;
  textareaClassName?: string;
  unstyled?: boolean;
};

type Monaco = typeof import("monaco-editor");

type MonacoEditorProps = {
  height: string;
  defaultLanguage: string;
  language: string;
  value: string;
  theme: string;
  onChange: (value: string | undefined) => void;
  options: {
    minimap: { enabled: boolean };
    fontSize: number;
    scrollBeyondLastLine: boolean;
    automaticLayout: boolean;
    smoothScrolling: boolean;
  };
  beforeMount: (monaco: Monaco) => void;
};

type MonacoEditorModule = {
  default: ComponentType<MonacoEditorProps>;
};

let monacoModulePromise: Promise<MonacoEditorModule | null> | null = null;

const loadMonacoEditor = () => {
  if (!monacoModulePromise) {
    monacoModulePromise = import(
      /* @vite-ignore */ "@monaco-editor/react"
    )
      .then((module) => module as MonacoEditorModule)
      .catch((error) => {
        console.warn(
          "Falling back to the basic textarea editor because @monaco-editor/react could not be loaded."
        );
        console.warn(error);
        return null;
      });
  }

  return monacoModulePromise;
};

const CodeEditor = ({
  language,
  code,
  onChange,
  theme,
  height,
  className,
  textareaClassName,
  unstyled,
}: CodeEditorProps) => {
  const [monacoModule, setMonacoModule] = useState<MonacoEditorModule | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const editorLanguage = useMemo(() => language.toLowerCase(), [language]);
  const resolvedHeight = useMemo(() => {
    if (typeof height === "number") {
      return `${height}px`;
    }
    return height ?? "400px";
  }, [height]);

  useEffect(() => {
    let cancelled = false;

    loadMonacoEditor().then((module) => {
      if (cancelled) {
        return;
      }

      setMonacoModule(module);
      setLoadFailed(module === null);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleBeforeMount = (monaco: Monaco) => {
    monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
    monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);
  };

  const containerClassName = unstyled
    ? className ?? ""
    : `overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-slate-700 ${className ?? ""}`;

  const resolvedTextareaClassName =
    textareaClassName ??
    (unstyled
      ? "h-full w-full resize-none overflow-auto border-0 bg-transparent p-4 font-mono text-sm text-slate-100 outline-none focus:ring-2 focus:ring-sky-500/40"
      : "h-full w-full resize-none overflow-auto border-0 p-4 font-mono text-sm outline-none focus:ring-2 focus:ring-blue-200 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-500");

  const fallbackNoticeClassName = unstyled
    ? "border-t border-white/10 bg-white/5 p-3 text-xs text-slate-300"
    : "border-t border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";

  if (!monacoModule) {
    return (
      <div className={containerClassName} style={{ height: resolvedHeight }}>
        <textarea
          className={resolvedTextareaClassName}
          value={code}
          onChange={(event) => onChange(event.target.value)}
          spellCheck={false}
        />
        {loadFailed ? (
          <p className={fallbackNoticeClassName}>
            Install <code>@monaco-editor/react</code> to enable the rich Monaco code editor.
          </p>
        ) : null}
      </div>
    );
  }

  const EditorComponent = monacoModule.default;

  return (
    <div className={containerClassName} style={{ height: resolvedHeight }}>
      <EditorComponent
        height={resolvedHeight}
        defaultLanguage={editorLanguage}
        language={editorLanguage}
        value={code}
        theme={theme === "dark" ? "vs-dark" : "vs-light"}
        onChange={(value) => onChange(value ?? "")}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          smoothScrolling: true,
        }}
        beforeMount={handleBeforeMount}
      />
    </div>
  );
};

export default CodeEditor;
