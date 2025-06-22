export interface Session {
  id?: string; // Opcional para crear nuevas
  userId: string;
  patientId: string;
  date: string;         // Formato YYYY-MM-DD
  description: string;
}
