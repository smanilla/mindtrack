import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ReadJournal() {
  const navigate = useNavigate();
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedJournal, setSelectedJournal] = useState(null);

  useEffect(() => {
    loadJournals();
  }, []);

  async function loadJournals() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(
        (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/journals',
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setJournals(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load journals');
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  function truncateContent(content, maxLength = 100) {
    if (!content) return 'No content';
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="card">
          <p>Loading journals...</p>
        </div>
      </div>
    );
  }

  if (selectedJournal) {
    return (
      <div className="journal-detail-modal">
        <div className="journal-detail-container">
          <div className="journal-detail-header">
            <h2>{selectedJournal.title}</h2>
            <button 
              className="close-btn"
              onClick={() => setSelectedJournal(null)}
            >
              ✕
            </button>
          </div>
          
          <div className="journal-detail-content">
            <div className="journal-meta">
              <div className="journal-date">
                <strong>Date:</strong> {formatDate(selectedJournal.date)}
              </div>
              <div className="journal-mood">
                <strong>Mood:</strong> {getMoodLabel(selectedJournal.mood)}
              </div>
            </div>
            
            <div className="journal-content-full">
              <h3>Journal Entry</h3>
              <div className="journal-text-content">
                {selectedJournal.content}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="read-journal-header">
        <h1>📖 My Journal Entries</h1>
        <button 
          onClick={() => {
            const user = JSON.parse(localStorage.getItem('user') || 'null');
            if (user?.role === 'doctor') {
              navigate('/doctor/dashboard');
            } else {
              navigate('/patient/dashboard');
            }
          }}
          className="back-btn"
        >
          ← Back to Dashboard
        </button>
      </div>

      {error && <div className="error" style={{marginBottom: '20px'}}>{error}</div>}

      {journals.length === 0 ? (
        <div className="card">
          <div className="empty-journal">
            <h3>No journal entries yet</h3>
            <p>Start writing your thoughts and feelings to see them here.</p>
            <button 
              className="start-writing-btn"
              onClick={() => {
                const user = JSON.parse(localStorage.getItem('user') || 'null');
                if (user?.role === 'doctor') {
                  navigate('/doctor/journal');
                } else {
                  navigate('/patient/journal');
                }
              }}
            >
              Start Writing
            </button>
          </div>
        </div>
      ) : (
        <div className="journals-list">
          {journals.map(journal => (
            <div 
              key={journal._id} 
              className="journal-card"
              onClick={() => setSelectedJournal(journal)}
            >
              <div className="journal-card-header">
                <h3>{journal.title}</h3>
                <span className="journal-mood-badge">{getMoodLabel(journal.mood)}</span>
              </div>
              
              <div className="journal-card-content">
                <div className="journal-date-info">
                  <span>📅 {formatDate(journal.date)}</span>
                </div>
                
                <div className="journal-content-preview">
                  <p>{truncateContent(journal.content)}</p>
                </div>
              </div>
              
              <div className="journal-card-footer">
                <span className="click-hint">Click to read full entry</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
