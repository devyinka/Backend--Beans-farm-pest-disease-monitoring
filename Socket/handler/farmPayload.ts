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
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "")
    .replace(/[^a-z0-9]+/g, " ");

const predictionDictionary: Record<string, PredictionProfile> = {
  healthy: {
    ui_status: "healthy",
    ui_title: "Farm is Healthy",
    spray_action:
      "No action needed — continue routine monitoring every 30 minutes.",
    description:
      "All environmental conditions are within the normal range. Keep monitoring the crop and sensor readings.",
  },
  "angular leaf spot": {
    ui_status: "disease",
    ui_title: "Angular Leaf Spot Detected",
    spray_action: "Apply copper-based fungicide.",
    description:
      "Wet, humid conditions favour angular leaf spot. Improve drainage and spray a copper-based fungicide.",
  },
  "downy mildew": {
    ui_status: "disease",
    ui_title: "Downy Mildew Detected",
    spray_action: "Apply copper-based fungicide (Ridomil or Dithane M45).",
    description:
      "High night humidity and cool temperatures are ideal for downy mildew. Improve airflow and avoid evening irrigation.",
  },
  "powdery mildew": {
    ui_status: "disease",
    ui_title: "Powdery Mildew Detected",
    spray_action:
      "Apply sulfur-based fungicide or potassium bicarbonate spray.",
    description:
      "Warm temperatures with moderate humidity can trigger powdery mildew. Remove heavily infected leaves.",
  },
  anthracnose: {
    ui_status: "disease",
    ui_title: "Anthracnose Detected",
    spray_action: "Apply Mancozeb or chlorothalonil fungicide.",
    description:
      "Wet weather and warm temperatures support anthracnose. Remove infected plant material and avoid handling wet plants.",
  },
  "bean rust": {
    ui_status: "disease",
    ui_title: "Bean Rust Detected",
    spray_action: "Apply triazole or strobilurin fungicide.",
    description:
      "Moderate temperatures and high humidity can spread bean rust quickly. Start treatment from the field edges.",
  },
  "halo blight": {
    ui_status: "disease",
    ui_title: "Halo Blight Detected",
    spray_action: "Apply copper bactericide (Kocide or Bordeaux mixture).",
    description:
      "Cool, wet weather and heavy rain are ideal for halo blight. Avoid overhead irrigation.",
  },
  "bacterial blight": {
    ui_status: "disease",
    ui_title: "Bacterial Blight Detected",
    spray_action: "Apply copper hydroxide spray.",
    description:
      "Warm temperatures and wet conditions support bacterial blight. Remove and burn infected leaves.",
  },
  "fusarium wilt": {
    ui_status: "disease",
    ui_title: "Fusarium Wilt Detected",
    spray_action:
      "Remove wilting plants and apply Trichoderma biofungicide to soil.",
    description:
      "Warm soil with moderate moisture can support Fusarium wilt. Replanting in the same soil should be delayed.",
  },
  "root rot": {
    ui_status: "disease",
    ui_title: "Root Rot Detected",
    spray_action: "Improve drainage and apply metalaxyl or fosetyl-aluminium.",
    description:
      "Waterlogged soil can quickly lead to root rot. Reduce irrigation immediately and improve drainage.",
  },
  "damping off": {
    ui_status: "disease",
    ui_title: "Damping Off Detected",
    spray_action: "Reduce watering and apply Thiram or Captan seed treatment.",
    description:
      "Cool wet soil is dangerous for seedlings. Improve drainage and protect the remaining seedlings quickly.",
  },
  "white mold": {
    ui_status: "disease",
    ui_title: "White Mold Detected",
    spray_action: "Apply iprodione or boscalid fungicide.",
    description:
      "Cool temperatures, high humidity, and a dense canopy can trigger white mold. Thin the crop for airflow.",
  },
  aphids: {
    ui_status: "pest",
    ui_title: "Aphid Infestation Warning",
    spray_action: "Spray neem oil or insecticidal soap solution.",
    description:
      "Warm dry weather can attract aphids. Check the undersides of leaves and treat fast before the colony spreads.",
  },
  "spider mites": {
    ui_status: "pest",
    ui_title: "Spider Mites Detected",
    spray_action: "Apply abamectin or bifenazate miticide.",
    description:
      "Hot, dry weather is ideal for spider mites. Increase irrigation and inspect leaf undersides for webbing.",
  },
  whiteflies: {
    ui_status: "pest",
    ui_title: "Whiteflies Detected",
    spray_action: "Apply imidacloprid or spinosad spray.",
    description:
      "Whiteflies spread quickly in hot conditions. Use sticky traps and treat leaf undersides.",
  },
  thrips: {
    ui_status: "pest",
    ui_title: "Thrips Detected",
    spray_action: "Apply spinosad or abamectin insecticide.",
    description:
      "Thrips damage flowers and spreads rapidly in dry heat. Treat early in the morning or evening.",
  },
  leafhoppers: {
    ui_status: "pest",
    ui_title: "Leafhoppers Detected",
    spray_action: "Apply imidacloprid or lambda-cyhalothrin insecticide.",
    description:
      "Leafhoppers can spread bean viruses. Treat in cooler periods and inspect the crop frequently.",
  },
  sunscald: {
    ui_status: "disease",
    ui_title: "Sunscald Risk Detected",
    spray_action: "Use shade cloth and increase irrigation.",
    description:
      "Intense sunlight and high temperature can scorch the crop. Protect vulnerable plants from direct heat.",
  },
  "nitrogen leaching": {
    ui_status: "disease",
    ui_title: "Nitrogen Leaching Risk Detected",
    spray_action: "Apply top-dress nitrogen fertiliser after rain stops.",
    description:
      "Heavy rainfall can wash away soil nitrogen. Split fertiliser applications to reduce losses.",
  },
  "blossom drop": {
    ui_status: "disease",
    ui_title: "Blossom Drop Risk Detected",
    spray_action: "Improve drainage and apply foliar boron spray.",
    description:
      "Heavy rain during flowering can cause blossom drop. Keep the field well drained and monitor pod set.",
  },
  "heat drought stress": {
    ui_status: "disease",
    ui_title: "Heat and Drought Stress Detected",
    spray_action: "Irrigate immediately and apply mulch.",
    description:
      "High temperature and low soil moisture can stop pod set. Prioritise irrigation and conserve moisture.",
  },
  "drought stress": {
    ui_status: "disease",
    ui_title: "Drought Stress Detected",
    spray_action: "Irrigate immediately and add mulch.",
    description:
      "Critically low soil moisture is stressing the crop. Restore water levels and inspect irrigation for faults.",
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
    timestamp: new Date().toISOString(),
    datainterval: pollingRateMinutes,
    sensors,
    AIData: aiData,
    farmInfo,
  };
};

export { resolvePredictionProfile };
