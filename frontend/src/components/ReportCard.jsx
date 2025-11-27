import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ReportCard({ summary, entries }) {
  const navigate = useNavigate();
  
  if (!summary) {
    return (
      <div className="card weekly-summary-card">
        <h3>Weekly Summary</h3>
        <p>Loading summary...</p>
      </div>
    );
  }

  const moodImages = {
    very_good: '/pictures/mood_1-removebg-preview.png',
    good: '/pictures/mood_2-removebg-preview.png',
    neutral: '/pictures/mood_3-removebg-preview.png',
    bad: '/pictures/mood_4-removebg-preview.png',
    very_bad: '/pictures/mood_5-removebg-preview.png'
  };

  // Get last 7 days of entries
  const today = new Date();
  const lastSevenDays = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const entryForDay = entries.find(e => {
      const entryDate = new Date(e.date);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === date.getTime();
    });
    
    lastSevenDays.push({
      day: i + 1,
      date: date,
      mood: entryForDay?.mood || null,
      entry: entryForDay
    });
  }

  const totalEntries = entries.length;
  const moodLabels = {
    very_bad: '😢 Very Bad',
    bad: '😔 Bad', 
    neutral: '😐 Neutral',
    good: '😊 Good',
    very_good: '😄 Very Good'
  };

  return (
    <div className="card weekly-summary-card" style={{position: 'relative'}}>
      <button
        onClick={() => {
          const user = JSON.parse(localStorage.getItem('user') || 'null');
          if (user?.role === 'doctor') {
            navigate('/doctor/read-journal');
          } else {
            navigate('/patient/read-journal');
          }
        }}
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          background: '#10b981',
          color: 'white',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          zIndex: 10
        }}
        title="View all journal entries"
      >
        📖 Journal
      </button>
      
      <h3>Weekly Summary</h3>
      
      <div className="summary-row">
        <div className="summary-item">
          <span>Total Entries:</span>
          <div className="entry-box">{totalEntries}</div>
        </div>
      </div>
      
      <div className="mood-distribution-section">
        <h4>Mood Distribution</h4>
        <div className="weekly-moods-grid">
          {lastSevenDays.map((dayData, index) => (
            <div key={index} className="daily-mood-item">
              {dayData.mood ? (
                <img
                  src={moodImages[dayData.mood]}
                  alt={dayData.mood}
                  className="weekly-mood-image"
                />
              ) : (
                <div className="no-entry-placeholder">—</div>
              )}
              <span className="day-label">Day {dayData.day}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="recent-entries-section">
        <h4>Recent Entries</h4>
        {entries.length === 0 ? (
          <p>No entries yet. Start by adding your first daily entry!</p>
        ) : (
          <div className="recent-entries-list">
            {entries.slice(0, 2).map(entry => (
              <div key={entry._id} className="recent-entry-item">
                <span className="entry-date">{new Date(entry.date).toLocaleDateString()}</span>
                <span className="entry-mood"> {moodLabels[entry.mood]}</span>
                {entry.sleepHours > 0 && <span className="entry-sleep"> • {entry.sleepHours}h sleep</span>}
                {entry.text && <span className="entry-journal-indicator"> • 📝 Journal</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="all-entries-section">
        <button 
          className="all-entries-btn"
          onClick={() => navigate('/patient/all-entries')}
        >
          See All Entries
        </button>
      </div>
    </div>
  );
}