import type {
  FarmAIData,
  FarmInfo,
  FarmSensorReading,
  FarmUpdatePayload,
  PredictionProfile,
  BuildFarmPayloadArgs,
} from "../../type/types";

const normalizePrediction = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "")// Remove leading/trailing non-alphanumeric characters
    .replace(/[^a-z0-9]+/g, " ");// Replace multiple non-alphanumeric characters with a single space

const predictionDictionary: Record<string, PredictionProfile> = {
  healthy: {
    ui_status: "healthy",
    ui_title: "Farm is Healthy",
    spray_action:
      "No action needed — continue routine monitoring every 30 minutes.",
    description:
      "All environmental conditions are within the normal range. Keep monitoring the crop and sensor readings.",
  },
  anthracnose: {
    ui_status: "disease",
    ui_title: "Anthracnose Detected",
    spray_action: "Apply Mancozeb or chlorothalonil fungicide.",
    description:
      "Wet weather and warm temperatures support anthracnose. Remove infected plant material and avoid handling wet plants.",
  },
  aphids: {
    ui_status: "pest",
    ui_title: "Aphid Infestation Warning",
    spray_action: "Spray neem oil or insecticidal soap solution.",
    description:
      "Warm dry weather can attract aphids. Check the undersides of leaves and treat fast before the colony spreads.",
  },
  "bean pod borer": {
    ui_status: "pest",
    ui_title: "Bean Pod Borer Detected",
    spray_action: "Apply cypermethrin or another recommended insecticide.",
    description:
      "Warm temperatures during flowering and pod formation can encourage bean pod borer. Inspect flowers and pods for larvae quickly.",
  },
};

const resolvePredictionProfile = (
  prediction?: string | null,
): PredictionProfile => {
  if (!prediction) {
    return predictionDictionary.healthy;
  }

  const normalized = normalizePrediction(prediction);

  if (normalized === "safe" || normalized === "healthy") {
    return predictionDictionary.healthy;
  }

  return (
    predictionDictionary[normalized] || {
      ui_status: normalized.includes("pest") ? "pest" : "disease",
      ui_title: `${prediction} Detected`,
      spray_action:
        "Inspect the crop and follow the recommended agronomic treatment.",
      description:
        "The AI prediction is not yet mapped in the dictionary, so the farm should be inspected and treated according to local guidance.",
    }
  );
};

// Build the payload for the frontend dashboard with the latest sensor data, AI prediction, and farm info.
export const buildFarmUpdatePayload = ({
  machineLocation,
  temperature,
  humidity,
  rainLevel,
  soilMoisture,
  light_level,
  pollingRateMinutes,
  prediction,
  confidence,
}: BuildFarmPayloadArgs): FarmUpdatePayload => {
  const profile = resolvePredictionProfile(prediction);
  const numericConfidence = Number.isFinite(confidence ?? Number.NaN)
    ? Number(confidence)
    : profile.ui_status === "healthy"
      ? 98.2
      : 80;

  const sensors: FarmSensorReading[] = [
    { id: "temp", label: "Temperature", value: temperature, unit: "°C" },
    { id: "hum", label: "Air Humidity", value: humidity, unit: "%" },
    { id: "rain", label: "Rain Level", value: rainLevel, unit: "mm" },
    { id: "soil", label: "Soil Moisture", value: soilMoisture, unit: "%" },
    { id: "light", label: "Light Level", value: light_level, unit: "Lux" },
  ];

  const aiData: FarmAIData = {
    ui_status: profile.ui_status,
    ui_title: profile.ui_title,
    spray_action: profile.spray_action,
    description: profile.description,
    confidence: numericConfidence,
    sms_alert_sent: profile.ui_status !== "healthy" && numericConfidence >= 80,
  };

  const farmInfo: FarmInfo = {
    name: machineLocation,
    location: machineLocation,
  };

  return {
    timeStamp: new Date().toISOString(),
    datainterval: pollingRateMinutes,
    sensors,
    AIData: aiData,
    farmInfo,
  };
};

export { resolvePredictionProfile };
