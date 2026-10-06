import { test, describe, beforeEach, mock } from 'node:test';
import assert from 'node:assert';

// Mock localStorage for Node test environment
const mockStorage = new Map();
global.localStorage = {
  getItem: (key) => mockStorage.get(key) || null,
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
};

// Import ApiClient
import { apiClient } from '../src/api/client.js';

describe('User Role Authorization, Search, Navigation & Security Suite', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  test('1. Search API request correctly constructs body, mode, and authorization header', async () => {
    let capturedUrl = '';
    let capturedBody = null;
    let capturedHeaders = {};

    global.fetch = mock.fn(async (url, options) => {
      capturedUrl = url;
      capturedBody = JSON.parse(options.body);
      capturedHeaders = options.headers;
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          query: 'annual leave policy',
          mode: 'hybrid',
          total_results: 1,
          reranked: true,
          results: [
            {
              chunk_id: 'c1111111-1111-1111-1111-111111111111',
              document_id: 'd1111111-1111-1111-1111-111111111111',
              score: 2.45,
              content: 'Full-time Clario employees receive 25 days of annual paid leave.',
              page_number: 1,
              filename: 'employee_handbook.pdf',
              document_type: 'pdf',
              department: 'Engineering',
              access_level: 'internal',
            },
          ],
        }),
      };
    });

    apiClient.setToken('user-bearer-token-xyz');
    const res = await apiClient.search({
      query: 'annual leave policy',
      top_k: 5,
      mode: 'hybrid',
      enable_rerank: true,
    });

    assert.strictEqual(res.query, 'annual leave policy');
    assert.strictEqual(res.results.length, 1);
    assert.strictEqual(res.results[0].filename, 'employee_handbook.pdf');
    assert(capturedUrl.endsWith('/api/v1/search'));
    assert.strictEqual(capturedBody.query, 'annual leave policy');
    assert.strictEqual(capturedBody.mode, 'hybrid');
    assert.strictEqual(capturedBody.enable_rerank, true);
    assert.strictEqual(capturedHeaders['Authorization'], 'Bearer user-bearer-token-xyz');
  });

  test('2. GetMe API retrieves authenticated User profile', async () => {
    let capturedUrl = '';
    let capturedHeaders = {};

    global.fetch = mock.fn(async (url, options) => {
      capturedUrl = url;
      capturedHeaders = options.headers;
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          id: 'u9999999-9999-9999-9999-999999999999',
          email: 'user@clario.local',
          name: 'User (Engineering)',
          department: 'Engineering',
          is_active: true,
          roles: [{ id: 'r1', name: 'user' }],
        }),
      };
    });

    apiClient.setToken('user-bearer-token-xyz');
    const profile = await apiClient.getMe();

    assert.strictEqual(profile.email, 'user@clario.local');
    assert.strictEqual(profile.department, 'Engineering');
    assert.strictEqual(profile.roles[0].name, 'user');
    assert(capturedUrl.endsWith('/api/v1/auth/me'));
    assert.strictEqual(capturedHeaders['Authorization'], 'Bearer user-bearer-token-xyz');
  });

  test('3. User logout cleans up localStorage token and session state', () => {
    apiClient.setToken('active-user-session-token');
    assert.strictEqual(apiClient.getToken(), 'active-user-session-token');

    apiClient.clearToken();
    assert.strictEqual(apiClient.getToken(), null);
  });

  test('4. Backend 403 Forbidden handling on unauthorized access attempt', async () => {
    global.fetch = mock.fn(async () => {
      return {
        ok: false,
        status: 403,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ detail: 'Access denied: You do not have permission to access this resource.' }),
      };
    });

    apiClient.setToken('user-bearer-token-xyz');
    await assert.rejects(
      async () => {
        await apiClient.getDocument('unauthorized-doc-uuid');
      },
      (err) => {
        assert.strictEqual(err.status, 403);
        assert(err.message.includes('Access denied'));
        return true;
      }
    );
  });

  test('5. Conversation isolation: retrieving another user conversation returns 403', async () => {
    global.fetch = mock.fn(async () => {
      return {
        ok: false,
        status: 403,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ detail: 'Access denied: Conversation belongs to another user.' }),
      };
    });

    apiClient.setToken('user-a-token');
    await assert.rejects(
      async () => {
        await apiClient.getConversation('conversation-owned-by-user-b');
      },
      (err) => {
        assert.strictEqual(err.status, 403);
        return true;
      }
    );
  });
});

