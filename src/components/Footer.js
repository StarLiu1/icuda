import React from 'react';

const Footer = () => {
  return (
    <div style={{
      backgroundColor: "#012b75",
      color: "white",
      padding: "20px 0",
      textAlign: "center",
      position: "relative",
      width: "100%",
      left: "0",
      bottom: "0",
      zIndex: "1000",
      margin: "0"
    }}>
      <h1 style={{ marginTop: "0px" }}>Contact Us</h1>
      <p style={{
        fontSize: "18px", 
        marginTop: "0", 
        lineHeight: "1.6"
      }}>
        For any questions, comments, or interest in contributing to this project, 
        please contact Star Liu at sliu197@jhmi.edu
      </p>
    </div>
  );
};

export default Footer;