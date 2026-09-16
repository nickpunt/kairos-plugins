# Audio preview scraper 1.0.0

Adapted with AI assistance from Nick Punt's existing Broadside-audio HookSounds and Pro Sound Effects scrapers. This is not claimed to be wholly AI-authored, independently security-reviewed, or remotely attested. No original creation transcript is published.

The published backend contains the existing parser logic and a wrapper using Kairos's restricted web-read and plugin-library capabilities. Kairos renders the collection and inspector. Plugin code runs locally in an isolated Electron renderer; it cannot execute shell commands or receive unrestricted filesystem access.

Verification: both providers passed a live sandbox capture earlier; Pro Sound Effects capture, playback and restart persistence passed in a packaged Kairos app. Later HookSounds requests timed out, including outside Kairos. Uninstall revocation and preservation of captured data and installation receipts were verified. These checks are not a security certification.

Only public audition audio is downloaded. Source URLs and license notices remain attached to records. The downloaded previews do not grant a license to ship them in a game. This repository contains plugin code, not captured audio, credentials, app content, or environment files.
