# RULES_OF_INTEGRATION

These rules define how code should be implemented whenever a prompt is given to Antigravity. Follow these rules by default unless the prompt explicitly requires an exception.

## 1. State Management

- Do **not** use React `useState` by default.
- Use a **Zustand store** instead of local component state.
- Store file naming convention:
  - `module-name.store.ts`
- `useState` is allowed only when:
  - It is genuinely required for the specific file.
  - The state has no dependency on, or impact on, other components.
  - Using a Zustand store would add unnecessary complexity for that isolated case.
- Prefer shared and predictable state management through Zustand whenever state needs to be consumed, updated, or coordinated across components.

## 2. Logic, Hooks, and Optimization

- All logical/business functions must be implemented in an optimized, production-level manner.
- Avoid putting complex logic directly inside components.
- Functions, state-related logic, `useEffect`, API calls, transformations, handlers, and other reusable logic should be placed in the appropriate custom hook.
- Hook file naming convention:
  - `module-name.ts`
- Keep components focused primarily on:
  - Rendering UI.
  - Passing required data and callbacks.
  - Handling minimal presentation-level concerns.
- Avoid duplicated logic.
- Prefer reusable, composable functions and hooks.
- Optimize for readability, maintainability, performance, and scalability.

## 3. API Calls and Payload Handling

- All API calls must be handled through `apiHandler`.
- Do not make direct API requests from components.
- For every API request, create the payload using `const`.
- For `GET` requests, pass the payload through `getQuery`.
- Example pattern:

```ts
const payload = {
  page,
  limit,
  search,
};

const response = await apiHandler(
  "GET",
  ENDPOINTS.module.list,
  getQuery(payload),
);
```

- Keep API request construction inside the appropriate hook/action layer rather than inside UI components.

## 4. Type Safety

- Do **not** use `any` for API request or response data.
- Every API-related data structure must have an explicit TypeScript type/interface.
- Define the required types in:

```text
types/index.ts
```

- Types used only within the module should **not be exported** unless they are required outside that module.
- Reuse existing types where applicable instead of creating duplicate types.
- Avoid unnecessary type assertions and preserve strict type safety throughout the implementation.

## 5. API Endpoints and Actions

### Endpoints

- All API endpoints must be defined in:

```text
ENDPOINT.ts
```

- Do not hardcode API endpoint strings inside components, hooks, or action files.

### Actions

- Create a dedicated action file for each module:

```text
module-name.action.ts
```

- Actions should be responsible for communicating with the API layer.
- Keep endpoint definitions separate from API actions.
- Keep business/UI logic separate from actions.

Recommended structure:

```text
module/
├── module-name.ts
├── module-name.action.ts
├── module-name.store.ts
└── ...
types/
└── index.ts
ENDPOINT.ts
```

## 6. Code Structure and Optimization

- Do not add unnecessary `if/else` conditions.
- Do not add redundant checks, variables, functions, imports, or abstractions.
- Keep the implementation simple without sacrificing correctness.
- Prefer early returns when they improve readability.
- Avoid deeply nested conditional logic.
- Do not repeat the same logic in multiple places.
- Reuse existing utilities, hooks, stores, types, and API helpers when available.
- Do not introduce a new abstraction if an existing project abstraction already solves the problem.
- Maintain the existing project architecture and coding conventions.
- Do not make unrelated changes while implementing a requested feature or fix.
- Preserve existing behavior unless the requested change specifically requires modifying it.

## 7. Default Implementation Principles

Whenever implementing a new feature or modifying existing code:

1. Check the existing architecture before adding new files or patterns.
2. Reuse existing stores, hooks, API handlers, endpoint structures, and types where possible.
3. Keep UI components lightweight.
4. Put reusable logic in hooks.
5. Put shared state in Zustand stores.
6. Put API communication in action files and `apiHandler`.
7. Put endpoint definitions in `ENDPOINT.ts`.
8. Put shared TypeScript types in `types/index.ts`.
9. Never use `any` when a proper type can be defined.
10. Avoid unnecessary conditional logic and duplicated code.
11. Optimize the implementation for production-level readability, maintainability, and performance.
12. Make the smallest clean change necessary to fulfill the prompt.

## 8. Exception Rule

The rules above are the default standards and should always be followed unless a specific prompt explicitly requires otherwise.

If an exception is necessary, keep it as localized as possible and do not weaken the architecture of unrelated files or components.

## 9. UI Components and shadcn/ui

- Use **shadcn/ui components** wherever an appropriate component already exists.
- Prefer shadcn/ui components instead of creating custom implementations for common UI elements.
- Use existing project shadcn/ui components such as:
  - `Button`
  - `Input`
  - `Textarea`
  - `Select`
  - `Dialog`
  - `Sheet`
  - `Popover`
  - `Tooltip`
  - `Checkbox`
  - `RadioGroup`
  - `Switch`
  - `Tabs`
  - `Card`
  - `Badge`
  - `Command`
  - `Label`
  - and other applicable shadcn/ui components.
- Before creating a new UI component, check whether an existing shadcn/ui component can be reused.
- Do not introduce another UI component library when a suitable shadcn/ui component already exists.
- Follow the project's existing shadcn/ui patterns, variants, styling, and accessibility conventions.
- Native HTML elements are allowed and should be used where appropriate for simple structural or semantic content, including:
  - `div`
  - `span`
  - `p`
  - `h1`–`h6`
  - `section`
  - `article`
  - `main`
  - `header`
  - `footer`
  - and other semantic HTML elements.
- Do **not** unnecessarily replace simple HTML elements such as `div`, `p`, `span`, or headings with shadcn/ui components.
- For interactive or reusable UI elements, prefer the appropriate shadcn/ui component over manually building the component.
- Keep UI implementation consistent, reusable, accessible, and aligned with the existing application design.