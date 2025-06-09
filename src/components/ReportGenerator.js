// src/components/ReportGenerator.js

import React, { useState } from 'react';
import { generatePDFReport, prepareReportData } from '../utils/reportUtils';

/**
 * Component for generating PDF reports
 * @param {Object} props - Component properties
 * @returns {JSX.Element}
 */
const ReportGenerator = ({
  rocData,
  tprValue,
  fprValue,
  optimalPointTpr,
  optimalPointFpr,
  optimalCutoff,
  cutoff,
  uTP,
  uFP,
  uTN,
  uFN,
  pD,
  diseaseMean,
  diseaseStd,
  healthyMean,
  healthyStd,
  classNames,
  dataType,
  // ApAr data (optional)
  area,
  thresholds,
  pLs,
  pUs,
  predictions,
  trueLabels,
  style = {}
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState('');

  // Handle standard report generation
  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setMessage('Generating report...');

    try {
      // Prepare the dashboard state
      const dashboardState = {
        rocData,
        tprValue,
        fprValue,
        optimalPointTpr,
        optimalPointFpr,
        optimalCutoff,
        cutoff,
        uTP,
        uFP,
        uTN,
        uFN,
        pD,
        diseaseMean,
        diseaseStd,
        healthyMean,
        healthyStd,
        classNames,
        dataType
      };

      // Prepare report data
      const reportConfig = prepareReportData(dashboardState);

      // Generate the PDF
      const result = await generatePDFReport(reportConfig);

      if (result.success) {
        setMessage('Report generated successfully!');
      } else {
        setMessage(result.message);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      setMessage('Error generating report. Please try again.');
    } finally {
      setIsGenerating(false);
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Handle ApAr report generation
  const handleGenerateAparReport = async () => {
    setIsGenerating(true);
    setMessage('Generating report with ApAr...');

    try {
      // Prepare the dashboard state with ApAr data
      const dashboardState = {
        rocData,
        tprValue,
        fprValue,
        optimalPointTpr,
        optimalPointFpr,
        optimalCutoff,
        cutoff,
        uTP,
        uFP,
        uTN,
        uFN,
        pD,
        diseaseMean,
        diseaseStd,
        healthyMean,
        healthyStd,
        classNames,
        dataType,
        // Include ApAr data
        area,
        thresholds,
        pLs,
        pUs
      };

      // Prepare report data
      const reportConfig = prepareReportData(dashboardState);

      // Generate the PDF with ApAr
      const result = await generatePDFReport(reportConfig);

      if (result.success) {
        setMessage('Report with ApAr generated successfully!');
      } else {
        setMessage(result.message);
      }
    } catch (error) {
      console.error('Error generating ApAr report:', error);
      setMessage('Error generating ApAr report. Please try again.');
    } finally {
      setIsGenerating(false);
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div style={{ ...style }}>
      <div className="reports-container">
        <button
          onClick={handleGenerateReport}
          disabled={isGenerating || !rocData.fpr || rocData.fpr.length === 0}
          style={{
            width: '48%',
            opacity: isGenerating ? 0.6 : 1,
            cursor: isGenerating ? 'not-allowed' : 'pointer'
          }}
        >
          {isGenerating ? 'Generating...' : 'Generate Report'}
        </button>
        
        <button
          onClick={handleGenerateAparReport}
          disabled={isGenerating || !rocData.fpr || rocData.fpr.length === 0 || !area}
          style={{
            width: '48%',
            opacity: isGenerating ? 0.6 : 1,
            cursor: isGenerating ? 'not-allowed' : 'pointer'
          }}
        >
          {isGenerating ? 'Generating...' : 'Generate Report with ApAr'}
        </button>
      </div>
      
      {message && (
        <div style={{
          marginTop: '10px',
          padding: '5px',
          fontSize: '12px',
          textAlign: 'center',
          color: message.includes('Error') ? '#d32f2f' : '#2e7d32',
          backgroundColor: message.includes('Error') ? '#ffebee' : '#e8f5e9',
          borderRadius: '4px',
          border: `1px solid ${message.includes('Error') ? '#ffcdd2' : '#c8e6c9'}`
        }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default ReportGenerator;