import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function AllEntries() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEntry, setSelectedEntry] = useState(null);

  useEffect(() => {
    loadEntries();
  }, []);

  async function loadEntries() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(
        (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/entries',
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setEntries(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load entries');
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function getMoodLabel(mood) {
    const moodLabels = {
      very_bad: '😢 Very Bad',
      bad: '😔 Bad',
      neutral: '😐 Neutral',
      good: '😊 Good',
      very_good: '😄 Very Good'
    };
    return moodLabels[mood] || mood;
  }

  function truncateText(text, maxLength = 20) {
    if (!text) return 'No journal entry';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="card">
          <p>Loading entries...</p>
        </div>
      </div>
    );
  }

  if (selectedEntry) {
    return (
      <div className="entry-detail-modal">
        <div className="entry-detail-container">
          <div className="entry-detail-header">
            <h2>{formatDate(selectedEntry.date)}</h2>
            <button 
              className="close-btn"
              onClick={() => setSelectedEntry(null)}
            >
              ✕
            </button>
          </div>
          
          <div className="entry-detail-content">
            <div className="entry-meta">
              <div className="entry-mood">
                <strong>Mood:</strong> {getMoodLabel(selectedEntry.mood)}
              </div>
              <div className="entry-sleep">
                <strong>Sleep:</strong> {selectedEntry.sleepHours} hours
              </div>
            </div>
            
            <div className="entry-journal">
              <h3>Journal Entry</h3>
              <div className="journal-content">
                {selectedEntry.text || 'No journal entry for this day.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="all-entries-header">
        <h1>All Entries</h1>
          <button 
            className="back-btn"
            onClick={() => navigate('/patient/dashboard')}
          >
            ← Back to Dashboard
          </button>
      </div>

      {error && <div className="error" style={{marginBottom: '20px'}}>{error}</div>}

      {entries.length === 0 ? (
        <div className="card">
          <p>No entries yet. Start by adding your first daily entry!</p>
        </div>
      ) : (
        <div className="entries-list">
          {entries.map(entry => (
            <div 
              key={entry._id} 
              className="entry-card"
              onClick={() => setSelectedEntry(entry)}
            >
              <div className="entry-card-header">
                <h3>{formatDate(entry.date)}</h3>
                <span className="entry-mood-badge">{getMoodLabel(entry.mood)}</span>
              </div>
              
              <div className="entry-card-content">
                <div className="entry-sleep-info">
                  <span>💤 {entry.sleepHours}h sleep</span>
                </div>
                
                <div className="entry-journal-preview">
                  <p>{truncateText(entry.text)}</p>
                  {entry.text && (
                    <div className="journal-badge">
                      📝 Journal Entry
                    </div>
                  )}
                </div>
              </div>
              
              <div className="entry-card-footer">
                <span className="click-hint">Click to view full entry</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
