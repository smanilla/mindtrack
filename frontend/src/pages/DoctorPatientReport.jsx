import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function DoctorPatientReport() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!token || user?.role !== 'doctor') {
      navigate('/login');
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const auth = { headers: { Authorization: `Bearer ${token}` } };
      const [detailsRes, assessmentsRes] = await Promise.all([
        axios.get((import.meta.env.VITE_API_URL || 'http://localhost:5000') + `/api/doctor/patients/${patientId}`, auth),
        axios.get((import.meta.env.VITE_API_URL || 'http://localhost:5000') + `/api/doctor/patients/${patientId}/assessments`, auth)
      ]);
      setData(detailsRes.data);
      setAssessments(assessmentsRes.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load patient report');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (<div className="page-container"><div className="card"><p>Loading...</p></div></div>);
  if (error) return (<div className="page-container"><div className="card"><p>{error}</p></div></div>);
  if (!data) return null;

  const { patient, entries, journals, summary } = data;

  return (
    <div className="page-container">
      <div className="card" style={{background:'#f8fafc'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <h2 style={{marginTop:0}}>Patient Report: {patient.name}</h2>
            <p style={{margin:0, color:'#555'}}>{patient.email}</p>
          </div>
          <button className="back-btn" onClick={() => navigate('/doctor/dashboard')}>← Back</button>
        </div>
      </div>

      <div className="card" style={{background:'#75B1BE', color:'#000'}}>
        <h3 style={{marginTop:0}}>Overview</h3>
        <div className="summary-stats">
          <div className="stat-item"><span className="stat-label">Entries</span><span className="stat-value">{summary.totalEntries}</span></div>
          <div className="stat-item"><span className="stat-label">Journals</span><span className="stat-value">{summary.totalJournals}</span></div>
          <div className="stat-item"><span className="stat-label">Assessments</span><span className="stat-value">{summary.totalAssessments || 0}</span></div>
          <div className="stat-item"><span className="stat-label">Avg Sleep</span><span className="stat-value">{summary.avgSleep}h</span></div>
        </div>
      </div>

      <div className="card" style={{background:'#f8fafc'}}>
        <h3 style={{marginTop:0}}>All Entries</h3>
        {entries.length === 0 ? <p>No entries</p> : (
          <div className="entries-list">
            {entries.map(e => (
              <div key={e._id} className="entry-item">
                <div style={{fontWeight:600}}>{new Date(e.date).toLocaleDateString()}</div>
                <div style={{fontSize:13, color:'#555'}}>Mood: {e.mood.replace('_',' ')} • Sleep: {e.sleepHours}h</div>
                {e.text && <div style={{fontSize:13, color:'#666', fontStyle:'italic'}}>{e.text.substring(0,100)}{e.text.length>100?'...':''}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{background:'#f8fafc'}}>
        <h3 style={{marginTop:0}}>All Journals</h3>
        {journals.length === 0 ? <p>No journal entries</p> : (
          <div className="journals-list">
            {journals.map(j => (
              <div key={j._id} className="journal-item">
                <div style={{fontWeight:600}}>{j.title}</div>
                <div style={{fontSize:12, color:'#666'}}>{new Date(j.createdAt).toLocaleString()} • Mood: {j.mood || 'N/A'}</div>
                <div style={{fontSize:14, color:'#555'}}>{j.content.substring(0,200)}{j.content.length>200?'...':''}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{background:'#f8fafc'}}>
        <h3 style={{marginTop:0}}>All AI Summaries</h3>
        {assessments.length === 0 ? <p>No summaries</p> : (
          <div style={{display:'grid',gap:12}}>
            {assessments.map((s, idx) => (
              <div key={idx} style={{padding:12, background:'white', borderRadius:8, borderLeft: s.crisis ? '4px solid #ef4444':'4px solid #10b981'}}>
                <div style={{fontSize:12, color:'#6b7280', marginBottom:6}}>{new Date(s.createdAt).toLocaleString()} {s.crisis && <span style={{marginLeft:8, color:'#b91c1c'}}>🚨 Red Alert</span>}</div>
                <div style={{whiteSpace:'pre-wrap'}}>{s.summary}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}





