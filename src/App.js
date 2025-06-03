import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';

// Import components
import AppBar from './components/AppBar';
import Footer from './components/Footer';
import LoadingOverlay from './components/LoadingOverlay';
import RocUpda from './pages/rocupda';
import Apar from './pages/Apar';
import ReadMe from './pages/ReadMe';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Auto-hide loading overlay after 8 seconds
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 8000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleLoadingClick = () => {
    setIsLoading(false);
  };

  return (
    <Router>
      <div className="App">
        {/* {isLoading && (
          <LoadingOverlay 
            text="Welcome to the home dashboard!\nGraphics can take up to 10 seconds on initial load. Subsequent loading will be faster (~5 seconds).\nThank you for your patience!\n\nClick anywhere to dismiss or this message will disappear automatically."
            onHide={handleLoadingClick}
          />
        )} */}
        <AppBar />
        <Routes>
          <Route path="/" element={<RocUpda />} />
          <Route path="/apar" element={<Apar />} />
          <Route path="/readme" element={<ReadMe />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;