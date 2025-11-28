import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function DoctorPatientEntries() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!token || user?.role !== 'doctor') {
      navigate('/login');
      return;
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const auth = { headers: { Authorization: `Bearer ${token}` } };
      const [patientRes, entriesRes] = await Promise.all([
        axios.get((import.meta.env.VITE_API_URL || 'http://localhost:5000') + `/api/doctor/patients/${patientId}`, auth),
        axios.get((import.meta.env.VITE_API_URL || 'http://localhost:5000') + `/api/doctor/patients/${patientId}/entries`, auth)
      ]);
      setPatient(patientRes.data.patient);
      setEntries(entriesRes.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load entries');
    } finally {
      setLoading(false);
    }
  }

  function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getMoodIcon(mood) {
    const moodIcons = {
      'very_good': '😄',
      'good': '🙂',
      'neutral': '😐',
      'bad': '😔',
      'very_bad': '😢'
    };
    return moodIcons[mood] || '😐';
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="page-container">
          <div className="card"><p>Loading entries...</p></div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="page-container">
        <div className="card" style={{background: '#75B1BE', color: '#000', marginBottom: '20px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div>
              <h2 style={{marginTop: 0, color: '#000'}}>All Entries - {patient?.name}</h2>
              <p style={{color: '#333', margin: 0}}>{patient?.email}</p>
            </div>
            <button 
              onClick={() => navigate('/doctor/dashboard')}
              style={{
                background: '#000',
                color: '#fff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {error && <div className="error" style={{marginBottom: '20px'}}>{error}</div>}

        <div className="card" style={{background: '#f8fafc'}}>
          <h3 style={{marginTop: 0}}>All Entries ({entries.length})</h3>
          {entries.length === 0 ? (
            <p style={{color: '#666', fontStyle: 'italic'}}>No entries found</p>
          ) : (
            <div className="entries-list">
              {entries.map(entry => (
                <div key={entry._id} className="entry-item" style={{
                  padding: '16px',
                  marginBottom: '12px',
                  background: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                    <span style={{fontSize: '32px'}}>{getMoodIcon(entry.mood)}</span>
                    <div style={{flex: 1}}>
                      <div style={{fontWeight: '600', color: '#333', fontSize: '16px'}}>
                        {formatDate(entry.date)}
                      </div>
                      <div style={{fontSize: '14px', color: '#666', marginTop: '4px'}}>
                        Mood: <strong>{entry.mood.replace('_', ' ')}</strong> • Sleep: <strong>{entry.sleepHours}h</strong>
                      </div>
                      {entry.text && (
                        <div style={{
                          fontSize: '14px',
                          color: '#555',
                          marginTop: '8px',
                          padding: '8px',
                          background: '#f9fafb',
                          borderRadius: '4px',
                          fontStyle: 'italic'
                        }}>
                          {entry.text}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

