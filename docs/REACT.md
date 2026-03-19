# React — How It Works

This document explains React from the ground up: what problem it solves, how the core concepts work, and how they appear in this project. If you have never written React before, start here.

---

## Table of Contents

1. [The Problem React Solves](#1-the-problem-react-solves)
2. [Components — The Building Blocks](#2-components--the-building-blocks)
3. [JSX — HTML Inside JavaScript](#3-jsx--html-inside-javascript)
4. [Props — Passing Data Into Components](#4-props--passing-data-into-components)
5. [State — Data That Changes Over Time](#5-state--data-that-changes-over-time)
6. [The Render Cycle — How React Updates the DOM](#6-the-render-cycle--how-react-updates-the-dom)
7. [useState — The Most Important Hook](#7-usestate--the-most-important-hook)
8. [useEffect — Synchronizing with the Outside World](#8-useeffect--synchronizing-with-the-outside-world)
9. [useRef — Values That Don't Cause Re-renders](#9-useref--values-that-dont-cause-re-renders)
10. [useReducer — Managing Complex State](#10-usereducer--managing-complex-state)
11. [useMemo and useCallback — Skipping Expensive Work](#11-usememo-and-usecallback--skipping-expensive-work)
12. [Context — Sharing State Without Prop Drilling](#12-context--sharing-state-without-prop-drilling)
13. [TypeScript in React — Types and Interfaces](#13-typescript-in-react--types-and-interfaces)
14. [Event Handling](#14-event-handling)
15. [Lists and Keys](#15-lists-and-keys)
16. [Conditional Rendering](#16-conditional-rendering)
17. [Forms — Controlled vs Uncontrolled](#17-forms--controlled-vs-uncontrolled)

---

## 1. The Problem React Solves

Before React (and before frameworks like Vue and Angular), web UIs were built with direct DOM manipulation using jQuery or vanilla JavaScript:

```javascript
// Old way — manually update every element that might change
const button = document.getElementById('submit');
button.addEventListener('click', () => {
  const list = document.getElementById('results');
  list.innerHTML = ''; // clear it
  results.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item.name;
    list.appendChild(li);
  });
});
```

This approach breaks down as UIs grow because:
- You manually track which parts of the DOM need updating
- State and UI get out of sync (you fetched new data but forgot to update a counter)
- The code becomes spaghetti — event handlers reaching into random parts of the page

React's core idea is: **describe what the UI should look like given the current state, and let React figure out how to get there.**

Instead of saying "update this element", you say "here is what the entire UI looks like when the data is X". React compares the new description to the current DOM and applies only the minimum necessary changes.

---

## 2. Components — The Building Blocks

A component is a JavaScript function that returns a description of UI. That description is JSX (explained in the next section).

```tsx
// The simplest possible component
function Greeting() {
  return <h1>Hello, world!</h1>;
}
```

Components are composable — you use them inside other components, just like HTML tags:

```tsx
function App() {
  return (
    <div>
      <Greeting />
      <Greeting />
      <Greeting />
    </div>
  );
}
```

### Rules of components

1. **Names start with an uppercase letter** — `Greeting`, not `greeting`. React uses this to distinguish custom components from HTML elements.
2. **They must return valid JSX** — a single root element (or a Fragment `<>...</>`)
3. **They are pure functions** — given the same inputs (props, state), they return the same output

### In this project

Every file in `frontend/src/pages/` and `frontend/src/components/` is a component. `Layout.tsx` is the persistent shell (sidebar + content area). `Task1Page.tsx`, `Task2Page.tsx` etc. are the page components rendered inside it.

---

## 3. JSX — HTML Inside JavaScript

JSX is a syntax extension that lets you write HTML-like markup inside JavaScript. It looks like HTML but it is actually JavaScript in disguise.

```tsx
// This JSX:
const element = <h1 className="title">Hello</h1>;

// Compiles to this JavaScript:
const element = React.createElement("h1", { className: "title" }, "Hello");
```

Vite (your build tool) and TypeScript handle the compilation automatically. You write JSX; the browser receives JavaScript.

### Key differences from HTML

| HTML | JSX |
|---|---|
| `class="..."` | `className="..."` (reserved word conflict) |
| `for="..."` (label) | `htmlFor="..."` |
| `<input>` (self-closing optional) | `<input />` (must close) |
| `onclick="fn()"` | `onClick={fn}` (camelCase, function reference) |
| `style="color: red"` | `style={{ color: "red" }}` (object, camelCase CSS) |

### Expressions in JSX

Anything inside `{}` is evaluated as JavaScript:

```tsx
const name = "Ana";
const count = 42;

return (
  <div>
    <p>Hello, {name}!</p>
    <p>You have {count * 2} notifications</p>
    <p>{count > 10 ? "Many" : "Few"}</p>
  </div>
);
```

### JSX is not a string

JSX produces React element objects, not HTML strings. React uses these objects to build a virtual representation of the DOM (the "virtual DOM"), then efficiently updates the actual DOM based on differences.

---

## 4. Props — Passing Data Into Components

Props (properties) are how parent components pass data to child components. They are the inputs to a component, analogous to function arguments.

```tsx
// Define what props the component accepts
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean; // optional
}

// Use them via destructuring
function Button({ label, onClick, disabled = false }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}

// Pass them like HTML attributes
function App() {
  return <Button label="Save" onClick={() => console.log("saved")} />;
}
```

### Props are read-only

A component must never modify its own props. If you need to change data, that data should be state (see next section). This is what makes components predictable: given the same props, they always render the same thing.

### Children

Every component can receive a special `children` prop — the JSX placed between its opening and closing tags:

```tsx
interface CardProps {
  title: string;
  children: React.ReactNode;
}

function Card({ title, children }: CardProps) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <div className="body">{children}</div>
    </div>
  );
}

// Used as:
<Card title="My Title">
  <p>This becomes the children prop</p>
</Card>
```

### In this project

`CategoryTable` in `frontend/src/components/CategoryTable.tsx` receives `categories`, `onInlineUpdate`, `onDelete`, and `canWrite` as props. The parent (`Task5Page`) owns the data and the mutation functions; it passes them down.

---

## 5. State — Data That Changes Over Time

Props flow down from parent to child and are read-only. **State** is data that lives inside a component and can change. When state changes, React re-renders the component.

Think of state as the component's memory. Between renders, state persists. When it updates, the component re-renders to reflect the new value.

Good examples of state:
- The current text in a search input
- Whether a dropdown is open or closed
- The results of an API call
- Which item is selected in a list

Not state (because it can be derived):
- A filtered list (derive it from the full list + the filter string)
- The count of items (derive it from `items.length`)

---

## 6. The Render Cycle — How React Updates the DOM

Understanding this is fundamental. Here is what happens every time a component renders:

1. React calls your component function
2. The function runs from top to bottom
3. It returns JSX describing the UI
4. React compares this to the previous output (diffing)
5. React applies only the changed parts to the actual DOM

This means: **every time state or props change, your function runs again from scratch.** The variables are re-created. The JSX is re-evaluated. React figures out the minimum DOM update needed.

```tsx
function Counter() {
  const [count, setCount] = useState(0);

  // This function body runs every render.
  // count is re-read from state on each render.
  console.log("rendering with count:", count);

  return (
    <button onClick={() => setCount(count + 1)}>
      Clicked {count} times
    </button>
  );
}
```

Click the button → `setCount` is called → React re-renders `Counter` → the function runs again → `count` is now 1 → JSX is updated.

---

## 7. useState — The Most Important Hook

`useState` is the hook for local component state. It returns a pair: the current value and a setter function.

```tsx
const [value, setValue] = useState(initialValue);
```

```tsx
function SearchBox() {
  const [term, setTerm] = useState(""); // start empty

  return (
    <input
      value={term}
      onChange={(e) => setTerm(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

### Rules

- Call `useState` at the top level of your component — never inside loops, conditions, or nested functions
- The setter function **replaces** the state value (for objects, you must spread the old value: `setState({ ...old, field: newValue })`)
- State updates are **asynchronous** — after calling `setValue(x)`, the variable `value` still holds the old value until the next render

### Functional updates

If new state depends on old state, use the functional form:

```tsx
setCount(prev => prev + 1); // safe — always uses latest value
setCount(count + 1);        // risky in batched updates — count might be stale
```

### In this project

Task2Page uses `useState` for the search term, whether the sidebar is open, and the sidebar filter string. These are all UI state — they only matter while the component is mounted.

---

## 8. useEffect — Synchronizing with the Outside World

`useEffect` runs code after a render, for side effects that belong to the component lifecycle but not to the render itself. Side effects include: fetching data, subscribing to events, setting up timers, directly manipulating the DOM.

```tsx
useEffect(() => {
  // This code runs after the component renders
  document.title = `You clicked ${count} times`;
}, [count]); // dependency array — re-run when count changes
```

### The dependency array

- **No array** — runs after every render
- **Empty array `[]`** — runs once after the first render (equivalent to componentDidMount)
- **`[a, b]`** — runs after any render where `a` or `b` has changed

### Cleanup

If your effect sets up something that needs to be torn down (event listeners, timers, subscriptions), return a cleanup function:

```tsx
useEffect(() => {
  const handler = () => console.log("resized");
  window.addEventListener("resize", handler);

  return () => {
    window.removeEventListener("resize", handler); // cleanup on unmount
  };
}, []);
```

### In this project

The `useAuthInit` hook in `authStore.ts` uses `useEffect` to attempt a token refresh on mount. The `Identicon` component in `Layout.tsx` uses `useEffect` to call the jdenticon library to draw an SVG after the component has rendered (because the library needs a real DOM element to operate on).

### The classic mistake

```tsx
// DON'T do this — infinite loop!
useEffect(() => {
  setCount(count + 1); // updates state → re-render → effect runs again → ...
}, [count]);
```

If you find yourself writing an effect that sets state based on a value in the dependency array, usually there's a better way (derive the value during render, or rethink the state structure).

---

## 9. useRef — Values That Don't Cause Re-renders

`useRef` creates a mutable container whose `.current` property persists across renders but whose changes do **not** trigger a re-render.

### Two uses

**1. Accessing DOM elements directly:**

```tsx
function TextInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  const focusInput = () => {
    inputRef.current?.focus(); // direct DOM access
  };

  return (
    <>
      <input ref={inputRef} />
      <button onClick={focusInput}>Focus</button>
    </>
  );
}
```

**2. Storing a value that persists across renders but shouldn't trigger re-renders** (e.g., a timer ID, a previous value for comparison).

### In this project

`Task1Page` uses `useRef` for the hidden file input elements (`xmlRef`, `jsonRef`), so the "choose file" dialog can be programmatically triggered when the user clicks the styled drop zone label.

---

## 10. useReducer — Managing Complex State

When a component has multiple related state values that change together, `useReducer` organizes them better than multiple `useState` calls.

The pattern comes from Redux: you define a **reducer function** that takes the current state and an **action** and returns the new state. You dispatch actions to trigger state changes.

```tsx
interface State { count: number; status: "idle" | "loading" | "error" }
type Action = { type: "start" } | { type: "done" } | { type: "fail" }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "start":  return { ...state, status: "loading" }
    case "done":   return { count: state.count + 1, status: "idle" }
    case "fail":   return { ...state, status: "error" }
  }
}

function Component() {
  const [state, dispatch] = useReducer(reducer, { count: 0, status: "idle" });

  return (
    <button onClick={() => dispatch({ type: "start" })}>
      {state.status === "loading" ? "Loading..." : `Clicked ${state.count} times`}
    </button>
  );
}
```

### Why useReducer over useState

- Related state that always changes together lives in one place
- The reducer is a pure function — easy to test
- Action names document what events are happening ("open_create", "cancel", "set_name")
- Prevents impossible states (you can't have `status: "loading"` and `status: "error"` simultaneously if the reducer is correct)

### In this project

`Task5Page` uses `useReducer` for both the create form state and the GraphQL panel state. The form state tracks `showForm`, `name`, `slug`, and `description` together — they are logically one unit.

---

## 11. useMemo and useCallback — Skipping Expensive Work

### useMemo — cache a computed value

```tsx
const filteredCategories = useMemo(
  () => categories.filter(c => c.name.includes(search)),
  [categories, search] // recompute only when these change
);
```

Without `useMemo`, the filter would run on every render — even renders caused by unrelated state changes. With `useMemo`, it only runs when `categories` or `search` actually changes.

Use it for: expensive calculations, derived arrays/objects passed to child components.

### useCallback — cache a function

```tsx
const handleDelete = useCallback((id: number) => {
  deleteMutation.mutate(id);
}, [deleteMutation]); // recreate only when deleteMutation changes
```

Every render creates new function instances. If you pass a function as a prop to a memoized child component, a new function instance would cause the child to re-render even if the logic is identical. `useCallback` returns the same function instance between renders.

### Don't over-use them

Both hooks have a cost (memory, comparison work). Only use them when you have an actual performance problem: expensive computations or components that render unnecessarily often.

### In this project

`CategoryTable` uses `useMemo` for the filtered categories list and for the column definitions. Column definitions include functions that reference `editingId` and `draft` — they are in the `useMemo` dependency array so they rebuild when edit state changes.

---

## 12. Context — Sharing State Without Prop Drilling

Prop drilling is passing a prop through multiple levels of components just to get it to a deeply nested component:

```
App → Layout → Page → Section → Component  ← needs `user`
```

All intermediaries must accept and forward `user` even if they don't use it. Context solves this by making a value available to any descendant without passing it through every level.

```tsx
// 1. Create the context
const ThemeContext = React.createContext<"light" | "dark">("light");

// 2. Provide it at a high level
function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Page />
    </ThemeContext.Provider>
  );
}

// 3. Consume it anywhere below
function DeepButton() {
  const theme = useContext(ThemeContext);
  return <button className={theme}>Click</button>;
}
```

### Context limitations

Context is not a state management solution — it is a dependency injection mechanism. Every time the context value changes, **all consumers re-render**. For frequently changing state (like form input), this causes performance problems.

For global application state, this project uses Zustand instead (see `FRONTEND_STACK.md`).

### In this project

`AuthContext.tsx` is a compatibility shim — it re-exports `useAuthStore` so that any component using the old `useAuth()` pattern still works. The real state lives in Zustand, not in React Context.

---

## 13. TypeScript in React — Types and Interfaces

TypeScript is a typed superset of JavaScript. Adding types catches bugs at compile time instead of runtime.

### Interfaces for props

```tsx
interface ButtonProps {
  label: string;           // required string
  onClick: () => void;     // required function that returns nothing
  disabled?: boolean;      // optional boolean
  variant?: "primary" | "ghost"; // optional, only these two values
}

function Button({ label, onClick, disabled = false, variant = "primary" }: ButtonProps) {
  // ...
}
```

### Generic components

Generics let a component work with different types while still being type-safe:

```tsx
interface SelectProps<T> {
  options: T[];
  value: T;
  onChange: (value: T) => void;
  getLabel: (option: T) => string;
}

function Select<T>({ options, value, onChange, getLabel }: SelectProps<T>) {
  return (
    <select onChange={(e) => onChange(options[+e.target.value])}>
      {options.map((opt, i) => (
        <option key={i} value={i}>{getLabel(opt)}</option>
      ))}
    </select>
  );
}
```

### Common React TypeScript types

| Type | Usage |
|---|---|
| `React.ReactNode` | Anything renderable (elements, strings, null, arrays) |
| `React.ReactElement` | A React element specifically (not strings/numbers) |
| `React.FC<Props>` | Function component type (less common now) |
| `React.ChangeEvent<HTMLInputElement>` | onChange event for inputs |
| `React.FormEvent<HTMLFormElement>` | onSubmit event for forms |
| `React.MouseEvent<HTMLButtonElement>` | onClick event for buttons |
| `React.RefObject<HTMLInputElement>` | ref for an input element |

### Type inference

TypeScript infers types when they are obvious — you don't need to annotate everything:

```tsx
const [count, setCount] = useState(0);      // inferred: number
const [name, setName] = useState("");       // inferred: string
const [user, setUser] = useState<User | null>(null); // explicit: can't infer null
```

---

## 14. Event Handling

React events are synthetic wrappers around browser events. They work the same as native events but are normalized across browsers.

```tsx
function Form() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // prevent page reload
    console.log("submitted");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input onChange={handleChange} />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Common events

| Event | Handler | Type |
|---|---|---|
| Input change | `onChange` | `React.ChangeEvent<HTMLInputElement>` |
| Form submit | `onSubmit` | `React.FormEvent<HTMLFormElement>` |
| Button click | `onClick` | `React.MouseEvent<HTMLButtonElement>` |
| Key press | `onKeyDown` | `React.KeyboardEvent<HTMLInputElement>` |
| Focus/blur | `onFocus` / `onBlur` | `React.FocusEvent<HTMLInputElement>` |

### In this project

The inline edit in `CategoryTable` uses `onKeyDown` to save on `Enter` and cancel on `Escape`:

```tsx
onKeyDown={(e) => {
  if (e.key === "Enter") saveEdit();
  if (e.key === "Escape") cancelEdit();
}}
```

---

## 15. Lists and Keys

Rendering a list of items uses `.map()`:

```tsx
function CategoryList({ categories }: { categories: Category[] }) {
  return (
    <ul>
      {categories.map((cat) => (
        <li key={cat.id}>{cat.name}</li>
      ))}
    </ul>
  );
}
```

### Why keys matter

When React re-renders a list, it needs to know which items changed, were added, or were removed. The `key` prop is a unique identifier React uses to match elements across renders.

- **Without keys** (or with index as key): React may re-render items unnecessarily or even put the wrong DOM node in the wrong position.
- **With stable keys** (database IDs): React knows exactly which item each DOM node represents and updates only what changed.

```tsx
// Bad — index as key: breaks when items are reordered or deleted
{items.map((item, index) => <Item key={index} {...item} />)}

// Good — stable, unique ID
{items.map((item) => <Item key={item.id} {...item} />)}
```

---

## 16. Conditional Rendering

JSX can render different things based on conditions.

### Ternary

```tsx
{isLoading ? <Spinner /> : <Content />}
```

### Logical AND — render only if truthy

```tsx
{errorMessage && <ErrorBanner message={errorMessage} />}
```

Careful: `{0 && <X />}` renders `0`, not nothing. Use `{count > 0 && <X />}` or `{!!count && <X />}`.

### Early return

```tsx
function Page() {
  if (isLoading) return <LoadingPage />;
  if (error) return <ErrorPage error={error} />;
  return <MainContent />;
}
```

### In this project

Task5Page conditionally renders the create form:
```tsx
{form.showForm && (
  <GradientCard title="New Category">
    <form>...</form>
  </GradientCard>
)}
```

---

## 17. Forms — Controlled vs Uncontrolled

### Controlled inputs

The input's value is controlled by React state. Every keystroke calls `setState`, which triggers a re-render, which sets the input value. React is the "source of truth".

```tsx
const [name, setName] = useState("");

return (
  <input
    value={name}
    onChange={(e) => setName(e.target.value)}
  />
);
```

Advantages: you always know the current value, you can validate as the user types, you can programmatically reset the input (`setName("")`).

### Uncontrolled inputs

The input manages its own value internally. You use a `ref` to read the value when you need it (e.g., on form submit).

```tsx
const inputRef = useRef<HTMLInputElement>(null);

const handleSubmit = () => {
  console.log(inputRef.current?.value); // read on demand
};

return <input ref={inputRef} />;
```

### When to use each

Use **controlled** for: validation, conditional logic based on input, resetting after submit.
Use **uncontrolled** for: simple file inputs, integrating with non-React DOM libraries.

This project uses **controlled inputs throughout** — every `<input>` has a `value` prop and an `onChange` handler tied to state.

---

*For state management (Zustand), server state (TanStack Query), routing (React Router), and the build tool (Vite) — see `FRONTEND_STACK.md`.*
