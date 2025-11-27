import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Journal() {
  const navigate = useNavigate();
  const [journalText, setJournalText] = useState('');
  const [title, setTitle] = useState('');
  const [mood, setMood] = useState('neutral');
  const [wordCount, setWordCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const maxWords = 200;

  const moodImages = {
    very_good: '/mood_1-removebg-preview.png',
    good: '/mood_2-removebg-preview.png',
    neutral: '/mood_3-removebg-preview.png',
    bad: '/mood_4-removebg-preview.png',
    very_bad: '/mood_5-removebg-preview.png'
  };

  function handleTextChange(e) {
    const text = e.target.value;
    const words = text.trim().split(/\s+/);
    const wordCount = words.length;
    
    if (wordCount <= maxWords || text.trim() === '') {
      setJournalText(text);
      setWordCount(wordCount);
    }
  }

  function handleMoodSelect(moodValue) {
    setMood(moodValue);
  }

  async function handleSave() {
    if (!title.trim() || !journalText.trim()) {
      setError('Please add a title and journal content');
      return;
    }

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
          content: journalText.trim(),
          mood
        },
        auth
      );
      
      setTitle('');
      setJournalText('');
      setMood('neutral');
      setWordCount(0);
      setSuccess('Journal entry saved successfully!');
      
      setTimeout(() => {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (user?.role === 'doctor') {
          navigate('/doctor/dashboard');
        } else {
          navigate('/patient/dashboard');
        }
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save journal entry');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user?.role === 'doctor') {
      navigate('/doctor/dashboard');
    } else {
      navigate('/patient/dashboard');
    }
  }

  return (
    <div className="journal-page">
      <div className="journal-container">
        <div className="journal-header">
          <h2>Full Journal Entry</h2>
          <button className="journal-close-btn" onClick={handleCancel}>✕</button>
        </div>
        
        <div className="journal-content">
          <div className="journal-mood-section">
            <label>How are you feeling?</label>
            <div className="journal-mood-images">
              {Object.entries(moodImages).map(([moodValue, imagePath]) => (
                <div
                  key={moodValue}
                  className={`journal-mood-wrapper ${mood === moodValue ? 'selected' : ''}`}
                  onClick={() => handleMoodSelect(moodValue)}
                >
                  <img
                    src={imagePath}
                    alt={moodValue}
                    className="journal-mood-image"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="journal-title-section">
            <input
              type="text"
              placeholder="Entry title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="journal-title-input"
              disabled={saving}
            />
          </div>

          <div 
            className="journal-bg" 
            style={{ backgroundImage: 'url(/pictures/journal-bg.png)' }}
          >
            <div className="journal-lines">
              <textarea
                className="journal-textarea"
                value={journalText}
                onChange={handleTextChange}
                placeholder="Write your thoughts here..."
                maxLength={1000}
                disabled={saving}
              />
            </div>
          </div>
        </div>

        <div className="journal-footer">
          <div className="word-count">
            {wordCount} / {maxWords} words
          </div>
          <div className="journal-actions">
            <button className="journal-cancel-btn" onClick={handleCancel}>
              Cancel
            </button>
            <button 
              className="journal-save-btn" 
              onClick={handleSave}
              disabled={saving || !title.trim() || !journalText.trim()}
            >
              {saving ? 'Saving...' : 'Save Journal'}
            </button>
          </div>
        </div>

        {error && <div className="journal-error">{error}</div>}
        {success && <div className="journal-success">{success}</div>}
      </div>
    </div>
  );
}
