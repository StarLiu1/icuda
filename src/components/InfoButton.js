import React, { useState } from 'react';

const InfoButton = ({ tooltipId, tooltipText, linkText, linkUrl, top, left, width }) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  
  const toggleTooltip = () => {
    setIsTooltipVisible(!isTooltipVisible);
  };
  
  return (
    <div style={{ position: 'relative' }}>
      {/* The question mark button */}
      <span 
        onClick={toggleTooltip}
        style={{
          backgroundColor: "#478ECC",
          color: "white",
          borderRadius: "50%",
          width: "20px",
          height: "20px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
          fontSize: "20px",
          cursor: "pointer",
          padding: "5px"
        }}
      >
        i
      </span>
      
      {/* The tooltip */}
      <div
        style={{
          display: isTooltipVisible ? "block" : "none",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          color: "white",
          padding: "10px",
          borderRadius: "5px",
          position: "absolute",
          zIndex: "1000",
          top: top,
          left: left,
          transform: "translateX(-50%)",
          width: width,
          textAlign: "center",
          border: "1px solid white"
        }}
      >
        <div>{tooltipText}</div>
        <a 
          href={linkUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          style={{
            color: "lightblue", 
            textDecoration: "underline"
          }}
        >
          {linkText}
        </a>
      </div>
    </div>
  );
};

export default InfoButton;