import React, { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../api/client';
import { ConversationSidebar } from '../components/chat/ConversationSidebar';
import { MessageBubble } from '../components/chat/MessageBubble';

export const Chat = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  // Load conversation list on mount
  const loadConversations = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const list = await apiClient.listConversations();
      setConversations(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn('Failed to load conversation history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load specific conversation messages
  const handleSelectConversation = async (conversationId) => {
    if (conversationId === activeConversationId) return;

    setError('');
    setActiveConversationId(conversationId);
    setIsLoadingHistory(true);

    try {
      const conv = await apiClient.getConversation(conversationId);
      // Backend returns conversation with messages: List[MessageRead]
      const rawMessages = Array.isArray(conv.messages) ? conv.messages : [];
      setMessages(rawMessages);
    } catch (err) {
      setError(err.message || 'Failed to load conversation messages.');
      setMessages([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Start a new chat session
  const handleNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setError('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Delete conversation
  const handleDeleteConversation = async (conversationId) => {
    try {
      await apiClient.deleteConversation(conversationId);
      if (activeConversationId === conversationId) {
        handleNewChat();
      }
      await loadConversations();
    } catch (err) {
      setError(`Failed to delete conversation: ${err.message}`);
    }
  };

  // Submit question / message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();

    const query = inputQuery.trim();
    if (!query || isGenerating) return;

    setInputQuery('');
    setError('');

    const optimisticUserMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: query,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticUserMsg]);
    setIsGenerating(true);

    try {
      let targetConvId = activeConversationId;

      // If no active conversation, create one first
      if (!targetConvId) {
        const titleWords = query.split(/\s+/).slice(0, 6).join(' ');
        const initialTitle = titleWords.length > 50 ? `${titleWords.slice(0, 47)}...` : titleWords;
        const newConv = await apiClient.createConversation(initialTitle || 'New Conversation');
        targetConvId = newConv.id;
        setActiveConversationId(targetConvId);
      }

      // Post message to the conversation endpoint (executes RAG + Grounding Verification)
      const res = await apiClient.postMessage(targetConvId, {
        content: query,
        top_k: 5,
        verify: true,
      });

      // res is ConversationMessageResponse: { user_message, assistant_message, generation }
      const assistantMsg = {
        ...res.assistant_message,
        generation: res.generation || {},
        citations: res.generation?.citations || [],
        verification: res.generation?.verification || null,
        has_sufficient_context: res.generation?.has_sufficient_context !== false,
        latency_ms: res.generation?.latency_ms,
        model_name: res.generation?.model_name,
        retrieval_mode: res.generation?.retrieval_mode,
      };

      setMessages((prev) => {
        // Replace temporary user message with server-persisted user message if available
        const updated = prev.filter((m) => m.id !== optimisticUserMsg.id);
        return [
          ...updated,
          res.user_message || optimisticUserMsg,
          assistantMsg,
        ];
      });

      // Refresh conversations list to update title and updated_at order
      await loadConversations();
    } catch (err) {
      setError(err.message || 'Failed to generate answer from knowledge base.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const activeConv = conversations.find((c) => c.id === activeConversationId);

  return (
    <div className="chat-page-container">
      {/* Sidebar */}
      <ConversationSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        isLoading={isLoadingHistory && conversations.length === 0}
      />

      {/* Main Chat Workspace */}
      <div className="chat-main-area">
        {/* Chat Header */}
        <header className="chat-header">
          <div className="chat-header-title-box">
            <h1 className="chat-title">
              {activeConv ? activeConv.title : 'Knowledge Intelligence Chat'}
            </h1>
            <span className="chat-subtitle">
              Grounded Question Answering &bull; Hybrid Retrieval &bull; NLI Grounding Verification
            </span>
          </div>

          <div className="chat-header-badges">
            <span className="code-badge">BGE + BM25 + CrossEncoder</span>
            <span className="status-pill success">● RAG Active</span>
          </div>
        </header>

        {/* Global Error Banner */}
        {error && (
          <div className="auth-alert error chat-error-banner" role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Messages Stream */}
        <div className="chat-messages-scroll">
          {messages.length === 0 && !isGenerating ? (
            <div className="chat-welcome-card">
              <div className="brand-icon-box large">C</div>
              <h2>Ask Clario Knowledge Base</h2>
              <p>
                Ask natural language questions against authorized enterprise documentation.
                Responses are synthesized from retrieved passages and verified for factual grounding.
              </p>
              <div className="prompt-suggestions">
                <span className="suggestions-title">Example questions:</span>
                <button
                  type="button"
                  className="suggestion-pill"
                  onClick={() => setInputQuery('What are the company travel and expense reimbursement guidelines?')}
                >
                  "What are the company travel and expense reimbursement guidelines?"
                </button>
                <button
                  type="button"
                  className="suggestion-pill"
                  onClick={() => setInputQuery('Summarize our information security and access control policies.')}
                >
                  "Summarize our information security and access control policies."
                </button>
              </div>
            </div>
          ) : (
            <div className="messages-list">
              {messages.map((msg, idx) => (
                <MessageBubble key={msg.id || idx} message={msg} />
              ))}

              {/* Generating / Loading indicator */}
              {isGenerating && (
                <div className="message-row assistant-row generating-row">
                  <div className="avatar assistant-avatar">C</div>
                  <div className="message-bubble assistant-bubble generating-bubble">
                    <div className="generating-indicator">
                      <div className="dot"></div>
                      <div className="dot"></div>
                      <div className="dot"></div>
                      <span>Synthesizing answer & verifying sources...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Query Input Box */}
        <div className="chat-input-container">
          <form onSubmit={handleSendMessage} className="chat-input-form">
            <textarea
              ref={inputRef}
              className="chat-textarea"
              placeholder="Ask a question about enterprise documents... (Press Enter to send)"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isGenerating}
              id="chat-input-query"
            />

            <button
              type="submit"
              className="btn-primary btn-send-query"
              disabled={!inputQuery.trim() || isGenerating}
              id="btn-send-query"
              title="Send question to RAG pipeline"
            >
              {isGenerating ? (
                <span className="btn-spinner"></span>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </form>

          <div className="chat-input-caption">
            <span>Answers synthesized from retrieved documents &bull; Strict role-based document access enforced</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;

