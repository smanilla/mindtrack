import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import EmergencyContactsManager from '../components/EmergencyContactsManager';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientDetails, setPatientDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState('');
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [showEmergencyContacts, setShowEmergencyContacts] = useState(false);

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

  // Helper function to prepare mood trend chart data
  function prepareMoodTrendData(entries) {
    const moodValues = { 'very_bad': 1, 'bad': 2, 'neutral': 3, 'good': 4, 'very_good': 5 };
    const sortedEntries = [...entries]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-30); // Last 30 entries
    
    const labels = sortedEntries.map(entry => 
      new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );
    const moodData = sortedEntries.map(entry => moodValues[entry.mood] || 3);
    const sleepData = sortedEntries.map(entry => entry.sleepHours);

    return { labels, moodData, sleepData };
  }

  // Helper function to prepare mood distribution data
  function prepareMoodDistributionData(entries) {
    const moodCounts = {
      'very_good': 0,
      'good': 0,
      'neutral': 0,
      'bad': 0,
      'very_bad': 0
    };
    
    entries.forEach(entry => {
      if (moodCounts.hasOwnProperty(entry.mood)) {
        moodCounts[entry.mood]++;
      }
    });

    return moodCounts;
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
                  <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                    <button
                      onClick={() => setShowEmergencyContacts(true)}
                      style={{
                        background: '#fff',
                        color: '#000',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      📞 Manage Emergency Contacts
                    </button>
                    <button
                      className="close-btn"
                      onClick={() => {
                        setSelectedPatient(null);
                        setPatientDetails(null);
                        setShowEmergencyContacts(false);
                      }}
                    >
                      ✕ Close
                    </button>
                  </div>
                </div>
              </div>

              {showEmergencyContacts && (
                <div style={{ marginBottom: '20px' }}>
                  <EmergencyContactsManager
                    patientId={selectedPatient}
                    onClose={() => setShowEmergencyContacts(false)}
                  />
                </div>
              )}

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

              {/* Entries Section with Charts */}
              <div className="card" style={{background: '#f8fafc', marginBottom: '20px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center', marginBottom: '20px'}}>
                  <h3 style={{marginTop: 0}}>Mood Analytics</h3>
                  {patientDetails.entries.length > 0 && (
                    <button 
                      onClick={() => navigate(`/doctor/patient/${selectedPatient}/entries`)}
                      style={{
                        background: '#75B1BE',
                        color: '#000',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      View All ({patientDetails.entries.length})
                    </button>
                  )}
                </div>
                {patientDetails.entries.length === 0 ? (
                  <p style={{color: '#666', fontStyle: 'italic', textAlign: 'center', padding: '40px'}}>No entries yet</p>
                ) : (
                  <div style={{
                    display: 'grid', 
                    gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr', 
                    gap: '20px', 
                    marginBottom: '20px'
                  }}>
                    {/* Mood Trend Line Chart */}
                    <div style={{background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}>
                      <h4 style={{marginTop: 0, marginBottom: '16px', color: '#333', fontSize: '16px', fontWeight: '600'}}>
                        Mood Trend (Last 30 Days)
                      </h4>
                      {(() => {
                        const { labels, moodData, sleepData } = prepareMoodTrendData(patientDetails.entries);
                        return (
                          <Line
                            data={{
                              labels: labels,
                              datasets: [
                                {
                                  label: 'Mood',
                                  data: moodData,
                                  borderColor: '#75B1BE',
                                  backgroundColor: 'rgba(117, 177, 190, 0.1)',
                                  borderWidth: 3,
                                  fill: true,
                                  tension: 0.4,
                                  pointRadius: 4,
                                  pointHoverRadius: 6,
                                  pointBackgroundColor: '#75B1BE',
                                  pointBorderColor: '#fff',
                                  pointBorderWidth: 2
                                },
                                {
                                  label: 'Sleep Hours',
                                  data: sleepData,
                                  borderColor: '#10b981',
                                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                  borderWidth: 2,
                                  fill: false,
                                  tension: 0.4,
                                  pointRadius: 3,
                                  yAxisID: 'y1'
                                }
                              ]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: true,
                              plugins: {
                                legend: {
                                  display: true,
                                  position: 'top',
                                  labels: {
                                    usePointStyle: true,
                                    padding: 15,
                                    font: {
                                      size: 12,
                                      weight: '500'
                                    }
                                  }
                                },
                                tooltip: {
                                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                  padding: 12,
                                  titleFont: { size: 14, weight: 'bold' },
                                  bodyFont: { size: 12 },
                                  borderColor: '#75B1BE',
                                  borderWidth: 1,
                                  callbacks: {
                                    label: function(context) {
                                      if (context.datasetIndex === 0) {
                                        const moodMap = { 1: 'Very Bad', 2: 'Bad', 3: 'Neutral', 4: 'Good', 5: 'Very Good' };
                                        return `Mood: ${moodMap[context.parsed.y] || 'Unknown'}`;
                                      } else {
                                        return `Sleep: ${context.parsed.y} hours`;
                                      }
                                    }
                                  }
                                }
                              },
                              scales: {
                                y: {
                                  beginAtZero: false,
                                  min: 0.5,
                                  max: 5.5,
                                  ticks: {
                                    stepSize: 1,
                                    callback: function(value) {
                                      const moodMap = { 1: 'Very Bad', 2: 'Bad', 3: 'Neutral', 4: 'Good', 5: 'Very Good' };
                                      return moodMap[value] || '';
                                    },
                                    font: { size: 11 }
                                  },
                                  grid: {
                                    color: 'rgba(0, 0, 0, 0.05)'
                                  }
                                },
                                y1: {
                                  type: 'linear',
                                  display: true,
                                  position: 'right',
                                  min: 0,
                                  max: 12,
                                  ticks: {
                                    callback: function(value) {
                                      return value + 'h';
                                    },
                                    font: { size: 11 }
                                  },
                                  grid: {
                                    drawOnChartArea: false
                                  }
                                },
                                x: {
                                  grid: {
                                    display: false
                                  },
                                  ticks: {
                                    maxRotation: 45,
                                    minRotation: 45,
                                    font: { size: 10 }
                                  }
                                }
                              }
                            }}
                          />
                        );
                      })()}
                    </div>

                    {/* Mood Distribution Pie Chart */}
                    <div style={{background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}>
                      <h4 style={{marginTop: 0, marginBottom: '16px', color: '#333', fontSize: '16px', fontWeight: '600'}}>
                        Mood Distribution
                      </h4>
                      {(() => {
                        const moodCounts = prepareMoodDistributionData(patientDetails.entries);
                        const colors = {
                          'very_good': '#10b981',
                          'good': '#75B1BE',
                          'neutral': '#fbbf24',
                          'bad': '#f97316',
                          'very_bad': '#ef4444'
                        };

                        return (
                          <Pie
                            data={{
                              labels: ['Very Good', 'Good', 'Neutral', 'Bad', 'Very Bad'],
                              datasets: [{
                                data: [
                                  moodCounts.very_good,
                                  moodCounts.good,
                                  moodCounts.neutral,
                                  moodCounts.bad,
                                  moodCounts.very_bad
                                ],
                                backgroundColor: [
                                  colors.very_good,
                                  colors.good,
                                  colors.neutral,
                                  colors.bad,
                                  colors.very_bad
                                ],
                                borderColor: '#fff',
                                borderWidth: 3,
                                hoverBorderWidth: 4
                              }]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: true,
                              plugins: {
                                legend: {
                                  display: true,
                                  position: 'bottom',
                                  labels: {
                                    usePointStyle: true,
                                    padding: 15,
                                    font: {
                                      size: 12,
                                      weight: '500'
                                    }
                                  }
                                },
                                tooltip: {
                                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                  padding: 12,
                                  titleFont: { size: 14, weight: 'bold' },
                                  bodyFont: { size: 12 },
                                  callbacks: {
                                    label: function(context) {
                                      const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                      const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
                                      return `${context.label}: ${context.parsed} (${percentage}%)`;
                                    }
                                  }
                                }
                              }
                            }}
                          />
                        );
                      })()}
                    </div>
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

