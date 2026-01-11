import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function DoctorPatientAssessments() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
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
      const [patientRes, assessmentsRes] = await Promise.all([
        axios.get((import.meta.env.VITE_API_URL || 'http://localhost:5000') + `/api/doctor/patients/${patientId}`, auth),
        axios.get((import.meta.env.VITE_API_URL || 'http://localhost:5000') + `/api/doctor/patients/${patientId}/assessments`, auth)
      ]);
      setPatient(patientRes.data.patient);
      setAssessments(assessmentsRes.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load assessments');
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
          <div className="card"><p>Loading assessments...</p></div>
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
              <h2 style={{marginTop: 0, color: '#000'}}>🤖 All AI Assessments - {patient?.name}</h2>
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
          <h3 style={{marginTop: 0}}>All AI Assessment Summaries ({assessments.length})</h3>
          {assessments.length === 0 ? (
            <p style={{color: '#666', fontStyle: 'italic'}}>No AI assessments found</p>
          ) : (
            <div className="assessments-list">
              {assessments.map(assessment => (
                <div key={assessment._id} className="assessment-item" style={{
                  padding: '20px',
                  marginBottom: '16px',
                  background: assessment.crisis ? '#fee2e2' : 'white',
                  border: assessment.crisis ? '2px solid #ef4444' : '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px'}}>
                    <div style={{fontSize: '13px', color: '#666', fontWeight: '500'}}>
                      {formatDate(assessment.createdAt)}
                    </div>
                    {assessment.crisis && (
                      <span style={{
                        background: '#ef4444',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        ⚠️ CRISIS FLAG
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize: '15px',
                    color: '#333',
                    lineHeight: '1.7',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {assessment.summary}
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











