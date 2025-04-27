import React from 'react';

const LoadingOverlay = ({ text, onHide }) => {
  // Split the input text by the '\n' character for line breaks
  const textParts = text.split('\n');
  
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
        <div style={{
          fontSize: "24px",
          textAlign: "center",
          marginBottom: "10px"
        }}>
          {textParts.map((part, index) => (
            <React.Fragment key={index}>
              {part}
              {index < textParts.length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;