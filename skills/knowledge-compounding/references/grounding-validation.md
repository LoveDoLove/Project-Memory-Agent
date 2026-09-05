# Grounding Validation Reference

Detailed rules for mechanically and semantically verifying claims against
the codebase before compounding knowledge.

---

# Mechanical Validation

## Claim Types and Verification Methods

### File Paths

```text
Claim: "The file src/auth/login.ts contains the authentication logic"
Verify: glob for the file path
Evidence: file exists, file contains relevant code
Confidence: High if file exists and contains claimed code
```

### Function Names

```text
Claim: "The function validateToken() handles JWT validation"
Verify: codebase-memory search for function name
Evidence: function exists, signature matches, implementation matches
Confidence: High if function exists and implementation matches
```

### API Endpoints

```text
Claim: "The POST /api/login endpoint handles authentication"
Verify: route discovery or grep for route definition
Evidence: route exists, handler matches claimed behavior
Confidence: High if route exists and handler matches
```

### Config Values

```text
Claim: "The config uses port 3000 by default"
Verify: read config file
Evidence: config file contains port setting with correct value
Confidence: High if config file contains claimed value
```

### Dependencies

```text
Claim: "The project uses React 18"
Verify: read package.json or equivalent
Evidence: dependency listed with correct version
Confidence: High if dependency exists with correct version
```

### Behaviors

```text
Claim: "The function throws an error when input is invalid"
Verify: read implementation or run tests
Evidence: implementation contains error handling, tests verify behavior
Confidence: High if tests verify claimed behavior
```

---

# Semantic Validation

## Check List

```text
1. Does the explanation match the actual behavior?
2. Are the root causes verified, not assumed?
3. Are the solutions evidence-backed, not anecdotal?
4. Are the constraints documented, not inferred?
5. Are the rejected approaches actually tried?
```

## Semantic Rules

```text
- Explanation must match implementation
- Root causes must be verified through investigation
- Solutions must have supporting evidence
- Constraints must be documented in code or config
- Rejected approaches must have failure evidence
```

---

# Confidence Scale

```text
High     - verified against multiple sources (code + tests + config)
Medium   - verified against one source (code or tests)
Low      - partially verified or inferred
Unknown  - cannot verify mechanically
```

---

# Discrepancy Handling

## Types of Discrepancies

```text
Outdated Claim    - code has changed since claim was made
Incorrect Claim   - claim was never accurate
Incomplete Claim  - claim is partially correct
Contradictory     - claim conflicts with other verified claims
```

## Handling Process

```text
1. Stop the compounding process
2. Document the discrepancy with evidence
3. Report to parent Agent for resolution
4. Do not compound the unverified claim
5. Recommend updating or removing the claim
```

---

# Integration with Workflow

```text
Step 3 (Verify Claims) -> Grounding Validation -> Step 4 (Identify Insight)
```

Grounding validation is not optional. Every factual claim in a knowledge
proposal must pass mechanical validation before the proposal is finalized.

---

# References

- `templates/schema.yaml` - canonical frontmatter contract
- `repository-audit` - evidence gathering workflow
- `knowledge-classification` - knowledge type definitions