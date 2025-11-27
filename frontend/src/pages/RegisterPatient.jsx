import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function RegisterPatient() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  React.useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    // Note: API will enforce doctor role - no frontend redirect
  }, [token, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const auth = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.post(
        (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/doctor/register-patient',
        form,
        auth
      );
      
      setSuccess(`Patient "${form.name}" registered successfully! They can now login with email: ${form.email}`);
      setForm({ name: '', email: '', password: '' });
      
      // Redirect to doctor dashboard after 3 seconds
      setTimeout(() => {
        navigate('/doctor/dashboard');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register patient. Please try again.');
      console.error('Register patient error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container">
      <div className="register-patient-container">
        <div className="card">
          <h2 style={{marginTop: 0, textAlign: 'center'}}>👨‍⚕️ Register New Patient</h2>
          <p style={{textAlign: 'center', marginBottom: '24px'}}>
            Create a new patient account. They will be assigned to you automatically.
          </p>
          
          {success && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: '#fff',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '14px',
                backdropFilter: 'blur(10px)'
              }}>
              ✓ {success}
              <br />
              <small style={{fontSize: '12px', display: 'block', marginTop: '8px'}}>
                Redirecting to dashboard in 3 seconds...
              </small>
            </div>
          )}
          
          {error && <div className="error" style={{marginBottom: '20px'}}>{error}</div>}
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div style={{marginBottom: '16px'}}>
              <label style={{display: 'block', marginBottom: '8px', fontWeight: '500'}}>
                Patient Name *
              </label>
              <input
                type="text"
                placeholder="Enter patient's full name"
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
                required
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{marginBottom: '16px'}}>
              <label style={{display: 'block', marginBottom: '8px', fontWeight: '500'}}>
                Email Address *
              </label>
              <input
                type="email"
                placeholder="Enter patient's email"
                value={form.email}
                onChange={(e) => setForm({...form, email: e.target.value})}
                required
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{marginBottom: '20px'}}>
              <label style={{display: 'block', marginBottom: '8px', fontWeight: '500'}}>
                Password *
              </label>
              <input
                type="password"
                placeholder="Set a password (min. 6 characters)"
                value={form.password}
                onChange={(e) => setForm({...form, password: e.target.value})}
                required
                disabled={loading}
                minLength={6}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
              <small style={{fontSize: '12px', display: 'block', marginTop: '4px'}}>
                The patient will use this email and password to login
              </small>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: loading ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '12px'
              }}
            >
              {loading ? 'Registering Patient...' : 'Register Patient'}
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/doctor/dashboard')}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.2)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)'
              }}
            >
              Cancel
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

