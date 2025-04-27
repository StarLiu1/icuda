import React, { useEffect } from 'react';
import Plot from 'react-plotly.js';
import InfoButton from '../InfoButton';
import { calculatePartialAUC, findClosestPair, findFprTprForSlope } from '../../utils/rocUtils';

// Mock tooltip data
const tooltipData = {
  roc: {
    tooltip_text: "Use the ROC curve to visualize the trade-off between sensitivity and specificity.",
    link_text: "Learn more about ROC curves",
    link_url: "https://en.wikipedia.org/wiki/Receiver_operating_characteristic"
  }
};

const RocPlot = ({ 
  rocData, 
  cutoff, 
  optimalCutoff, 
  drawMode, 
  shapes, 
  setShapes, 
  partialAUC, 
  setPartialAUC, 
  tprValue, 
  fprValue, 
  onCutoffChange, 
  toggleDrawMode,
  uTP,
  uFP,
  uTN,
  uFN,
  pD
}) => {
  
  // Handle plot click
  const handleRocPlotClick = (event) => {
    const { points } = event;
    if (!points || points.length === 0) return;
    
    const x = points[0].x;
    const y = points[0].y;
    
    if (drawMode === 'point') {
      // Point mode: find closest point on curve
      const { fpr, tpr, thresholds } = rocData;
      const { tpr: closestTpr, fpr: closestFpr, index } = 
        findClosestPair(tpr, fpr, y, x);
      
      onCutoffChange(thresholds[index]);
    } else {
      // Line mode: add/remove lines to define partial AUC region
      handleLineDrawing(x, y);
    }
  };
  
  // Handle line drawing for partial AUC calculation
  const handleLineDrawing = (x, y) => {
    // Copy current shapes
    const newShapes = [...shapes];
    
    // Check if line exists near clicked point
    const tolerance = 0.02;
    const lineExists = newShapes.some(shape => 
      (shape.x0 === 0 && shape.x1 === 1 && Math.abs(shape.y0 - y) < tolerance) ||
      (shape.y0 === 0 && shape.y1 === 1 && Math.abs(shape.x0 - x) < tolerance)
    );
    
    if (lineExists) {
      // Remove line
      const filteredShapes = newShapes.filter(shape => 
        !(shape.x0 === 0 && shape.x1 === 1 && Math.abs(shape.y0 - y) < tolerance) &&
        !(shape.y0 === 0 && shape.y1 === 1 && Math.abs(shape.x0 - x) < tolerance)
      );
      setShapes(filteredShapes);
      
      if (filteredShapes.length < 2) {
        setPartialAUC("Click to add lines and calculate partial AUC.");
      }
    } else if (newShapes.length === 0) {
      // Add horizontal line
      newShapes.push({
        type: 'line',
        x0: 0,
        y0: y,
        x1: 1,
        y1: y,
        line: {
          color: 'red',
          width: 2,
          dash: 'dash',
        }
      });
      setShapes(newShapes);
    } else if (newShapes.length === 1) {
      // Add second line (vertical or horizontal)
      if (newShapes[0].y0 === 0 && newShapes[0].y1 === 1) {
        // Existing line is vertical, add horizontal
        newShapes.push({
          type: 'line',
          x0: 0,
          y0: y,
          x1: 1,
          y1: y,
          line: {
            color: 'red',
            width: 2,
            dash: 'dash',
          }
        });
      } else {
        // Existing line is horizontal, add vertical
        newShapes.push({
          type: 'line',
          x0: x,
          y0: 0,
          x1: x,
          y1: 1,
          line: {
            color: 'red',
            width: 2,
            dash: 'dash',
          }
        });
      }
      setShapes(newShapes);
      
      // Calculate partial AUC if we have two lines
      if (newShapes.length === 2) {
        calculatePartialAUCFromShapes(newShapes);
      }
    }
  };
  
  // Calculate partial AUC from shape lines
  const calculatePartialAUCFromShapes = (shapes) => {
    if (shapes.length !== 2) return;
    
    let x0, y0, x1, y1;
    
    // Identify horizontal and vertical lines
    if (shapes[0].y1 < shapes[1].y1) {
      // First is horizontal, second is vertical
      y0 = shapes[0].y0;
      x1 = shapes[1].x0;
    } else {
      // First is vertical, second is horizontal
      x1 = shapes[0].x0;
      y0 = shapes[1].y0;
    }
    
    // Default values
    x0 = 0;
    y1 = 1;
    
    // Calculate partial AUC
    const pAUC = calculatePartialAUC(rocData.fpr, rocData.tpr, x0, x1, y0);
    
    setPartialAUC(pAUC.toFixed(4));
  };
  
  // Generate ROC plot config
  const generateRocPlot = () => {
    const { fpr, tpr, curvePoints, auc } = rocData;
    
    const data = [
      // ROC Curve (empirical points)
      {
        x: fpr,
        y: tpr,
        mode: 'lines',
        name: 'ROC Curve',
        line: { color: 'blue' }
      },
      // Bezier Curve
      {
        x: curvePoints.map(p => p[0]),
        y: curvePoints.map(p => p[1]),
        mode: 'lines',
        name: 'Bezier Curve',
        line: { color: 'blue' }
      },
      // Selected Cutoff Point
      {
        x: [fprValue],
        y: [tprValue],
        mode: 'markers',
        name: 'Selected Cutoff Point',
        marker: { color: 'blue', size: 10 }
      },
      // Optimal Cutoff Point based on utility
      {
        x: [rocData.fpr.find((_, i) => 
          Math.abs(rocData.thresholds[i] - optimalCutoff) < 0.001) || 0],
        y: [rocData.tpr.find((_, i) =>
          Math.abs(rocData.thresholds[i] - optimalCutoff) < 0.001) || 0],
        mode: 'markers',
        name: 'Optimal Cutoff Point',
        marker: { color: 'red', size: 10 }
      }
    ];
    
    // If there are filled areas for partial AUC, add them
    if (shapes.length === 2) {
      // Create points for the filled area (simplified version)
      const fillX = [];
      const fillY = [];
      
      // Get bounds of the region
      let minX = 0, maxX = 0, minY = 0;
      if (shapes[0].x0 === 0 && shapes[0].x1 === 1) {
        // First shape is horizontal
        minY = shapes[0].y0;
        maxX = shapes[1].x0;
      } else {
        // First shape is vertical
        maxX = shapes[0].x0;
        minY = shapes[1].y0;
      }
      
      // Find points in ROC curve within the region
      for (let i = 0; i < fpr.length; i++) {
        if (fpr[i] >= 0 && fpr[i] <= maxX && tpr[i] >= minY) {
          fillX.push(fpr[i]);
          fillY.push(tpr[i]);
        }
      }
      
      // Add corners of the region
      fillX.push(maxX, 0, 0);
      fillY.push(minY, minY, fillY[0]);
      
      // Add filled area trace
      data.push({
        x: fillX,
        y: fillY,
        fill: 'toself',
        mode: 'lines',
        line: { color: 'rgba(0,0,0,0)' },
        fillcolor: 'rgba(0, 100, 200, 0.3)',
        name: 'Partial AUC Region'
      });
    }
    
    const layout = {
      title: {
        text: 'Receiver Operating Characteristic (ROC) Curve',
        x: 0.5,
        xanchor: 'center'
      },
      xaxis: { title: 'False Positive Rate (FPR)' },
      yaxis: { title: 'True Positive Rate (TPR)' },
      template: 'plotly_white',
      margin: { l: 30, r: 20, t: 30, b: 10 },
      shapes: shapes,
      annotations: [
        {
          x: 1,
          y: 0.05,
          xref: 'paper',
          yref: 'paper',
          text: `pAUC = ${typeof partialAUC === 'string' ? partialAUC : partialAUC.toFixed(3)}`,
          showarrow: false,
          font: { size: 12, color: 'black' },
          align: 'right',
          bgcolor: 'white',
          bordercolor: 'black',
          borderwidth: 1
        },
        {
          x: 1,
          y: 0.1,
          xref: 'paper',
          yref: 'paper',
          text: `AUC = ${auc.toFixed(3)}`,
          showarrow: false,
          font: { size: 12, color: 'black' },
          align: 'right',
          bgcolor: 'white',
          bordercolor: 'black',
          borderwidth: 1
        }
      ]
    };
    
    return { data, layout };
  };
  
  return (
    <div>
      <Plot
        data={generateRocPlot().data}
        layout={generateRocPlot().layout}
        onClick={handleRocPlotClick}
        style={{ height: '47vh', width: '35vw' }}
      />
      
      <div style={{ display: 'flex', alignItems: 'center', height: '5%', margin: 0 }}>
        <div style={{ width: '5%' }}></div>
        <button
          onClick={toggleDrawMode}
          style={{ paddingBottom: '0', width: '70%', marginLeft: '5%' }}
        >
          {drawMode === 'point' 
            ? 'Switch to Line Mode (select region for partial AUC)' 
            : 'Switch to Point Mode (select operating point)'}
        </button>
        <div style={{ width: '5%' }}></div>
        
        <InfoButton
          tooltipId="roc"
          tooltipText={tooltipData.roc.tooltip_text}
          linkText={tooltipData.roc.link_text}
          linkUrl={tooltipData.roc.link_url}
          top="-215px"
          left="50%"
          width="200px"
        />
      </div>
    </div>
  );
};

export default RocPlot;