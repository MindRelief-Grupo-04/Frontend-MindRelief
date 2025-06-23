// models/heartrate.model.ts
export interface HeartRate {
  id?: string;
  deviceId: string;
  avgHeartRate: number;
  minHeartRate: number;
  maxHeartRate: number;
  recordedAt: number;        // Timestamp cuando se registró el dato
  syncTimestamp: number;     // Timestamp cuando se sincronizó
  sessionId?: string;
  patientId?: string;

  // Propiedades opcionales adicionales que podrías tener
  batteryLevel?: number;
  signalQuality?: number;
  timestamp?: number;        // Por si usas timestamp genérico
  createdAt?: Date;
  updatedAt?: Date;
}
