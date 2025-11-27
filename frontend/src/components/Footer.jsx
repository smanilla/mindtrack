import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Footer() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isDoctor = user?.role === 'doctor';

  function handleNavigation(path) {
    navigate(path);
  }

  const isActive = (path) => location.pathname === path;

  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div 
          className={`footer-item ${isActive(isDoctor ? '/doctor/dashboard' : '/patient/dashboard') ? 'active' : ''}`}
          onClick={() => handleNavigation(isDoctor ? '/doctor/dashboard' : '/patient/dashboard')}
        >
          <span className="footer-icon">🏠</span>
          <span className="footer-label">Home</span>
        </div>
        
        <div 
          className={`footer-item ${isActive(isDoctor ? '/doctor/profile' : '/patient/profile') ? 'active' : ''}`}
          onClick={() => handleNavigation(isDoctor ? '/doctor/profile' : '/patient/profile')}
        >
          <span className="footer-icon">👤</span>
          <span className="footer-label">Profile</span>
        </div>
        
        {isDoctor ? (
          <>
            <div 
              className={`footer-item ${isActive('/doctor/register-patient') ? 'active' : ''}`}
              onClick={() => handleNavigation('/doctor/register-patient')}
            >
              <span className="footer-icon">➕</span>
              <span className="footer-label">Register</span>
            </div>
            <div 
              className={`footer-item ${isActive('/doctor/read-journal') ? 'active' : ''}`}
              onClick={() => handleNavigation('/doctor/read-journal')}
            >
              <span className="footer-icon">📖</span>
              <span className="footer-label">Journal</span>
            </div>
          </>
        ) : (
          <>
            <div 
              className={`footer-item ${isActive('/patient/report') ? 'active' : ''}`}
              onClick={() => handleNavigation('/patient/report')}
            >
              <span className="footer-icon">📊</span>
              <span className="footer-label">Report</span>
            </div>
            <div 
              className={`footer-item ${isActive('/patient/ai-assistant') ? 'active' : ''}`}
              onClick={() => handleNavigation('/patient/ai-assistant')}
            >
              <span className="footer-icon">🤖</span>
              <span className="footer-label">My AI</span>
            </div>
          </>
        )}
      </div>
    </footer>
  );
}
