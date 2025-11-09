/**
 * OEIS Integration Migration
 *
 * Adds OEIS (Online Encyclopedia of Integer Sequences) support to AgentDB
 * for pattern-based skill discovery and validation.
 *
 * This migration:
 * 1. Creates OEIS tables (sequences, links, validations, cache)
 * 2. Seeds database with first 100 common OEIS sequences
 * 3. Provides rollback support
 */

import * as fs from 'fs';
import * as path from 'path';

// Database type from db-fallback
type Database = any;

/**
 * Common OEIS sequences for seeding (first 100)
 * Format: [oeis_id, name, description, values, formula, keywords, growth_rate]
 */
const COMMON_OEIS_SEQUENCES = [
  // Fundamental sequences
  ['A000001', 'Number of groups of order n', 'Number of groups of order n', [1,1,1,2,1,2,1,5,2,2,1,5,1,2,1,14,1,5,1,5], 'No simple formula', '["nonn","hard","core"]', 'variable'],
  ['A000002', 'Kolakoski sequence', 'An infinite sequence of 1s and 2s that describes its own run-length encoding', [1,2,2,1,1,2,1,2,2,1,2,2,1,1,2,1,1,2,2,1], 'Self-referential', '["nonn","easy"]', 'constant'],
  ['A000004', 'Zero sequence', 'The all-zeros sequence', [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], 'a(n) = 0', '["nonn","core","easy"]', 'constant'],
  ['A000005', 'Divisor function', 'Number of divisors of n', [1,2,2,3,2,4,2,4,3,4,2,6,2,4,4,5,2,6,2,6], 'τ(n)', '["nonn","core","easy"]', 'logarithmic'],
  ['A000007', 'Characteristic function of 0', '1 if n=0, otherwise 0', [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], 'a(n) = [n=0]', '["nonn","core","easy"]', 'constant'],
  ['A000010', 'Euler totient function', 'Number of integers k ≤ n with gcd(n,k) = 1', [1,1,2,2,4,2,6,4,6,4,10,4,12,6,8,8,16,6,18,8], 'φ(n)', '["nonn","core","easy"]', 'linear'],
  ['A000012', 'All ones', 'The all-ones sequence', [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], 'a(n) = 1', '["nonn","core","easy"]', 'constant'],
  ['A000027', 'Natural numbers', 'The positive integers', [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20], 'a(n) = n', '["nonn","core","easy"]', 'linear'],
  ['A000030', 'Initial digit of n', 'Leftmost digit of n in base 10', [0,1,2,3,4,5,6,7,8,9,1,1,1,1,1,1,1,1,1,1], 'First digit', '["nonn","easy","base"]', 'constant'],
  ['A000032', 'Lucas numbers', 'Lucas numbers beginning with 2', [2,1,3,4,7,11,18,29,47,76,123,199,322,521,843,1364,2207,3571,5778,9349], 'L(n) = L(n-1) + L(n-2)', '["nonn","core","easy"]', 'exponential'],

  // Powers and factorial-related
  ['A000040', 'Prime numbers', 'The prime numbers', [2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71], 'n-th prime', '["nonn","core","easy"]', 'logarithmic'],
  ['A000041', 'Partition function', 'Number of partitions of n', [1,1,2,3,5,7,11,15,22,30,42,56,77,101,135,176,231,297,385,490], 'p(n)', '["nonn","core","easy"]', 'exponential'],
  ['A000042', 'Unary representation', 'n appears n times', [1,2,2,3,3,3,4,4,4,4,5,5,5,5,5,6,6,6,6,6], 'a(n) = floor((sqrt(8n+1)-1)/2)', '["nonn","easy"]', 'square_root'],
  ['A000045', 'Fibonacci numbers', 'The Fibonacci sequence', [0,1,1,2,3,5,8,13,21,34,55,89,144,233,377,610,987,1597,2584,4181], 'F(n) = F(n-1) + F(n-2)', '["nonn","core","easy"]', 'exponential'],
  ['A000079', 'Powers of 2', '2^n', [1,2,4,8,16,32,64,128,256,512,1024,2048,4096,8192,16384,32768,65536,131072,262144,524288], 'a(n) = 2^n', '["nonn","core","easy"]', 'exponential'],
  ['A000085', 'Self-inverse permutations', 'Number of self-inverse permutations of n elements', [1,1,2,4,10,26,76,232,764,2620,9496,35696,140152,568504,2390480,10349536], 'a(n) = a(n-1) + (n-1)*a(n-2)', '["nonn"]', 'exponential'],
  ['A000108', 'Catalan numbers', 'The Catalan numbers', [1,1,2,5,14,42,132,429,1430,4862,16796,58786,208012,742900,2674440,9694845], 'C(n) = (2n)!/(n!(n+1)!)', '["nonn","core","easy"]', 'exponential'],
  ['A000110', 'Bell numbers', 'Number of partitions of a set with n elements', [1,1,2,5,15,52,203,877,4140,21147,115975,678570,4213597,27644437,190899322,1382958545], 'Bell(n)', '["nonn","core"]', 'exponential'],
  ['A000120', 'Number of 1s in binary', 'Number of 1s in binary expansion of n', [0,1,1,2,1,2,2,3,1,2,2,3,2,3,3,4,1,2,2,3], 'popcount(n)', '["nonn","core","easy"]', 'logarithmic'],
  ['A000124', 'Central polygonal numbers', 'Maximum number of regions in plane divided by n lines', [1,2,4,7,11,16,22,29,37,46,56,67,79,92,106,121,137,154,172,191], 'a(n) = (n²+n+2)/2', '["nonn","easy"]', 'polynomial'],

  // Triangular and geometric
  ['A000142', 'Factorial numbers', 'n!', [1,1,2,6,24,120,720,5040,40320,362880,3628800,39916800,479001600,6227020800,87178291200,1307674368000], 'a(n) = n!', '["nonn","core","easy"]', 'factorial'],
  ['A000165', 'Double factorial (even)', 'a(n) = (2n)!!', [1,2,8,48,384,3840,46080,645120,10321920,185794560,3715891200,81749606400,1961990553600,51011754393600], 'a(n) = (2n)!!', '["nonn"]', 'factorial'],
  ['A000169', 'Labeled rooted trees', 'Number of labeled rooted trees with n nodes', [1,1,3,16,125,1296,16807,262144,4782969,100000000,2357947691,61917364224], 'a(n) = n^(n-1)', '["nonn","core"]', 'exponential'],
  ['A000203', 'Sum of divisors', 'σ(n), sum of divisors of n', [1,3,4,7,6,12,8,15,13,18,12,28,14,24,24,31,18,39,20,42], 'σ(n)', '["nonn","core","easy"]', 'linear'],
  ['A000204', 'Lucas numbers (shifted)', 'Lucas numbers beginning at 1', [1,3,4,7,11,18,29,47,76,123,199,322,521,843,1364,2207,3571,5778,9349,15127], 'L(n+1)', '["nonn","easy"]', 'exponential'],
  ['A000217', 'Triangular numbers', 'n(n+1)/2', [0,1,3,6,10,15,21,28,36,45,55,66,78,91,105,120,136,153,171,190], 'T(n) = n(n+1)/2', '["nonn","core","easy"]', 'polynomial'],
  ['A000225', 'Mersenne numbers', '2^n - 1', [0,1,3,7,15,31,63,127,255,511,1023,2047,4095,8191,16383,32767,65535,131071,262143,524287], 'a(n) = 2^n - 1', '["nonn","core","easy"]', 'exponential'],
  ['A000244', 'Powers of 3', '3^n', [1,3,9,27,81,243,729,2187,6561,19683,59049,177147,531441,1594323,4782969,14348907], 'a(n) = 3^n', '["nonn","core","easy"]', 'exponential'],
  ['A000262', 'Number of sets of lists', 'Number of ways to arrange n people around n tables', [1,1,3,13,71,461,3447,29093,273343,2829325,31998903,392743957], 'Set-list arrangements', '["nonn"]', 'factorial'],
  ['A000272', 'Number of labeled trees', 'Number of labeled trees with n nodes', [1,1,1,3,16,125,1296,16807,262144,4782969,100000000,2357947691], 'a(n) = n^(n-2)', '["nonn","core"]', 'exponential'],

  // Number theory sequences
  ['A000290', 'Perfect squares', 'n^2', [0,1,4,9,16,25,36,49,64,81,100,121,144,169,196,225,256,289,324,361], 'a(n) = n²', '["nonn","core","easy"]', 'polynomial'],
  ['A000292', 'Tetrahedral numbers', 'Pyramidal numbers with triangular base', [0,1,4,10,20,35,56,84,120,165,220,286,364,455,560,680,816,969,1140,1330], 'T(n) = n(n+1)(n+2)/6', '["nonn","easy"]', 'polynomial'],
  ['A000302', 'Powers of 4', '4^n', [1,4,16,64,256,1024,4096,16384,65536,262144,1048576,4194304,16777216,67108864], 'a(n) = 4^n', '["nonn","easy"]', 'exponential'],
  ['A000312', 'n^n', 'n to the power n', [1,1,4,27,256,3125,46656,823543,16777216,387420489,10000000000,285311670611], 'a(n) = n^n', '["nonn","easy"]', 'exponential'],
  ['A000326', 'Pentagonal numbers', 'n(3n-1)/2', [0,1,5,12,22,35,51,70,92,117,145,176,210,247,287,330,376,425,477,532], 'P(n) = n(3n-1)/2', '["nonn","easy"]', 'polynomial'],
  ['A000330', 'Square pyramidal numbers', 'Sum of first n squares', [0,1,5,14,30,55,91,140,204,285,385,506,650,819,1015,1240,1496,1785,2109,2470], 'a(n) = n(n+1)(2n+1)/6', '["nonn","easy"]', 'polynomial'],
  ['A000364', 'Euler numbers', 'Euler (or secant) numbers', [1,1,5,61,1385,50521,2702765,199360981,19391512145,2404879675441], 'E(n)', '["nonn"]', 'factorial'],
  ['A000396', 'Perfect numbers', 'Numbers equal to sum of proper divisors', [6,28,496,8128,33550336], 'Perfect numbers', '["nonn","hard"]', 'exponential'],
  ['A000521', 'j-function', 'Coefficients of modular function j', [1,744,196884,21493760,864299970,20245856256,333202640600], 'j-function', '["nonn","hard"]', 'exponential'],
  ['A000578', 'Cubes', 'n^3', [0,1,8,27,64,125,216,343,512,729,1000,1331,1728,2197,2744,3375,4096,4913,5832,6859], 'a(n) = n³', '["nonn","core","easy"]', 'polynomial'],

  // Combinatorial sequences
  ['A000583', 'Fourth powers', 'n^4', [0,1,16,81,256,625,1296,2401,4096,6561,10000,14641,20736,28561,38416,50625], 'a(n) = n⁴', '["nonn","easy"]', 'polynomial'],
  ['A000593', 'Odd divisor function', 'Sum of odd divisors of n', [1,1,4,1,6,4,8,1,13,6,12,4,14,8,24,1,18,13,20,6], 'σ_odd(n)', '["nonn"]', 'variable'],
  ['A000594', 'Ramanujan tau function', 'Coefficients in Ramanujan tau function', [1,-24,252,-1472,4830,-6048,-16744,84480,-113643,-115920,534612,-370944], 'τ(n)', '["sign","hard"]', 'variable'],
  ['A000609', 'Partitions into odd parts', 'Number of partitions of n into odd parts', [1,1,1,2,2,3,4,5,6,8,10,12,15,18,22,27,32,38,46,54], 'p_odd(n)', '["nonn"]', 'polynomial'],
  ['A000670', 'Fubini numbers', 'Number of preferential arrangements of n elements', [1,1,3,13,75,541,4683,47293,545835,7087261,102247563,1622632573], 'Fubini numbers', '["nonn"]', 'factorial'],
  ['A000688', 'Abelian groups', 'Number of abelian groups of order n', [1,1,1,2,1,1,1,3,2,1,1,2,1,1,1,5,1,2,1,2], 'Abelian group count', '["nonn"]', 'variable'],
  ['A000796', 'Digits of π', 'Decimal expansion of π', [3,1,4,1,5,9,2,6,5,3,5,8,9,7,9,3,2,3,8,4], 'π digits', '["nonn","cons","base"]', 'constant'],
  ['A000930', 'Narayana cow sequence', 'Number of binary sequences without substring 000', [1,1,1,2,3,4,6,9,13,19,28,41,60,88,129,189,277,406,595,872], 'a(n)=a(n-1)+a(n-3)', '["nonn"]', 'exponential'],
  ['A000959', 'Lucky numbers', 'Numbers surviving sieve similar to Eratosthenes', [1,3,7,9,13,15,21,25,31,33,37,43,49,51,63,67,69,73,75,79], 'Lucky numbers', '["nonn"]', 'linear'],
  ['A000961', 'Prime powers', 'Prime powers p^k for k≥0', [1,2,3,4,5,7,8,9,11,13,16,17,19,23,25,27,29,31,32,37], 'p^k', '["nonn"]', 'logarithmic'],

  // Additional important sequences
  ['A001003', 'Little Schroeder numbers', 'Central Delannoy numbers', [1,1,3,11,45,197,903,4279,20793,103049,518859,2646723], 'Little Schroeder', '["nonn"]', 'exponential'],
  ['A001006', 'Motzkin numbers', 'Number of paths from (0,0) to (n,0)', [1,1,2,4,9,21,51,127,323,835,2188,5798,15511,41835,113634,310572], 'Motzkin(n)', '["nonn"]', 'exponential'],
  ['A001034', 'Powers of 13', '13^n', [1,13,169,2197,28561,371293,4826809,62748517,815730721,10604499373], 'a(n) = 13^n', '["nonn"]', 'exponential'],
  ['A001045', 'Jacobsthal numbers', 'a(n) = a(n-1) + 2*a(n-2)', [0,1,1,3,5,11,21,43,85,171,341,683,1365,2731,5461,10923], 'Jacobsthal', '["nonn"]', 'exponential'],
  ['A001065', 'Sum of proper divisors', 'Sum of divisors of n except n itself', [0,1,1,3,1,6,1,7,4,8,1,16,1,10,9,15,1,21,1,22], 's(n)', '["nonn"]', 'linear'],
  ['A001097', 'Twin primes', 'First of twin prime pairs', [3,5,11,17,29,41,59,71,101,107,137,149,179,191,197,227,239,269,281,311], 'Twin primes', '["nonn"]', 'logarithmic'],
  ['A001113', 'Digits of e', 'Decimal expansion of e', [2,7,1,8,2,8,1,8,2,8,4,5,9,0,4,5,2,3,5,3], 'e digits', '["nonn","cons","base"]', 'constant'],
  ['A001147', 'Double factorial (odd)', 'a(n) = (2n-1)!!', [1,1,3,15,105,945,10395,135135,2027025,34459425,654729075,13749310575], 'a(n) = (2n-1)!!', '["nonn"]', 'factorial'],
  ['A001157', 'Sum of squares of divisors', 'σ_2(n)', [1,5,10,21,26,50,50,85,91,130,122,210,170,250,260,341,290,455,362,546], 'σ_2(n)', '["nonn"]', 'polynomial'],
  ['A001190', 'Wedderburn-Etherington numbers', 'Binary trees with n endpoints', [0,1,1,1,2,3,6,11,23,46,98,207,451,983,2179,4850,10905,24631], 'Binary trees', '["nonn"]', 'exponential'],

  // More fundamental sequences
  ['A001221', 'Number of distinct primes', 'Number of distinct prime factors of n', [0,1,1,1,1,2,1,1,1,2,1,2,1,2,2,1,1,2,1,2], 'ω(n)', '["nonn"]', 'logarithmic'],
  ['A001222', 'Number of prime factors', 'Number of prime factors of n (with multiplicity)', [0,1,1,2,1,2,1,2,2,2,1,3,1,2,2,3,1,3,1,3], 'Ω(n)', '["nonn"]', 'logarithmic'],
  ['A001227', 'Number of odd divisors', 'Number of odd divisors of n', [1,1,2,1,2,2,2,1,3,2,2,2,2,2,4,1,2,3,2,2], 'd_odd(n)', '["nonn"]', 'logarithmic'],
  ['A001333', 'Numerators of continued fraction', 'Numerators of convergents to sqrt(2)', [1,1,3,7,17,41,99,239,577,1393,3363,8119,19601,47321,114243,275807], 'sqrt(2) convergents', '["nonn","frac"]', 'exponential'],
  ['A001349', 'Connected graphs', 'Number of connected graphs with n nodes', [1,1,1,2,6,21,112,853,11117,261080,11716571,1006700565], 'Connected graphs', '["nonn","hard"]', 'exponential'],
  ['A001358', 'Semiprimes', 'Products of two primes', [4,6,9,10,14,15,21,22,25,26,33,34,35,38,39,46,49,51,55,57], 'pq', '["nonn"]', 'linear'],
  ['A001405', 'Central binomial coefficients', 'C(n, floor(n/2))', [1,1,2,3,6,10,20,35,70,126,252,462,924,1716,3432,6435,12870,24310,48620,92378], 'Central C(n,k)', '["nonn"]', 'exponential'],
  ['A001462', 'Golomb sequence', 'Self-describing sequence', [1,2,2,3,3,4,4,4,5,5,5,6,6,6,6,7,7,7,7,8], 'Golomb', '["nonn"]', 'square_root'],
  ['A001477', 'Non-negative integers', 'Natural numbers including 0', [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19], 'a(n) = n', '["nonn","core","easy"]', 'linear'],
  ['A001478', 'Negated integers', 'Negative integers', [0,-1,-2,-3,-4,-5,-6,-7,-8,-9,-10,-11,-12,-13,-14,-15,-16,-17,-18,-19], 'a(n) = -n', '["sign","easy"]', 'linear'],
  ['A001481', 'Sums of two squares', 'Numbers that are sum of 2 squares', [0,1,2,4,5,8,9,10,13,16,17,18,20,25,26,29,32,34,36,37], 'a²+b²', '["nonn"]', 'polynomial'],
  ['A001489', 'Negated naturals', 'Negative natural numbers', [-1,-2,-3,-4,-5,-6,-7,-8,-9,-10,-11,-12,-13,-14,-15,-16,-17,-18,-19,-20], 'a(n) = -n', '["sign","easy"]', 'linear'],
  ['A001519', 'Fibonacci bisection', 'Fibonacci numbers with even index', [0,1,3,8,21,55,144,377,987,2584,6765,17711,46368,121393,317811,832040], 'F(2n)', '["nonn"]', 'exponential'],
  ['A001615', 'Dedekind psi function', 'n * Product (1+1/p) over primes p|n', [1,3,4,6,6,12,8,12,12,18,12,24,14,24,24,24,18,36,20,36], 'ψ(n)', '["nonn","mult"]', 'linear'],

  // Final sequences to reach 100
  ['A001620', 'Euler-Mascheroni constant', 'Decimal expansion of Euler constant γ', [5,7,7,2,1,5,6,6,4,9,0,1,5,3,2,8,6,0,6,0], 'γ digits', '["nonn","cons","base"]', 'constant'],
  ['A001694', 'Powerful numbers', 'Numbers where all prime exponents ≥ 2', [1,4,8,9,16,25,27,32,36,49,64,72,81,100,108,121,125,128,144,169], 'Powerful', '["nonn"]', 'polynomial'],
  ['A001699', 'Binary partitions', 'Number of binary partitions of n', [1,1,2,2,4,4,6,6,10,10,14,14,20,20,26,26,36,36,46,46], 'Binary partitions', '["nonn"]', 'exponential'],
  ['A001700', 'Binomial sum', 'Sum C(n+k,2k), k=0..n', [1,2,6,16,42,112,306,836,2310,6424,17930,50220,141108,397544,1121890,3170724], 'Binomial sum', '["nonn"]', 'exponential'],
  ['A001792', 'n*2^(n-1)', 'Sequence n*2^(n-1)', [0,1,4,12,32,80,192,448,1024,2304,5120,11264,24576,53248,114688,245760], 'n*2^(n-1)', '["nonn"]', 'exponential'],
  ['A001813', 'Central binomial product', '(2n)!/(n!)^2 * n', [0,2,12,60,280,1260,5544,24024,103296,440370,1866780,7888620], 'Central product', '["nonn"]', 'exponential'],
  ['A001844', 'Centered square numbers', '2n(n+1)+1', [1,5,13,25,41,61,85,113,145,181,221,265,313,365,421,481,545,613,685,761], 'Centered squares', '["nonn"]', 'polynomial'],
  ['A001906', 'Fibonacci bisection (odd)', 'Fibonacci numbers with odd index', [1,2,5,13,34,89,233,610,1597,4181,10946,28657,75025,196418,514229,1346269], 'F(2n+1)', '["nonn"]', 'exponential'],
  ['A001969', 'Evil numbers', 'Numbers with even number of 1s in binary', [0,3,5,6,9,10,12,15,17,18,20,23,24,27,29,30,33,34,36,39], 'Evil', '["nonn"]', 'linear'],
  ['A002033', 'Perfect powers', 'Numbers that are k-th powers for k≥2', [1,4,8,9,16,25,27,32,36,49,64,81,100,121,125,128,144,169,196,216], 'n=a^k', '["nonn"]', 'polynomial'],
  ['A002110', 'Primorial numbers', 'Product of first n primes', [1,2,6,30,210,2310,30030,510510,9699690,223092870,6469693230], 'p#', '["nonn"]', 'exponential'],
  ['A002113', 'Palindromes', 'Palindromic numbers in base 10', [0,1,2,3,4,5,6,7,8,9,11,22,33,44,55,66,77,88,99,101], 'Palindromes', '["nonn","base"]', 'linear'],
  ['A002275', 'Repunits', 'Numbers with repeated 1s: (10^n-1)/9', [0,1,11,111,1111,11111,111111,1111111,11111111,111111111,1111111111], '(10^n-1)/9', '["nonn","base"]', 'exponential'],
  ['A002322', 'Carmichael lambda', 'Carmichael function λ(n)', [1,1,2,2,4,2,6,2,6,4,10,2,12,6,4,4,16,6,18,4], 'λ(n)', '["nonn"]', 'variable'],
  ['A002378', 'Pronic numbers', 'n(n+1)', [0,2,6,12,20,30,42,56,72,90,110,132,156,182,210,240,272,306,342,380], 'n(n+1)', '["nonn","easy"]', 'polynomial'],
  ['A002426', 'Central trinomial coefficients', 'Coefficients in expansion of (1+x+x^2)^n', [1,1,3,7,19,51,141,393,1107,3139,8953,25653,73789,213331,618573,1800281], 'Trinomial', '["nonn"]', 'exponential'],
  ['A002487', 'Stern sequence', 'Stern diatomic sequence', [0,1,1,2,1,3,2,3,1,4,3,5,2,5,3,4,1,5,4,7], 'Stern', '["nonn","frac"]', 'logarithmic'],
  ['A002530', 'n appears n+1 times', 'Sequence where n appears n+1 times', [0,0,1,1,1,2,2,2,2,3,3,3,3,3,4,4,4,4,4,4], 'n appears n+1', '["nonn"]', 'square_root'],
  ['A002620', 'Quarter squares', 'floor(n^2/4)', [0,0,1,2,4,6,9,12,16,20,25,30,36,42,49,56,64,72,81,90], 'floor(n²/4)', '["nonn"]', 'polynomial'],

  // Final 10 to reach 100
  ['A003094', 'Connected planar graphs', 'Number of connected planar graphs with n edges', [1,1,2,5,13,44,197,1172,8606,76939], 'Planar graphs', '["nonn","hard"]', 'exponential'],
  ['A003418', 'LCM of 1..n', 'Least common multiple of 1,2,...,n', [1,1,2,6,12,60,60,420,840,2520,2520,27720,27720,360360,360360,360360], 'lcm(1..n)', '["nonn"]', 'exponential'],
  ['A004001', 'Hofstadter-Conway sequence', 'a(n)=a(a(n-1))+a(n-a(n-1))', [1,1,2,2,3,4,4,4,5,6,7,7,8,8,8,8,9,10,11,12], 'Hofstadter-Conway', '["nonn"]', 'linear'],
  ['A005036', 'Dissection of polygon', 'Ways to dissect polygon into n parts', [1,2,5,14,42,132,429,1430,4862,16796,58786,208012,742900,2674440], 'Dissection', '["nonn"]', 'exponential'],
  ['A005100', 'Deficient numbers', 'Numbers n where σ(n) < 2n', [1,2,3,4,5,7,8,9,10,11,13,14,15,16,17,19,21,22,23,25], 'Deficient', '["nonn"]', 'linear'],
  ['A005101', 'Abundant numbers', 'Numbers n where σ(n) > 2n', [12,18,20,24,30,36,40,42,48,54,56,60,66,70,72,78,80,84,88,90], 'Abundant', '["nonn"]', 'linear'],
  ['A005117', 'Squarefree numbers', 'Numbers not divisible by a perfect square > 1', [1,2,3,5,6,7,10,11,13,14,15,17,19,21,22,23,26,29,30,31], 'Squarefree', '["nonn"]', 'linear'],
  ['A005130', 'Robbins numbers', 'Number of descending plane partitions', [1,1,2,7,42,429,7436,218348,10850216,911835460], 'Robbins', '["nonn","hard"]', 'factorial'],
  ['A005843', 'Even numbers', '2n', [0,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38], 'a(n) = 2n', '["nonn","easy"]', 'linear'],
  ['A005408', 'Odd numbers', '2n+1', [1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31,33,35,37,39], 'a(n) = 2n+1', '["nonn","easy"]', 'linear'],
];

/**
 * Apply OEIS migration - add all tables and seed data
 */
export async function applyOEISMigration(db: Database): Promise<void> {
  console.log('📊 Applying OEIS migration...');

  try {
    // Read and execute schema
    // Note: Schema path is relative to the compiled dist directory
    const schemaPath = path.join(process.cwd(), 'packages/agentdb/src/schemas/oeis-schema.sql');
    let schemaSql: string;

    try {
      schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    } catch (err) {
      // Fallback for different project structures
      const altPath = path.join(process.cwd(), 'src/schemas/oeis-schema.sql');
      schemaSql = fs.readFileSync(altPath, 'utf-8');
    }

    // Execute schema in a transaction
    const transaction = db.transaction(() => {
      // Split by semicolon and execute each statement
      const statements = schemaSql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const stmt of statements) {
        try {
          db.exec(stmt + ';');
        } catch (error) {
          console.warn(`⚠️  Statement warning: ${(error as Error).message}`);
          // Continue with other statements
        }
      }
    });

    transaction();
    console.log('✅ OEIS tables created');

    // Seed common OEIS sequences
    console.log('📝 Seeding common OEIS sequences...');
    const seedTransaction = db.transaction(() => {
      const insertStmt = db.prepare(`
        INSERT INTO oeis_sequences (
          oeis_id, name, description, sequence_values, formula,
          keywords, growth_rate, min_value, max_value, avg_value
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const [oeis_id, name, description, values, formula, keywords, growth_rate] of COMMON_OEIS_SEQUENCES) {
        const valuesArray = values as number[];
        const min_value = Math.min(...valuesArray);
        const max_value = Math.max(...valuesArray);
        const avg_value = valuesArray.reduce((a, b) => a + b, 0) / valuesArray.length;

        insertStmt.run(
          oeis_id,
          name,
          description,
          JSON.stringify(valuesArray),
          formula,
          keywords,
          growth_rate,
          min_value,
          max_value,
          avg_value
        );
      }
    });

    seedTransaction();
    console.log(`✅ Seeded ${COMMON_OEIS_SEQUENCES.length} OEIS sequences`);
    console.log('🎉 OEIS migration completed successfully');

  } catch (error) {
    console.error('❌ OEIS migration failed:', (error as Error).message);
    throw error;
  }
}

/**
 * Rollback OEIS migration - remove all OEIS tables
 */
export async function rollbackOEISMigration(db: Database): Promise<void> {
  console.log('🔄 Rolling back OEIS migration...');

  try {
    const transaction = db.transaction(() => {
      // Drop tables in reverse order (respecting foreign keys)
      const dropStatements = [
        'DROP TABLE IF EXISTS oeis_learning_stats',
        'DROP TABLE IF EXISTS pattern_cache',
        'DROP TABLE IF EXISTS episode_sequence_validations',
        'DROP TABLE IF EXISTS skill_oeis_links',
        'DROP TABLE IF EXISTS oeis_sequences',

        // Drop views
        'DROP VIEW IF EXISTS pattern_cache_stats',
        'DROP VIEW IF EXISTS recent_oeis_patterns',
        'DROP VIEW IF EXISTS oeis_validated_skills',
        'DROP VIEW IF EXISTS top_oeis_sequences',

        // Drop triggers
        'DROP TRIGGER IF EXISTS cleanup_expired_cache',
        'DROP TRIGGER IF EXISTS update_oeis_timestamp',
        'DROP TRIGGER IF EXISTS update_cache_hit_count',
        'DROP TRIGGER IF EXISTS update_skill_oeis_validation',
        'DROP TRIGGER IF EXISTS update_oeis_match_count',
      ];

      for (const stmt of dropStatements) {
        try {
          db.exec(stmt);
        } catch (error) {
          console.warn(`⚠️  Rollback warning: ${(error as Error).message}`);
        }
      }
    });

    transaction();
    console.log('✅ OEIS migration rolled back successfully');

  } catch (error) {
    console.error('❌ OEIS rollback failed:', (error as Error).message);
    throw error;
  }
}

/**
 * Check if OEIS migration has been applied
 */
export function isOEISMigrationApplied(db: Database): boolean {
  try {
    const result = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='oeis_sequences'
    `).get();

    return result !== undefined;
  } catch (error) {
    return false;
  }
}

/**
 * Get OEIS migration info
 */
export function getOEISMigrationInfo(db: Database): {
  applied: boolean;
  sequenceCount?: number;
  linkCount?: number;
  validationCount?: number;
} {
  const applied = isOEISMigrationApplied(db);

  if (!applied) {
    return { applied: false };
  }

  try {
    const sequenceCount = db.prepare('SELECT COUNT(*) as count FROM oeis_sequences').get()?.count || 0;
    const linkCount = db.prepare('SELECT COUNT(*) as count FROM skill_oeis_links').get()?.count || 0;
    const validationCount = db.prepare('SELECT COUNT(*) as count FROM episode_sequence_validations').get()?.count || 0;

    return {
      applied: true,
      sequenceCount,
      linkCount,
      validationCount
    };
  } catch (error) {
    return { applied: true };
  }
}
