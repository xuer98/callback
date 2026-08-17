// The Python judging harness, shared by the in-browser Pyodide worker
// (run-python.ts) and the Judge0 server path (judge0.ts). It expects a
// global __payload_json (JSON string with code/driverCode/entry/tests),
// defines __run(), and leaves invocation to the embedder:
//   - Pyodide appends `json.dumps(__run())` and reads the expression value
//   - Judge0 appends a marker-prefixed print of the same JSON
//
// Semantics mirror the JavaScript worker: per-case verdicts, deep equality
// (dict keys compared as strings, tuples as lists, integral floats as ints),
// captured stdout as logs, and errors reported per case.
export const PYTHON_HARNESS_BODY = `
import json, time, io, copy, contextlib, traceback

def __norm(x):
    if isinstance(x, bool):
        return x
    if isinstance(x, dict):
        return {str(k): __norm(v) for k, v in x.items()}
    if isinstance(x, (list, tuple)):
        return [__norm(e) for e in x]
    if isinstance(x, float) and x.is_integer():
        return int(x)
    return x

def __display(v):
    try:
        return json.dumps(__norm(v))
    except Exception:
        return repr(v)

def __error_text(e):
    return "".join(traceback.format_exception_only(type(e), e)).strip()

def __run():
    payload = json.loads(__payload_json)
    ns = {}
    try:
        exec(payload["code"], ns)
        if payload.get("driverCode"):
            exec(payload["driverCode"], ns)
        entry = ns.get(payload["entry"])
        if not callable(entry):
            raise Exception(repr(payload["entry"]) + " is not defined as a function")
    except Exception as e:
        return {"status": "error", "message": __error_text(e)}

    verdicts = []
    for i, test in enumerate(payload["tests"]):
        buf = io.StringIO()
        start = time.perf_counter()
        base = {
            "name": test.get("name") or ("Case " + str(i + 1)),
            "input": ", ".join(__display(a) for a in test["input"]),
            "expected": __display(test["expected"]),
        }
        try:
            with contextlib.redirect_stdout(buf):
                got = entry(*copy.deepcopy(test["input"]))
            verdicts.append({
                **base,
                "pass": __norm(got) == __norm(test["expected"]),
                "got": __display(got),
                "timeMs": (time.perf_counter() - start) * 1000,
                "logs": buf.getvalue().splitlines()[:50],
            })
        except Exception as e:
            verdicts.append({
                **base,
                "pass": False,
                "got": "\\u2014",
                "error": __error_text(e),
                "timeMs": (time.perf_counter() - start) * 1000,
                "logs": buf.getvalue().splitlines()[:50],
            })
    return {
        "status": "pass" if all(v["pass"] for v in verdicts) else "fail",
        "verdicts": verdicts,
    }
`;
