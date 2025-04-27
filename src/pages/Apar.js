import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import InfoButton from '../components/InfoButton';

// Mock tooltip data
const tooltipData = {
  apar: {
    tooltip_text: "Applicability Area (ApAr) represents the range of disease prevalence values where using the test is optimal.",
    link_text: "Learn more about ApAr",
    link_url: "#"
  }
};

const Apar = () => {
  const [area, setArea] = useState(0.65); // Example ApAr value
  const [thresholds, setThresholds] = useState([]);
  const [pLs, setPLs] = useState([]);
  const [pUs, setPUs] = useState([]);
  const [cutoff, setCutoff] = useState(0.5);
  const [loading, setLoading] = useState(true);
  
  // Calculate ApAr data (this would normally come from backend or parent component)
  useEffect(() => {
    // Simulate loading data
    setLoading(true);
    
    // Simulate API call or calculation
    setTimeout(() => {
      // Generate demo data for ApAr plot
      const thresh = Array.from({ length: 100 }, (_, i) => i / 100);
      const lower = thresh.map(t => Math.max(0, 0.3 - t * 0.2 + Math.random() * 0.1));
      const upper = thresh.map(t => Math.min(1, 0.8 - t * 0.5 + Math.random() * 0.1));
      
      setThresholds(thresh);
      setPLs(lower);
      setPUs(upper);
      setLoading(false);
    }, 1000);
  }, []);
  
  // Handle cutoff change
  const handleCutoffChange = (e) => {
    setCutoff(parseFloat(e.target.value));
  };
  
  // Generate ApAr plot config
  const generateAparPlot = () => {
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
      // Cutoff line
      {
        x: [cutoff, cutoff],
        y: [0, 1],
        mode: 'lines',
        line: { color: 'green', width: 2, dash: 'dash' },
        name: "Selected threshold"
      }
    ];
    
    const layout = {
      title: {
        text: 'Applicability Area (ApAr)',
        x: 0.5,
        xanchor: 'center'
      },
      xaxis: { 
        title: 'Probability Cutoff Threshold',
        tickmode: 'array',
        tickvals: Array.from({ length: 11 }, (_, i) => i * 0.1)
      },
      yaxis: { 
        title: 'Prior Probability (Prevalence)',
        tickmode: 'array',
        tickvals: Array.from({ length: 11 }, (_, i) => i * 0.1)
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
          text: `ApAr = ${area.toFixed(3)}`,
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
    <div className="main-content" style={{ flexDirection: 'column', paddingTop: '70px' }}>
      <h2 style={{
        textAlign: 'center',
        marginBottom: '10px',
        marginTop: '20px',
        color: '#012b75'
      }}>
        Applicability Area (ApAr)
      </h2>
      
      <div style={{ width: '80%', margin: '0 auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <div className="loading">Loading ApAr data...</div>
          </div>
        ) : (
          <>
            <Plot
              data={generateAparPlot().data}
              layout={generateAparPlot().layout}
              style={{ height: '60vh', width: '100%' }}
            />
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '40px',
              marginBottom: '20px'
            }}>
              <label htmlFor="cutoff-slider" style={{ marginRight: '10px' }}>
                Cutoff: {cutoff.toFixed(2)}
              </label>
              <input
                id="cutoff-slider"
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={cutoff}
                onChange={handleCutoffChange}
                style={{ width: '50%' }}
              />
              
              <div style={{ marginLeft: '20px' }}>
                <InfoButton
                  tooltipId="apar"
                  tooltipText={tooltipData.apar.tooltip_text}
                  linkText={tooltipData.apar.link_text}
                  linkUrl={tooltipData.apar.link_url}
                  top="-185px"
                  left="50%"
                  width="200px"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Apar;