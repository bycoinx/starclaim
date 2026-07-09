import { recordRenderDiagnostic } from './renderDiagnostics';

/**
 * P0.1 Stability Test Logger
 * Logs FPS, frame time, memory, and thermal state during 10-minute test
 */

export class P0StabilityTestLogger {
  constructor() {
    this.logs = [];
    this.startTime = Date.now();
    this.testDurationMs = 10 * 60 * 1000; // 10 minutes
    this.lowFpsThreshold = 30;
    this.lowFpsCount = 0;
    this.crashDetected = false;
  }

  /**
   * Log metrics snapshot at interval
   */
  logSnapshot(metrics, context = {}) {
    const elapsed = Date.now() - this.startTime;
    if (elapsed > this.testDurationMs) {
      console.warn('[P0Test] Test duration exceeded 10 minutes, stopping log');
      return false; // Stop logging
    }

    const snapshot = {
      timestamp: new Date().toISOString(),
      elapsedMs: elapsed,
      fps: metrics.fps,
      frameTime: metrics.frameTime,
      heapUsed: metrics.heapUsed,
      ...context,
    };

    this.logs.push(snapshot);

    // Track low FPS events
    if (metrics.fps < this.lowFpsThreshold) {
      this.lowFpsCount++;
    }

    // Auto-log warning every 60 logs (roughly every 30 seconds at 2Hz log rate)
    if (this.logs.length % 60 === 0) {
      console.log(
        `[P0Test] ${(elapsed / 1000).toFixed(0)}s: FPS=${metrics.fps.toFixed(1)}, Frame=${metrics.frameTime.toFixed(1)}ms, Heap=${(metrics.heapUsed / 1024 / 1024).toFixed(1)}MB, LowFPS#=${this.lowFpsCount}`
      );
    }

    return true; // Continue logging
  }

  /**
   * Generate test report
   */
  generateReport() {
    if (this.logs.length === 0) {
      return {
        status: 'no-data',
        message: 'No metrics logged',
      };
    }

    const fpsValues = this.logs.map((l) => l.fps);
    const frameTimeValues = this.logs.map((l) => l.frameTime);
    const heapValues = this.logs.map((l) => l.heapUsed);

    const minFps = Math.min(...fpsValues);
    const maxFps = Math.max(...fpsValues);
    const avgFps = fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length;

    const maxFrameTime = Math.max(...frameTimeValues);
    const avgFrameTime = frameTimeValues.reduce((a, b) => a + b, 0) / frameTimeValues.length;

    const maxHeap = Math.max(...heapValues);
    const minHeap = Math.min(...heapValues);
    const heapGrowth = maxHeap - minHeap;

    return {
      status: 'pass',
      testDurationMs: this.logs[this.logs.length - 1].elapsedMs,
      metrics: {
        fps: {
          min: minFps.toFixed(1),
          max: maxFps.toFixed(1),
          avg: avgFps.toFixed(1),
          belowThreshold: this.lowFpsCount,
        },
        frameTime: {
          max: maxFrameTime.toFixed(1),
          avg: avgFrameTime.toFixed(1),
        },
        memory: {
          minHeapMB: (minHeap / 1024 / 1024).toFixed(1),
          maxHeapMB: (maxHeap / 1024 / 1024).toFixed(1),
          growthMB: (heapGrowth / 1024 / 1024).toFixed(1),
        },
        crashes: this.crashDetected ? 1 : 0,
      },
      recommendations: this.generateRecommendations(
        minFps,
        heapGrowth,
        this.lowFpsCount,
        this.crashDetected
      ),
    };
  }

  /**
   * QA Acceptance check
   */
  checkAcceptance() {
    const report = this.generateReport();
    if (report.status === 'no-data') return false;

    const metricsOk = {
      // P0.1 Kabul Kriteri:
      minFpsOk: parseFloat(report.metrics.fps.min) >= 30, // Min 30 FPS
      heapGrowthOk: parseFloat(report.metrics.memory.growthMB) < 30, // < 30MB growth
      noFatal: report.metrics.crashes === 0,
    };

    const allOk = Object.values(metricsOk).every((v) => v);
    return {
      accepted: allOk,
      checks: metricsOk,
      report,
    };
  }

  /**
   * Generate recommendations based on test results
   */
  generateRecommendations(minFps, heapGrowth, lowFpsCount, crashed) {
    const recs = [];

    if (minFps < 20) {
      recs.push('❌ Min FPS < 20: Review render optimization, frustum culling, and device profile');
    } else if (minFps < 30) {
      recs.push('⚠️ Min FPS < 30: Consider lowering star count or disabling visual effects on low-end devices');
    } else {
      recs.push('✅ FPS acceptable');
    }

    if (heapGrowth > 30) {
      recs.push(`❌ Memory growth ${heapGrowth.toFixed(1)}MB > 30MB: Likely memory leak in subscription cleanup or canvas disposal`);
    } else if (heapGrowth > 10) {
      recs.push(`⚠️ Memory growth ${heapGrowth.toFixed(1)}MB: Monitor for continued growth over longer tests`);
    } else {
      recs.push('✅ Memory stable');
    }

    if (crashed) {
      recs.push('❌ Crash detected: Review error logs and GL context dispose');
    }

    if (lowFpsCount > this.logs.length * 0.1) {
      recs.push(`⚠️ Low FPS events: ${lowFpsCount} dips (${(lowFpsCount / this.logs.length * 100).toFixed(1)}% of samples)`);
    }

    return recs;
  }

  /**
   * Dump logs as JSON for external analysis
   */
  export() {
    return {
      startTime: new Date(this.startTime).toISOString(),
      logs: this.logs,
      report: this.generateReport(),
      acceptance: this.checkAcceptance(),
    };
  }
}
