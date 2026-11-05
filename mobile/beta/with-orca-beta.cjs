// Personal fork only: the Orca Beta identity lives here, not in the tracked app.json,
// so every upstream mobile release (version/versionCode bumps in app.json) merges cleanly.
const identity = require('./orca-beta.json')

const ENV_FLAG = 'ORCA_BETA'

function withOrcaBeta(config) {
  if (process.env[ENV_FLAG] !== '1') {
    return config
  }
  const { googleServicesFile: _unusedFirebase, ...android } = config.android ?? {}
  return {
    ...config,
    name: identity.name,
    slug: identity.slug,
    scheme: identity.scheme,
    icon: identity.icon,
    android: {
      ...android,
      package: identity.androidPackage,
      versionCode: identity.versionCode,
      adaptiveIcon: {
        ...android.adaptiveIcon,
        foregroundImage: identity.adaptiveIconForeground,
        backgroundColor: identity.adaptiveIconBackgroundColor
      }
    },
    plugins: (config.plugins ?? []).map((plugin) =>
      Array.isArray(plugin) && plugin[0] === 'expo-notifications'
        ? [plugin[0], { ...plugin[1], icon: identity.notificationIcon }]
        : plugin
    )
  }
}

module.exports = { withOrcaBeta }
