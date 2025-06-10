import React from 'react';
import ReportGenerator from '../components/ReportGenerator';

/**
 * Component for ApAr control panel
 * @param {Object} props - Component properties
 * @returns {JSX.Element}
 */
const AparControls = ({
  dataType,
  onDataTypeChange,
  onFileUpload,
  cutoff,
  cutoffMin,
  cutoffMax,
  onCutoffChange,
  uTP,
  onUTPChange,
  uFP,
  onUFPChange,
  uTN,
  onUTNChange,
  uFN,
  onUFNChange,
  pD,
  onPDChange,
  diseaseMean,
  onDiseaseMeanChange,
  diseaseStd,
  onDiseaseStdChange,
  healthyMean,
  onHealthyMeanChange,
  healthyStd,
  onHealthyStdChange,
  optimalCutoffText,
  formatDisplayText
}) => {
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', paddingTop: '55px' }}>
        <select 
          value={dataType}
          onChange={onDataTypeChange}
          style={{ marginBottom: '10px', padding: '8px' }}
        >
          <option value="simulated">Simulated Binormal Model</option>
          <option value="imported">Imported Data</option>
        </select>
      </div>
      
      <div style={{ paddingLeft: '0px' }}>
        {dataType === 'imported' ? (
          <div 
            style={{ 
              width: '100%',
              height: '58px',
              lineHeight: '60px',
              borderWidth: '1px',
              borderStyle: 'dashed',
              borderRadius: '5px',
              textAlign: 'center',
              cursor: 'pointer',
              marginBottom: '10px'
            }}
            onClick={() => document.getElementById('file-upload').click()}
          >
            <input
              id="file-upload"
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={onFileUpload}
            />
            Drag and Drop or Select Files
          </div>
        ) : (
          <div style={{ 
            width: '98.5%',
            height: '40px',
            lineHeight: '40px',
            borderWidth: '1px',
            borderStyle: 'dashed',
            borderRadius: '5px',
            textAlign: 'center',
            marginBottom: '10px'
          }}>
            To import data, select from dropdown
          </div>
        )}
        
        {/* Binormal model parameters */}
        {dataType === 'simulated' && (
          <>
            <h4 style={{ marginTop: 5, marginBottom: 5 }}>{formatDisplayText.diseaseMeanText}</h4>
            <div style={{ width: '100%' }}>
              <input 
                type="range"
                min={-3}
                max={3}
                step={0.1}
                value={diseaseMean}
                onChange={onDiseaseMeanChange}
                style={{ width: '100%' }}
              />
            </div>
            
            <h4 style={{ marginTop: 0, marginBottom: 5 }}>{formatDisplayText.diseaseStdText}</h4>
            <div style={{ width: '100%' }}>
              <input 
                type="range"
                min={0.1}
                max={3}
                step={0.1}
                value={diseaseStd}
                onChange={onDiseaseStdChange}
                style={{ width: '100%' }}
              />
            </div>
            
            <h4 style={{ marginTop: 0, marginBottom: 5 }}>{formatDisplayText.healthyMeanText}</h4>
            <div style={{ width: '100%' }}>
              <input 
                type="range"
                min={-3}
                max={3}
                step={0.1}
                value={healthyMean}
                onChange={onHealthyMeanChange}
                style={{ width: '100%' }}
              />
            </div>
            
            <h4 style={{ marginTop: 0, marginBottom: 5 }}>{formatDisplayText.healthyStdText}</h4>
            <div style={{ width: '100%' }}>
              <input 
                type="range"
                min={0.1}
                max={3}
                step={0.1}
                value={healthyStd}
                onChange={onHealthyStdChange}
                style={{ width: '100%' }}
              />
            </div>
          </>
        )}
        
        {/* Common controls for both data types */}
        <h4 style={{ marginTop: 0, marginBottom: 5 }}>{formatDisplayText.cutoffText}</h4>
        <div style={{ width: '100%' }}>
          <input 
            type="range"
            min={cutoffMin}
            max={cutoffMax}
            step={0.01}
            value={cutoff}
            onChange={onCutoffChange}
            style={{ width: '100%' }}
          />
        </div>
        
        {/* Utility sliders */}
        <h4 style={{ marginTop: 5, marginBottom: 5 }}>{formatDisplayText.uTPText}</h4>
        <div style={{ width: '100%' }}>
          <input 
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={uTP}
            onChange={onUTPChange}
            style={{ width: '100%' }}
          />
        </div>
        
        <h4 style={{ marginTop: 5, marginBottom: 5 }}>{formatDisplayText.uFPText}</h4>
        <div style={{ width: '100%' }}>
          <input 
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={uFP}
            onChange={onUFPChange}
            style={{ width: '100%' }}
          />
        </div>
        
        <h4 style={{ marginTop: 5, marginBottom: 5 }}>{formatDisplayText.uTNText}</h4>
        <div style={{ width: '100%' }}>
          <input 
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={uTN}
            onChange={onUTNChange}
            style={{ width: '100%' }}
          />
        </div>
        
        <h4 style={{ marginTop: 5, marginBottom: 5 }}>{formatDisplayText.uFNText}</h4>
        <div style={{ width: '100%' }}>
          <input 
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={uFN}
            onChange={onUFNChange}
            style={{ width: '100%' }}
          />
        </div>
        
        <h4 style={{ marginTop: 5, marginBottom: 5 }}>{formatDisplayText.pDText}</h4>
        <div style={{ width: '100%' }}>
          <input 
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={pD}
            onChange={onPDChange}
            style={{ width: '100%' }}
          />
        </div>
        
        <h4 style={{ marginTop: 5 }}>{optimalCutoffText}</h4>
      </div>
      {/* <ReportGenerator
        rocData={rocData}
        tprValue={tprValue}
        fprValue={fprValue}
        optimalPointTpr={optimalPointFpr}
        optimalPointFpr={optimalPointTpr}
        optimalCutoff={optimalCutoff}
        cutoff={cutoff}
        uTP={uTP}
        uFP={uFP}
        uTN={uTN}
        uFN={uFN}
        pD={pD}
        diseaseMean={diseaseMean}
        diseaseStd={diseaseStd}
        healthyMean={healthyMean}
        healthyStd={healthyStd}
        classNames={classNames}
        dataType={dataType}
        area={area}
        thresholds={thresholds}
        pLs={pLs}
        pUs={pUs}
        predictions={predictions}
        trueLabels={trueLabels}
        style={{ marginTop: '15px' }}
      /> */}
    </div>
  );
};

export default AparControls;