import React from 'react';
import Plot from 'react-plotly.js';
import InfoButton from '../InfoButton';
import { treatAll, treatNone, test, solveThreshold } from '../../utils/rocUtils';

// Mock tooltip data
const tooltipData = {
  utility: {
    tooltip_text: "The utility plot shows expected outcomes for different testing strategies.",
    link_text: "Learn more about expected utility",
    link_url: "https://en.wikipedia.org/wiki/Utility"
  }
};

const UtilityPlot = ({ 
  tprValue, 
  fprValue, 
  optimalCutoff,
  optimalTpr,
  optimalFpr,
  uTP, 
  uFP, 
  uTN, 
  uFN,
  height = '44vh', 
  width = '40vw' 
}) => {
  
  // Generate Utility Plot data and layout
  const generateUtilityPlot = () => {
    const p_values = Array.from({ length: 100 }, (_, i) => i / 99);
    
    // Calculate utility lines
    const treatAllLine = p_values.map(p => p * uTP + (1 - p) * uFP);
    const treatNoneLine = p_values.map(p => p * uFN + (1 - p) * uTN);
    
    // Test with selected cutoff
    const testLine = p_values.map(p => 
      p * tprValue * uTP + 
      p * (1 - tprValue) * uFN + 
      (1 - p) * fprValue * uFP + 
      (1 - p) * (1 - fprValue) * uTN
    );
    
    // Test with optimal cutoff
    const optimalTestLine = p_values.map(p => 
      p * optimalTpr * uTP + 
      p * (1 - optimalTpr) * uFN + 
      (1 - p) * optimalFpr * uFP + 
      (1 - p) * (1 - optimalFpr) * uTN
    );
    
    // Calculate thresholds
    const pStar = (uTN - uFP) / ((uTP - uFN) + (uTN - uFP));
    const pL = solveThreshold(0, pStar, 0.01, (p) => 
      treatNone(p, uFN, uTN) - test(p, tprValue, 1-fprValue, uTN, uTP, uFN, uFP, 0)
    );
    const pU = solveThreshold(pStar, 1, 0.01, (p) => 
      treatAll(p, uFP, uTP) - test(p, tprValue, 1-fprValue, uTN, uTP, uFN, uFP, 0)
    );
    
    const data = [
      // Treat All line
      {
        x: p_values.map(val => parseFloat(val.toFixed(3))),
        y: treatAllLine.map(val => parseFloat(val.toFixed(3))),
        mode: 'lines',
        name: 'Treat All',
        line: { color: 'green' }
      },
      // Treat None line
      {
        x: p_values.map(val => parseFloat(val.toFixed(3))),
        y: treatNoneLine.map(val => parseFloat(val.toFixed(3))),
        mode: 'lines',
        name: 'Treat None',
        line: { color: 'orange' }
      },
      // Test line with selected cutoff
      {
        x: p_values.map(val => parseFloat(val.toFixed(3))),
        y: testLine.map(val => parseFloat(val.toFixed(3))),
        mode: 'lines',
        name: 'Test (Selected)',
        line: { color: 'blue' }
      },
      // Test line with optimal cutoff
      {
        x: p_values.filter((_, i) => i % 2 === 0).map(val => parseFloat(val.toFixed(3))),
        y: optimalTestLine.filter((_, i) => i % 2 === 0).map(val => parseFloat(val.toFixed(3))),
        mode: 'markers',
        name: 'Optimal Cutoff',
        marker: { color: 'red' }
      },
      // pL line
      {
        x: [pL.toFixed(3), pL.toFixed(3)],
        y: [0, 1],
        mode: 'lines',
        line: { color: 'orange', width: 2, dash: 'dash' },
        name: "pL Treat-none/Test threshold"
      },
      // pStar line
      {
        x: [pStar.toFixed(3), pStar.toFixed(3)],
        y: [0, 1],
        mode: 'lines',
        line: { color: 'black', width: 2, dash: 'dash' },
        name: "pStar Treat/No Treat threshold"
      },
      // pU line
      {
        x: [pU.toFixed(3), pU.toFixed(3)],
        y: [0, 1],
        mode: 'lines',
        line: { color: 'green', width: 2, dash: 'dash' },
        name: "pU Test/Treat threshold"
      }
    ];
    
    const layout = {
      title: {
        text: 'Expected Utility Plot for treat all, treat none, and test',
        x: 0.5,
        xanchor: 'center'
      },
      xaxis: { title: 'Probability of Disease (p)' },
      yaxis: { title: 'Expected Utility' },
      template: 'plotly_white',
      margin: { l: 50, r: 20, t: 30, b: 30 },
      annotations: [
        {
          x: pL,
          y: 0,
          xref: "x",
          yref: "y",
          text: "pL",
          showarrow: false,
          yshift: -10,
          textangle: 0
        },
        {
          x: pStar,
          y: 0,
          xref: "x",
          yref: "y",
          text: "pStar",
          showarrow: false,
          yshift: -10,
          textangle: 0
        },
        {
          x: pU,
          y: 0,
          xref: "x",
          yref: "y",
          text: "pU",
          showarrow: false,
          yshift: -10,
          textangle: 0
        }
      ]
    };
    
    return { data, layout };
  };

  return (
    <div>
      <div id="utility-plot">
        <Plot
          data={generateUtilityPlot().data}
          layout={generateUtilityPlot().layout}
          style={{ height: height, width: width }}
        />
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', height: '5%', margin: 0}}>
        <div style={{ width: '70%', paddingBottom: '10', display: 'hidden', height: '45px'}}></div>
        
        <InfoButton
          tooltipId="utility"
          tooltipText={tooltipData.utility.tooltip_text}
          linkText={tooltipData.utility.link_text}
          linkUrl={tooltipData.utility.link_url}
          top="-130px"
          left="0%"
          width="200px"
        />
      </div>
    </div>
  );
};

export default UtilityPlot;