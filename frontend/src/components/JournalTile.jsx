import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function JournalTile() {
  const navigate = useNavigate();
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('neutral');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const moodImages = {
    very_good: '/pictures/mood_1-removebg-preview.png',
    good: '/pictures/mood_2-removebg-preview.png',
    neutral: '/pictures/mood_3-removebg-preview.png',
    bad: '/pictures/mood_4-removebg-preview.png',
    very_bad: '/pictures/mood_5-removebg-preview.png'
  };

  function handleMoodSelect(moodValue) {
    setMood(moodValue);
  }

  async function handleQuickSave(e) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('token');
      const auth = { headers: { Authorization: `Bearer ${token}` } };
      
      await axios.post(
        (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/journals',
        { 
          title: title.trim(),
          content: content.trim(),
          mood
        },
        auth
      );
      
      setTitle('');
      setContent('');
      setMood('neutral');
      setSuccess('Journal entry saved!');
      setShowQuickEntry(false);
      
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save journal entry');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card journal-tile">
      <div className="journal-tile-header">
        <h3>📝 Journal</h3>
        <div className="journal-tile-actions">
          <button 
            className="quick-entry-btn"
            onClick={() => setShowQuickEntry(!showQuickEntry)}
          >
            Quick Entry
          </button>
          <button 
            className="full-journal-btn"
            onClick={() => {
              const user = JSON.parse(localStorage.getItem('user') || 'null');
              if (user?.role === 'doctor') {
                navigate('/doctor/journal');
              } else {
                navigate('/patient/journal');
              }
            }}
          >
            Full Journal
          </button>
          <button 
            className="read-journal-btn"
            onClick={() => {
              const user = JSON.parse(localStorage.getItem('user') || 'null');
              if (user?.role === 'doctor') {
                navigate('/doctor/read-journal');
              } else {
                navigate('/patient/read-journal');
              }
            }}
          >
            Read Journal
          </button>
        </div>
      </div>

      {showQuickEntry && (
        <form className="quick-journal-form" onSubmit={handleQuickSave}>
          <div className="quick-journal-mood">
            <label>How are you feeling?</label>
            <div className="quick-mood-images">
              {Object.entries(moodImages).map(([moodValue, imagePath]) => (
                <div
                  key={moodValue}
                  className={`quick-mood-wrapper ${mood === moodValue ? 'selected' : ''}`}
                  onClick={() => handleMoodSelect(moodValue)}
                >
                  <img
                    src={imagePath}
                    alt={moodValue}
                    className="quick-mood-image"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="quick-journal-inputs">
            <input
              type="text"
              placeholder="Entry title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="quick-title-input"
              disabled={saving}
            />
            <textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="quick-content-input"
              rows={3}
              disabled={saving}
            />
          </div>

          <div className="quick-journal-actions">
            <button 
              type="button" 
              className="cancel-btn"
              onClick={() => {
                setShowQuickEntry(false);
                setTitle('');
                setContent('');
                setMood('neutral');
                setError('');
              }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="save-quick-btn"
              disabled={saving || !title.trim() || !content.trim()}
            >
              {saving ? 'Saving...' : 'Save Entry'}
            </button>
          </div>

          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}
        </form>
      )}

      {!showQuickEntry && (
        <div className="journal-tile-content">
          <p>Capture your thoughts and feelings</p>
          <div className="journal-tile-stats">
            <span>📖 Multiple entries per day</span>
            <span>🏷️ Add tags and mood</span>
            <span>📅 Date tracking</span>
          </div>
        </div>
      )}
    </div>
  );
}
