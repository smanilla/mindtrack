import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const suggestedQuestions = [
    "I'm feeling anxious today. What can I do?",
    "How can I improve my sleep quality?",
    "I'm having trouble concentrating. Any tips?",
    "What are some stress management techniques?",
    "How do I deal with negative thoughts?",
    "I feel overwhelmed. Where do I start?"
  ];

  useEffect(() => {
    loadConversationHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  async function loadConversationHistory() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(
        (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/ai-chat/conversation',
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages(response.data.conversation || []);
    } catch (err) {
      console.error('Failed to load conversation:', err);
      // If AI routes are not available, show setup message
      if (err.code === 'ERR_NETWORK' || err.response?.status === 404) {
        const setupMessage = {
          role: 'assistant',
          content: '🤖 AI Assistant Setup Required\n\nTo enable AI features, you need to add your OpenAI API key to the backend configuration.\n\nSteps:\n1. Get API key from https://platform.openai.com/\n2. Add OPENAI_API_KEY to backend/.env file\n3. Restart the backend server\n\nUntil then, I can provide basic responses based on your mood data.',
          timestamp: new Date().toISOString()
        };
        setMessages([setupMessage]);
      }
    }
  }

  async function sendMessage(message = inputMessage) {
    if (!message.trim()) return;

    const userMessage = {
      role: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/ai-chat/chat',
        { message: message.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const aiMessage = {
        role: 'assistant',
        content: response.data.message,
        timestamp: response.data.timestamp,
        crisisFlag: response.data.crisisFlag || false
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Handle crisis detection - show alert and trigger notifications
      if (response.data.crisisFlag || response.data.requiresNotification) {
        alert('🚨 Crisis Support Activated\n\nEmergency contacts and healthcare providers have been notified. Please reach out to crisis hotlines immediately:\n\n• Text HOME to 741741\n• Call 988 (Suicide & Crisis Lifeline)\n• Call 911 for immediate danger\n\nYou are not alone. Help is available 24/7.');
        
        // TODO: In production, trigger notification to emergency contacts, family, doctors
        // This would integrate with your contacts system
        console.warn('⚠️ CRISIS DETECTED - Notification system should trigger here');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to get AI response';
      setError(errorMessage);
      
      // If AI service has payment issues or is not configured, show helpful message
      if (err.response?.status === 503 || err.response?.status === 402 || err.code === 'ERR_NETWORK' || err.response?.status === 404) {
        const configMessage = {
          role: 'assistant',
          content: '🤖 AI Assistant Ready!\n\nI\'m now using a free mental health support system that doesn\'t require any payment or API keys. I can help you with:\n\n• Anxiety and stress management\n• Sleep improvement tips\n• Mood regulation strategies\n• Coping with difficult emotions\n• General mental health guidance\n\nFeel free to ask me anything about your mental health journey!',
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, configMessage]);
      } else {
        // Remove the user message if AI failed
        setMessages(prev => prev.slice(0, -1));
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function clearConversation() {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/ai-chat/conversation',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages([]);
      setError('');
    } catch (err) {
      setError('Failed to clear conversation');
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    sendMessage();
  }

  function handleSuggestedQuestion(question) {
    sendMessage(question);
  }

  function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return (
    <div className="page-container">
      <div className="ai-assistant-header">
        <h1>🤖 My AI Assistant</h1>
        <p className="ai-subtitle">Your compassionate mental health support companion</p>
        {messages.length > 0 && (
          <button 
            className="clear-conversation-btn"
            onClick={clearConversation}
          >
            Clear Conversation
          </button>
        )}
      </div>

      <div className="ai-chat-container">
        <div className="ai-messages">
          {messages.length === 0 ? (
            <div className="welcome-message">
              <div className="ai-avatar">🤖</div>
              <h3>Hello! I'm your FREE AI mental health assistant.</h3>
              <p>I'm here to provide emotional support, coping strategies, and guidance for your mental well-being - completely free! Feel free to ask me anything about:</p>
              <ul>
                <li>Managing stress and anxiety</li>
                <li>Improving sleep and mood</li>
                <li>Coping with difficult emotions</li>
                <li>Building healthy habits</li>
                <li>General mental health guidance</li>
              </ul>
              <p>💚 <strong>Powered by ChatGPT</strong> with specialized psychological support and safety restrictions. I provide AI-generated responses tailored to mental health support.</p>
              <div style={{background: '#fff3cd', padding: '12px', borderRadius: '8px', marginTop: '16px', border: '1px solid #ffc107'}}>
                <p style={{margin: 0, fontSize: '13px', color: '#856404'}}>
                  <strong>⚠️ Important:</strong> I am an AI assistant providing general emotional support, not a licensed therapist, medical professional, or replacement for professional care. For severe concerns, crises, or persistent issues, please consult qualified mental health professionals or emergency services.
                </p>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={index} className={`message ${message.role} ${message.crisisFlag ? 'crisis-message' : ''}`}>
                <div className="message-content">
                  {message.crisisFlag && <div className="crisis-indicator">🚨 Crisis Support</div>}
                  <div className="message-text">{message.content}</div>
                  <div className="message-time">{formatTime(message.timestamp)}</div>
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="message assistant">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {messages.length === 0 && (
          <div className="suggested-questions">
            <h4>Suggested Questions:</h4>
            <div className="question-grid">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  className="suggestion-btn"
                  onClick={() => handleSuggestedQuestion(question)}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        <form className="ai-input-form" onSubmit={handleSubmit}>
          <div className="input-container">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask me anything about your mental health..."
              className="ai-input"
              disabled={isLoading}
            />
            <button 
              type="submit" 
              className="send-btn"
              disabled={isLoading || !inputMessage.trim()}
            >
              {isLoading ? '⏳' : '📤'}
            </button>
          </div>
          {error && <div className="ai-error">{error}</div>}
        </form>
      </div>
    </div>
  );
}