# last-fm Desktop

[![travis][travis-image]][travis-url] [![npm][npm-image]][npm-url] [![downloads][downloads-image]][downloads-url]

A cross-platform desktop application built with [Electron](https://www.electronjs.org/) that provides:
- A modern UI for searching Last.fm public music data.
- Local and online management of brass stab audio samples.
- Quick-start templates for experimenting in [Electron Fiddle](https://www.electronjs.org/fiddle).

[travis-image]: https://img.shields.io/travis/feross/last-fm/master.svg
[travis-url]: https://travis-ci.org/feross/last-fm
[npm-image]: https://img.shields.io/npm/v/last-fm.svg
[npm-url]: https://npmjs.org/package/last-fm
[downloads-image]: https://img.shields.io/npm/dm/last-fm.svg
[downloads-url]: https://npmjs.org/package/last-fm

---

## Table of Contents

- [Features](#features)
- [Security Features](#security-features)
- [Installation](#installation)
- [Configuration](#configuration)
  - [Security Configuration](#security-configuration)
- [Running the App](#running-the-app)
- [UI Overview](#ui-overview)
- [Data Normalization](#data-normalization)
- [Brass Stabs Management](#brass-stabs-management)
  - [Local Search](#local-search)
  - [Online Search (Freesound)](#online-search-freesound)
  - [Adding Local Samples](#adding-local-samples)
- [Electron Fiddle Integration](#electron-fiddle-integration)
- [Building & Packaging](#building--packaging)
- [Troubleshooting](#troubleshooting)
- [Troubleshooting Security Issues](#troubleshooting-security-issues)
- [Security Best Practices](#security-best-practices)
- [Privacy and Data Protection](#privacy-and-data-protection)
- [Security Architecture Documentation](#security-architecture-documentation)
- [Legacy Node.js API](#legacy-nodejs-api)
- [Contributing](#contributing)
- [License](#license)
- [References](#references)

---

## Features

- **Last.fm Search:** Search artists, albums, and tracks via the Last.fm public API.
- **Local Brass Stabs:** Maintain a local library of brass stab samples (search, add, remove).
- **Online Brass Stabs:** Query the Freesound API for brass stab samples and view metadata.
- **File Dialog Support:** Select and import your own audio files (`wav`, `mp3`, `aiff`, `flac`, `ogg`).
- **Electron Fiddle Templates:** Load and open preconfigured templates for quick prototyping.
- **Dark Theme UI:** Responsive, professional interface suitable for music production workflows.
- **Environment Configuration:** Securely manage your API keys via a `.env` file.
- **Cross-Platform:** Works on Windows, macOS, and Linux.
- **Pack & Distribute:** Build installers using `electron-builder`.
- **Data Normalization:** Scale raw metrics across different sources to consistent 0–1 or 0–100 ranges for intuitive comparison and visualization.

---

## Security Features

Our application implements multiple layers of defense to protect users and data:

- **Anti-Scam Protection:**  
  - URL validation against a trusted domain allowlist (`last.fm`, `freesound.org`, `github.com`, etc.).  
  - HTML sanitization to remove script tags, event handlers, and dangerous attributes.  
  - Heuristic detection for suspicious URLs, including phishing patterns and URL shorteners.

- **Hash Leak Protection:**  
  - Secure logging via data scrubbing of API keys, tokens, and personal data.  
  - SHA-256 hashing of sensitive strings before logging.  
  - AES-256-GCM encryption for local file storage, with secure key derivation from machine-specific identifiers.

- **AFK Guard:**  
  - Inactivity detection with configurable timeout (default 10 minutes).  
  - Session locking that blanks sensitive data in the UI and clears memory caches.  
  - Unlock mechanism requiring user authentication (click, password, or OS authentication).  
  - IPC synchronization between main and renderer processes for session state.

---

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) v14 or higher  
- [npm](https://www.npmjs.com/) (bundled with Node.js) or [Yarn](https://yarnpkg.com/)

### Steps

```bash
# Clone the repository
git clone https://github.com/feross/last-fm.git
cd last-fm

# Install dependencies
npm install
# or
yarn install
```

> **Security Considerations:**  
> - Verify package integrity using checksums or `npm ci`.  
> - Ensure your `.env` file is excluded from version control (`.gitignore`).  
> - Run `npm run security-audit` to scan for known vulnerabilities.

---

## Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` in your editor and set your API keys:
   ```text
   LASTFM_API_KEY=your_lastfm_api_key_here
   FREESOUND_API_KEY=your_freesound_api_key_here
   ```
3. Save and close `.env`.

> **Tip:** Get a Last.fm API key at https://www.last.fm/api/account/create  
> **Tip:** Get a Freesound API key at https://freesound.org/apiv2/apply/

### Security Configuration

Configure security-related environment variables in your `.env` file:

```text
# AFK Guard Settings
AFK_ENABLED=true
AFK_TIMEOUT_MINUTES=10
AFK_WARNING_MINUTES=2

# Logging & CSP
SECURITY_LOG_LEVEL=info
STRICT_CSP=true
ENABLE_LINK_VALIDATION=true
REQUIRE_LINK_CONFIRMATION=true

# Data Protection
ENCRYPT_LOCAL_DATA=true
SECURE_LOGGING=true
CLEAR_LOGS_ON_EXIT=false

# Anti-Scam
ENABLE_URL_SCANNING=true
BLOCK_SUSPICIOUS_DOMAINS=true
```

> **Warning:** Misconfiguration of these settings can weaken defenses or impact performance. Review settings for development vs production.

---

## Running the App

Start the Electron application in development mode:

```bash
npm run dev
# or
npm start
```

The app window will open. On macOS, you can also run:
```bash
npm run dev
```
which sets `NODE_ENV=development` to auto-open DevTools.

---

## UI Overview

![App Screenshot](assets/screenshot.png)

1. **Last.fm Search Panel**  
   - Enter artist, track, or album name.  
   - View paginated results and metadata (listeners, tags, playcount).

2. **Brass Stabs Library**  
   - **Local Samples:** Search your saved samples by name, tags, or description.  
   - **Online Samples:** Fetch top brass stabs from Freesound with preview links.

3. **Sample Import Dialog**  
   - Click **Add Sample** to open a file selection dialog.  
   - Select one or multiple audio files to import into the local database.

4. **Electron Fiddle Templates**  
   - Browse templates under **Fiddle Templates**.  
   - Click **Open in Fiddle** to launch or import in Electron Fiddle for rapid prototyping.

---

## Data Normalization

The application now provides a **Data Normalization** system to bring disparate metrics onto a common scale, improving comparison and visualization across sources.

### Metrics Normalized

- **Last.fm Data:** `listeners`, `playcount`  
- **Freesound Data:** `duration`, `filesize`, `downloads`  
- **Local Samples:** `duration`, `filesize`

### Normalization Modes

- **Unit (0–1):** Linear min-max scaling between 0 and 1.  
- **Percent (0–100):** Linear scaling scaled to percentage values.  
- **Z-score:** Standard score using mean and standard deviation.  
- **Robust:** Scaling based on median and interquartile range.

By default, **unit scaling** with two decimal precision is applied.

### Interpreting Normalized Values

- A **0** (or **0%**) indicates the minimum value in the current dataset.  
- A **1** (or **100%**) indicates the maximum value.  
- Values between represent relative position: e.g., a track with a normalized playcount of **0.75** has 75% of the highest playcount in the result set.

### Visual Indicators

Normalized values are shown alongside raw data with visual cues:

- **Progress Bars:** Display 0–100% fill to represent normalized score.  
- **Color Coding:**  
  - Green: ≥ 75%  
  - Yellow: 25%–75%  
  - Red: < 25%  
- **Percentage Badges:** Numeric percent displayed next to metrics.  

![Normalization Example](assets/normalization_example.png)

### Configuration Options

Customize normalization behavior in the **Settings > Data Normalization** panel:

- **Mode:** `unit`, `percent`, `zscore`, `robust`  
- **Decimal Precision:** Number of decimal places for normalized output  
- **Outlier Handling:** `none`, `iqr`, `zscore`, `modified_zscore`  
- **Preserve Raw Values:** Toggle display of raw vs. normalized data  

### Methodology

Normalization is implemented in the shared `utils/normalization.js` module:

1. **Detection & Validation:** Ensures values are numeric and filters invalid entries.  
2. **Statistics Calculation:** Computes min, max, mean, median, IQR, etc.  
3. **Scaling:** Applies the selected normalization strategy to each value.  
4. **Batch Processing:** Processes entire result arrays, attaches metadata (ranges, statistics, outliers).  
5. **Preservation:** Original raw values are kept alongside normalized fields (`*_original`).  

See `utils/normalization.js` for full API documentation and examples.

---

## Brass Stabs Management

### Local Search

- Use the **Local Search** tab.  
- Type your keyword and press **Search**.  
- Results show sample name, tags, description, duration.

### Online Search (Freesound)

- Switch to **Online Search** tab.  
- Enter a keyword, press **Search Online**.  
- Displays Freesound results with preview buttons.

### Adding Local Samples

1. Click **Add Sample**.  
2. In the file dialog, choose audio files.  
3. Fill in metadata (tags, description) in the add-sample form.  
4. Click **Save** to persist to the local database.

---

## Electron Fiddle Integration

Under **Fiddle Templates**, you can:

- **View** available templates (JSON definitions in `fiddle-templates/`).  
- **Open** a template in Electron Fiddle via custom protocol or by showing the file in your system file manager.  
- **Manual Import**: If Fiddle is not installed, the JSON content is available for manual import.

---

## Building & Packaging

Use [`electron-builder`](https://www.electron.build/) via provided npm scripts:

```bash
# Build unpacked app in ./dist
npm run pack

# Create installers/packages for all platforms
npm run dist
```

Output artifacts are in the `dist/` directory.  
Customize build options in `package.json` under the `"build"` field.

---

## Troubleshooting

- **Missing API Key**  
  - Error: `Last.fm API key not configured.`  
  - Solution: Set `LASTFM_API_KEY` in your `.env` file and restart the app.

- **Invalid Freesound API Key / Rate Limit**  
  - Error messages on search.  
  - Solution: Verify `FREESOUND_API_KEY` or wait for rate limit reset.

- **Network Errors**  
  - Ensure your internet connection is active.

- **Local Database Corruption**  
  - On startup, a backup is created at `brass_samples.json.backup.*` if the JSON is invalid.  
  - You can restore from the backup or delete the file to reinitialize.

- **Electron Fiddle Protocol Not Registered**  
  - If the app cannot open Fiddle by protocol, it will fallback to showing the JSON file in folder or providing content for manual import.

- **Platform-Specific Issues**  
  - On macOS, ensure you've granted permissions for file access.  
  - On Linux, you may need to install extra codecs for audio playback.

---

## Troubleshooting Security Issues

- **Suspicious URL Blocked**  
  - Error: `URL validation failed for external link.`  
  - Solution: Verify the link is to a trusted domain or disable `ENABLE_LINK_VALIDATION` in `.env`.

- **Session Locked Unexpectedly**  
  - Error: `AFK session lock activated.`  
  - Solution: Check `AFK_TIMEOUT_MINUTES` and activity events integration; press unlock and authenticate.

- **Decryption Failed**  
  - Error: `Unable to decrypt local data.`  
  - Solution: Confirm `ENCRYPT_LOCAL_DATA` key settings and machine-specific key derivation; clear caches if needed.

- **Strict CSP Violation**  
  - Error logged in console with `CSP` directive.  
  - Solution: Review injected policies or disable `STRICT_CSP` in development.

> For further security assistance, contact: support@traycer.ai

---

## Security Best Practices

- **API Key Management:**  
  - Store API keys only in environment variables or secure keychains; never commit to version control.

- **External Link Handling:**  
  - Always validate and confirm external links before opening; educate users on phishing risks.

- **Least Privilege Principle:**  
  - Restrict file system and network permissions to only what is necessary.

- **Code Signing & Verification:**  
  - Sign application binaries for distribution; verify signatures to prevent tampering.

- **Regular Audits:**  
  - Run `npm run security-audit` and dependency vulnerability scans frequently.

- **Secure Deployment:**  
  - Use secure channels (HTTPS) and monitor security logs for anomalies.

---

## Privacy and Data Protection

- **Data Collected:**  
  - Only metadata (search queries, sample tags) and non-personal usage telemetry (optional).

- **Data Stored Locally:**  
  - Sample metadata and encrypted backups in `brass_samples.json`.

- **Transmission Security:**  
  - All API requests use HTTPS; WebSockets are restricted to whitelisted endpoints.

- **Encryption Measures:**  
  - AES-256-GCM encryption for local storage; secure key derivation using OS-specific identifiers.

- **Privacy Policy:**  
  - See our [Privacy Policy](https://traycer.ai/privacy) for full details.

---

## Security Architecture Documentation

- **Process Isolation:**  
  - Main and renderer processes communicate via secure IPC channels with strict context bridging.

- **Content Security Policy (CSP):**  
  - Programmatic CSP injection via `session.webRequest.onHeadersReceived` and backup meta tags in HTML.

- **Anti-Scam & Sanitization:**  
  - Comprehensive HTML sanitization in `utils/security.js` and client-side validation in preload script.

- **AFK Guard Flow:**  
  - `ActivityTracker` in renderer reports to main; `SessionManager` handles lock/unlock with authentication.

- **Encryption Workflow:**  
  - `deriveKeyFromMachine()` used for AES key; migration logic handles existing unencrypted data.

- **Audit & Testing:**  
  - Automated tests for sanitization, URL validation, and data encryption; regular manual security reviews.

---

## Legacy Node.js API

If you only need a **Node.js client** for Last.fm (no Electron UI), see the original API documentation:

<details>
<summary>Legacy API Reference</summary>

Powered by the [LastFM API](http://www.last.fm/api).  
Only GET methods are provided for public data (search, info, charts, geo, tags, tracks, etc.).  
For full details and usage examples, visit the [npm package page](https://npmjs.org/package/last-fm).
</details>

---

## Contributing

We welcome contributions:

1. Fork the repository  
2. Create a feature branch (`git checkout -b feature/YourFeature`)  
3. Commit your changes (`git commit -m 'Add feature'`)  
4. Push to your fork (`git push origin feature/YourFeature`)  
5. Open a Pull Request

Connect with us:  
- GitHub: https://github.com/traycerai  
- Discord: https://traycer.ai/discord  
- Twitter: https://x.com/traycerai  
- LinkedIn: https://www.linkedin.com/company/traycer  
- Email: support@traycer.ai

---

## License

MIT. © Feross Aboukhadijeh and contributors.

---

## References

- Last.fm API Documentation: http://www.last.fm/api  
- Freesound API Documentation: https://freesound.org/docs  
- Electron: https://www.electronjs.org/  
- Electron Fiddle: https://www.electronjs.org/fiddle  
- electron-builder: https://www.electron.build/  