import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function EmergencyContactsManager({ patientId, onClose }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', relationship: '' });

  useEffect(() => {
    loadContacts();
  }, [patientId]);

  async function loadContacts() {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        (import.meta.env.VITE_API_URL || 'http://localhost:5000') + `/api/doctor/patients/${patientId}/emergency-contacts`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setContacts(res.data.emergencyContacts || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load emergency contacts');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const token = localStorage.getItem('token');
      const url = editingContact
        ? `/api/doctor/patients/${patientId}/emergency-contacts/${editingContact._id}`
        : `/api/doctor/patients/${patientId}/emergency-contacts`;
      
      const method = editingContact ? 'put' : 'post';
      const res = await axios[method](
        (import.meta.env.VITE_API_URL || 'http://localhost:5000') + url,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setContacts(res.data.emergencyContacts);
      setFormData({ name: '', phone: '', email: '', relationship: '' });
      setShowAddForm(false);
      setEditingContact(null);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save emergency contact');
    }
  }

  async function handleDelete(contactId) {
    if (!window.confirm('Are you sure you want to delete this emergency contact?')) {
      return;
    }
    
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(
        (import.meta.env.VITE_API_URL || 'http://localhost:5000') + `/api/doctor/patients/${patientId}/emergency-contacts/${contactId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setContacts(res.data.emergencyContacts);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to delete emergency contact');
    }
  }

  function handleEdit(contact) {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      phone: contact.phone,
      email: contact.email || '',
      relationship: contact.relationship || ''
    });
    setShowAddForm(true);
  }

  function handleCancel() {
    setFormData({ name: '', phone: '', email: '', relationship: '' });
    setShowAddForm(false);
    setEditingContact(null);
  }

  if (loading) {
    return (
      <div className="card">
        <p>Loading emergency contacts...</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ marginTop: 0 }}>Manage Emergency Contacts</h2>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '24px' }}>
          ✕
        </button>
      </div>

      {error && (
        <div className="error" style={{ marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {!showAddForm ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <p style={{ margin: 0 }}>Emergency contacts will be automatically notified via email and voice call during red alerts.</p>
            <button
              onClick={() => setShowAddForm(true)}
              style={{
                background: '#75B1BE',
                color: '#000',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              + Add Contact
            </button>
          </div>

          {contacts.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
              <p>No emergency contacts yet. Add one to get started.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {contacts.map((contact) => (
                <div
                  key={contact._id}
                  style={{
                    padding: '16px',
                    border: '1px solid #ddd',
                    borderRadius: 6,
                    background: '#f8fafc',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>{contact.name}</h3>
                    <div style={{ display: 'flex', gap: '16px', color: '#666', fontSize: '14px', flexWrap: 'wrap' }}>
                      <span>📞 {contact.phone}</span>
                      {contact.email && <span>📧 {contact.email}</span>}
                      {contact.relationship && <span>👤 {contact.relationship}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleEdit(contact)}
                      style={{
                        background: '#75B1BE',
                        color: '#000',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: 4,
                        cursor: 'pointer'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(contact._id)}
                      style={{
                        background: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: 4,
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <h3 style={{ marginTop: 0 }}>{editingContact ? 'Edit Contact' : 'Add New Contact'}</h3>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: 6 }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Phone Number *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              placeholder="+1234567890"
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: 6 }}
            />
            <small style={{ display: 'block', color: '#666', marginTop: '4px' }}>
              Include country code (e.g., +1 for US)
            </small>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="contact@example.com"
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: 6 }}
            />
            <small style={{ display: 'block', color: '#666', marginTop: '4px' }}>
              Emergency contact email (will receive red alert notifications)
            </small>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Relationship</label>
            <input
              type="text"
              value={formData.relationship}
              onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
              placeholder="e.g., Spouse, Parent, Friend"
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: 6 }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="submit"
              style={{
                background: '#75B1BE',
                color: '#000',
                border: 'none',
                padding: '10px 20px',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              {editingContact ? 'Update' : 'Add'} Contact
            </button>
            <button
              type="button"
              onClick={handleCancel}
              style={{
                background: '#e5e7eb',
                color: '#000',
                border: 'none',
                padding: '10px 20px',
                borderRadius: 6,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}







