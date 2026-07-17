# LEAFlisp Coding Assistant Instructions

Use this instruction when assisting with LEAFlisp code in any repository. Do not assume the current repository is GhostOS, and do not assume specific file paths, package names, test commands, or runtime wiring until you inspect the local project.

## Operating Rules

- Treat LEAFlisp as a small Lisp-like language embedded in a host application.
- First inspect the local repository for the LEAFlisp parser/runtime, stdlib, examples, tests, and integration layer.
- Prefer local docs, tests, and runtime behavior over memory or assumptions.
- Keep changes small and focused on the requested LEAFlisp behavior.
- Do not invent host globals. Confirm available globals from the local runtime setup.
- Do not add dependencies unless the repository already requires them for the task.
- When changing LEAFlisp execution behavior, add or update tests for parsing, runtime evaluation, and host integration as appropriate.

## Discovery Checklist

Before writing or modifying LEAFlisp code, locate:

- The parser/scanner implementation and supported syntax.
- The interpreter/evaluator and special forms.
- The stdlib/runtime globals exported into LEAFlisp.
- Host-specific globals such as `inport`, `return`, `outport`, `trace`, or dataflow helpers.
- Data conversion functions between host values and LEAFlisp values.
- Existing examples and tests that show preferred idioms.
- Repository canonical commands for tests, lint, typecheck, and build.

Useful search terms:

```sh
rg -n "LEAFlisp|leaflisp|PocketLisp|insituexecute|parseJsonToLEAFlisp|createLEAFlispRuntime|inport|outport"
```

If the current repository does not include a LEAFlisp runtime or test harness, `ghostos` is available as an npm package and can be used as an external reference/test dependency when appropriate. Prefer the repository's existing tooling first; use `ghostos` only when the task needs executable LEAFlisp behavior and adding or using an npm package is acceptable in the current project.

## Language Model

Common syntax, subject to local implementation:

```lisp
; comment
(function arg1 arg2)
(def name value)
(defn name [arg1 arg2] body)
(fn [arg1 arg2] body)
(do expr1 expr2 expr3)
(if condition then-expr else-expr)
[1 2 3]
{:key "value" :count 3}
(get data :key)
```

Typical values:

- Booleans: `true`, `false`
- Numbers: `1`, `1.5`, and sometimes fractions such as `1/2`
- Strings: `"hello"`
- Keywords: `:name`
- Vectors/lists: `[a b c]`
- Hash maps/dicts: `{:key value}`
- Missing values: often represented by `nil`, `null`, `undefined`, or a `Nothing` value, depending on the host runtime

## Runtime Model

Most LEAFlisp runtimes follow this shape:

1. Host input is converted into LEAFlisp source or boxed runtime values.
2. The host prepends bindings such as `(def inport ...)`.
3. User LEAFlisp code is parsed into expressions.
4. Expressions are evaluated in order.
5. The final expression result is converted back to host JSON/JS data.

Host-integrated payloads may be wrapped by the surrounding dataflow system. Before transforming a response-like payload, inspect the actual `inport` shape. For example, an outcome bottle may store the provider response under:

```lisp
(get (get (get (get inport :_content) :result) :value) :output)
```

In host-integrated code, prefer an explicit return expression when examples use one:

```lisp
(return (+ inport 3))
```

For object input, prefer `get` with keyword keys if supported:

```lisp
(return {:count (+ (get inport :count) 1)
         :label (get inport :label)})
```

## Known Runtime Patterns

Use small local helpers for common nullish and vector operations when the local runtime supports them:

```lisp
(defn coalesce [v fallback] (if (isnil v) fallback v))
(defn orVector [v] (if (isnil v) [] v))
(defn append [xs x] (+ xs [x]))
```

Prefer self-contained LEAFlisp helpers unless host globals are explicitly available. If code calls names such as `normalizeUsage`, `normalizeAnnotation`, or `normalizeToolActivity`, either define them in LEAFlisp or confirm they are injected into the runtime.

When unwrapping a possible bottle/outcome payload, keep the wrapper handling explicit:

```lisp
(defn unwrapResponse [payload]
  (if (isnil (get payload :_content))
    payload
    (get (get (get payload :_content) :result) :value)))
```

Some LEAFlisp runtimes have edge cases around empty vectors. In GhostOS-style runtime behavior observed locally, `(+ [] [])` can throw `Invalid number: ""`. Avoid concatenating two possibly-empty vectors directly. Prefer reducing through `append`:

```lisp
(defn appendAnnotation [annotations annotation]
  (append annotations annotation))

(reduce existingAnnotations appendAnnotation (orVector newAnnotations))
```

## Coding Guidance

- Use existing stdlib functions instead of recreating behavior in host code.
- Preserve boxed value semantics. Do not assume LEAFlisp values are raw JavaScript/Python/etc. primitives.
- Confirm whether operators like `+`, `-`, `*`, `/`, `==`, and `get` dispatch through methods on boxed value types.
- Be careful with missing values. Check whether missing keys throw, return `null`, return `Nothing`, or require `maybe`.
- Be careful with falsy values. Verify that `0`, `false`, `""`, and empty vectors survive host conversion.
- Avoid relying on undefined host functions. If a helper is not known to be injected, define it in LEAFlisp or pass it explicitly through the host runtime bindings.
- Avoid direct vector concatenation when both sides may be empty until the local runtime has been tested for `(+ [] [])`.
- If token or usage fields arrive as strings, preserve them as strings unless the task explicitly requires numeric conversion and the runtime parser accepts that conversion safely.
- If adding host globals, validate argument types and return proper LEAFlisp values, not raw host objects, unless the local runtime supports them.
- If adding syntax, update scanner/parser tests and interpreter tests.
- If adding stdlib functions, update both direct stdlib tests and host integration tests.

When using `ghostos` as a test harness, first inspect its package exports in the local environment instead of assuming exact import paths. Look for exported helpers such as `createLEAFlispRuntime`, `executeLEAFlisp`, `parseJsonToLEAFlisp`, or related parser/runtime modules, then write a small smoke test around the discovered API.

## Host Integration Guidance

Do not assume `inport` exists until verified. If it does, it is usually the host input binding for a node or execution helper.

When writing LEAFlisp for dataflow nodes:

- Treat `inport` as the current input payload.
- Use `return` or `outport` only if the local runtime defines them.
- Keep node expressions deterministic unless the existing node intentionally performs side effects.
- Use debug helpers such as `trace` or `probe` only if the host runtime provides them.
- Avoid embedding environment-specific URLs or paths unless the existing project already does so.
- For wrapped outcome/bottle inputs, normalize the wrapper first and then transform the inner payload. Do not assume the provider response is at the root of `inport`.

## Review Checklist

For any LEAFlisp-related change, verify:

- Parser accepts the intended syntax.
- Runtime returns the expected final value.
- Host input is converted correctly.
- Host output is converted correctly.
- Missing, null, false, zero, and empty values behave correctly.
- Empty-vector cases are covered, especially appending, reducing, and concatenating vectors.
- All helper names referenced by LEAFlisp code are either defined in the snippet or confirmed host globals.
- Error messages include enough context for the caller or node.
- Existing examples still run.
- Repository canonical checks pass.

## Example Tasks

Add a small transformation:

```lisp
(return {:name (get inport :name)
         :count (+ (get inport :count) 1)})
```

Map over a vector when `map` and anonymous functions are supported:

```lisp
(return (map #(+ %1 1) inport))
```

Safely compose multiple expressions:

```lisp
(do
  (def count (get inport :count))
  (return (+ count 1)))
```

Self-contained response normalization helpers:

```lisp
(do
  (defn coalesce [v fallback] (if (isnil v) fallback v))
  (defn orVector [v] (if (isnil v) [] v))
  (defn append [xs x] (+ xs [x]))
  (defn joinText [xs] (reduce "" (fn [acc x] (+ acc x)) xs))

  (defn unwrapResponse [payload]
    (if (isnil (get payload :_content))
      payload
      (get (get (get payload :_content) :result) :value)))

  (def response (unwrapResponse inport))
  (return {:id (get response :id)
           :status (get response :status)
           :text (joinText
                   (map #(get %1 :text)
                        (get (get (get response :output) 0) :content))) }))
```

## Assistant Response Expectations

When assisting with LEAFlisp:

- State which local files or tests established the runtime behavior.
- Explain any host/runtime assumptions explicitly.
- Provide minimal LEAFlisp examples that match the discovered runtime.
- If behavior is uncertain, write or run a small local test rather than guessing.
- If no local runtime exists, consider using the `ghostos` npm package for a small LEAFlisp execution test, subject to the host repository's dependency policy.
- Report files changed, commands run, and remaining risks.
