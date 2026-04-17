export interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  meta?: Record<string, unknown>
}

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []

  private get enabled() {
    return process.env.NODE_ENV === 'development'
  }

  track(name: string, value: number, meta?: Record<string, unknown>) {
    if (!this.enabled) return

    const metric = { name, value, timestamp: Date.now(), meta }
    this.metrics.push(metric)

    if (typeof console !== 'undefined') {
      console.debug(`[perf] ${name}: ${value.toFixed(2)}`, meta ?? '')
    }
  }

  trackCacheHit(name: string, hit: boolean) {
    this.track(`cache:${name}`, hit ? 1 : 0)
  }

  trackQueryTime(name: string, value: number) {
    this.track(`query:${name}`, value)
  }

  trackRenderTime(name: string, value: number) {
    this.track(`render:${name}`, value)
  }

  getAverageByName(name: string) {
    const values = this.metrics.filter((metric) => metric.name === name).map((metric) => metric.value)
    if (values.length === 0) return 0
    return values.reduce((sum, value) => sum + value, 0) / values.length
  }

  getCacheHitRate(name: string) {
    return this.getAverageByName(`cache:${name}`)
  }

  getMetrics() {
    return [...this.metrics]
  }

  reset() {
    this.metrics = []
  }
}

export const performanceMonitor = new PerformanceMonitor()
