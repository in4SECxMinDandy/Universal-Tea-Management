import { afterEach, describe, expect, it, vi } from 'vitest'

import { PerformanceMonitor } from './monitor'

describe('PerformanceMonitor', () => {
  const originalNodeEnv = process.env.NODE_ENV

  afterEach(() => {
    vi.unstubAllEnvs()
    process.env.NODE_ENV = originalNodeEnv
  })

  it('tracks averages in development only', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const monitor = new PerformanceMonitor()

    monitor.trackQueryTime('foods', 20)
    monitor.trackQueryTime('foods', 40)

    expect(monitor.getAverageByName('query:foods')).toBe(30)
  })

  it('does not track metrics outside development', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const monitor = new PerformanceMonitor()

    monitor.trackQueryTime('foods', 20)

    expect(monitor.getMetrics()).toHaveLength(0)
  })

  it('calculates cache hit rate', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const monitor = new PerformanceMonitor()

    monitor.trackCacheHit('foods', true)
    monitor.trackCacheHit('foods', false)
    monitor.trackCacheHit('foods', true)

    expect(monitor.getCacheHitRate('foods')).toBeCloseTo(2 / 3)
  })
})
