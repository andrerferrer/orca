# Orca Beta icon drop-in mapping

Copy rasters from `png/` (produced by `scripts/render-icons.sh`) into the beta
checkout's Expo asset paths below. Identity stays personal Orca Beta
(`com.andrerferrer.orca.beta`, versionCode 27); this mapping does not change
feature logic.

| Artifact                                                                             | Copy to                               | Config that must point at it                                                                    |
| ------------------------------------------------------------------------------------ | ------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `png/icon.png` (1024, opaque purple/teal + Orca + B)                                 | `mobile/assets/icon.png`              | `mobile/app.json` -> `expo.icon` = `./assets/icon.png`                                          |
| `png/adaptive-icon.png` (1024, transparent outside safe-zone plate)                  | `mobile/assets/adaptive-icon.png`     | `mobile/app.json` -> `expo.android.adaptiveIcon.foregroundImage` = `./assets/adaptive-icon.png` |
| `png/notification-icon.png` (96 white+alpha bold B; also `notification-icon-56.png`) | `mobile/assets/notification-icon.png` | `mobile/app.config.js` expo-notifications plugin `icon: './assets/notification-icon.png'`       |

Adaptive mask bleed in `app.json` is `#5B21B6` (purple plate also baked into the
adaptive foreground).

Regenerate: `scripts/render-icons.sh` (needs `magick`), then copy the three
active PNGs from `png/` into `mobile/assets/` as in the table.
