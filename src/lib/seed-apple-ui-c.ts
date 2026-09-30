import type { Problem, UiFile, UiWorkspace } from "./types";

// Apple front-end bank (the JavaScript interview guide, 2026), UI part C: a
// multi-step form with one shared store, from a React round where Redux was
// expected. The preview offers React alone, so the store is useReducer plus
// context; the signup endpoint is a local stand-in.

const formApi: UiFile = {
  name: "api.js",
  contents: `// A stand-in for the signup endpoint: the preview has no network.
// An email containing "taken" fails, so you can try the error path.
export function submitSignup(values) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (values.email.toLowerCase().includes("taken")) {
        reject(new Error("That email is already registered."));
      } else {
        resolve({ id: "usr_" + values.name.trim().toLowerCase() });
      }
    }, 600);
  });
}
`,
};

const formCss: UiFile = {
  name: "styles.css",
  contents: `body {
  margin: 0;
  font-family: system-ui, sans-serif;
  color: #18181b;
}

.wizard {
  max-width: 380px;
  padding: 16px;
}

.steps {
  display: flex;
  gap: 12px;
  margin: 0 0 12px;
  padding: 0;
  list-style: none;
  font-size: 13px;
  color: #71717a;
}

.steps [aria-current="step"] {
  color: #18181b;
  font-weight: 600;
}

h2 {
  margin: 0 0 12px;
  font-size: 17px;
}

fieldset {
  margin: 0;
  padding: 0;
  border: 0;
}

.field {
  display: grid;
  gap: 4px;
  margin-bottom: 12px;
}

.field input,
.field select {
  padding: 6px 8px;
  border: 1px solid #d4d4d8;
  border-radius: 6px;
  font: inherit;
}

.field [aria-invalid="true"] {
  border-color: #dc2626;
}

.error {
  margin: 0;
  font-size: 12px;
  color: #dc2626;
}

.actions {
  display: flex;
  gap: 8px;
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

button:disabled {
  opacity: 0.6;
  cursor: default;
}

dl {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px 12px;
  margin: 0 0 12px;
}

dt {
  color: #71717a;
}

dd {
  margin: 0;
}
`,
};

const formStoreStarter = `import { createContext, useContext } from "react";

// One store for the whole form, the way Redux would hold it. Right now each
// step keeps its own useState, so going Back loses what was typed.

export const initialState = {
  step: 0,
  values: { email: "", password: "", name: "", role: "Engineer" },
};

export function reducer(state, action) {
  // Your code here
  return state;
}

const FormContext = createContext(null);

export function FormProvider({ children }) {
  // Your code here: useReducer, then provide state and dispatch.
  return children;
}

export function useForm() {
  return useContext(FormContext);
}
`;

const formAppStarter = `import { useState } from "react";

const STEPS = ["Account", "Profile", "Review"];

// Each step owns its own state, so its data is lost when you leave it.
// Move the data into the store in store.jsx, validate before Next, and
// submit from the review step with submitSignup from api.js.

function Account() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <fieldset>
      <label className="field">
        Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="field">
        Password
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
    </fieldset>
  );
}

function Profile() {
  const [name, setName] = useState("");
  return (
    <fieldset>
      <label className="field">
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </label>
    </fieldset>
  );
}

function Review() {
  return <p>Your answers go here.</p>;
}

export default function App() {
  const [step, setStep] = useState(0);
  const Step = [Account, Profile, Review][step];
  return (
    <form className="wizard" onSubmit={(e) => e.preventDefault()}>
      <p>Step {step + 1} of {STEPS.length}</p>
      <h2>{STEPS[step]}</h2>
      <Step />
      <div className="actions">
        <button type="button" disabled={step === 0} onClick={() => setStep(step - 1)}>
          Back
        </button>
        <button type="button" disabled={step === STEPS.length - 1} onClick={() => setStep(step + 1)}>
          Next
        </button>
      </div>
    </form>
  );
}
`;

const formStoreSolution = `import { createContext, useContext, useReducer } from "react";

export const initialState = {
  step: 0,
  values: { email: "", password: "", name: "", role: "Engineer" },
  errors: {},
  status: "editing", // "editing" | "submitting" | "done"
  submitError: null,
};

/** Errors for the fields on one step; an empty object means it can advance. */
export function validate(step, values) {
  const errors = {};
  if (step === 0) {
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(values.email)) errors.email = "Enter a valid email.";
    if (values.password.length < 8) errors.password = "Use at least 8 characters.";
  }
  if (step === 1 && values.name.trim() === "") errors.name = "Enter your name.";
  return errors;
}

export function reducer(state, action) {
  switch (action.type) {
    case "field": {
      const errors = { ...state.errors };
      delete errors[action.name]; // editing a field clears its error
      return { ...state, values: { ...state.values, [action.name]: action.value }, errors };
    }
    case "next": {
      const errors = validate(state.step, state.values);
      if (Object.keys(errors).length > 0) return { ...state, errors };
      return { ...state, step: state.step + 1, errors: {} };
    }
    case "back":
      return { ...state, step: Math.max(0, state.step - 1), errors: {}, submitError: null };
    case "submit":
      return { ...state, status: "submitting", submitError: null };
    case "submitted":
      return { ...state, status: "done" };
    case "failed":
      return { ...state, status: "editing", submitError: action.message };
    default:
      return state;
  }
}

const FormContext = createContext(null);

export function FormProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <FormContext.Provider value={{ state, dispatch }}>{children}</FormContext.Provider>;
}

export function useForm() {
  const context = useContext(FormContext);
  if (!context) throw new Error("useForm must be used inside a FormProvider");
  return context;
}
`;

const formAppSolution = `import { useEffect, useId, useRef } from "react";
import { submitSignup } from "./api.js";
import { FormProvider, useForm } from "./store.jsx";

const STEPS = ["Account", "Profile", "Review"];

/** An input bound to the store, with its error announced and linked. */
function Field({ label, name, type = "text", options }) {
  const { state, dispatch } = useForm();
  const id = useId();
  const error = state.errors[name];
  const props = {
    id,
    value: state.values[name],
    onChange: (e) => dispatch({ type: "field", name, value: e.target.value }),
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? id + "-error" : undefined,
  };
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {options ? (
        <select {...props}>
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      ) : (
        <input type={type} {...props} />
      )}
      {error && (
        <p className="error" id={id + "-error"}>
          {error}
        </p>
      )}
    </div>
  );
}

function Review() {
  const { values } = useForm().state;
  return (
    <dl>
      <dt>Email</dt>
      <dd>{values.email}</dd>
      <dt>Name</dt>
      <dd>{values.name}</dd>
      <dt>Role</dt>
      <dd>{values.role}</dd>
    </dl>
  );
}

function Wizard() {
  const { state, dispatch } = useForm();
  const heading = useRef(null);
  const busy = state.status === "submitting";
  const last = state.step === STEPS.length - 1;

  // Move focus to the new step's heading so keyboard and screen-reader users land there.
  useEffect(() => {
    heading.current?.focus();
  }, [state.step]);

  if (state.status === "done") {
    return <p className="wizard">Welcome aboard, {state.values.name}!</p>;
  }

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!last) {
      dispatch({ type: "next" });
      return;
    }
    dispatch({ type: "submit" });
    try {
      await submitSignup(state.values);
      dispatch({ type: "submitted" });
    } catch (err) {
      dispatch({ type: "failed", message: err.message });
    }
  };

  return (
    <form className="wizard" onSubmit={onSubmit} noValidate>
      <ol className="steps">
        {STEPS.map((name, i) => (
          <li key={name} aria-current={i === state.step ? "step" : undefined}>
            {name}
          </li>
        ))}
      </ol>
      <h2 ref={heading} tabIndex={-1}>
        Step {state.step + 1} of {STEPS.length}: {STEPS[state.step]}
      </h2>
      <fieldset disabled={busy}>
        {state.step === 0 && (
          <>
            <Field label="Email" name="email" type="email" />
            <Field label="Password" name="password" type="password" />
          </>
        )}
        {state.step === 1 && (
          <>
            <Field label="Name" name="name" />
            <Field label="Role" name="role" options={["Engineer", "Designer", "Manager"]} />
          </>
        )}
        {last && <Review />}
        {state.submitError && (
          <p className="error" role="alert">
            {state.submitError}
          </p>
        )}
        <div className="actions">
          <button type="button" disabled={state.step === 0} onClick={() => dispatch({ type: "back" })}>
            Back
          </button>
          <button type="submit">{last ? (busy ? "Submitting…" : "Submit") : "Next"}</button>
        </div>
      </fieldset>
    </form>
  );
}

export default function App() {
  return (
    <FormProvider>
      <Wizard />
    </FormProvider>
  );
}
`;

const formUi: UiWorkspace = {
  framework: "react",
  files: [{ name: "App.jsx", contents: formAppStarter }, { name: "store.jsx", contents: formStoreStarter }, formApi, formCss],
  solution: [{ name: "App.jsx", contents: formAppSolution }, { name: "store.jsx", contents: formStoreSolution }, formApi, formCss],
};

export const appleUiProblemsC: Problem[] = [
  {
    slug: "multi-step-form",
    title: "Multi-Step Form With a Shared Store",
    category: "frontend",
    difficulty: "medium",
    companies: ["apple"],
    summary:
      "Three steps, one reducer: data survives Back, each step validates before Next, and submitting locks the form.",
    prompt: [
      "Build a three-step signup form (Account, Profile, Review) that passes data between steps. The interviewer expected Redux. The preview offers React alone, so build the same shape with `useReducer` and context: one store, actions for every change, and steps that read from it instead of holding their own state.",
      "",
      "The starter works, but each step keeps its own `useState`, so going Back loses what was typed.",
      "",
      "## Requirements",
      "",
      "- **Account:** a valid email, and a password of at least 8 characters. **Profile:** a name, and a role from Engineer, Designer or Manager. **Review:** everything entered, and a Submit button.",
      "- Back and Next move between steps, and nothing typed is ever lost.",
      "- Next validates the current step first. Errors show under their fields, marked with `aria-invalid` and linked with `aria-describedby`, and editing a field clears its error.",
      "- Show which step is current, both visibly and with `aria-current=\"step\"`.",
      "- Submit calls `submitSignup(values)` from `api.js`. While it is in flight, disable every control. On success, show a welcome message with the name. On failure, show the server's message on the Review step. Any email containing \"taken\" fails.",
      "",
      "*Reported in: a front-end loop where a multi-step form passing data between steps was built, and Redux was expected (Apple JavaScript guide, UI builds).*",
    ].join("\n"),
    hints: [
      "Put `step`, `values`, `errors`, `status` and `submitError` in one reducer. Every change is an action, such as `{ type: \"field\", name, value }`, `next`, `back`, `submit`, `submitted` or `failed`.",
      "Validate inside the `next` action: compute the errors for the current step, and only advance when there are none. The reducer stays the single place that decides.",
      "A `<fieldset disabled>` around the form's controls disables all of them at once while the request is in flight.",
    ],
    solution: [
      "## Approach",
      "",
      "One reducer owns the whole form: the current step, the values, per-field errors, and the submit status. `FormProvider` puts `state` and `dispatch` in context, and every `Field` reads its value and error from the store and dispatches edits, so a step can unmount and remount without losing anything. `next` runs validation for the current step inside the reducer, and the submit handler moves through `submit`, then `submitted` or `failed`. Focus moves to each new step's heading, so keyboard and screen-reader users land in the right place.",
      "",
      "## Worth saying out loud",
      "",
      "- The shape maps one to one onto Redux: the reducer is a slice, `dispatch` is the same, and `useForm` stands in for `useSelector` and `useDispatch`. Redux Toolkit's `createSlice` would remove the switch statement.",
      "- A context value changes on every dispatch, so every consumer re-renders. That's fine for one form. For a big app, Redux's `useSelector` re-renders only the components whose slice changed.",
      "- Validation also belongs on the server, and the client's rules are a convenience. The \"taken\" email shows why: only the server knows.",
      "- Worth offering: keep a draft in `sessionStorage` so a reload doesn't lose three steps of typing, and never store the password there.",
    ].join("\n"),
    ui: formUi,
  },
];
