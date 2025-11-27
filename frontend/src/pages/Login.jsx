import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    console.log('Login attempt with:', { email, password });
    console.log('API URL:', import.meta.env.VITE_API_URL);
    
    try {
      const url = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/auth/login';
      console.log('Making request to:', url);
      
      const res = await axios.post(url, { 
        email, 
        password 
      });
      
      console.log('Login successful:', res.data);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      // Redirect based on user role
      if (res.data.user?.role === 'doctor') {
        navigate('/doctor/dashboard');
      } else {
        navigate('/patient/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      console.error('Response:', err.response);
      console.error('Request URL:', err.config?.url);
      console.error('Request data:', err.config?.data);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <h1>MindTrack</h1>
      <h2>Welcome Back</h2>
      
      {/* Debug info */}
      <div style={{fontSize: '12px', color: '#666', marginBottom: '16px', padding: '8px', background: '#f0f0f0', borderRadius: '4px'}}>
        <div>API URL: {import.meta.env.VITE_API_URL || 'NOT SET'}</div>
        <div>Frontend Port: {window.location.port}</div>
      </div>
      
      <form onSubmit={handleSubmit} className="auth-form">
        <input 
          type="email" 
          placeholder="Email address" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
          disabled={loading}
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
          disabled={loading}
        />
        {error && <div className="error">{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      <p>Don't have an account? <Link to="/register">Create one here</Link></p>
    </div>
  );
}


