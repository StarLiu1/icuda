// src/utils/reportUtils.js

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generate a comprehensive PDF report with all plots and analysis
 * @param {Object} config - Configuration object containing all necessary data
 * @returns {Promise} - Promise that resolves when PDF is generated
 */
export const generatePDFReport = async (config) => {
  const {
    rocData,
    utilityData,
    distributionData,
    aparData = null,
    parameters,
    classNames,
    dataType
  } = config;

  // Create a new jsPDF instance
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;

  // Helper function to add title
  const addTitle = (text, fontSize = 16, isBold = true) => {
    pdf.setFontSize(fontSize);
    if (isBold) pdf.setFont(undefined, 'bold');
    else pdf.setFont(undefined, 'normal');
    
    const textWidth = pdf.getTextWidth(text);
    const x = (pageWidth - textWidth) / 2;
    pdf.text(text, x, 30);
  };

  // Helper function to add text with word wrapping
  const addWrappedText = (text, x, y, maxWidth, lineHeight = 6) => {
    const lines = pdf.splitTextToSize(text, maxWidth);
    pdf.text(lines, x, y);
    return y + (lines.length * lineHeight);
  };

  // Helper function to capture plot as image
  const captureElement = async (elementId) => {
    const element = document.getElementById(elementId);
    if (!element) {
      console.warn(`Element with ID '${elementId}' not found`);
      return null;
    }
    
    try {
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        scale: 3
      });
      
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error(`Error capturing element ${elementId}:`, error);
      return null;
    }
  };

  // Helper function to add a table
  const addTable = (headers, data, startY, colWidths = null) => {
    const rowHeight = 8;
    const headerHeight = 10;
    let currentY = startY;
    
    // Default column widths if not provided
    if (!colWidths) {
      colWidths = [50, 90, 30]; // Default widths for 3 columns
    }
    
    // Draw header
    pdf.setFillColor(220, 220, 220);
    pdf.rect(margin, currentY, contentWidth, headerHeight, 'F');
    
    pdf.setFont(undefined, 'bold');
    pdf.setFontSize(11);
    
    let xPos = margin + 2;
    headers.forEach((header, i) => {
      pdf.text(header, xPos, currentY + 7);
      xPos += colWidths[i];
    });
    
    currentY += headerHeight;
    
    // Draw data rows
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(10);
    
    data.forEach((row, rowIndex) => {
      // Alternate row colors
      if (rowIndex % 2 === 0) {
        pdf.setFillColor(245, 245, 245);
        pdf.rect(margin, currentY, contentWidth, rowHeight, 'F');
      }
      
      xPos = margin + 2;
      row.forEach((cell, colIndex) => {
        const cellText = String(cell);
        const maxWidth = colWidths[colIndex] - 4;
        
        // Handle text wrapping for long content
        if (colIndex === 1) { // Description column
          const lines = pdf.splitTextToSize(cellText, maxWidth);
          pdf.text(lines, xPos, currentY + 6);
        } else {
          pdf.text(cellText, xPos, currentY + 6);
        }
        xPos += colWidths[colIndex];
      });
      
      currentY += rowHeight;
    });
    
    // Draw table border
    pdf.setDrawColor(0, 0, 0);
    pdf.rect(margin, startY, contentWidth, currentY - startY);
    
    // Draw column separators
    xPos = margin;
    colWidths.forEach((width, i) => {
      if (i < colWidths.length - 1) {
        xPos += width;
        pdf.line(xPos, startY, xPos, currentY);
      }
    });
    
    return currentY + 5;
  };

  // Helper function to add numbered list
  const addNumberedList = (items, startY, indent = 5) => {
    let currentY = startY;
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(10);
    
    items.forEach((item, index) => {
      const number = `${index + 1}. `;
      const numberWidth = pdf.getTextWidth(number);
      
      // Add number
      pdf.text(number, margin + indent, currentY);
      
      // Add text with proper wrapping
      const maxWidth = contentWidth - indent - numberWidth - 5;
      const lines = pdf.splitTextToSize(item, maxWidth);
      pdf.text(lines, margin + indent + numberWidth, currentY);
      
      currentY += lines.length * 5 + 2;
    });
    
    return currentY;
  };

  // Helper function to add bullet points
  const addBulletList = (items, startY, indent = 5, bulletChar = '•') => {
    let currentY = startY;
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(10);
    
    items.forEach((item) => {
      const bullet = `${bulletChar} `;
      const bulletWidth = pdf.getTextWidth(bullet);
      
      // Add bullet
      pdf.text(bullet, margin + indent, currentY);
      
      // Add text with proper wrapping
      const maxWidth = contentWidth - indent - bulletWidth - 5;
      const lines = pdf.splitTextToSize(item, maxWidth);
      pdf.text(lines, margin + indent + bulletWidth, currentY);
      
      currentY += lines.length * 5 + 2;
    });
    
    return currentY;
  };

  // Start creating the PDF
  try {
    // Page 1: Title and Introduction
    addTitle('Interactive Clinical Utility Decision Analytic (iCUDA) Dashboard Report', 16);
    
    let currentY = 40;
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'normal');
    
    const numFigs = aparData ? 4 : 3;
    const figText = aparData ? 
      'distribution plot, ROC plot, expected utility plot, and Applicability Area plot' :
      'distribution plot, ROC plot, and expected utility plot';
    
    const introText = `This report contains all ${numFigs} graphs from the dashboard (${figText}). We enhance the value by adding generic interpretations based on the model parameters, local utility tradeoffs, and the prevalence of disease in the target population. Interpretations are grounded in decision science and utility theory.`;
    
    currentY = addWrappedText(introText, margin, currentY, contentWidth, 5);
    currentY += 8;
    
    const paramText = "The tables below reflect all the model parameters and selections you made on the dashboard. Depending on the problem this may not be an exhaustive list of parameters you should consider.";
    currentY = addWrappedText(paramText, margin, currentY, contentWidth, 5);
    currentY += 10;

    // Utility Tradeoffs Table
    const utilityHeaders = ['Utility Tradeoffs (0 to 1)', 'Definitions', 'Value'];
    const utilityTableData = [
      ['uTP', 'Utility of a true positive', parameters.uTP.toFixed(2)],
      ['uFP', 'Utility of a false positive', parameters.uFP.toFixed(2)],
      ['uTN', 'Utility of a true negative', parameters.uTN.toFixed(2)],
      ['uFN', 'Utility of a false negative', parameters.uFN.toFixed(2)],
      ['H', 'Cost of unnecessary treatment: uTN - uFP', (parameters.uTN - parameters.uFP).toFixed(2)],
      ['B', 'Benefit of necessary treatment: uTP - uFN', (parameters.uTP - parameters.uFN).toFixed(2)]
    ];

    currentY = addTable(utilityHeaders, utilityTableData, currentY, [40, 110, 25]);
    currentY += 5;

    // Binormal Distribution Parameters Table (if simulated)
    if (dataType === 'simulated') {
      const binormalHeaders = ['Binormal Distribution Setup', 'Definitions', 'Value'];
      const binormalTableData = [
        ['Positive Mean', `${classNames.positive} group mean`, parameters.diseaseMean.toFixed(2)],
        ['Positive Std', `${classNames.positive} group standard deviation`, parameters.diseaseStd.toFixed(2)],
        ['Negative Mean', `${classNames.negative} group mean`, parameters.healthyMean.toFixed(2)],
        ['Negative Std', `${classNames.negative} group standard deviation`, parameters.healthyStd.toFixed(2)]
      ];

      currentY = addTable(binormalHeaders, binormalTableData, currentY, [40, 110, 25]);
      currentY += 5;
    }

    // Other Parameters Table
    const otherHeaders = ['Parameters in context of use', 'Definition', 'Value'];
    const otherTableData = [
      ['Raw or Probability Cutoff', 'Raw Cutoff / Predicted Probability Cutoff', parameters.cutoff.toFixed(2)],
      ['Probability of disease', `Target population ${classNames.positive} prevalence`, parameters.pD.toFixed(2)],
      ['Slope of the optimal point', `(H / B) * ((1-pD) / pD), where pD is prevalence of outcome (i.e., disease)`, parameters.slope.toFixed(2)],
      ['U(T)', 'Disutility of Testing (default set to 0)', '0']
    ];

    currentY = addTable(otherHeaders, otherTableData, currentY, [40, 110, 25]);

    // Add new page for plots
    pdf.addPage();
    currentY = 25;

    // Distribution Plot
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Distribution Plot', margin, currentY);
    currentY += 10;

    // Try to capture distribution plot
    const distributionImage = await captureElement('distribution-plot');
    if (distributionImage) {
      const imgWidth = contentWidth * 0.8;
      const imgHeight = imgWidth * 0.6;
      const imgX = margin + (contentWidth - imgWidth) / 2;
      pdf.addImage(distributionImage, 'PNG', imgX, currentY, imgWidth, imgHeight);
      currentY += imgHeight + 8;
    }

    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    const distributionText = `In this plot, the x-axis represents the value of a continuous variable that differentiates between the ${classNames.positive} and ${classNames.negative} groups. The y-axis represents the probability density, which shows the relative likelihood of values for each group.`;
    currentY = addWrappedText(distributionText, margin, currentY, contentWidth, 4);
    currentY += 5;

    currentY = addWrappedText('The four areas relative to the cutoff can be interpreted as follows:', margin, currentY, contentWidth, 4);
    currentY += 5;

    const distributionItems = [
      `False Positives (FP) - This area is where the ${classNames.negative} group values fall to the right of the cutoff. These are instances where ${classNames.negative} individuals are mistakenly categorized as ${classNames.positive} due to their values being above the cutoff.`,
      `True Positives (TP) - This area is where the ${classNames.positive} group values are to the right of the cutoff. These are correctly identified ${classNames.positive} individuals, as their values exceed the threshold, confirming their ${classNames.positive} status.`,
      `False Negatives (FN) - This area is where the ${classNames.positive} group values are to the left of the cutoff. These are instances where ${classNames.positive} individuals are mistakenly categorized as ${classNames.negative} due to their values being below the cutoff.`,
      `True Negatives (TN) - This area is where the ${classNames.negative} group values are to the left of the cutoff. These are correctly identified ${classNames.negative} individuals, as their values fall below the threshold, confirming their ${classNames.negative} status.`
    ];

    currentY = addNumberedList(distributionItems, currentY);
    currentY += 5;

    const cutoffText = `The exact placement of the cutoff influences the proportions of these four areas, thus impacting the sensitivity and specificity of the classification between ${classNames.positive} and ${classNames.negative} groups. Adjusting the cutoff right or left would increase or decrease the areas under each respective portion of the curves, which is critical in determining the optimal threshold for classification.`;
    currentY = addWrappedText(cutoffText, margin, currentY, contentWidth, 4);

    // Add new page for ROC plot
    pdf.addPage();
    currentY = 25;

    // ROC Curve
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('ROC Curve', margin, currentY);
    currentY += 10;

    const rocImage = await captureElement('roc-plot');
    if (rocImage) {
      const imgWidth = contentWidth * 0.8;
      const imgHeight = imgWidth * 0.6;
      const imgX = margin + (contentWidth - imgWidth) / 2;
      pdf.addImage(rocImage, 'PNG', imgX, currentY, imgWidth, imgHeight);
      currentY += imgHeight + 8;
    }

    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    const rocIntro = `This graph is a Receiver Operating Characteristic (ROC) Curve, which illustrates the performance of a binary classifier as its discrimination threshold is varied. It is crucial to consider the cutoff selection in the context of use, i.e. cost of misclassification and prevalence. In isolation, the ROC curve itself may be limited for decision making.`;
    currentY = addWrappedText(rocIntro, margin, currentY, contentWidth, 4);
    currentY += 5;

    currentY = addWrappedText("Here's a breakdown of the key components in this plot:", margin, currentY, contentWidth, 4);
    currentY += 5;

    pdf.setFont(undefined, 'bold');
    pdf.text('Key Components:', margin, currentY);
    currentY += 8;
    pdf.setFont(undefined, 'normal');

    // Axes section
    currentY = addBulletList(['Axes:'], currentY, 0);
    const axesItems = [
      `The x-axis represents the False Positive Rate (FPR), which is the proportion of actual ${classNames.negative} that are incorrectly classified as ${classNames.positive}. It ranges from 0 to 1.`,
      `The y-axis represents the True Positive Rate (TPR), also sensitivity or recall, which is the proportion of actual ${classNames.positive} that are correctly classified. It ranges from 0 to 1.`
    ];
    currentY = addBulletList(axesItems, currentY, 8, '◦');
    currentY += 3;

    // Curves section
    currentY = addBulletList(['Curves:'], currentY, 0);
    const curvesItems = [
      'The rough curve represents the empirical ROC curve.',
      'The smooth curve represents the fitted Bezier curve. Bezier curve provides a practical way of identifying the optimal point given the slope of the optimal point.'
    ];
    currentY = addBulletList(curvesItems, currentY, 8, '◦');
    currentY += 3;

    // Cutoff points section
    currentY = addBulletList(['Cutoff and Optimal Cutoff Points:'], currentY, 0);
    const cutoffItems = [
      `The blue dot represents a selected Cutoff Point at ${parameters.cutoff.toFixed(3)}, indicating a specific threshold at which TPR and FPR are calculated.`,
      `The red dot marks the Optimal Cutoff Point at ${parameters.optimalCutoff.toFixed(3)}, corresponds to the threshold that maximizes the objective, expected utility. The optimal point on the ROC is the point with the slope that corresponds to the product of Harms over Benefit (H/B) and the inverse of the odds of outcome (i.e., disease). The theoretical basis and derivation can be found in Chapter 5 of Medical Decision Making.`
    ];
    currentY = addBulletList(cutoffItems, currentY, 8, '◦');

    // Add new page for Utility plot
    pdf.addPage();
    currentY = 25;

    // Utility Plot
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Expected Utility Plot', margin, currentY);
    currentY += 10;

    const utilityImage = await captureElement('utility-plot');
    if (utilityImage) {
      const imgWidth = contentWidth * 0.8;
      const imgHeight = imgWidth * 0.6;
      const imgX = margin + (contentWidth - imgWidth) / 2;
      pdf.addImage(utilityImage, 'PNG', imgX, currentY, imgWidth, imgHeight);
      currentY += imgHeight + 8;
    }

    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    const utilityText = `This plot shows the Expected Utility (EU) for different decision strategies—Treat All, Treat None, and Test—across varying probabilities of disease. Here are the key elements:`;
    currentY = addWrappedText(utilityText, margin, currentY, contentWidth, 4);
    currentY += 5;

    const utilityItems = [
      'The green line represents the Treat All strategy, regardless of their probability of disease.',
      'The orange line represents the Treat None strategy, which treats nobody.',
      'The blue line represents the Test, where decisions depend on a testing mechanism.',
      `At the Optimal Cutoff (red line), testing maximizes EU given pD (prevalence of outcome, i.e., disease).`
    ];
    currentY = addBulletList(utilityItems, currentY);
    currentY += 5;

    // Calculate thresholds for display
    const pL = parameters.pL || 0;
    const pStar = parameters.pStar || (parameters.uTN - parameters.uFP) / ((parameters.uTP - parameters.uFN) + (parameters.uTN - parameters.uFP));
    const pU = parameters.pU || 0;

    const thresholdItems = [
      `pL (orange dashed line at ${pL.toFixed(3)}): The Treat-none/Test threshold, marking the point where testing becomes preferable over treat none.`,
      `p* (black dashed line at ${pStar.toFixed(3)}): The Treatment threshold is where treatment is preferred over treat none in a situation where there is no testing.`,
      `pU (green dashed line at ${pU.toFixed(3)}): The Test/Treat threshold, beyond which the utility of treat all exceeds that of testing.`
    ];
    currentY = addBulletList(thresholdItems, currentY);

    // Add ApAr plot if available
    if (aparData) {
      pdf.addPage();
      currentY = 25;

      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text('Applicability Area Plot', margin, currentY);
      currentY += 10;

      const aparImage = await captureElement('apar-plot');
      if (aparImage) {
        const imgWidth = contentWidth * 0.8;
        const imgHeight = imgWidth * 0.6;
        const imgX = margin + (contentWidth - imgWidth) / 2;
        pdf.addImage(aparImage, 'PNG', imgX, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 8;
      }

      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      const aparIntro = `The applicability area (ApAr) metric involves 1) calculating the range of priors from the two thresholds (pU(c) − pL(c)) and 2) integrating over the entire ROC to obtain the cumulative ranges of applicable priors. We eliminate the need to define a prior beforehand and covers the entire possible range. A model with an ApAr of zero indicates employing the model as a test for the probability of disease has no value compared to a treat-none or treat-all strategy. On the other hand, high applicability indicates that the model is useful as a test for the probability of disease over greater ranges of priors.`;
      currentY = addWrappedText(aparIntro, margin, currentY, contentWidth, 4);
      currentY += 5;

      const aparText = `Choice of cutoff should be made considering harms and benefit tradeoff, ideally leveraging the optimal point that maximizes expected utility (See 'Slope of the optimal point' on page 1).`;
      currentY = addWrappedText(aparText, margin, currentY, contentWidth, 4);
      currentY += 5;

      pdf.setFont(undefined, 'bold');
      currentY = addWrappedText('ApAr answers two key questions:', margin, currentY, contentWidth, 4);
      currentY += 5;
      pdf.setFont(undefined, 'normal');

      const aparQuestions = [
        'Is the model useful at all?',
        'When and under what context is the model useful?'
      ];
      currentY = addNumberedList(aparQuestions, currentY);
      currentY += 5;

      pdf.setFont(undefined, 'bold');
      pdf.text('Key Components:', margin, currentY);
      currentY += 8;
      pdf.setFont(undefined, 'normal');

      // Axes section for ApAr
      currentY = addBulletList(['Axes:'], currentY, 0);
      const aparAxesItems = [
        'The x-axis represents the probability cutoff threshold for discrimination.',
        'The y-axis represents the prevalence of outcome, in the target population.'
      ];
      currentY = addBulletList(aparAxesItems, currentY, 8, '◦');
      currentY += 3;

      // Curves section for ApAr
      currentY = addBulletList(['Curves:'], currentY, 0);
      const aparCurvesItems = [
        'The blue curve represents the pUs over the entire ROC.',
        'The orange curve represents the pLs over the entire ROC.'
      ];
      currentY = addBulletList(aparCurvesItems, currentY, 8, '◦');
      currentY += 3;

      // Selected cutoff section for ApAr
      currentY = addBulletList(['Selected cutoff/threshold:'], currentY, 0);
      const aparCutoffItems = [
        `The black dotted line represents the cutoff for discriminating the two classes at ${parameters.cutoff.toFixed(2)}.`,
        `At the selected cutoff of ${parameters.cutoff.toFixed(3)}, the range of applicable prior (prevalence of outcome) under which the model is useful is between the lower pL of ${pL.toFixed(3)} and the upper pU of ${pU.toFixed(3)}. The model is only useful when pL is less than pU.`
      ];
      currentY = addBulletList(aparCutoffItems, currentY, 8, '◦');
    }

    // Save the PDF
    const fileName = aparData ? 'iCUDA_report_with_apar.pdf' : 'iCUDA_report.pdf';
    pdf.save(fileName);

    return { success: true, message: 'Report generated successfully!' };

  } catch (error) {
    console.error('Error generating PDF report:', error);
    return { success: false, message: 'Error generating report: ' + error.message };
  }
};

/**
 * Prepare data for report generation
 * @param {Object} dashboardState - Current state of the dashboard
 * @returns {Object} - Formatted configuration object for report generation
 */
export const prepareReportData = (dashboardState) => {
  const {
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
    area,
    thresholds,
    pLs,
    pUs
  } = dashboardState;

  // Calculate derived parameters
  const H = uTN - uFP;
  const B = uTP - uFN + 0.000000001;
  const HoverB = H / B;
  const slope = HoverB * (1 - pD) / pD;

  return {
    rocData,
    utilityData: {
      tprValue,
      fprValue,
      optimalPointTpr,
      optimalPointFpr,
      optimalCutoff,
      uTP,
      uFP,
      uTN,
      uFN
    },
    distributionData: {
      cutoff,
      optimalCutoff,
      diseaseMean,
      diseaseStd,
      healthyMean,
      healthyStd
    },
    aparData: area !== undefined ? {
      area,
      thresholds,
      pLs,
      pUs,
      cutoff,
      optimalCutoff
    } : null,
    parameters: {
      cutoff,
      optimalCutoff,
      uTP,
      uFP,
      uTN,
      uFN,
      pD,
      diseaseMean: diseaseMean || 0,
      diseaseStd: diseaseStd || 0,
      healthyMean: healthyMean || 0,
      healthyStd: healthyStd || 0,
      slope,
      H,
      B
    },
    classNames,
    dataType
  };
};