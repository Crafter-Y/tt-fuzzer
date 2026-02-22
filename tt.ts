/**
 * Truth Table Generator
 * 
 * Generates truth tables for boolean expressions with variables.
 * Supports: & (AND), | (OR), ! (NOT), === (biconditional), parentheses
 */

type VariableValues = Record<string, boolean>;

/**
 * Extract unique variable names from expression (single uppercase letters)
 */
function extractVariables(expression: string): string[] {
  const matches = expression.match(/[A-Z]/g);
  if (!matches) return [];
  return [...new Set(matches)].sort();
}

/**
 * Generate all combinations of true/false for given variables
 */
function generateCombinations(variables: string[]): VariableValues[] {
  const count = variables.length;
  const totalCombinations = Math.pow(2, count);
  const combinations: VariableValues[] = [];

  for (let i = totalCombinations - 1; i >= 0; i--) {
    const values: VariableValues = {};
    for (let j = 0; j < count; j++) {
      // Assign true/false based on bit position (reversed to start with true)
      const variable = variables[j]!;
      values[variable] = Boolean((i >> (count - 1 - j)) & 1);
    }
    combinations.push(values);
  }

  return combinations;
}

/**
 * Evaluate a boolean expression with given variable values
 */
function evaluateExpression(expression: string, values: VariableValues): boolean {
  // Replace variables with their binary values (1/0)
  let evalExpr = expression;
  
  for (const [variable, value] of Object.entries(values)) {
    // Replace variable with 1 or 0
    evalExpr = evalExpr.replace(new RegExp(variable, 'g'), value ? '1' : '0');
  }

  // Evaluate the expression safely
  // We only allow: 0, 1, &, |, !, ===, (, ), whitespace
  const sanitized = evalExpr.replace(/\s+/g, '');
  if (!/^[01&|!=()]+$/.test(sanitized)) {
    throw new Error(`Invalid expression: ${expression}`);
  }

  try {
    // Using Function constructor to evaluate expression
    // Result is coerced to boolean
    return Boolean(new Function(`return ${evalExpr}`)());
  } catch (e) {
    throw new Error(`Failed to evaluate expression: ${expression}`);
  }
}

/**
 * Format boolean value for display
 */
function formatBool(value: boolean): string {
  return value ? 'T' : 'F';
}

/**
 * Format boolean value for LaTeX output
 */
function formatBoolLatex(value: boolean): string {
  return value ? '\\color{green}\\top' : '\\color{red}\\bot';
}

/**
 * Escape markdown table cell content
 */
function escapeMarkdownCell(content: string): string {
  return content.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

/**
 * Generate and print truth table for one or more boolean expressions side by side
 */
function generateTruthTable(...expressions: string[]): void {
  if (expressions.length === 0) {
    console.log('No expressions provided.');
    return;
  }

  // Extract all unique variables from all expressions
  const allVariables = new Set<string>();
  for (const expr of expressions) {
    for (const v of extractVariables(expr)) {
      allVariables.add(v);
    }
  }
  const variables = [...allVariables].sort();

  if (variables.length === 0) {
    console.log('No variables found in expressions.');
    return;
  }

  const combinations = generateCombinations(variables);

  // Build header with all expressions as column headers
  const exprHeaders = expressions.map((expr, i) => `E${i + 1}`);
  const allHeaders = [...variables, ...exprHeaders];
  const colWidths = allHeaders.map(h => Math.max(h.length, 1));
  
  const header = allHeaders.map((h, i) => h.padStart(colWidths[i]!)).join(' | ');
  const separator = colWidths.map(w => '-'.repeat(w)).join('-+-');

  // Print expression legend
  console.log(`\nExpressions:`);
  expressions.forEach((expr, i) => {
    console.log(`  E${i + 1}: ${expr}`);
  });
  console.log();

  console.log(header);
  console.log(separator);

  // Evaluate and print each row
  for (const values of combinations) {
    const results = expressions.map(expr => formatBool(evaluateExpression(expr, values)));
    const allValues = [
      ...variables.map(v => formatBool(values[v]!)),
      ...results
    ];
    const row = allValues.map((val, i) => val.padStart(colWidths[i]!)).join(' | ');
    console.log(row);
  }

  console.log();
}

/**
 * Generate a markdown + LaTeX truth table for one or more expressions
 * Returns the table as a string.
 */
function generateTruthTableLatex(...expressions: string[]): string {
  if (expressions.length === 0) {
    const message = 'No expressions provided.';
    console.log(message);
    return message;
  }

  // Use original expressions for headers, and LaTeX-converted expressions for evaluation
  const displayExpressions = expressions;
  const evalExpressions = expressions.map(expr => fromLatex(expr));

  // Extract all unique variables from all expressions
  const allVariables = new Set<string>();
  for (const expr of evalExpressions) {
    for (const v of extractVariables(expr)) {
      allVariables.add(v);
    }
  }
  const orderedVariables: string[] = [];
  const orderedSet = new Set<string>();
  const singleVarExpressionIndexes = new Set<number>();

  evalExpressions.forEach((expr, index) => {
    const compact = expr.replace(/\s+/g, '');
    if (/^[A-Z]$/.test(compact)) {
      const variable = compact;
      singleVarExpressionIndexes.add(index);
      if (allVariables.has(variable) && !orderedSet.has(variable)) {
        orderedSet.add(variable);
        orderedVariables.push(variable);
      }
    }
  });

  const remainingVariables = [...allVariables].filter(v => !orderedSet.has(v)).sort();
  const variables = [...orderedVariables, ...remainingVariables];

  if (variables.length === 0) {
    const message = 'No variables found in expressions.';
    console.log(message);
    return message;
  }

  const combinations = generateCombinations(variables);

  const expressionHeaders = displayExpressions.filter((_, i) => !singleVarExpressionIndexes.has(i));
  const expressionEval = evalExpressions.filter((_, i) => !singleVarExpressionIndexes.has(i));

  const headerCells = [...variables, ...expressionHeaders]
    .map(h => `$${escapeMarkdownCell(h)}$`);

  const dataRows = combinations.map(values => {
    const results = expressionEval.map(expr => formatBoolLatex(evaluateExpression(expr, values)));
    return [
      ...variables.map(v => formatBoolLatex(values[v]!)),
      ...results,
    ].map(val => `$${val}$`);
  });

  const colWidths = headerCells.map((cell, i) => {
    const maxDataWidth = Math.max(...dataRows.map(row => row[i]!.length));
    return Math.max(3, cell.length, maxDataWidth);
  });

  const formatRow = (cells: string[]) =>
    `| ${cells.map((cell, i) => cell.padEnd(colWidths[i]!)).join(' | ')} |`;

  const lines: string[] = [];
  lines.push(formatRow(headerCells));
  lines.push(`| ${colWidths.map(w => '-'.repeat(w)).join(' | ')} |`);
  for (const row of dataRows) {
    lines.push(formatRow(row));
  }

  const table = lines.join('\n');
  console.log(table);
  return table;
}

/**
 * Return truth table as a structured object
 */
function getTruthTable(expression: string): {
  variables: string[];
  expression: string;
  rows: { inputs: VariableValues; result: boolean }[];
} {
  const variables = extractVariables(expression);
  const combinations = generateCombinations(variables);

  const rows = combinations.map(values => ({
    inputs: values,
    result: evaluateExpression(expression, values)
  }));

  return { variables, expression, rows };
}

/**
 * Convert LaTeX boolean expression to JavaScript-style expression
 * 
 * Supported LaTeX operators:
 * - \lor → | (OR)
 * - \land → & (AND)
 * - \lnot, \neg → ! (NOT)
 * - \rightarrow, \to, \implies → implication (A → B = !A | B)
 * - \bot → 0
 * - \top → 1
 * - \leftrightarrow, \iff → biconditional (A ↔ B = A === B)
 * 
 * Note: For implication to work correctly, the left operand should be 
 * either a single variable or wrapped in parentheses.
 */
function fromLatex(expr: string): string {
  let result = expr;

  // Handle \overline{...} - overline notation for complement (NOT)
  // \overline{A} → !A, \overline{A \lor B} → !(A \lor B)
  // Processed first so inner LaTeX operators are handled by subsequent steps
  result = result.replace(/\\overline\{([^}]+)\}/g, (_, content) => {
    const trimmed = content.trim();
    if (/^[A-Z]$/.test(trimmed)) return `!${trimmed}`;
    return `!(${trimmed})`;
  });

  // Replace constants
  result = result.replace(/\\bot/g, '0');
  result = result.replace(/\\top/g, '1');

  // Replace simple operators
  result = result.replace(/\\lor/g, ' | ');
  result = result.replace(/\\land/g, ' & ');
  result = result.replace(/\\lnot\s*/g, '!');
  result = result.replace(/\\neg\s*/g, '!');
  
  // Handle biconditional (↔): A \leftrightarrow B = A === B
  result = result.replace(/\\(leftrightarrow|iff)/g, ' === ');
  
  // Handle implication: need to negate left side
  // A \rightarrow B = !A | B
  // We need to find the left operand and negate it
  
  const impPatterns = ['\\rightarrow', '\\to', '\\implies'];
  
  for (const impOp of impPatterns) {
    while (result.includes(impOp)) {
      const idx = result.indexOf(impOp);
      
      // Find left operand by walking backwards
      let leftEnd = idx - 1;
      // Skip whitespace
      while (leftEnd >= 0 && result[leftEnd] === ' ') leftEnd--;
      
      let leftStart = leftEnd;
      
      if (result[leftEnd] === ')') {
        // Find matching opening paren
        let depth = 1;
        leftStart = leftEnd - 1;
        while (leftStart >= 0 && depth > 0) {
          if (result[leftStart] === ')') depth++;
          if (result[leftStart] === '(') depth--;
          if (depth > 0) leftStart--;
        }
        // Check for leading ! operators
        while (leftStart > 0 && result[leftStart - 1] === '!') {
          leftStart--;
        }
      } else if (/[A-Z01]/.test(result[leftEnd] || '')) {
        // Single variable or constant
        leftStart = leftEnd;
        // Check for leading ! operators
        while (leftStart > 0 && result[leftStart - 1] === '!') {
          leftStart--;
        }
      } else {
        // Unknown pattern, skip this occurrence to avoid infinite loop
        console.warn('Warning: Cannot parse left operand for implication at:', result.substring(Math.max(0, idx - 20), idx + 15));
        result = result.substring(0, idx) + ' | ' + result.substring(idx + impOp.length);
        continue;
      }
      
      const leftOperand = result.substring(leftStart, leftEnd + 1);
      const before = result.substring(0, leftStart);
      const after = result.substring(idx + impOp.length);
      
      // Replace: leftOperand \rightarrow → !(leftOperand) |
      // If leftOperand is already in parens or is a simple term, don't add extra parens
      const needsParens = !(leftOperand.startsWith('(') || /^!*[A-Z01]$/.test(leftOperand));
      result = before + '!' + (needsParens ? '(' + leftOperand + ')' : leftOperand) + ' |' + after;
    }
  }
  
  // Clean up extra whitespace
  result = result.replace(/\s+/g, ' ').trim();

  return result;
}

// Terminal color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

/**
 * Clean LaTeX equation string by removing formatting artifacts
 */
function cleanLatexEquation(input: string): string {
  let result = input;
  
  // Remove \text{...} blocks
  result = result.replace(/\\text\{[^}]*\}/g, '');
  
  // Remove line breaks \\
  result = result.replace(/\\\\/g, '');
  
  // Remove $ signs
  result = result.replace(/\$/g, '');
  
  // Remove & alignment characters
  result = result.replace(/&/g, '');
  
  // Remove leading/trailing whitespace per line
  result = result.split('\n').map(line => line.trim()).join('\n');
  
  // Remove empty lines
  result = result.split('\n').filter(line => line.length > 0).join('\n');
  
  return result;
}

/**
 * Parse a multi-step equation and extract individual expressions
 */
function parseEquationSteps(input: string): string[] {
  const cleaned = cleanLatexEquation(input);
  
  // Split by = and clean each part
  const parts = cleaned.split('=').map(p => p.trim()).filter(p => p.length > 0);
  
  // Convert each LaTeX expression to JS
  return parts.map(p => fromLatex(p));
}

/**
 * Verify equality of expressions in a multi-step LaTeX equation
 * Prints a truth table comparing all steps with colored output for mismatches
 */
function verifyEquality(latexEquation: string): {
  allEqual: boolean;
  steps: string[];
  mismatches: number;
} {
  const steps = parseEquationSteps(latexEquation);
  
  if (steps.length < 2) {
    console.log('Need at least 2 expressions to compare.');
    return { allEqual: true, steps, mismatches: 0 };
  }

  // Extract all unique variables from all expressions
  const allVariables = new Set<string>();
  for (const expr of steps) {
    for (const v of extractVariables(expr)) {
      allVariables.add(v);
    }
  }
  const variables = [...allVariables].sort();

  if (variables.length === 0) {
    console.log('No variables found in expressions.');
    return { allEqual: true, steps, mismatches: 0 };
  }

  const combinations = generateCombinations(variables);

  // Print step legend
  console.log(`\n${colors.cyan}=== Equality Verification ===${colors.reset}\n`);
  console.log('Steps:');
  steps.forEach((expr, i) => {
    console.log(`  ${colors.yellow}S${i + 1}${colors.reset}: ${expr}`);
  });
  console.log();

  // Build header with proper column widths
  const stepHeaders = steps.map((_, i) => `S${i + 1}`);
  const allHeaders = [...variables, ...stepHeaders, 'EQ'];
  const colWidths = allHeaders.map(h => Math.max(h.length, 2));
  
  const header = allHeaders.map((h, i) => h.padStart(colWidths[i]!)).join(' | ');
  const separator = colWidths.map(w => '-'.repeat(w)).join('-+-');

  console.log(header);
  console.log(separator);

  let totalMismatches = 0;

  // Evaluate and print each row
  for (const values of combinations) {
    const results = steps.map(expr => evaluateExpression(expr, values));
    
    // Check if all results are equal
    const allEqual = results.every(r => r === results[0]);
    if (!allEqual) totalMismatches++;

    // Build row with colors
    const varValues = variables.map(v => formatBool(values[v]!));
    
    const resultParts = results.map((r, i) => {
      const formatted = formatBool(r);
      // Color mismatches: compare each to first result
      if (i > 0 && r !== results[0]) {
        return `${colors.red}${formatted}${colors.reset}`;
      }
      return formatted;
    });
    
    const eqSymbol = allEqual 
      ? `${colors.green}✓${colors.reset}`
      : `${colors.red}✗${colors.reset}`;

    const allValues = [...varValues, ...resultParts, eqSymbol];
    // Pad values (account for color codes having 0 visible width)
    const row = allValues.map((val, i) => {
      const visibleLen = val.replace(/\x1b\[[0-9;]*m/g, '').length;
      const padding = colWidths[i]! - visibleLen;
      return ' '.repeat(Math.max(0, padding)) + val;
    }).join(' | ');
    console.log(row);
  }

  console.log();
  
  if (totalMismatches === 0) {
    console.log(`${colors.green}✓ All steps are equivalent!${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ Found ${totalMismatches} row(s) with mismatches${colors.reset}`);
  }
  console.log();

  return {
    allEqual: totalMismatches === 0,
    steps,
    mismatches: totalMismatches,
  };
}

// Export functions for use as a module
export { 
  extractVariables, 
  generateCombinations, 
  evaluateExpression, 
  generateTruthTable, 
  generateTruthTableLatex,
  getTruthTable, 
  fromLatex,
  cleanLatexEquation,
  parseEquationSteps,
  verifyEquality,
};