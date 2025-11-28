import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientDetails, setPatientDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState('');
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    
    // Load patients on mount - no role-based redirect, allow URL to determine view
    // Note: API will still enforce role-based access
    loadPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  async function loadPatients() {
    // Prevent multiple simultaneous requests
    if (isLoadingPatients) {
      return;
    }
    
    setIsLoadingPatients(true);
    setLoading(true);
    setError('');
    
    try {
      const auth = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(
        (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/doctor/patients',
        auth
      );
      
      setPatients(response.data || []);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      } else if (err.code !== 'ERR_NETWORK') {
        // Only show error if it's not a network error (those might be temporary)
        setError('Failed to load patients. Please try again.');
        console.error('Load patients error:', err);
      }
    } finally {
      setLoading(false);
      setIsLoadingPatients(false);
    }
  }

  async function loadPatientDetails(patientId) {
    setLoadingDetails(true);
    setSelectedPatient(patientId);
    
    try {
      const auth = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(
        (import.meta.env.VITE_API_URL || 'http://localhost:5000') + `/api/doctor/patients/${patientId}`,
        auth
      );
      
      setPatientDetails(response.data);
    } catch (err) {
      setError('Failed to load patient details.');
      console.error('Load patient details error:', err);
      setPatientDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  }


  function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
      <div className="page-container">
        <div className="card">
          <p>Loading patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="doctor-dashboard-header">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
          <div>
            <h1>👨‍⚕️ Doctor Dashboard</h1>
            <p>Monitor and support your patients' mental health journey</p>
          </div>
          <button
            onClick={loadPatients}
            disabled={isLoadingPatients}
            style={{
              background: isLoadingPatients ? '#9ca3af' : '#75B1BE',
              color: '#000',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: isLoadingPatients ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {isLoadingPatients ? '⏳ Loading...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {error && <div className="error" style={{marginBottom: '20px'}}>{error}</div>}
      
      {patients.length === 0 && !loading && (
        <div className="card" style={{marginBottom: '20px', background: '#fff3cd', border: '1px solid #ffc107'}}>
          <p style={{margin: 0, color: '#856404'}}>
            ⚠️ No patients found. If you just registered patients, try clicking "Refresh" or check the browser console for details.
          </p>
        </div>
      )}

      <div className="doctor-content">
        <div className="doctor-sidebar">
          <div className="card" style={{background: '#75B1BE', color: '#000', marginBottom: '20px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
              <h2 style={{margin: 0, color: '#000'}}>Active Patients</h2>
              <button
                className="add-patient-btn"
                onClick={() => navigate('/doctor/register-patient')}
                style={{
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                + Add Patient
              </button>
            </div>
            <p style={{color: '#000', marginBottom: '16px'}}>{patients.length} patient{patients.length !== 1 ? 's' : ''}</p>
            
            {patients.length === 0 ? (
              <p style={{color: '#333', fontStyle: 'italic'}}>No patients registered yet. Click "Add Patient" to register a new patient.</p>
            ) : (
              <div className="patients-list">
                {patients.map(patient => (
                  <div
                    key={patient._id}
                    className={`patient-card ${selectedPatient === patient._id ? 'selected' : ''}`}
                    onClick={() => loadPatientDetails(patient._id)}
                  >
                    <div className="patient-info">
                      <h3 style={{margin: 0, color: '#000'}}>{patient.name}</h3>
                      <p style={{margin: '4px 0 0 0', fontSize: '12px', color: '#333'}}>
                        {patient.email}
                      </p>
                      <p style={{margin: '4px 0 0 0', fontSize: '11px', color: '#666'}}>
                        Joined: {formatDate(patient.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="doctor-main">
          {!selectedPatient ? (
            <div className="card">
              <h2>Select a Patient</h2>
              <p>Click on a patient from the list to view their mental health data, entries, and journals.</p>
            </div>
          ) : loadingDetails ? (
            <div className="card">
              <p>Loading patient details...</p>
            </div>
          ) : patientDetails ? (
            <div className="patient-details">
              <div className="card" style={{background: '#75B1BE', color: '#000', marginBottom: '20px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <div>
                    <h2 style={{marginTop: 0, color: '#000'}}>{patientDetails.patient.name}</h2>
                    <p style={{color: '#333', margin: 0}}>{patientDetails.patient.email}</p>
                  </div>
                  <button
                    className="close-btn"
                    onClick={() => {
                      setSelectedPatient(null);
                      setPatientDetails(null);
                    }}
                  >
                    ✕ Close
                  </button>
                </div>
              </div>

              {/* Summary Card */}
              <div className="card" style={{background: '#75B1BE', color: '#000', marginBottom: '20px'}}>
                <h3 style={{marginTop: 0, color: '#000'}}>Weekly Summary</h3>
                <div className="summary-stats">
                  <div className="stat-item">
                    <span className="stat-label" style={{color: '#333'}}>Total Entries:</span>
                    <span className="stat-value" style={{color: '#000', fontWeight: 'bold'}}>{patientDetails.summary.totalEntries}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label" style={{color: '#333'}}>This Week:</span>
                    <span className="stat-value" style={{color: '#000', fontWeight: 'bold'}}>{patientDetails.summary.count}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label" style={{color: '#333'}}>Avg Sleep:</span>
                    <span className="stat-value" style={{color: '#000', fontWeight: 'bold'}}>{patientDetails.summary.avgSleep}h</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label" style={{color: '#333'}}>Journals:</span>
                    <span className="stat-value" style={{color: '#000', fontWeight: 'bold'}}>{patientDetails.summary.totalJournals}</span>
                  </div>
                </div>
              </div>

              {/* Entries Section */}
              <div className="card" style={{background: '#f8fafc', marginBottom: '20px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center', marginBottom: '12px'}}>
                  <h3 style={{marginTop: 0}}>Recent Entries</h3>
                  {patientDetails.entries.length > 5 && (
                    <button 
                      onClick={() => navigate(`/doctor/patient/${selectedPatient}/entries`)}
                      style={{
                        background: '#75B1BE',
                        color: '#000',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500'
                      }}
                    >
                      See All ({patientDetails.entries.length})
                    </button>
                  )}
                </div>
                {patientDetails.entries.length === 0 ? (
                  <p style={{color: '#666', fontStyle: 'italic'}}>No entries yet</p>
                ) : (
                  <div className="entries-list">
                  {patientDetails.entries.slice(0, 5).map(entry => (
                      <div key={entry._id} className="entry-item">
                        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                          <span style={{fontSize: '24px'}}>{getMoodIcon(entry.mood)}</span>
                          <div style={{flex: 1}}>
                            <div style={{fontWeight: '600', color: '#333'}}>
                              {formatDate(entry.date)}
                            </div>
                            <div style={{fontSize: '14px', color: '#666'}}>
                              Mood: {entry.mood.replace('_', ' ')} • Sleep: {entry.sleepHours}h
                            </div>
                            {entry.text && (
                              <div style={{fontSize: '13px', color: '#555', marginTop: '4px', fontStyle: 'italic'}}>
                                {entry.text.length > 50 ? entry.text.substring(0, 50) + '...' : entry.text}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Journals Section */}
              <div className="card" style={{background: '#f8fafc', marginBottom: '20px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center', marginBottom: '12px'}}>
                  <h3 style={{marginTop: 0}}>Recent Journals</h3>
                  <div style={{display: 'flex', gap: '8px'}}>
                    {patientDetails.journals.length > 5 && (
                      <button 
                        onClick={() => navigate(`/doctor/patient/${selectedPatient}/journals`)}
                        style={{
                          background: '#75B1BE',
                          color: '#000',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500'
                        }}
                      >
                        See All ({patientDetails.journals.length})
                      </button>
                    )}
                    <button className="close-btn" onClick={() => navigate(`/doctor/patient/${selectedPatient}/report`)}>View Report</button>
                  </div>
                </div>
                {patientDetails.journals.length === 0 ? (
                  <p style={{color: '#666', fontStyle: 'italic'}}>No journal entries yet</p>
                ) : (
                  <div className="journals-list">
                    {patientDetails.journals.slice(0, 5).map(journal => (
                      <div key={journal._id} className="journal-item">
                        <div style={{fontWeight: '600', color: '#333'}}>{journal.title}</div>
                        <div style={{fontSize: '12px', color: '#666', margin: '4px 0'}}>
                          {formatDate(journal.createdAt)} • Mood: {journal.mood || 'N/A'}
                        </div>
                        <div style={{fontSize: '14px', color: '#555', marginTop: '8px'}}>
                          {journal.content.length > 100 ? journal.content.substring(0, 100) + '...' : journal.content}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* AI Assessments Section */}
              <div className="card" style={{background: '#f8fafc'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center', marginBottom: '12px'}}>
                  <h3 style={{marginTop: 0}}>🤖 AI Assessment Summaries</h3>
                  {patientDetails.assessments && patientDetails.assessments.length > 10 && (
                    <button 
                      onClick={() => navigate(`/doctor/patient/${selectedPatient}/assessments`)}
                      style={{
                        background: '#75B1BE',
                        color: '#000',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500'
                      }}
                    >
                      See All ({patientDetails.assessments.length})
                    </button>
                  )}
                </div>
                {patientDetails.assessments && patientDetails.assessments.length === 0 ? (
                  <p style={{color: '#666', fontStyle: 'italic'}}>No AI assessments yet</p>
                ) : (
                  <div className="assessments-list">
                    {patientDetails.assessments.slice(0, 10).map(assessment => (
                      <div key={assessment._id} className="assessment-item" style={{
                        padding: '16px',
                        marginBottom: '12px',
                        background: assessment.crisis ? '#fee2e2' : '#f0f9ff',
                        border: assessment.crisis ? '2px solid #ef4444' : '1px solid #e0e7ff',
                        borderRadius: '8px'
                      }}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px'}}>
                          <div style={{fontSize: '12px', color: '#666'}}>
                            {formatDate(assessment.createdAt)}
                          </div>
                          {assessment.crisis && (
                            <span style={{
                              background: '#ef4444',
                              color: 'white',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 'bold'
                            }}>
                              ⚠️ CRISIS FLAG
                            </span>
                          )}
                        </div>
                        <div style={{fontSize: '14px', color: '#333', lineHeight: '1.6'}}>
                          {assessment.summary}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card">
              <p>Failed to load patient details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

