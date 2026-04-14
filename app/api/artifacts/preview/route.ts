import { NextResponse } from 'next/server';
import ts from 'typescript';
import { z } from 'zod';

import { auth } from '@/server/auth';

const requestSchema = z.object({
  entryPath: z.string().min(1).max(500),
  files: z
    .array(
      z.object({
        path: z.string().min(1).max(500),
        code: z.string().max(200_000),
        language: z.string().optional()
      })
    )
    .min(1)
    .max(50)
});

const ALLOWED_IMPORTS = new Set(['react', 'react-dom', 'react-dom/client']);

const IMPORT_RE =
  /\bimport\s+[\s\S]*?\s+from\s+['"]([^'"]+)['"]|\bimport\s*['"]([^'"]+)['"]|\brequire\(\s*['"]([^'"]+)['"]\s*\)/g;

const normalizePreviewLanguage = (language?: string) => {
  const normalized = language?.toLowerCase().trim();

  if (!normalized) return 'tsx';
  if (normalized === 'react') return 'tsx';
  return normalized;
};

const looksLikeJsx = (code: string) =>
  /<\s*[A-Za-z][\w:-]*(\s|\/?>)/.test(code) || /<>\s*/.test(code);

const isRelativeImport = (specifier: string) =>
  specifier.startsWith('./') || specifier.startsWith('../');

const isStyleImport = (specifier: string) =>
  /\.css($|\?)/.test(specifier) ||
  /\.scss($|\?)/.test(specifier) ||
  /\.sass($|\?)/.test(specifier);

const validateImports = (code: string) => {
  const unsupported: string[] = [];

  for (const match of code.matchAll(IMPORT_RE)) {
    const specifier = match[1] || match[2] || match[3];
    if (
      specifier &&
      !ALLOWED_IMPORTS.has(specifier) &&
      !isRelativeImport(specifier) &&
      !isStyleImport(specifier)
    ) {
      unsupported.push(specifier);
    }
  }

  return Array.from(new Set(unsupported));
};

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid preview payload' },
      { status: 400 }
    );
  }

  const { entryPath, files } = parsed.data;

  try {
    const compiledFiles: Record<string, string> = {};
    const errors: string[] = [];
    let hasEntry = false;

    for (const file of files) {
      if (file.path === entryPath) {
        hasEntry = true;
      }

      const requestedLanguage = normalizePreviewLanguage(file.language);
      const normalizedLanguage =
        requestedLanguage === 'typescript' && looksLikeJsx(file.code)
          ? 'tsx'
          : requestedLanguage === 'javascript' && looksLikeJsx(file.code)
            ? 'jsx'
            : requestedLanguage;

      if (
        !['tsx', 'jsx', 'typescript', 'javascript'].includes(normalizedLanguage)
      ) {
        continue;
      }

      const unsupportedImports = validateImports(file.code);
      if (unsupportedImports.length > 0) {
        errors.push(
          `${file.path}: Only react imports are supported. Unsupported imports: ${unsupportedImports.join(', ')}`
        );
        continue;
      }

      const output = ts.transpileModule(file.code, {
        compilerOptions: {
          target: ts.ScriptTarget.ES2020,
          module: ts.ModuleKind.CommonJS,
          jsx: ts.JsxEmit.React,
          esModuleInterop: true,
          allowSyntheticDefaultImports: true
        },
        reportDiagnostics: true,
        fileName: file.path
      });

      const fileErrors =
        output.diagnostics
          ?.filter(
            diagnostic => diagnostic.category === ts.DiagnosticCategory.Error
          )
          .map(diagnostic => {
            const message = ts.flattenDiagnosticMessageText(
              diagnostic.messageText,
              '\n'
            );
            return `${file.path}: ${message}`;
          }) ?? [];

      if (fileErrors.length > 0) {
        errors.push(...fileErrors);
        continue;
      }

      compiledFiles[file.path] = output.outputText;
    }

    if (!hasEntry) {
      return NextResponse.json(
        { error: `Entry file not found: ${entryPath}` },
        { status: 400 }
      );
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join('\n\n') }, { status: 400 });
    }

    if (!compiledFiles[entryPath]) {
      return NextResponse.json(
        { error: `Preview does not support ${entryPath}` },
        { status: 400 }
      );
    }

    return NextResponse.json({ entryPath, files: compiledFiles });
  } catch {
    return NextResponse.json(
      { error: 'Failed to compile preview' },
      { status: 500 }
    );
  }
}
