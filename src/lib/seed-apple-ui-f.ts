import type { Problem, UiFile, UiWorkspace } from "./types";

// Apple front-end bank, UI part F: a six-digit verification-code input with
// Submit and Reset. React is the default template and HTML/CSS/JS the
// alternate;
// the verification endpoint is a local stand-in, since the preview has no
// network.

const codeApi: UiFile = {
  name: "api.js",
  contents: `// A stand-in for the verification endpoint: the preview has no network.
// "123456" is the right code; anything else fails.
export function verifyCode(code) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (code === "123456") resolve(true);
      else reject(new Error("That code didn't work. Try again."));
    }, 800);
  });
}
`,
};

const codeCss: UiFile = {
  name: "styles.css",
  contents: `body {
  margin: 0;
  font-family: system-ui, sans-serif;
  color: #18181b;
}

.code-form {
  padding: 16px;
}

.code-form fieldset {
  margin: 0;
  padding: 0;
  border: 0;
}

.code-form legend {
  margin-bottom: 8px;
  font-weight: 600;
}

.digits {
  display: flex;
  gap: 8px;
}

.digit {
  width: 2.4em;
  height: 2.8em;
  border: 1px solid #d4d4d8;
  border-radius: 8px;
  font: 600 20px system-ui, sans-serif;
  text-align: center;
}

.digit:focus {
  border-color: #2563eb;
  outline: 2px solid #bfdbfe;
}

.actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

button {
  padding: 6px 14px;
  border: 1px solid #d4d4d8;
  border-radius: 8px;
  background: #fff;
  font: inherit;
  cursor: pointer;
}

button[type="submit"] {
  border-color: #2563eb;
  background: #2563eb;
  color: #fff;
}

button:disabled,
.digit:disabled {
  opacity: 0.6;
  cursor: default;
}

.message {
  min-height: 1.4em;
  margin: 10px 0 0;
  font-size: 14px;
}

.message[data-status="error"] {
  color: #dc2626;
}

.message[data-status="verified"] {
  color: #16a34a;
}
`,
};

// -- React --------------------------------------------------------------------------

const codeReactStarter = `import { useState } from "react";
import { verifyCode } from "./api.js";

const LENGTH = 6;

// Your code here: advance on entry, Backspace back, arrow keys, paste a
// whole code, enable Submit only when all six are filled, disable
// everything while verifyCode is in flight, and Reset.
export default function App() {
  const [digits, setDigits] = useState(() => Array(LENGTH).fill(""));
  const setDigit = (i, value) => setDigits(digits.map((d, j) => (j === i ? value : d)));

  return (
    <form className="code-form" onSubmit={(e) => e.preventDefault()}>
      <fieldset>
        <legend>Verification code</legend>
        <div className="digits">
          {digits.map((digit, i) => (
            <input key={i} className="digit" value={digit} onChange={(e) => setDigit(i, e.target.value)} />
          ))}
        </div>
      </fieldset>
      <div className="actions">
        <button type="submit">Submit</button>
        <button type="button">Reset</button>
      </div>
    </form>
  );
}
`;

const codeReactSolution = `import { useEffect, useRef, useState } from "react";
import { verifyCode } from "./api.js";

const LENGTH = 6;
const empty = () => Array(LENGTH).fill("");

export default function App() {
  const [digits, setDigits] = useState(empty);
  const [status, setStatus] = useState("idle"); // idle | checking | verified | error
  const [message, setMessage] = useState("");
  const inputs = useRef([]);
  const pendingFocus = useRef(null);
  const busy = status === "checking";
  const locked = busy || status === "verified";
  const complete = digits.every((d) => d !== "");

  const focus = (i) => inputs.current[Math.max(0, Math.min(LENGTH - 1, i))]?.focus();
  const setDigit = (i, value) => setDigits((prev) => prev.map((d, j) => (j === i ? value : d)));

  // Focus requested during an update waits for the render: until then, the
  // fields may still be disabled, and a disabled field can't take focus.
  useEffect(() => {
    if (pendingFocus.current !== null) {
      focus(pendingFocus.current);
      pendingFocus.current = null;
    }
  });

  const onChange = (i, event) => {
    const typed = event.target.value.replace(/\\D/g, ""); // digits only
    if (typed === "") {
      setDigit(i, "");
      return;
    }
    setDigit(i, typed[typed.length - 1]); // the newest digit wins
    focus(i + 1);
  };

  const onKeyDown = (i, event) => {
    if (event.key === "Backspace" && digits[i] === "" && i > 0) {
      event.preventDefault(); // an empty field steps back and clears the previous one
      setDigit(i - 1, "");
      focus(i - 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focus(i - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      focus(i + 1);
    }
  };

  // A pasted code fills every field from the start, whichever field has focus.
  const onPaste = (event) => {
    const pasted = event.clipboardData.getData("text").replace(/\\D/g, "").slice(0, LENGTH);
    if (pasted === "") return;
    event.preventDefault();
    setDigits(Array.from({ length: LENGTH }, (_, j) => pasted[j] ?? ""));
    focus(pasted.length === LENGTH ? LENGTH - 1 : pasted.length);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!complete || locked) return;
    setStatus("checking");
    setMessage("Checking…");
    try {
      await verifyCode(digits.join(""));
      setStatus("verified");
      setMessage("Verified.");
    } catch (err) {
      setStatus("error");
      setMessage(err.message);
    }
  };

  const reset = () => {
    setDigits(empty());
    setStatus("idle");
    setMessage("");
    pendingFocus.current = 0; // after the render re-enables the fields
  };

  return (
    <form className="code-form" onSubmit={submit}>
      <fieldset disabled={locked}>
        <legend>Verification code</legend>
        <div className="digits">
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputs.current[i] = el;
              }}
              className="digit"
              value={digit}
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              aria-label={"Digit " + (i + 1) + " of " + LENGTH}
              onChange={(e) => onChange(i, e)}
              onKeyDown={(e) => onKeyDown(i, e)}
              onPaste={onPaste}
              onFocus={(e) => e.target.select()}
            />
          ))}
        </div>
      </fieldset>
      <div className="actions">
        <button type="submit" disabled={!complete || locked}>
          {busy ? "Checking…" : "Submit"}
        </button>
        <button type="button" onClick={reset} disabled={busy}>
          Reset
        </button>
      </div>
      <p className="message" data-status={status} role="status">
        {message}
      </p>
    </form>
  );
}
`;

// -- HTML/CSS/JS ------------------------------------------------------------------

const codeHtml: UiFile = {
  name: "index.html",
  contents: `<form class="code-form" id="code-form">
  <fieldset id="code-fields">
    <legend>Verification code</legend>
    <div class="digits" id="digits"></div>
  </fieldset>
  <div class="actions">
    <button type="submit" id="submit">Submit</button>
    <button type="button" id="reset">Reset</button>
  </div>
  <p class="message" id="message" role="status"></p>
</form>
`,
};

const codeVanillaStarter = `import { verifyCode } from "./api.js";

const LENGTH = 6;
const digitsEl = document.getElementById("digits");

// Your code here: advance on entry, Backspace back, arrow keys, paste a
// whole code, enable Submit only when all six are filled, disable
// everything while verifyCode is in flight, and Reset.
for (let i = 0; i < LENGTH; i++) {
  const input = document.createElement("input");
  input.className = "digit";
  digitsEl.append(input);
}
`;

const codeVanillaSolution = `import { verifyCode } from "./api.js";

const LENGTH = 6;
const form = document.getElementById("code-form");
const fields = document.getElementById("code-fields");
const digitsEl = document.getElementById("digits");
const submitButton = document.getElementById("submit");
const resetButton = document.getElementById("reset");
const message = document.getElementById("message");

const inputs = [];
for (let i = 0; i < LENGTH; i++) {
  const input = document.createElement("input");
  input.className = "digit";
  input.inputMode = "numeric";
  input.autocomplete = i === 0 ? "one-time-code" : "off";
  input.setAttribute("aria-label", "Digit " + (i + 1) + " of " + LENGTH);
  inputs.push(input);
}
digitsEl.append(...inputs);

let status = "idle"; // idle | checking | verified | error
const focus = (i) => inputs[Math.max(0, Math.min(LENGTH - 1, i))].focus();
const code = () => inputs.map((input) => input.value).join("");

function sync() {
  const locked = status === "checking" || status === "verified";
  fields.disabled = locked;
  submitButton.disabled = locked || code().length !== LENGTH;
  submitButton.textContent = status === "checking" ? "Checking…" : "Submit";
  resetButton.disabled = status === "checking";
  message.dataset.status = status;
}

// Delegated on the row: every field shares one set of listeners.
digitsEl.addEventListener("input", (event) => {
  const i = inputs.indexOf(event.target);
  const typed = event.target.value.replace(/\\D/g, ""); // digits only
  event.target.value = typed === "" ? "" : typed[typed.length - 1]; // the newest digit wins
  if (typed !== "") focus(i + 1);
  sync();
});

digitsEl.addEventListener("keydown", (event) => {
  const i = inputs.indexOf(event.target);
  if (event.key === "Backspace" && event.target.value === "" && i > 0) {
    event.preventDefault(); // an empty field steps back and clears the previous one
    inputs[i - 1].value = "";
    focus(i - 1);
    sync();
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    focus(i - 1);
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    focus(i + 1);
  }
});

// A pasted code fills every field from the start, whichever field has focus.
digitsEl.addEventListener("paste", (event) => {
  const pasted = event.clipboardData.getData("text").replace(/\\D/g, "").slice(0, LENGTH);
  if (pasted === "") return;
  event.preventDefault();
  inputs.forEach((input, j) => {
    input.value = pasted[j] ?? "";
  });
  focus(pasted.length === LENGTH ? LENGTH - 1 : pasted.length);
  sync();
});

digitsEl.addEventListener("focusin", (event) => event.target.select());

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (code().length !== LENGTH || status === "checking" || status === "verified") return;
  status = "checking";
  message.textContent = "Checking…";
  sync();
  try {
    await verifyCode(code());
    status = "verified";
    message.textContent = "Verified.";
  } catch (err) {
    status = "error";
    message.textContent = err.message;
  }
  sync();
});

resetButton.addEventListener("click", () => {
  inputs.forEach((input) => {
    input.value = "";
  });
  status = "idle";
  message.textContent = "";
  sync();
  focus(0);
});

sync();
`;

const codeUi: UiWorkspace = {
  framework: "react",
  files: [{ name: "App.jsx", contents: codeReactStarter }, codeApi, codeCss],
  solution: [{ name: "App.jsx", contents: codeReactSolution }, codeApi, codeCss],
  alternate: {
    framework: "vanilla",
    files: [codeHtml, { name: "code-input.js", contents: codeVanillaStarter }, codeApi, codeCss],
    solution: [codeHtml, { name: "code-input.js", contents: codeVanillaSolution }, codeApi, codeCss],
  },
};

export const appleUiProblemsF: Problem[] = [
  {
    slug: "auth-code-input",
    title: "Six-Digit Code Input",
    category: "frontend",
    difficulty: "medium",
    companies: ["apple"],
    summary:
      "Six one-digit fields that feel like one: advance on entry, Backspace back, paste the whole code, lock while verifying.",
    prompt: [
      "Build a verification-code input: six single-digit fields with Submit and Reset. The default template is React, and an HTML/CSS/JS template is the alternate.",
      "",
      "## Requirements",
      "",
      "- Each field takes one digit, and anything else is ignored. Typing a digit moves focus to the next field.",
      "- **Backspace** in an empty field steps back to the previous field and clears it. In a filled field, it clears that digit.",
      "- **ArrowLeft** and **ArrowRight** move between fields.",
      "- **Pasting** a whole code into any field fills all six from the start, ignoring spaces and dashes.",
      "- Submit is enabled only when all six fields are filled. It calls `verifyCode(code)` from `api.js`, where `123456` is correct.",
      "- **While the request is in flight, everything is disabled.** Show the result: a success message, or the error, with the fields editable again.",
      "- Reset clears everything and puts focus back on the first field.",
      "- Label each field, such as \"Digit 1 of 6\", and use `inputMode=\"numeric\"`, plus `autocomplete=\"one-time-code\"` on the first field.",
    ].join("\n"),
    hints: [
      "Keep the six digits as one array in state, and the input elements in a ref array so you can call `.focus()` on a neighbor.",
      "Handle `paste` yourself: read `event.clipboardData.getData(\"text\")`, keep the digits, fill from the first field, and `preventDefault` so the browser doesn't insert the raw text.",
      "Select a field's contents on focus. Typing then replaces the digit, and the newest digit wins wherever the caret was.",
    ],
    solution: [
      "## Approach",
      "",
      "The six fields are views of one array of digits. `onChange` keeps only the newest digit and moves focus forward. `onKeyDown` handles Backspace on an empty field and the arrow keys. A paste handler on every field distributes a pasted code across all of them. Submit is gated on a complete code, and a `<fieldset disabled>` locks every field at once while `verifyCode` runs. The HTML/CSS/JS version keeps the same behavior with delegated listeners on the row of inputs.",
      "",
      "## Worth saying out loud",
      "",
      "- **Paste is the probe people miss.** Browsers deliver it as one event into one field, so it has to be spread across six by hand.",
      "- `inputMode=\"numeric\"` brings up the number pad on phones without `type=\"number\"`'s spinner and scroll-wheel quirks. `autocomplete=\"one-time-code\"` lets the platform offer the code from a text message.",
      "- Disabling during the request prevents double submission. Say you'd also rate-limit attempts on the server.",
      "- In React, focusing a field right after `setState` runs before the re-render, while the field may still be disabled, and the browser ignores it. Request the focus and apply it in an effect after the render.",
      "- A single hidden input with six visual boxes is the other design. It gets paste and autofill for free, at the cost of drawing the caret yourself.",
    ].join("\n"),
    ui: codeUi,
  },
];
