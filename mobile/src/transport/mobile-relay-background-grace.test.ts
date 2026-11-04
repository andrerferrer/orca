import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  EXTENDED_RELAY_BACKGROUND_GRACE_MS,
  MobileRelayBackgroundGraceTimer,
  RELAY_BACKGROUND_GRACE_MS
} from './mobile-relay-background-grace'

describe('MobileRelayBackgroundGraceTimer', () => {
  afterEach(() => vi.useRealTimers())

  it('expires once after the 30 second grace', async () => {
    vi.useFakeTimers()
    const onExpired = vi.fn()
    const timer = new MobileRelayBackgroundGraceTimer(
      {
        now: Date.now,
        setTimer: (handler, ms) => setTimeout(handler, ms),
        clearTimer: (handle) => clearTimeout(handle)
      },
      onExpired
    )

    timer.arm()
    await vi.advanceTimersByTimeAsync(RELAY_BACKGROUND_GRACE_MS - 1)
    expect(onExpired).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    expect(onExpired).toHaveBeenCalledOnce()
    await vi.advanceTimersByTimeAsync(RELAY_BACKGROUND_GRACE_MS)
    expect(onExpired).toHaveBeenCalledOnce()
  })

  // Distinguishes always-30min-even-opt-out (default path stays 30s) and never-expire / old 5min.
  it('expires once after the thirty minute extended grace when opted in', async () => {
    vi.useFakeTimers()
    const onExpired = vi.fn()
    const timer = new MobileRelayBackgroundGraceTimer(
      {
        now: Date.now,
        setTimer: (handler, ms) => setTimeout(handler, ms),
        clearTimer: (handle) => clearTimeout(handle),
        extendBackgroundGrace: () => true
      },
      onExpired
    )

    timer.arm()
    expect(EXTENDED_RELAY_BACKGROUND_GRACE_MS).toBe(1_800_000)
    await vi.advanceTimersByTimeAsync(360_000)
    expect(onExpired).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(EXTENDED_RELAY_BACKGROUND_GRACE_MS - 360_000 - 1)
    expect(onExpired).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(onExpired).toHaveBeenCalledOnce()
    await vi.advanceTimersByTimeAsync(EXTENDED_RELAY_BACKGROUND_GRACE_MS)
    expect(onExpired).toHaveBeenCalledOnce()
  })

  it('detects expiry on resume when the background timer was suspended', () => {
    vi.useFakeTimers()
    let now = 1_000
    const timer = new MobileRelayBackgroundGraceTimer(
      {
        now: () => now,
        setTimer: vi.fn(() => setTimeout(() => {}, 0)),
        clearTimer: vi.fn()
      },
      vi.fn()
    )

    timer.arm()
    now += RELAY_BACKGROUND_GRACE_MS

    expect(timer.consumeExpired()).toBe(true)
    expect(timer.consumeExpired()).toBe(false)
  })

  it('detects extended expiry on resume after a frozen thirty-minute gap', () => {
    vi.useFakeTimers()
    let now = 1_000
    const timer = new MobileRelayBackgroundGraceTimer(
      {
        now: () => now,
        setTimer: vi.fn(() => setTimeout(() => {}, 0)),
        clearTimer: vi.fn(),
        extendBackgroundGrace: () => true
      },
      vi.fn()
    )

    timer.arm()
    now += 360_000
    expect(timer.consumeExpired()).toBe(false)
    timer.arm()
    now += 1_800_000
    expect(timer.consumeExpired()).toBe(true)
    expect(timer.consumeExpired()).toBe(false)
  })

  it('rejects a stale expiry callback after foreground cancellation and rearming', () => {
    vi.useFakeTimers()
    const callbacks: (() => void)[] = []
    const onExpired = vi.fn()
    const timer = new MobileRelayBackgroundGraceTimer(
      {
        now: () => 1_000,
        setTimer: vi.fn((next) => {
          callbacks.push(next)
          return setTimeout(() => {}, 0)
        }),
        clearTimer: vi.fn((handle) => clearTimeout(handle))
      },
      onExpired
    )

    timer.arm()
    expect(timer.consumeExpired()).toBe(false)
    timer.arm()
    expect(callbacks).toHaveLength(2)
    callbacks[0]()
    expect(onExpired).not.toHaveBeenCalled()

    callbacks[1]()
    expect(onExpired).toHaveBeenCalledOnce()
    expect(timer.consumeExpired()).toBe(false)
  })
})
