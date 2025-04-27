// ApAr utility functions

// Function to calculate the model priors over ROC curve
export const modelPriorsOverRoc = (rocData, uTN, uTP, uFN, uFP, testCost, HoverB) => {
    const { fpr, tpr } = rocData;
    
    // Initialize arrays for pLs and pUs
    const pLs = [];
    const pStars = [];
    const pUs = [];
    
    // Calculate pStar - same for all points
    const pStar = (uTN - uFP) / ((uTP - uFN) + (uTN - uFP));
    
    // For each point on the ROC curve
    for (let i = 0; i < fpr.length; i++) {
      const sens = tpr[i];
      const spec = 1 - fpr[i];
      
      // Calculate pL - threshold between treat none and testing
      let pL;
      const denomPL = sens * (uTP - uFN) + (1 - spec) * (uFP - uTN);
      
      if (denomPL === 0) {
        // Handle the case where the denominator is zero
        pL = 0;
      } else {
        pL = (testCost + spec * (uTN - uFP)) / denomPL;
      }
      
      // Calculate pU - threshold between testing and treat all
      let pU;
      const denomPU = (1 - sens) * (uFN - uTP) + spec * (uTN - uFP);
      
      if (denomPU === 0) {
        // Handle the case where the denominator is zero
        pU = 1;
      } else {
        pU = (testCost + spec * (uTN - uFP)) / denomPU;
      }
      
      // Ensure values are within [0,1]
      pL = Math.max(0, Math.min(1, pL));
      pU = Math.max(0, Math.min(1, pU));
      
      // Store values
      pLs.push(pL);
      pStars.push(pStar);
      pUs.push(pU);
    }
    
    return { pLs, pStars, pUs };
  };
  
  // Function to adjust pL, pU values for classification threshold
  export const adjustpLpUClassificationThreshold = (thresholds, pLs, pUs, bounded = true) => {
    // Create a new array for the combined data
    const combined = thresholds.map((t, i) => ({ 
      threshold: t, 
      pL: pLs[i], 
      pU: pUs[i] 
    }));
    
    // Sort by threshold
    combined.sort((a, b) => a.threshold - b.threshold);
    
    // Extract the sorted values
    const sortedThresholds = combined.map(item => item.threshold);
    const sortedPLs = combined.map(item => item.pL);
    const sortedPUs = combined.map(item => item.pU);
    
    // Apply bounds if requested
    if (bounded) {
      // Check for values > 1 or < 0 and adjust
      for (let i = 0; i < sortedPLs.length; i++) {
        if (sortedPLs[i] < 0) sortedPLs[i] = 0;
        if (sortedPLs[i] > 1) sortedPLs[i] = 1;
        if (sortedPUs[i] < 0) sortedPUs[i] = 0;
        if (sortedPUs[i] > 1) sortedPUs[i] = 1;
      }
    }
    
    return { 
      thresholds: sortedThresholds, 
      pLs: sortedPLs, 
      pUs: sortedPUs 
    };
  };
  
  // Function to calculate area between pL and pU curves
  export const calculateAparArea = (thresholds, pLs, pUs) => {
    // Calculate the area under the pU curve minus the area under the pL curve
    let area = 0;
    let largestRangePrior = 0;
    let largestRangePriorThresholdIndex = 0;
    
    for (let i = 1; i < thresholds.length; i++) {
      // Width of the segment
      const deltaX = thresholds[i] - thresholds[i-1];
      
      // Average heights of the segment
      const avgPU = (pUs[i] + pUs[i-1]) / 2;
      const avgPL = (pLs[i] + pLs[i-1]) / 2;
      
      // Area of the segment
      const segmentArea = (avgPU - avgPL) * deltaX;
      
      // Check if this is the largest range
      const currentRange = pUs[i] - pLs[i];
      if (currentRange > largestRangePrior) {
        largestRangePrior = currentRange;
        largestRangePriorThresholdIndex = i;
      }
      
      // Add to total area
      area += segmentArea;
    }
    
    // Cap area at 1 and round
    area = Math.min(Math.round(area * 1000) / 1000, 1);
    
    return { 
      area, 
      largestRangePrior, 
      largestRangePriorThresholdIndex 
    };
  };
  
  // Function to calculate area for a chunk of data (for parallel processing)
  export const calculateAreaChunk = (start, end, pLs, pUs, thresholds) => {
    let chunkArea = 0;
    let largestRange = 0;
    let largestIndex = start;
    
    for (let i = start + 1; i < end; i++) {
      const deltaX = thresholds[i] - thresholds[i-1];
      const avgPU = (pUs[i] + pUs[i-1]) / 2;
      const avgPL = (pLs[i] + pLs[i-1]) / 2;
      const segmentArea = (avgPU - avgPL) * deltaX;
      
      chunkArea += segmentArea;
      
      const currentRange = pUs[i] - pLs[i];
      if (currentRange > largestRange) {
        largestRange = currentRange;
        largestIndex = i;
      }
    }
    
    return { chunkArea, largestRange, largestIndex };
  };