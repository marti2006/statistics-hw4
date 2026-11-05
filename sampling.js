// Ex. 2 – Sampling mean and variance with Welford's formulas.
//
// m hackers each attack n systems. Every attempt gets a score in {0, ..., 10}.
// Score distribution: Binomial(N = 10, p = 0.3)
//   -> each attack is made of 10 independent "sub-attacks" (firewall, auth, ...),
//      each succeeding with probability p; the score is the number of successes.
//   Theoretical mean      mu      = N p          = 3
//   Theoretical variance  sigma^2 = N p (1 - p)  = 2.1
//
// Usage: node sampling.js [m] [p]

const { Welford } = require("./welford");

// ---------- Seeded PRNG (mulberry32) for reproducible results ----------
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(2026);

// ---------- Score distribution ----------
const N = 10;
const p = Number(process.argv[3] ?? 0.3);

function drawScore() {
  let score = 0;
  for (let i = 0; i < N; i++) if (rand() < p) score++;
  return score;
}

const mu = N * p;
const sigma2 = N * p * (1 - p);
// 4th central moment of the binomial, needed for the theoretical Var(S^2)
const mu4 = N * p * (1 - p) * (1 + 3 * (N - 2) * p * (1 - p));

// ---------- One experiment: m hackers x n systems ----------
function experiment(m, n) {
  const means = new Welford();          // statistics of the m sampling means
  const variances = new Welford();      // statistics of the m sampling variances (n - 1)
  const biasedVariances = new Welford(); // same, dividing by n

  for (let h = 0; h < m; h++) {
    const hacker = new Welford();
    for (let s = 0; s < n; s++) hacker.add(drawScore()); // trajectory of n scores
    means.add(hacker.mean);
    variances.add(hacker.variance());
    biasedVariances.add(hacker.populationVariance());
  }

  return {
    n,
    avgMean: means.mean,
    avgVar: variances.mean,
    avgBiasedVar: biasedVariances.mean,
    varOfMeans: means.variance(),
    varOfVars: variances.variance(),
    theoVarOfMeans: sigma2 / n,
    theoVarOfVars: (mu4 - (sigma2 ** 2 * (n - 3)) / (n - 1)) / n,
  };
}

// ---------- Run for several n ----------
const m = Number(process.argv[2] ?? 10000);
const ns = [2, 5, 10, 30, 100, 1000];

console.log(`Score ~ Binomial(N=${N}, p=${p})   mu = ${mu.toFixed(4)}   sigma^2 = ${sigma2.toFixed(4)}   m = ${m} hackers\n`);

const rows = ns.map((n) => experiment(m, n));
const f = (x, d = 4) => x.toFixed(d);

console.log("Averages across hackers");
console.table(
  rows.map((r) => ({
    n: r.n,
    "avg mean": f(r.avgMean),
    mu: f(mu),
    "avg s^2 (n-1)": f(r.avgVar),
    "avg s^2 (n)": f(r.avgBiasedVar),
    "sigma^2": f(sigma2),
  }))
);

console.log("Variability across hackers (empirical vs theoretical)");
console.table(
  rows.map((r) => ({
    n: r.n,
    "Var(mean)": f(r.varOfMeans, 5),
    "sigma^2/n": f(r.theoVarOfMeans, 5),
    "Var(s^2)": f(r.varOfVars, 5),
    "theo Var(s^2)": f(r.theoVarOfVars, 5),
  }))
);