import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Contacts() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newContact, setNewContact] = useState({ name: '', email: '', phone: '', relationship: '' });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    loadContacts();
  }, [navigate]);

  function loadContacts() {
    // For now, using mock data. In a real app, this would fetch from API
    const mockContacts = [
      { id: 1, name: 'Dr. Sarah Johnson', email: 'sarah.johnson@clinic.com', phone: '+1-555-0123', relationship: 'Doctor' },
      { id: 2, name: 'Mom', email: 'mom@family.com', phone: '+1-555-0124', relationship: 'Family' },
      { id: 3, name: 'Best Friend', email: 'friend@email.com', phone: '+1-555-0125', relationship: 'Friend' },
    ];
    
    setContacts(mockContacts);
    setLoading(false);
  }

  function handleAddContact(e) {
    e.preventDefault();
    if (!newContact.name || !newContact.email) return;

    const contact = {
      id: Date.now(),
      ...newContact
    };

    setContacts([...contacts, contact]);
    setNewContact({ name: '', email: '', phone: '', relationship: '' });
    setShowAddForm(false);
  }

  function handleDeleteContact(id) {
    setContacts(contacts.filter(contact => contact.id !== id));
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
        <h2>My Contacts</h2>
        <button 
          className="add-contact-btn"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : '+ Add Contact'}
        </button>
      </div>

      {showAddForm && (
        <div className="card">
          <h3>Add New Contact</h3>
          <form onSubmit={handleAddContact} className="contact-form">
            <input
              type="text"
              placeholder="Name"
              value={newContact.name}
              onChange={(e) => setNewContact({...newContact, name: e.target.value})}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={newContact.email}
              onChange={(e) => setNewContact({...newContact, email: e.target.value})}
              required
            />
            <input
              type="tel"
              placeholder="Phone (optional)"
              value={newContact.phone}
              onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
            />
            <select
              value={newContact.relationship}
              onChange={(e) => setNewContact({...newContact, relationship: e.target.value})}
            >
              <option value="">Select Relationship</option>
              <option value="Doctor">Doctor</option>
              <option value="Family">Family</option>
              <option value="Friend">Friend</option>
              <option value="Caregiver">Caregiver</option>
              <option value="Other">Other</option>
            </select>
            <div className="form-actions">
              <button type="submit">Add Contact</button>
              <button type="button" onClick={() => setShowAddForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="contacts-grid">
        {contacts.length === 0 ? (
          <div className="card">
            <p>No contacts yet. Add your first contact!</p>
          </div>
        ) : (
          contacts.map(contact => (
            <div key={contact.id} className="card contact-card">
              <div className="contact-header">
                <div className="contact-avatar">
                  <span className="avatar-icon">👤</span>
                </div>
                <div className="contact-info">
                  <h3>{contact.name}</h3>
                  <span className="relationship-badge">{contact.relationship}</span>
                </div>
                <button 
                  className="delete-btn"
                  onClick={() => handleDeleteContact(contact.id)}
                >
                  🗑️
                </button>
              </div>
              
              <div className="contact-details">
                <div className="contact-item">
                  <span className="contact-label">📧</span>
                  <span>{contact.email}</span>
                </div>
                {contact.phone && (
                  <div className="contact-item">
                    <span className="contact-label">📞</span>
                    <span>{contact.phone}</span>
                  </div>
                )}
              </div>
              
              <div className="contact-actions">
                <button className="action-btn">📧 Email</button>
                {contact.phone && <button className="action-btn">📞 Call</button>}
                <button className="action-btn">💬 Message</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
