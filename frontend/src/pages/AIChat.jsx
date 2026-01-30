import React, { useState, useEffect, useRef } from 'react';
import { aiService } from '../services/api';
import { Send, User, Bot, Check, X, Zap, Loader2 } from 'lucide-react';
import '../styles/pages/ai-chat.css';

const AIChat = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! I am your AI Business Assistant. I can help you create projects, manage clients, or answer questions about your business. What can I do for you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 50);
    return () => clearTimeout(timer);
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const response = await aiService.chat(userMessage, messages);
      setMessages(prev => [...prev, { role: 'assistant', text: response.data.text }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'assistant', text: 'I encountered an error connecting to my AI core. Please ensure the model is running.' }]);
    } finally {
      setLoading(false);
    }
  };

  const executeAction = async (action, index) => {
    try {
      // Logic mapping "PROPOSE_CREATE_PROJECT" to actual backend "CREATE_PROJECT"
      const actualType = action.type.replace('PROPOSE_', '');
      console.log('Executing AI Action:', actualType, action.data);
      await aiService.execute(actualType, action.data);

      // Update message to show it was executed
      setMessages(prev => {
        const next = [...prev];
        if (next[index]) {
          next[index] = { ...next[index], status: 'executed' };
        }
        return next;
      });

      // Notify other components that data changed
      window.dispatchEvent(new Event('dataUpdated'));

      // Add a success follow-up
      setMessages(prev => [...prev, { role: 'assistant', text: `Success! I've recorded the ${action.data.name || action.type.split('_').pop().toLowerCase()} for you.` }]);
    } catch (error) {
      console.error('Action error:', error);
      setMessages(prev => [...prev, { role: 'assistant', text: `Sorry, I couldn't execute that action: ${error.message}` }]);
    }
  };

  const parseMessage = (msg, index) => {
    const actionRegex = /<action>([\s\S]*?)<\/action>/;
    const match = msg.text.match(actionRegex);

    if (match) {
      const textBefore = msg.text.split('<action>')[0];
      let actionData;

      try {
        // Clean JSON from potential markdown tags
        const jsonStr = match[1]
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
        actionData = JSON.parse(jsonStr);
      } catch (e) {
        console.error('Failed to parse action JSON:', e);
        return <p>{msg.text}</p>;
      }

      return (
        <>
          <p>{textBefore}</p>
          <div className="proposed-action-card">
            <div className="proposed-action-header">
              <Zap size={18} />
              <span>Proposed Action</span>
            </div>
            <h4 className="action-summary">
              {actionData.summary || `Execute ${actionData.type.replace('PROPOSE_', '').replace(/_/g, ' ').toLowerCase()}`}
            </h4>
            <pre className="action-data-preview">
              {JSON.stringify(actionData.data || actionData, null, 2)}
            </pre>

            <div className="action-buttons">
              {msg.status === 'executed' ? (
                <div className="executed-status">
                  <Check size={18} /> Action Executed
                </div>
              ) : (
                <>
                  <button
                    onClick={() => executeAction(actionData, index)}
                    className="btn-confirm-execute"
                  >
                    Confirm & Execute
                  </button>
                  <button className="btn-cancel-action">
                    <X size={18} />
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      );
    }
    return <p>{msg.text}</p>;
  };

  return (
    <div className="ai-chat-container">
      <div className="page-header">
        <div className="ai-header-content">
          <h2 className="ai-header-title">AI Assistant</h2>
          <span className="accuracy-badge">
            It can be inacurate
          </span>
        </div>
      </div>

      <div className="glass-card chat-card">
        {/* Messages Area */}
        <div className="messages-area">
          {messages.map((msg, i) => (
            <div key={i} className={`message-wrapper ${msg.role}`}>
              <div className={`avatar ${msg.role}`}>
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className={`message-bubble ${msg.role}`}>
                {parseMessage(msg, i)}
              </div>
            </div>
          ))}
          {loading && (
            <div className="loading-wrapper">
              <div className="avatar assistant">
                <Bot size={20} />
              </div>
              <div className="loading-bubble">
                <Loader2 size={18} className="spin" />
                <span>Thinking...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="chat-input-area">
          <input
            type="text"
            placeholder="Ask AI to create a project for a client..."
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="btn-send"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};


export default AIChat;
