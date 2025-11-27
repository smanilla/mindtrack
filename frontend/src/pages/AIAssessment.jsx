import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function AIAssessment() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState('');
  const [crisis, setCrisis] = useState(false);
  const [contacts, setContacts] = useState(''); // comma separated emails

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    // Doctors shouldn't access patient AI by design; allow but we can redirect softly
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user?.role === 'doctor') {
      navigate('/doctor/dashboard');
      return;
    }

    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadQuestions() {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/ai-assessment/start', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuestions(res.data.questions || []);
      setAnswers((res.data.questions || []).map(() => ''));
    } catch (e) {
      setError('Failed to load questions');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSummary('');
    setCrisis(false);
    try {
      const token = localStorage.getItem('token');
      const payload = { answers, contacts: contacts.split(',').map(s => s.trim()).filter(Boolean) };
      const res = await axios.post((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/ai-assessment/submit', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSummary(res.data.summary || '');
      setCrisis(Boolean(res.data.crisis));
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="card"><p>Loading assessment...</p></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="card" style={{ background: '#f8fafc' }}>
        <h2 style={{ marginTop: 0 }}>🩺 Daily Assessment</h2>
        <p style={{ marginTop: 0 }}>Answer the questions below. We’ll generate a ~150-word summary using AI.</p>

        {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {questions.map((q, idx) => (
            <div key={idx} style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>{idx + 1}. {q}</label>
              <textarea
                value={answers[idx]}
                onChange={(e) => {
                  const next = [...answers];
                  next[idx] = e.target.value;
                  setAnswers(next);
                }}
                rows={3}
                style={{ width: '100%' }}
                required
              />
            </div>
          ))}

          <div style={{ marginTop: 16, marginBottom: 16 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Notify contacts (optional)</label>
            <input
              type="text"
              placeholder="Comma-separated emails (family, friends)"
              value={contacts}
              onChange={(e) => setContacts(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: 6 }}
            />
            <small style={{ display: 'block', color: '#555', marginTop: 6 }}>On red alert, we will email your doctor automatically and these emails if provided.</small>
          </div>

          <button type="submit" disabled={submitting} style={{
            background: '#75B1BE', color: '#000', border: 'none', padding: '10px 16px', borderRadius: 6, cursor: submitting ? 'not-allowed' : 'pointer'
          }}>
            {submitting ? 'Generating summary...' : 'Generate Summary'}
          </button>
        </form>
      </div>

      {summary && (
        <div className="card" style={{ background: crisis ? '#fee2e2' : '#ecfeff', border: crisis ? '1px solid #ef4444' : '1px solid #67e8f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ marginTop: 0 }}>{crisis ? '🚨 Red Alert Summary' : '✅ Your Summary'}</h3>
            <button onClick={() => navigate('/patient/dashboard')} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>✕</button>
          </div>
          <p style={{ whiteSpace: 'pre-wrap' }}>{summary}</p>
          {crisis && (
            <div style={{ marginTop: 8, color: '#991b1b' }}>
              We detected language indicating possible self-harm or criminal risk. Your doctor and provided contacts have been notified if email is configured. If you are in immediate danger, please contact your local emergency number now.
            </div>
          )}
        </div>
      )}
    </div>
  );
}





