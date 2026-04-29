import dailyAggregate from "../Models/dailyAggregate";

export const getBeansGrowthStage = (ageDays: number): string => {
  if (ageDays <= 14) return "seedling";
  if (ageDays <= 35) return "vegetative";
  if (ageDays <= 55) return "flowering";
  if (ageDays <= 70) return "pod fill";
  return "harvest";
};

// helper
export const calcLeafWetnessHours = (
  readings: any[],
  avgNightHum: number,
  wetNightStreak: number,
  //   luxThreshold: number,
  pollingRateMinutes: number,
): number => {
  let wetness = 0;
  const hourReading = pollingRateMinutes / 60;
  // Count rainy readings (rain sensor > 0)
  const rainyReadings = readings.filter((r) => r.rainLevel > 0).length;
  wetness += rainyReadings * hourReading; //

  // Night humidity dew contribution
  if (avgNightHum >= 90) wetness += 4.0;
  else if (avgNightHum >= 85) wetness += 2.5;
  else if (avgNightHum >= 75) wetness += 1.0;
  else if (avgNightHum >= 65) wetness += 0.3;

  // Wet night streak bonus (prolonged high humidity = more dew)
  wetness += Math.min(wetNightStreak * 0.4, 3.0);

  return Math.min(Math.round(wetness * 10) / 10, 14.0);
};

// helper calculate cummullative stress index
export const calcStressIndex = (
  hotDays: number,
  wetNights: number,
  drySoilDays: number,
  rainyDays: number,
  floodedDays: number,
): number => {
  const index =
    hotDays * 0.3 +
    wetNights * 0.25 +
    drySoilDays * 0.25 +
    rainyDays * 0.1 +
    floodedDays * 0.1;
  return Math.round(index * 100) / 100;
};

// helper covert lux to sunlight hour

export function calcSunlightHours(
  readings: any[],
  luxThreshold: number,
  timeOfDay: "morning" | "evening",
  pollingRateMinutes: number, // ← comes from config.sensorPollingRateMinutes
): number {
  if (timeOfDay === "morning") return 0;

  const hoursPerReading = pollingRateMinutes / 60; // ← calculated, never hardcoded

  const sunReadings = readings.filter(
    (r) => r.lightLevel > luxThreshold,
  ).length;
  return Math.round(sunReadings * hoursPerReading * 10) / 10;
}

//  HELPER: Get 10-day historical trend from past DailyAggregate records
//
//  Uses evening records only (one complete day record per day).
//  Looks back exactly 10 days from today.

export const get10DaysTrend = async (
  machineLocation: string,
  today: Date,
  config: any,
) => {
  const tenDaysAgo = new Date(today);
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

  // Only use evening records for 10-day trend (one complete record per day)
  const past10 = await dailyAggregate
    .find({
      machine_location: machineLocation,
      time_of_day: "evening",
      date: { $gte: tenDaysAgo, $lt: today },
    })
    .sort({ date: -1 })
    .limit(10)
    .lean();

  const hotDays = past10.filter(
    (d) => d.max_temp_c > config.hotDayTempThreshold,
  ).length;

  const wetNights = past10.filter(
    (d) => d.avg_night_hum_percent > config.wetNightHumThreshold,
  ).length;

  const drySoilDays = past10.filter(
    (d) => d.soil_moisture_percent < config.drySoilThreshold,
  ).length;

  const floodedDays = past10.filter(
    (d) => d.soil_moisture_percent > config.floodedSoilThreshold,
  ).length;

  const rainyDays = past10.filter((d) => d.rain_level_mm > 0).length;

  const totalRainVolume = past10.reduce((sum, d) => sum + d.rain_level_mm, 0);

  return {
    hot_days_past_10_days: hotDays,
    wet_nights_past_10_days: wetNights,
    dry_soil_days_past_10_days: drySoilDays,
    flooded_days_past_10_days: floodedDays,
    rainy_days_past_10_days: rainyDays,
    total_rain_volume_mm_past_10_days: Math.round(totalRainVolume * 10) / 10,
  };
};
