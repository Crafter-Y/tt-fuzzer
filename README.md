# tt-fuzzer

Gernerate truth tables from boolean expressions with support for LaTeX notation. Built with Bun.

Well yes, this is **not** a fuzzer. But unlike a fuzzer, it tries every possible combination in a deterministic way.

## Installation

```bash
bun install
```

## Quick Start

```typescript
import { generateTruthTable, fromLatex, verifyEquality } from "./tt";

// Generate a simple truth table
generateTruthTable("A & B");

// Compare multiple expressions
generateTruthTable("A & B", "A | B", "!(A | B)");

// Use LaTeX notation
const expr = fromLatex("(A \\lor B) \\land \\neg C");
generateTruthTable(expr);

// Verify multi-step equality
const equation = String.raw`
  A \land (B \lor C) &= (A \land B) \lor (A \land C) &\text{(Distributive)}
`;
verifyEquality(equation);
```

## Supported Operators

### JavaScript Notation

| Operator | Symbol | Description |
|----------|--------|-------------|
| AND      | `&`    | Bitwise AND |
| OR       | `\|`   | Bitwise OR  |
| NOT      | `!`    | Logical NOT |
| Biconditional | `===` | Equality check |

### LaTeX Notation

| LaTeX | Converts To | Description |
|-------|-------------|-------------|
| `\lor` | `\|` | OR |
| `\land` | `&` | AND |
| `\lnot`, `\neg` | `!` | NOT |
| `\rightarrow`, `\to`, `\implies` | `!A \| B` | Implication (A → B) |
| `\leftrightarrow`, `\iff` | `===` | Biconditional (A ↔ B) |
| `\bot` | `0` | False constant |
| `\top` | `1` | True constant |
| `\overline{X}` | `!X` | NOT (overline/complement) |

## API Reference

### `generateTruthTable(...expressions: string[])`

Generate and print a truth table for one or more expressions.

```typescript
generateTruthTable("A & B");
generateTruthTable("A & B", "A | B", "A === B");
```

Output:
```
Expressions:
  E1: A & B
  E2: A | B
  E3: A === B

A | B | E1 | E2 | E3
--+---+----+----+---
T | T |  T |  T |  T
T | F |  F |  T |  F
F | T |  F |  T |  F
F | F |  F |  F |  T
```

### `generateTruthTableLatex(...expressions: string[])`

Generate a markdown table where every header and cell is in LaTeX math mode.

```typescript
const table = generateTruthTableLatex(
  String.raw`S \\leftrightarrow \\neg N`,
  String.raw`S \\leftrightarrow N`,
);
console.log(table);
```

Output:
```
| $S$                 | $N$                 | $S \leftrightarrow \neg N$ | $S \leftrightarrow N$ |
| ------------------- | ------------------- | -------------------------- | --------------------- |
| $\color{green}\top$ | $\color{green}\top$ | $\color{red}\bot$          | $\color{green}\top$   |
| $\color{green}\top$ | $\color{red}\bot$   | $\color{green}\top$        | $\color{red}\bot$     |
| $\color{red}\bot$   | $\color{green}\top$ | $\color{green}\top$        | $\color{red}\bot$     |
| $\color{red}\bot$   | $\color{red}\bot$   | $\color{red}\bot$          | $\color{green}\top$   |
```

### `fromLatex(expr: string): string`

Convert LaTeX boolean expression to JavaScript syntax.

```typescript
fromLatex("A \\lor B");              // "A | B"
fromLatex("\\neg(A \\land B)");      // "!(A & B)"
fromLatex("A \\rightarrow B");       // "!A | B"
fromLatex("A \\leftrightarrow B");   // "A === B"
fromLatex("\\overline{A}");          // "!A"
fromLatex("\\overline{A \\lor B}");  // "!(A | B)"
```

### `verifyEquality(latexEquation: string)`

Verify equality of multi-step LaTeX equations with colored output.

```typescript
const equation = String.raw`
  \neg(A \lor B) &= \neg A \land \neg B &\text{(DeMorgan)} \\
`;

verifyEquality(equation);
```

Output shows truth table with:
- ✅ Green checkmarks for matching rows
- ❌ Red highlighting for mismatches

### `getTruthTable(expression: string)`

Get truth table as a structured data object.

```typescript
const table = getTruthTable("A & B");
// Returns: {
//   variables: ["A", "B"],
//   expression: "A & B",
//   rows: [
//     { inputs: { A: true, B: true }, result: true },
//     { inputs: { A: true, B: false }, result: false },
//     ...
//   ]
// }
```

### `evaluateExpression(expression: string, values: Record<string, boolean>): boolean`

Evaluate a boolean expression with given variable values.

```typescript
evaluateExpression("A & B", { A: true, B: false });  // false
```

## Examples

### DeMorgan's Laws

```typescript
verifyEquality(String.raw`
  \neg(A \lor B) &= \neg A \land \neg B \\
`);

verifyEquality(String.raw`
  \neg(A \land B) &= \neg A \lor \neg B \\
`);
```

### Implication

```typescript
// A → B is equivalent to ¬A ∨ B
generateTruthTable(
  fromLatex("A \\rightarrow B"),
  fromLatex("\\neg A \\lor B")
);
```

### Complex Proof

```typescript
const proof = String.raw`
  ((A \lor B) \lor C) \land (A \lor (B \lor C)) 
    &= ((A \lor B) \lor C) \land ((A \lor B) \lor C) &\text{(Assoc.)} \\
    &= (((A \lor B) \lor C) \land ((A \lor B) \lor C)) \lor \bot &\text{(Neutral)} \\
    &= ((A \lor B) \lor C) &\text{(Idempotent)}
`;

verifyEquality(proof);
```

## Testing

Run the test suite:

```bash
bun test
```

## Development

Type checking:

```bash
bun lint
```

## License

CC BY 4.0

tt-fuzzer (c) by Crafter-Y

tt-fuzzer is licensed under a
Creative Commons Attribution 4.0 International License.

You should have received a copy of the license along with this
work. If not, see <https://creativecommons.org/licenses/by/4.0/>.