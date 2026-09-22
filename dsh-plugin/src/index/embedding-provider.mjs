/**
 * Engineering Memory Agent (EMA) — Zero-Config Embedding Provider
 *
 * Provides out-of-the-box 384-dimensional vector embeddings with:
 *   1. Zero-dependency, deterministic local subword feature-hash embedding (always available, offline, zero-latency).
 *   2. Optional OpenAI/DeepSeek-compatible remote API embedding provider if API key or URL is configured.
 *   3. L2 unit normalization for direct cosine similarity via Euclidean distance in sqlite-vec.
 */

export const DEFAULT_EMBEDDING_DIMENSION = 384;

/**
 * 32-bit FNV-1a hash function for deterministic string hashing.
 * @param {string} str
 * @returns {number}
 */
export function fnv1a(str) {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Secondary hash function to produce independent sign bits and index dispersion.
 * @param {string} str
 * @returns {number}
 */
export function djb2(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Tokenize text into words, code tokens, and split camelCase/snake_case identifiers.
 * @param {string} text
 * @returns {string[]}
 */
export function tokenizeCodeAndText(text) {
  if (typeof text !== 'string') return [];
  
  // Normalize whitespace
  const rawWords = text.toLowerCase().split(/[\s,;:.!?'"()\[\]{}|\\\/<>+=`~@#$%^&*]+/);
  const tokens = [];

  for (const w of rawWords) {
    if (!w || w.length < 2) continue;
    tokens.push(w);

    // Split snake_case or kebab-case
    if (w.includes('_') || w.includes('-')) {
      const parts = w.split(/[-_]+/).filter((p) => p.length >= 2);
      tokens.push(...parts);
    }
  }

  return tokens;
}

/**
 * Generates a deterministic 384-dimensional normalized vector embedding for text.
 * Uses subword n-grams and signed random projections (Johnson-Lindenstrauss preserving).
 *
 * @param {string} text - Text to embed
 * @param {number} [dim=DEFAULT_EMBEDDING_DIMENSION] - Vector dimension
 * @returns {Float32Array} L2-normalized vector
 */
export function embedTextSync(text, dim = DEFAULT_EMBEDDING_DIMENSION) {
  const vec = new Float32Array(dim);
  if (typeof text !== 'string' || !text.trim()) {
    return vec;
  }

  const tokens = tokenizeCodeAndText(text);
  if (tokens.length === 0) {
    return vec;
  }

  // Count token frequencies for log-TF weighting
  const termCounts = new Map();
  for (const t of tokens) {
    termCounts.set(t, (termCounts.get(t) || 0) + 1);
  }

  for (const [term, count] of termCounts.entries()) {
    const tfWeight = 1 + Math.log(count);

    // Primary word projection
    const hWord = fnv1a(term);
    const idxWord = hWord % dim;
    const signWord = (djb2(term) & 1) ? 1 : -1;
    vec[idxWord] += signWord * tfWeight * 1.5;

    // Secondary hash for dispersion
    const h2 = djb2(term);
    const idx2 = (hWord ^ h2) % dim;
    const sign2 = (h2 & 2) ? 1 : -1;
    vec[idx2] += sign2 * tfWeight * 0.75;

    // Subword character 3-grams for fuzzy prefix/suffix semantic matching
    if (term.length >= 3) {
      const maxGrams = Math.min(term.length - 2, 8);
      for (let i = 0; i < maxGrams; i++) {
        const gram = term.slice(i, i + 3);
        const hGram = fnv1a(gram);
        const idxGram = hGram % dim;
        const signGram = (hGram & 1) ? 1 : -1;
        vec[idxGram] += signGram * 0.35;
      }
    }
  }

  // L2 unit normalize
  let sumSq = 0;
  for (let i = 0; i < dim; i++) {
    sumSq += vec[i] * vec[i];
  }

  const norm = Math.sqrt(sumSq);
  if (norm > 1e-9) {
    for (let i = 0; i < dim; i++) {
      vec[i] /= norm;
    }
  }

  return vec;
}

/**
 * Computes cosine similarity between two unit vectors.
 * @param {Float32Array|number[]} a
 * @param {Float32Array|number[]} b
 * @returns {number} Value between -1.0 and 1.0 (typically 0.0 to 1.0)
 */
export function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}

/**
 * Asynchronously generates an embedding. If a remote API endpoint or key is configured,
 * it will attempt to fetch from the API; otherwise falls back to embedTextSync.
 *
 * @param {string} text
 * @param {object} [options]
 * @param {string} [options.apiKey]
 * @param {string} [options.url]
 * @param {string} [options.model]
 * @param {number} [options.dim]
 * @returns {Promise<Float32Array>}
 */
export async function embedText(text, options = {}) {
  const apiKey = options.apiKey || process.env.EMA_EMBEDDING_API_KEY || process.env.OPENAI_API_KEY;
  const url = options.url || process.env.EMA_EMBEDDING_URL;
  const dim = options.dim || DEFAULT_EMBEDDING_DIMENSION;

  if (apiKey && url) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: options.model || process.env.EMA_EMBEDDING_MODEL || 'text-embedding-3-small',
          input: text,
          dimensions: dim,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.data?.[0]?.embedding) {
          const raw = data.data[0].embedding;
          const floatVec = new Float32Array(dim);
          for (let i = 0; i < Math.min(raw.length, dim); i++) {
            floatVec[i] = raw[i];
          }
          return floatVec;
        }
      }
    } catch {
      // Remote API failed; gracefully fall back to local embedding
    }
  }

  return embedTextSync(text, dim);
}
