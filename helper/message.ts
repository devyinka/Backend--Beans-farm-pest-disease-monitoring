import { AlertContext } from "../type/types";

export const buildMessage = (prediction: string, context: AlertContext): string => {
  const time = context.time_of_day === "morning" ? "Morning" : "Evening";
  const loc = context.machine_location;
  const conf = context.confidence;
  const stage = context.growth_stage.toUpperCase();
  const age = context.plant_age_days;

  // Shared header for all alerts
  const header =
    `⚠ BEAN FARM ALERT [${time}]\n` +
    `Location: ${loc}\n` +
    `Beans: ${age} days old (${stage})\n` +
    `Confidence: ${conf}%\n\n`;

  // ── DISEASES & PESTS (Narrow Set) ───────────────────────────────────────────
  const templates: Record<string, string> = {
    "Disease: Anthracnose":
      header +
      `ANTHRACNOSE FUNGUS DETECTED\n` +
      `Conditions: High humidity and wet weather (${context.rain_level_mm}mm rain) detected.\n` +
      `Action: Activate FUNGICIDE pump (Mancozeb/Chlorothalonil). ` +
      `Avoid working in the field while plants are wet to prevent spreading spores. Remove infected pods.`,

    "Pest: Bean Aphids":
      header +
      `BEAN APHIDS DETECTED\n` +
      `Conditions: Warm, dry weather (${context.max_temp_c}°C) and low soil moisture causing plant stress.\n` +
      `Action: Activate PESTICIDE pump (Neem oil or Insecticidal soap). ` +
      `Inspect the undersides of leaves where aphids cluster. Increase irrigation to reduce drought stress.`,

    "Pest: Bean Pod Borer":
      header +
      `BEAN POD BORER (MARUCA) DETECTED\n` +
      `Conditions: Crop has reached the critical flowering stage (Day ${context.plant_age_days}) with warm temperatures (${context.max_temp_c}°C).\n` +
      `Action: Activate PESTICIDE pump (Cypermethrin). ` +
      `Inspect flowers and developing bean pods for webbing and larvae holes immediately.`
  };

  // Fallback for any prediction not in the template list
  return (
    templates[prediction] ||
    header +
      `ALERT: ${prediction}\n` +
      `Confidence: ${conf}%\n` +
      `Location: ${loc}\n` +
      `Action: Inspect your beans at ${loc} today and consult your agronomist.`
  );
};
