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

// Function to generate normal distribution data
export const generateNormalDistribution = (mean, stdDev, size) => {
  // Box-Muller transform to generate normally distributed random numbers
  const result = [];
  for (let i = 0; i < size; i++) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    result.push(z * stdDev + mean);
  }
  return result;
};

// Function to generate simulated data based on binormal model
export const generateSimulatedData = (diseaseMean, diseaseStd, healthyMean, healthyStd, size = 1000) => {
  const trueLabels = Array(size).fill(0).map(() => Math.random() < 0.5 ? 1 : 0);
  
  const predictions = trueLabels.map(label => {
    if (label === 1) {
      return generateNormalDistribution(diseaseMean, diseaseStd, 1)[0];
    } else {
      return generateNormalDistribution(healthyMean, healthyStd, 1)[0];
    }
  });
  
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

// Function to find FPR and TPR values for a given slope on the ROC curve
export const findFprTprForSlope = (curvePoints, targetSlope) => {
  let bestDistance = Number.POSITIVE_INFINITY;
  let bestFpr = 0;
  let bestTpr = 0;
  
  for (let i = 1; i < curvePoints.length; i++) {
    const [fpr1, tpr1] = curvePoints[i - 1];
    const [fpr2, tpr2] = curvePoints[i];
    
    // Calculate slope of line segment
    const slopeSeg = (tpr2 - tpr1) / (fpr2 - fpr1);
    
    // Calculate distance between slopes
    const distance = Math.abs(slopeSeg - targetSlope);
    
    if (distance < bestDistance) {
      bestDistance = distance;
      
      // Interpolate to find the exact point where the slope equals targetSlope
      // For simplicity, we'll just use the midpoint of the segment
      bestFpr = (fpr1 + fpr2) / 2;
      bestTpr = (tpr1 + tpr2) / 2;
    }
  }
  
  return [bestFpr, bestTpr];
};

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