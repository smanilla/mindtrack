import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import EntryForm from '../components/EntryForm';
import ReportCard from '../components/ReportCard';
import JournalTile from '../components/JournalTile';

export default function Dashboard() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(false);

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    
    // Load data on mount - no role-based redirect, allow URL to determine view
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  async function loadData() {
    // Prevent multiple simultaneous requests
    if (isLoadingData) {
      return;
    }
    
    setIsLoadingData(true);
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const auth = { headers: { Authorization: `Bearer ${token}` } };
      const [entriesRes, summaryRes] = await Promise.all([
        axios.get((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/entries', auth),
        axios.get((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/ai/weekly-summary', auth),
      ]);
      
      setEntries(entriesRes.data || []);
      setSummary(summaryRes.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      } else if (err.code !== 'ERR_NETWORK' && err.code !== 'ERR_INSUFFICIENT_RESOURCES') {
        // Only show error if it's not a network/resource error
        setError('Failed to load data. Please try again.');
        console.error('Load data error:', err);
      }
    } finally {
      setLoading(false);
      setIsLoadingData(false);
    }
  }

  async function onSaved() {
    await loadData();
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="card">
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {error && <div className="error" style={{marginBottom: '20px'}}>{error}</div>}
      
      <div className="content">
        <div className="left-column">
          <EntryForm onSaved={onSaved} />
          <JournalTile />
        </div>
        <div className="right-column">
          <ReportCard summary={summary} entries={entries} />
        </div>
      </div>
    </div>
  );
}


