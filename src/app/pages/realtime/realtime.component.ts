import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Session } from '../../models/session.model';
import { HeartRate } from '../../models/heartrate.model';
import { Subscription, interval } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SessionService } from '../../services/session.service';
import { MonitoringService, MonitoringRecord } from '../../services/monitoring.service';

@Component({
  selector: 'app-realtime',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './realtime.component.html',
  styleUrls: ['./realtime.component.css'],
  providers: [DatePipe]
})
export class RealtimeComponent implements OnInit, OnDestroy {
  sessionId!: string;
  session!: Session;
  patientName = '';
  monitoring = false;
  startTime = 0; // Timestamp UTC de inicio del monitoreo
  startTimeLocal = 0; // Hora de inicio en zona horaria local para mostrar
  records: HeartRate[] = [];
  allRecords: HeartRate[] = []; // Todos los registros para debugging
  sub?: Subscription;
  monitoringDuration = 0; // Duración del monitoreo en segundos
  lastProcessedId = 0; // ID del último registro procesado para evitar duplicados

  currentTime: Date = new Date(); // Tiempo actual
  currentTimeLocal: Date = new Date(); // Tiempo actual en Perú

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private sessionService: SessionService,
    private monitoringService: MonitoringService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.sessionId = params.get('sessionId') || '';
      this.loadSession();
    });

    // Actualiza la hora actual cada segundo
    setInterval(() => {
      this.currentTime = new Date();
      this.currentTimeLocal = this.getPeruCurrentTime();

      // Actualizar duración del monitoreo si está activo
      if (this.monitoring && this.startTime > 0) {
        this.monitoringDuration = Math.floor((Date.now() - this.startTime) / 1000);
      }
    }, 1000);
  }

  /**
   * Obtiene la hora actual de Perú (UTC-5)
   */
  getPeruCurrentTime(): Date {
    const now = new Date();
    // Perú está en UTC-5 (5 horas atrás de UTC)
    const peruTime = new Date(now.getTime() - (5 * 60 * 60 * 1000));
    return peruTime;
  }

  /**
   * Convierte timestamp UTC a hora local de Perú
   */
  convertToPeruTime(timestamp: number): Date {
    const utcTime = new Date(timestamp);
    return new Date(utcTime.getTime() - (5 * 60 * 60 * 1000));
  }

  /**
   * Formatea la duración en formato HH:MM:SS
   */
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  loadSession(): void {
    this.sessionService.getSession(this.sessionId).subscribe(s => {
      this.session = s;
      this.patientName = this.session.patientId; // Puedes cambiar por nombre real si lo tienes
      console.log('Sesión cargada:', this.session);
    });
  }

  startMonitoring(): void {
    this.monitoring = true;
    this.startTime = Date.now(); // Timestamp UTC para comparaciones
    this.startTimeLocal = this.getPeruCurrentTime().getTime(); // Hora local para mostrar
    this.records = [];
    this.allRecords = [];
    this.monitoringDuration = 0;
    this.lastProcessedId = 0; // Resetear el ID del último procesado

    console.log('=== INICIANDO MONITOREO ===');
    console.log('Timestamp UTC de inicio:', this.startTime);
    console.log('Fecha/hora UTC de inicio:', new Date(this.startTime));
    console.log('Hora local de inicio:', new Date(this.startTimeLocal));
    console.log('Hora Perú de inicio:', this.getPeruCurrentTime());

    // Obtener el ID más alto actual para establecer baseline
    this.getLastRecordId().then(lastId => {
      this.lastProcessedId = lastId;
      console.log('Último ID procesado al inicio:', this.lastProcessedId);

      // Cargar datos inmediatamente al iniciar (pero sin datos anteriores)
      this.fetchData();

      // Luego cargar cada 6 segundos
      this.sub = interval(6000).subscribe(() => this.fetchData());
    });
  }

  /**
   * Obtiene el ID más alto de los registros actuales
   */
  async getLastRecordId(): Promise<number> {
    try {
      const data = await this.http.get<HeartRate[]>('https://mindreliefdb.onrender.com/heartRateData').toPromise();
      if (data && data.length > 0) {
        // Encontrar el ID más alto, convirtiendo a número
        const maxId = Math.max(...data.map(record => Number(record.id) || 0));
        console.log('ID más alto encontrado:', maxId);
        return maxId;
      }
      return 0;
    } catch (error) {
      console.error('Error al obtener último ID:', error);
      return 0;
    }
  }

  fetchData(): void {
    console.log('Fetching data...');

    this.http.get<HeartRate[]>('https://mindreliefdb.onrender.com/heartRateData')
      .subscribe({
        next: (data) => {
          console.log('Datos recibidos:', data.length, 'registros');

          this.allRecords = data; // Guardar todos los datos para debugging

          // Filtrar solo registros nuevos (con ID mayor al último procesado)
          // Y que hayan sido creados después del inicio del monitoreo
          const newRecords = data.filter(record => {
            const recordId = Number(record.id) || 0;
            const recordTime = record.syncTimestamp || record.recordedAt;

            // Condiciones para incluir el registro:
            // 1. ID mayor al último procesado (registro nuevo)
            // 2. Timestamp mayor o igual al inicio del monitoreo (creado después de presionar iniciar)
            const isNewRecord = recordId > this.lastProcessedId;
            const isAfterStart = recordTime >= this.startTime;

            if (isNewRecord && isAfterStart) {
              console.log(`✅ Registro NUEVO incluido:`, {
                id: recordId,
                timestamp: recordTime,
                dateTime: new Date(recordTime),
                isNewRecord,
                isAfterStart
              });
              return true;
            } else {
              if (isNewRecord && !isAfterStart) {
                console.log(`❌ Registro nuevo pero anterior al inicio:`, {
                  id: recordId,
                  timestamp: recordTime,
                  startTime: this.startTime,
                  difference: recordTime - this.startTime
                });
              }
              return false;
            }
          });

          console.log('Registros nuevos encontrados:', newRecords.length);

          // Agregar solo los nuevos registros a la lista existente
          if (newRecords.length > 0) {
            // Actualizar el último ID procesado
            const newMaxId = Math.max(...newRecords.map(r => Number(r.id) || 0));
            this.lastProcessedId = newMaxId;

            // Agregar nuevos registros al inicio de la lista (más recientes primero)
            this.records = [...newRecords, ...this.records];

            // Ordenar por timestamp más reciente primero
            this.records.sort((a, b) => {
              const timeA = a.syncTimestamp || a.recordedAt;
              const timeB = b.syncTimestamp || b.recordedAt;
              return timeB - timeA;
            });

            console.log('Total registros en monitoreo:', this.records.length);
            console.log('Último ID procesado actualizado a:', this.lastProcessedId);
          }
        },
        error: (error) => {
          console.error('Error al obtener datos:', error);
        }
      });
  }

  stopMonitoring(): void {
    console.log('=== DETENIENDO MONITOREO ===');
    console.log('Registros capturados:', this.records.length);
    console.log('Duración total:', this.formatDuration(this.monitoringDuration));

    this.monitoring = false;
    this.sub?.unsubscribe();

    // Calcular estadísticas para el registro
    const stats = this.getStatistics();

    // Preparar payload para enviar al backend
    const monitoringRecord: Omit<MonitoringRecord, 'id' | 'createdAt'> = {
      sessionId: this.sessionId,
      patientId: this.session.patientId,
      userId: this.session.userId,
      startTime: this.startTime,
      endTime: Date.now(),
      startTimeLocal: this.startTimeLocal,
      endTimeLocal: this.getPeruCurrentTime().getTime(),
      duration: this.monitoringDuration,
      totalRecords: this.records.length,
      avgHeartRate: stats?.avgHeartRate || 0,
      minHeartRate: stats?.minHeartRate || 0,
      maxHeartRate: stats?.maxHeartRate || 0,
      records: this.records.map(r => ({
        ...r,
        localTimestamp: this.convertToPeruTime(r.syncTimestamp || r.recordedAt).getTime()
      }))
    };

    console.log('Enviando registro de monitoreo:', monitoringRecord);

    // Usar el nuevo servicio de monitoreo
    this.monitoringService.createMonitoringRecord(monitoringRecord)
      .subscribe({
        next: (response) => {
          console.log('Registro de monitoreo guardado exitosamente:', response);
          this.router.navigate(
            ['/paciente', this.session.patientId, 'sesiones'],
            { queryParams: { name: this.patientName } }
          );
        },
        error: (error) => {
          console.error('Error al guardar registro de monitoreo:', error);
          // Aún así navegar de vuelta, pero mostrar mensaje de error
          alert('Hubo un error al guardar los datos del monitoreo. Por favor, inténtalo de nuevo.');

          // Navegar de vuelta a las sesiones
          this.router.navigate(
            ['/paciente', this.session.patientId, 'sesiones'],
            { queryParams: { name: this.patientName } }
          );
        }
      });
  }

  /**
   * Obtiene el color del estado del corazón basado en la frecuencia cardíaca
   */
  getHeartRateColor(avgHeartRate: number): string {
    if (avgHeartRate < 60) return '#3b82f6'; // Azul - Bradicardia
    if (avgHeartRate >= 60 && avgHeartRate <= 100) return '#10b981'; // Verde - Normal
    if (avgHeartRate > 100 && avgHeartRate <= 120) return '#f59e0b'; // Amarillo - Levemente elevado
    return '#ef4444'; // Rojo - Taquicardia
  }

  /**
   * Obtiene el estado de la frecuencia cardíaca
   */
  getHeartRateStatus(avgHeartRate: number): string {
    if (avgHeartRate < 60) return 'Bradicardia';
    if (avgHeartRate >= 60 && avgHeartRate <= 100) return 'Normal';
    if (avgHeartRate > 100 && avgHeartRate <= 120) return 'Levemente elevado';
    return 'Taquicardia';
  }

  /**
   * Calcula estadísticas de los registros
   */
  getStatistics() {
    if (this.records.length === 0) return null;

    const avgRates = this.records.map(r => r.avgHeartRate);
    const minRates = this.records.map(r => r.minHeartRate);
    const maxRates = this.records.map(r => r.maxHeartRate);

    return {
      totalRecords: this.records.length,
      avgHeartRate: Math.round(avgRates.reduce((a, b) => a + b, 0) / avgRates.length),
      minHeartRate: Math.min(...minRates),
      maxHeartRate: Math.max(...maxRates),
      lastRecord: this.records[0] // El más reciente
    };
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
