// TypeScript support is type-stripping, not type-checking: the annotations
// come off and the result runs through the JavaScript judge unchanged. That
// keeps semantics identical to JS in both the browser worker and Judge0,
// and means TypeScript works even where no TS runtime exists.
//
// Sucrase is loaded on demand so the ~0.5 MB transform never lands in the
// bundle for people writing other languages.

export type TranspileResult =
  | { ok: true; code: string }
  | { ok: false; message: string };

export async function transpileTypeScript(
  source: string,
): Promise<TranspileResult> {
  try {
    const { transform } = await import("sucrase");
    const { code } = transform(source, {
      transforms: ["typescript"],
      // The judge wraps code in `new Function`, so keep it script-shaped.
      disableESTransforms: true,
    });
    return { ok: true, code };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : String(err),
    };
  }
}
