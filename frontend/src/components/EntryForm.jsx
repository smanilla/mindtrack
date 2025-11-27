import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function EntryForm({ onSaved }) {
  const navigate = useNavigate();
  const [selectedMood, setSelectedMood] = useState(null);
  const [mood, setMood] = useState('neutral');
  const [text, setText] = useState('');
  const [sleepHours, setSleepHours] = useState(8);
  const [showSleepInput, setShowSleepInput] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const moodImages = {
    very_good: '/mood_1-removebg-preview.png',
    good: '/mood_2-removebg-preview.png',
    neutral: '/mood_3-removebg-preview.png',
    bad: '/mood_4-removebg-preview.png',
    very_bad: '/mood_5-removebg-preview.png'
  };

  function handleMoodSelect(moodValue) {
    setSelectedMood(moodValue);
    setMood(moodValue);
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('token');
      const auth = { headers: { Authorization: `Bearer ${token}` } };
      
      await axios.post(
        (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/entries',
        { 
          mood, 
          text: text.trim(), 
          sleepHours: Number(sleepHours) 
        },
        auth
      );
      
      setText('');
      setSleepHours(8);
      setSelectedMood(null);
      setMood('neutral');
      setSuccess('Entry saved successfully!');
      
      if (onSaved) {
        setTimeout(() => {
          onSaved();
          setSuccess('');
        }, 1000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save entry. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card daily-entry-card" onSubmit={submit}>
      <h3>Daily Entry</h3>
      
      <div className="mood-section">
        <label>How are you feeling today?</label>
        <div className="mood-images-container">
          {Object.entries(moodImages).map(([moodValue, imagePath]) => (
            <div
              key={moodValue}
              className={`mood-image-wrapper ${selectedMood === moodValue ? 'selected' : ''}`}
              onClick={() => handleMoodSelect(moodValue)}
            >
              <img
                src={imagePath}
                alt={moodValue}
                className="mood-image"
              />
            </div>
          ))}
        </div>
      </div>
      
      <div className="sleep-section">
        <label className="sleep-section-label">Sleep Hours</label>
        <div className="sleep-info">
          <span className="sleep-icon">ZzZzZz</span>
          <div className="sleep-hours-wrapper">
            {showSleepInput ? (
              <input
                type="number"
                min="0"
                max="24"
                value={sleepHours}
                onChange={(e) => setSleepHours(e.target.value)}
                onBlur={() => setShowSleepInput(false)}
                placeholder="h"
                className="sleep-input-large"
                autoFocus
              />
            ) : (
              <div 
                className="sleep-display-box"
                onClick={() => setShowSleepInput(true)}
              >
                🕐 {sleepHours}h
              </div>
            )}
            <img 
              src="/Screenshot_2025-10-28_230224-removebg-preview.png" 
              alt="Sleep"
              className="sleep-image"
            />
          </div>
        </div>
      </div>
      
      <div className="entry-actions">
        <button type="submit" className="save-button" disabled={saving}>
          {saving ? 'Saving...' : 'Save Entry'}
        </button>
      </div>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
    </form>
  );
}