import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Report() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [journals, setJournals] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Load report data - no role-based redirect, allow URL to determine view
    loadReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadReportData() {
    if (isLoadingData) {
      return;
    }
    
    setIsLoadingData(true);
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const auth = { headers: { Authorization: `Bearer ${token}` } };
      const [entriesRes, journalsRes, assessRes] = await Promise.all([
        axios.get((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/entries', auth),
        axios.get((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/journals', auth),
        axios.get((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/ai-assessment/mine', auth),
      ]);
      
      setEntries(entriesRes.data || []);
      setJournals(journalsRes.data || []);
      setAssessments(assessRes.data || []);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      } else if (err.code !== 'ERR_NETWORK' && err.code !== 'ERR_INSUFFICIENT_RESOURCES') {
        setError('Failed to load report data.');
        console.error('Load report error:', err);
      }
    } finally {
      setLoading(false);
      setIsLoadingData(false);
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="card">
          <p>Loading report...</p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalEntries = entries.length;
  const avgMood = entries.length > 0 
    ? entries.reduce((sum, entry) => {
        const moodValues = { very_bad: 1, bad: 2, neutral: 3, good: 4, very_good: 5 };
        return sum + (moodValues[entry.mood] || 3);
      }, 0) / entries.length 
    : 0;

  const avgSleep = entries.length > 0 
    ? Math.round(entries.reduce((sum, entry) => sum + (entry.sleepHours || 0), 0) / entries.length * 10) / 10
    : 0;

  const totalJournals = journals.length;
  const entriesWithJournal = entries.filter(e => e.text && e.text.length > 0).length;

  // Get mood breakdown
  const moodBreakdown = entries.reduce((acc, entry) => {
    acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    return acc;
  }, {});

  const moodLabels = {
    very_bad: '😢 Very Bad',
    bad: '😔 Bad',
    neutral: '😐 Neutral',
    good: '😊 Good',
    very_good: '😄 Very Good'
  };

  return (
    <div className="page-container">
      <div className="report-header">
        <h1>📊 Mental Health Report</h1>
        <p>Your comprehensive mental health statistics and insights</p>
      </div>

      {error && <div className="error" style={{marginBottom: '20px'}}>{error}</div>}

      <div className="report-content">
        {/* Statistics Grid */}
        <div className="report-stats-grid">
          <div className="report-stat-card">
            <div className="report-stat-icon">📝</div>
            <div className="report-stat-number">{totalEntries}</div>
            <div className="report-stat-label">Total Entries</div>
          </div>

          <div className="report-stat-card">
            <div className="report-stat-icon">📊</div>
            <div className="report-stat-number">{avgMood > 0 ? avgMood.toFixed(1) : 'N/A'}</div>
            <div className="report-stat-label">Average Mood</div>
            <div className="report-stat-subtitle">(1-5 scale)</div>
          </div>

          <div className="report-stat-card">
            <div className="report-stat-icon">😴</div>
            <div className="report-stat-number">{avgSleep}h</div>
            <div className="report-stat-label">Average Sleep</div>
            <div className="report-stat-subtitle">per night</div>
          </div>

          <div className="report-stat-card">
            <div className="report-stat-icon">📖</div>
            <div className="report-stat-number">{totalJournals}</div>
            <div className="report-stat-label">Journal Entries</div>
            <div className="report-stat-subtitle">{entriesWithJournal} with daily notes</div>
          </div>
        </div>

        {/* Mood Distribution */}
        <div className="card" style={{background: '#75B1BE', color: '#000', marginBottom: '20px'}}>
          <h3 style={{marginTop: 0, color: '#000'}}>Mood Distribution</h3>
          <div className="mood-breakdown-grid">
            {Object.entries(moodLabels).map(([mood, label]) => {
              const count = moodBreakdown[mood] || 0;
              const percentage = totalEntries > 0 ? ((count / totalEntries) * 100).toFixed(0) : 0;
              return (
                <div key={mood} className="mood-breakdown-item">
                  <div className="mood-breakdown-label">{label}</div>
                  <div className="mood-breakdown-bar-container">
                    <div 
                      className="mood-breakdown-bar"
                      style={{
                        width: `${percentage}%`,
                        background: mood === 'very_good' ? '#10b981' :
                                    mood === 'good' ? '#34d399' :
                                    mood === 'neutral' ? '#fbbf24' :
                                    mood === 'bad' ? '#f97316' : '#ef4444'
                      }}
                    />
                  </div>
                  <div className="mood-breakdown-count">{count} entries ({percentage}%)</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly Summary */}
        {entries.length > 0 && (
          <div className="card" style={{background: '#f8fafc', marginBottom: '20px'}}>
            <h3 style={{marginTop: 0}}>Last 7 Days Activity</h3>
            <div className="activity-timeline">
              {entries.slice(0, 7).map(entry => {
                const entryDate = new Date(entry.date);
                return (
                  <div key={entry._id} className="timeline-item">
                    <div className="timeline-date">{entryDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                    <div className="timeline-content">
                      <div className="timeline-mood">{moodLabels[entry.mood]}</div>
                      {entry.sleepHours > 0 && <div className="timeline-sleep">😴 {entry.sleepHours}h</div>}
                      {entry.text && <div className="timeline-journal">📝 Journal note</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent AI Summaries (QA) */}
        {assessments.length > 0 && (
          <div className="card" style={{background: '#f8fafc', marginBottom: '20px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h3 style={{marginTop: 0}}>Recent AI Summaries</h3>
              <button
                className="report-action-btn"
                onClick={() => navigate('/patient/summaries')}
                style={{ background: '#e5e7eb', color: '#111827' }}
              >
                View All Summaries
              </button>
            </div>
            <div style={{display: 'grid', gap: '12px'}}>
              {assessments.slice(0, 3).map((s, idx) => (
                <div key={idx} style={{padding: '10px', background: 'white', borderRadius: 8, borderLeft: s.crisis ? '4px solid #ef4444' : '4px solid #10b981'}}>
                  <div style={{fontSize: 12, color: '#6b7280', marginBottom: 6}}>
                    {new Date(s.createdAt).toLocaleString()}
                    {s.crisis && <span style={{marginLeft: 8, color: '#b91c1c'}}>🚨 Red Alert</span>}
                  </div>
                  <div style={{whiteSpace: 'pre-wrap', color: '#111827'}}>{s.summary.length > 250 ? s.summary.slice(0, 250) + '...' : s.summary}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="report-actions">
          <button 
            className="report-action-btn"
            onClick={() => navigate('/patient/read-journal')}
            style={{
              background: '#10b981',
              color: 'white'
            }}
          >
            📖 View All Journals
          </button>
          <button 
            className="report-action-btn"
            onClick={() => navigate('/patient/all-entries')}
            style={{
              background: '#75B1BE',
              color: '#000'
            }}
          >
            📋 View All Entries
          </button>
          <button 
            className="report-action-btn"
            onClick={() => navigate('/patient/summaries')}
            style={{
              background: '#8b5cf6',
              color: 'white'
            }}
          >
            🧠 View All Summaries
          </button>
        </div>
      </div>
    </div>
  );
}

