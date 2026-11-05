import { z } from 'zod'
import type { AppUpdateCheckResult, AppUpdateSource } from './app-update-source'

const BETA_VERSION_PREFIX = 'Beta v'
// Fork releases are dated prereleases; the APK name carries the versionCode, the only Beta ordering.
const BETA_APK_VERSION_CODE = /-v(\d+)\.apk$/
const MAX_RELEASES = 30

type Fetch = typeof fetch

export type OrcaBetaUpdateConfig = {
  versionCode: number
  releasesRepo: string
  releaseTagPrefix: string
}

const configSchema = z.object({
  versionCode: z.number().int().positive(),
  releasesRepo: z.string().min(1),
  releaseTagPrefix: z.string().min(1)
})

const releasesSchema = z.array(
  z.looseObject({
    tag_name: z.string(),
    draft: z.boolean(),
    html_url: z.string(),
    assets: z.array(z.looseObject({ name: z.string() }))
  })
)

/** The Beta identity the overlay embeds in `expo.extra.orcaBeta`; null on an upstream build. */
export function orcaBetaUpdateConfig(extra: unknown): OrcaBetaUpdateConfig | null {
  const parsed = z.looseObject({ orcaBeta: configSchema }).safeParse(extra)
  return parsed.success ? parsed.data.orcaBeta : null
}

export function betaVersionLabel(versionCode: number): string {
  return `${BETA_VERSION_PREFIX}${versionCode}`
}

function betaVersionCode(label: string): number | null {
  if (!label.startsWith(BETA_VERSION_PREFIX)) {
    return null
  }
  const code = Number(label.slice(BETA_VERSION_PREFIX.length))
  return Number.isInteger(code) && code > 0 ? code : null
}

export function isNewerBetaVersion(candidate: string, installed: string): boolean {
  const candidateCode = betaVersionCode(candidate)
  const installedCode = betaVersionCode(installed)
  return candidateCode !== null && installedCode !== null && candidateCode > installedCode
}

export function createBetaReleaseUpdateSource(
  fetchImpl: Fetch,
  config: OrcaBetaUpdateConfig
): AppUpdateSource {
  return {
    async check(installedVersion, signal): Promise<AppUpdateCheckResult> {
      const reply = await fetchImpl(
        `https://api.github.com/repos/${config.releasesRepo}/releases?per_page=${MAX_RELEASES}`,
        { signal }
      )
      if (!reply.ok) {
        throw new Error(`releases HTTP ${reply.status}`)
      }
      let newest: { version: string; url: string; code: number } | null = null
      for (const release of releasesSchema.parse(await reply.json())) {
        if (release.draft || !release.tag_name.startsWith(config.releaseTagPrefix)) {
          continue
        }
        for (const asset of release.assets) {
          const match = asset.name.match(BETA_APK_VERSION_CODE)
          const code = match ? Number(match[1]) : null
          if (code !== null && (newest === null || code > newest.code)) {
            newest = { version: betaVersionLabel(code), url: release.html_url, code }
          }
        }
      }
      return newest && isNewerBetaVersion(newest.version, installedVersion)
        ? { kind: 'available', version: newest.version, url: newest.url }
        : { kind: 'current' }
    }
  }
}
