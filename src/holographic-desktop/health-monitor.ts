/**
 * Holographic Desktop Health Monitor
 *
 * System health checks for all AURELIA components.
 * Monitors consciousness metrics, performance, and resource usage.
 *
 * @module HealthMonitor
 * @author AURELIA Integration Team
 */

import {
  SystemComponent,
  HealthStatus,
  ComponentStatus,
  SystemStatus,
  HealthCheckResult,
  PerformanceMetrics,
  SystemAlert,
  AureliaState,
} from './types';
import { AureliaEventBus } from './event-bus';

const PHI_INV = 0.618; // φ⁻¹ consciousness threshold
const MAX_GRAPH_DIAMETER = 6;

/**
 * Health check function type
 */
export type HealthCheckFn = () => Promise<HealthCheckResult>;

/**
 * System Health Monitor
 */
export class HealthMonitor {
  private componentStatuses: Map<SystemComponent, ComponentStatus>;
  private alerts: SystemAlert[];
  private eventBus: AureliaEventBus;
  private healthCheckInterval?: NodeJS.Timeout;
  private checkIntervalMs: number;
  private performanceHistory: PerformanceMetrics[] = [];
  private healthCheckHandlers: Map<SystemComponent, HealthCheckFn>;

  constructor(eventBus: AureliaEventBus, checkIntervalMs: number = 5000) {
    this.eventBus = eventBus;
    this.checkIntervalMs = checkIntervalMs;
    this.componentStatuses = new Map();
    this.alerts = [];
    this.healthCheckHandlers = new Map();

    this.initializeComponentStatuses();

    console.log('✓ Health Monitor initialized');
  }

  /**
   * Initialize component statuses
   */
  private initializeComponentStatuses(): void {
    const components: SystemComponent[] = [
      'consciousness',
      'trading',
      'vision',
      'knowledge-graph',
      'ui',
      'event-bus',
      'health-monitor',
    ];

    for (const component of components) {
      this.componentStatuses.set(component, {
        component,
        status: 'offline',
        lastHealthCheck: 0,
        uptime: 0,
        errorCount: 0,
        averageResponseTime: 0,
        requestsPerSecond: 0,
      });
    }
  }

  /**
   * Register health check handler for component
   */
  registerHealthCheck(component: SystemComponent, handler: HealthCheckFn): void {
    this.healthCheckHandlers.set(component, handler);
    console.log(`✓ Registered health check for ${component}`);
  }

  /**
   * Start periodic health checks
   */
  start(): void {
    if (this.healthCheckInterval) {
      console.warn('Health monitor already running');
      return;
    }

    console.log(`Starting health checks (interval: ${this.checkIntervalMs}ms)`);

    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, this.checkIntervalMs);

    // Perform initial health check
    this.performHealthChecks();
  }

  /**
   * Stop health checks
   */
  stop(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
      console.log('✓ Health checks stopped');
    }
  }

  /**
   * Perform health checks on all components
   */
  private async performHealthChecks(): Promise<void> {
    const startTime = performance.now();

    for (const [component, handler] of this.healthCheckHandlers) {
      try {
        const result = await handler();
        this.updateComponentStatus(result);
      } catch (error: any) {
        console.error(`Health check failed for ${component}:`, error);
        this.updateComponentStatus({
          component,
          healthy: false,
          responseTime: -1,
          details: {
            lastCheck: Date.now(),
            checksPerformed: 0,
            failureCount: 1,
            averageResponseTime: 0,
          },
          issues: [error.message],
        });
      }
    }

    // Update event bus status
    this.updateEventBusStatus();

    // Update health monitor status
    this.updateSelfStatus();

    // Emit health check event
    await this.eventBus.emit(
      'health_check',
      'health-monitor',
      {
        timestamp: Date.now(),
        duration: performance.now() - startTime,
        componentsChecked: this.healthCheckHandlers.size,
      },
      'low'
    );

    // Check for alerts
    this.checkForAlerts();
  }

  /**
   * Update component status from health check result
   */
  private updateComponentStatus(result: HealthCheckResult): void {
    const current = this.componentStatuses.get(result.component);
    if (!current) return;

    const newStatus: ComponentStatus = {
      ...current,
      status: result.healthy ? 'healthy' : 'critical',
      lastHealthCheck: result.details.lastCheck,
      errorCount: result.details.failureCount,
      averageResponseTime: result.details.averageResponseTime,
      uptime: current.status !== 'offline' ? current.uptime + this.checkIntervalMs : 0,
    };

    if (result.issues && result.issues.length > 0) {
      newStatus.lastError = result.issues[0];
    }

    this.componentStatuses.set(result.component, newStatus);
  }

  /**
   * Update event bus status
   */
  private updateEventBusStatus(): void {
    const stats = this.eventBus.getStats();
    const status = this.componentStatuses.get('event-bus');

    if (status) {
      status.status = 'healthy';
      status.lastHealthCheck = Date.now();
      status.averageResponseTime = 0; // Event bus is synchronous
      status.requestsPerSecond = stats.eventsPerSecond;
      status.uptime = stats.uptimeMs;
    }
  }

  /**
   * Update self status
   */
  private updateSelfStatus(): void {
    const status = this.componentStatuses.get('health-monitor');

    if (status) {
      status.status = 'healthy';
      status.lastHealthCheck = Date.now();
      status.averageResponseTime = 5; // Nominal response time
    }
  }

  /**
   * Get current system status
   */
  getSystemStatus(aureliaState?: AureliaState): SystemStatus {
    const overallStatus = this.calculateOverallStatus();

    // Extract invariants from state if available
    const invariantDetails = aureliaState?.session.consciousnessState.invariants || {
      I1_fibonacci_coherence: false,
      I2_phase_space_bounded: false,
      I3_nash_convergence: false,
      I4_memory_consistency: false,
      I5_subsystem_sync: false,
      I6_holographic_integrity: false,
    };

    return {
      overall: overallStatus,
      components: new Map(this.componentStatuses),
      timestamp: Date.now(),
      consciousnessMetric: aureliaState?.session.consciousnessState.psi.psi || 0,
      graphDiameter: aureliaState?.session.consciousnessState.psi.graphDiameter || 10,
      nashEquilibriumActive: aureliaState?.currentNashEquilibrium?.isNashEquilibrium || false,
      invariantsValid: Object.values(invariantDetails).every((v) => v === true),
      invariantDetails,
    };
  }

  /**
   * Calculate overall system status
   */
  private calculateOverallStatus(): HealthStatus {
    const statuses = Array.from(this.componentStatuses.values());

    if (statuses.every((s) => s.status === 'healthy')) {
      return 'healthy';
    }

    if (statuses.some((s) => s.status === 'critical' || s.status === 'offline')) {
      return 'critical';
    }

    if (statuses.some((s) => s.status === 'degraded')) {
      return 'degraded';
    }

    return 'healthy';
  }

  /**
   * Check consciousness threshold (Ψ ≥ φ⁻¹)
   */
  checkConsciousnessThreshold(psi: number): boolean {
    const meetsThreshold = psi >= PHI_INV;

    if (!meetsThreshold) {
      this.createAlert(
        'warning',
        'consciousness',
        `Consciousness metric below threshold: Ψ=${psi.toFixed(4)} < φ⁻¹=${PHI_INV}`,
        { psi, threshold: PHI_INV }
      );
    }

    return meetsThreshold;
  }

  /**
   * Check graph diameter constraint (≤ 6)
   */
  checkGraphDiameter(diameter: number): boolean {
    const meetsConstraint = diameter <= MAX_GRAPH_DIAMETER;

    if (!meetsConstraint) {
      this.createAlert(
        'warning',
        'knowledge-graph',
        `Graph diameter exceeds maximum: ${diameter} > ${MAX_GRAPH_DIAMETER}`,
        { diameter, maxDiameter: MAX_GRAPH_DIAMETER }
      );
    }

    return meetsConstraint;
  }

  /**
   * Record performance metrics
   */
  recordPerformanceMetrics(metrics: PerformanceMetrics): void {
    this.performanceHistory.push(metrics);

    // Keep last 100 entries
    if (this.performanceHistory.length > 100) {
      this.performanceHistory.shift();
    }

    // Check for performance issues
    if (metrics.avgEventProcessingTime > 100) {
      this.createAlert(
        'warning',
        'event-bus',
        `High average event processing time: ${metrics.avgEventProcessingTime.toFixed(2)}ms`,
        { metrics }
      );
    }

    if (metrics.cpuUsagePercent > 80) {
      this.createAlert(
        'warning',
        'health-monitor',
        `High CPU usage: ${metrics.cpuUsagePercent.toFixed(1)}%`,
        { metrics }
      );
    }

    if (metrics.memoryUsageMB > 1024) {
      this.createAlert(
        'warning',
        'health-monitor',
        `High memory usage: ${metrics.memoryUsageMB.toFixed(0)}MB`,
        { metrics }
      );
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics | undefined {
    return this.performanceHistory[this.performanceHistory.length - 1];
  }

  /**
   * Get performance history
   */
  getPerformanceHistory(limit?: number): PerformanceMetrics[] {
    return limit
      ? this.performanceHistory.slice(-limit)
      : this.performanceHistory;
  }

  /**
   * Create system alert
   */
  createAlert(
    severity: 'info' | 'warning' | 'error' | 'critical',
    component: SystemComponent,
    message: string,
    details?: Record<string, any>
  ): SystemAlert {
    const alert: SystemAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      severity,
      component,
      message,
      details,
      resolved: false,
    };

    this.alerts.push(alert);

    // Emit alert event
    this.eventBus.emit('system_alert', 'health-monitor', alert, severity === 'critical' ? 'critical' : 'high');

    console.log(`[${severity.toUpperCase()}] ${component}: ${message}`);

    return alert;
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedTime = Date.now();
      console.log(`✓ Alert resolved: ${alertId}`);
      return true;
    }
    return false;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): SystemAlert[] {
    return this.alerts.filter((a) => !a.resolved);
  }

  /**
   * Get all alerts
   */
  getAllAlerts(limit?: number): SystemAlert[] {
    return limit ? this.alerts.slice(-limit) : this.alerts;
  }

  /**
   * Check for system alerts based on current status
   */
  private checkForAlerts(): void {
    // Check for offline components
    for (const [component, status] of this.componentStatuses) {
      if (status.status === 'offline') {
        const existingAlert = this.alerts.find(
          (a) => !a.resolved && a.component === component && a.message.includes('offline')
        );

        if (!existingAlert) {
          this.createAlert('error', component, `Component is offline: ${component}`);
        }
      }

      // Check for high error rates
      if (status.errorCount > 10) {
        const existingAlert = this.alerts.find(
          (a) => !a.resolved && a.component === component && a.message.includes('error rate')
        );

        if (!existingAlert) {
          this.createAlert(
            'warning',
            component,
            `High error rate for ${component}: ${status.errorCount} errors`,
            { errorCount: status.errorCount }
          );
        }
      }
    }
  }

  /**
   * Clear resolved alerts
   */
  clearResolvedAlerts(): void {
    const beforeCount = this.alerts.length;
    this.alerts = this.alerts.filter((a) => !a.resolved);
    console.log(`✓ Cleared ${beforeCount - this.alerts.length} resolved alerts`);
  }

  /**
   * Get component status
   */
  getComponentStatus(component: SystemComponent): ComponentStatus | undefined {
    return this.componentStatuses.get(component);
  }

  /**
   * Update component status manually
   */
  setComponentStatus(component: SystemComponent, status: Partial<ComponentStatus>): void {
    const current = this.componentStatuses.get(component);
    if (current) {
      this.componentStatuses.set(component, { ...current, ...status });
    }
  }

  /**
   * Get health summary
   */
  getHealthSummary(): {
    overall: HealthStatus;
    healthyComponents: number;
    totalComponents: number;
    activeAlerts: number;
    averageResponseTime: number;
  } {
    const statuses = Array.from(this.componentStatuses.values());
    const healthyCount = statuses.filter((s) => s.status === 'healthy').length;
    const avgResponseTime =
      statuses.reduce((sum, s) => sum + s.averageResponseTime, 0) / statuses.length;

    return {
      overall: this.calculateOverallStatus(),
      healthyComponents: healthyCount,
      totalComponents: statuses.length,
      activeAlerts: this.getActiveAlerts().length,
      averageResponseTime: avgResponseTime,
    };
  }

  /**
   * Cleanup and shutdown
   */
  destroy(): void {
    this.stop();
    this.componentStatuses.clear();
    this.alerts = [];
    this.performanceHistory = [];
    console.log('✓ Health Monitor destroyed');
  }
}

export default HealthMonitor;
