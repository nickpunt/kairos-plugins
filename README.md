# Kairos Plugins

Static plugin catalog and versioned downloads for Kairos. Packages download and run locally; this repository does not host plugin execution.

**Catalog:** https://raw.githubusercontent.com/nickpunt/kairos-plugins/main/registry.json

## Install

In Kairos, open **Plugins…**, select an available plugin, and choose Install. Alternatively, paste its versioned release-asset URL into **Install from URL**. Review the exact package's capabilities before approving.

Installation records retain the source, version, date and SHA-256 digest. Uninstall removes plugin code and revokes access while preserving installation history and captured data.

## Plugins

| Plugin | Version | Source and provenance |
|---|---|---|
| Audio preview scraper | [1.0.0](https://github.com/nickpunt/kairos-plugins/releases/tag/broadside-audio-v1.0.0) | [Source](plugins/broadside-audio/1.0.0) · [Provenance](plugins/broadside-audio/1.0.0/PROVENANCE.md) |

Packages are unreviewed unless an exact-version review says otherwise. A matching digest establishes artifact identity, not safety or authorship.

## Format and publishing

`registry.json` is hosting-independent. Each plugin declares an ID, description, author, latest version and version entries. Each version links its HTTPS package, source and provenance, declares its manifest, digest and review status. The manifest is checked again against the downloaded bytes before installation.

Package source lives in `plugins/<id>/<version>/`. Run `node scripts/build.mjs` to validate catalog/source agreement and build downloadable envelopes in `dist/`. No dependencies are needed. The source snapshot is versioned alongside its artifact.

Release tags use `<plugin-id>-v<version>`. Upload the matching `dist/<plugin-id>-<version>.kairos-plugin.json` to that release. Publish the catalog entry after the release asset is available. Never replace an existing version's bytes; publish a new version. Packages may move to another HTTPS host later without changing the runtime contract.

Author and provenance are descriptive metadata, not verified identities. Catalog inclusion does not approve permissions on a user's behalf. There is no automatic update, general-purpose package execution, submission service or publisher attestation yet.
