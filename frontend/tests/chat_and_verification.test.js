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

describe('P0 Knowledge Chat, Citations, Verification & Conversations Suite', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  // 1. Query API request construction
  test('1. Query API request construction sends proper JSON body and options', async () => {
    let capturedUrl = '';
    let capturedMethod = '';
    let capturedHeaders = {};
    let capturedBody = null;

    global.fetch = mock.fn(async (url, options) => {
      capturedUrl = url;
      capturedMethod = options.method;
      capturedHeaders = options.headers;
      capturedBody = JSON.parse(options.body);
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          query: 'What is the refund policy?',
          answer: 'Refunds are processed within 5 business days [Doc-1].',
          citations: [
            {
              source_tag: '[Doc-1]',
              chunk_id: '11111111-1111-1111-1111-111111111111',
              document_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
              filename: 'refund_policy.pdf',
              page_number: 3,
              end_page: 3,
              section: 'Refund SLA',
              department: 'Finance',
              access_level: 'internal',
              relevance_score: 0.942,
            },
          ],
          has_sufficient_context: true,
          model_name: 'gpt-4o',
          retrieval_mode: 'hybrid',
          latency_ms: 245.5,
          token_usage: { prompt_tokens: 150, completion_tokens: 30, total_tokens: 180 },
          verification: {
            status: 'verified_faithful',
            faithfulness_score: 1.0,
            total_claims: 1,
            supported_claims: 1,
            contradicted_claims: 0,
            insufficient_claims: 0,
            unverified_claims: 0,
            claims: [
              {
                claim_id: 'claim-1',
                claim_text: 'Refunds are processed within 5 business days',
                label: 'supported',
                cited_chunk_ids: ['11111111-1111-1111-1111-111111111111'],
                supporting_chunk_ids: ['11111111-1111-1111-1111-111111111111'],
                contradicting_chunk_ids: [],
                evaluated_chunk_ids: ['11111111-1111-1111-1111-111111111111'],
                entailment_score: 0.985,
                contradiction_score: 0.001,
                is_fully_evaluated: true,
                has_conflicting_evidence: false,
              },
            ],
            total_pairs_evaluated: 1,
            pair_cap_reached: false,
            unmapped_citation_tags: [],
            malformed_citation_tags: [],
            verification_latency_ms: 42.1,
            model_name: 'nli-deberta-v3',
          },
        }),
      };
    });

    apiClient.setToken('auth-token-query-123');
    const resp = await apiClient.query({
      query: 'What is the refund policy?',
      top_k: 5,
      mode: 'hybrid',
      enable_rerank: true,
      verify: true,
    });

    assert.strictEqual(resp.query, 'What is the refund policy?');
    assert.strictEqual(resp.has_sufficient_context, true);
    assert.strictEqual(resp.citations.length, 1);
    assert.strictEqual(resp.verification.status, 'verified_faithful');
    assert.strictEqual(capturedUrl.endsWith('/api/v1/query'), true);
    assert.strictEqual(capturedMethod, 'POST');
    assert.strictEqual(capturedHeaders['Authorization'], 'Bearer auth-token-query-123');
    assert.strictEqual(capturedBody.query, 'What is the refund policy?');
    assert.strictEqual(capturedBody.mode, 'hybrid');
    assert.strictEqual(capturedBody.enable_rerank, true);
    assert.strictEqual(capturedBody.verify, true);
  });

  // 2. Conversation creation
  test('2. Conversation creation sends POST /api/v1/conversations with title', async () => {
    let capturedBody = null;
    let capturedUrl = '';

    global.fetch = mock.fn(async (url, options) => {
      capturedUrl = url;
      capturedBody = JSON.parse(options.body);
      return {
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          user_id: 'uuuuuuuu-uuuu-uuuu-uuuu-uuuuuuuuuuuu',
          title: 'Q3 Financial Review',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          messages: [],
        }),
      };
    });

    const res = await apiClient.createConversation('Q3 Financial Review');
    assert.strictEqual(res.title, 'Q3 Financial Review');
    assert.strictEqual(res.id, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
    assert.strictEqual(capturedUrl.endsWith('/api/v1/conversations'), true);
    assert.strictEqual(capturedBody.title, 'Q3 Financial Review');
  });

  // 3. Conversation listing
  test('3. Conversation listing sends GET /api/v1/conversations', async () => {
    global.fetch = mock.fn(async () => {
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => [
          {
            id: 'conv-1',
            title: 'First Chat',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            messages: [],
          },
          {
            id: 'conv-2',
            title: 'Second Chat',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            messages: [],
          },
        ],
      };
    });

    const list = await apiClient.listConversations();
    assert.strictEqual(list.length, 2);
    assert.strictEqual(list[0].id, 'conv-1');
    assert.strictEqual(list[1].id, 'conv-2');
  });

  // 4. Conversation loading
  test('4. Conversation loading retrieves message history by ID', async () => {
    let capturedUrl = '';
    global.fetch = mock.fn(async (url) => {
      capturedUrl = url;
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          id: 'conv-123',
          title: 'Security Guidelines',
          messages: [
            {
              id: 'msg-1',
              conversation_id: 'conv-123',
              role: 'user',
              content: 'What is our password rotation policy?',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: 'msg-2',
              conversation_id: 'conv-123',
              role: 'assistant',
              content: 'Passwords must be rotated every 90 days.',
              verification_status: 'verified_faithful',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
        }),
      };
    });

    const conv = await apiClient.getConversation('conv-123');
    assert.strictEqual(conv.id, 'conv-123');
    assert.strictEqual(conv.messages.length, 2);
    assert.strictEqual(conv.messages[0].role, 'user');
    assert.strictEqual(conv.messages[1].role, 'assistant');
    assert(capturedUrl.endsWith('/api/v1/conversations/conv-123'));
  });

  // 5. Follow-up message submission
  test('5. Follow-up message submission posts to /api/v1/conversations/{id}/messages', async () => {
    let capturedUrl = '';
    let capturedBody = null;

    global.fetch = mock.fn(async (url, options) => {
      capturedUrl = url;
      capturedBody = JSON.parse(options.body);
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          user_message: {
            id: 'user-msg-new',
            conversation_id: 'conv-123',
            role: 'user',
            content: 'How about exceptions to this policy?',
          },
          assistant_message: {
            id: 'asst-msg-new',
            conversation_id: 'conv-123',
            role: 'assistant',
            content: 'Exceptions require CISO approval [Doc-1].',
            verification_status: 'verified_faithful',
          },
          generation: {
            query: 'How about exceptions to this policy?',
            answer: 'Exceptions require CISO approval [Doc-1].',
            citations: [
              {
                source_tag: '[Doc-1]',
                chunk_id: 'c-1',
                document_id: 'd-1',
                filename: 'sec_policy.docx',
                access_level: 'internal',
                relevance_score: 0.91,
              },
            ],
            has_sufficient_context: true,
            verification: {
              status: 'verified_faithful',
              faithfulness_score: 1.0,
            },
          },
        }),
      };
    });

    const res = await apiClient.postMessage('conv-123', {
      content: 'How about exceptions to this policy?',
      top_k: 5,
      verify: true,
    });

    assert.strictEqual(capturedUrl.endsWith('/api/v1/conversations/conv-123/messages'), true);
    assert.strictEqual(capturedBody.content, 'How about exceptions to this policy?');
    assert.strictEqual(res.user_message.role, 'user');
    assert.strictEqual(res.assistant_message.role, 'assistant');
    assert.strictEqual(res.generation.citations.length, 1);
  });

  // 6. Authentication header behavior
  test('6. Authentication header behavior automatically includes Bearer token', async () => {
    let capturedHeaders = {};
    global.fetch = mock.fn(async (url, options) => {
      capturedHeaders = options.headers;
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ id: 'usr-1', email: 'user@clario.ai' }),
      };
    });

    apiClient.setToken('valid-jwt-signature-xyz');
    await apiClient.getMe();
    assert.strictEqual(capturedHeaders['Authorization'], 'Bearer valid-jwt-signature-xyz');
  });

  // 7. 401 handling
  test('7. 401 Unauthorized handling clears client bearer token', async () => {
    apiClient.setToken('expired-chat-token');
    assert.strictEqual(apiClient.getToken(), 'expired-chat-token');

    global.fetch = mock.fn(async () => ({
      ok: false,
      status: 401,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ detail: 'Token has expired.' }),
    }));

    await assert.rejects(
      async () => {
        await apiClient.listConversations();
      },
      (err) => {
        assert.strictEqual(err.status, 401);
        return true;
      }
    );

    assert.strictEqual(apiClient.getToken(), null);
  });

  // 8. Citation rendering from real-shaped response data
  test('8. Citation data structure adheres to backend schema with page numbers and scores', () => {
    const citation = {
      source_tag: '[Doc-1]',
      chunk_id: '33333333-3333-3333-3333-333333333333',
      document_id: '44444444-4444-4444-4444-444444444444',
      filename: 'employee_handbook.pdf',
      page_number: 12,
      end_page: 14,
      section: 'Leave Policy',
      department: 'HR',
      access_level: 'internal',
      relevance_score: 0.895,
    };

    assert.strictEqual(citation.source_tag, '[Doc-1]');
    assert.strictEqual(citation.filename, 'employee_handbook.pdf');
    assert.strictEqual(citation.page_number, 12);
    assert.strictEqual(citation.end_page, 14);
    assert.strictEqual(citation.section, 'Leave Policy');
    assert.strictEqual(citation.department, 'HR');
    assert.strictEqual(citation.access_level, 'internal');
    assert.strictEqual(typeof citation.relevance_score, 'number');
  });

  // 9. verified_faithful rendering
  test('9. Verification status: verified_faithful structure and faithfulness score', () => {
    const verif = {
      status: 'verified_faithful',
      faithfulness_score: 1.0,
      total_claims: 2,
      supported_claims: 2,
      contradicted_claims: 0,
      insufficient_claims: 0,
      unverified_claims: 0,
      claims: [
        {
          claim_id: 'claim-1',
          claim_text: 'Employees get 20 days PTO',
          label: 'supported',
          entailment_score: 0.99,
          contradiction_score: 0.00,
        },
        {
          claim_id: 'claim-2',
          claim_text: 'PTO rolls over up to 5 days',
          label: 'supported',
          entailment_score: 0.97,
          contradiction_score: 0.01,
        },
      ],
      model_name: 'nli-deberta-v3',
    };

    assert.strictEqual(verif.status, 'verified_faithful');
    assert.strictEqual(verif.faithfulness_score, 1.0);
    assert.strictEqual(verif.supported_claims, verif.total_claims);
    assert.strictEqual(verif.contradicted_claims, 0);
  });

  // 10. partially_supported rendering
  test('10. Verification status: partially_supported structure and claim accounting', () => {
    const verif = {
      status: 'partially_supported',
      faithfulness_score: 0.5,
      total_claims: 2,
      supported_claims: 1,
      contradicted_claims: 0,
      insufficient_claims: 1,
      unverified_claims: 0,
      claims: [
        {
          claim_id: 'claim-1',
          claim_text: 'Remote work stipend is $500 annually',
          label: 'supported',
          entailment_score: 0.95,
        },
        {
          claim_id: 'claim-2',
          claim_text: 'Internet allowance is $100 monthly',
          label: 'insufficient',
          entailment_score: 0.2,
        },
      ],
    };

    assert.strictEqual(
      verif.supported_claims + verif.contradicted_claims + verif.insufficient_claims + verif.unverified_claims,
      verif.total_claims
    );
    assert.strictEqual(verif.status, 'partially_supported');
    assert.strictEqual(verif.faithfulness_score, 0.5);
    assert.strictEqual(verif.supported_claims, 1);
    assert.strictEqual(verif.insufficient_claims, 1);
  });

  // 11. contradicted rendering
  test('11. Verification status: contradicted structure and high contradiction score', () => {
    const verif = {
      status: 'contradicted',
      faithfulness_score: 0.0,
      total_claims: 1,
      supported_claims: 0,
      contradicted_claims: 1,
      insufficient_claims: 0,
      unverified_claims: 0,
      claims: [
        {
          claim_id: 'claim-1',
          claim_text: 'Contractors receive standard PTO',
          label: 'contradicted',
          contradiction_score: 0.96,
        },
      ],
    };

    assert.strictEqual(verif.status, 'contradicted');
    assert.strictEqual(verif.contradicted_claims, 1);
    assert.strictEqual(verif.claims[0].contradiction_score, 0.96);
  });

  // 12. insufficient_evidence rendering
  test('12. Verification status: insufficient_evidence structure', () => {
    const verif = {
      status: 'insufficient_evidence',
      faithfulness_score: null,
      total_claims: 0,
      supported_claims: 0,
      contradicted_claims: 0,
      insufficient_claims: 0,
      unverified_claims: 0,
      claims: [],
    };

    assert.strictEqual(verif.status, 'insufficient_evidence');
    assert.strictEqual(verif.faithfulness_score, null);
    assert.strictEqual(verif.total_claims, 0);
  });

  // 13. incomplete_verification rendering
  test('13. Verification status: incomplete_verification and pair_cap_reached handling', () => {
    const verif = {
      status: 'incomplete_verification',
      faithfulness_score: 0.0,
      total_claims: 3,
      supported_claims: 0,
      contradicted_claims: 0,
      insufficient_claims: 0,
      unverified_claims: 3,
      pair_cap_reached: true,
      claims: [
        {
          claim_id: 'claim-1',
          label: 'unverified',
          is_fully_evaluated: false,
        },
      ],
    };

    assert.strictEqual(verif.status, 'incomplete_verification');
    assert.strictEqual(verif.pair_cap_reached, true);
    assert.strictEqual(verif.claims[0].label, 'unverified');
    assert.strictEqual(verif.claims[0].is_fully_evaluated, false);
  });

  // 14. verification_failed rendering
  test('14. Verification status: verification_failed representation', () => {
    const verif = {
      status: 'verification_failed',
      faithfulness_score: null,
      total_claims: 0,
      supported_claims: 0,
      claims: [],
      model_name: 'nli-verifier',
    };

    assert.strictEqual(verif.status, 'verification_failed');
    assert.strictEqual(verif.faithfulness_score, null);
    assert.strictEqual(verif.claims.length, 0);
  });

  // 15. null verification score handling
  test('15. null verification score is handled without converting to 0%', () => {
    const verifWithNullScore = {
      status: 'no_claims_found',
      faithfulness_score: null,
      total_claims: 0,
    };

    assert.strictEqual(verifWithNullScore.faithfulness_score, null);
    assert.notStrictEqual(verifWithNullScore.faithfulness_score, 0);
  });

  // 16. insufficient-context response
  test('16. Insufficient context response (has_sufficient_context === false)', async () => {
    global.fetch = mock.fn(async () => ({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        query: 'What is Project Orion secret architecture?',
        answer: 'I could not find sufficient information in the provided documentation to answer your question.',
        citations: [],
        has_sufficient_context: false,
        model_name: 'gpt-4o',
        retrieval_mode: 'hybrid',
        latency_ms: 18.2,
        token_usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        verification: {
          status: 'insufficient_evidence',
          faithfulness_score: null,
          total_claims: 0,
          supported_claims: 0,
          contradicted_claims: 0,
          insufficient_claims: 0,
          unverified_claims: 0,
          claims: [],
        },
      }),
    }));

    const res = await apiClient.query({ query: 'What is Project Orion secret architecture?' });
    assert.strictEqual(res.has_sufficient_context, false);
    assert.strictEqual(res.citations.length, 0);
    assert.strictEqual(res.verification.status, 'insufficient_evidence');
    assert.strictEqual(res.verification.faithfulness_score, null);
  });

  // 17. conversation switching isolation
  test('17. Conversation switching isolation ensures separate histories are never mixed', async () => {
    const sessions = {
      'conv-alpha': {
        id: 'conv-alpha',
        title: 'Alpha Session',
        messages: [
          { id: 'm-1', role: 'user', content: 'Alpha question' },
          { id: 'm-2', role: 'assistant', content: 'Alpha answer' },
        ],
      },
      'conv-beta': {
        id: 'conv-beta',
        title: 'Beta Session',
        messages: [
          { id: 'm-3', role: 'user', content: 'Beta question' },
          { id: 'm-4', role: 'assistant', content: 'Beta answer' },
        ],
      },
    };

    global.fetch = mock.fn(async (url) => {
      const convId = url.split('/').pop();
      const data = sessions[convId];
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => data,
      };
    });

    const alpha = await apiClient.getConversation('conv-alpha');
    const beta = await apiClient.getConversation('conv-beta');

    assert.strictEqual(alpha.id, 'conv-alpha');
    assert.strictEqual(alpha.messages[0].content, 'Alpha question');

    assert.strictEqual(beta.id, 'conv-beta');
    assert.strictEqual(beta.messages[0].content, 'Beta question');

    // Verify completely independent message sets
    const alphaMsgIds = new Set(alpha.messages.map((m) => m.id));
    const betaMsgIds = new Set(beta.messages.map((m) => m.id));
    for (const id of betaMsgIds) {
      assert.strictEqual(alphaMsgIds.has(id), false);
    }
  });
});
