import { PYTHON_HARNESS_BODY } from "./python-harness";
import type { RunResult } from "./run-judge";
import type { Judge } from "./types";

// In-browser Python: Pyodide (CPython compiled to WASM) inside a Web
// Worker. The worker persists across runs so the runtime downloads once;
// a timed-out run terminates the worker (fresh boot next time).

const PYODIDE_VERSION = "0.26.4";
const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
const RUN_LIMIT_MS = 15_000;
const BOOT_LIMIT_MS = 90_000;

const WORKER_SOURCE = [
  `importScripts(${JSON.stringify(PYODIDE_CDN + "pyodide.js")});`,
  `const pyodidePromise = loadPyodide({ indexURL: ${JSON.stringify(PYODIDE_CDN)} });`,
  `const HARNESS = ${JSON.stringify(PYTHON_HARNESS_BODY + "\njson.dumps(__run())")};`,
  `self.onmessage = async (event) => {
  const { id, payload } = event.data;
  try {
    const pyodide = await pyodidePromise;
    pyodide.globals.set("__payload_json", JSON.stringify(payload));
    const out = pyodide.runPython(HARNESS);
    self.postMessage({ id, result: JSON.parse(out) });
  } catch (err) {
    self.postMessage({
      id,
      result: {
        status: "error",
        message: String((err && err.message) || err),
      },
    });
  }
};`,
].join("\n");

let worker: Worker | null = null;
let workerUrl: string | null = null;
let booted = false;
let nextId = 1;
const pending = new Map<number, (result: RunResult) => void>();

function destroyWorker() {
  worker?.terminate();
  if (workerUrl) URL.revokeObjectURL(workerUrl);
  worker = null;
  workerUrl = null;
  booted = false;
}

function ensureWorker(): Worker {
  if (worker) return worker;
  workerUrl = URL.createObjectURL(
    new Blob([WORKER_SOURCE], { type: "text/javascript" }),
  );
  worker = new Worker(workerUrl);
  worker.onmessage = (event) => {
    booted = true;
    const { id, result } = event.data as { id: number; result: RunResult };
    pending.get(id)?.(result);
    pending.delete(id);
  };
  worker.onerror = (event) => {
    const message = event.message || "The Python runtime failed to load.";
    for (const resolve of pending.values()) {
      resolve({ status: "error", message });
    }
    pending.clear();
    destroyWorker();
  };
  return worker;
}

/** True once the Python runtime has finished its first load. */
export function isPythonReady(): boolean {
  return booted;
}

export function runPythonJudge(code: string, judge: Judge): Promise<RunResult> {
  const python = judge.python;
  if (!python) {
    return Promise.resolve({
      status: "error",
      message: "This problem has no Python judge yet.",
    });
  }
  return new Promise((resolve) => {
    const w = ensureWorker();
    const id = nextId++;
    const coldBoot = !booted;
    const timer = setTimeout(
      () => {
        pending.delete(id);
        destroyWorker();
        resolve({
          status: "timeout",
          message: coldBoot
            ? "The Python runtime took too long to load. Check your connection and try again."
            : `Time limit exceeded (${RUN_LIMIT_MS / 1000}s). Check for an infinite loop.`,
        });
      },
      coldBoot ? BOOT_LIMIT_MS : RUN_LIMIT_MS,
    );
    pending.set(id, (result) => {
      clearTimeout(timer);
      resolve(result);
    });
    w.postMessage({
      id,
      payload: {
        code,
        driverCode: python.driverCode ?? "",
        entry: python.entry,
        tests: judge.tests,
      },
    });
  });
}
