import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  dependencies,
  FakeLogicalClient,
  host,
  relay
} from './mobile-endpoint-supervisor-test-fakes'
import { MobileEndpointSupervisor } from './mobile-endpoint-supervisor'

vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }))
vi.mock('expo-secure-store', () => ({ WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'when-unlocked' }))
vi.mock('expo-crypto', () => ({ getRandomBytes: (length: number) => new Uint8Array(length) }))

describe('mobile Relay background opt-in', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-13T12:00:00Z'))
  })

  afterEach(() => vi.useRealTimers())

  it('keeps an opted-in relay across a two minute app switch without redialing', async () => {
    const logical = new FakeLogicalClient('connected', 'relay')
    const deps = { ...dependencies(), extendBackgroundGrace: () => true }
    const supervisor = new MobileEndpointSupervisor(logical, host.id, relay, deps)
    await supervisor.start()

    supervisor.setForeground(false)
    await vi.advanceTimersByTimeAsync(120_000)
    expect(logical.getState()).toBe('connected')
    expect(logical.suspendActiveSession).not.toHaveBeenCalled()

    supervisor.setForeground(true)
    expect(deps.openRelay).not.toHaveBeenCalled()
    expect(logical.getActivePath()).toBe('relay')
    supervisor.stop()
  })

  // Distinguishes old 5min expiry and never-expire: still healthy past 5min and at 29:59.
  it('keeps an opted-in relay connected beyond five minutes and through 29:59', async () => {
    const logical = new FakeLogicalClient('connected', 'relay')
    const deps = { ...dependencies(), extendBackgroundGrace: () => true }
    const supervisor = new MobileEndpointSupervisor(logical, host.id, relay, deps)
    await supervisor.start()

    supervisor.setForeground(false)
    await vi.advanceTimersByTimeAsync(360_000)
    expect(logical.getState()).toBe('connected')
    expect(logical.suspendActiveSession).not.toHaveBeenCalled()
    expect(deps.openRelay).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1_799_000 - 360_000)
    expect(logical.getState()).toBe('connected')
    expect(logical.suspendActiveSession).not.toHaveBeenCalled()
    expect(deps.openRelay).not.toHaveBeenCalled()
    supervisor.stop()
  })

  it('releases an opted-in relay at thirty minutes without reconnecting in the background', async () => {
    const logical = new FakeLogicalClient('connected', 'relay')
    const deps = { ...dependencies(), extendBackgroundGrace: () => true }
    const supervisor = new MobileEndpointSupervisor(logical, host.id, relay, deps)
    await supervisor.start()

    supervisor.setForeground(false)
    await vi.advanceTimersByTimeAsync(1_799_999)
    expect(logical.suspendActiveSession).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(logical.getState()).toBe('disconnected')
    expect(logical.suspendActiveSession).toHaveBeenCalledOnce()
    expect(deps.openRelay).not.toHaveBeenCalled()

    supervisor.setForeground(true)
    await vi.waitFor(() => expect(deps.openRelay).toHaveBeenCalledOnce())
    expect(logical.getState()).toBe('connected')
    supervisor.stop()
  })

  it('uses the latest opt-in on each background transition', async () => {
    let extended = false
    const logical = new FakeLogicalClient('connected', 'relay')
    const deps = { ...dependencies(), extendBackgroundGrace: () => extended }
    const supervisor = new MobileEndpointSupervisor(logical, host.id, relay, deps)
    await supervisor.start()

    extended = true
    supervisor.setForeground(false)
    await vi.advanceTimersByTimeAsync(60_000)
    supervisor.setForeground(true)
    expect(logical.getState()).toBe('connected')

    extended = false
    supervisor.setForeground(false)
    await vi.advanceTimersByTimeAsync(30_000)
    expect(logical.suspendActiveSession).toHaveBeenCalledOnce()
    expect(deps.openRelay).not.toHaveBeenCalled()
    supervisor.stop()
  })

  // Distinguishes a frozen deadline still pinned to 5min: six wall-clock minutes must not expire.
  it('keeps an opted-in relay on resume after a frozen six-minute gap', async () => {
    const logical = new FakeLogicalClient('connected', 'relay')
    const deps = { ...dependencies(), extendBackgroundGrace: () => true }
    const supervisor = new MobileEndpointSupervisor(logical, host.id, relay, deps)
    await supervisor.start()

    supervisor.setForeground(false)
    vi.setSystemTime(Date.now() + 360_000)
    supervisor.setForeground(true)
    expect(logical.suspendActiveSession).not.toHaveBeenCalled()
    expect(deps.openRelay).not.toHaveBeenCalled()
    expect(logical.getState()).toBe('connected')
    supervisor.stop()
  })

  it('expires an opted-in relay on resume after a frozen thirty-minute background timer', async () => {
    const logical = new FakeLogicalClient('connected', 'relay')
    const deps = { ...dependencies(), extendBackgroundGrace: () => true }
    const supervisor = new MobileEndpointSupervisor(logical, host.id, relay, deps)
    await supervisor.start()

    supervisor.setForeground(false)
    vi.setSystemTime(Date.now() + 1_800_000)
    supervisor.setForeground(true)
    expect(logical.suspendActiveSession).toHaveBeenCalledOnce()
    await vi.waitFor(() => expect(deps.openRelay).toHaveBeenCalledOnce())
    expect(logical.getState()).toBe('connected')
    supervisor.stop()
  })
})
