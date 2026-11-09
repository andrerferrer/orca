import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const storage = vi.hoisted(() => new Map<string, string>())
const connectMock = vi.hoisted(() => vi.fn())
const openRelayMock = vi.hoisted(() => vi.fn())
const readBundleMock = vi.hoisted(() => vi.fn())

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async (key: string) => storage.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      storage.set(key, value)
    }),
    removeItem: vi.fn(async (key: string) => {
      storage.delete(key)
    })
  }
}))
vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }))
vi.mock('expo-crypto', () => ({ getRandomBytes: (length: number) => new Uint8Array(length) }))
vi.mock('expo-secure-store', () => ({ WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'when-unlocked' }))
vi.mock('expo-network', () => ({
  getIpAddressAsync: vi.fn(async () => '0.0.0.0'),
  getNetworkStateAsync: vi.fn(async () => ({ type: 'NONE' })),
  NetworkStateType: { WIFI: 'WIFI', ETHERNET: 'ETHERNET', NONE: 'NONE' }
}))
vi.mock('../rpc/direct-rpc-connect', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../rpc/direct-rpc-connect')>()),
  connect: (...args: unknown[]) => connectMock(...args)
}))
vi.mock('../relay/mobile-relay-rpc-session', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../relay/mobile-relay-rpc-session')>()),
  connectMobileRelayRpcSession: (...args: unknown[]) => openRelayMock(...args)
}))
vi.mock('../hosts/mobile-relay-credential-bundle', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../hosts/mobile-relay-credential-bundle')>()),
  readMobileRelayCredentialBundle: (...args: unknown[]) => readBundleMock(...args),
  writeMobileRelayCredentialBundle: vi.fn(async () => {})
}))

import { startMobileEndpointLifecycle } from './mobile-endpoint-lifecycle'
import { saveRelayBackgroundExtended } from '../../storage/relay-background-preference'
import {
  bundle,
  FakeLogicalClient,
  FakeSession,
  host
} from './mobile-endpoint-supervisor-test-fakes'

describe('mobile endpoint lifecycle Relay background opt-in', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    storage.clear()
    connectMock.mockImplementation(() => new FakeSession('disconnected'))
    readBundleMock.mockResolvedValue(bundle)
  })

  afterEach(() => vi.useRealTimers())

  it('applies the saved Relay grace to an existing lifecycle on its next background', async () => {
    const logical = new FakeLogicalClient('connected', 'relay')
    const lifecycle = startMobileEndpointLifecycle(logical, host, () => {})
    await vi.advanceTimersByTimeAsync(0)
    await saveRelayBackgroundExtended(true)

    lifecycle.setForeground(false)
    await vi.advanceTimersByTimeAsync(120_000)
    expect(logical.getState()).toBe('connected')
    lifecycle.setForeground(true)
    expect(openRelayMock).not.toHaveBeenCalled()
    lifecycle.stop()
  })
})
