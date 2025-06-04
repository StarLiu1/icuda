import React from 'react';
import Plot from 'react-plotly.js';

const DistributionPlot = ({
  dataType,
  predictions,
  trueLabels,
  classNames,
  cutoff,
  optimalCutoff,
  diseaseMean,
  diseaseStd,
  healthyMean,
  healthyStd,
  width = '35vw',
  height = '45vh'
}) => {
  
  // Generate Distribution Plot data and layout
  const generateDistributionPlot = () => {
    let data = [];
    let layout = {};
    
    if (dataType === 'imported' && predictions.length > 0) {
      // Imported data - create histograms
      const positivePredictions = predictions.filter((pred, i) => trueLabels[i] === 1);
      const negativePredictions = predictions.filter((pred, i) => trueLabels[i] === 0);
      
      data = [
        // Positive class histogram
        {
          x: positivePredictions,
          type: 'histogram',
          name: classNames.positive,
          opacity: 0.5,
          marker: { color: 'blue' }
        },
        // Negative class histogram
        {
          x: negativePredictions,
          type: 'histogram',
          name: classNames.negative,
          opacity: 0.5,
          marker: { color: 'red' }
        }
      ];
      
      // Add vertical line at cutoff
      const shapes = [
        {
          type: 'line',
          x0: cutoff,
          y0: 0,
          x1: cutoff,
          y1: 100, // Will be scaled by plotly
          line: { color: 'blue', width: 2, dash: 'dash' }
        }
      ];
      
      layout = {
        title: {
          text: 'Probability Distributions',
          x: 0.5,
          xanchor: 'center'
        },
        xaxis: { title: 'Value' },
        yaxis: { 
          title: {
              text: 'Count',
              standoff: 30  // Increases distance between axis and title
            }
        },
        barmode: 'overlay',
        template: 'plotly_white',
        shapes: shapes,
        margin: { l: 60, r: 20, t: 30, b: 20 },
      };
    } else {
      // Simulated data - create normal distributions
      const xValues = Array.from({ length: 1000 }, (_, i) => -10 + i * 0.02);
      
      // Calculate PDF values
      const diseasedPdf = xValues.map(x => 
        (1 / (diseaseStd * Math.sqrt(2 * Math.PI))) * 
        Math.exp(-0.5 * Math.pow((x - diseaseMean) / diseaseStd, 2))
      );
      
      const healthyPdf = xValues.map(x => 
        (1 / (healthyStd * Math.sqrt(2 * Math.PI))) * 
        Math.exp(-0.5 * Math.pow((x - healthyMean) / healthyStd, 2))
      );
      
      // Find max value for scaling
      const maxPdf = Math.max(...diseasedPdf, ...healthyPdf);
      
      data = [
        // Diseased distribution
        {
          x: xValues,
          y: diseasedPdf,
          mode: 'lines',
          name: classNames.positive,
          line: { color: 'red' },
          fill: 'tozeroy'
        },
        // Healthy distribution
        {
          x: xValues,
          y: healthyPdf,
          mode: 'lines',
          name: classNames.negative,
          line: { color: 'blue' },
          fill: 'tozeroy'
        }
      ];
      
      // Highlight false negative region
      const fnX = xValues.filter(x => x <= cutoff);
      const fnY = fnX.map(x => 
        (1 / (diseaseStd * Math.sqrt(2 * Math.PI))) * 
        Math.exp(-0.5 * Math.pow((x - diseaseMean) / diseaseStd, 2))
      );
      
      data.push({
        x: fnX,
        y: fnY,
        mode: 'none',
        name: 'False Negative',
        fill: 'tozeroy',
        fillcolor: 'rgba(255, 0, 0, 0.3)',
        showlegend: true
      });
      
      // Highlight false positive region
      const fpX = xValues.filter(x => x >= cutoff);
      const fpY = fpX.map(x => 
        (1 / (healthyStd * Math.sqrt(2 * Math.PI))) * 
        Math.exp(-0.5 * Math.pow((x - healthyMean) / healthyStd, 2))
      );
      
      data.push({
        x: fpX,
        y: fpY,
        mode: 'none',
        name: 'False Positive',
        fill: 'tozeroy',
        fillcolor: 'rgba(0, 0, 255, 0.3)',
        showlegend: true
      });
      
      // Add selected cutoff line
      data.push({
        x: Array(25).fill(cutoff),
        y: Array.from({ length: 25 }, (_, i) => i * (maxPdf * 1.1) / 24),
        mode: 'markers',
        name: 'Selected Cutoff',
        marker: { color: 'blue', size: 6 }
      });
      
      // Add optimal cutoff line
      data.push({
        x: Array(25).fill(optimalCutoff),
        y: Array.from({ length: 25 }, (_, i) => i * (maxPdf * 1.1) / 24),
        mode: 'markers',
        name: 'Optimal Cutoff',
        marker: { color: 'red', size: 6 }
      });
      
      // Add annotations for cutoffs
      const annotations = [
        {
          x: cutoff,
          y: maxPdf * 1.1,
          xref: "x",
          yref: "y",
          text: "Selected cutoff",
          showarrow: false,
          yshift: -10,
          textangle: 0
        },
        {
          x: optimalCutoff,
          y: maxPdf * 1.1,
          xref: "x",
          yref: "y",
          text: "Optimal cutoff",
          showarrow: false,
          yshift: -10,
          textangle: 0
        }
      ];
      
      layout = {
        title: {
          text: `${classNames.positive} vs ${classNames.negative} Distribution`,
          x: 0.5,
          xanchor: 'center'
        },
        // xaxis: { title: 'Value' },
        xaxis: { 
          title: {
              text: '',
              standoff: -30  // Increases distance between axis and title
            }
        },
        yaxis: { 
          title: {
              text: 'Probability Density',
              standoff: 30  // Increases distance between axis and title
            }
        },
        template: 'plotly_white',
        margin: { l: 60, r: 20, t: 30, b: 20 },
        annotations: annotations
      };
    }
    
    return { data, layout };
  };

  return (
    <Plot
      data={generateDistributionPlot().data}
      layout={generateDistributionPlot().layout}
      style={{ height: height , width: width}}
    />
  );
};

export default DistributionPlot;