import React, { useState, useEffect, useRef } from 'react';
import { aiService } from '../services/api';
import { Send, User, Bot, Check, X, Zap, Loader2 } from 'lucide-react';

const AIChat = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! I am your AI Business Assistant. I can help you create projects, manage clients, or answer questions about your business. What can I do for you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      setMessages(prev => [...prev, { role: 'assistant', text: 'I encountered an error connecting to my AI core. Please ensure the model is running via Ollama.' }]);
    } finally {
      setLoading(false);
    }
  };

  const executeAction = async (action, index) => {
    try {
      // Logic mapping "PROPOSE_CREATE_PROJECT" to actual backend "CREATE_PROJECT"
      const actualType = action.type.replace('PROPOSE_', '');
      await aiService.execute(actualType, action.data);
      
      // Update message to show it was executed
      const newMessages = [...messages];
      newMessages[index].status = 'executed';
      setMessages(newMessages);
      
      // Add a success follow-up
      setMessages(prev => [...prev, { role: 'assistant', text: `Success! I've created the ${action.data.name || 'item'} for you.` }]);
    } catch (error) {
      console.error('Action error:', error);
    }
  };

  const parseMessage = (msg, index) => {
    const actionRegex = /<action>([\s\S]*?)<\/action>/;
    const match = msg.text.match(actionRegex);
    
    if (match) {
      const textBefore = msg.text.split('<action>')[0];
      const actionData = JSON.parse(match[1]);

      return (
        <>
          <p>{textBefore}</p>
          <div style={{ 
            marginTop: '1rem', 
            background: '#fff', 
            border: '1px solid #ff7a0033', 
            borderRadius: '1rem', 
            padding: '1.25rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem', color: '#ff7a00' }}>
              <Zap size={18} />
              <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Proposed Action</span>
            </div>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>{actionData.summary}</h4>
            <pre style={{ fontSize: '0.8rem', background: '#f8f8f8', padding: '0.5rem', borderRadius: '0.5rem', overflowX: 'auto' }}>
              {JSON.stringify(actionData.data, null, 2)}
            </pre>
            
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              {msg.status === 'executed' ? (
                <div style={{ color: '#2ecc71', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 'bold' }}>
                  <Check size={18} /> Action Executed
                </div>
              ) : (
                <>
                  <button 
                    onClick={() => executeAction(actionData, index)}
                    style={{ 
                      flex: 1, 
                      padding: '0.6rem', 
                      background: '#ff7a00', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '0.6rem', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      fontWeight: 'bold'
                    }}
                  >
                    Confirm & Execute
                  </button>
                  <button 
                    style={{ 
                      padding: '0.6rem 1rem', 
                      background: '#f0f0f0', 
                      color: '#666', 
                      border: 'none', 
                      borderRadius: '0.6rem', 
                      cursor: 'pointer' 
                    }}
                  >
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
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="page-header">
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.8rem' }}>AI Assistant</h2>
          <span style={{ backgroundColor: '#fff4e5', padding: '0.3rem 0.8rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 'bold', color: '#ff7a00' }}>
            It can be inacurate
          </span>
        </div>
      </div>

      <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        {/* Messages Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ 
              display: 'flex', 
              gap: '1rem', 
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
            }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                background: msg.role === 'user' ? '#ff7a00' : '#333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                flexShrink: 0
              }}>
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div style={{ 
                background: msg.role === 'user' ? '#fff4e5' : '#f8f8f8',
                padding: '1rem',
                borderRadius: msg.role === 'user' ? '1rem 0 1rem 1rem' : '0 1rem 1rem 1rem',
                border: msg.role === 'user' ? '1px solid #ff7a0022' : '1px solid #eee',
                lineHeight: '1.5'
              }}>
                {parseMessage(msg, i)}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: '1rem', alignSelf: 'flex-start' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                 <Bot size={20} />
              </div>
              <div style={{ background: '#f8f8f8', padding: '1rem', borderRadius: '0 1rem 1rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Loader2 size={18} className="spin" />
                <span>Thinking...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} style={{ padding: '1.5rem', borderTop: '1px solid #eee', display: 'flex', gap: '1rem' }}>
          <input 
            type="text" 
            placeholder="Ask AI to create a project for a client..." 
            style={{ 
              flex: 1, 
              padding: '1rem 1.5rem', 
              borderRadius: '2rem', 
              border: '1px solid #ddd', 
              outline: 'none',
              fontSize: '1rem'
            }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={!input.trim() || loading}
            style={{ 
              width: '50px', 
              height: '50px', 
              borderRadius: '50%', 
              background: '#ff7a00', 
              color: 'white', 
              border: 'none', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: !input.trim() || loading ? 0.6 : 1
            }}
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIChat;
