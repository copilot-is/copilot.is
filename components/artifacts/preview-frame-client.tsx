'use client';

import React, { useEffect, useState } from 'react';

type RenderState =
  | {
      status: 'idle';
    }
  | {
      status: 'error';
      message: string;
    }
  | {
      status: 'element';
      element: React.ReactElement;
    }
  | {
      status: 'component';
      component: React.ComponentType;
    };

type PreviewMessage = {
  type: 'artifact-preview-render';
  entryPath: string;
  files: Record<string, string>;
};

const normalizePath = (value: string) => {
  const parts: string[] = [];

  for (const part of value.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') {
      parts.pop();
      continue;
    }
    parts.push(part);
  }

  return `/${parts.join('/')}`;
};

const getDirectoryName = (value: string) => {
  const normalized = normalizePath(value);
  const index = normalized.lastIndexOf('/');
  return index <= 0 ? '/' : normalized.slice(0, index);
};

const resolveImportPath = (
  specifier: string,
  fromPath: string,
  files: Record<string, string>
) => {
  if (specifier.endsWith('.css')) {
    return normalizePath(`${getDirectoryName(fromPath)}/${specifier}`);
  }

  const basePath = normalizePath(`${getDirectoryName(fromPath)}/${specifier}`);
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.jsx`,
    `${basePath}/index.ts`,
    `${basePath}/index.tsx`,
    `${basePath}/index.js`,
    `${basePath}/index.jsx`
  ];

  return candidates.find(candidate => files[candidate]) ?? null;
};

export function ArtifactPreviewFrameClient() {
  const [state, setState] = useState<RenderState>({ status: 'idle' });

  useEffect(() => {
    const handleMessage = (event: MessageEvent<PreviewMessage>) => {
      if (event.data?.type !== 'artifact-preview-render') return;

      try {
        let sideEffectRendered = false;
        const renderElement = (element: React.ReactElement) => {
          sideEffectRendered = true;
          setState({ status: 'element', element });
        };

        const moduleCache = new Map<string, unknown>();

        const executeModule = (modulePath: string): unknown => {
          if (moduleCache.has(modulePath)) {
            return moduleCache.get(modulePath);
          }

          const code = event.data.files[modulePath];
          if (!code) {
            throw new Error(`Module not found: ${modulePath}`);
          }

          const exportsObject: Record<string, unknown> = {};
          const moduleObject: { exports: Record<string, unknown> | unknown } = {
            exports: exportsObject
          };

          const localRequire = (specifier: string) => {
            if (specifier === 'react') {
              return { ...React, default: React };
            }
            if (specifier === 'react-dom') {
              return {
                render(node: React.ReactElement) {
                  renderElement(node);
                }
              };
            }
            if (specifier === 'react-dom/client') {
              return {
                createRoot() {
                  return {
                    render(node: React.ReactElement) {
                      renderElement(node);
                    },
                    unmount() {}
                  };
                }
              };
            }
            if (specifier.startsWith('./') || specifier.startsWith('../')) {
              if (specifier.endsWith('.css')) {
                return {};
              }

              const resolvedPath = resolveImportPath(
                specifier,
                modulePath,
                event.data.files
              );
              if (!resolvedPath) {
                throw new Error(`Unsupported import: ${specifier}`);
              }
              if (resolvedPath.endsWith('.css')) {
                return {};
              }
              return executeModule(resolvedPath);
            }
            throw new Error(`Unsupported import: ${specifier}`);
          };

          const evaluate = new Function(
            'exports',
            'module',
            'require',
            'React',
            `${code}\nreturn module.exports;`
          ) as (
            exports: Record<string, unknown>,
            module: { exports: Record<string, unknown> | unknown },
            require: (specifier: string) => unknown,
            react: typeof React
          ) => unknown;

          const executed = evaluate(
            exportsObject,
            moduleObject,
            localRequire,
            React
          );
          const exported =
            (executed as Record<string, unknown> | undefined) ??
            moduleObject.exports;

          moduleCache.set(modulePath, exported);
          return exported;
        };

        const exported = executeModule(event.data.entryPath) as
          | Record<string, unknown>
          | undefined;

        if (sideEffectRendered) {
          return;
        }

        const component =
          (exported as { default?: unknown }).default ?? exported;

        if (React.isValidElement(component)) {
          setState({ status: 'element', element: component });
          return;
        }

        if (typeof component === 'function') {
          setState({
            status: 'component',
            component: component as React.ComponentType
          });
          return;
        }

        if (!sideEffectRendered) {
          throw new Error(
            'Preview code must export a React component or JSX element as default.'
          );
        }
      } catch (error) {
        setState({
          status: 'error',
          message:
            error instanceof Error ? error.message : 'Failed to render preview'
        });
      }
    };

    window.addEventListener('message', handleMessage);
    window.parent.postMessage({ type: 'artifact-preview-frame-ready' }, '*');

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  if (state.status === 'error') {
    return (
      <div className="min-h-screen bg-white p-4 text-red-700">
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <pre className="whitespace-pre-wrap break-words text-xs">
            {state.message}
          </pre>
        </div>
      </div>
    );
  }

  if (state.status === 'element') {
    return (
      <div className="min-h-screen bg-white p-4 text-slate-900">
        {state.element}
      </div>
    );
  }

  if (state.status === 'component') {
    const Component = state.component;
    return (
      <div className="min-h-screen bg-white p-4 text-slate-900">
        <Component />
      </div>
    );
  }

  return <div className="min-h-screen bg-white p-4" />;
}
