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
  soil_moisture: number;
  light_level: number;
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
  timeStamp: string;
  datainterval?: number;
  sensors: FarmSensorReading[];
  AIData: FarmAIData;
  farmInfo: FarmInfo;
}

export interface FarmUpdateResult {
  pollingRateMinutes: number;
  payload: FarmUpdatePayload;
}

export type AlertHistoryRecord = {
  machine_location: string;
  farmstatus: string;
  smsAlertSent: string;
  alertSentAt: Date;
  status: string;
  confidence: number;
  timeStamp: Date;
};

export type PredictionProfile = {
  ui_status: FarmDashboardStatus;
  ui_title: string;
  spray_action: string;
  description: string;
};

export type BuildFarmPayloadArgs = {
  machineLocation: string;
  temperature: number;
  humidity: number;
  rainLevel: number;
  soilMoisture: number;
  light_level: number;
  pollingRateMinutes: number;
  prediction?: string | null;
  confidence?: number | null;
};

export interface TestAIPayload {
  machine_location: string;
  Time_of_Day: number; // 0 for morning, 1 for night
  Growth_Stage: string;
  Plant_Age_Days: number;
  Max_Temp_C: number;
  Min_Temp_C: number;
  Avg_Day_Hum: number;
  Avg_Night_Hum: number;
  Soil_Moisture: number;
  Sunlight_Hours: number;
  Rain_Level_mm: number;
  Leaf_Wetness_Hours: number;
  Cumulative_Stress_Index: number;
  Hot_Days_Past_10_Days: number;
  Wet_Nights_Past_10_Days: number;
  Dry_Soil_Days_Past_10_Days: number;
  Flooded_Days_Past_10_Days: number;
  Rainy_Days_Past_10_Days: number;
  Total_Rain_Volume_mm_Past_10_Days: number;
}