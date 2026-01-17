import { test, expect, describe } from "bun:test";
import {
  extractVariables,
  generateCombinations,
  evaluateExpression,
  fromLatex,
  getTruthTable,
} from "./tt";

describe("extractVariables", () => {
  test("extracts single variable", () => {
    expect(extractVariables("A")).toEqual(["A"]);
  });

  test("extracts multiple variables", () => {
    expect(extractVariables("A & B | C")).toEqual(["A", "B", "C"]);
  });

  test("removes duplicates and sorts", () => {
    expect(extractVariables("B & A & B & C & A")).toEqual(["A", "B", "C"]);
  });

  test("returns empty array for no variables", () => {
    expect(extractVariables("1 & 0")).toEqual([]);
  });
});

describe("generateCombinations", () => {
  test("generates correct combinations for 1 variable", () => {
    const result = generateCombinations(["A"]);
    expect(result).toEqual([{ A: true }, { A: false }]);
  });

  test("generates correct combinations for 2 variables", () => {
    const result = generateCombinations(["A", "B"]);
    expect(result).toEqual([
      { A: true, B: true },
      { A: true, B: false },
      { A: false, B: true },
      { A: false, B: false },
    ]);
  });

  test("generates 2^n combinations", () => {
    expect(generateCombinations(["A", "B", "C"]).length).toBe(8);
    expect(generateCombinations(["A", "B", "C", "D"]).length).toBe(16);
  });
});

describe("evaluateExpression", () => {
  test("evaluates AND operation", () => {
    expect(evaluateExpression("A & B", { A: true, B: true })).toBe(true);
    expect(evaluateExpression("A & B", { A: true, B: false })).toBe(false);
    expect(evaluateExpression("A & B", { A: false, B: true })).toBe(false);
    expect(evaluateExpression("A & B", { A: false, B: false })).toBe(false);
  });

  test("evaluates OR operation", () => {
    expect(evaluateExpression("A | B", { A: true, B: true })).toBe(true);
    expect(evaluateExpression("A | B", { A: true, B: false })).toBe(true);
    expect(evaluateExpression("A | B", { A: false, B: true })).toBe(true);
    expect(evaluateExpression("A | B", { A: false, B: false })).toBe(false);
  });

  test("evaluates NOT operation", () => {
    expect(evaluateExpression("!A", { A: true })).toBe(false);
    expect(evaluateExpression("!A", { A: false })).toBe(true);
  });

  test("evaluates biconditional (===)", () => {
    expect(evaluateExpression("A === B", { A: true, B: true })).toBe(true);
    expect(evaluateExpression("A === B", { A: true, B: false })).toBe(false);
    expect(evaluateExpression("A === B", { A: false, B: true })).toBe(false);
    expect(evaluateExpression("A === B", { A: false, B: false })).toBe(true);
  });

  test("evaluates constants", () => {
    expect(evaluateExpression("1", {})).toBe(true);
    expect(evaluateExpression("0", {})).toBe(false);
    expect(evaluateExpression("1 & 0", {})).toBe(false);
    expect(evaluateExpression("1 | 0", {})).toBe(true);
  });

  test("evaluates complex expressions", () => {
    expect(evaluateExpression("(A & B) | C", { A: true, B: true, C: false })).toBe(true);
    expect(evaluateExpression("A & (B | C)", { A: true, B: false, C: false })).toBe(false);
    expect(evaluateExpression("!(A | B)", { A: false, B: false })).toBe(true);
  });

  test("respects operator precedence", () => {
    // In bitwise: ! > & > |
    // A | B & C should be parsed as A | (B & C)
    expect(evaluateExpression("A | B & C", { A: false, B: true, C: true })).toBe(true);
    expect(evaluateExpression("A | B & C", { A: false, B: true, C: false })).toBe(false);
    expect(evaluateExpression("A | B & C", { A: false, B: false, C: true })).toBe(false);
  });
});

describe("fromLatex - basic operators", () => {
  test("converts \\lor to |", () => {
    expect(fromLatex("A \\lor B")).toBe("A | B");
  });

  test("converts \\land to &", () => {
    expect(fromLatex("A \\land B")).toBe("A & B");
  });

  test("converts \\lnot to !", () => {
    expect(fromLatex("\\lnot A")).toBe("!A");
  });

  test("converts \\neg to !", () => {
    expect(fromLatex("\\neg A")).toBe("!A");
  });

  test("converts \\bot to 0", () => {
    expect(fromLatex("\\bot")).toBe("0");
  });

  test("converts \\top to 1", () => {
    expect(fromLatex("\\top")).toBe("1");
  });

  test("converts \\leftrightarrow to ===", () => {
    expect(fromLatex("A \\leftrightarrow B")).toBe("A === B");
  });

  test("converts \\iff to ===", () => {
    expect(fromLatex("A \\iff B")).toBe("A === B");
  });
});

describe("fromLatex - implication", () => {
  test("converts simple implication", () => {
    const result = fromLatex("A \\rightarrow B");
    expect(result).toBe("!A | B");
  });

  test("converts \\to", () => {
    const result = fromLatex("A \\to B");
    expect(result).toBe("!A | B");
  });

  test("converts \\implies", () => {
    const result = fromLatex("A \\implies B");
    expect(result).toBe("!A | B");
  });

  test("handles parenthesized left operand", () => {
    const result = fromLatex("(A \\lor B) \\rightarrow C");
    expect(result).toBe("!(A | B) | C");
  });

  test("handles nested parentheses", () => {
    const result = fromLatex("((A \\lor B)) \\rightarrow C");
    expect(result).toBe("!((A | B)) | C");
  });

  test("handles negated left operand", () => {
    const result = fromLatex("\\neg A \\rightarrow B");
    expect(result).toBe("!!A | B");
  });

  test("handles negated parenthesized left operand", () => {
    const result = fromLatex("\\neg(A \\lor B) \\rightarrow C");
    // !(A | B) starts with ! but is not simple, so it needs wrapping
    expect(result).toBe("!(!(A | B)) | C");
  });

  test("handles constant left operand", () => {
    expect(fromLatex("\\top \\rightarrow A")).toBe("!1 | A");
    expect(fromLatex("\\bot \\rightarrow A")).toBe("!0 | A");
  });

  test("handles chained implications (right-associative)", () => {
    const result = fromLatex("A \\rightarrow B \\rightarrow C");
    // A → (B → C) = !A | (!B | C)
    expect(result).toContain("!A");
    expect(result).toContain("!B");
  });
});

describe("fromLatex - complex expressions", () => {
  test("converts mixed operators", () => {
    const result = fromLatex("(A \\land B) \\lor (C \\land \\neg D)");
    expect(result).toBe("(A & B) | (C & !D)");
  });

  test("handles nested structures", () => {
    const result = fromLatex("((A \\lor B) \\land C) \\lor (D \\land E)");
    expect(result).toBe("((A | B) & C) | (D & E)");
  });
});

describe("operator precedence verification", () => {
  test("bitwise & has higher precedence than |", () => {
    // 0 | 1 & 0 should be 0 | (1 & 0) = 0 | 0 = 0
    expect(evaluateExpression("0 | 1 & 0", {})).toBe(false);
    
    // 1 | 0 & 0 should be 1 | (0 & 0) = 1 | 0 = 1
    expect(evaluateExpression("1 | 0 & 0", {})).toBe(true);
  });

  test("! has higher precedence than &", () => {
    // !0 & 1 should be (!0) & 1 = 1 & 1 = 1
    expect(evaluateExpression("!0 & 1", {})).toBe(true);
    
    // !1 & 1 should be (!1) & 1 = 0 & 1 = 0
    expect(evaluateExpression("!1 & 1", {})).toBe(false);
  });

  test("precedence order: ! > & > |", () => {
    // A | !B & C with A=F, B=F, C=T
    // should be: A | ((!B) & C) = F | (T & T) = F | T = T
    expect(evaluateExpression("A | !B & C", { A: false, B: false, C: true })).toBe(true);
    
    // A | !B & C with A=F, B=T, C=T
    // should be: A | ((!B) & C) = F | (F & T) = F | F = F
    expect(evaluateExpression("A | !B & C", { A: false, B: true, C: true })).toBe(false);
  });
});

describe("truth table generation", () => {
  test("generates correct truth table for AND", () => {
    const table = getTruthTable("A & B");
    expect(table.variables).toEqual(["A", "B"]);
    expect(table.rows).toHaveLength(4);
    expect(table.rows[0]?.result).toBe(true); // T, T
    expect(table.rows[1]?.result).toBe(false); // T, F
    expect(table.rows[2]?.result).toBe(false); // F, T
    expect(table.rows[3]?.result).toBe(false); // F, F
  });

  test("generates correct truth table for implication", () => {
    const table = getTruthTable("!(A) | B"); // A → B
    expect(table.variables).toEqual(["A", "B"]);
    expect(table.rows[0]?.result).toBe(true); // T → T = T
    expect(table.rows[1]?.result).toBe(false); // T → F = F
    expect(table.rows[2]?.result).toBe(true); // F → T = T
    expect(table.rows[3]?.result).toBe(true); // F → F = T
  });

  test("generates correct truth table for biconditional", () => {
    const table = getTruthTable("A === B");
    expect(table.variables).toEqual(["A", "B"]);
    expect(table.rows[0]?.result).toBe(true); // T ↔ T = T
    expect(table.rows[1]?.result).toBe(false); // T ↔ F = F
    expect(table.rows[2]?.result).toBe(false); // F ↔ T = F
    expect(table.rows[3]?.result).toBe(true); // F ↔ F = T
  });
});

describe("integration tests", () => {
  test("DeMorgan's law: !(A | B) = !A & !B", () => {
    const expr1 = getTruthTable("!(A | B)");
    const expr2 = getTruthTable("!A & !B");
    
    expect(expr1.rows.length).toBe(expr2.rows.length);
    for (let i = 0; i < expr1.rows.length; i++) {
      expect(expr1.rows[i]?.result).toBe(expr2.rows[i]?.result);
    }
  });

  test("DeMorgan's law: !(A & B) = !A | !B", () => {
    const expr1 = getTruthTable("!(A & B)");
    const expr2 = getTruthTable("!A | !B");
    
    expect(expr1.rows.length).toBe(expr2.rows.length);
    for (let i = 0; i < expr1.rows.length; i++) {
      expect(expr1.rows[i]?.result).toBe(expr2.rows[i]?.result);
    }
  });

  test("Distributive law: A & (B | C) = (A & B) | (A & C)", () => {
    const expr1 = getTruthTable("A & (B | C)");
    const expr2 = getTruthTable("(A & B) | (A & C)");
    
    for (let i = 0; i < expr1.rows.length; i++) {
      expect(expr1.rows[i]?.result).toBe(expr2.rows[i]?.result);
    }
  });

  test("Implication equivalence: A → B = !A | B", () => {
    const latex = fromLatex("A \\rightarrow B");
    const manual = "!A | B";
    
    const table1 = getTruthTable(latex);
    const table2 = getTruthTable(manual);
    
    for (let i = 0; i < table1.rows.length; i++) {
      expect(table1.rows[i]?.result).toBe(table2.rows[i]?.result);
    }
  });

  test("Biconditional: A ↔ B = (A → B) & (B → A)", () => {
    const biconditional = getTruthTable("A === B");
    const implication = getTruthTable("(!(A) | B) & (!(B) | A)");
    
    for (let i = 0; i < biconditional.rows.length; i++) {
      expect(biconditional.rows[i]?.result).toBe(implication.rows[i]?.result);
    }
  });
});
