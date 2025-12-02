import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Contacts() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    loadContacts();
  }, [navigate]);

  async function loadContacts() {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      
      // Fetch user's emergency contacts from their profile
      const res = await axios.get(
        (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/auth/me',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Get emergency contacts
      const emergencyContacts = (res.data.emergencyContacts || []).map(contact => ({
        ...contact,
        relationship: contact.relationship || 'Emergency Contact'
      }));
      
      // Also get doctor info if assigned
      const doctorInfo = res.data.doctor ? {
        _id: res.data.doctor._id || res.data.doctor,
        name: res.data.doctor.name || 'Doctor',
        phone: res.data.doctor.phone,
        email: res.data.doctor.email,
        relationship: 'Doctor'
      } : null;
      
      // Combine doctor and emergency contacts
      const allContacts = [];
      if (doctorInfo && (doctorInfo.phone || doctorInfo.email)) {
        allContacts.push(doctorInfo);
      }
      allContacts.push(...emergencyContacts);
      
      setContacts(allContacts);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load emergency contacts');
      console.error('Load contacts error:', e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="card">
          <p>Loading contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="contacts-header">
        <div>
          <h2>Emergency Contacts</h2>
          <p style={{ color: '#666', marginTop: '8px', fontSize: '14px' }}>
            These contacts will be automatically notified via voice call during red alerts. 
            Contact your doctor to manage these contacts.
          </p>
        </div>
      </div>

      {error && (
        <div className="card" style={{ background: '#fee2e2', border: '1px solid #ef4444', marginBottom: '20px' }}>
          <p style={{ color: '#991b1b', margin: 0 }}>{error}</p>
        </div>
      )}

      <div className="contacts-grid">
        {contacts.length === 0 ? (
          <div className="card">
            <p>No emergency contacts configured yet. Your doctor can add emergency contacts for you.</p>
          </div>
        ) : (
          contacts.map((contact, index) => (
            <div key={contact._id || contact.id || index} className="card contact-card">
              <div className="contact-header">
                <div className="contact-avatar">
                  <span className="avatar-icon">👤</span>
                </div>
                <div className="contact-info">
                  <h3>{contact.name}</h3>
                  <span className="relationship-badge">{contact.relationship || 'Emergency Contact'}</span>
                </div>
              </div>
              
              <div className="contact-details">
                {contact.email && (
                  <div className="contact-item">
                    <span className="contact-label">📧</span>
                    <span>{contact.email}</span>
                  </div>
                )}
                {contact.phone && (
                  <div className="contact-item">
                    <span className="contact-label">📞</span>
                    <span>{contact.phone}</span>
                  </div>
                )}
                {!contact.email && !contact.phone && (
                  <div className="contact-item">
                    <span style={{ color: '#666', fontStyle: 'italic' }}>No contact information available</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
