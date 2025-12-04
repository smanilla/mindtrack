import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function DoctorPatientJournals() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [journals, setJournals] = useState([]);
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
      const [patientRes, journalsRes] = await Promise.all([
        axios.get((import.meta.env.VITE_API_URL || 'http://localhost:5000') + `/api/doctor/patients/${patientId}`, auth),
        axios.get((import.meta.env.VITE_API_URL || 'http://localhost:5000') + `/api/doctor/patients/${patientId}/journals`, auth)
      ]);
      setPatient(patientRes.data.patient);
      setJournals(journalsRes.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load journals');
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

  if (loading) {
    return (
      <>
        <Header />
        <div className="page-container">
          <div className="card"><p>Loading journals...</p></div>
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
              <h2 style={{marginTop: 0, color: '#000'}}>All Journals - {patient?.name}</h2>
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
          <h3 style={{marginTop: 0}}>All Journal Entries ({journals.length})</h3>
          {journals.length === 0 ? (
            <p style={{color: '#666', fontStyle: 'italic'}}>No journal entries found</p>
          ) : (
            <div className="journals-list">
              {journals.map(journal => (
                <div key={journal._id} className="journal-item" style={{
                  padding: '20px',
                  marginBottom: '16px',
                  background: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{fontWeight: '600', color: '#333', fontSize: '18px', marginBottom: '8px'}}>
                    {journal.title}
                  </div>
                  <div style={{fontSize: '12px', color: '#666', marginBottom: '12px'}}>
                    {formatDate(journal.createdAt)} • Mood: {journal.mood || 'N/A'}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#555',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {journal.content}
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





