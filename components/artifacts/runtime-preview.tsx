'use client';

import {
  startTransition,
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState
} from 'react';
import { AlertCircle, LoaderCircle } from 'lucide-react';

import { Artifact } from '@/types';
import { normalizeCodeLanguage } from '@/lib/code-language';
import { MessageMarkdown } from '@/components/message-markdown';

type PreviewStatus = 'idle' | 'loading' | 'ready' | 'error';

type PreviewFile = {
  path: string;
  code: string;
  language?: string;
};

type PreviewRuntimeResponse = {
  entryPath?: string;
  files?: Record<string, string>;
  error?: string;
};

const isPreviewableCodeLanguage = (artifact: Artifact) => {
  const normalized = normalizeCodeLanguage(artifact.language);
  const rawLanguage = artifact.language?.toLowerCase().trim();

  return (
    normalized === 'tsx' ||
    normalized === 'jsx' ||
    normalized === 'typescript' ||
    normalized === 'javascript' ||
    rawLanguage === 'react'
  );
};

const isHtmlLikeArtifact = (artifact: Artifact) => {
  if (artifact.type === 'html') return true;
  if (
    artifact.type === 'code' &&
    normalizeCodeLanguage(artifact.language) === 'svg'
  ) {
    return true;
  }
  return (
    artifact.type === 'code' &&
    normalizeCodeLanguage(artifact.language) === 'html'
  );
};

const StatusPanel = ({
  status,
  error
}: {
  status: PreviewStatus;
  error: string | null;
}) => {
  if (status === 'loading') {
    return (
      <div className="flex h-full min-h-48 items-center justify-center text-sm text-muted-foreground">
        <LoaderCircle className="mr-2 size-4 animate-spin" />
        Building preview...
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        <div className="mb-2 flex items-center gap-2 font-medium">
          <AlertCircle className="size-4" />
          Preview failed
        </div>
        <pre className="font-mono text-xs wrap-break-word whitespace-pre-wrap">
          {error}
        </pre>
      </div>
    );
  }

  return null;
};

function sanitizePathSegment(value: string) {
  return value
    .trim()
    .replace(/\\/g, '/')
    .split('/')
    .filter(Boolean)
    .join('/')
    .replace(/[^A-Za-z0-9._/-]/g, '-');
}

function looksLikeJsx(code: string) {
  return /<\s*[A-Za-z][\w:-]*(\s|\/?>)/.test(code) || /<>\s*/.test(code);
}

function getArtifactFileExtension(artifact: Artifact) {
  const normalized = normalizeCodeLanguage(artifact.language);
  const rawLanguage = artifact.language?.toLowerCase().trim();
  const content = artifact.content ?? '';

  if (artifact.fileName?.includes('.')) {
    return artifact.fileName.split('.').pop() ?? 'tsx';
  }

  if (rawLanguage === 'react') return 'tsx';
  if (normalized === 'typescript') return looksLikeJsx(content) ? 'tsx' : 'ts';
  if (normalized === 'javascript') return looksLikeJsx(content) ? 'jsx' : 'js';
  if (normalized === 'tsx' || normalized === 'jsx') return normalized;
  if (normalized) return normalized;
  return 'tsx';
}

function hasPathExtension(value: string) {
  const lastSegment = value.split('/').pop() ?? value;
  return /\.[A-Za-z0-9]+$/.test(lastSegment);
}

function extractLeadingFileName(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(
    /^([A-Za-z0-9_-][A-Za-z0-9._/-]*\.(?:tsx|ts|jsx|js|css|html|json|md))(?=$|\s|[-:])/
  );
  return match?.[1] ?? null;
}

function extractDefaultExportName(code: string) {
  const patterns = [
    /export\s+default\s+function\s+([A-Z]\w*)/,
    /export\s+default\s+class\s+([A-Z]\w*)/,
    /const\s+([A-Z]\w*)\s*=.*?[\r\n]+\s*export\s+default\s+\1/s,
    /function\s+([A-Z]\w*)\s*\([\s\S]*?[\r\n]+\s*export\s+default\s+\1/s
  ];

  for (const pattern of patterns) {
    const match = code.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

function getArtifactVirtualPath(artifact: Artifact) {
  const candidate = sanitizePathSegment(
    artifact.fileName ||
      extractLeadingFileName(artifact.title) ||
      artifact.title ||
      artifact.id
  );
  const extension = getArtifactFileExtension(artifact);

  if (hasPathExtension(candidate)) {
    return candidate.startsWith('/') ? candidate : `/${candidate}`;
  }

  return `/${candidate || artifact.id}.${extension}`;
}

function getArtifactVirtualPaths(artifact: Artifact) {
  const extension = getArtifactFileExtension(artifact);
  const paths = new Set<string>([getArtifactVirtualPath(artifact)]);
  const exportName = extractDefaultExportName(artifact.content ?? '');

  if (exportName) {
    paths.add(`/${exportName}.${extension}`);
  }

  return Array.from(paths);
}

function buildPreviewFiles(
  artifact: Artifact,
  artifacts: Artifact[]
): PreviewFile[] {
  const mergedArtifacts = new Map(
    artifacts
      .filter(item => item.type === 'code' && item.content)
      .map(item => [item.id, item] as const)
  );

  if (artifact.type === 'code' && artifact.content) {
    mergedArtifacts.set(artifact.id, artifact);
  }

  return Array.from(mergedArtifacts.values()).flatMap(item => {
    const content =
      item.id === artifact.id ? (artifact.content ?? '') : (item.content ?? '');

    return getArtifactVirtualPaths({
      ...item,
      content
    }).map(path => ({
      path,
      code: content,
      language: item.language ?? undefined
    }));
  });
}

function ReactArtifactPreview({
  artifact,
  artifacts
}: {
  artifact: Artifact;
  artifacts: Artifact[];
}) {
  const deferredContent = useDeferredValue(artifact.content ?? '');
  const [status, setStatus] = useState<PreviewStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [compiledFiles, setCompiledFiles] = useState<Record<
    string,
    string
  > | null>(null);
  const [entryPath, setEntryPath] = useState<string | null>(null);
  const iframeTitle = useId();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [frameReady, setFrameReady] = useState(false);
  const previewFiles = useMemo(
    () =>
      buildPreviewFiles(
        {
          ...artifact,
          content: deferredContent
        },
        artifacts
      ),
    [artifact, artifacts, deferredContent]
  );
  const currentEntryPath = useMemo(
    () => getArtifactVirtualPath(artifact),
    [artifact]
  );

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void run();
    }, 250);

    const run = async () => {
      if (!deferredContent.trim()) {
        startTransition(() => {
          setStatus('idle');
          setError(null);
          setCompiledFiles(null);
          setEntryPath(null);
        });
        return;
      }

      startTransition(() => {
        setStatus('loading');
        setError(null);
      });

      const response = await fetch('/api/artifacts/preview', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          entryPath: currentEntryPath,
          files: previewFiles
        })
      });

      const result = (await response
        .json()
        .catch(() => null)) as PreviewRuntimeResponse | null;

      if (cancelled) return;

      if (!response.ok || !result?.files || !result?.entryPath) {
        startTransition(() => {
          setStatus('error');
          setError(result?.error ?? 'Failed to build preview');
          setCompiledFiles(null);
          setEntryPath(null);
        });
        return;
      }

      startTransition(() => {
        setStatus('ready');
        setError(null);
        setCompiledFiles(result.files ?? null);
        setEntryPath(result.entryPath ?? null);
      });
    };

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [currentEntryPath, deferredContent, previewFiles]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<{ type?: string }>) => {
      if (event.data?.type !== 'artifact-preview-frame-ready') return;
      if (event.source !== iframeRef.current?.contentWindow) return;
      setFrameReady(true);
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  useEffect(() => {
    if (!frameReady) return;
    if (!compiledFiles || !entryPath) return;

    iframeRef.current?.contentWindow?.postMessage(
      {
        type: 'artifact-preview-render',
        entryPath,
        files: compiledFiles
      },
      '*'
    );
  }, [compiledFiles, entryPath, frameReady]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {status !== 'ready' && <StatusPanel status={status} error={error} />}
      {status === 'ready' && compiledFiles && entryPath ? (
        <iframe
          ref={iframeRef}
          title={`artifact-react-preview-${iframeTitle}`}
          sandbox="allow-scripts"
          className="size-full min-h-0 bg-white"
          src="/artifact-preview-frame"
          onLoad={() => setFrameReady(false)}
        />
      ) : null}
    </div>
  );
}

export function supportsArtifactRuntimePreview(artifact: Artifact) {
  if (isHtmlLikeArtifact(artifact)) return true;
  if (artifact.type === 'markdown') return true;
  if (artifact.type === 'code' && isPreviewableCodeLanguage(artifact)) {
    return true;
  }
  return false;
}

export function getArtifactPreviewModeDefault(artifact: Artifact) {
  if (artifact.status === 'streaming') {
    return 'source' as const;
  }
  if (isHtmlLikeArtifact(artifact)) {
    return 'preview' as const;
  }
  if (artifact.type === 'code' && isPreviewableCodeLanguage(artifact)) {
    return 'preview' as const;
  }
  if (artifact.type === 'markdown') {
    return 'preview' as const;
  }
  return 'source' as const;
}

export function ArtifactRuntimePreview({
  artifact,
  artifacts = []
}: {
  artifact: Artifact;
  artifacts?: Artifact[];
}) {
  const iframeTitle = useId();
  const htmlSource = useMemo(() => artifact.content ?? '', [artifact.content]);

  if (artifact.type === 'markdown') {
    return (
      <div className="h-full overflow-auto rounded-md border bg-background p-4">
        <MessageMarkdown content={artifact.content ?? ''} />
      </div>
    );
  }

  if (isHtmlLikeArtifact(artifact)) {
    return (
      <iframe
        title={`artifact-preview-${iframeTitle}`}
        sandbox="allow-scripts"
        className="size-full min-h-0 bg-white"
        srcDoc={htmlSource}
      />
    );
  }

  if (artifact.type === 'code' && isPreviewableCodeLanguage(artifact)) {
    return <ReactArtifactPreview artifact={artifact} artifacts={artifacts} />;
  }

  return (
    <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
      Preview is not available for this artifact.
    </div>
  );
}
