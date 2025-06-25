import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SessionService } from '../../services/session.service';
import { MonitoringService, MonitoringRecord } from '../../services/monitoring.service';
import { PatientService } from '../../services/patient.service'; // ✅ AGREGAR IMPORT
import { Session } from '../../models/session.model';
import { HeartRate } from '../../models/heartrate.model';
import { Patient } from '../../models/patient.model'; // ✅ AGREGAR IMPORT

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
  patient!: Patient; // ✅ AGREGAR PROPIEDAD PARA EL PACIENTE
  patientName = ''; // Se llenará con el nombre real del paciente
  monitoringRecords: MonitoringRecordWithDetails[] = [];
  analytics!: SessionAnalytics;
  timeAnalysis!: TimeAnalysis;
  loading = true;
  error = '';
  now: Date = new Date(); // Para mostrar la hora actual

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sessionService: SessionService,
    private monitoringService: MonitoringService,
    private patientService: PatientService // ✅ INYECTAR PATIENTSERVICE
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.sessionId = params.get('id') || '';
      this.loadSessionData();
    });

    // ✅ MEJORAR: Intentar obtener el nombre desde query params como fallback inicial
    this.route.queryParams.subscribe(params => {
      if (params['name']) {
        this.patientName = params['name'];
      }
    });

    // Actualizar la hora actual cada segundo
    setInterval(() => {
      this.now = new Date();
    }, 1000);
  }

  // ========== FUNCIONES DE FECHA/HORA ==========

  /**
   * Obtiene el offset de Perú (UTC-5)
   */
  private getPeruOffsetMinutes(): number {
    // Perú está en UTC-5, que son -300 minutos desde UTC
    return -300;
  }

  /**
   * Convierte un timestamp UTC a hora local de Perú
   */
  convertUTCToPeruTimestamp(utcTimestamp: number): number {
    return utcTimestamp - (5 * 60 * 60 * 1000);
  }

  /**
   * Convierte un timestamp de Perú a UTC
   */
  private convertPeruToUTCTimestamp(peruTimestamp: number): number {
    // Sumar 5 horas (300 minutos) al timestamp de Perú
    return peruTimestamp + (5 * 60 * 60 * 1000);
  }

  /**
   * Formatea una fecha usando timestamp (asumiendo que ya está en hora de Perú)
   */
  formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-PE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC' // ¡Esta es la clave!
    });
  }

  /**
   * Formatea una hora usando timestamp (asumiendo que ya está en hora de Perú)
   */
  formatTime(timestamp: number): string {
    const date = new Date(timestamp);

    // Forzar a mostrar la hora como si fuera UTC, porque nuestro timestamp
    // ya está ajustado a la hora de Perú
    return date.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'UTC' // ¡Esta es la clave!
    });
  }

  /**
   * Formatea fecha para createdAt (que viene como string ISO UTC)
   */
  formatCreatedAtDate(createdAt: string): string {
    const utcTimestamp = new Date(createdAt).getTime();
    const peruTimestamp = this.convertUTCToPeruTimestamp(utcTimestamp);
    return this.formatDate(peruTimestamp);
  }

  /**
   * Formatea hora para createdAt (que viene como string ISO UTC)
   */
  formatCreatedAtTime(createdAt: string): string {
    const utcTimestamp = new Date(createdAt).getTime();
    const peruTimestamp = this.convertUTCToPeruTimestamp(utcTimestamp);
    return this.formatTime(peruTimestamp);
  }

  /**
   * Formatea fecha y hora completa para createdAt
   */
  formatCreatedAtDateTime(createdAt: string): string {
    const utcTimestamp = new Date(createdAt).getTime();
    const peruTimestamp = this.convertUTCToPeruTimestamp(utcTimestamp);
    const dateStr = this.formatDate(peruTimestamp);
    const timeStr = this.formatTime(peruTimestamp);
    return `${dateStr} a las ${timeStr}`;
  }

  /**
   * Formatea tiempo para un registro específico
   */
  formatTimeForRecord(hr: HeartRate): string {
    // Si tenemos localTimestamp, ya está en hora de Perú
    if (hr.localTimestamp) {
      return this.formatTime(hr.localTimestamp);
    }

    // Si es UTC (syncTimestamp o recordedAt), convertir a Perú
    const timestamp = this.getTimestampForAnalysis(hr);
    const peruTimestamp = this.convertUTCToPeruTimestamp(timestamp);
    return this.formatTime(peruTimestamp);
  }

  /**
   * Obtiene la hora (0-23) para análisis temporal - CORREGIDA
   */
  getPeruHour(hr: HeartRate): number {
    let timestamp: number;

    // Priorizar localTimestamp si existe (ya está en hora de Perú)
    if (hr.localTimestamp) {
      timestamp = hr.localTimestamp;
      // CORRECCIÓN: Usar getUTCHours() para evitar doble conversión
      const date = new Date(timestamp);
      return date.getUTCHours();
    } else {
      // Si no hay localTimestamp, usar UTC y convertir a Perú
      const utcTimestamp = this.getTimestampForAnalysis(hr);
      timestamp = this.convertUTCToPeruTimestamp(utcTimestamp);
      // CORRECCIÓN: También usar getUTCHours() para timestamps convertidos
      const date = new Date(timestamp);
      return date.getUTCHours();
    }
  }

  // ========== FUNCIONES DE CARGA DE DATOS ==========

  loadSessionData(): void {
    this.loading = true;
    this.error = '';

    // Cargar datos de la sesión
    this.sessionService.getSession(this.sessionId).subscribe({
      next: (session) => {
        this.session = session;
        // ✅ CARGAR DATOS DEL PACIENTE USANDO EL patientId DE LA SESIÓN
        this.loadPatientData(session.patientId);
        this.loadMonitoringData();
      },
      error: (err) => {
        this.error = 'Error al cargar la sesión';
        this.loading = false;
        console.error('Error loading session:', err);
      }
    });
  }

  // ✅ NUEVA FUNCIÓN: Cargar datos del paciente
  loadPatientData(patientId: string): void {
    // No convertir a número - mantener como string
    if (!patientId) {
      console.error('ID de paciente no proporcionado');
      this.patientName = 'Paciente desconocido';
      return;
    }

    console.log('Buscando paciente con ID:', patientId); // Debug

    this.patientService.getPatientById(patientId).subscribe({
      next: (patient) => {
        console.log('Paciente encontrado:', patient); // Debug
        this.patient = patient;
        // Simplificar ya que solo tenemos 'name'
        this.patientName = patient?.name || `Paciente ${patientId}`;
      },
      error: (err) => {
        console.error('Error loading patient data:', err);
        // Usar nombre de query params como fallback si está disponible
        this.patientName = this.route.snapshot.queryParams['name'] || `Paciente ${patientId}`;
      }
    });
  }

  loadMonitoringData(): void {
    this.monitoringService.getMonitoringRecordsBySession(this.sessionId).subscribe({
      next: (records) => {
        // Convertir a MonitoringRecordWithDetails y agregar showDetails
        this.monitoringRecords = records
          .map(record => ({ ...record, showDetails: false }))
          .sort((a, b) => {
            // Convertir createdAt a timestamp para comparar correctamente
            const timestampA = new Date(a.createdAt).getTime();
            const timestampB = new Date(b.createdAt).getTime();
            return timestampB - timestampA; // Más reciente primero
          });

        console.log('Registros de monitoreo cargados:', this.monitoringRecords.map(r => ({
          id: r.id,
          createdAt: r.createdAt,
          createdAtTimestamp: new Date(r.createdAt).getTime(),
          createdAtFormatted: this.formatDate(new Date(r.createdAt).getTime())
        })));

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

  // ========== FUNCIONES DE ANÁLISIS ==========

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
    const sessionsThisWeek = this.monitoringRecords.filter(record => {
      const recordTimestamp = new Date(record.createdAt).getTime();
      return recordTimestamp > oneWeekAgo;
    }).length;

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

  /**
   * Análisis temporal usando la hora correcta de Perú - CORREGIDO
   */
  calculateTimeAnalysis(): void {
    const morningRecords: HeartRate[] = [];
    const afternoonRecords: HeartRate[] = [];
    const eveningRecords: HeartRate[] = [];

    this.monitoringRecords.forEach(record => {
      record.records.forEach(hr => {
        const hour = this.getPeruHour(hr);

        // Debug mejorado para verificar la conversión
        console.log('Analizando registro temporal:', {
          deviceId: hr.deviceId,
          localTimestamp: hr.localTimestamp,
          localTimestampFormatted: hr.localTimestamp ? new Date(hr.localTimestamp).toISOString() : 'N/A',
          syncTimestamp: hr.syncTimestamp,
          syncTimestampFormatted: hr.syncTimestamp ? new Date(hr.syncTimestamp).toISOString() : 'N/A',
          recordedAt: hr.recordedAt,
          recordedAtFormatted: hr.recordedAt ? new Date(hr.recordedAt).toISOString() : 'N/A',
          hourInPeru: hour,
          timeFormatted: this.formatTimeForRecord(hr)
        });

        if (hour >= 6 && hour < 12) {
          morningRecords.push(hr);
          console.log(`🌅 Registro categorizado como MAÑANA: ${hour}:xx - ${this.formatTimeForRecord(hr)}`);
        } else if (hour >= 12 && hour < 18) {
          afternoonRecords.push(hr);
          console.log(`☀️ Registro categorizado como TARDE: ${hour}:xx - ${this.formatTimeForRecord(hr)}`);
        } else {
          eveningRecords.push(hr);
          console.log(`🌙 Registro categorizado como NOCHE: ${hour}:xx - ${this.formatTimeForRecord(hr)}`);
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

    console.log('✅ Análisis temporal completado:', {
      morning: {
        count: morningRecords.length,
        avg: this.timeAnalysis.avgByTimeOfDay.morning,
        hours: '6:00-12:00'
      },
      afternoon: {
        count: afternoonRecords.length,
        avg: this.timeAnalysis.avgByTimeOfDay.afternoon,
        hours: '12:00-18:00'
      },
      evening: {
        count: eveningRecords.length,
        avg: this.timeAnalysis.avgByTimeOfDay.evening,
        hours: '18:00-6:00 (incluye 20:28 PM)'
      }
    });
  }

  /**
   * Obtiene el timestamp correcto para análisis temporal
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

  /**
   * Función auxiliar para debugging - muestra las conversiones de tiempo
   */
  debugTimeConversion(createdAt: string): void {
    const utcTimestamp = new Date(createdAt).getTime();
    const peruTimestamp = this.convertUTCToPeruTimestamp(utcTimestamp);

    console.log('Conversión de tiempo:', {
      original: createdAt,
      utcTimestamp: utcTimestamp,
      utcDate: new Date(utcTimestamp).toISOString(),
      utcLocal: new Date(utcTimestamp).toLocaleString('es-PE'),
      peruTimestamp: peruTimestamp,
      peruDate: new Date(peruTimestamp).toISOString(),
      peruLocal: new Date(peruTimestamp).toLocaleString('es-PE'),
      peruFormatted: this.formatCreatedAtDateTime(createdAt)
    });
  }

  /**
   * Función para testing - verifica la conversión del timestamp específico
   */
  testTimestampConversion(): void {
    const testLocalTimestamp = 1750796920941; // Tu timestamp local de ejemplo
    const testUTCTimestamp = 1750814920941; // Tu timestamp UTC de ejemplo

    console.log('Test de conversiones:', {
      localTimestamp: {
        original: testLocalTimestamp,
        date: new Date(testLocalTimestamp).toLocaleString('es-PE'),
        formatted: this.formatTime(testLocalTimestamp),
        expectedTime: '8:38:35 PM'
      },
      utcTimestamp: {
        original: testUTCTimestamp,
        utcDate: new Date(testUTCTimestamp).toISOString(),
        utcLocal: new Date(testUTCTimestamp).toLocaleString('es-PE'),
        convertedToPeruTimestamp: this.convertUTCToPeruTimestamp(testUTCTimestamp),
        convertedFormatted: this.formatTime(this.convertUTCToPeruTimestamp(testUTCTimestamp))
      }
    });

    // Test con tu registro específico
    const testHeartRate: Partial<HeartRate> = {
      localTimestamp: testLocalTimestamp,
      syncTimestamp: testUTCTimestamp,
      avgHeartRate: 75
    };

    console.log('Test formatTimeForRecord:', {
      withLocalTimestamp: this.formatTimeForRecord(testHeartRate as HeartRate),
      withoutLocalTimestamp: this.formatTimeForRecord({...testHeartRate, localTimestamp: undefined} as HeartRate)
    });
  }

  // ========== FUNCIONES DE UTILIDAD ==========

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

  // ========== FUNCIONES DE NAVEGACIÓN Y ACCIONES ==========

  goBack(): void {
    this.router.navigate(['/paciente', this.session.patientId, 'sesiones'], {
      queryParams: { name: this.patientName } // Pasar el nombre completo del paciente
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
