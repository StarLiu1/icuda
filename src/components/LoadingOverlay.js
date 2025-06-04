import React, { useEffect } from 'react';

const LoadingOverlay = ({ text, onHide }) => {
  // Replace newline characters (\n) with HTML line break tags (<br />)
  const htmlText = text.replace(/\n/g, '<br />');

  useEffect(() => {
    const timer = setTimeout(() => {
      onHide();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [onHide]);
  
  return (
    <div 
      onClick={onHide}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        cursor: "pointer"
      }}
    >
      <div style={{
        textAlign: "center",
      }}>
        <div 
          style={{
            fontSize: "24px",
            textAlign: "center",
            marginBottom: "10px"
          }}
          // Use dangerouslySetInnerHTML to render the string as HTML
          dangerouslySetInnerHTML={{ __html: htmlText }}
        />
      </div>
    </div>
  );
};

export default LoadingOverlay;