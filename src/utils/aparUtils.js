// Import necessary functions from rocUtils
// Import necessary functions from rocUtils
import { treatAll, treatNone, test } from './rocUtils';


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

/**
 * Function that identifies the three thresholds formed by the three utility lines.
 * Note: This JavaScript implementation uses math.js library for symbolic math operations
 * 
 * @param {number|Array} sens - sensitivity of the test
 * @param {number|Array} spec - specificity of the test
 * @param {number} uTN - utility of true negative
 * @param {number} uTP - utility of true positive
 * @param {number} uFN - utility of false negative
 * @param {number} uFP - utility of false positive
 * @param {number} u - utility of the test itself
 * @returns {Array} If scalar inputs: a list of three thresholds [pL, pStar, pU]
 *                  If array inputs: three lists [pLs, pStars, pUs] containing thresholds for each input pair
 */
function pLpStarpUThresholds(sens, spec, uTN, uTP, uFN, uFP, u, simulated = true) {
  // Determine if inputs are scalar or array-like
  const isArrayInput = Array.isArray(sens);
  
  // For scalar inputs
  if (!isArrayInput) {
      // For symbolic math in JavaScript, we'll need to solve equations algebraically
      // First, let's calculate pStar (treatment threshold) - independent of sens/spec
      // treatAll(x, uFP, uTP) - treatNone(x, uFN, uTN) = 0
      // x * uTP + (1-x) * uFP - (x * uFN + (1-x) * uTN) = 0
      // Simplifying: x * (uTP - uFN) + (1-x) * (uFP - uTN) = 0
      // x * (uTP - uFN) - x * (uFP - uTN) + (uFP - uTN) = 0
      // x * ((uTP - uFN) - (uFP - uTN)) = -(uFP - uTN)
      // x = (uTN - uFP) / ((uTP - uFN) - (uFP - uTN))
      
      let pStar;
      const denominator = (uTP - uFN) - (uFP - uTN);
      
      if (denominator === 0) {
          pStar = -999; // No solution case
      } else {
          pStar = (uTN - uFP) / denominator;
      }
      
      // Bound pStar within [0, 1]
      if (!simulated){
        pStar = pStar > 1 ? 1 : pStar;
      }

      pStar = (pStar < 0 && pStar !== -999) ? 0 : pStar;
      
      // Calculate pU (upper threshold)
      // treatAll(x, uFP, uTP) - test(x, sens, spec, uTN, uTP, uFN, uFP, u) = 0
      // This is a more complex equation to solve algebraically
      // We can rearrange to get: ax + b = 0 and solve for x
      
      // Expanding treatAll: x * uTP + (1-x) * uFP
      // Expanding test: x * sens * uTP + x * (1-sens) * uFN + (1-x) * (1-spec) * uFP + (1-x) * spec * uTN + u
      
      // Subtracting test from treatAll and grouping terms with x:
      // x * (uTP - sens * uTP - (1-sens) * uFN + (1-spec) * uFP + spec * uTN)
      // + ((1-x) * uFP - (1-x) * (1-spec) * uFP - (1-x) * spec * uTN - u)
      
      // Simplifying:
      // x * (uTP - sens * uTP - (1-sens) * uFN + (1-spec) * uFP + spec * uTN)
      // + (uFP - x * uFP - (1-spec) * uFP + x * (1-spec) * uFP - spec * uTN + x * spec * uTN - u)
      
      const a = (uTP - sens * uTP - (1-sens) * uFN + (1-spec) * uFP + spec * uTN)
                - (uFP - (1-spec) * uFP - spec * uTN);
      const b = uFP - (1-spec) * uFP - spec * uTN - u;
      
      let pU;
      if (a === 0) {
          pU = -999; // No solution case
      } else {
          pU = -b / a;
      }
      
      // Bound pU within [0, 1]
      if (!simulated){
        pU = pU > 1 ? 1 : pU;
      }
      
      pU = (pU < 0 && pU !== -999) ? 0 : pU;
      
      // Calculate pL (lower threshold)
      // Similar process for treatNone(x, uFN, uTN) - test(x, sens, spec, uTN, uTP, uFN, uFP, u) = 0
      
      const c = (uFN - uTN) - (sens * uTP + (1-sens) * uFN - (1-spec) * uFP - spec * uTN);
      const d = uTN - ((1-spec) * uFP + spec * uTN + u);
      
      let pL;
      if (c === 0) {
          pL = -999; // No solution case
      } else {
          pL = -d / c;
      }
      
      // Bound pL within [0, 1]
      if (!simulated){
        pL = pL > 1 ? 1 : pL;
      }
      
      pL = (pL < 0 && pL !== -999) ? 0 : pL;
      
      return [pL, pStar, pU];
  } else {
      // For array inputs
      const sensArray = Array.isArray(sens) ? sens : [sens];
      const specArray = Array.isArray(spec) ? spec : [spec];
      
      // Calculate pStar (independent of sens/spec)
      const denominator = (uTP - uFN) - (uFP - uTN);
      let pStarVal;
      
      if (denominator === 0) {
          pStarVal = -999; // No solution case
      } else {
          pStarVal = (uTN - uFP) / denominator;
      }
      
      // Bound pStar within [0, 1]
      if (!simulated){
        pStarVal = pStarVal > 1 ? 1 : pStarVal;
      }
      
      pStarVal = (pStarVal < 0 && pStarVal !== -999) ? 0 : pStarVal;
      
      // Initialize result arrays
      const pLs = [];
      const pStars = [];
      const pUs = [];
      
      // Process each (sens, spec) pair
      for (let i = 0; i < Math.min(sensArray.length, specArray.length); i++) {
          const s = sensArray[i];
          const sp = specArray[i];
          
          // Calculate pU
          const a = uTP - uFP - s * uTP - (1-s) * uFN + (1-sp) * uFP + sp * uTN;
          const b = uFP - (1-sp) * uFP - sp * uTN - u;
          
          let pU;
          if (a === 0) {
              pU = -999; // No solution case
          } else {
              pU = -b / a;
          }
          
          // Bound pU within [0, 1]
          if (!simulated){
            pU = pU > 1 ? 1 : pU;
          }
          pU = (pU < 0 && pU !== -999) ? 0 : pU;
          
          // Calculate pL
          const c = (uFN - uTN) - (s * uTP + (1-s) * uFN - (1-sp) * uFP - sp * uTN);
          const d = uTN - ((1-sp) * uFP + sp * uTN + u);
          
          let pL;
          if (c === 0) {
              pL = -999; // No solution case
          } else {
              pL = -d / c;
          }
          
          // Bound pL within [0, 1]
          if (!simulated){
            pL = pL > 1 ? 1 : pL;
          }
          pL = (pL < 0 && pL !== -999) ? 0 : pL;
          
          // Add results to arrays
          pLs.push(pL);
          pStars.push(pStarVal); // Same for all pairs
          pUs.push(pU);
      }
      
      return [pLs, pStars, pUs];
  }
}

/**
 * Processes ROC data to calculate model priors without parallel processing
 * @param {Object} modelChosen - Object with tpr and fpr arrays
 * @param {number} uTN - utility of true negative
 * @param {number} uTP - utility of true positive
 * @param {number} uFN - utility of false negative
 * @param {number} uFP - utility of false positive
 * @param {number} u - utility of the test itself
 * @param {number} HoverB - Harm over benefit ratio
 * @returns {Array} - Arrays of [pLs, pStars, pUs]
 */
export function modelPriorsOverRoc(modelChosen, uTN, uTP, uFN, uFP, u = 0, HoverB) {
  // Extract tpr and fpr arrays from modelChosen
  let tprArray = [];
  let fprArray = [];
  
  if (modelChosen.tpr && modelChosen.fpr) {
    tprArray = Array.isArray(modelChosen.tpr) ? [...modelChosen.tpr] : [modelChosen.tpr];
    fprArray = Array.isArray(modelChosen.fpr) ? [...modelChosen.fpr] : [modelChosen.fpr];
  }
  
  // Ensure arrays are not empty
  if (tprArray.length <= 1) {
    return [[0], [0], [0]];
  }
  
  // Convert fpr to specificity
  const specArray = fprArray.map(fp => 1 - fp);
  
  // Calculate thresholds
  return pLpStarpUThresholds(tprArray, specArray, uTN, uTP, uFN, uFP, u);
}

/**
 * Fill in missing priors with appropriate values
 * @param {Array} priorList - list of lower or upper thresholds
 * @param {boolean} lower - true for lower thresholds, false for upper
 * @returns {Array} - modified list with filled values
 */
export function priorFiller(priorList, lower) {
  const priorArray = [...priorList];
  const lenList = priorArray.length;
  const midPoint = lenList / 2;
  
  for (let i = 0; i < lenList; i++) {
    if (priorArray[i] === -999) {
      if (lower) {
        // For lower thresholds
        if (i < midPoint) {
          priorArray[i] = 1;
        } else {
          priorArray[i] = 0;
        }
      } else {
        // For upper thresholds
        if (i < midPoint) {
          priorArray[i] = 0;
        } else {
          priorArray[i] = 0;
        }
      }
    }
  }
  
  return priorArray;
}

/**
 * Additional modifications to prior values
 * @param {Array} priorList - list of priors
 * @returns {Array} - modified list
 */
function priorModifier(priorList) {
  // Convert to a new array to avoid modifying the original
  const priorArray = [...priorList];
  const lenList = priorArray.length;
  const midPoint = lenList / 2;
  
  // Create shifted arrays for easier conditions checking
  // JavaScript doesn't have np.roll, so we'll implement it manually
  const roll = (arr, shift) => {
      const len = arr.length;
      const normalizedShift = ((shift % len) + len) % len;
      return [...arr.slice(-normalizedShift), ...arr.slice(0, -normalizedShift)];
  };
  console.log(priorArray)
  const shifted_plus_1 = roll(priorArray, 1);
  const shifted_plus_2 = roll(priorArray, 2);
  const shifted_plus_3 = roll(priorArray, 3);
  
  const shifted_minus_1 = roll(priorArray, -1);
  const shifted_minus_2 = roll(priorArray, -2);
  const shifted_minus_3 = roll(priorArray, -3);
  
  // Helper function to find series of 1s followed by 0s in first half
  const findAndModifyOnesFollowedByZeros = () => {
    let i = 0;
    while (i < midPoint) {
      if (priorArray[i] === 1) {
        // Find the end of the series of 1s
        let onesStart = i;
        while (i < midPoint && priorArray[i] === 1) {
          i++;
        }
        // Check if the series of 1s is followed by 0s
        if (i < lenList && priorArray[i] === 0) {
          // Change all the 1s in this series to 0s
          for (let j = onesStart; j < i; j++) {
            priorArray[j] = 0;
          }
        }
      } else {
        i++;
      }
    }
  };
  
  // Apply the new condition for first half
  findAndModifyOnesFollowedByZeros();
  
  // Process first half (existing conditions)
  for (let i = 0; i < midPoint; i++) {
      // Condition 1: if current is 1 and next values are increasing
      if (priorArray[i] === 1 && 
          shifted_plus_2[i] > shifted_plus_1[i] && 
          shifted_plus_3[i] > shifted_plus_2[i]) {
          // priorArray[i] = 0;
      }
      
      // Condition 2: if current is 1 and next values are decreasing
      if (priorArray[i] === 1 && 
          shifted_plus_2[i] < shifted_plus_1[i] && 
          shifted_plus_3[i] < shifted_plus_2[i]) {
          priorArray[i] = 0;
      }
  }
  
  // Process second half
  for (let i = midPoint; i < lenList; i++) {
      // Condition 3: if current is 1 and previous values are increasing
      if (priorArray[i] === 1 && 
          shifted_minus_2[i] > shifted_minus_1[i] && 
          shifted_minus_3[i] > shifted_minus_2[i]) {
          // priorArray[i] = 0;
      }
      
      // Condition 4: if current is 0 and previous values are decreasing
      if (priorArray[i] === 0 && 
          shifted_minus_2[i] < shifted_minus_1[i] && 
          shifted_minus_3[i] < shifted_minus_2[i]) {
          // priorArray[i] = 1;
      }
  }
  
  // Special condition for last element
  if (lenList > 1 && priorArray[lenList - 1] === 0 && priorArray[lenList - 2] !== 0) {
      priorArray[lenList - 1] = priorArray[lenList - 2];
  }
  
  return priorArray;
}

/**
 * Extract and adjust thresholds to ensure they are within [0,1]
 * @param {Object} row - Object with thresholds property
 * @returns {Array} - adjusted thresholds
 */
export function extractThresholds(row, simulated = true) {
  if (!row.thresholds) return null;
  if (!simulated){
    // Cap thresholds at 1
    return row.thresholds.map(t => Math.min(t, 1));
  }else{
    return row.thresholds
  }
  
  
}

/**
 * Adjust priors and thresholds
 * @param {Array} thresholds - classification thresholds
 * @param {Array} pLs - lower thresholds
 * @param {Array} pUs - upper thresholds
 * @param {boolean} bounded - whether to bound values
 * @returns {Array} - [thresholds, pLs, pUs]
 */
export function adjustpLpUClassificationThreshold(thresholds, pLs, pUs, bounded = true) {
  // Process pLs and pUs
  let processedPLs = priorFiller(pLs, true);
  processedPLs = priorModifier(processedPLs);
  
  let processedPUs = priorFiller(pUs, false);
  processedPUs = priorModifier(processedPUs);
  
  // Create a copy of thresholds for modification
  let processedThresholds = [...thresholds];
  
  // Adjust thresholds if bounded
  if (bounded) {
    processedThresholds = processedThresholds.map(t => Math.min(t, 1));
  }
  
  // Check for infinity in first threshold
  if (processedThresholds[0] === Infinity || processedThresholds[0] === Number.POSITIVE_INFINITY) {
    processedThresholds[0] = processedThresholds[1];
  }
  
  // Check if last threshold is 0 and adjust
  if (processedThresholds[processedThresholds.length - 1] === 0) {
    processedThresholds[processedThresholds.length - 1] = 0.0001;
    processedThresholds.push(0);
    
    // Adjust pLs and pUs arrays
    processedPLs.unshift(0);
    processedPUs.unshift(0);
    processedPLs[1] = processedPLs[2]; // Adjust second element
    processedPUs[1] = processedPUs[2]; // Adjust second element
  }
  
  return [processedThresholds, processedPLs, processedPUs];
}

/**
 * Calculate line equation value
 * @param {number} x - desired x value
 * @param {number} x0 - x coordinate of first point
 * @param {number} x1 - x coordinate of second point
 * @param {number} y0 - y coordinate of first point
 * @param {number} y1 - y coordinate of second point
 * @returns {number} - f(x)
 */
export function eqLine(x, x0, x1, y0, y1) {
  // Guard against division by zero
  if (x1 === x0) return y0;
  
  const slope = (y1 - y0) / (x1 - x0);
  return slope * (x - x0) + y0;
}

/**
 * Calculate area for a chunk of data without parallel processing
 * @param {number} start - start index
 * @param {number} end - end index
 * @param {Array} pLs - lower thresholds
 * @param {Array} pUs - upper thresholds
 * @param {Array} thresholds - classification thresholds
 * @returns {Array} - [area, largestRangePrior, largestRangePriorThresholdIndex]
 */
export function calculateAreaChunk(start, end, pLs, pUs, thresholds) {
  let area = 0;
  let largestRangePrior = 0;
  let largestRangePriorThresholdIndex = -999;
  let dx = 0;

  
  for (let i = start; i < end; i++) {
    if (i < pLs.length - 1) {
      // Extract values for convenience
      const pL0 = pLs[i];
      const pL1 = pLs[i + 1];
      const pU0 = pUs[i];
      const pU1 = pUs[i + 1];
      const t0 = thresholds[i];
      const t1 = thresholds[i + 1];
      console.log(area)
      // Skip if thresholds are identical (would cause division by zero)
      if (t0 === t1) continue;

      if (t1 - t0 == -Infinity){
        // console.log(t1 - t0)
        dx = 0;
      }else{
        console.log('not neg inf')
        console.log(t0 - t1)

        dx = t0 - t1;
      }
      
      // Case 1: Both endpoints have valid ranges (pL < pU)
      if (pL0 < pU0 && pL1 < pU1) {
        console.log('here')
        // Find the range of priors
        const rangePrior = pU0 - pL0;
        
        // Check if it's the largest range of priors
        if (rangePrior > largestRangePrior) {
          largestRangePrior = rangePrior;
          largestRangePriorThresholdIndex = i;
        }
        
        // Calculate average range using trapezoidal rule
        const avgRangePrior = ((pU0 - pL0) + (pU1 - pL1)) / 2;
        // console.log(dx)
        // Accumulate area
        area += Math.abs(avgRangePrior) * Math.abs(dx);
      }
      // Case 2: Intersection where pL > pU at first point, pL < pU at second point
      else if (pL0 > pU0 && pL1 < pU1) {
        // Calculate intersection point
        const m_upper = (pU1 - pU0) / (dx);
        const m_lower = (pL1 - pL0) / (dx);
        
        // Skip if lines are parallel
        if (m_upper === m_lower) continue;
        
        // Calculate x at intersection
        const xIntersect = t0 + (pL0 - pU0) / (m_upper - m_lower);
        const yIntersect = eqLine(xIntersect, t0, t1, pL0, pL1);
        
        // Calculate average range (0 at intersection, full range at endpoint)
        const avgRangePrior = (0 + (pU1 - pL1)) / 2;
        
        // Only accumulate area if intersection is within the segment
        if (xIntersect >= Math.min(t0, t1) && xIntersect <= Math.max(t0, t1)) {
          area += Math.abs(avgRangePrior) * Math.abs(t1 - xIntersect);
        }
      }
      // Case 3: Intersection where pL < pU at first point, pL > pU at second point
      else if (pL0 < pU0 && pL1 > pU1) {
        // Calculate intersection point
        const m_upper = (pU1 - pU0) / (dx);
        const m_lower = (pL1 - pL0) / (dx);
        
        // Skip if lines are parallel
        if (m_upper === m_lower) continue;
        
        // Calculate x at intersection
        const xIntersect = t0 + (pL0 - pU0) / (m_upper - m_lower);
        
        // Only proceed if intersection is within segment
        if (xIntersect >= Math.min(t0, t1) && xIntersect <= Math.max(t0, t1)) {
          // Find the range of priors at the first point
          const rangePrior = pU0 - pL0;
          
          // Check if it's the largest range of priors
          if (rangePrior > largestRangePrior) {
            largestRangePrior = rangePrior;
            largestRangePriorThresholdIndex = i;
          }
          
          // Calculate average range (full range at first point, 0 at intersection)
          const avgRangePrior = ((pU0 - pL0) + 0) / 2;
          
          // Accumulate area
          // console.log(area)
          area += Math.abs(avgRangePrior) * Math.abs(xIntersect - t0);
        }
      }
    }
  }
  console.log(area)
  console.log(largestRangePrior)
  console.log(largestRangePriorThresholdIndex)
  return [area, largestRangePrior, largestRangePriorThresholdIndex];
}

/**
 * Calculate applicability area without parallel processing
 * @param {Object} modelRow - model data with TPR and FPR
 * @param {Array} thresholds - classification thresholds
 * @param {Array} utils - utility values [uTN, uTP, uFN, uFP, u]
 * @param {number} p - probability value
 * @param {number} HoverB - harm over benefit ratio
 * @returns {Array} - statistics about applicable area
 */
export function applicableArea(modelRow, thresholds, utils, p, HoverB) {
  const [uTN, uTP, uFN, uFP, u] = utils;
  let area = 0;
  let largestRangePrior = 0;
  let largestRangePriorThresholdIndex = -999;
  let withinRange = false;
  let leastViable = 1;
  
  // Get priors over ROC curve
  const [pLs, pStars, pUs] = modelPriorsOverRoc(modelRow, uTN, uTP, uFN, uFP, u, HoverB);
  
  // Adjust thresholds and priors
  const cappedThresholds = thresholds.map(t => Math.min(t, 1));
  const [adjustedThresholds, adjustedPLs, adjustedPUs] = 
    adjustpLpUClassificationThreshold(cappedThresholds, pLs, pUs);
  
  // Calculate area in a single chunk
  const [chunkArea, chunkLargestRange, chunkLargestIdx] = 
    calculateAreaChunk(0, adjustedPLs.length - 1, adjustedPLs, adjustedPUs, adjustedThresholds);
  
  area = chunkArea;
  
  if (chunkLargestRange > largestRangePrior) {
    largestRangePrior = chunkLargestRange;
    largestRangePriorThresholdIndex = chunkLargestIdx;
  }
  
  // Round and cap area at 1
  area = Math.min(Math.round(area * 1000) / 1000, 1);
  
  // Check if probability is within range
  withinRange = (p > 0 && p < largestRangePrior);
  
  return [area, largestRangePriorThresholdIndex, withinRange, leastViable, uFP];
}