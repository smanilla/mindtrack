import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  function handleLogout() {
    localStorage.clear();
    navigate('/login');
  }

  function handleNavigation(path) {
    navigate(path);
    setIsDropdownOpen(false);
  }

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="logo" onClick={() => {
          const user = JSON.parse(localStorage.getItem('user') || 'null');
          if (user?.role === 'doctor') {
            navigate('/doctor/dashboard');
          } else {
            navigate('/patient/dashboard');
          }
        }}>
          <h1>MindTrack</h1>
        </div>
        
        <nav className="header-nav">
          <div className="nav-item">
            <button 
              className="nav-button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              Menu ▼
            </button>
            
            {isDropdownOpen && (
              <div className="dropdown-menu">
                {user?.role === 'doctor' ? (
                  <>
                    <div className="dropdown-item" onClick={() => handleNavigation('/doctor/dashboard')}>
                      📊 Dashboard
                    </div>
                    <div className="dropdown-item" onClick={() => handleNavigation('/doctor/register-patient')}>
                      ➕ Register Patient
                    </div>
                    <div className="dropdown-item" onClick={() => handleNavigation('/doctor/read-journal')}>
                      📖 My Journal
                    </div>
                    <div className="dropdown-item" onClick={() => handleNavigation('/doctor/profile')}>
                      👤 Profile
                    </div>
                  </>
                ) : (
                  <>
                    <div className="dropdown-item" onClick={() => handleNavigation('/patient/dashboard')}>
                      📊 Dashboard
                    </div>
                    <div className="dropdown-item" onClick={() => handleNavigation('/patient/contacts')}>
                      👥 Contacts
                    </div>
                    <div className="dropdown-item" onClick={() => handleNavigation('/patient/ai-assistant')}>
                      🤖 My AI Assistant
                    </div>
                    <div className="dropdown-item" onClick={() => handleNavigation('/patient/profile')}>
                      👤 Profile
                    </div>
                  </>
                )}
                <div className="dropdown-divider"></div>
                <div className="dropdown-item logout" onClick={handleLogout}>
                  🚪 Logout
                </div>
              </div>
            )}
          </div>
          
          <div className="user-info">
            <span>Welcome, {user?.name}</span>
            <span className="user-role">({user?.role})</span>
          </div>
        </nav>
      </div>
    </header>
  );
}
