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
  const [notifications, setNotifications] = useState(null); // notification status

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
      setNotifications(res.data.notifications || null);
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
            <small style={{ display: 'block', color: '#555', marginTop: 6 }}>On red alert, we will automatically notify your doctor and emergency contacts via email and voice call (if configured).</small>
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
            <div style={{ marginTop: 16, padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6 }}>
              <div style={{ color: '#991b1b', fontWeight: 600, marginBottom: 8 }}>
                🚨 Crisis Alert - Immediate Support Needed
              </div>
              <div style={{ color: '#991b1b', marginBottom: 8 }}>
                We detected language indicating possible self-harm or crisis. Your doctor and emergency contacts are being notified.
              </div>
              {notifications && (
                <div style={{ marginTop: 12, fontSize: '0.9em' }}>
                  <div style={{ marginBottom: 4 }}>
                    <strong>Email notifications:</strong> {notifications.emails?.sent ? '✅ Sent' : `❌ ${notifications.emails?.reason || 'Not sent'}`}
                  </div>
                  <div style={{ marginBottom: 4 }}>
                    <strong>Voice calls:</strong> {notifications.voiceCalls?.sent ? '✅ Sent' : `❌ ${notifications.voiceCalls?.reason || 'Not sent'}`}
                  </div>
                  {notifications.voiceCalls?.calls && notifications.voiceCalls.calls.length > 0 && (
                    <div style={{ marginTop: 8, fontSize: '0.85em', color: '#7f1d1d' }}>
                      <strong>Called contacts:</strong>
                      <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                        {notifications.voiceCalls.calls.map((call, idx) => (
                          <li key={idx}>
                            {call.name} ({call.type === 'doctor' ? 'Doctor' : 'Emergency Contact'}) - {call.sent ? '✅ Called' : `❌ Failed: ${call.reason}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              <div style={{ marginTop: 12, padding: '8px', background: '#fff', borderRadius: 4, border: '1px solid #fca5a5' }}>
                <strong>If you are in immediate danger, please:</strong>
                <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                  <li>Call 911 or your local emergency number</li>
                  <li>Call 988 (Suicide & Crisis Lifeline)</li>
                  <li>Text HOME to 741741 (Crisis Text Line)</li>
                  <li>Go to your nearest emergency room</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}





