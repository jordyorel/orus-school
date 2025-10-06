import { useMemo } from "react";
import Editor, { Monaco } from "@monaco-editor/react";

export type CodeEditorProps = {
  language: string;
  code: string;
  onChange: (value: string) => void;
  theme: "light" | "dark";
};

const CodeEditor = ({ language, code, onChange, theme }: CodeEditorProps) => {
  const editorLanguage = useMemo(() => language.toLowerCase(), [language]);

  const handleBeforeMount = (monaco: Monaco) => {
    monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
    monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-slate-700">
      <Editor
        height="400px"
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
