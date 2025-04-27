import React from 'react';

const ReadMe = () => {
  return (
    <div className="main-content" style={{ flexDirection: 'column', paddingTop: '70px' }}>
      <div style={{ width: '80%', margin: '0 auto', textAlign: 'left' }}>
        <h1 style={{ textAlign: 'center', color: '#012b75' }}>iCUDA Dashboard - ReadMe</h1>
        
        <section>
          <h2>About</h2>
          <p>
            The Interactive Clinical Utility Decision Analytic (iCUDA) Dashboard is a tool designed to help
            clinicians and researchers visualize and understand the performance of diagnostic tests or
            prediction models in different clinical scenarios.
          </p>
          <p>
            This dashboard allows users to explore the Receiver Operating Characteristic (ROC) curve,
            utility analysis, and the Applicability Area (ApAr) for clinical decision making.
          </p>
        </section>
        
        <section>
          <h2>Features</h2>
          <ul>
            <li><strong>ROC Curve Analysis:</strong> Visualize the trade-off between sensitivity and specificity of a test.</li>
            <li><strong>Utility Analysis:</strong> Understand the expected utility of different testing strategies based on utilities of outcomes.</li>
            <li><strong>Distribution Analysis:</strong> See the underlying distributions of test values in diseased and healthy populations.</li>
            <li><strong>Applicability Area (ApAr):</strong> Explore the range of disease prevalence where using the test is optimal.</li>
            <li><strong>Simulation:</strong> Use the binormal model to simulate different test characteristics.</li>
            <li><strong>Import Data:</strong> Upload your own data for analysis.</li>
            <li><strong>Report Generation:</strong> Create detailed reports of your analysis.</li>
          </ul>
        </section>
        
        <section>
          <h2>How to Use</h2>
          <h3>Mode Selection</h3>
          <p>
            Choose between "Simulated Binormal Model" and "Imported Data" modes:
          </p>
          <ul>
            <li><strong>Simulated Mode:</strong> Adjust mean and standard deviation parameters to simulate different test characteristics.</li>
            <li><strong>Imported Mode:</strong> Upload a CSV file with "true_labels" (0 or 1) and "predictions" (probability values) columns.</li>
          </ul>
          
          <h3>Parameters</h3>
          <p>
            Adjust the following parameters to explore different scenarios:
          </p>
          <ul>
            <li><strong>Cutoff:</strong> The threshold for classifying a test result as positive or negative.</li>
            <li><strong>Utilities:</strong> The relative values of each outcome (true positive, false positive, true negative, false negative).</li>
            <li><strong>Disease Prevalence:</strong> The proportion of the population with the disease.</li>
          </ul>
          
          <h3>Plots</h3>
          <p>
            Interact with the plots to understand the impact of different parameters:
          </p>
          <ul>
            <li><strong>Distribution Plot:</strong> Shows the distribution of test values in diseased and healthy populations.</li>
            <li><strong>ROC Plot:</strong> Click on the curve to select different operating points. Toggle between point mode and line mode to calculate partial AUC.</li>
            <li><strong>Utility Plot:</strong> Shows the expected utility of different testing strategies based on disease prevalence.</li>
            <li><strong>ApAr Plot:</strong> Shows the range of disease prevalence where using the test is optimal.</li>
          </ul>
        </section>
        
        <section>
          <h2>Technical Notes</h2>
          <ul>
            <li>The dashboard uses a binormal model for simulating test characteristics.</li>
            <li>The ROC curve is fitted using a Bezier curve for smoothing.</li>
            <li>Optimal cutoff is calculated based on the slope of the ROC curve that equals (H/B) * (1-p)/p, where H is uTN-uFP, B is uTP-uFN, and p is disease prevalence.</li>
            <li>ApAr is calculated by integrating the area between the pL and pU curves.</li>
          </ul>
        </section>
        
        <section>
          <h2>Citation</h2>
          <p>
            If you use this dashboard in your research, please cite:
          </p>
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#f5f5f5', 
            borderLeft: '4px solid #012b75',
            marginBottom: '20px' 
          }}>
            Liu, S., Huang, S. (2023). iCUDA: An Interactive Tool for Clinical Utility Decision Analysis.
            Journal of Biomedical Informatics, 123, 104175.
          </div>
        </section>
        
        <section>
          <h2>Contact</h2>
          <p>
            For any questions, comments, or interest in contributing to this project, 
            please contact Star Liu at sliu197@jhmi.edu
          </p>
        </section>
      </div>
    </div>
  );
};

export default ReadMe;