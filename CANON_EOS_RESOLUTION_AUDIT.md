# Canon EOS Resolution Audit

## Scope
Evaluate whether the repository can utilize Canon EOS resolution data (interpreted as Canon EOS 5D Mark IV profile), implement it in a practical place, and verify production Docker readiness.

## Investigation Findings
- No existing `canon`, `eos`, or camera-resolution domain model existed in application code.
- The most appropriate integration point is `rigs/studio-rig.js` under sync/video workflows.
- Existing rig schema already includes `sync.videoSync`, so adding a camera capture profile is structurally consistent.

## Online Research Notes
- Attempted direct fetch of Canon official specs page:
  - `https://www.canon-europe.com/cameras/eos-5d-mark-iv/specifications/`
  - Result: `Forbidden` via automated fetch.
- Used available public references via web search to confirm expected EOS 5D Mark IV resolution values used in implementation:
  - stills: `6720x4480` (~30.4MP)
  - DCI 4K: `4096x2160`
  - Full HD: `1920x1080`
  - HD high frame-rate mode: `1280x720`

## Implementation
Added `videoCapture.primaryCamera` profile in `rigs/studio-rig.js`:
- `manufacturer`: Canon
- `model`: EOS 5D Mark IV
- still-photo and video resolutions
- studio integration recommendations for timecode sync and deliverables

## Validation
### Local validation
```bash
node -e "const { getStudioRig } = require('./rigs/studio-rig'); ..."
```
Result: profile exists and returns expected resolution fields.

### Docker validation
```bash
docker compose build lastfm
docker compose up -d lastfm
curl -s http://localhost:3002/health
```
Result: build successful, container healthy, `/health` responds OK.

## Conclusion
- Canon EOS resolution utilization is now integrated in a way this repo can actually use (studio rig production metadata).
- Dockerized production flow remains healthy after change.
- Change is low-risk and backward-compatible.
