/**
 * Engineering Memory Agent (EMA) — Conflict & Contradiction Detection
 * Phase 5: Authoritative 6-Stage Retrieval Engine
 *
 * Inspects retrieved knowledge units for contradiction relationships (`contradicts`).
 *
 * CRITICAL INVARIANTS:
 *   - Contradictions are NEVER resolved silently.
 *   - Contradictions are NEVER suppressed or privileged by ranking score.
 *   - Both conflicting units MUST be surfaced explicitly.
 *   - A prominent contradiction banner is attached to both units.
 */

/**
 * Normalizes the `related` field of an EKU into an array of relationship objects.
 * @param {Array|string} related
 * @returns {Array<{ target: string, type: string }>}
 */
export function normalizeRelationships(related) {
  if (!related) return [];
  let arr = related;
  if (typeof related === 'string') {
    try {
      arr = JSON.parse(related);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(arr)) return [];

  return arr.map((item) => {
    if (typeof item === 'string') {
      return { target: item, type: 'relates-to' };
    }
    if (item && typeof item === 'object') {
      return {
        target: item.target || item.path || '',
        type: (item.type || 'relates-to').toLowerCase(),
      };
    }
    return null;
  }).filter(Boolean);
}

/**
 * Detects contradiction pairs among a list of retrieved EKU records.
 *
 * @param {Array<object>} records - Retrieved candidate EKU records
 * @returns {{
 *   hasContradictions: boolean,
 *   pairs: Array<{ ekuA: string, ekuB: string, titleA: string, titleB: string, banner: string }>,
 *   contradictingIds: Set<string>
 * }}
 */
export function detectContradictions(records) {
  if (!Array.isArray(records) || records.length < 2) {
    return {
      hasContradictions: false,
      pairs: [],
      contradictingIds: new Set(),
    };
  }

  // Build a lookup map of ID and source_path to record
  const recordMap = new Map();
  for (const rec of records) {
    if (rec.id) recordMap.set(rec.id, rec);
    if (rec.source_path) recordMap.set(rec.source_path, rec);
  }

  const pairs = [];
  const contradictingIds = new Set();
  const seenPairKeys = new Set();

  for (const rec of records) {
    const relationships = normalizeRelationships(rec.related);

    for (const rel of relationships) {
      if (rel.type === 'contradicts') {
        const targetRec = recordMap.get(rel.target);
        if (targetRec && targetRec.id !== rec.id) {
          const idA = rec.id || rec.source_path;
          const idB = targetRec.id || targetRec.source_path;

          // Deduplicate pairs (A-B and B-A)
          const pairKey = [idA, idB].sort().join(':::');
          if (!seenPairKeys.has(pairKey)) {
            seenPairKeys.add(pairKey);
            contradictingIds.add(idA);
            contradictingIds.add(idB);

            const titleA = rec.title || idA;
            const titleB = targetRec.title || idB;
            const banner = `[CONTRADICTION: '${titleA}' contradicts '${titleB}' — see provenance]`;

            pairs.push({
              ekuA: idA,
              ekuB: idB,
              titleA,
              titleB,
              banner,
            });
          }
        }
      }
    }
  }

  return {
    hasContradictions: pairs.length > 0,
    pairs,
    contradictingIds,
  };
}

/**
 * Attaches contradiction banners and warnings to retrieved records.
 * Ensures both sides of every contradiction remain visible with explicit banners.
 *
 * @param {Array<object>} records
 * @returns {Array<object>} Records with contradiction banners applied
 */
export function annotateContradictions(records) {
  const { hasContradictions, pairs, contradictingIds } = detectContradictions(records);

  if (!hasContradictions) {
    return records.map((r) => ({ ...r, contradiction: null }));
  }

  return records.map((rec) => {
    const recId = rec.id || rec.source_path;
    if (contradictingIds.has(recId)) {
      // Find matching banners for this record
      const matchingPairs = pairs.filter((p) => p.ekuA === recId || p.ekuB === recId);
      const banners = matchingPairs.map((p) => p.banner);

      return {
        ...rec,
        contradiction: {
          detected: true,
          banners,
          opposingEKUs: matchingPairs.map((p) => (p.ekuA === recId ? p.ekuB : p.ekuA)),
        },
      };
    }
    return { ...rec, contradiction: null };
  });
}
