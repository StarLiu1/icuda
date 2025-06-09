import React from 'react';
import Plot from 'react-plotly.js';
import InfoButton from '../InfoButton';

/**
 * Component to display the ApAr visualization
 * @param {Object} props - Component properties
 * @param {Array} props.thresholds - Classification thresholds
 * @param {Array} props.pLs - Lower threshold values
 * @param {Array} props.pUs - Upper threshold values
 * @param {number} props.cutoff - Selected cutoff value
 * @param {number} props.area - Calculated ApAr area
 * @param {Object} props.tooltipData - Tooltip information for the info button
 * @returns {JSX.Element}
 */
const AparPlot = ({ 
  thresholds, 
  pLs, 
  pUs, 
  cutoff, 
  optimalPointFpr, 
  optimalPointTpr, 
  optimalCutoff, 
  area, 
  tooltipData,
  width = '100%',
  height = '400px'
}) => {
  
  // Generate plot data
  const generateAparPlot = () => {
    // Create plot data
    const data = [
      // pUs line
      {
        x: thresholds,
        y: pUs,
        mode: 'lines',
        name: 'pUs',
        line: { color: 'blue' }
      },
      // pLs line
      {
        x: thresholds,
        y: pLs,
        mode: 'lines',
        name: 'pLs',
        line: { color: 'orange' }
      },
      // Add a vertical line at cutoff
      // {
      //   x: [cutoff, cutoff],  // Same x value for both points for a vertical line
      //   y: [0, 1],  // Full height of the y-axis
      //   // mode: 'lines',
      //   line: { color: 'green', width: 2, dash: 'dash' },
      //   name: "Selected threshold"
      // }
    ];

    data.push({
      x: [cutoff, cutoff],
      y: [0, 1],
      mode: 'lines',
      name: 'Selected',
      line: { 
        color: 'green', 
        width: 2,
        dash: 'dash'  // Makes it a dashed line for better visibility
      }
    });

    data.push({
      x: [optimalCutoff, optimalCutoff],
      y: [0, 1],
      mode: 'lines',
      name: 'Optimal',
      line: { 
        color: 'red', 
        width: 2,
        dash: 'dash'  // Makes it a dashed line for better visibility
      }
    });
    
    // Create layout
    const layout = {
      title: {
        text: 'Applicability Area (ApAr)',
        x: 0.5,
        xanchor: 'center'
      },
      xaxis: {
        title: 'Probability Cutoff Threshold',
        tickmode: 'array', 
        // tickvals: Array.from({ length: 31 }, (_, i) => i * 0.1)
      },
      yaxis: {
        title: 'Prior Probability (Prevalence)',
        tickmode: 'array', 
        // tickvals: Array.from({ length: 11 }, (_, i) => i * 0.1)
      },
      template: 'plotly_white',
      annotations: [
        {
          x: cutoff,
          y: 0,
          xref: "x",
          yref: "y",
          text: "Cutoff",
          showarrow: false,
          yshift: -10,
          textangle: 0
        },
        {
          x: 0.95,
          y: 0.05,
          xref: 'paper',
          yref: 'paper',
          text: `ApAr = ${typeof area === 'number' ? area.toFixed(3) : area}`,
          showarrow: false,
          font: {
            size: 12,
            color: 'black'
          },
          align: 'right',
          bgcolor: 'white',
          bordercolor: 'black',
          borderwidth: 1
        }
      ],
      margin: { l: 50, r: 0, t: 30, b: 40 }

    };
    
    return { data, layout };
  };

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <div id="apar-plot">
        <Plot
          data={generateAparPlot().data}
          layout={generateAparPlot().layout}
          style={{ height: height, width: width}}
        />
      </div>
      
      {/* Info button */}
      <div 
        style={{
          display: "flex",
          alignItems: "center",
          height: "8vh",
          width: "100%",
          marginTop: "-5%",
          position: "absolute",
          bottom: "0"
        }}
      >
        <div style={{ width: '80%' }}></div>
        <InfoButton
          tooltipId="apar"
          tooltipText={tooltipData.tooltip_text}
          linkText={tooltipData.link_text}
          linkUrl={tooltipData.link_url}
          top="-150px"
          left="50%"
          width="200px"
        />
      </div>
    </div>
  );
};

export default AparPlot;