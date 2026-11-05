# Orca Beta Android icons (personal fork)

Purple/teal launcher + adaptive foreground (official Orca mark + geometric **B**)
and a distinct white+alpha notification **B** (not the Orca silhouette).

## Effective sources

The **composite** SVGs under `svg/` are the effective design sources used by
`scripts/render-icons.sh`:

- `svg/orca-beta-launcher.svg`
- `svg/orca-beta-adaptive-foreground.svg`
- `svg/orca-beta-notification.svg`

`svg/orca-mark.svg` and `svg/beta-b-mark.svg` are reference excerpts only.
Editing those isolated marks does **not** update the composites; change the
composite SVGs (or re-compose them) before regenerating rasters.

## Regenerate and install into the app

Needs ImageMagick `magick`. From this directory:

```sh
./scripts/render-icons.sh
```

That writes rasters under `png/` (local output; not required in git). Then copy
the three active files next to this README:

```sh
cp png/icon.png png/adaptive-icon.png png/notification-icon.png .
```

`mobile/beta/orca-beta.json` points the `ORCA_BETA=1` build at them:

- `icon.png` — Expo `expo.icon`
- `adaptive-icon.png` — Expo `android.adaptiveIcon.foregroundImage`
- `notification-icon.png` — expo-notifications plugin `icon`

Adaptive mask bleed color: `#5B21B6` (`adaptiveIconBackgroundColor`).

See `INTEGRATION.md` for the mapping table. No feature-logic change; identity
stays `com.andrerferrer.orca.beta`; versionCode lives in `mobile/beta/orca-beta.json`.
