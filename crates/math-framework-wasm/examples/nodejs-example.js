/**
 * Node.js example for math-framework-wasm
 *
 * To run:
 * 1. Build the WASM: ./build.sh nodejs
 * 2. Run: node examples/nodejs-example.js
 */

const wasm = require('../pkg-nodejs/math_framework_wasm');

async function main() {
    console.log('🧮 Math Framework WASM - Node.js Example\n');
    console.log('Version:', wasm.version());
    console.log('='.repeat(60));

    // ========================================================================
    // FIBONACCI & LUCAS SEQUENCES
    // ========================================================================
    console.log('\n📊 FIBONACCI & LUCAS SEQUENCES');
    console.log('-'.repeat(60));

    // Compute large Fibonacci numbers
    const f100 = wasm.fibonacci(100n);
    console.log('F(100) =', f100);

    const l20 = wasm.lucas(20);
    console.log('L(20) =', l20);

    // Golden ratio approximation
    const phi = wasm.golden_ratio(30);
    console.log('φ (golden ratio) ≈', phi);

    // Compute range of Fibonacci numbers
    const fibRange = JSON.parse(wasm.fibonacci_range(10, 15));
    console.log('F(10) to F(15):', fibRange);

    // ========================================================================
    // ZECKENDORF DECOMPOSITION
    // ========================================================================
    console.log('\n📐 ZECKENDORF DECOMPOSITION');
    console.log('-'.repeat(60));

    const z100 = wasm.zeckendorf(100);
    console.log('Zeckendorf(100):');
    console.log('  String form:', z100.toString());
    console.log('  Indices:', JSON.parse(z100.indices));
    console.log('  Numbers:', JSON.parse(z100.fibonacci_numbers));
    console.log('  Is valid?', z100.isValid());

    // Binary representation
    const binary = wasm.zeckendorf_to_binary(z100);
    console.log('  Binary:', binary);

    // Fibonacci weight and detection
    console.log('\nFibonacci weight of 100:', wasm.fibonacci_weight(100));
    console.log('Is 55 a Fibonacci number?', wasm.is_fibonacci(55));
    console.log('Is 56 a Fibonacci number?', wasm.is_fibonacci(56));

    // ========================================================================
    // BK DIVERGENCE
    // ========================================================================
    console.log('\n📈 BK DIVERGENCE (V, U, S)');
    console.log('-'.repeat(60));

    for (let n = 1; n <= 10; n++) {
        const v = wasm.bk_v(n);
        const u = wasm.bk_u(n);
        const s = wasm.bk_divergence(n);
        console.log(`n=${n.toString().padStart(2)}  V=${v.toString().padStart(3)}  U=${u.toString().padStart(4)}  S=${s.toString().padStart(5)}`);
    }

    // ========================================================================
    // PHASE SPACE COORDINATES
    // ========================================================================
    console.log('\n🌌 PHASE SPACE COORDINATES');
    console.log('-'.repeat(60));

    const point1 = new wasm.WasmPhaseSpacePoint(50);
    const point2 = new wasm.WasmPhaseSpacePoint(51);

    console.log('Point at n=50:');
    console.log('  V:', point1.v);
    console.log('  U:', point1.u);
    console.log('  S:', point1.s);
    console.log('  Coordinates: (', point1.x.toFixed(3), ',', point1.y.toFixed(3), ',', point1.z.toFixed(3), ')');

    const distance = point1.distanceTo(point2);
    console.log('\nDistance between n=50 and n=51:', distance.toFixed(6));

    // ========================================================================
    // TRAJECTORY ANALYSIS
    // ========================================================================
    console.log('\n🛤️  TRAJECTORY ANALYSIS');
    console.log('-'.repeat(60));

    const trajectory = new wasm.WasmTrajectory(1, 50);
    console.log('Trajectory from 1 to 50:');
    console.log('  Points:', trajectory.length);
    console.log('  Path length:', trajectory.pathLength().toFixed(3));

    // Find equilibria
    const equilibria = JSON.parse(trajectory.findEquilibria(0.1));
    console.log('  Equilibrium points (threshold=0.1):', equilibria.slice(0, 5), '...');

    // ========================================================================
    // NASH EQUILIBRIUM DETECTION
    // ========================================================================
    console.log('\n🎯 NASH EQUILIBRIUM DETECTION');
    console.log('-'.repeat(60));

    const longTrajectory = new wasm.WasmTrajectory(1, 100);
    const nashEquilibria = wasm.detect_nash_equilibria(longTrajectory, 5);

    console.log('Nash equilibria found:', nashEquilibria.length);
    if (nashEquilibria.length > 0) {
        for (let i = 0; i < Math.min(3, nashEquilibria.length); i++) {
            const eq = nashEquilibria[i];
            console.log(`  Equilibrium ${i + 1}:`);
            console.log(`    Position: ${eq.position}`);
            console.log(`    Stability: ${eq.stabilityScore.toFixed(4)}`);
            console.log(`    V=${eq.v}, U=${eq.u}, S=${eq.s}`);
        }
    }

    // ========================================================================
    // DIVERGENCE METRICS
    // ========================================================================
    console.log('\n📊 DIVERGENCE METRICS');
    console.log('-'.repeat(60));

    const metrics = new wasm.WasmDivergenceMetrics(1, 100);
    console.log('Metrics for range [1, 100]:');
    console.log('  Mean V:', metrics.meanV.toFixed(2));
    console.log('  Mean U:', metrics.meanU.toFixed(2));
    console.log('  Mean S:', metrics.meanS.toFixed(2));
    console.log('  Max V:', metrics.maxV);
    console.log('  Max U:', metrics.maxU);
    console.log('  Max S:', metrics.maxS);

    // ========================================================================
    // PERFORMANCE TEST
    // ========================================================================
    console.log('\n⚡ PERFORMANCE TEST');
    console.log('-'.repeat(60));

    console.time('Compute F(1000)');
    const f1000 = wasm.fibonacci(1000);
    console.timeEnd('Compute F(1000)');
    console.log('F(1000) has', f1000.length, 'digits');

    console.time('Zeckendorf(1000000)');
    const zBig = wasm.zeckendorf(1000000);
    console.timeEnd('Zeckendorf(1000000)');
    console.log('Zeckendorf(1000000) has', JSON.parse(zBig.indices).length, 'terms');

    console.time('BK divergence S(1000)');
    const s1000 = wasm.bk_divergence(1000);
    console.timeEnd('BK divergence S(1000)');
    console.log('S(1000) =', s1000);

    // Clean up
    wasm.clear_caches();
    console.log('\n✅ Example complete! Caches cleared.');
}

main().catch(console.error);
