import { fromLatex, generateTruthTable, verifyEquality } from "./tt";

console.log("=".repeat(60));
console.log("  TRUTH TABLE GENERATOR - EXAMPLES");
console.log("=".repeat(60));

// ============================================================================
// BASIC OPERATORS
// ============================================================================
console.log("\nBASIC OPERATORS\n");

console.log("Simple AND operation:");
generateTruthTable("A & B");

console.log("Simple OR operation:");
generateTruthTable("A | B");

console.log("Simple NOT operation:");
generateTruthTable("!A");

console.log("Comparing all basic operators:");
generateTruthTable("A & B", "A | B", "!A");

// ============================================================================
// COMPOUND EXPRESSIONS
// ============================================================================
console.log("\n\nCOMPOUND EXPRESSIONS\n");

console.log("XOR (exclusive OR) using A !== B:");
generateTruthTable("A", "B", "A !== B");

console.log("\nNAND operation:");
generateTruthTable("A & B", "!(A & B)");

console.log("\nNOR operation:");
generateTruthTable("A | B", "!(A | B)");

console.log("\nComplex expression with precedence:");
generateTruthTable("A | B & C", "(A | B) & C");

// ============================================================================
// LATEX NOTATION
// ============================================================================
console.log("\n\nLATEX NOTATION\n");

console.log("Using LaTeX operators:");
const latexExpr1 = fromLatex(String.raw`A \land B \lor C`);
console.log(`   LaTeX: A \\land B \\lor C`);
console.log(`   Converted: ${latexExpr1}`);
generateTruthTable(latexExpr1);

console.log("\nNegation in LaTeX:");
const latexExpr2 = fromLatex(String.raw`\neg(A \lor B)`);
console.log(`   LaTeX: \\neg(A \\lor B)`);
console.log(`   Converted: ${latexExpr2}`);
generateTruthTable(latexExpr2);

console.log("\nConstants in LaTeX:");
const latexExpr3 = fromLatex(String.raw`A \land \top \lor \bot`);
console.log(`   LaTeX: A \\land \\top \\lor \\bot`);
console.log(`   Converted: ${latexExpr3}`);
generateTruthTable(latexExpr3);

// ============================================================================
// IMPLICATION
// ============================================================================
console.log("\n\nIMPLICATION (A → B = !A | B)\n");
console.log("Simple implication:");
const impl1 = fromLatex(String.raw`A \rightarrow B`);
console.log(`   LaTeX: A \\rightarrow B`);
console.log(`   Converted: ${impl1}`);
generateTruthTable(impl1, "!A | B");

console.log("\nNested parentheses in implication:");
const impl2 = fromLatex(String.raw`((A \lor B)) \rightarrow C`);
console.log(`   LaTeX: ((A \\lor B)) \\rightarrow C`);
console.log(`   Converted: ${impl2}`);
generateTruthTable(impl2);

console.log("\nNegated expression as antecedent:");
const impl3 = fromLatex(String.raw`\neg(A \lor B) \rightarrow C`);
console.log(`   LaTeX: \\neg(A \\lor B) \\rightarrow C`);
console.log(`   Converted: ${impl3}`);
generateTruthTable(impl3);

console.log("\nConstant as antecedent:");
const impl4 = fromLatex(String.raw`\top \rightarrow A`);
console.log(`   LaTeX: \\top \\rightarrow A`);
console.log(`   Converted: ${impl4}`);
generateTruthTable(impl4);

console.log("\nChained implication:");
const impl5 = fromLatex(String.raw`A \rightarrow B \rightarrow C`);
console.log(`   LaTeX: A \\rightarrow B \\rightarrow C`);
console.log(`   Converted: ${impl5}`);
generateTruthTable(impl5);

// ============================================================================
// BICONDITIONAL
// ============================================================================
console.log("\n\nBICONDITIONAL (A ↔ B)\n");
console.log("Biconditional operator:");
const bicond1 = fromLatex(String.raw`A \leftrightarrow B`);
console.log(`   LaTeX: A \\leftrightarrow B`);
console.log(`   Converted: ${bicond1}`);
generateTruthTable(bicond1);

console.log("\nBiconditional equivalence:");
const bicond2 = fromLatex(String.raw`A \leftrightarrow B`);
const bicond3 = fromLatex(String.raw`(A \rightarrow B) \land (B \rightarrow A)`);
console.log(`   Comparing A ↔ B with (A → B) ∧ (B → A):`);
generateTruthTable(bicond2, bicond3);

// ============================================================================
// BOOLEAN ALGEBRA LAWS
// ============================================================================
console.log("\n\nBOOLEAN ALGEBRA LAWS\n");
console.log("DeMorgan's Law #1:");
verifyEquality(String.raw`
  \neg(A \lor B) &= \neg A \land \neg B \\
`);

console.log("\nDeMorgan's Law #2:");
verifyEquality(String.raw`
  \neg(A \land B) &= \neg A \lor \neg B \\
`);

console.log("\nDistributive Law:");
verifyEquality(String.raw`
  A \land (B \lor C) &= (A \land B) \lor (A \land C) \\
`);

console.log("\nAbsorption Law:");
verifyEquality(String.raw`
  A \lor (A \land B) &= A \\
`);

console.log("\nIdempotent Law:");
verifyEquality(String.raw`
  A \land A &= A \\
`);

console.log("\nDouble Negation:");
verifyEquality(String.raw`
  \neg\neg A &= A \\
`);

console.log("\nAssociativity:");
verifyEquality(String.raw`
  (A \lor B) \lor C &= A \lor (B \lor C) \\
`);

console.log("\nCommutativity:");
verifyEquality(String.raw`
  A \land B &= B \land A \\
`);

// ============================================================================
// COMPLEX PROOFS
// ============================================================================
console.log("\n\nCOMPLEX MULTI-STEP PROOFS\n");

console.log("Simplification proof:");
verifyEquality(String.raw`
  (A \lor B) \land (A \lor \neg B) 
    &= A \lor (B \land \neg B) &\text{(Distributive)} \\
    &= A \lor \bot &\text{(Contradiction)} \\
    &= A &\text{(Identity)} \\
`);

console.log("\nContrapositive equivalence:");
verifyEquality(String.raw`
  A \rightarrow B 
    &= \neg A \lor B &\text{(Implication)} \\
    &= B \lor \neg A &\text{(Commutative)} \\
    &= \neg B \rightarrow \neg A &\text{(Contrapositive)} \\
`);

console.log("\nConsensus theorem:");
verifyEquality(String.raw`
  (A \land B) \lor (\neg A \land C) \lor (B \land C)
    &= (A \land B) \lor (\neg A \land C) \\
`);

console.log("\nMaterial implication equivalences:");
verifyEquality(String.raw`
  A \rightarrow B
    &= \neg A \lor B &\text{(Definition)} \\
    &= \neg(A \land \neg B) &\text{(DeMorgan)} \\
`);

// ============================================================================
// REAL-WORLD LOGIC
// ============================================================================
console.log("\n\nREAL-WORLD LOGIC EXAMPLES\n");

console.log("'If it rains, I bring an umbrella':");
console.log("   Let R = it rains, U = I bring umbrella");
console.log("   R → U");
const rain = fromLatex(String.raw`R \rightarrow U`);
generateTruthTable(rain);

console.log("\nThe alarm sounds if motion is detected AND the system is armed':");
console.log("   Let M = motion detected, S = system armed, A = alarm sounds");
console.log("   (M ∧ S) → A");
const alarm = fromLatex(String.raw`(M \land S) \rightarrow A`);
generateTruthTable(alarm);

console.log("\nI exercise if and only if I'm not tired':");
console.log("   Let E = I exercise, T = I'm tired");
console.log("   E ↔ ¬T");
const exercise = fromLatex(String.raw`E \leftrightarrow \neg T`);
generateTruthTable(exercise);

// ============================================================================
// EDGE CASES
// ============================================================================
console.log("\n\nEDGE CASES & SPECIAL SCENARIOS\n");

console.log("Tautology (always true):");
generateTruthTable("A | !A");

console.log("\nContradiction (always false):");
generateTruthTable("A & !A");

console.log("\nFour variables:");
generateTruthTable("(A & B) | (C & D)");

console.log("\nDeeply nested expression:");
generateTruthTable("!((A | B) & !(C | !D))");

console.log("\nAll operators together:");
const complex = fromLatex(String.raw`
  (A \land B) \lor (\neg C \rightarrow D) \leftrightarrow (A \lor \neg D)
`);
console.log(`   ${complex}`);
generateTruthTable(complex);

console.log("\n" + "=".repeat(60));
console.log("  END OF EXAMPLES");
console.log("=".repeat(60) + "\n");