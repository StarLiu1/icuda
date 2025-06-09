import React from 'react';
import { Link } from 'react-router-dom';

const AppBar = () => {
  return (
    <div style={{
      backgroundColor: "#012b75",
      color: "white",
      height: "50px",
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "0 20px",
      position: "fixed",
      top: 0,
      left: 0,
      zIndex: 1000
    }}>
      <div style={{
        display: "flex",
        alignItems: "center"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center"
        }}>
          <Link to="/" className="tab-link" style={{
            fontSize: "20px",
            fontWeight: "bold",
            color: "white",
            marginRight: "50px",
            textDecoration: "none",
            padding: "5px",
            transition: "color 0.3s ease, background-color 0.3s ease"
          }}>
            Home
          </Link>
          
          <Link to="/apar" className="tab-link" style={{
            fontSize: "20px",
            fontWeight: "bold",
            color: "white",
            marginRight: "60px",
            textDecoration: "none",
            padding: "5px",
            transition: "color 0.3s ease, background-color 0.3s ease"
          }}>
            Applicability Area (ApAr)
          </Link>
          
          <Link to="/" style={{
            fontSize: "30px",
            fontWeight: "bold",
            color: "white",
            textAlign: "center",
            padding: "5px",
            marginRight: "100px",
            textDecoration: "none"
          }}>
            Interactive Clinical Utility Decision Analytic (iCUDA) Dashboard
          </Link>
          
          <Link to="/readme" className="tab-link" style={{
            fontSize: "20px",
            fontWeight: "bold",
            color: "white",
            marginRight: "80px",
            textDecoration: "none",
            padding: "5px",
            transition: "color 0.3s ease, background-color 0.3s ease"
          }}>
            Read Me
          </Link>
          
          <a href="https://github.com/StarLiu1/icuda" target="_blank" rel="noopener noreferrer" className="tab-link" style={{
            fontSize: "20px",
            fontWeight: "bold",
            color: "white",
            marginRight: "10px",
            textDecoration: "none",
            padding: "5px",
            transition: "color 0.3s ease, background-color 0.3s ease"
          }}>
            GitHub
          </a>
        </div>
      </div>
    </div>
  );
};

export default AppBar;