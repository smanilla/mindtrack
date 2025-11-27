import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    console.log('Register attempt with:', { name, email, password, role });
    console.log('API URL:', import.meta.env.VITE_API_URL);
    
    try {
      const url = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/auth/register';
      console.log('Making request to:', url);
      
      const res = await axios.post(url, { 
        name, 
        email, 
        password, 
        role 
      });
      
      console.log('Register successful:', res.data);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      console.error('Register error:', err);
      console.error('Response:', err.response);
      console.error('Request URL:', err.config?.url);
      console.error('Request data:', err.config?.data);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <h1>MindTrack</h1>
      <h2>Create Account</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <input 
          type="text" 
          placeholder="Full name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          required 
          disabled={loading}
        />
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
        <select 
          value={role} 
          onChange={(e) => setRole(e.target.value)}
          disabled={loading}
        >
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
          <option value="caregiver">Caregiver</option>
        </select>
        {error && <div className="error">{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>
      <p>Already have an account? <Link to="/login">Sign in here</Link></p>
    </div>
  );
}


