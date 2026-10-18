import type { Problem, UiFile } from "./types";

// The UI-cheatsheet track, part A: the checklist itself as a discussion
// question, and the sign-up form that exercises its HTML and forms sections
// in HTML/CSS/JS, with complete reference files.

const signupCss: UiFile = {
  name: "styles.css",
  contents: `body {
  margin: 0;
  font-family: system-ui, sans-serif;
  color: #18181b;
  background: #f4f4f5;
}

.page {
  padding: 16px;
}

.signup {
  max-width: 360px;
  margin: 0 auto;
  padding: 20px;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.signup__title {
  margin: 0 0 16px;
  font-size: 20px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}

.field label {
  font-size: 14px;
  font-weight: 500;
}

.field input {
  padding: 8px 10px;
  border: 1px solid #a1a1aa;
  border-radius: 6px;
  font: inherit;
}

.field input:focus-visible {
  outline: 2px solid #4f46e5;
  outline-offset: 2px;
}

.field input[aria-invalid="true"] {
  border-color: #dc2626;
}

.field__error {
  min-height: 18px;
  margin: 0;
  font-size: 13px;
  color: #b91c1c;
}

.signup__submit {
  width: 100%;
  min-height: 44px;
  border: 0;
  border-radius: 6px;
  background: #4f46e5;
  color: #ffffff;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.signup__submit:focus-visible {
  outline: 2px solid #4f46e5;
  outline-offset: 2px;
}

.signup__submit:disabled {
  opacity: 0.6;
  cursor: progress;
}

.signup__status {
  min-height: 20px;
  margin: 12px 0 0;
  font-size: 14px;
}

.signup__status--ok {
  color: #15803d;
}

.signup__status--error {
  color: #b91c1c;
}
`,
};

const signupHtmlStarter = `<main class="page">
  <form class="signup">
    <h1 class="signup__title">Create your account</h1>

    <div class="field">
      <label>Username</label>
      <input />
    </div>

    <div class="field">
      <label>Email</label>
      <input />
    </div>

    <div class="field">
      <label>Password</label>
      <input />
    </div>

    <div class="field">
      <label>Confirm password</label>
      <input />
    </div>

    <button class="signup__submit">Sign Up</button>
    <p class="signup__status"></p>
  </form>
</main>
`;

const signupHtmlSolution = `<main class="page">
  <form class="signup" novalidate>
    <h1 class="signup__title">Create your account</h1>

    <div class="field">
      <label for="username">Username</label>
      <input
        id="username"
        name="username"
        type="text"
        autocomplete="username"
        required
        minlength="4"
        pattern="[A-Za-z0-9]+"
        aria-describedby="username-error"
      />
      <p id="username-error" class="field__error"></p>
    </div>

    <div class="field">
      <label for="email">Email</label>
      <input
        id="email"
        name="email"
        type="email"
        autocomplete="email"
        required
        aria-describedby="email-error"
      />
      <p id="email-error" class="field__error"></p>
    </div>

    <div class="field">
      <label for="password">Password</label>
      <input
        id="password"
        name="password"
        type="password"
        autocomplete="new-password"
        required
        minlength="6"
        aria-describedby="password-error"
      />
      <p id="password-error" class="field__error"></p>
    </div>

    <div class="field">
      <label for="confirm">Confirm password</label>
      <input
        id="confirm"
        name="confirm"
        type="password"
        autocomplete="new-password"
        required
        aria-describedby="confirm-error"
      />
      <p id="confirm-error" class="field__error"></p>
    </div>

    <button type="submit" class="signup__submit">Sign Up</button>
    <p class="signup__status" role="status"></p>
  </form>
</main>
`;

const signupApi = `// Provided: a stand-in for the sign-up endpoint. It re-checks every rule the
// form should enforce, refuses a few taken usernames, and takes a moment.
const TAKEN = new Set(["admin", "root", "test"]);

function submitForm(values) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const emailOk = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(values.email);
      if (TAKEN.has(values.username.toLowerCase())) {
        reject(new Error("That username is taken."));
      } else if (
        !/^[A-Za-z0-9]{4,}$/.test(values.username) ||
        !emailOk ||
        values.password.length < 6 ||
        values.password !== values.confirm
      ) {
        reject(new Error("The server rejected the form. Check the fields and try again."));
      } else {
        resolve({ message: "Account created. Welcome, " + values.username + "!" });
      }
    }, 600 + Math.random() * 600);
  });
}
`;

const signupScriptStarter =
  signupApi +
  `
// TODO: wire labels, types and native validation attributes in index.html;
// validate each field (the attributes first, then the rule HTML can't state),
// show one message per field, and submit through submitForm.
`;

const signupScriptSolution =
  signupApi +
  `
const form = document.querySelector(".signup");
const status = form.querySelector(".signup__status");
const submit = form.querySelector(".signup__submit");
const fields = ["username", "email", "password", "confirm"].map((name) => ({
  name,
  input: form.elements[name],
  error: document.getElementById(name + "-error"),
  touched: false,
}));

// One message per field: the first failing rule, read off the validity the
// HTML attributes already computed, plus the one rule HTML cannot express.
function messageFor(field) {
  const { validity, value } = field.input;
  if (validity.valueMissing) return "This field is required.";
  if (field.name === "username") {
    if (validity.tooShort) return "Use at least 4 characters.";
    if (validity.patternMismatch) return "Letters and digits only.";
  }
  if (field.name === "email" && validity.typeMismatch) {
    return "Enter an address like name@example.com.";
  }
  if (field.name === "password" && validity.tooShort) {
    return "Use at least 6 characters.";
  }
  if (field.name === "confirm" && value !== form.elements.password.value) {
    return "The passwords don't match.";
  }
  return "";
}

// Text, aria-invalid and the custom validity move together, so :invalid and
// form.checkValidity() agree with what the user sees.
function show(field) {
  const message = messageFor(field);
  field.input.setCustomValidity(message);
  field.input.setAttribute("aria-invalid", message ? "true" : "false");
  field.error.textContent = message;
  return message === "";
}

function clear(field) {
  field.touched = false;
  field.input.setCustomValidity("");
  field.input.removeAttribute("aria-invalid");
  field.error.textContent = "";
}

function setStatus(text, kind) {
  status.textContent = text;
  status.className = "signup__status" + (kind ? " signup__status--" + kind : "");
}

const confirm = fields[3];
for (const field of fields) {
  // Quiet while a fresh field is being typed; strict once it has been left.
  field.input.addEventListener("blur", () => {
    field.touched = true;
    show(field);
  });
  field.input.addEventListener("input", () => {
    if (field.touched) show(field);
    // A match can break from either side.
    if (field.name === "password" && confirm.touched) show(confirm);
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault(); // the request goes through submitForm, not a page load
  const valid = fields.map((field) => {
    field.touched = true;
    return show(field);
  });
  const firstInvalid = fields[valid.indexOf(false)];
  if (firstInvalid) {
    firstInvalid.input.focus();
    return;
  }

  setStatus("", "");
  submit.disabled = true; // one request per submit
  try {
    const { message } = await submitForm(Object.fromEntries(new FormData(form)));
    form.reset();
    fields.forEach(clear);
    setStatus(message, "ok");
  } catch (err) {
    setStatus(err.message, "error");
  } finally {
    submit.disabled = false;
  }
});
`;

export const uiCheatsheetProblemsA: Problem[] = [
  {
    slug: "ui-question-checklist",
    title: "What Do You Check Before Calling a UI Component Done?",
    category: "frontend",
    difficulty: "medium",
    companies: [],
    summary:
      "The review you run on your own build: instances, state, HTML, forms, network, keyboard, edge cases, strings.",
    prompt: [
      "You have just finished a UI coding question — a tabs component, say, or a like button — and there are ten minutes left. What do you check before you say it is done?",
      "",
      "Talk for about three minutes: the checklist in the order you would actually run it, and for each item, what the fix looks like when it fails.",
    ].join("\n"),
    hints: [
      "Start from what the interviewer will do next: open a second instance, press Tab, type a long name, pull the network. Each of those is a section of the list.",
      "Order it from cheapest to check to most expensive: labels and `<button>`s take seconds; network states and keyboard flows take minutes.",
    ],
    solution: [
      "## The checklist",
      "",
      "**Instances.** Can two live on one page? No ids baked into the markup, no module-level state, options in (labels, callbacks, defaults) and a small API out. In plain JavaScript that is `init(root, options)`; in React it is props and `useId`. → [Tabs: initTabs(node)](/problems/tabs-init-node)",
      "",
      "**State.** List the state fields and strike every one you can compute from the others: the selected index, not a boolean per tab; the leaves, not every parent. When several fields change together, one reducer. → [Nested Checkboxes](/problems/nested-checkboxes), [Multi-Step Form With a Shared Store](/problems/multi-step-form)",
      "",
      "**HTML.** A `<button>` for anything clickable, a `<form>` around inputs so Enter submits, a `<label>` wired to every input by `for`, the right `type` (`email`, `number`, `search`), headings in order with one `h1`. A click handler on a `<div>` is the fastest way to lose the round. → [Sign-Up Form](/problems/signup-form)",
      "",
      "**Forms.** Native attributes first (`required`, `minlength`, `pattern`, `min`/`max`), JavaScript for the rules they cannot state; errors beside the field and linked by `aria-describedby`; `preventDefault` only because you are sending the request yourself; the button locked while it is out. → [Sign-Up Form](/problems/signup-form), [Star Rating in a Form](/problems/star-rating-form)",
      "",
      "**Network.** Every request shows pending, failure and success. A second click cannot send a second request. A slow old response cannot overwrite a newer one. Repeated queries hit a cache, and typing is debounced. Optimistic updates are the advanced version: flip first, revert on failure. → [Like Button](/problems/like-button), [Typeahead with Keyboard Navigation](/problems/typeahead-keyboard-nav)",
      "",
      "**Keyboard and screen reader.** Tab reaches every control in a sensible order, arrows move inside composites, Escape closes, focus is visible. Icon-only buttons get `aria-label`; state goes in `aria-pressed`, `aria-selected` or `aria-expanded`; changes are announced; images have `alt`; nothing depends on colour alone. → [A Tooltip Library From data Attributes](/problems/tooltip-library)",
      "",
      "**CSS.** Plain CSS with custom properties, one class per block and element, no `#id` selectors inside anything reusable, images fitted with `object-fit`, touch targets at least 44 px, a media query if it has to work on a phone. → [Image Carousel With One Image Element](/problems/image-carousel)",
      "",
      "**Edge cases.** The empty list says so instead of looking stuck. A long label wraps or truncates instead of pushing the layout around. Ten thousand rows get paged or windowed. → [Data Table I](/problems/data-table), [Windowed List](/problems/windowed-list)",
      "",
      "**Performance.** Debounce and throttle the chatty events, memoise repeated work, load heavy code and data when first needed, prefetch what is about to be needed. → [Implement debounce()](/problems/implement-debounce), [Load CSS on Demand](/problems/load-css-on-demand)",
      "",
      "**Security.** User text goes through `textContent` or JSX, never `innerHTML`; anything that lands in a URL goes through `encodeURIComponent`. → [How Do You Secure a Site?](/problems/securing-a-website)",
      "",
      "**Strings and locales.** No hard-coded labels inside the component (pass them in), a layout that survives text twice as long, logical properties (`margin-inline-start`) so right-to-left needs no second stylesheet.",
      "",
      "## Worth saying out loud",
      "",
      "- Run the list as you build, not at the end: try each feature in the browser before starting the next, because a bug caught now costs a minute and the same bug later costs ten.",
      '- Name what you are skipping. Saying "the empty state and long names are next" earns most of the credit for handling them.',
    ].join("\n"),
  },
  {
    slug: "signup-form",
    title: "Sign-Up Form",
    category: "frontend",
    difficulty: "medium",
    companies: ["amazon", "openai", "reddit", "stripe"],
    summary:
      "Native attributes carry the rules, one message per field is linked by aria-describedby, and the button locks while the request is out.",
    prompt: [
      "Build a sign-up form in HTML, CSS and JavaScript: four fields, a **Sign Up** button, and a request to the server once the form is valid.",
      "",
      "The starter's `script.js` provides `submitForm(values)`, a stand-in for the endpoint: it resolves with a message after a short delay, or rejects with an `Error` when the server refuses the form (a few usernames are taken, and it re-checks every rule).",
      "",
      "## Requirements",
      "",
      "- **Username**: at least 4 characters, letters and digits only.",
      "- **Email**: a plausible address; a simple check is enough.",
      "- **Password**: at least 6 characters.",
      "- **Confirm password**: must match the password.",
      "- Clicking **Sign Up**, or pressing Enter in any field, submits the form.",
      "- Every input has a visible label that focuses it when clicked, the right `type`, and a visible focus ring.",
      "- State each rule with a native validation attribute where one exists, and in JavaScript where none does.",
      "- Choose when to validate (while typing, on blur, on submit), but an invalid submit must show every failing field's message beside or below it, connect each message to its field for screen readers, and move focus to the first invalid field.",
      "- While the request is out the button is disabled, so a second click cannot send a second request. Show the server's message under the button on failure and a success message on success.",
    ].join("\n"),
    hints: [
      'Put `novalidate` on the form and the browser stops showing its own one-bubble-at-a-time messages — but every `required`, `minlength`, `pattern` and `type="email"` still fills in `input.validity`. Read the flags; write your own text.',
      '`aria-describedby` on the input, pointing at the error paragraph\'s id, is the whole screen-reader story, plus `aria-invalid="true"` while the message shows. Keep the paragraph in the DOM when empty so the id always resolves.',
      "Validate a field on blur the first time and on every keystroke once it has shown an error; validate everything on submit. Only the confirm field needs JavaScript for its rule, and it must re-run when the password changes.",
    ],
    solution: [
      "## Approach",
      "",
      '- The HTML carries the rules: `required`, `minlength`, `pattern="[A-Za-z0-9]+"`, `type="email"`, plus `autocomplete` so password managers fill the right fields. `novalidate` turns off the browser\'s bubbles, not its checking — `input.validity` still reports `valueMissing`, `tooShort`, `patternMismatch` and `typeMismatch`.',
      "- One `messageFor(field)` turns those flags into one sentence per field, the first failing rule in the order a user would fix them. The confirm field is the only rule HTML cannot state, so it compares values directly.",
      "- Showing a message sets three things at once: the paragraph's text, `aria-invalid` on the input, and `setCustomValidity`, so `:invalid` and `form.checkValidity()` agree with what the user sees.",
      "- Timing: quiet while a fresh field is being typed, strict after blur, everything on submit. The password's `input` handler re-validates confirm, because a match can break from either side.",
      '- Submit: `preventDefault`, validate all, focus the first invalid field; otherwise disable the button, call `submitForm(Object.fromEntries(new FormData(form)))`, and write the result into a `role="status"` paragraph. `finally` re-enables the button so neither branch can leave it stuck.',
      "",
      "## Worth saying out loud",
      "",
      "- Native bubbles are free but show one error at a time, cannot be styled, and vanish on the next click; that is why real forms keep the attributes and take over the presentation.",
      '- `disabled` drops keyboard focus from the button; `aria-disabled="true"` plus an early return keeps it. For a form that empties itself on success it hardly matters; for a toggle it does — see [Like Button](/problems/like-button).',
      "- Never trim passwords, and never validate email strictly: a strict pattern rejects real addresses, and the server has to check anyway.",
    ].join("\n"),
    ui: {
      framework: "vanilla",
      files: [
        { name: "index.html", contents: signupHtmlStarter },
        { name: "script.js", contents: signupScriptStarter },
        signupCss,
      ],
      solution: [
        { name: "index.html", contents: signupHtmlSolution },
        { name: "script.js", contents: signupScriptSolution },
        signupCss,
      ],
    },
  },
];
