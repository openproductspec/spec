# Status badge spec

ProductSpec badges should report facts, not judge product quality.

The open standard validates structure and portability. It does not decide whether a Product Spec is good, strategic, or complete enough to ship.

## Recommended badges

### Product Spec validity

```text
ProductSpec: valid
ProductSpec: invalid
```

Use when CI runs:

```bash
productspec validate <file.product-spec.md>
```

### Spec revision

```text
ProductSpec: rev 3
```

Use when a repo wants readers to see the current `spec_revision`.

### Agent Run receipt

```text
Agent Run: recorded
Agent Run: missing
```

Use when a feature branch or release claims agent-implemented work against a Product Spec.

### Evidence links

```text
Evidence: 4 linked artifacts
```

Use when `Related Artifacts` attach implementation, eval, or outcome evidence to `AC-`, `EVAL-`, or `SM-` IDs.

### Spec graph

```text
ProductSpec graph: buildable
ProductSpec graph: blocked
```

Use when a repo resolves dependent specs with:

```bash
productspec graph <spec-directory>
```

## Avoid for now

Avoid badges such as:

```text
ProductSpec Score: A
ProductSpec Quality: 92%
```

Those imply product judgment. ProductSpec can support review tools, but the open standard should keep the badge surface factual until a scoring method is explicit, documented, and optional.

## Future CLI shape

A future command could emit badge JSON:

```bash
productspec badge docs/product-specs/checkout.product-spec.md --json
```

Potential output:

```json
{
  "schema_version": 1,
  "label": "ProductSpec",
  "message": "valid · rev 3",
  "color": "green"
}
```

That output shape would be compatible with common badge services without making ProductSpec dependent on a hosted badge provider.
