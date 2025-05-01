// ROC utility functions

// Function to calculate ROC curve from predictions and true labels
export const calculateRocCurve = (predictions, trueLabels) => {
  // Sort predictions and corresponding labels
  const combined = predictions.map((pred, i) => ({ pred, label: trueLabels[i] }));
  combined.sort((a, b) => b.pred - a.pred);
  
  const n = trueLabels.length;
  const positives = trueLabels.filter(label => label === 1).length;
  const negatives = n - positives;
  
  const fpr = [];
  const tpr = [];
  const thresholds = [];
  
  let fp = 0;
  let tp = 0;
  let prevPred = Number.POSITIVE_INFINITY;
  
  // Add the (0,0) point
  fpr.push(0);
  tpr.push(0);
  thresholds.push(Number.POSITIVE_INFINITY);
  
  // Calculate points on the ROC curve
  for (let i = 0; i < n; i++) {
    const { pred, label } = combined[i];
    
    // If we crossed a threshold
    if (pred !== prevPred) {
      fpr.push(fp / negatives);
      tpr.push(tp / positives);
      thresholds.push(pred);
      prevPred = pred;
    }
    
    if (label === 1) {
      tp += 1;
    } else {
      fp += 1;
    }
  }
  
  // Add the (1,1) point
  fpr.push(1);
  tpr.push(1);
  thresholds.push(Number.NEGATIVE_INFINITY);
  
  return { fpr, tpr, thresholds };
};

// Function to calculate AUC from the ROC curve
export const calculateAUC = (fpr, tpr) => {
  let auc = 0;
  for (let i = 1; i < fpr.length; i++) {
    auc += (fpr[i] - fpr[i - 1]) * (tpr[i] + tpr[i - 1]) / 2;
  }
  return auc;
};

// Seeded random number generator using a Linear Congruential Generator algorithm
function createSeededRandom(seed) {
  // Constants for a good LCG
  const a = 1664525;
  const c = 1013904223;
  const m = Math.pow(2, 32);
  
  let currentSeed = seed;
  
  return function() {
    // Update the seed
    currentSeed = (a * currentSeed + c) % m;
    // Return a value between 0 and 1
    return currentSeed / m;
  };
}

export const generateNormalDistribution = (mean, stdDev, size, randomFunc) => {
  // Box-Muller transform to generate normally distributed random numbers
  const result = [];
  for (let i = 0; i < size; i++) {
    let u = 0, v = 0;
    while (u === 0) u = randomFunc();
    while (v === 0) v = randomFunc();
    
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    result.push(z * stdDev + mean);
  }
  return result;
};

export const generateSimulatedData = (diseaseMean, diseaseStd, healthyMean, healthyStd, size = 1000, seed = 888) => {
  // Create a seeded random function
  const seededRandom = createSeededRandom(seed);
  
  // Generate all the normally distributed values first
  const diseaseValues = generateNormalDistribution(diseaseMean, diseaseStd, size, seededRandom);
  const healthyValues = generateNormalDistribution(healthyMean, healthyStd, size, seededRandom);
  
  // Then create labels and assign corresponding values
  const trueLabels = [];
  const predictions = [];
  
  for (let i = 0; i < size; i++) {
    const isDisease = seededRandom() < 0.5;
    trueLabels.push(isDisease ? 1 : 0);
    predictions.push(isDisease ? diseaseValues[i] : healthyValues[i]);
  }
  
  return { predictions, trueLabels };
};



// Function to find closest pair of values in TPR and FPR arrays
export const findClosestPair = (tpr, fpr, targetTpr, targetFpr) => {
  let minDistance = Number.POSITIVE_INFINITY;
  let closestIndex = 0;
  
  for (let i = 0; i < tpr.length; i++) {
    const distance = Math.sqrt(
      Math.pow(tpr[i] - targetTpr, 2) + Math.pow(fpr[i] - targetFpr, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = i;
    }
  }
  
  return {
    tpr: tpr[closestIndex],
    fpr: fpr[closestIndex],
    index: closestIndex
  };
};

// // Function to find FPR and TPR values for a given slope on the ROC curve
// export const findFprTprForSlope = (curvePoints, targetSlope) => {
//   let bestDistance = Number.POSITIVE_INFINITY;
//   let bestFpr = 0;
//   let bestTpr = 0;
  
//   for (let i = 1; i < curvePoints.length; i++) {
//     const [fpr1, tpr1] = curvePoints[i - 1];
//     const [fpr2, tpr2] = curvePoints[i];
    
//     // Calculate slope of line segment
//     const slopeSeg = (tpr2 - tpr1) / (fpr2 - fpr1);
    
//     // Calculate distance between slopes
//     const distance = Math.abs(slopeSeg - targetSlope);
    
//     if (distance < bestDistance) {
//       bestDistance = distance;
      
//       // Interpolate to find the exact point where the slope equals targetSlope
//       // For simplicity, we'll just use the midpoint of the segment
//       bestFpr = (fpr1 + fpr2) / 2;
//       bestTpr = (tpr1 + tpr2) / 2;
//     }
//   }
  
//   return [bestFpr, bestTpr];
// };

// Functions for expected utility calculation
export const treatAll = (probability, uFP, uTP) => {
  return probability * uTP + (1 - probability) * uFP;
};

export const treatNone = (probability, uFN, uTN) => {
  return probability * uFN + (1 - probability) * uTN;
};

export const test = (probability, sensitivity, specificity, uTN, uTP, uFN, uFP, testCost) => {
  return probability * sensitivity * uTP + 
         probability * (1 - sensitivity) * uFN + 
         (1 - probability) * (1 - specificity) * uFP + 
         (1 - probability) * specificity * uTN - testCost;
};

// Function to calculate partial AUC
export const calculatePartialAUC = (fpr, tpr, minFpr, maxFpr, minTpr) => {
  // Filter points within the FPR range
  const indices = fpr.map((value, index) => ({ value, index }))
                     .filter(item => item.value >= minFpr && item.value <= maxFpr)
                     .map(item => item.index);
  
  // If no points are in the range, return 0
  if (indices.length === 0) return 0;
  
  // Get the FPR and TPR values in the range
  const filteredFpr = indices.map(i => fpr[i]);
  const filteredTpr = indices.map(i => tpr[i]);
  
  // Filter to only include points where TPR >= minTpr
  const validIndices = filteredTpr.map((value, index) => ({ value, index }))
                               .filter(item => item.value >= minTpr)
                               .map(item => item.index);
  
  if (validIndices.length === 0) return 0;
  
  const regionFpr = validIndices.map(i => filteredFpr[i]);
  const regionTpr = validIndices.map(i => filteredTpr[i]);
  
  // Calculate the rectangle area
  const rectArea = (Math.max(...filteredFpr)) * (1 - minTpr);
  
  // Calculate the partial AUC using trapezoidal rule
  let partialAuc = 0;
  for (let i = 1; i < regionFpr.length; i++) {
    partialAuc += (regionFpr[i] - regionFpr[i-1]) * (regionTpr[i] + regionTpr[i-1]) / 2;
  }
  
  // Subtract the rectangle's bottom part
  partialAuc -= minTpr * (Math.max(...filteredFpr) - Math.min(...filteredFpr));
  
  return partialAuc / rectArea;
};

// Function to calculate posterior probabilities (Bayes' theorem)
export const calculatePosterior = (prior, sensitivity, specificity) => {
  const positive = (sensitivity * prior) / (sensitivity * prior + (1 - specificity) * (1 - prior));
  const negative = ((1 - sensitivity) * prior) / ((1 - sensitivity) * prior + specificity * (1 - prior));
  return { positive, negative };
};

// Function to solve for threshold values numerically
export const solveThreshold = (start, end, step, equationFunc) => {
  let bestX = start;
  let minDiff = Math.abs(equationFunc(start));
  
  for (let x = start; x <= end; x += step) {
    const diff = Math.abs(equationFunc(x));
    if (diff < minDiff) {
      minDiff = diff;
      bestX = x;
    }
  }
  
  return bestX;
};

function maxRelativeSlopes(fprs, tprs) {
  const n = tprs.length;
  const maxSlopes = new Array(n).fill(0);  // To store the maximum slope for each point
  const maxIndices = new Array(n).fill(0);  // To store the index of the other point for the max slope
  
  // Calculate the maximum slope from each point to every other point
  for (let i = 0; i < n; i++) {
      let maxSlope = -Infinity;
      
      for (let j = i + 1; j < n; j++) {
          if ((fprs[j] > fprs[i]) || (tprs[j] > tprs[i])) {
              const slope = (tprs[j] - tprs[i]) / ((fprs[j] - fprs[i]) + 0.00000000001);
              if (slope >= maxSlope) {
                  maxSlope = slope;
                  maxIndices[i] = j;
              }
          }
      }
      
      maxSlopes[i] = maxSlope;
  }
  
  return [maxSlopes, maxIndices];
}

function cleanMaxRelativeSlopeIndex(indices, lenOfTpr) {
  // Check if the indices array is empty
  if (indices.length === 0) {
      return [0, lenOfTpr - 1];
  }
  
  const ordered = [0];  // Start with the first index as 0 (assuming it's the starting index)
  
  // Start with the first value from indices
  let maxVal = indices[0];
  ordered.push(maxVal);
  
  // Process the rest of the indices starting from the second element
  for (let i = 1; i < indices.length; i++) {
      if (indices[i] > maxVal) {
          maxVal = indices[i];
          ordered.push(maxVal);
      } else {
          ordered.push(maxVal);
      }
  }
  
  // Ensure the last index is included
  if (ordered[ordered.length - 1] !== lenOfTpr - 1) {
      ordered.push(lenOfTpr - 1);
  }
  // console.log("what")
  // console.log(ordered.length)
  return ordered;
}

/**
 * Deduplicate the exact points from FPRs and TPRs.
 * @param {Array} fpr - Array of false positive rates.
 * @param {Array} tpr - Array of true positive rates.
 * @returns {Array} - Array containing deduplicated arrays [uniqueFpr, uniqueTpr].
 */
function deduplicateRocPoints(fpr, tpr) {
  // Create a map to track unique points
  const uniquePointsMap = new Map();
  
  // Combine points and track unique combinations
  for (let i = 0; i < fpr.length; i++) {
      // Use a string key for the map (e.g., "0.1,0.8")
      const key = `${fpr[i]},${tpr[i]}`;
      
      // Store the actual values in the map
      if (!uniquePointsMap.has(key)) {
          uniquePointsMap.set(key, [fpr[i], tpr[i]]);
      }
  }
  
  // Extract unique points from the map
  const uniquePoints = Array.from(uniquePointsMap.values());
  
  // Split the unique points back into separate FPR and TPR arrays
  const uniqueFpr = uniquePoints.map(point => point[0]);
  const uniqueTpr = uniquePoints.map(point => point[1]);
  
  return [uniqueFpr, uniqueTpr];
}

/**
 * Optimized Bezier curve fitting focused on speed.
 * 
 * @param {Array} controlPoints - Control points array/list
 * @param {Array} empiricalPoints - Points to fit the curve to
 * @param {Array} initialWeights - Initial weights (optional)
 * @param {number} maxTime - Maximum time in seconds
 * @returns {Object} - Optimization result object
 */
function optimizeBezierFast(controlPoints, empiricalPoints, initialWeights = null, maxTime = 10) {
  // Convert inputs to arrays if they aren't already
  controlPoints = Array.isArray(controlPoints) ? controlPoints : Array.from(controlPoints);
  empiricalPoints = Array.isArray(empiricalPoints) ? empiricalPoints : Array.from(empiricalPoints);
  
  const nControls = controlPoints.length;
  
  // Set default weights if none provided
  if (initialWeights === null) {
      initialWeights = Array(nControls).fill(1);
  } else {
      initialWeights = Array.isArray(initialWeights) ? initialWeights : Array.from(initialWeights);
  }
  
  // Set bounds (weights should be positive)
  const bounds = Array(nControls).fill(0).map(() => [0.1, 20.0]);
  
  // Create early termination callback
  const callback = new SimpleEarlyTermination(maxTime);
  
  // Run optimization with a minimizer function
  // Note: In JavaScript, we'd need to use an optimization library like numeric.js or ml-optimize
  // This is a simplified placeholder for the minimize function
  const result = minimize(
      (weights) => errorFunctionSimple(weights, controlPoints, empiricalPoints),
      initialWeights,
      {
          method: 'SLSQP',
          bounds: bounds,
          callback: callback,
          options: {
              maxiter: 100,
              ftol: 1e-4,
              disp: false
          }
      }
  );
  
  // If the callback found a better solution than the final one
  if (callback.bestValue < result.fun) {
      result.x = callback.bestParams;
      result.fun = callback.bestValue;
  }
  
  return result;
}

/**
* Early termination callback for optimization
*/
class SimpleEarlyTermination {
  constructor(maxTime = 10, tolerance = 1e-4) {
      this.bestValue = Infinity;
      this.bestParams = null;
      this.startTime = Date.now() / 1000; // Convert to seconds
      this.maxTime = maxTime;
      this.tolerance = tolerance;
      this.iterationsWithoutImprovement = 0;
  }
  
  call(xk, ...args) {
      // Get current function value
      let fVal;
      if (args.length > 0 && args[0] && typeof args[0].fun !== 'undefined') {
          fVal = args[0].fun;
      } else {
          return false;
      }
      
      // Time-based termination
      if ((Date.now() / 1000) - this.startTime > this.maxTime) {
          if (this.bestParams !== null) {
              // Copy best params to xk
              this.bestParams.forEach((val, i) => xk[i] = val);
          }
          return true;
      }
      
      // Track best solution
      if (fVal < this.bestValue - this.tolerance) {
          this.bestValue = fVal;
          this.bestParams = [...xk]; // Create a copy
          this.iterationsWithoutImprovement = 0;
      } else {
          this.iterationsWithoutImprovement += 1;
      }
      
      // Terminate if no improvement for a while
      if (this.iterationsWithoutImprovement >= 5) {
          if (this.bestParams !== null) {
              // Copy best params to xk
              this.bestParams.forEach((val, i) => xk[i] = val);
          }
          return true;
      }
      
      return false;
  }
}

/**
* Simple error function that focuses on performance.
*/
function errorFunctionSimple(weights, controlPoints, empiricalPoints) {
  // Generate curve points
  const curvePoints = rationalBezierCurveOptimized(controlPoints, weights);
  
  // Check if curvePoints is an array and handle it accordingly
  if (!Array.isArray(curvePoints)) {
    console.error("curvePoints is not an array:", curvePoints);
    return Infinity; // Return a high error value if calculation fails
  }
  
  // Calculate distances efficiently
  const minDistances = empiricalPoints.map(point => {
    // Make sure each curve point is accessible for distance calculation
    return Math.min(...curvePoints.map(curvePoint => 
      distance(point, curvePoint)
    ));
  });
  
  // Return mean distance
  return minDistances.reduce((sum, dist) => sum + dist, 0) / minDistances.length;
}

/**
* Calculate Euclidean distance between two points
*/
function distance(point1, point2) {
  return Math.sqrt(
      Math.pow(point1[0] - point2[0], 2) + 
      Math.pow(point1[1] - point2[1], 2)
  );
}



/**
* Optimized rational Bezier curve calculation using JavaScript arrays.
*/
function rationalBezierCurveOptimized(controlPoints, weights, numPoints = 100) {
  // Debug output
  // console.log("Control points:", controlPoints);
  // console.log("Weights:", weights);
  // console.log("Number of points:", numPoints);
  
  const n = controlPoints.length - 1;
  const tValues = Array(numPoints).fill(0).map((_, i) => i / (numPoints - 1));
  
  // Ensure inputs are arrays
  controlPoints = Array.isArray(controlPoints) ? controlPoints : Array.from(controlPoints);
  weights = Array.isArray(weights) ? weights : Array.from(weights);
  
  // Preallocate results
  const curvePoints = Array(numPoints).fill(0).map(() => [0, 0]);
  
  // For each point
  for (let i = 0; i < tValues.length; i++) {
    const t = tValues[i];
    
    // Calculate Bernstein basis
    const basis = Array(n + 1).fill(0);
    for (let j = 0; j <= n; j++) {
      basis[j] = binomialCoefficient(n, j) * Math.pow(t, j) * Math.pow(1 - t, n - j);
    }
    
    // Apply weights to basis
    const weightedBasis = basis.map((b, j) => weights[j] * b);
    
    // Calculate numerator (weighted sum of control points)
    const numerator = [0, 0];
    for (let j = 0; j <= n; j++) {
      numerator[0] += weightedBasis[j] * controlPoints[j][0];
      numerator[1] += weightedBasis[j] * controlPoints[j][1];
    }
    
    // Calculate denominator (sum of weighted basis)
    const denominator = weightedBasis.reduce((sum, wb) => sum + wb, 0);
    
    // Ensure no division by zero
    if (denominator > 1e-10) {
      curvePoints[i][0] = numerator[0] / denominator;
      curvePoints[i][1] = numerator[1] / denominator;
    }
  }
  
  // console.log("Generated curve points:", curvePoints);
  return curvePoints;
}

/**
 * Simple optimization function that implements a gradient descent approach with constraints
 * 
 * @param {Function} func - The function to minimize
 * @param {Array} initialParams - Initial parameter values
 * @param {Object} options - Optimization options
 * @returns {Object} - Optimization result object
 */
function minimize(func, initialParams, options) {
  const {
      bounds = null,
      callback = null,
      options: {
          maxiter = 100,
          ftol = 1e-4,
          disp = false
      } = {}
  } = options || {};

  // Make a copy of the initial parameters
  let x = [...initialParams];
  let prevX = [...x];
  let fun = func(x);
  let prevFun = fun;
  
  // Numerical gradient calculation
  const calculateGradient = (f, x, h = 1e-7) => {
      const n = x.length;
      const gradient = Array(n);
      const f0 = f(x);
      
      for (let i = 0; i < n; i++) {
          const xh = [...x];
          xh[i] += h;
          gradient[i] = (f(xh) - f0) / h;
      }
      
      return gradient;
  };
  
  // Apply bounds to parameters
  const applyBounds = (x, bounds) => {
      if (!bounds) return x;
      
      return x.map((val, i) => {
          const [lower, upper] = bounds[i];
          return Math.max(lower, Math.min(val, upper));
      });
  };
  
  // Termination flag
  let terminated = false;
  
  // Main optimization loop
  for (let iter = 0; iter < maxiter && !terminated; iter++) {
      // Calculate gradient
      const gradient = calculateGradient(func, x);
      
      // Step size (learning rate) - can be adjusted
      const step = 0.1;
      
      // Update parameters using gradient descent
      prevX = [...x];
      x = x.map((val, i) => val - step * gradient[i]);
      
      // Apply bounds if provided
      if (bounds) {
          x = applyBounds(x, bounds);
      }
      
      // Calculate new function value
      prevFun = fun;
      fun = func(x);
      
      // Check for convergence
      const paramChange = Math.sqrt(
          x.reduce((sum, val, i) => sum + Math.pow(val - prevX[i], 2), 0)
      );
      
      const funChange = Math.abs(fun - prevFun);
      
      if (disp) {
          console.log(`Iteration ${iter}: f(x) = ${fun}, change = ${funChange}`);
      }
      
      // Check for convergence
      if (funChange < ftol) {
          if (disp) {
              console.log('Optimization converged (function value change below tolerance)');
          }
          break;
      }
      
      // Call the callback if provided
      if (callback) {
          terminated = callback.call(x, { fun: fun });
      }
  }
  
  return {
      x: x,
      fun: fun,
      success: !terminated,
      message: terminated ? "Terminated by callback" : "Optimization successful",
      nit: maxiter // Number of iterations
  };
}

export const fitRocBezier = (fpr, tpr) => {
  let outerIdx = maxRelativeSlopes(fpr, tpr)[1];
  outerIdx = cleanMaxRelativeSlopeIndex(outerIdx, tpr.length);

  let uRocFprFitted = outerIdx.map(idx => fpr[idx]);
  let uRocTprFitted = outerIdx.map(idx => tpr[idx]);
  
  const [dedupFpr, dedupTpr] = deduplicateRocPoints(uRocFprFitted, uRocTprFitted);
  uRocFprFitted = dedupFpr;
  uRocTprFitted = dedupTpr;

  const controlPoints = uRocFprFitted.map((fprVal, i) => [fprVal, uRocTprFitted[i]]);
  const empiricalPoints = fpr.map((fprVal, i) => [fprVal, tpr[i]]);
  const initialWeights = Array(controlPoints.length).fill(1);
  // const bounds = controlPoints.map(() => [0, 20]);

  const result = optimizeBezierFast(controlPoints, empiricalPoints, initialWeights);
  const optimalWeights = result.x;
  const numPoints = empiricalPoints.length;
  // console.log("here")
  // console.log(numPoints)
  const curvePointsGen = rationalBezierCurveOptimized(controlPoints, optimalWeights, numPoints);

  return { curvePointsGen };
};

/**
 * Compute binomial coefficient (n choose k)
 * @param {number} n - Upper value
 * @param {number} k - Lower value
 * @returns {number} - Binomial coefficient value
 */
function binomialCoefficient(n, k) {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  
  let result = 1;
  for (let i = 1; i <= k; i++) {
    result *= (n + 1 - i);
    result /= i;
  }
  return result;
}

/**
 * Compute a point on a Bézier curve defined by control points at parameter t.
 * @param {Array} controlPoints - Array of [x,y] control point coordinates
 * @param {number} t - Parameter value between 0 and 1
 * @returns {Array} - [x,y] coordinates of the point on the curve
 */
function bezier(controlPoints, t) {
  // console.log(controlPoints.length)
  const n = controlPoints.length - 1;
  // console.log(n)
  let point = [0, 0];
  
  for (let i = 0; i <= n; i++) {
    // Calculate binomial coefficient
    const binom = binomialCoefficient(n, i) * Math.pow(t, i) * Math.pow(1 - t, n - i);
    
    // Add weighted control point
    point[0] += binom * controlPoints[i][0];
    point[1] += binom * controlPoints[i][1];
  }
  // console.log("this point")
  // console.log(point)

  return point;
}

/**
 * Compute the first derivative of a Bézier curve at parameter t.
 * @param {Array} controlPoints - Array of [x,y] control point coordinates
 * @param {number} t - Parameter value between 0 and 1
 * @returns {Array} - [dx,dy] representing the derivative vector
 */
function bezierDerivative(controlPoints, t) {
  // Convert dictionary to array if needed
  const pointsArray = Object.values(controlPoints);
  
  const n = pointsArray[0].length - 1;
  
  // Create derivative control points
  const derivativeControlPoints = [];
  for (let i = 0; i < n; i++) {
    // Calculate n * (P_{i+1} - P_i) for each consecutive pair of control points
    const dx = n * (pointsArray[0][i + 1][0] - pointsArray[0][i][0]);
    const dy = n * (pointsArray[0][i + 1][1] - pointsArray[0][i][1]);
    // console.log(dx)
    derivativeControlPoints.push([dx, dy]);
  }
  
  // Apply bezier function to the derivative control points
  return bezier(derivativeControlPoints, t);
}

/**
 * Find the point on a Bezier curve with the slope closest to a target slope
 * @param {Array} curvePoints - Array of [x,y] points representing the Bezier curve
 * @param {number} targetSlope - The desired slope to find
 * @returns {Array} - [fpr, tpr] coordinates of the point with the closest slope
 */
function findClosestSlopePoint(curvePoints, targetSlope) {
  // Ensure we have enough points
  if (!curvePoints || curvePoints.length < 2) {
    console.error("Need at least 2 points to find slopes");
    return [0, 0];
  }
  
  let bestDistance = Infinity;
  let bestFpr = 0;
  let bestTpr = 0;
  
  // Go through each pair of consecutive points and calculate slope
  for (let i = 1; i < curvePoints.length; i++) {
    const [fpr1, tpr1] = curvePoints[i - 1];
    const [fpr2, tpr2] = curvePoints[i];
    
    // Calculate slope of this segment (∆y/∆x)
    const dx = fpr2 - fpr1;
    const dy = tpr2 - tpr1;
    
    // Avoid division by zero or very small dx
    if (Math.abs(dx) < 1e-6) {
      continue;
    }
    
    const segmentSlope = dy / dx;
    
    // Calculate distance between slopes
    const distance = Math.abs(segmentSlope - targetSlope);
    
    // If this is the closest slope we've found so far
    if (distance < bestDistance) {
      bestDistance = distance;
      
      // Use midpoint of segment as the representative point
      // Or we could interpolate more precisely if needed
      bestFpr = (fpr1 + fpr2) / 2;
      bestTpr = (tpr1 + tpr2) / 2;
    }
  }
  
  return [bestFpr, bestTpr];
}

/**
 * Minimizes a single-variable function using Brent's method
 * @param {Function} func - The function to minimize
 * @param {Object} options - Optional parameters
 * @param {Array} options.bounds - [min, max] bounds for the search
 * @param {Number} options.tol - Tolerance for termination
 * @param {Number} options.maxiter - Maximum number of iterations
 * @returns {Object} - Result object with x value at minimum and function value
 */
function minimizeScalar(func, options = {}) {
  const bounds = options.bounds || [-500, 500];
  const tol = options.tol || 1e-5;
  const maxiter = options.maxiter || 500;
  
  // Implementation of Brent's method for minimization
  let a = bounds[0];
  let b = bounds[1];
  
  // Golden section numbers
  const golden = (Math.sqrt(5) - 1) / 2;
  const goldenComplement = 1 - golden;
  
  // Initial points
  let x = a + goldenComplement * (b - a);
  let w = x;
  let v = x;
  
  let fx = func(x);
  let fw = fx;
  let fv = fx;
  
  let iter = 0;
  let tol1, tol2, xm;
  
  while (iter < maxiter) {
    xm = 0.5 * (a + b);
    tol1 = tol * Math.abs(x) + 1e-10;
    tol2 = 2.0 * tol1;
    
    // Check stopping criterion
    if (Math.abs(x - xm) <= (tol2 - 0.5 * (b - a))) {
      break;
    }
    
    let p = 0, q = 0, r = 0;
    let u;
    
    // Try parabolic fit
    if (Math.abs(x - w) > tol1) {
      // Parabolic interpolation
      r = (x - w) * (fx - fv);
      q = (x - v) * (fx - fw);
      p = (x - v) * q - (x - w) * r;
      q = 2.0 * (q - r);
      
      if (q > 0) {
        p = -p;
      } else {
        q = -q;
      }
      
      // Check if parabolic fit is acceptable
      if (Math.abs(p) < Math.abs(0.5 * q * tol1) &&
          p < q * (b - x) && p < q * (x - a)) {
        u = x + p / q;
        
        // f must not be evaluated too close to bounds
        if ((u - a) < tol2 || (b - u) < tol2) {
          u = x + Math.sign(xm - x) * tol1;
        }
      } else {
        // Golden section step
        if (x >= xm) {
          u = x - golden * (x - a);
        } else {
          u = x + golden * (b - x);
        }
      }
    } else {
      // Golden section step
      if (x >= xm) {
        u = x - golden * (x - a);
      } else {
        u = x + golden * (b - x);
      }
    }
    
    // Ensure u is not too close to bounds
    if (Math.abs(u - x) < tol1) {
      u = x + Math.sign(u - x) * tol1;
    }
    
    // Evaluate function at u
    const fu = func(u);
    
    // Update points
    if (fu <= fx) {
      if (u >= x) {
        a = x;
      } else {
        b = x;
      }
      v = w; w = x; x = u;
      fv = fw; fw = fx; fx = fu;
    } else {
      if (u < x) {
        a = u;
      } else {
        b = u;
      }
      
      if (fu <= fw || w === x) {
        v = w; w = u;
        fv = fw; fw = fu;
      } else if (fu <= fv || v === x || v === w) {
        v = u;
        fv = fu;
      }
    }
    
    iter++;
  }
  
  return {
    x: x,             // Point where minimum is found
    fun: fx,          // Value of function at minimum
    nit: iter,        // Number of iterations
    success: iter < maxiter // Whether the optimization was successful
  };
}

/**
 * Find the FPR and TPR on the Bézier curve for a given slope.
 * @param {Array} controlPoints - Array of [x,y] control point coordinates
 * @param {number} desiredSlope - The target slope to find on the curve
 * @returns {Array} - [fpr, tpr, tOptimal] coordinates and parameter value
 */
function findFprTprForSlope(controlPoints, desiredSlope) {
  /**
   * Calculate error between current slope at parameter t and desired slope
   * @param {number} t - Parameter value between 0 and 1
   * @returns {number} - Squared error between current and desired slope
   */
  function slopeError(t) {
    const derivative = bezierDerivative(controlPoints, t);
    const [dx, dy] = derivative;
    // console.log(dx)

    // Avoid division by zero
    const currentSlope = dx !== 0 ? dy / dx : Infinity;
    // console.log(currentSlope)
    return Math.pow(currentSlope - desiredSlope, 2);
  }
  
  // Use scalar minimization to find the t that gives the desired slope
  const result = minimizeScalar(slopeError, {bounds: [0, 1], tol: 1e-6, maxiter: 100});
  // console.log("check results")
  // console.log(result)
  if (!result.success) {
    console.error("Optimization did not converge");
    return [0, 0, 0];
  }
  
  const tOptimal = result.x;
  const pointsArray = Object.values(controlPoints);
  // console.log(pointsArray[0])
  const point = bezier(pointsArray[0], tOptimal);
  // console.log("check point")
  // console.log(point)
  // Return FPR, TPR, and t
  return [point[0], point[1], tOptimal];
}
/**
 * Find the closest pair of TPR and FPR values to the desired values
 * @param {Array} tprs - Array of true positive rates
 * @param {Array} fprs - Array of false positive rates 
 * @param {number} desiredTpr - Target true positive rate
 * @param {number} desiredFpr - Target false positive rate
 * @returns {Object} Object containing the closest tpr, fpr, and index
 */
function findClosestPairSeparate(tprs, fprs, desiredFpr, desiredTpr) {
  // Check that the arrays have the same length
  // console.log("hiiii")
  // console.log(fprs)
  if (tprs.length !== fprs.length) {
    throw new Error("TPR and FPR arrays must have the same length");
  }
  
  let closestIndex = 0;
  let minDistance = Infinity;
  
  // Calculate the distance from each pair to the desired pair
  for (let i = 0; i < tprs.length; i++) {
    // Compute Euclidean distance
    const distance = Math.sqrt(
      Math.pow(tprs[i] - desiredTpr, 2) + 
      Math.pow(fprs[i] - desiredFpr, 2)
    );
    
    // Update if this is the closest point so far
    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = i;
    }
  }
  // console.log(closestIndex)
  // Return the closest pair and its index
  return {
    optimalPtTpr: tprs[closestIndex],
    optimalPtFpr: fprs[closestIndex],
    index: closestIndex
  };
}

/**
 * Extracts FPR and TPR arrays from curvePoints
 * @param {Array} curvePoints - Array of [x,y] points where x is FPR and y is TPR
 * @returns {Object} Object containing separate FPR and TPR arrays
 */
function extractFprTprFromCurvePoints(curvePoints) {
  const pointsArray = Object.values(curvePoints);
  // Check if curvePoints is properly formed
  // console.log(pointsArray[0].length)
  if (!Array.isArray(pointsArray) || pointsArray[0].length === 0) {
    console.error("Invalid curvePoints structure", pointsArray);
    return { fpr: [], tpr: [] };
  }
  
  // Extract FPR (x) and TPR (y) values from each point
  const opfpr = pointsArray[0].map(point => point[0]);
  const optpr = pointsArray[0].map(point => point[1]);
  
  return { opfpr, optpr };
}

export const findOptimalPoint = (uTN, uFN, uTP, uFP, pD, curvePoints, fpr, tpr, thresholds) => {
 
  const H = uTN - uFP
  const B = uTP - uFN + 0.000000001
  const HoverB = H/B
  // console.log(curvePoints)
  const slope_of_interest = pD ? HoverB * (1 - pD) / pD : HoverB * (1 - 0.5) / 0.5;
  // console.log(slope_of_interest)
  const cutoffRational = findFprTprForSlope(curvePoints, slope_of_interest)
  // console.log("cutoff rational")
  // console.log(cutoffRational)
  const [closestFpr, closestTpr] = [cutoffRational[0], cutoffRational[1]];
  // console.log(closestFpr)
  // const {opfpr, optpr} = extractFprTprFromCurvePoints(curvePoints);
  const opfpr = fpr;
  const optpr = tpr;
  const {optimalPtFpr, optimalPtTpr, index} = findClosestPairSeparate(optpr, opfpr, closestFpr, closestTpr)
  const optimalPointCutoff = thresholds[index]
  // tpr_value_optimal_pt = original_tpr
  // fpr_value_optimal_pt = original_fpr
  // console.log({optimalPtFpr, optimalPtTpr, optimalPointCutoff})
  return {optimalPtFpr, optimalPtTpr, optimalPointCutoff};
};

export const findOptimalPointApar = (uTN, uFN, uTP, uFP, pD, curvePoints, fpr, tpr, thresholds) => {
 
  const H = uTN - uFP
  const B = uTP - uFN + 0.000000001
  const HoverB = H/B
  // console.log(curvePoints)
  const slope_of_interest = pD ? HoverB * (1 - pD) / pD : HoverB * (1 - 0.5) / 0.5;
  // console.log(slope_of_interest)
  const cutoffRational = findFprTprForSlope(curvePoints, slope_of_interest)
  // console.log("cutoff rational")
  // console.log(cutoffRational)
  const [closestFpr, closestTpr] = [cutoffRational[0], cutoffRational[1]];
  // console.log(closestFpr)
  const {opfpr, optpr} = extractFprTprFromCurvePoints(curvePoints);
  // const opfpr = fpr;
  // const optpr = tpr;
  const {optimalPtFpr, optimalPtTpr, index} = findClosestPairSeparate(optpr, opfpr, closestFpr, closestTpr)
  const optimalPointCutoff = thresholds[index]
  // tpr_value_optimal_pt = original_tpr
  // fpr_value_optimal_pt = original_fpr
  // console.log({optimalPtFpr, optimalPtTpr, optimalPointCutoff})
  return {optimalPtFpr, optimalPtTpr, optimalPointCutoff};
};