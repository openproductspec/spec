# Governance

ProductSpec is an open standard. Anyone can implement it.

Governance is community-driven through GitHub Issues and Pull Requests on the public `gokulrajaram/ProductSpec` repository.

ProductSpec.io is one implementation of ProductSpec: the managed authoring, review, calibration, and collaboration product. It may be the reference implementation, but it does not control ProductSpec's evolution by itself.

## Versioning

ProductSpec follows semver.

- Patch versions, such as `0.1.1`, are clarifications, examples, and non-behavioral fixes.
- Minor versions, such as `0.2.0`, are additive changes such as new optional sections or new optional frontmatter fields.
- Major versions, such as `1.0.0`, may include breaking changes to canonical vocabulary or required format.

## Maintainers

Initial maintainer: Gokul Rajaram.

Additional maintainers should be added as independent implementers emerge.

## Decision Process

ProductSpec uses a lightweight process for standard changes:

1. Propose the change in a GitHub issue.
2. Discuss intent, compatibility, and implementation impact.
3. Add or update an example or conformance fixture.
4. Update schema, parser, validator, and docs as needed.
5. Add a changelog entry for user-visible changes.
6. Merge through a pull request.

Small documentation fixes may go straight to pull request.

Section vocabulary changes require extra care because they affect interoperability. A section proposal should explain the proposed section ID, whether it is mandatory or optional, what current section cannot cover, validation expectations, example usage, and migration impact.
