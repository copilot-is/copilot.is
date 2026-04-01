'use client';

import { useEffect, useMemo, useRef } from 'react';
import { cpp } from '@codemirror/lang-cpp';
import { css } from '@codemirror/lang-css';
import { go } from '@codemirror/lang-go';
import { html } from '@codemirror/lang-html';
import { java } from '@codemirror/lang-java';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { php } from '@codemirror/lang-php';
import { python } from '@codemirror/lang-python';
import { rust } from '@codemirror/lang-rust';
import { sql } from '@codemirror/lang-sql';
import { xml } from '@codemirror/lang-xml';
import { yaml } from '@codemirror/lang-yaml';
import { StreamLanguage } from '@codemirror/language';
import { csharp } from '@codemirror/legacy-modes/mode/clike';
import { dockerFile } from '@codemirror/legacy-modes/mode/dockerfile';
import { nginx } from '@codemirror/legacy-modes/mode/nginx';
import { properties } from '@codemirror/legacy-modes/mode/properties';
import { shell } from '@codemirror/legacy-modes/mode/shell';
import { toml } from '@codemirror/legacy-modes/mode/toml';
import { oneDark } from '@codemirror/theme-one-dark';
import { githubLight } from '@uiw/codemirror-theme-github';
import CodeMirror, {
  EditorView,
  ReactCodeMirrorRef
} from '@uiw/react-codemirror';
import { useTheme } from 'next-themes';

import { normalizeCodeLanguage } from '@/lib/code-language';

const getLanguageExtension = (language: string) => {
  const normalized = normalizeCodeLanguage(language);

  if (!normalized) return null;

  if (normalized === 'json') return json();
  if (normalized === 'html') return html();
  if (normalized === 'css' || normalized === 'properties') {
    return normalized === 'properties'
      ? StreamLanguage.define(properties)
      : css();
  }
  if (normalized === 'xml' || normalized === 'svg') return xml();
  if (normalized === 'yaml') return yaml();
  if (normalized === 'toml') return StreamLanguage.define(toml);
  if (normalized === 'python') return python();
  if (normalized === 'php') return php();
  if (normalized === 'java') return java();
  if (normalized === 'go') return go();
  if (normalized === 'rust') return rust();
  if (normalized === 'sql') return sql();
  if (normalized === 'c' || normalized === 'cpp') {
    return cpp();
  }
  if (normalized === 'csharp') {
    return StreamLanguage.define(csharp);
  }
  if (normalized === 'dockerfile') {
    return StreamLanguage.define(dockerFile);
  }
  if (normalized === 'nginx') {
    return StreamLanguage.define(nginx);
  }
  if (normalized === 'ini') {
    return StreamLanguage.define(properties);
  }
  if (normalized === 'bash' || normalized === 'zsh') {
    return StreamLanguage.define(shell);
  }
  if (normalized === 'markdown') return markdown();
  if (normalized === 'tsx') return javascript({ jsx: true, typescript: true });
  if (normalized === 'typescript') {
    return javascript({ typescript: true });
  }
  if (normalized === 'jsx') return javascript({ jsx: true });
  if (normalized === 'javascript') return javascript();

  return null;
};

interface CodeEditorProps {
  language: string;
  value: string;
  wrapLongLines?: boolean;
  autoScrollToBottom?: boolean;
  showLineNumbers?: boolean;
}

export function CodeEditor({
  language,
  value,
  wrapLongLines = false,
  autoScrollToBottom = false,
  showLineNumbers = true
}: CodeEditorProps) {
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const { theme = 'system', systemTheme } = useTheme();

  const resolvedTheme = theme === 'system' ? (systemTheme ?? 'light') : theme;

  const extensions = useMemo(() => {
    const languageExtension = getLanguageExtension(language);

    return [
      EditorView.editable.of(false),
      ...(wrapLongLines ? [EditorView.lineWrapping] : []),
      ...(languageExtension ? [languageExtension] : [])
    ];
  }, [language, wrapLongLines]);

  useEffect(() => {
    if (!autoScrollToBottom) return;

    requestAnimationFrame(() => {
      const scrollDOM = editorRef.current?.view?.scrollDOM;
      if (!scrollDOM) return;
      scrollDOM.scrollTop = scrollDOM.scrollHeight;
    });
  }, [autoScrollToBottom, value]);

  return (
    <div className="min-w-0 [&_.cm-content]:font-mono [&_.cm-content]:text-sm [&_.cm-editor]:bg-transparent [&_.cm-editor]:outline-none [&_.cm-gutters]:border-0 [&_.cm-gutters]:bg-transparent [&_.cm-scroller]:font-mono">
      <CodeMirror
        ref={editorRef}
        value={value}
        theme={resolvedTheme === 'dark' ? oneDark : githubLight}
        basicSetup={{
          lineNumbers: showLineNumbers,
          foldGutter: false,
          highlightActiveLine: false,
          highlightActiveLineGutter: false,
          autocompletion: false,
          closeBrackets: false,
          searchKeymap: false,
          completionKeymap: false,
          lintKeymap: false
        }}
        editable={false}
        readOnly={true}
        indentWithTab={false}
        extensions={extensions}
      />
    </div>
  );
}
