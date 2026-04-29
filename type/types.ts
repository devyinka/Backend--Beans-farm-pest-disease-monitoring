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
