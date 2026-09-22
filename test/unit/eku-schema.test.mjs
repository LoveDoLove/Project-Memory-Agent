/**
 * Engineering Memory Agent (EMA) — Phase 1 Unit Tests
 * Test Suite: Core EKU Domain Model & Schema v2
 *
 * Verifies:
 * - Domain construction, parsing, serialization, and round-trip stability.
 * - Independence of the four orthogonal dimensions (Lifecycle, Validation, Authority, Confidence).
 * - All 12 approved relationship types and rejection of invalid types.
 * - Knowledge Scope validation (project, workspace, global) and rejection of legacy scopes.
 * - Invariant enforcement (Candidate + canonical Current, Superseded without superseded_by, etc.).
 * - Backward compatibility parsing without manufacturing 'verified' certainty.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  LIFECYCLE_STATES,
  VALIDATION_STATES,
  AUTHORITY_LEVELS,
  CONFIDENCE_LEVELS,
  KNOWLEDGE_SCOPES,
  ISOLATION_MODES,
  KNOWLEDGE_TYPES,
  RELATIONSHIP_TYPES,
  VALID_RELATIONSHIP_TYPES,
  REJECTED_LEGACY_SCOPES,
} from '../../src/core/constants.mjs';

import {
  parseFrontmatter,
  serializeFrontmatter,
  validateEKU,
} from '../../src/core/schema.mjs';

import {
  EKU,
  createEKU,
  parseEKU,
  serializeEKU,
} from '../../src/core/eku.mjs';

// ── 1. Domain Construction & Factory ─────────────────────────────────────────

test('Domain Construction: creates an EKU with defaults', () => {
  const eku = createEKU({
    title: 'Authentication Overview',
    type: KNOWLEDGE_TYPES.ARCHITECTURE,
    created: '2026-09-22',
    last_verified: '2026-09-22',
    content: '# Content\n\nSystem architecture details.',
  });

  assert.strictEqual(eku.title, 'Authentication Overview');
  assert.strictEqual(eku.type, 'architecture');
  assert.strictEqual(eku.status, LIFECYCLE_STATES.CURRENT);
  assert.strictEqual(eku.validation_state, VALIDATION_STATES.UNREVIEWED);
  assert.strictEqual(eku.authority_level, AUTHORITY_LEVELS.CANONICAL);
  assert.strictEqual(eku.confidence, CONFIDENCE_LEVELS.MEDIUM);
  assert.strictEqual(eku.scope, KNOWLEDGE_SCOPES.PROJECT);
  assert.strictEqual(eku.isolation, ISOLATION_MODES.SOFT);
  assert.strictEqual(eku.content, '# Content\n\nSystem architecture details.');
  assert.strictEqual(eku.isCanonical(), true);
  assert.strictEqual(eku.isCurrent(), true);
});

// ── 2. Parsing, Serialization & Round-Trip Stability ─────────────────────────

test('Round-Trip: preserves all EKU fields and markdown body accurately', () => {
  const sampleMarkdown = `---
title: JWT Authentication Architecture
type: architecture
status: current
validation_state: verified
authority_level: canonical
confidence: high
scope: project
scope_id: "project:github.com/org/repo"
isolation: soft
created: "2026-09-22"
last_verified: "2026-09-22"
tags: [auth, jwt, security]
---

# JWT Authentication Architecture

Detailed engineering content explaining JWT verification.`;

  const parsed = parseEKU(sampleMarkdown);
  assert.strictEqual(parsed.valid, true, `Validation errors: ${parsed.errors.join(', ')}`);
  assert.strictEqual(parsed.eku.title, 'JWT Authentication Architecture');
  assert.strictEqual(parsed.eku.status, 'current');
  assert.strictEqual(parsed.eku.validation_state, 'verified');
  assert.strictEqual(parsed.eku.authority_level, 'canonical');
  assert.strictEqual(parsed.eku.confidence, 'high');
  assert.deepStrictEqual(parsed.eku.tags, ['auth', 'jwt', 'security']);

  // Serialize and parse again
  const serialized = serializeEKU(parsed.eku);
  const roundTrip = parseEKU(serialized);

  assert.strictEqual(roundTrip.valid, true);
  assert.strictEqual(roundTrip.eku.title, parsed.eku.title);
  assert.strictEqual(roundTrip.eku.status, parsed.eku.status);
  assert.strictEqual(roundTrip.eku.validation_state, parsed.eku.validation_state);
  assert.strictEqual(roundTrip.eku.authority_level, parsed.eku.authority_level);
  assert.strictEqual(roundTrip.eku.confidence, parsed.eku.confidence);
  assert.strictEqual(roundTrip.eku.content.trim(), parsed.eku.content.trim());
});

// ── 3. Four Orthogonal Dimensions Independence ───────────────────────────────

test('Four Dimensions: operates independently without conflation', () => {
  // Test case A: Draft + Verified (e.g. a draft document whose verified facts were pre-checked)
  const ekuA = createEKU({
    title: 'Verified Draft',
    type: KNOWLEDGE_TYPES.DECISION,
    status: LIFECYCLE_STATES.DRAFT,
    validation_state: VALIDATION_STATES.VERIFIED,
    authority_level: AUTHORITY_LEVELS.CANONICAL,
    confidence: CONFIDENCE_LEVELS.HIGH,
    created: '2026-09-22',
    last_verified: '2026-09-22',
  });
  assert.strictEqual(ekuA.isDraft(), true);
  assert.strictEqual(ekuA.isVerified(), true);
  assert.strictEqual(ekuA.isCurrent(), false);

  // Test case B: Deprecated + Verified (deprecated implementation that is still verified to exist)
  const ekuB = createEKU({
    title: 'Deprecated Protocol',
    type: KNOWLEDGE_TYPES.FACT,
    status: LIFECYCLE_STATES.DEPRECATED,
    validation_state: VALIDATION_STATES.VERIFIED,
    authority_level: AUTHORITY_LEVELS.CANONICAL,
    confidence: CONFIDENCE_LEVELS.HIGH,
    created: '2026-09-22',
    last_verified: '2026-09-22',
  });
  assert.strictEqual(ekuB.isDeprecated(), true);
  assert.strictEqual(ekuB.isVerified(), true);

  // Test case C: Canonical + Low Confidence (primary source, but backed by weak/indirect evidence)
  const ekuC = createEKU({
    title: 'Unconfirmed Architecture Constraint',
    type: KNOWLEDGE_TYPES.CONSTRAINT,
    status: LIFECYCLE_STATES.CURRENT,
    validation_state: VALIDATION_STATES.UNREVIEWED,
    authority_level: AUTHORITY_LEVELS.CANONICAL,
    confidence: CONFIDENCE_LEVELS.LOW,
    created: '2026-09-22',
    last_verified: '2026-09-22',
  });
  assert.strictEqual(ekuC.isCanonical(), true);
  assert.strictEqual(ekuC.confidence, 'low');
  assert.strictEqual(ekuC.isVerified(), false);
});

// ── 4. Deterministic Validation Invariants ───────────────────────────────────

test('Validation: rejects Candidate + canonical Current in canonical storage', () => {
  const invalidCandidate = {
    title: 'Candidate claiming to be current',
    type: 'solution',
    status: 'current',
    validation_state: 'unreviewed',
    authority_level: 'candidate',
    confidence: 'medium',
    scope: 'project',
    created: '2026-09-22',
    last_verified: '2026-09-22',
  };

  const res = validateEKU(invalidCandidate, { storageMode: 'canonical' });
  assert.strictEqual(res.valid, false);
  assert.match(res.errors[0], /Authority Level 'candidate' cannot have Lifecycle State 'current'/);
});

test('Validation: rejects Superseded without superseded_by', () => {
  const invalidSuperseded = {
    title: 'Old Auth Model',
    type: 'architecture',
    status: 'superseded',
    validation_state: 'verified',
    authority_level: 'canonical',
    confidence: 'high',
    scope: 'project',
    created: '2026-09-22',
    last_verified: '2026-09-22',
    // Missing superseded_by!
  };

  const res = validateEKU(invalidSuperseded);
  assert.strictEqual(res.valid, false);
  assert.match(res.errors[0], /Supersession invariant violation/);
});

test('Validation: accepts Superseded with valid superseded_by', () => {
  const validSuperseded = {
    title: 'Old Auth Model',
    type: 'architecture',
    status: 'superseded',
    superseded_by: 'docs/architecture/new-auth.md',
    validation_state: 'verified',
    authority_level: 'canonical',
    confidence: 'high',
    scope: 'project',
    created: '2026-09-22',
    last_verified: '2026-09-22',
  };

  const res = validateEKU(validSuperseded);
  assert.strictEqual(res.valid, true, `Unexpected errors: ${res.errors.join(', ')}`);
});

// ── 5. Knowledge Scope Validation & Rejection of Legacy Values ───────────────

test('Scope Validation: accepts project, workspace, global', () => {
  for (const s of ['project', 'workspace', 'global']) {
    const eku = {
      title: `${s} scoped knowledge`,
      type: 'lesson',
      status: 'current',
      validation_state: 'verified',
      authority_level: 'canonical',
      confidence: 'high',
      scope: s,
      created: '2026-09-22',
      last_verified: '2026-09-22',
    };
    const res = validateEKU(eku, { skipGlobalSourceCheck: true });
    assert.strictEqual(res.valid, true, `Scope ${s} should be valid`);
  }
});

test('Scope Validation: rejects legacy intra-repo scopes (domain, component, subsystem)', () => {
  for (const legacy of REJECTED_LEGACY_SCOPES) {
    const eku = {
      title: 'Legacy scoped doc',
      type: 'fact',
      status: 'current',
      validation_state: 'unreviewed',
      authority_level: 'canonical',
      confidence: 'medium',
      scope: legacy,
      created: '2026-09-22',
      last_verified: '2026-09-22',
    };
    const res = validateEKU(eku);
    assert.strictEqual(res.valid, false);
    assert.match(res.errors[0], new RegExp(`Legacy scope '${legacy}' is rejected`));
  }
});

// ── 6. Global Promotion Precondition ─────────────────────────────────────────

test('Global Scope: requires min_sources_checked >= 2 in promoted_from', () => {
  const globalWithoutSources = {
    title: 'Global Principle',
    type: 'lesson',
    status: 'current',
    validation_state: 'verified',
    authority_level: 'canonical',
    confidence: 'high',
    scope: 'global',
    created: '2026-09-22',
    last_verified: '2026-09-22',
  };

  const res1 = validateEKU(globalWithoutSources);
  assert.strictEqual(res1.valid, false);
  assert.match(res1.errors[0], /requires at least 2 independent project evidence sources/);

  const globalWithSources = {
    ...globalWithoutSources,
    promoted_from: {
      origin_scope: 'project:repo-a',
      min_sources_checked: 2,
      rationale: 'Verified across repo-a and repo-b',
    },
  };

  const res2 = validateEKU(globalWithSources);
  assert.strictEqual(res2.valid, true, `Unexpected errors: ${res2.errors.join(', ')}`);
});

// ── 7. Relationship Compatibility (12 Types) ─────────────────────────────────

test('Relationships: accepts all 12 approved relationship types', () => {
  for (const relType of VALID_RELATIONSHIP_TYPES) {
    const eku = {
      title: `Doc testing ${relType}`,
      type: 'solution',
      status: 'current',
      validation_state: 'unreviewed',
      authority_level: 'canonical',
      confidence: 'medium',
      scope: 'project',
      created: '2026-09-22',
      last_verified: '2026-09-22',
      related: [
        {
          type: relType,
          target: 'docs/target.md',
        },
      ],
    };
    const res = validateEKU(eku);
    assert.strictEqual(res.valid, true, `Relationship type ${relType} should be valid`);
  }
});

test('Relationships: accepts legacy plain string paths in related', () => {
  const eku = {
    title: 'Doc with plain strings',
    type: 'workflow',
    status: 'current',
    validation_state: 'unreviewed',
    authority_level: 'canonical',
    confidence: 'medium',
    scope: 'project',
    created: '2026-09-22',
    last_verified: '2026-09-22',
    related: [
      'docs/architecture/overview.md',
      'docs/solutions/fix.md',
    ],
  };
  const res = validateEKU(eku);
  assert.strictEqual(res.valid, true);
});

test('Relationships: rejects invalid relationship types', () => {
  const eku = {
    title: 'Doc with bogus relationship',
    type: 'fact',
    status: 'current',
    validation_state: 'unreviewed',
    authority_level: 'canonical',
    confidence: 'medium',
    scope: 'project',
    created: '2026-09-22',
    last_verified: '2026-09-22',
    related: [
      {
        type: 'unapproved_type',
        target: 'docs/target.md',
      },
    ],
  };
  const res = validateEKU(eku);
  assert.strictEqual(res.valid, false);
  assert.match(res.errors[0], /Invalid relationship type 'unapproved_type'/);
});

// ── 8. Backward Compatibility & No Manufactured Certainty ────────────────────

test('Backward Compatibility: derives safe defaults for legacy frontmatter without manufacturing Verified', () => {
  const legacyMarkdown = `---
title: Legacy Fix Pattern
type: solution
status: current
confidence: medium
created: "2026-08-01"
last_verified: "2026-08-01"
---

# Legacy Fix Pattern

Legacy documentation body without 4-D dimensions.`;

  const parsed = parseEKU(legacyMarkdown);
  assert.strictEqual(parsed.valid, true);
  // CRITICAL INVARIANT: NEVER manufacture 'verified' from legacy status: current
  assert.strictEqual(parsed.eku.validation_state, VALIDATION_STATES.UNREVIEWED);
  assert.strictEqual(parsed.eku.authority_level, AUTHORITY_LEVELS.CANONICAL);
  assert.strictEqual(parsed.eku.scope, KNOWLEDGE_SCOPES.PROJECT);
});

test('Backward Compatibility: maps legacy status values to 4-D model safely', () => {
  const testCases = [
    { input: 'in_progress', expectedStatus: 'draft', expectedVal: 'needs_review' },
    { input: 'partial', expectedStatus: 'current', expectedVal: 'needs_review' },
    { input: 'experimental', expectedStatus: 'draft', expectedVal: 'unreviewed' },
    { input: 'unknown', expectedStatus: 'draft', expectedVal: 'unreviewed' },
  ];

  for (const tc of testCases) {
    const md = `---
title: Doc with legacy status ${tc.input}
type: fact
status: ${tc.input}
confidence: low
created: "2026-09-22"
last_verified: "2026-09-22"
---

Body content.`;

    const parsed = parseEKU(md);
    assert.strictEqual(parsed.valid, true, `Failed on ${tc.input}: ${parsed.errors.join(', ')}`);
    assert.strictEqual(parsed.eku.status, tc.expectedStatus);
    assert.strictEqual(parsed.eku.validation_state, tc.expectedVal);
    assert.strictEqual(parsed.warnings.length > 0, true);
  }
});

// ── 9. Candidate Queue Storage Mode ──────────────────────────────────────────

test('Storage Mode: candidate authority allowed when storageMode is candidate_queue', () => {
  const candidateInQueue = {
    title: 'Extracted Candidate',
    type: 'solution',
    status: 'draft',
    validation_state: 'unreviewed',
    authority_level: 'candidate',
    confidence: 'medium',
    scope: 'project',
    created: '2026-09-22',
    last_verified: '2026-09-22',
  };

  const res = validateEKU(candidateInQueue, { storageMode: 'candidate_queue' });
  assert.strictEqual(res.valid, true, `Unexpected errors: ${res.errors.join(', ')}`);
});

// ── 10. Enums & Date Validation ──────────────────────────────────────────────

test('Validation: rejects invalid confidence value (e.g. unknown or invalid string)', () => {
  const eku = {
    title: 'Doc with invalid confidence',
    type: 'fact',
    status: 'current',
    validation_state: 'unreviewed',
    authority_level: 'canonical',
    confidence: 'super_high',
    scope: 'project',
    created: '2026-09-22',
    last_verified: '2026-09-22',
  };
  const res = validateEKU(eku);
  assert.strictEqual(res.valid, false);
  assert.match(res.errors[0], /Invalid confidence level 'super_high'/);
});

test('Validation: rejects invalid isolation mode', () => {
  const eku = {
    title: 'Doc with invalid isolation',
    type: 'architecture',
    status: 'current',
    validation_state: 'verified',
    authority_level: 'canonical',
    confidence: 'high',
    scope: 'project',
    isolation: 'ultra_secure',
    created: '2026-09-22',
    last_verified: '2026-09-22',
  };
  const res = validateEKU(eku);
  assert.strictEqual(res.valid, false);
  assert.match(res.errors[0], /Invalid isolation mode 'ultra_secure'/);
});

test('Validation: rejects malformed created or last_verified dates', () => {
  const ekuBadCreated = {
    title: 'Bad Date Doc',
    type: 'lesson',
    status: 'current',
    validation_state: 'verified',
    authority_level: 'canonical',
    confidence: 'high',
    scope: 'project',
    created: 'yesterday',
    last_verified: '2026-09-22',
  };
  const res1 = validateEKU(ekuBadCreated);
  assert.strictEqual(res1.valid, false);
  assert.match(res1.errors[0], /Missing or malformed required date field: 'created'/);

  const ekuBadVerified = {
    ...ekuBadCreated,
    created: '2026-09-22',
    last_verified: 'not-a-date',
  };
  const res2 = validateEKU(ekuBadVerified);
  assert.strictEqual(res2.valid, false);
  assert.match(res2.errors[0], /Missing or malformed required date field: 'last_verified'/);
});

// ── 11. Complex Frontmatter & Promoted Provenance ─────────────────────────────

test('Frontmatter: parses complex promoted_from and evidence arrays cleanly', () => {
  const complexDoc = `---
title: "Cross-Service JWT Pattern"
type: solution
status: current
validation_state: verified
authority_level: canonical
confidence: high
scope: workspace
isolation: soft
created: "2026-09-22"
last_verified: "2026-09-22"
evidence:
  - anchor: "ema://evidence/github.com/org/repo/9f8a2c1b/src/jwt.ts#sym:verify"
    type: source
promoted_from:
  origin_scope: "project:github.com/org/sub-repo"
  origin_id: "docs/solutions/jwt.md"
  validated_by: "agent:project-memory"
  promoted_by: "human:lead-dev"
  promoted_at: "2026-09-22T12:00:00Z"
  rationale: "Pattern validated across two services"
  min_sources_checked: 2
  audit_ref: "docs/CHANGELOG-MEMORY.md#2026-09-22-jwt-promotion"
---

Body content with code block:

\`\`\`javascript
const token = verify(jwt);
\`\`\`
`;

  const parsed = parseEKU(complexDoc);
  assert.strictEqual(parsed.valid, true, `Errors: ${parsed.errors.join(', ')}`);
  assert.strictEqual(parsed.eku.scope, 'workspace');
  assert.strictEqual(parsed.eku.promoted_from.min_sources_checked, 2);
  assert.strictEqual(parsed.eku.promoted_from.promoted_by, 'human:lead-dev');
  assert.strictEqual(parsed.eku.evidence.length, 1);
  assert.strictEqual(parsed.eku.evidence[0].anchor, 'ema://evidence/github.com/org/repo/9f8a2c1b/src/jwt.ts#sym:verify');
  assert.match(parsed.eku.content, /const token = verify\(jwt\);/);
});
