/**
 * Math Framework REPL
 * Interactive Read-Eval-Print Loop for mathematical framework
 *
 * Commands:
 *   fib(n) - Compute Fibonacci number
 *   lucas(n) - Compute Lucas number
 *   zeck(n) - Zeckendorf decomposition
 *   divergence(n) - B-K divergence S(n)
 *   nash(n) - Find Nash points up to n
 *   phase(n) - Phase space coordinates
 *   train(config) - Train neural network
 *   help - Show help
 *   exit - Exit REPL
 */

import * as readline from 'readline';
import { MathFramework } from './framework';

/**
 * REPL state
 */
interface REPLState {
  mf: MathFramework;
  history: string[];
  variables: Map<string, any>;
}

/**
 * Initialize REPL state
 */
function createREPLState(): REPLState {
  return {
    mf: new MathFramework(),
    history: [],
    variables: new Map()
  };
}

/**
 * Format large numbers for display
 */
function formatNumber(n: any): string {
  if (typeof n === 'bigint') {
    const str = n.toString();
    if (str.length > 50) {
      return `${str.slice(0, 20)}...${str.slice(-20)} (${str.length} digits)`;
    }
    return str;
  }
  if (typeof n === 'number') {
    return n.toString();
  }
  return String(n);
}

/**
 * Evaluate REPL command
 */
async function evaluateCommand(input: string, state: REPLState): Promise<string> {
  const trimmed = input.trim();

  // Empty input
  if (!trimmed) {
    return '';
  }

  // Add to history
  state.history.push(trimmed);

  // Exit command
  if (trimmed === 'exit' || trimmed === 'quit') {
    console.log('Goodbye!');
    process.exit(0);
  }

  // Help command
  if (trimmed === 'help' || trimmed === '?') {
    return `
Math Framework REPL - Interactive Commands

SEQUENCE OPERATIONS:
  fib(n)           - Compute Fibonacci number F(n)
  lucas(n)         - Compute Lucas number L(n)
  zeck(n)          - Zeckendorf decomposition of n

DIVERGENCE & NASH:
  divergence(n)    - Compute B-K divergence S(n)
  nash(n)          - Find Nash points in [0, n]

PHASE SPACE:
  phase(n)         - Phase space coordinates at n
  trajectory(s,e)  - Phase trajectory from s to e

NEURAL NETWORK:
  createNN(config) - Create neural network
  train(data)      - Train neural network

UTILITY:
  verify(n)        - Verify mathematical properties
  profile(n)       - Compute complete profile
  vars             - Show variables
  history          - Show command history
  clear            - Clear screen
  help             - Show this help
  exit             - Exit REPL

EXAMPLES:
  > fib(100)
  > zeck(42)
  > nash(100)
  > x = divergence(10)
  > phase(50)
`;
  }

  // History command
  if (trimmed === 'history') {
    return state.history.map((cmd, i) => `${i + 1}: ${cmd}`).join('\n');
  }

  // Variables command
  if (trimmed === 'vars' || trimmed === 'variables') {
    if (state.variables.size === 0) {
      return 'No variables defined';
    }
    const vars: string[] = [];
    state.variables.forEach((value, key) => {
      vars.push(`${key} = ${formatNumber(value)}`);
    });
    return vars.join('\n');
  }

  // Clear command
  if (trimmed === 'clear' || trimmed === 'cls') {
    console.clear();
    return '';
  }

  try {
    // Variable assignment: x = expression
    if (trimmed.includes('=') && !trimmed.includes('==')) {
      const [varName, expression] = trimmed.split('=').map(s => s.trim());
      if (varName && expression) {
        const result = await evaluateExpression(expression, state);
        state.variables.set(varName, result);
        return `${varName} = ${formatNumber(result)}`;
      }
    }

    // Evaluate expression
    const result = await evaluateExpression(trimmed, state);
    return formatResult(result);
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : error}`;
  }
}

/**
 * Evaluate expression
 */
async function evaluateExpression(expr: string, state: REPLState): Promise<any> {
  const { mf, variables } = state;

  // Replace variables
  let processedExpr = expr;
  variables.forEach((value, key) => {
    processedExpr = processedExpr.replace(new RegExp(`\\b${key}\\b`, 'g'), String(value));
  });

  // Parse function calls
  // fib(n)
  if (/^fib(?:onacci)?\(\s*(\d+)\s*\)$/i.test(processedExpr)) {
    const match = processedExpr.match(/^fib(?:onacci)?\(\s*(\d+)\s*\)$/i);
    const n = parseInt(match![1], 10);
    return mf.fibonacci(n);
  }

  // lucas(n)
  if (/^lucas\(\s*(\d+)\s*\)$/i.test(processedExpr)) {
    const match = processedExpr.match(/^lucas\(\s*(\d+)\s*\)$/i);
    const n = parseInt(match![1], 10);
    return mf.lucas(n);
  }

  // zeck(n)
  if (/^zeck(?:endorf)?\(\s*(\d+)\s*\)$/i.test(processedExpr)) {
    const match = processedExpr.match(/^zeck(?:endorf)?\(\s*(\d+)\s*\)$/i);
    const n = parseInt(match![1], 10);
    return mf.zeckendorf(n);
  }

  // divergence(n)
  if (/^(?:divergence|bk)\(\s*(\d+)\s*\)$/i.test(processedExpr)) {
    const match = processedExpr.match(/^(?:divergence|bk)\(\s*(\d+)\s*\)$/i);
    const n = parseInt(match![1], 10);
    return mf.divergence(n);
  }

  // nash(n)
  if (/^nash\(\s*(\d+)\s*\)$/i.test(processedExpr)) {
    const match = processedExpr.match(/^nash\(\s*(\d+)\s*\)$/i);
    const n = parseInt(match![1], 10);
    return mf.findNashPoints(n);
  }

  // phase(n)
  if (/^phase\(\s*(\d+)\s*\)$/i.test(processedExpr)) {
    const match = processedExpr.match(/^phase\(\s*(\d+)\s*\)$/i);
    const n = parseInt(match![1], 10);
    return mf.phaseSpace(n);
  }

  // trajectory(start, end)
  if (/^trajectory\(\s*(\d+)\s*,\s*(\d+)\s*\)$/i.test(processedExpr)) {
    const match = processedExpr.match(/^trajectory\(\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
    const start = parseInt(match![1], 10);
    const end = parseInt(match![2], 10);
    return mf.phaseTrajectory(start, end);
  }

  // verify(n)
  if (/^verify\(\s*(\d+)\s*\)$/i.test(processedExpr)) {
    const match = processedExpr.match(/^verify\(\s*(\d+)\s*\)$/i);
    const n = parseInt(match![1], 10);
    return mf.verify(n);
  }

  // profile(n)
  if (/^profile\(\s*(\d+)\s*\)$/i.test(processedExpr)) {
    const match = processedExpr.match(/^profile\(\s*(\d+)\s*\)$/i);
    const n = parseInt(match![1], 10);
    return mf.computeProfile(n);
  }

  // If just a number, return it
  if (/^\d+$/.test(processedExpr)) {
    return parseInt(processedExpr, 10);
  }

  // If variable name, return its value
  if (variables.has(processedExpr)) {
    return variables.get(processedExpr);
  }

  throw new Error(`Unknown command or expression: ${expr}`);
}

/**
 * Format result for display
 */
function formatResult(result: any): string {
  if (result === null || result === undefined) {
    return String(result);
  }

  if (typeof result === 'bigint' || typeof result === 'number') {
    return formatNumber(result);
  }

  if (Array.isArray(result)) {
    if (result.length === 0) {
      return '[]';
    }
    if (result.length <= 10) {
      return `[${result.map(formatNumber).join(', ')}]`;
    }
    return `[${result.slice(0, 5).map(formatNumber).join(', ')}, ... (${result.length} items)]`;
  }

  if (typeof result === 'object') {
    // Special formatting for specific types
    if ('representation' in result) {
      // Zeckendorf result
      return result.representation;
    }

    if ('phi' in result && 'psi' in result) {
      // Phase space coordinates
      return `φ=${result.phi.toFixed(6)}, ψ=${result.psi.toFixed(6)}, θ=${result.theta.toFixed(6)} rad`;
    }

    if ('bkTheoremVerified' in result) {
      // Verification result
      const lines = [
        `B-K Theorem: ${result.bkTheoremVerified ? '✓' : '✗'}`,
        `Nash Consistent: ${result.nashPointsConsistent ? '✓' : '✗'}`,
        `Zeckendorf Valid: ${result.zeckendorfValid ? '✓' : '✗'}`
      ];
      if (result.violations.length > 0) {
        lines.push(`Violations: ${result.violations.length}`);
      }
      return lines.join('\n');
    }

    // Generic object formatting
    return JSON.stringify(result, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value,
      2
    );
  }

  return String(result);
}

/**
 * Start REPL
 */
export async function startREPL(): Promise<void> {
  const state = createREPLState();

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║         Math Framework REPL v2.0.0                          ║');
  console.log('║  Fibonacci • Lucas • Nash • Phase Space • Neural Networks   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('Type "help" for available commands, "exit" to quit');
  console.log('');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> '
  });

  rl.prompt();

  rl.on('line', async (input: string) => {
    const result = await evaluateCommand(input, state);
    if (result) {
      console.log(result);
    }
    rl.prompt();
  });

  rl.on('close', () => {
    console.log('\nGoodbye!');
    process.exit(0);
  });
}

// Export for use as module
export default startREPL;
