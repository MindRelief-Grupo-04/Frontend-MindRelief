import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SessionService } from '../../services/session.service';
import { MonitoringService, MonitoringRecord } from '../../services/monitoring.service';
import { Session } from '../../models/session.model';
import { HeartRate } from '../../models/heartrate.model';

interface SessionAnalytics {
  totalMonitoringSessions: number;
  totalDuration: number; // en segundos
  totalRecords: number;
  avgHeartRateOverall: number;
  minHeartRateOverall: number;
  maxHeartRateOverall: number;
  mostRecentMonitoring?: MonitoringRecord;
  longestSession?: MonitoringRecord;
  healthStatus: 'normal' | 'attention' | 'concern';
  trends: {
    avgTrend: 'stable' | 'increasing' | 'decreasing';
    sessionsThisWeek: number;
  };
}

interface TimeAnalysis {
  morningRecords: HeartRate[];
  afternoonRecords: HeartRate[];
  eveningRecords: HeartRate[];
  avgByTimeOfDay: {
    morning: number;
    afternoon: number;
    evening: number;
  };
}

// Extender MonitoringRecord para incluir showDetails
interface MonitoringRecordWithDetails extends MonitoringRecord {
  showDetails?: boolean;
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css']
})
export class AnalyticsComponent implements OnInit {
  sessionId!: string;
  session!: Session;
  monitoringRecords: MonitoringRecordWithDetails[] = [];
  analytics!: SessionAnalytics;
  timeAnalysis!: TimeAnalysis;
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sessionService: SessionService,
    private monitoringService: MonitoringService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.sessionId = params.get('id') || '';
      this.loadSessionData();
    });
  }

  loadSessionData(): void {
    this.loading = true;
    this.error = '';

    // Cargar datos de la sesión
    this.sessionService.getSession(this.sessionId).subscribe({
      next: (session) => {
        this.session = session;
        this.loadMonitoringData();
      },
      error: (err) => {
        this.error = 'Error al cargar la sesión';
        this.loading = false;
        console.error('Error loading session:', err);
      }
    });
  }

  loadMonitoringData(): void {
    this.monitoringService.getMonitoringRecordsBySession(this.sessionId).subscribe({
      next: (records) => {
        // Convertir a MonitoringRecordWithDetails y agregar showDetails
        this.monitoringRecords = records
          .map(record => ({ ...record, showDetails: false }))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        this.calculateAnalytics();
        this.calculateTimeAnalysis();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los datos de monitoreo';
        this.loading = false;
        console.error('Error loading monitoring data:', err);
      }
    });
  }

  calculateAnalytics(): void {
    if (this.monitoringRecords.length === 0) {
      this.analytics = {
        totalMonitoringSessions: 0,
        totalDuration: 0,
        totalRecords: 0,
        avgHeartRateOverall: 0,
        minHeartRateOverall: 0,
        maxHeartRateOverall: 0,
        healthStatus: 'normal',
        trends: {
          avgTrend: 'stable',
          sessionsThisWeek: 0
        }
      };
      return;
    }

    const totalRecords = this.monitoringRecords.reduce((sum, record) => sum + record.totalRecords, 0);
    const totalDuration = this.monitoringRecords.reduce((sum, record) => sum + record.duration, 0);

    // Obtener todos los registros de frecuencia cardíaca
    const allHeartRates: number[] = [];
    this.monitoringRecords.forEach(record => {
      record.records.forEach(hr => {
        allHeartRates.push(hr.avgHeartRate, hr.minHeartRate, hr.maxHeartRate);
      });
    });

    const avgOverall = allHeartRates.length > 0 ?
      Math.round(allHeartRates.reduce((sum, rate) => sum + rate, 0) / allHeartRates.length) : 0;

    // Calcular tendencia
    const avgTrend = this.calculateTrend();

    // Calcular sesiones de esta semana
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const sessionsThisWeek = this.monitoringRecords.filter(record =>
      new Date(record.createdAt).getTime() > oneWeekAgo
    ).length;

    this.analytics = {
      totalMonitoringSessions: this.monitoringRecords.length,
      totalDuration,
      totalRecords,
      avgHeartRateOverall: avgOverall,
      minHeartRateOverall: allHeartRates.length > 0 ? Math.min(...allHeartRates) : 0,
      maxHeartRateOverall: allHeartRates.length > 0 ? Math.max(...allHeartRates) : 0,
      mostRecentMonitoring: this.monitoringRecords[0],
      longestSession: this.monitoringRecords.reduce((longest, current) =>
        current.duration > longest.duration ? current : longest
      ),
      healthStatus: this.determineHealthStatus(avgOverall),
      trends: {
        avgTrend,
        sessionsThisWeek
      }
    };
  }

  calculateTimeAnalysis(): void {
    const morningRecords: HeartRate[] = [];
    const afternoonRecords: HeartRate[] = [];
    const eveningRecords: HeartRate[] = [];

    this.monitoringRecords.forEach(record => {
      record.records.forEach(hr => {
        // ✅ CORRECCIÓN: Usar el timestamp correcto para el análisis temporal
        const timestamp = this.getTimestampForAnalysis(hr);
        const hour = new Date(timestamp).getHours();

        if (hour >= 6 && hour < 12) {
          morningRecords.push(hr);
        } else if (hour >= 12 && hour < 18) {
          afternoonRecords.push(hr);
        } else {
          eveningRecords.push(hr);
        }
      });
    });

    const calculateAvg = (records: HeartRate[]) => {
      if (records.length === 0) return 0;
      return Math.round(records.reduce((sum, r) => sum + r.avgHeartRate, 0) / records.length);
    };

    this.timeAnalysis = {
      morningRecords,
      afternoonRecords,
      eveningRecords,
      avgByTimeOfDay: {
        morning: calculateAvg(morningRecords),
        afternoon: calculateAvg(afternoonRecords),
        evening: calculateAvg(eveningRecords)
      }
    };
  }

  /**
   * ✅ NUEVA FUNCIÓN: Obtiene el timestamp correcto para análisis temporal
   * Prioriza localTimestamp, luego recordedAt, luego syncTimestamp
   */
  private getTimestampForAnalysis(hr: HeartRate): number {
    // Prioridad: localTimestamp > recordedAt > syncTimestamp
    if (hr.localTimestamp) {
      return hr.localTimestamp;
    }
    if (hr.recordedAt) {
      return hr.recordedAt;
    }
    if (hr.syncTimestamp) {
      return hr.syncTimestamp;
    }

    // Fallback: usar timestamp actual
    console.warn('No se encontró timestamp válido para el registro:', hr);
    return Date.now();
  }

  calculateTrend(): 'stable' | 'increasing' | 'decreasing' {
    if (this.monitoringRecords.length < 2) return 'stable';

    const recentRecords = this.monitoringRecords.slice(0, 3);
    const avgRates = recentRecords.map(r => r.avgHeartRate || 0);

    const firstHalf = avgRates.slice(0, Math.ceil(avgRates.length / 2));
    const secondHalf = avgRates.slice(Math.ceil(avgRates.length / 2));

    const firstAvg = firstHalf.reduce((sum, rate) => sum + rate, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, rate) => sum + rate, 0) / secondHalf.length;

    const difference = secondAvg - firstAvg;

    if (Math.abs(difference) < 5) return 'stable';
    return difference > 0 ? 'increasing' : 'decreasing';
  }

  determineHealthStatus(avgRate: number): 'normal' | 'attention' | 'concern' {
    if (avgRate >= 60 && avgRate <= 100) return 'normal';
    if ((avgRate >= 50 && avgRate < 60) || (avgRate > 100 && avgRate <= 120)) return 'attention';
    return 'concern';
  }

  getHealthStatusText(): string {
    switch (this.analytics.healthStatus) {
      case 'normal': return 'Normal';
      case 'attention': return 'Requiere atención';
      case 'concern': return 'Preocupante';
      default: return 'Sin datos';
    }
  }

  getHealthStatusColor(): string {
    switch (this.analytics.healthStatus) {
      case 'normal': return '#10b981';
      case 'attention': return '#f59e0b';
      case 'concern': return '#ef4444';
      default: return '#6b7280';
    }
  }

  getTrendIcon(): string {
    switch (this.analytics.trends.avgTrend) {
      case 'increasing': return '📈';
      case 'decreasing': return '📉';
      default: return '📊';
    }
  }

  getTrendText(): string {
    switch (this.analytics.trends.avgTrend) {
      case 'increasing': return 'Tendencia al alza';
      case 'decreasing': return 'Tendencia a la baja';
      default: return 'Estable';
    }
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Lima'
    });
  }

  formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Lima'
    });
  }

  /**
   * ✅ NUEVA FUNCIÓN: Formatea tiempo usando el timestamp correcto
   */
  formatTimeForRecord(hr: HeartRate): string {
    const timestamp = this.getTimestampForAnalysis(hr);
    return this.formatTime(timestamp);
  }

  goBack(): void {
    this.router.navigate(['/paciente', this.session.patientId, 'sesiones'], {
      queryParams: { name: 'Paciente' }
    });
  }

  deleteMonitoringRecord(recordId: string): void {
    if (confirm('¿Estás seguro de que deseas eliminar este registro de monitoreo?')) {
      this.monitoringService.deleteMonitoringRecord(recordId).subscribe({
        next: () => {
          this.loadMonitoringData();
        },
        error: (err) => {
          console.error('Error deleting monitoring record:', err);
          alert('Error al eliminar el registro');
        }
      });
    }
  }
}
