import React from 'react';

export const ConversationSidebar = ({
  conversations = [],
  activeConversationId = null,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  isLoading = false,
}) => {
  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <aside className="chat-conversations-sidebar">
      <div className="sidebar-action-header">
        <button
          type="button"
          className="btn-new-chat"
          onClick={onNewChat}
          id="btn-new-chat"
          title="Start a new knowledge session"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>New Chat</span>
        </button>
      </div>

      <div className="conversations-list-container">
        <div className="conversations-list-title">Conversations</div>

        {isLoading ? (
          <div className="conversations-loading">
            <div className="spinner small"></div>
            <span>Loading history...</span>
          </div>
        ) : conversations.length === 0 ? (
          <div className="conversations-empty">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p>No previous conversations</p>
            <small>Ask a question to start a session</small>
          </div>
        ) : (
          <ul className="conversations-menu">
            {conversations.map((conv) => {
              const isActive = conv.id === activeConversationId;
              const dateStr = formatDate(conv.updated_at || conv.created_at);

              return (
                <li
                  key={conv.id}
                  className={`conversation-item ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectConversation(conv.id)}
                  id={`conv-item-${conv.id}`}
                >
                  <div className="conv-item-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>

                  <div className="conv-item-content">
                    <span className="conv-title" title={conv.title}>
                      {conv.title || 'Conversation'}
                    </span>
                    {dateStr && <span className="conv-date">{dateStr}</span>}
                  </div>

                  {onDeleteConversation && (
                    <button
                      type="button"
                      className="btn-delete-conv"
                      title="Delete conversation"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Delete this conversation history permanently?')) {
                          onDeleteConversation(conv.id);
                        }
                      }}
                      id={`btn-delete-conv-${conv.id}`}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
};

export default ConversationSidebar;

