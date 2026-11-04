# Orca Beta Android icons (personal fork)

Purple/teal launcher + adaptive foreground (official Orca mark + geometric **B**)
and a distinct white+alpha notification **B** (not the Orca silhouette).

Source SVGs live in `svg/`. Raster drop-ins already replace:

- `../icon.png` — Expo `expo.icon`
- `../adaptive-icon.png` — Expo `android.adaptiveIcon.foregroundImage`
- `../notification-icon.png` — `app.config.js` expo-notifications plugin `icon`

Adaptive mask bleed color in `app.json`: `#5B21B6`.

Regenerate PNGs (needs ImageMagick `magick`):

```sh
./scripts/render-icons.sh
```

See `INTEGRATION.md` for the original artifact mapping. No feature-logic change;
identity stays `com.andrerferrer.orca.beta` / versionCode 27 / `0.0.62`.
