import React, { useState, useEffect, useCallback } from 'react';
import LoadingOverlay from '../components/LoadingOverlay';
import AparPlot from '../components/visualizations/AparPlot';
import AparControls from '../components/AparControls';

// Import utility functions
import { 
  generateSimulatedData,
  modelPriorsOverRoc, 
  adjustpLpUClassificationThreshold,
  calculateAreaChunk
} from '../utils/aparUtils';

import { 
  calculateRocCurve, 
  calculateAUC,
  fitRocBezier,
  findOptimalPoint,
  findOptimalPointApar,
  // extractFprTprFromCurvePoints
} from '../utils/rocUtils';


// Mock tooltip data (you can replace with your actual data)
const tooltipData = {
  apar: {
    tooltip_text: "Applicability Area (ApAr) represents the range of disease prevalence values where using the test is optimal.",
    link_text: "Learn more about ApAr",
    link_url: "https://pubmed.ncbi.nlm.nih.gov/38222359/"
  }
};

const ApAr = () => {

  // Loading state - only for initial page load
  const [isLoading, setIsLoading] = useState(true);
  
  // State variables
  const [dataType, setDataType] = useState('simulated');
  const [area, setArea] = useState(0);
  const [cutoff, setCutoff] = useState(0);
  const [thresholds, setThresholds] = useState([]);
  const [pLs, setPLs] = useState([]);
  const [pUs, setPUs] = useState([]);
  // const [cutoffOptimalPt, setCutoffOptimalPt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [importedData, setImportedData] = useState(null);
  const [classNames, setClassNames] = useState({
      positive: 'Diseased',
      negative: 'Healthy'
    });
  
  // Utility settings
  const [uTP, setUTP] = useState(0.8);
  const [uFP, setUFP] = useState(0.85);
  const [uTN, setUTN] = useState(1);
  const [uFN, setUFN] = useState(0);
  const [pD, setPD] = useState(0.5);
  
  // Binormal model parameters
  const [diseaseMean, setDiseaseMean] = useState(1);
  const [diseaseStd, setDiseaseStd] = useState(1);
  const [healthyMean, setHealthyMean] = useState(0);
  const [healthyStd, setHealthyStd] = useState(1);

  // ROC data
  const [predictions, setPredictions] = useState([]);
    const [trueLabels, setTrueLabels] = useState([]);
    const [rocData, setRocData] = useState({ 
      fpr: [], 
      tpr: [], 
      thresholds: [], 
      auc: 0, 
      curvePoints: [] ,
  
    });
    const [aparData, setAparData] = useState({ 
      fpr: [], 
      tpr: [], 
      thresholds: [], 
      auc: 0, 
      curvePoints: [] ,
  
    });

  const [optimalCutoff, setOptimalCutoff] = useState(0.5);
  const [optimalPointFpr, setOptimalPointFpr] = useState(0);
  const [optimalPointTpr, setOptimalPointTpr] = useState(0);
  const [tprValue, setTprValue] = useState(0);
  const [fprValue, setFprValue] = useState(0);

  const [importedFile, setImportedFile] = useState(null);
  const [isShowingApar, setIsShowingApar] = useState(false);
  const [showClassNameInputs, setShowClassNameInputs] = useState(false);
  const [positiveClassName, setPositiveClassName] = useState('');
  const [negativeClassName, setNegativeClassName] = useState('');

  // Handle loading overlay click
  const handleLoadingClick = () => {
    setIsLoading(false);
  };

  // Handle loading and initial data generation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (dataType === 'simulated') {
        generateData();
      }
      setLoading(false);
    }, );
    
    return () => clearTimeout(timer);
  }, [dataType, diseaseMean, diseaseStd, healthyMean, healthyStd, uTP, uFP, uTN, uFN, pD]);



  const generateData = () => {
      const { predictions: newPredictions, trueLabels: newLabels } = 
        generateSimulatedData(diseaseMean, diseaseStd, healthyMean, healthyStd);
      
      setPredictions(newPredictions);
      setTrueLabels(newLabels);
      calculateRoc(newPredictions, newLabels);
      // calculateOptimalCutoff();
    };

  useEffect(() => {
    if (rocData.fpr.length > 0) {
      // calculateOptimalCutoff();
      calculateOptimalCutoff();
    }
  }, [uTP, uFP, uTN, uFN, pD, rocData]);

  const calculateOptimalCutoff = () => {
      const {fpr, tpr, thresholds, curvePoints} = rocData;
      // console.log(curvePoints)
      const {optimalPtFpr, optimalPtTpr, optimalPointCutoff} = findOptimalPoint(uTN, uFN, uTP, uFP, pD, curvePoints, fpr, tpr, thresholds);
      // const { optimalPoint: newOptimalPoint, trueLabels: newLabels } = 
      //   calculateCutoffOptimal()
      // This function is now in RocPlot component
      // Only triggers the useEffect hook in that component
      setOptimalPointFpr(optimalPtFpr);
      setOptimalPointTpr(optimalPtTpr);
      // console.log(optimalCutoff)
      setOptimalCutoff(optimalPointCutoff);
  
    };

  // Function to calculate ROC curve
    const calculateRoc = (preds, labels) => {
      let { fpr, tpr, thresholds } = calculateRocCurve(preds, labels);
      const auc = calculateAUC(fpr, tpr);
      
      // Generate bezier curve points for a smooth curve (simplified in this version)
      const curvePoints = fitRocBezier(fpr, tpr);
      setRocData({ fpr, tpr, thresholds, auc, curvePoints });

      // console.log(curvePoints)
      const {opfpr, optpr} = extractFprTprFromCurvePoints(curvePoints);
      
      // console.log(rocData)
      
  
      // Set initial cutoff at 0
      handleCutoffChange(0);
      let newCutoff = 0;
      setCutoff(newCutoff);
      
      // Find index of closest threshold
      // const { thresholds, fpr, tpr } = rocData;
      let closestIndex = 0;
      let minDiff = Number.POSITIVE_INFINITY;
      
      for (let i = 0; i < thresholds.length; i++) {
        const diff = Math.abs(thresholds[i] - newCutoff);
        if (diff < minDiff) {
          minDiff = diff;
          closestIndex = i;
        }
      }
      
      setTprValue(tpr[closestIndex]);
      setFprValue(fpr[closestIndex]);
      // console.log(curvePoints)
      const {optimalPtFpr, optimalPtTpr, optimalPointCutoff} = findOptimalPoint(uTN, uFN, uTP, uFP, pD, curvePoints, fpr, tpr, thresholds);
      // const { optimalPoint: newOptimalPoint, trueLabels: newLabels } = 
      //   calculateCutoffOptimal()
      // This function is now in RocPlot component
      // Only triggers the useEffect hook in that component
      setOptimalPointFpr(optimalPtFpr);
      setOptimalPointTpr(optimalPtTpr);
      // console.log("optimalpt fpr")
      // console.log(optimalPtFpr)
      setOptimalCutoff(optimalPointCutoff);

      // use bezier curve instead
      // fpr = opfpr
      // tpr = optpr
      // console.log(curvePoints)
      setAparData({ fpr, tpr, thresholds, auc, curvePoints });
    };

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
  // Calculate ApAr from ROC data
  const calculateApAr = useCallback((data) => {
    const { fpr, tpr, thresholds, curvePoints } = data;
    // const {opfpr, optpr} = extractFprTprFromCurvePoints(curvePoints);

    // Create modelTest data structure (similar to the Python version)
    const modelTest = {
      fpr,
      tpr,
      thresholds
    };
    
    // Calculate H/B ratio for utility
    const H = uTN - uFP;
    const B = uTP - uFN + 0.000000001;
    const HoverB = H / B;
    
    // Calculate slope of interest based on prevalence
    const slope_of_interest = HoverB * (1 - pD) / pD;
    
    // Calculate priors over ROC
    const [calculatedPLs, pStars, calculatedPUs] = modelPriorsOverRoc(modelTest, uTN, uTP, uFN, uFP, 0, HoverB);
    // console.log(calculatedPLs)
    // Clean thresholds and adjust pL/pU values
    const cleanedThresholds = thresholds//.map(t => Math.min(t, 4));
    const [sortedThresholds, sortedPLs, sortedPUs] = 
      adjustpLpUClassificationThreshold(cleanedThresholds, calculatedPLs, calculatedPUs, false);
    
    // Calculate area without parallel processing
    const [area, largestRangePrior, largestRangePriorThresholdIndex] = 
      calculateAreaChunk(0, sortedPLs.length - 1, sortedPLs, sortedPUs, sortedThresholds);
    
    // Round and cap area at 1
    const finalArea = Math.min(Math.round(area * 1000) / 1000, 1);
    
    // Update state with calculated values
    setThresholds(sortedThresholds);
    setPLs(sortedPLs);
    setPUs(sortedPUs);
    setArea(finalArea);
    
    // Update optimal cutoff point if needed
    // if (largestRangePriorThresholdIndex >= 0 && largestRangePriorThresholdIndex < sortedThresholds.length) {
    //   setOptimalCutoff(sortedThresholds[largestRangePriorThresholdIndex]);
    // }
    
  }, [uTP, uFP, uTN, uFN]);

  // Effect to recalculate ApAr when parameters change
  useEffect(() => {
    if (rocData.fpr.length > 0) {
      calculateApAr(aparData);
    }
  }, [aparData, uTP, uFP, uTN, uFN, pD, calculateApAr]);

  // Handle data type change
  const handleDataTypeChange = (e) => {
    setDataType(e.target.value);
    setLoading(true);
  };

  // Handle cutoff slider change
  const handleCutoffChange = (newCutoff) => {
    setCutoff(newCutoff);
    
    // Find index of closest threshold
    const { thresholds, fpr, tpr } = rocData;
    let closestIndex = 0;
    let minDiff = Number.POSITIVE_INFINITY;
    
    for (let i = 0; i < thresholds.length; i++) {
      const diff = Math.abs(thresholds[i] - newCutoff);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }
    
    setTprValue(tpr[closestIndex]);
    setFprValue(fpr[closestIndex]);
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const csvData = event.target.result;
      processCSV(csvData);
    };
    // console.log(file)
    reader.readAsText(file);
    setImportedFile(file);
    setShowClassNameInputs(true);
  };
  
  // Process uploaded CSV
  // Process uploaded CSV
  const processCSV = (csvData) => {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',');
    
    const trueLabelsIndex = headers.findIndex(header => 
      header.trim().toLowerCase() === 'true_labels');
    const predictionsIndex = headers.findIndex(header => 
      header.trim().toLowerCase() === 'predictions');
    
    if (trueLabelsIndex === -1 || predictionsIndex === -1) {
      alert('CSV must contain "true_labels" and "predictions" columns');
      return;
    }
    
    const newTrueLabels = [];
    const newPredictions = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',');
      
      const trueLabel = parseInt(values[trueLabelsIndex].trim());
      const prediction = parseFloat(values[predictionsIndex].trim());
      
      if (!isNaN(trueLabel) && !isNaN(prediction)) {
        newTrueLabels.push(trueLabel);
        newPredictions.push(prediction);
      }
    }
    
    if (newTrueLabels.length > 0) {
      setTrueLabels(newTrueLabels);
      setPredictions(newPredictions);
      calculateRoc(newPredictions, newTrueLabels);
    }
  };
  
  // Handle class name submission
  const handleClassNameSubmit = () => {
    if (positiveClassName && negativeClassName) {
      setClassNames({
        positive: positiveClassName,
        negative: negativeClassName
      });
      setShowClassNameInputs(false);
    }
  };
  
  // Handle utility parameter changes
  const handleUTPChange = (e) => setUTP(parseFloat(e.target.value));
  const handleUFPChange = (e) => setUFP(parseFloat(e.target.value));
  const handleUTNChange = (e) => setUTN(parseFloat(e.target.value));
  const handleUFNChange = (e) => setUFN(parseFloat(e.target.value));
  const handlePDChange = (e) => setPD(parseFloat(e.target.value));
  
  // Handle binormal model parameter changes
  const handleDiseaseMeanChange = (e) => {
    setDiseaseMean(parseFloat(e.target.value));
    if (dataType === 'simulated') {
      setLoading(true);
      setTimeout(() => {
        generateSimulatedData();
        setLoading(false);
      }, 100);
    }
  };
  
  const handleDiseaseStdChange = (e) => {
    setDiseaseStd(parseFloat(e.target.value));
    if (dataType === 'simulated') {
      setLoading(true);
      setTimeout(() => {
        generateSimulatedData();
        setLoading(false);
      }, 100);
    }
  };
  
  const handleHealthyMeanChange = (e) => {
    setHealthyMean(parseFloat(e.target.value));
    if (dataType === 'simulated') {
      setLoading(true);
      setTimeout(() => {
        generateSimulatedData();
        setLoading(false);
      }, 100);
    }
  };
  
  const handleHealthyStdChange = (e) => {
    setHealthyStd(parseFloat(e.target.value));
    if (dataType === 'simulated') {
      setLoading(true);
      setTimeout(() => {
        generateSimulatedData();
        setLoading(false);
      }, 100);
    }
  };

  // Format display text
  const formatDisplayText = {
    cutoffText: `Raw Cutoff: ${cutoff.toFixed(2)}`,
    optimalCutoffText: () => {
      const HoverB = (uTN - uFP) / (uTP - uFN + 0.000000001);
      const slopeOfInterest = HoverB * (1 - pD) / pD;
      return `H/B of ${HoverB.toFixed(2)} gives a slope of ${slopeOfInterest.toFixed(2)} at the optimal cutoff ${optimalCutoff.toFixed(2)}`;
    },
    diseaseMeanText: `Disease Mean: ${diseaseMean.toFixed(2)}`,
    diseaseStdText: `Disease Standard Deviation: ${diseaseStd.toFixed(2)}`,
    healthyMeanText: `Healthy Mean: ${healthyMean.toFixed(2)}`,
    healthyStdText: `Healthy Standard Deviation: ${healthyStd.toFixed(2)}`,
    uTPText: `Utility of true positive (uTP): ${uTP.toFixed(2)}`,
    uFPText: `Utility of false positive (uFP): ${uFP.toFixed(2)}`,
    uTNText: `Utility of true negative (uTN): ${uTN.toFixed(2)}`,
    uFNText: `Utility of false negative (uFN): ${uFN.toFixed(2)}`,
    pDText: `Disease Prevalence: ${pD.toFixed(2)}`
  };

  return (
    <div className="main-content" style={{ height: '100vh', display: 'flex', width: '100%', paddingLeft: '10px', paddingTop: '5px', flexDirection: 'row' }}>


      {isLoading && (
        <LoadingOverlay 
        text="Welcome to the ApAr dashboard!
        <br /><br />
        Click anywhere to dismiss or this message will disappear automatically."
        onHide={handleLoadingClick}
        />
      )}
      
      {/* Left sidebar with controls */}
      <div style={{ width: '20%', display: 'flex', flexDirection: 'column' }}>
        <AparControls 
          dataType={dataType}
          onDataTypeChange={handleDataTypeChange}
          onFileUpload={handleFileUpload}
          cutoff={cutoff}
          cutoffMin={dataType === 'simulated' ? -5 : 0}
          cutoffMax={dataType === 'simulated' ? 5 : 1}
          onCutoffChange={(e) => handleCutoffChange(parseFloat(e.target.value))}
          uTP={uTP}
          onUTPChange={handleUTPChange}
          uFP={uFP}
          onUFPChange={handleUFPChange}
          uTN={uTN}
          onUTNChange={handleUTNChange}
          uFN={uFN}
          onUFNChange={handleUFNChange}
          pD={pD}
          onPDChange={handlePDChange}
          diseaseMean={diseaseMean}
          onDiseaseMeanChange={handleDiseaseMeanChange}
          diseaseStd={diseaseStd}
          onDiseaseStdChange={handleDiseaseStdChange}
          healthyMean={healthyMean}
          onHealthyMeanChange={handleHealthyMeanChange}
          healthyStd={healthyStd}
          onHealthyStdChange={handleHealthyStdChange}
          optimalCutoffText={formatDisplayText.optimalCutoffText()}
          formatDisplayText={formatDisplayText}
        />
      </div>
      
      {/* Main visualization area */}
      <div style={{ width: '70%', display: 'flex', flexDirection: 'column', marginTop: '45px' }}>
        {!loading && pLs.length > 0 && pUs.length > 0 && (
          <AparPlot 
            thresholds={thresholds}
            pLs={pLs}
            pUs={pUs}
            cutoff={cutoff}
            optimalPointFpr={optimalPointFpr}
            optimalPointTpr={optimalPointTpr}
            optimalCutoff={optimalCutoff}
            area={area}
            tooltipData={tooltipData.apar}
            width='70vw'
            height='92vh'
          />
        )}
      </div>
      
      {/* Hidden interval component for initial rendering */}
      <div style={{ display: 'none' }}>
        <div id="apar-loading-overlay-interval" />
      </div>
    </div>
  );
};

export default ApAr;