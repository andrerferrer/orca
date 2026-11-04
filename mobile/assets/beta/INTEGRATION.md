# Orca Beta icon drop-in mapping (android-beta-30min)

Integrator copies from `png/` into the frozen feature checkout
`/Users/andrerferrer/orca/workspaces/orca/android-beta-30min` (HEAD was
`69a3423da96988d47cd23d1ef6ed71f126c41f63` / code27 when this leaf ran).
This leaf did not edit that tree.

| Artifact | Copy to | Config that must point at it |
|---|---|---|
| `png/icon.png` (1024, opaque purple/teal + Orca + B) | `mobile/assets/icon.png` | `mobile/app.json` -> `expo.icon` = `./assets/icon.png` |
| `png/adaptive-icon.png` (1024, transparent outside safe-zone plate) | `mobile/assets/adaptive-icon.png` | `mobile/app.json` -> `expo.android.adaptiveIcon.foregroundImage` = `./assets/adaptive-icon.png` |
| `png/notification-icon.png` (96 white+alpha bold B; also `notification-icon-56.png`) | `mobile/assets/notification-icon.png` | `mobile/app.config.js` expo-notifications plugin `icon: './assets/notification-icon.png'` |

Optional: `android.adaptiveIcon.backgroundColor` can stay `#111111` because the
purple plate is baked into the adaptive foreground. Changing it to `#5B21B6`
is optional polish under mask bleed.

Regenerate: `scripts/render-icons.sh` (needs `magick`).
