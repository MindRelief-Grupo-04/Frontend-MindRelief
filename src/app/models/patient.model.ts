export interface HeartRate {
  current: number;
  status: string;
  history: number[];
}

export interface Patient {
  id: number;
  name: string;
  age: number;
  gender: string;
  session: number;
  room: string;
  heartRate: HeartRate;
  rhythm: string;
}
