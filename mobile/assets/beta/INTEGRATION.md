# Orca Beta icon drop-in mapping

Copy rasters from `png/` (produced by `scripts/render-icons.sh`) into
`mobile/assets/beta/`. The tracked upstream assets under `mobile/assets/` stay
untouched; `mobile/beta/with-orca-beta.cjs` points the build at these files when
`ORCA_BETA=1` (set by `.github/workflows/orca-beta-android-arm64.yml`). Identity
(`com.andrerferrer.orca.beta`, versionCode) lives in `mobile/beta/orca-beta.json`;
this mapping does not change feature logic.

| Artifact                                                                             | Copy to                                    | Config that must point at it                                            |
| ------------------------------------------------------------------------------------ | ------------------------------------------ | ----------------------------------------------------------------------- |
| `png/icon.png` (1024, opaque purple/teal + Orca + B)                                 | `mobile/assets/beta/icon.png`              | `mobile/beta/orca-beta.json` -> `icon`                                  |
| `png/adaptive-icon.png` (1024, transparent outside safe-zone plate)                  | `mobile/assets/beta/adaptive-icon.png`     | `mobile/beta/orca-beta.json` -> `adaptiveIconForeground`                |
| `png/notification-icon.png` (96 white+alpha bold B; also `notification-icon-56.png`) | `mobile/assets/beta/notification-icon.png` | `mobile/beta/orca-beta.json` -> `notificationIcon` (expo-notifications) |

Adaptive mask bleed is `adaptiveIconBackgroundColor` = `#5B21B6` in
`mobile/beta/orca-beta.json` (purple plate also baked into the adaptive foreground).

Regenerate: `scripts/render-icons.sh` (needs `magick`), then copy the three
active PNGs from `png/` into `mobile/assets/beta/` as in the table.
