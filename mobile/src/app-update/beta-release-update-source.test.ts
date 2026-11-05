import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { createAppUpdateChecker } from './app-update-checker'
import {
  betaVersionLabel,
  createBetaReleaseUpdateSource,
  isNewerBetaVersion,
  orcaBetaUpdateConfig
} from './beta-release-update-source'

// Recorded from api.github.com/repos/andrerferrer/orca/releases on 2026-11-05, trimmed to the fields read.
const releases = JSON.parse(
  readFileSync(new URL('./fixtures/github-orca-beta-releases.json', import.meta.url), 'utf8')
) as unknown

const RELEASES_URL = 'https://api.github.com/repos/andrerferrer/orca/releases?per_page=30'
const config = {
  versionCode: 27,
  releasesRepo: 'andrerferrer/orca',
  releaseTagPrefix: 'beta-relay-'
}
const signal = new AbortController().signal

function fakeFetch(status: number, body: unknown) {
  const requested: string[] = []
  const fetchImpl: typeof fetch = async (input) => {
    requested.push(String(input))
    return new Response(JSON.stringify(body), { status })
  }
  return { fetchImpl, requested }
}

describe('Orca Beta update config', () => {
  it('reads the overlay extra a Beta build embeds', () => {
    expect(orcaBetaUpdateConfig({ orcaBeta: config, eas: {} })).toEqual(config)
  })

  it('is absent on an upstream build', () => {
    expect(orcaBetaUpdateConfig(undefined)).toBeNull()
    expect(orcaBetaUpdateConfig({ eas: {} })).toBeNull()
  })
})

describe('Beta release source (fork prereleases)', () => {
  it('offers the newest Beta APK on the fork over an older Beta install', async () => {
    const { fetchImpl, requested } = fakeFetch(200, releases)
    const source = createBetaReleaseUpdateSource(fetchImpl, config)

    await expect(source.check(betaVersionLabel(27), signal)).resolves.toEqual({
      kind: 'available',
      version: 'Beta v28',
      url: 'https://github.com/andrerferrer/orca/releases/tag/beta-relay-30min-20261105'
    })
    expect(requested).toEqual([RELEASES_URL])
  })

  it('reports current when the installed Beta is the newest one published', async () => {
    const source = createBetaReleaseUpdateSource(fakeFetch(200, releases).fetchImpl, config)
    await expect(source.check(betaVersionLabel(28), signal)).resolves.toEqual({ kind: 'current' })
  })

  it('ignores drafts, other tags, and releases without a versioned Beta APK', async () => {
    const body = [
      {
        tag_name: 'beta-relay-30min-20261201',
        draft: true,
        html_url: 'https://example.test/draft',
        assets: [{ name: 'Orca-Beta-relay-30min-v40.apk' }]
      },
      {
        tag_name: 'mobile-android-v0.0.70',
        draft: false,
        html_url: 'https://example.test/upstream',
        assets: [{ name: 'Orca-Beta-relay-30min-v41.apk' }]
      },
      {
        tag_name: 'beta-relay-20261202',
        draft: false,
        html_url: 'https://example.test/unversioned',
        assets: [{ name: 'Orca-Beta-relay-d03be01c.apk' }]
      }
    ]
    const source = createBetaReleaseUpdateSource(fakeFetch(200, body).fetchImpl, config)
    await expect(source.check(betaVersionLabel(28), signal)).resolves.toEqual({ kind: 'current' })
  })

  it('rejects when GitHub refuses, so the check counts as failed rather than current', async () => {
    const source = createBetaReleaseUpdateSource(fakeFetch(403, {}).fetchImpl, config)
    await expect(source.check(betaVersionLabel(27), signal)).rejects.toThrow('HTTP 403')
  })
})

describe('Beta version compare', () => {
  it('orders Beta labels by versionCode and refuses anything else', () => {
    expect(isNewerBetaVersion('Beta v29', 'Beta v28')).toBe(true)
    expect(isNewerBetaVersion('Beta v28', 'Beta v28')).toBe(false)
    expect(isNewerBetaVersion('Beta v9', 'Beta v28')).toBe(false)
    expect(isNewerBetaVersion('0.0.70', 'Beta v28')).toBe(false)
  })

  it('keeps a stored Beta update available to the checker', () => {
    const latest = { version: 'Beta v29', url: 'https://example.test/v29' }
    const checker = createAppUpdateChecker({
      source: null,
      installedVersion: betaVersionLabel(28),
      isNewerVersion: isNewerBetaVersion,
      now: () => 0,
      setTimer: (run, delayMs) => setTimeout(run, delayMs),
      clearTimer: (handle) => clearTimeout(handle),
      subscribeForeground: () => () => {},
      loadPreferences: async () => ({ lastCheckedAt: 0, latest, dismissedVersion: null }),
      saveCheck: async () => {},
      saveDismissedVersion: async () => {}
    })
    checker.start()
    return expect.poll(() => checker.getSnapshot().available).toEqual(latest)
  })
})
