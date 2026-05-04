export interface sendmail {
  to: string;
  subject: string;
  text: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  created_at: Date;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  created_at: Date;
}

export interface signup {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  password: string;
}

export interface login {
  email: string;
  password: string;
  machine_location: string;
}

export interface newUserprops {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  password: string;
}
export interface AlertContext {
  machine_location: string;
  time_of_day: "morning" | "evening";
  confidence: number;
  plant_age_days: number;
  growth_stage: string;
  max_temp_c: number;
  soil_moisture_percent: number;
  rain_level_mm: number;
  avg_night_hum_percent: number;
}

export interface userdata {
  email: string;
  machine_location: string;
  token: string;
}

export interface RawsensorData {
  machine_location: string;
  temperature: number;
  humidity: number;
  soil_ph: number;
  soil_moisture: number;
  light_intensity: number;
  rain_level: number;
}

export type FarmDashboardStatus = "healthy" | "disease" | "pest";

export interface FarmSensorReading {
  id: string;
  label: string;
  value: number;
  unit: string;
}

export interface FarmAIData {
  ui_status: FarmDashboardStatus;
  ui_title: string;
  spray_action: string;
  description: string;
  confidence: number;
  sms_alert_sent: boolean;
}

export interface FarmInfo {
  name: string;
  location: string;
}

export interface FarmUpdatePayload {
  timestamp: string;
  datainterval?: number;
  sensors: FarmSensorReading[];
  AIData: FarmAIData;
  farmInfo: FarmInfo;
}

export interface FarmUpdateResult {
  pollingRateMinutes: number;
  payload: FarmUpdatePayload;
}
