# Homework – Welford's Recurrences and Sampling Distributions

| File | Content |
|------|---------|
| `welford.js` | Ex. 1 – `Welford` class (online mean, SS, variance) + self-check |
| `sampling.js` | Ex. 2 – simulation of m hackers × n systems |

Run with Node.js:

```bash
node welford.js
node sampling.js            # m = 10000, p = 0.3
node sampling.js 5000 0.5   # custom m and p
```

---

## Ex. 1 – Welford's Recurrence Formulas

### Starting point: Knuth's recurrence for the mean

Let $\bar x_k = \frac{1}{k}\sum_{i=1}^{k} x_i$. Then

$$
k\,\bar x_k = (k-1)\,\bar x_{k-1} + x_k
\;\Longrightarrow\;
\bar x_k = \bar x_{k-1} + \frac{x_k - \bar x_{k-1}}{k}.
$$

The new mean is the old mean corrected by a fraction $1/k$ of the "surprise" $x_k - \bar x_{k-1}$.

### Recurrence for the sum of squares

Define the sum of squared deviations $SS_k = \sum_{i=1}^{k} (x_i - \bar x_k)^2$.
Using the identity $SS_k = \sum_{i=1}^{k} x_i^2 - k\,\bar x_k^2$:

$$
SS_k - SS_{k-1} = x_k^2 - k\,\bar x_k^2 + (k-1)\,\bar x_{k-1}^2 .
$$

From Knuth's recurrence, $(k-1)\,\bar x_{k-1} = k\,\bar x_k - x_k$, so

$$
(k-1)\,\bar x_{k-1}^2 = \bar x_{k-1}\,(k\,\bar x_k - x_k).
$$

Substituting:

$$
\begin{aligned}
SS_k - SS_{k-1} &= x_k^2 - k\,\bar x_k^2 + k\,\bar x_k\,\bar x_{k-1} - x_k\,\bar x_{k-1} \\
&= x_k^2 - x_k\,\bar x_{k-1} - k\,\bar x_k\,(\bar x_k - \bar x_{k-1}) .
\end{aligned}
$$

Since $k(\bar x_k - \bar x_{k-1}) = x_k - \bar x_{k-1}$:

$$
\begin{aligned}
SS_k - SS_{k-1} &= x_k(x_k - \bar x_{k-1}) - \bar x_k\,(x_k - \bar x_{k-1}) \\
&= (x_k - \bar x_{k-1})(x_k - \bar x_k).
\end{aligned}
$$

**Welford's recurrences** (with $\bar x_0 = 0$, $SS_0 = 0$):

$$
\boxed{\;
\bar x_k = \bar x_{k-1} + \frac{x_k - \bar x_{k-1}}{k},
\qquad
SS_k = SS_{k-1} + (x_k - \bar x_{k-1})(x_k - \bar x_k)
\;}
$$

### Recurrence for the variance

Sample variance $s_k^2 = SS_k / (k-1)$, so for $k \ge 2$:

$$
s_k^2 = \frac{k-2}{k-1}\,s_{k-1}^2 + \frac{(x_k - \bar x_{k-1})^2}{k}
$$

(using $x_k - \bar x_k = \frac{k-1}{k}(x_k - \bar x_{k-1})$). In practice it is simpler and safer to keep $SS_k$ and divide only when the variance is needed.

### Why not $\sum x^2 - n\bar x^2$?

The textbook formula subtracts two huge, nearly equal numbers and suffers catastrophic cancellation. Welford only accumulates products of small deviations. `welford.js` demonstrates it: with the data shifted by $10^9$, Welford still returns $SS = 82.4$, while the textbook formula returns $0$.

### Code (core logic: 3 lines)

```js
add(x) {
  this.k++;
  const delta = x - this.mean;          // x_k - mean_{k-1}
  this.mean += delta / this.k;          // Knuth
  this.ss += delta * (x - this.mean);   // Welford
}
variance() { return this.k > 1 ? this.ss / (this.k - 1) : 0; }
```

---

## Ex. 2 – Sampling Mean and Variance

### Setup

* **m = 10 000 hackers**, each attacking **n systems**, for $n \in \{2, 5, 10, 30, 100, 1000\}$.
* Each attempt gets a score in $\{0,\dots,10\}$ drawn from a **Binomial(N = 10, p = 0.3)**: an attack consists of 10 independent stages (scan, firewall, authentication, …), each passed with probability $p$; the score is the number of stages passed.
  * $\mu = Np = 3$
  * $\sigma^2 = Np(1-p) = 2.1$
* For every hacker, `Welford` computes the sampling mean $\bar X$ and the sampling variance $S^2$ of their n scores (both with $n-1$ and, for comparison, with $n$ in the denominator).
* The m sampling means and m sampling variances are themselves fed into two more `Welford` accumulators, giving their average and their spread across hackers.
* A seeded PRNG (mulberry32) makes results reproducible.

### Results (m = 10 000, seed 2026)

**Averages across hackers**

| n | avg $\bar X$ | μ | avg $S^2$ (n−1) | avg $S^2$ (n) | σ² |
|---:|---:|---:|---:|---:|---:|
| 2 | 3.0006 | 3 | 2.0729 | 1.0364 | 2.1 |
| 5 | 3.0002 | 3 | 2.0834 | 1.6667 | 2.1 |
| 10 | 3.0006 | 3 | 2.0974 | 1.8876 | 2.1 |
| 30 | 3.0020 | 3 | 2.1060 | 2.0358 | 2.1 |
| 100 | 3.0000 | 3 | 2.1048 | 2.0838 | 2.1 |
| 1000 | 3.0000 | 3 | 2.0992 | 2.0971 | 2.1 |

**Variability across hackers (empirical vs theoretical)**

| n | Var($\bar X$) | σ²/n | Var($S^2$) | theoretical Var($S^2$) |
|---:|---:|---:|---:|---:|
| 2 | 1.03275 | 1.05000 | 8.43438 | 8.54700 |
| 5 | 0.42142 | 0.42000 | 2.03557 | 2.09580 |
| 10 | 0.20836 | 0.21000 | 0.92057 | 0.92540 |
| 30 | 0.07161 | 0.07000 | 0.28619 | 0.28594 |
| 100 | 0.02117 | 0.02100 | 0.08550 | 0.08363 |
| 1000 | 0.00207 | 0.00210 | 0.00811 | 0.00828 |

Theoretical variance of the sample variance: $\mathrm{Var}(S^2) = \frac{1}{n}\left(\mu_4 - \frac{n-3}{n-1}\sigma^4\right)$, where $\mu_4$ is the 4th central moment of the distribution.

### Conclusions

1. **The sampling mean is an unbiased estimator of μ.** For every n, even n = 2, the average of the m sampling means is ≈ 3: $E[\bar X] = \mu$. Each individual hacker's mean can be far from μ, but there is no systematic error.

2. **The sampling variance with $n-1$ is an unbiased estimator of σ².** The average of the $S^2$ values is ≈ 2.1 for every n. Dividing by $n$ instead gives a systematically too small value, $E[S_n^2] = \frac{n-1}{n}\sigma^2$: at n = 2 it is ≈ 1.05, exactly half of σ². The bias disappears only as n grows. This is the empirical justification of **Bessel's correction**: the deviations are measured from $\bar X$, which is fitted to the same data, so one degree of freedom is lost.

3. **The variability of the estimators shrinks as n grows.** $\mathrm{Var}(\bar X)$ matches $\sigma^2/n$ closely: multiplying n by 10 divides the spread of the means by 10 (the standard error by $\sqrt{10}$). $\mathrm{Var}(S^2)$ also decreases roughly as $1/n$, and it is larger than $\mathrm{Var}(\bar X)$: the variance is harder to estimate than the mean, because it depends on the 4th moment. With n = 2 a single hacker's $S^2$ is almost useless (std ≈ 2.9 around 2.1); with n = 1000 it is within a few percent of σ².

4. **Consistency.** Unbiased + variance → 0 means each single hacker's $\bar X$ and $S^2$ converge to μ and σ² as n → ∞ (law of large numbers).

### Why this matters in inferential statistics

In practice we observe **one** sample, not m of them, and the true μ and σ² are unknown. The experiment shows that:

* $\bar X$ and $S^2$ are the right point estimators: on average they hit the true parameters, so they can replace them.
* The uncertainty of $\bar X$ is known and computable from the data itself: $SE = S/\sqrt{n}$. This is the basis of **confidence intervals** ($\bar X \pm z\,S/\sqrt{n}$) and of **hypothesis tests** (z-test, t-test).
* The distribution of the m sampling means is the **sampling distribution** of $\bar X$; it is centred on μ with spread $\sigma/\sqrt{n}$ and, by the Central Limit Theorem, approximately normal for large n, regardless of the shape of the score distribution.
* The required sample size can be planned: to halve the standard error, n must be quadrupled.
* Welford's algorithm lets all of this be computed online, in one pass, with O(1) memory and without numerical cancellation, which matters when data arrive as a stream (e.g. live attack logs).