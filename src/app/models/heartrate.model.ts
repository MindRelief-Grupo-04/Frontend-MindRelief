// models/heartrate.model.ts
export interface HeartRate {
  id?: string | number;
  deviceId: string;
  avgHeartRate: number;
  minHeartRate: number;
  maxHeartRate: number;
  recordedAt: number;        // Timestamp cuando se registró el dato
  syncTimestamp: number;     // Timestamp cuando se sincronizó
  sessionId?: string;
  patientId?: string;

  // Tiempos específicos para el análisis temporal
  startTime?: number;        // Tiempo de inicio del registro
  endTime?: number;          // Tiempo de fin del registro
  localTimestamp?: number;   // ✅ AGREGADA: Timestamp en hora local (Perú)

  // Propiedades opcionales adicionales
  batteryLevel?: number;
  signalQuality?: number;
  timestamp?: number;        // Por si usas timestamp genérico
  createdAt?: Date;
  updatedAt?: Date;
}
