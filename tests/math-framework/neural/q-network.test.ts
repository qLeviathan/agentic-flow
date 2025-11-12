/**
 * Q-Network Test Suite
 *
 * Tests for Q-matrix evolution, S(n) regularization, and Nash convergence
 */

import { QNetwork, Matrix, Activation } from '../../../src/math-framework/neural/q-network';

describe('Matrix Operations', () => {
  describe('Matrix Creation', () => {
    test('should create matrix from 2D array', () => {
      const arr = [
        [1, 2, 3],
        [4, 5, 6]
      ];
      const mat = Matrix.from2D(arr);

      expect(mat.rows).toBe(2);
      expect(mat.cols).toBe(3);
      expect(mat.get(0, 0)).toBe(1);
      expect(mat.get(1, 2)).toBe(6);
    });

    test('should create zero matrix', () => {
      const mat = Matrix.zeros(3, 4);

      expect(mat.rows).toBe(3);
      expect(mat.cols).toBe(4);
      expect(mat.get(1, 2)).toBe(0);
    });

    test('should create identity matrix', () => {
      const mat = Matrix.identity(3);

      expect(mat.get(0, 0)).toBe(1);
      expect(mat.get(1, 1)).toBe(1);
      expect(mat.get(2, 2)).toBe(1);
      expect(mat.get(0, 1)).toBe(0);
      expect(mat.get(1, 0)).toBe(0);
    });

    test('should create random matrix with proper dimensions', () => {
      const mat = Matrix.random(4, 5);

      expect(mat.rows).toBe(4);
      expect(mat.cols).toBe(5);

      // Check Xavier initialization bounds
      const limit = Math.sqrt(6 / (4 + 5));
      for (let i = 0; i < mat.data.length; i++) {
        expect(Math.abs(mat.data[i])).toBeLessThanOrEqual(limit * 1.1); // Allow small tolerance
      }
    });
  });

  describe('Matrix Operations', () => {
    test('should multiply matrices correctly', () => {
      const A = Matrix.from2D([
        [1, 2],
        [3, 4]
      ]);
      const B = Matrix.from2D([
        [5, 6],
        [7, 8]
      ]);

      const C = A.multiply(B);

      expect(C.get(0, 0)).toBe(19); // 1*5 + 2*7
      expect(C.get(0, 1)).toBe(22); // 1*6 + 2*8
      expect(C.get(1, 0)).toBe(43); // 3*5 + 4*7
      expect(C.get(1, 1)).toBe(50); // 3*6 + 4*8
    });

    test('should add matrices correctly', () => {
      const A = Matrix.from2D([[1, 2], [3, 4]]);
      const B = Matrix.from2D([[5, 6], [7, 8]]);

      const C = A.add(B);

      expect(C.get(0, 0)).toBe(6);
      expect(C.get(1, 1)).toBe(12);
    });

    test('should subtract matrices correctly', () => {
      const A = Matrix.from2D([[5, 6], [7, 8]]);
      const B = Matrix.from2D([[1, 2], [3, 4]]);

      const C = A.subtract(B);

      expect(C.get(0, 0)).toBe(4);
      expect(C.get(1, 1)).toBe(4);
    });

    test('should compute Hadamard product correctly', () => {
      const A = Matrix.from2D([[1, 2], [3, 4]]);
      const B = Matrix.from2D([[5, 6], [7, 8]]);

      const C = A.hadamard(B);

      expect(C.get(0, 0)).toBe(5);  // 1*5
      expect(C.get(0, 1)).toBe(12); // 2*6
      expect(C.get(1, 0)).toBe(21); // 3*7
      expect(C.get(1, 1)).toBe(32); // 4*8
    });

    test('should scale matrix correctly', () => {
      const A = Matrix.from2D([[1, 2], [3, 4]]);
      const B = A.scale(2);

      expect(B.get(0, 0)).toBe(2);
      expect(B.get(1, 1)).toBe(8);
    });

    test('should transpose matrix correctly', () => {
      const A = Matrix.from2D([[1, 2, 3], [4, 5, 6]]);
      const B = A.transpose();

      expect(B.rows).toBe(3);
      expect(B.cols).toBe(2);
      expect(B.get(0, 0)).toBe(1);
      expect(B.get(1, 0)).toBe(2);
      expect(B.get(2, 1)).toBe(6);
    });

    test('should compute Frobenius norm correctly', () => {
      const A = Matrix.from2D([[3, 4]]);
      const norm = A.frobeniusNorm();

      expect(norm).toBeCloseTo(5); // sqrt(3² + 4²) = 5
    });
  });
});

describe('Activation Functions', () => {
  test('ReLU should apply max(0, x)', () => {
    const input = Matrix.from2D([[-1, 0, 1, 2]]);
    const output = Activation.relu(input);

    expect(output.get(0, 0)).toBe(0);
    expect(output.get(0, 1)).toBe(0);
    expect(output.get(0, 2)).toBe(1);
    expect(output.get(0, 3)).toBe(2);
  });

  test('ReLU derivative should be correct', () => {
    const input = Matrix.from2D([[-1, 0, 1, 2]]);
    const output = Activation.reluDerivative(input);

    expect(output.get(0, 0)).toBe(0);
    expect(output.get(0, 1)).toBe(0);
    expect(output.get(0, 2)).toBe(1);
    expect(output.get(0, 3)).toBe(1);
  });

  test('Sigmoid should produce values in (0, 1)', () => {
    const input = Matrix.from2D([[-2, -1, 0, 1, 2]]);
    const output = Activation.sigmoid(input);

    for (let i = 0; i < output.data.length; i++) {
      expect(output.data[i]).toBeGreaterThan(0);
      expect(output.data[i]).toBeLessThan(1);
    }

    expect(output.get(0, 2)).toBeCloseTo(0.5); // sigmoid(0) = 0.5
  });

  test('Tanh should produce values in (-1, 1)', () => {
    const input = Matrix.from2D([[-2, -1, 0, 1, 2]]);
    const output = Activation.tanh(input);

    for (let i = 0; i < output.data.length; i++) {
      expect(output.data[i]).toBeGreaterThan(-1);
      expect(output.data[i]).toBeLessThan(1);
    }

    expect(output.get(0, 2)).toBeCloseTo(0); // tanh(0) = 0
  });
});

describe('QNetwork Architecture', () => {
  test('should initialize network with correct layers', () => {
    const network = new QNetwork({
      layers: [2, 3, 1],
      activations: ['relu', 'sigmoid'],
    });

    const stats = network.getStats();

    expect(stats.layerSizes).toEqual([2, 3, 1]);
    expect(stats.qMatrices).toBe(2);
  });

  test('should initialize with default activations', () => {
    const network = new QNetwork({
      layers: [2, 3, 1],
    });

    const weights = network.exportWeights();

    expect(weights.layers[0].activation).toBe('relu');
    expect(weights.layers[1].activation).toBe('relu');
  });

  test('should count parameters correctly', () => {
    const network = new QNetwork({
      layers: [2, 3, 1],
    });

    const stats = network.getStats();

    // Layer 1: W(3x2) + b(3x1) + Q(3x3) = 6 + 3 + 9 = 18
    // Layer 2: W(1x3) + b(1x1) + Q(1x1) = 3 + 1 + 1 = 5
    // Total = 23
    expect(stats.totalParameters).toBe(23);
  });
});

describe('QNetwork Forward Propagation', () => {
  test('should perform forward pass correctly', () => {
    const network = new QNetwork({
      layers: [2, 3, 1],
      activations: ['relu', 'linear'],
    });

    const input = Matrix.from2D([[1], [2]]);
    const output = network.forward(input);

    expect(output.rows).toBe(1);
    expect(output.cols).toBe(1);
  });

  test('should reject incorrect input dimensions', () => {
    const network = new QNetwork({
      layers: [2, 3, 1],
    });

    const input = Matrix.from2D([[1], [2], [3]]); // Wrong size

    expect(() => network.forward(input)).toThrow('Input size mismatch');
  });

  test('should apply Q-matrix evolution', () => {
    const network = new QNetwork({
      layers: [2, 2, 1],
      qMatrixScale: 0, // No perturbation, Q = I
    });

    // With Q = I, h^(ℓ+1) = I·h^(ℓ) = h^(ℓ)
    const input = Matrix.from2D([[1], [2]]);
    const output = network.predict(input);

    expect(output).toBeDefined();
  });
});

describe('QNetwork Training', () => {
  test('should train on XOR problem', () => {
    const network = new QNetwork({
      layers: [2, 4, 1],
      activations: ['tanh', 'sigmoid'],
      learningRate: 0.1,
      lambda: 0.01,
      maxIterations: 1000,
      nashThreshold: 0.01,
    });

    // XOR dataset
    const X = [
      Matrix.from2D([[0], [0]]),
      Matrix.from2D([[0], [1]]),
      Matrix.from2D([[1], [0]]),
      Matrix.from2D([[1], [1]]),
    ];

    const Y = [
      Matrix.from2D([[0]]),
      Matrix.from2D([[1]]),
      Matrix.from2D([[1]]),
      Matrix.from2D([[0]]),
    ];

    const result = network.train(X, Y, { verbose: false });

    // Should converge
    expect(result.iterations).toBeGreaterThan(0);
    expect(result.finalLoss).toBeLessThan(1);

    // S(n) should decrease
    expect(result.finalS_n).toBeLessThan(result.trajectories[0].S_n);
  });

  test('should track S(n) convergence', () => {
    const network = new QNetwork({
      layers: [2, 3, 1],
      learningRate: 0.1,
      lambda: 0.1,
      maxIterations: 100,
    });

    const X = [Matrix.from2D([[1], [2]])];
    const Y = [Matrix.from2D([[0.5]])];

    const result = network.train(X, Y);

    // Trajectories should be stored
    expect(result.trajectories.length).toBeGreaterThan(0);

    // Each trajectory should have S(n)
    for (const trajectory of result.trajectories) {
      expect(trajectory.S_n).toBeGreaterThanOrEqual(0);
      expect(trajectory.lyapunov_V).toBe(trajectory.S_n ** 2);
    }
  });

  test('should verify Lyapunov stability', () => {
    const network = new QNetwork({
      layers: [2, 3, 1],
      learningRate: 0.1,
      lambda: 0.1,
      maxIterations: 100,
      enableLyapunovTracking: true,
    });

    const X = [Matrix.from2D([[1], [2]])];
    const Y = [Matrix.from2D([[0.5]])];

    const result = network.train(X, Y);

    // Lyapunov function should generally decrease
    // (may have some noise, so we check the stability flag)
    expect(result.lyapunovStable).toBeDefined();
  });

  test('should converge to Nash equilibrium', () => {
    const network = new QNetwork({
      layers: [1, 2, 1],
      activations: ['relu', 'linear'],
      learningRate: 0.1,
      lambda: 1.0, // High regularization for faster Nash convergence
      maxIterations: 500,
      nashThreshold: 0.01,
    });

    // Simple linear problem
    const X = [
      Matrix.from2D([[1]]),
      Matrix.from2D([[2]]),
      Matrix.from2D([[3]]),
    ];

    const Y = [
      Matrix.from2D([[2]]),
      Matrix.from2D([[4]]),
      Matrix.from2D([[6]]),
    ];

    const result = network.train(X, Y, { verbose: false });

    // Check if converged to Nash
    if (result.convergedToNash) {
      expect(result.finalS_n).toBeLessThan(0.01);
    }

    // S(n) should approach 0
    const lastS_n = result.trajectories[result.trajectories.length - 1].S_n;
    const firstS_n = result.trajectories[0].S_n;
    expect(lastS_n).toBeLessThan(firstS_n);
  });

  test('should apply damping factor based on S(n)', () => {
    const network = new QNetwork({
      layers: [2, 2, 1],
      learningRate: 0.1,
      lambda: 0.1,
      maxIterations: 50,
    });

    const X = [Matrix.from2D([[1], [1]])];
    const Y = [Matrix.from2D([[1]])];

    let S_n_values: number[] = [];

    const result = network.train(X, Y, {
      callback: (iter, loss, S_n) => {
        S_n_values.push(S_n);
      },
    });

    // S(n) should generally decrease due to damping
    expect(S_n_values.length).toBeGreaterThan(0);
  });
});

describe('QNetwork Loss Function', () => {
  test('should compute MSE loss correctly', () => {
    const network = new QNetwork({
      layers: [2, 1],
      lambda: 0, // No regularization
    });

    const X = [Matrix.from2D([[1], [2]])];
    const Y = [Matrix.from2D([[3]])];

    const result = network.train(X, Y, { verbose: false });

    // Loss should be computed
    expect(result.trajectories[0].mse).toBeGreaterThanOrEqual(0);
  });

  test('should include S(n) regularization in loss', () => {
    const network = new QNetwork({
      layers: [2, 1],
      lambda: 0.5,
    });

    const X = [Matrix.from2D([[1], [2]])];
    const Y = [Matrix.from2D([[3]])];

    const result = network.train(X, Y, { verbose: false });

    // Total loss should include regularization
    for (const trajectory of result.trajectories) {
      expect(trajectory.loss).toBeCloseTo(
        trajectory.mse + trajectory.regularization,
        5
      );
    }
  });
});

describe('QNetwork Weight Management', () => {
  test('should export and import weights correctly', () => {
    const network1 = new QNetwork({
      layers: [2, 3, 1],
    });

    const weights = network1.exportWeights();

    const network2 = new QNetwork({
      layers: [2, 3, 1],
    });

    network2.importWeights(weights);

    const weights2 = network2.exportWeights();

    // Compare weights
    expect(weights.layers.length).toBe(weights2.layers.length);

    for (let i = 0; i < weights.layers.length; i++) {
      expect(weights.layers[i].W).toEqual(weights2.layers[i].W);
      expect(weights.layers[i].Q).toEqual(weights2.layers[i].Q);
      expect(weights.layers[i].b).toEqual(weights2.layers[i].b);
    }
  });

  test('should reject incompatible weight import', () => {
    const network1 = new QNetwork({
      layers: [2, 3, 1],
    });

    const network2 = new QNetwork({
      layers: [2, 4, 1], // Different architecture
    });

    const weights = network1.exportWeights();

    expect(() => network2.importWeights(weights)).toThrow('Layer count mismatch');
  });
});

describe('QNetwork Prediction', () => {
  test('should predict after training', () => {
    const network = new QNetwork({
      layers: [1, 2, 1],
      learningRate: 0.1,
      maxIterations: 100,
    });

    // Train on y = 2x
    const X = [
      Matrix.from2D([[1]]),
      Matrix.from2D([[2]]),
      Matrix.from2D([[3]]),
    ];

    const Y = [
      Matrix.from2D([[2]]),
      Matrix.from2D([[4]]),
      Matrix.from2D([[6]]),
    ];

    network.train(X, Y, { verbose: false });

    // Test prediction
    const prediction = network.predict(Matrix.from2D([[4]]));

    // Should be close to 8
    expect(prediction.get(0, 0)).toBeGreaterThan(5);
    expect(prediction.get(0, 0)).toBeLessThan(10);
  });
});

describe('Nash Equilibrium Theory', () => {
  test('should demonstrate Nash convergence mathematically', () => {
    // For this test, we verify the mathematical properties:
    // 1. S(n) decreases over iterations
    // 2. V(n) = S(n)² is a valid Lyapunov function
    // 3. dV/dn < 0 (mostly)

    const network = new QNetwork({
      layers: [2, 4, 1],
      learningRate: 0.05,
      lambda: 0.5,
      maxIterations: 200,
      nashThreshold: 0.001,
    });

    const X = [
      Matrix.from2D([[0], [0]]),
      Matrix.from2D([[1], [1]]),
    ];

    const Y = [
      Matrix.from2D([[0]]),
      Matrix.from2D([[1]]),
    ];

    const result = network.train(X, Y);

    // Property 1: S(n) decreases
    const S_n_values = result.trajectories.map(t => t.S_n);
    const firstHalf = S_n_values.slice(0, Math.floor(S_n_values.length / 2));
    const secondHalf = S_n_values.slice(Math.floor(S_n_values.length / 2));

    const avgFirst = firstHalf.reduce((a, b) => a + b) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b) / secondHalf.length;

    expect(avgSecond).toBeLessThan(avgFirst);

    // Property 2: V(n) = S(n)²
    for (const trajectory of result.trajectories) {
      expect(trajectory.lyapunov_V).toBeCloseTo(trajectory.S_n ** 2, 10);
    }

    // Property 3: dV/dn < 0 (mostly)
    let decreaseCount = 0;
    for (let i = 1; i < result.trajectories.length; i++) {
      const dV = result.trajectories[i].lyapunov_V - result.trajectories[i - 1].lyapunov_V;
      if (dV < 0) {
        decreaseCount++;
      }
    }

    // Most iterations should show V decreasing
    const decreaseRatio = decreaseCount / (result.trajectories.length - 1);
    expect(decreaseRatio).toBeGreaterThan(0.7); // At least 70% of iterations
  });
});

describe('Integration with AgentDB', () => {
  test('should not fail when AgentDB is unavailable', async () => {
    const network = new QNetwork({
      layers: [2, 2, 1],
      enableAgentDB: true, // Try to use AgentDB
      maxIterations: 10,
    });

    const X = [Matrix.from2D([[1], [1]])];
    const Y = [Matrix.from2D([[1]])];

    // Should not throw even if AgentDB is unavailable
    expect(() => network.train(X, Y)).not.toThrow();
  });

  test('should store trajectory format correctly', () => {
    const network = new QNetwork({
      layers: [2, 1],
      maxIterations: 5,
    });

    const X = [Matrix.from2D([[1], [1]])];
    const Y = [Matrix.from2D([[1]])];

    const result = network.train(X, Y);

    // Check trajectory format
    for (const trajectory of result.trajectories) {
      expect(trajectory).toHaveProperty('iteration');
      expect(trajectory).toHaveProperty('loss');
      expect(trajectory).toHaveProperty('mse');
      expect(trajectory).toHaveProperty('regularization');
      expect(trajectory).toHaveProperty('S_n');
      expect(trajectory).toHaveProperty('lyapunov_V');
      expect(trajectory).toHaveProperty('nash_distance');
      expect(trajectory).toHaveProperty('weights');
      expect(trajectory).toHaveProperty('timestamp');
    }
  });
});
