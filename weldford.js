// Ex. 1 – Welford's recurrence formulas for mean, sum of squares (SS) and variance.
//
//   mean_k = mean_{k-1} + (x_k - mean_{k-1}) / k
//   SS_k   = SS_{k-1}   + (x_k - mean_{k-1}) * (x_k - mean_k)
//   var_k  = SS_k / (k - 1)   (sample, unbiased)   or   SS_k / k   (population)

class Welford {
  constructor() {
    this.k = 0;     // number of observations seen so far
    this.mean = 0;  // running mean
    this.ss = 0;    // running sum of squared deviations from the mean
  }

  add(x) {
    this.k++;
    // ---- core logic: 3 lines ----
    const delta = x - this.mean;          // x_k - mean_{k-1}
    this.mean += delta / this.k;          // Knuth's mean update
    this.ss += delta * (x - this.mean);   // Welford's SS update
    // -----------------------------
  }

  // Sample (unbiased) variance: SS / (k - 1)
  variance() {
    return this.k > 1 ? this.ss / (this.k - 1) : 0;
  }

  // Population (biased) variance: SS / k
  populationVariance() {
    return this.k > 0 ? this.ss / this.k : 0;
  }
}

module.exports = { Welford };

// ---- Self-check: compare with the naive two-pass computation ----
if (require.main === module) {
  const data = [7, 3, 9, 4, 4, 10, 0, 6, 5, 8];
  const w = new Welford();
  for (const x of data) w.add(x);

  const n = data.length;
  const mean = data.reduce((a, b) => a + b, 0) / n;
  const ss = data.reduce((a, x) => a + (x - mean) ** 2, 0);

  console.log("Data:", data.join(", "));
  console.log(`Welford   -> mean = ${w.mean.toFixed(6)}, SS = ${w.ss.toFixed(6)}, s^2 = ${w.variance().toFixed(6)}`);
  console.log(`Two-pass  -> mean = ${mean.toFixed(6)}, SS = ${ss.toFixed(6)}, s^2 = ${(ss / (n - 1)).toFixed(6)}`);

  // Numerical stability: large offset, where the textbook formula sum(x^2) - n*mean^2 breaks down
  const big = data.map((x) => x + 1e9);
  const w2 = new Welford();
  for (const x of big) w2.add(x);
  const naiveSS = big.reduce((a, x) => a + x * x, 0) - big.reduce((a, x) => a + x, 0) ** 2 / n;
  console.log(`\nSame data shifted by 1e9:`);
  console.log(`Welford SS = ${w2.ss.toFixed(6)}   |   textbook sum(x^2) - (sum x)^2/n = ${naiveSS}`);
}