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
the three active files into Expo assets:

```sh
cp png/icon.png ../icon.png
cp png/adaptive-icon.png ../adaptive-icon.png
cp png/notification-icon.png ../notification-icon.png
```

Those three paths are what the app uses:

- `../icon.png` — Expo `expo.icon`
- `../adaptive-icon.png` — Expo `android.adaptiveIcon.foregroundImage`
- `../notification-icon.png` — `app.config.js` expo-notifications plugin `icon`

Adaptive mask bleed color in `app.json`: `#5B21B6`.

See `INTEGRATION.md` for the mapping table. No feature-logic change; identity
stays `com.andrerferrer.orca.beta` / versionCode 27 / `0.0.62`.
