import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    loadProfileData();
  }, [navigate]);

  async function loadProfileData() {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const auth = { headers: { Authorization: `Bearer ${token}` } };
      
      const [entriesRes] = await Promise.all([
        axios.get((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/entries', auth),
      ]);
      
      setUser(JSON.parse(localStorage.getItem('user') || 'null'));
      setEntries(entriesRes.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      } else {
        setError('Failed to load profile data.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="card">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="page-container">
      <div className="profile-header">
        <h2>My Profile</h2>
        <div className="profile-avatar">
          <span className="avatar-icon">👤</span>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="profile-content">
        <div className="card">
          <h3>Personal Information</h3>
          <div className="profile-info">
            <div className="info-item">
              <label>Name:</label>
              <span>{user?.name}</span>
            </div>
            <div className="info-item">
              <label>Email:</label>
              <span>{user?.email}</span>
            </div>
            <div className="info-item">
              <label>Role:</label>
              <span className="role-badge">{user?.role}</span>
            </div>
            <div className="info-item">
              <label>Member Since:</label>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Recent Activity</h3>
          {entries.length === 0 ? (
            <p>No entries yet. Start tracking your mood!</p>
          ) : (
            <div className="activity-list">
              {entries.slice(0, 5).map(entry => (
                <div key={entry._id} className="activity-item">
                  <div className="activity-date">
                    {new Date(entry.date).toLocaleDateString()}
                  </div>
                  <div className="activity-mood">
                    <span className={`mood-indicator mood-${entry.mood}`}></span>
                    {entry.mood.replace('_', ' ')}
                  </div>
                  {entry.text && (
                    <div className="activity-text">
                      {entry.text.slice(0, 50)}...
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
