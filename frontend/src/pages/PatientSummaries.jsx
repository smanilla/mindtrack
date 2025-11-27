import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function PatientSummaries() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/ai-assessment/mine', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(res.data || []);
    } catch (e) {
      if (e.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      } else {
        setError('Failed to load summaries');
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="page-container"><div className="card"><p>Loading...</p></div></div>
    );
  }

  return (
    <div className="page-container">
      <div className="card" style={{ background: '#f8fafc' }}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <h2 style={{marginTop: 0}}>🧠 All AI Summaries</h2>
          <button className="back-btn" onClick={() => navigate('/patient/report')}>← Back to Report</button>
        </div>
        {error && <div className="error" style={{marginBottom: 16}}>{error}</div>}
        {items.length === 0 ? (
          <p>No summaries yet.</p>
        ) : (
          <div style={{display: 'grid', gap: 12}}>
            {items.map((s, idx) => (
              <div key={idx} style={{padding: 12, background: 'white', borderRadius: 8, borderLeft: s.crisis ? '4px solid #ef4444' : '4px solid #10b981'}}>
                <div style={{fontSize: 12, color: '#6b7280', marginBottom: 6}}>
                  {new Date(s.createdAt).toLocaleString()} {s.crisis && <span style={{marginLeft: 8, color: '#b91c1c'}}>🚨 Red Alert</span>}
                </div>
                <div style={{whiteSpace: 'pre-wrap'}}>{s.summary}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}





