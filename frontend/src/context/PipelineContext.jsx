import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../api/client';

const PipelineContext = createContext(null);

export const PipelineProvider = ({ children }) => {
  // 1. Background Pipeline Tasks (active document processing and generation jobs)
  // Each task: { id, type: 'document_ingestion' | 'chat_rag', name, targetId, status: 'QUEUED' | 'PROCESSING' | 'READY' | 'FAILED', startedAt, completedAt, error }
  const [tasks, setTasks] = useState([]);
  const [isPipelineDrawerOpen, setIsPipelineDrawerOpen] = useState(false);

  // 2. Persistent Chat State (so navigating to documents/search/users does not reset in-flight generation or messages)
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatError, setChatError] = useState('');
  const [chatRetrievalMode, setChatRetrievalMode] = useState('hybrid');


  // 3. Document Repository Global State & Sync
  const [documents, setDocuments] = useState([]);
  const [isDocsLoading, setIsDocsLoading] = useState(false);
  const [docsPage, setDocsPage] = useState(1);
  const [docsHasMore, setDocsHasMore] = useState(false);
  const [docsFilters, setDocsFilters] = useState({});

  const pollIntervalRef = useRef(null);

  // --- Pipeline Task Helpers ---
  const addTask = useCallback((taskData) => {
    const processId = `PID-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const newTask = {
      processId,
      id: taskData.id || processId,
      type: taskData.type || 'document_ingestion',
      name: taskData.name || 'Background Task',
      targetId: taskData.targetId,
      status: taskData.status || 'PROCESSING',
      startedAt: new Date().toISOString(),
      completedAt: null,
      error: null,
      ...taskData,
    };

    setTasks((prev) => [newTask, ...prev.slice(0, 49)]); // Keep last 50 tasks
    return processId;
  }, []);

  const updateTask = useCallback((processIdOrTargetId, updates) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.processId === processIdOrTargetId || t.targetId === processIdOrTargetId || t.id === processIdOrTargetId) {
          const isDone = updates.status === 'READY' || updates.status === 'FAILED';
          return {
            ...t,
            ...updates,
            completedAt: isDone ? new Date().toISOString() : t.completedAt,
          };
        }
        return t;
      })
    );
  }, []);

  const clearCompletedTasks = useCallback(() => {
    setTasks((prev) => prev.filter((t) => t.status === 'PROCESSING' || t.status === 'QUEUED'));
  }, []);

  // --- Document Loading & Background Synchronization ---
  const loadDocuments = useCallback(
    async (isBackground = false) => {
      if (!isBackground) setIsDocsLoading(true);
      try {
        const skip = (docsPage - 1) * 10;
        const data = await apiClient.getDocuments({
          skip,
          limit: 10,
          department: docsFilters.department,
          status: docsFilters.status,
          access_level: docsFilters.access_level,
        });

        const list = Array.isArray(data) ? data : [];
        setDocuments(list);
        setDocsHasMore(list.length === 10);

        // Synchronize tasks with retrieved document statuses
        list.forEach((doc) => {
          if (doc.status === 'READY' || doc.status === 'FAILED') {
            updateTask(doc.id, { status: doc.status });
          }
        });
      } catch (err) {
        if (!isBackground) {
          console.warn('Failed to load documents:', err);
        }
      } finally {
        if (!isBackground) setIsDocsLoading(false);
      }
    },
    [docsPage, docsFilters, updateTask]
  );

  // Background Polling loop for active tasks
  useEffect(() => {
    const hasActiveTasks =
      tasks.some((t) => t.status === 'PROCESSING' || t.status === 'QUEUED') ||
      documents.some((d) => d.status === 'PROCESSING');

    if (!hasActiveTasks) {
      clearInterval(pollIntervalRef.current);
      return;
    }

    pollIntervalRef.current = setInterval(() => {
      loadDocuments(true);
    }, 2500);

    return () => clearInterval(pollIntervalRef.current);
  }, [tasks, documents, loadDocuments]);

  // --- Actions: Process Single Document ---
  const processDocument = useCallback(
    async (documentId, documentTitle = 'Document') => {
      const pid = addTask({
        type: 'document_ingestion',
        name: `Vector Ingestion: ${documentTitle}`,
        targetId: documentId,
        status: 'PROCESSING',
      });

      // Optimistically update document status in state
      setDocuments((prev) =>
        prev.map((d) => (d.id === documentId ? { ...d, status: 'PROCESSING' } : d))
      );

      try {
        await apiClient.processDocument(documentId);
      } catch (err) {
        updateTask(pid, { status: 'FAILED', error: err.message });
        throw err;
      }
      return pid;
    },
    [addTask, updateTask]
  );

  // --- Actions: Process All Pending Documents ---
  const processAllDocuments = useCallback(
    async () => {
      const pending = documents.filter((d) => d.status === 'UPLOADED' || d.status === 'FAILED');
      const processIds = [];

      try {
        // Try backend batch endpoint first
        const batchResponse = await apiClient.processAllDocuments();
        const queuedDocs = Array.isArray(batchResponse) ? batchResponse : pending;

        queuedDocs.forEach((doc) => {
          const pid = addTask({
            type: 'document_ingestion',
            name: `Vector Ingestion: ${doc.title || doc.filename || 'Document'}`,
            targetId: doc.id,
            status: 'PROCESSING',
          });
          processIds.push(pid);
        });

        // Optimistically update document list in UI
        setDocuments((prev) =>
          prev.map((d) => {
            const isTarget = queuedDocs.some((q) => q.id === d.id);
            return isTarget ? { ...d, status: 'PROCESSING' } : d;
          })
        );
      } catch (err) {
        // Fallback: trigger individually in parallel if batch endpoint had error
        const promises = pending.map((doc) =>
          processDocument(doc.id, doc.title || doc.filename)
            .catch((e) => console.warn(`Failed to process doc ${doc.id}:`, e))
        );
        await Promise.all(promises);
      }

      return processIds;
    },
    [documents, addTask, processDocument]
  );

  // --- Chat Actions ---
  const loadConversations = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const list = await apiClient.listConversations();
      setConversations(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn('Failed to load conversations:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  const selectConversation = useCallback(async (conversationId) => {
    if (!conversationId) return;
    setChatError('');
    setActiveConversationId(conversationId);
    setIsLoadingHistory(true);
    try {
      const conv = await apiClient.getConversation(conversationId);
      setMessages(Array.isArray(conv.messages) ? conv.messages : []);
    } catch (err) {
      setChatError(err.message || 'Failed to load conversation history.');
      setMessages([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  const newChat = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    setChatError('');
  }, []);

  const deleteConversation = useCallback(
    async (conversationId) => {
      try {
        await apiClient.deleteConversation(conversationId);
        if (activeConversationId === conversationId) {
          newChat();
        }
        await loadConversations();
      } catch (err) {
        setChatError(`Failed to delete conversation: ${err.message}`);
      }
    },
    [activeConversationId, newChat, loadConversations]
  );

  const sendMessage = useCallback(
    async (queryText) => {
      const query = (queryText || inputQuery).trim();
      if (!query || isGenerating) return;

      setInputQuery('');
      setChatError('');

      const optimisticUserMsg = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: query,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, optimisticUserMsg]);
      setIsGenerating(true);

      const pid = addTask({
        type: 'chat_rag',
        name: `RAG Inference: "${query.slice(0, 30)}..."`,
        status: 'PROCESSING',
      });

      try {
        let targetConvId = activeConversationId;
        if (!targetConvId) {
          const titleWords = query.split(/\s+/).slice(0, 6).join(' ');
          const initialTitle = titleWords.length > 50 ? `${titleWords.slice(0, 47)}...` : titleWords;
          const newConv = await apiClient.createConversation(initialTitle || 'New Conversation');
          targetConvId = newConv.id;
          setActiveConversationId(targetConvId);
        }

        const res = await apiClient.postMessage(targetConvId, {
          content: query,
          top_k: 5,
          mode: chatRetrievalMode,
          verify: true,
        });

        const assistantMsg = {
          ...res.assistant_message,
          generation: res.generation || {},
          citations: res.generation?.citations || [],
          verification: res.generation?.verification || null,
          has_sufficient_context: res.generation?.has_sufficient_context !== false,
          latency_ms: res.generation?.latency_ms,
          model_name: res.generation?.model_name,
          retrieval_mode: res.generation?.retrieval_mode || chatRetrievalMode,
        };

        setMessages((prev) => {
          const updated = prev.filter((m) => m.id !== optimisticUserMsg.id);
          return [...updated, res.user_message || optimisticUserMsg, assistantMsg];
        });

        updateTask(pid, { status: 'READY' });
        await loadConversations();
      } catch (err) {
        setChatError(err.message || 'Failed to generate answer from knowledge base.');
        updateTask(pid, { status: 'FAILED', error: err.message });
      } finally {
        setIsGenerating(false);
      }
    },
    [inputQuery, isGenerating, activeConversationId, chatRetrievalMode, addTask, updateTask, loadConversations]
  );

  const activeTasksCount = tasks.filter((t) => t.status === 'PROCESSING' || t.status === 'QUEUED').length;

  const value = {
    // Tasks & Pipeline
    tasks,
    activeTasksCount,
    isPipelineDrawerOpen,
    setIsPipelineDrawerOpen,
    addTask,
    updateTask,
    clearCompletedTasks,

    // Document Management & Ingestion
    documents,
    setDocuments,
    isDocsLoading,
    docsPage,
    setDocsPage,
    docsHasMore,
    docsFilters,
    setDocsFilters,
    loadDocuments,
    processDocument,
    processAllDocuments,

    // Persistent Chat Session
    conversations,
    activeConversationId,
    messages,
    inputQuery,
    setInputQuery,
    isLoadingHistory,
    isGenerating,
    chatError,
    setChatError,
    chatRetrievalMode,
    setChatRetrievalMode,
    loadConversations,
    selectConversation,
    newChat,
    deleteConversation,
    sendMessage,
  };


  return <PipelineContext.Provider value={value}>{children}</PipelineContext.Provider>;
};

export const usePipeline = () => {
  const context = useContext(PipelineContext);
  if (!context) {
    throw new Error('usePipeline must be used within a PipelineProvider');
  }
  return context;
};

export default PipelineContext;

