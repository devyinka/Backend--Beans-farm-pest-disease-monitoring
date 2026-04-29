import { AlertContext } from "../type/types";

export const buildMessage = (prediction: string, ctx: AlertContext): string => {
  const time = ctx.time_of_day === "morning" ? "Morning" : "Evening";
  const loc = ctx.machine_location;
  const conf = ctx.confidence;
  const stage = ctx.growth_stage.toUpperCase();
  const age = ctx.plant_age_days;

  // Shared header for all alerts
  const header =
    `⚠ BEAN FARM ALERT [${time}]\n` +
    `Location: ${loc}\n` +
    `Beans: ${age} days old (${stage})\n` +
    `Confidence: ${conf}%\n\n`;

  // ── DISEASES ───────────────────────────────────────────────────────────────
  const templates: Record<string, string> = {
    "Disease: Downy Mildew":
      header +
      `DOWNY MILDEW DETECTED\n` +
      `Conditions: High night humidity (${ctx.avg_night_hum_percent}%) with cool temps.\n` +
      `Action: Apply copper-based fungicide (Ridomil or Dithane M45) immediately. ` +
      `Improve airflow between plants. Avoid evening irrigation.`,

    "Disease: Powdery Mildew":
      header +
      `POWDERY MILDEW DETECTED\n` +
      `Conditions: Moderate humidity with warm temps.\n` +
      `Action: Apply sulfur-based fungicide or potassium bicarbonate spray. ` +
      `Remove heavily infected leaves. Do not wet foliage during application.`,

    "Disease: Anthracnose":
      header +
      `ANTHRACNOSE DETECTED\n` +
      `Conditions: Wet weather (${ctx.rain_level_mm}mm rain) + warm temps.\n` +
      `Action: Apply Mancozeb or chlorothalonil fungicide. ` +
      `Avoid working in field when plants are wet. Remove and destroy infected plant material.`,

    "Disease: Bean Rust":
      header +
      `BEAN RUST DETECTED\n` +
      `Conditions: Moderate temps with high humidity.\n` +
      `Action: Apply triazole or strobilurin fungicide (Bayleton or Amistar). ` +
      `Start from edges of field inward. Check neighbouring farms — rust spreads by wind.`,

    "Disease: Halo Blight":
      header +
      `HALO BLIGHT DETECTED\n` +
      `Conditions: Cool wet weather with heavy rain.\n` +
      `Action: Apply copper bactericide (Kocide or Bordeaux mixture). ` +
      `Do not work in field when plants are wet — this spreads the bacteria. ` +
      `Avoid overhead irrigation.`,

    "Disease: Bacterial Blight":
      header +
      `BACTERIAL BLIGHT DETECTED\n` +
      `Conditions: Warm temps + wet conditions.\n` +
      `Action: Apply copper hydroxide spray. Remove and burn infected leaves. ` +
      `Do not save seeds from infected plants for next planting.`,

    "Disease: Fusarium Wilt":
      header +
      `FUSARIUM WILT DETECTED\n` +
      `Conditions: Warm soil + moderate moisture.\n` +
      `Action: No chemical cure once inside plant. Remove wilting plants immediately ` +
      `to stop spread. Apply Trichoderma biofungicide to soil. ` +
      `Do not replant beans in same soil for 2 seasons.`,

    "Disease: Root Rot":
      header +
      `ROOT ROT DETECTED\n` +
      `Conditions: Waterlogged soil (${ctx.soil_moisture_percent}% moisture).\n` +
      `Action: Improve drainage immediately — create trenches if needed. ` +
      `Apply metalaxyl or fosetyl-aluminium to soil. Reduce irrigation completely.`,

    "Disease: Damping Off (Fungus)":
      header +
      `DAMPING OFF DETECTED\n` +
      `Conditions: Cool wet soil at seedling stage.\n` +
      `Action: Reduce watering immediately. Apply Thiram or Captan seed treatment ` +
      `to remaining seedlings. Improve soil drainage. This kills seedlings fast — act today.`,

    "Disease: White Mold (Sclerotinia)":
      header +
      `WHITE MOLD (SCLEROTINIA) DETECTED\n` +
      `Conditions: Cool temps + very high humidity + dense canopy.\n` +
      `Action: Apply iprodione or boscalid fungicide. ` +
      `Thin out plants to improve air circulation. Avoid overhead irrigation. ` +
      `Remove and destroy all infected tissue — do not compost it.`,

    // ── PESTS ─────────────────────────────────────────────────────────────────

    "Pest: Aphids Infestation":
      header +
      `APHIDS DETECTED\n` +
      `Conditions: Warm dry weather (${ctx.max_temp_c}°C) — typical aphid conditions.\n` +
      `Action: Spray neem oil or insecticidal soap solution. ` +
      `Check undersides of leaves — aphids hide there. ` +
      `Introduce ladybird beetles if available. Avoid excess nitrogen fertiliser.`,

    "Pest: Spider Mites":
      header +
      `SPIDER MITES DETECTED\n` +
      `Conditions: Hot dry weather (${ctx.max_temp_c}°C, low humidity).\n` +
      `Action: Spray water forcefully on leaf undersides to dislodge mites. ` +
      `Apply abamectin or bifenazate miticide. Increase irrigation — ` +
      `mites thrive in dry conditions. Check for webbing on young leaves.`,

    "Pest: Whiteflies":
      header +
      `WHITEFLIES DETECTED\n` +
      `Conditions: Hot weather with low humidity.\n` +
      `Action: Apply imidacloprid or spinosad spray — focus on leaf undersides. ` +
      `Use yellow sticky traps around field edges. ` +
      `Whiteflies spread viruses — act quickly before population explodes.`,

    "Pest: Thrips":
      header +
      `THRIPS DETECTED\n` +
      `Conditions: Hot dry conditions (${ctx.max_temp_c}°C).\n` +
      `Action: Apply spinosad or abamectin insecticide. ` +
      `Blue sticky traps help monitor population. ` +
      `Thrips damage flowers — urgent during flowering stage.`,

    "Pest: Leafhoppers":
      header +
      `LEAFHOPPERS DETECTED\n` +
      `Conditions: Hot weather + low soil moisture.\n` +
      `Action: Apply imidacloprid or lambda-cyhalothrin insecticide. ` +
      `Apply in early morning or evening — not midday heat. ` +
      `Leafhoppers spread bean common mosaic virus.`,

    // ── DISORDERS ─────────────────────────────────────────────────────────────

    "Disorder: Sunscald":
      header +
      `SUNSCALD RISK DETECTED\n` +
      `Conditions: Intense sunlight + high temperature (${ctx.max_temp_c}°C).\n` +
      `Action: Apply light shade cloth (30–50%) over vulnerable plants. ` +
      `Increase irrigation to cool root zone. ` +
      `Water early morning — not midday.`,

    "Disorder: Iron Chlorosis (High pH)":
      header +
      `IRON CHLOROSIS DETECTED — SOIL PH TOO HIGH\n` +
      `Conditions: Soil pH likely above 7.0 — iron unavailable to roots.\n` +
      `Action: Apply iron sulfate (ferrous sulfate) as soil drench or foliar spray. ` +
      `Lower soil pH with sulfur application. ` +
      `Beans prefer pH 6.0–6.8 — test soil this week.`,

    "Disorder: Manganese Toxicity (Low pH)":
      header +
      `MANGANESE TOXICITY DETECTED — SOIL PH TOO LOW\n` +
      `Conditions: Soil pH likely below 5.5 — excess manganese absorbed by roots.\n` +
      `Action: Apply agricultural lime (calcium carbonate) to raise soil pH. ` +
      `Target pH: 6.0–6.8 for beans. ` +
      `Do not apply manganese fertilisers until resolved.`,

    "Disorder: Nitrogen Leaching":
      header +
      `NITROGEN LEACHING RISK DETECTED\n` +
      `Conditions: Heavy rainfall (${ctx.rain_level_mm}mm) washing away soil nitrogen.\n` +
      `Action: Apply top-dress nitrogen fertiliser (urea or CAN) after rain stops. ` +
      `Use split application — smaller doses more often. ` +
      `Consider mulching to slow water runoff.`,

    "Disorder: Blossom Drop (Heavy Rain)":
      header +
      `BLOSSOM DROP RISK — HEAVY RAIN DURING FLOWERING\n` +
      `Conditions: ${ctx.rain_level_mm}mm rain during flowering stage — ` +
      `flowers may be knocked off or pollination disrupted.\n` +
      `Action: Ensure good drainage around plants. ` +
      `Apply foliar boron spray to support flower retention. ` +
      `Monitor pods forming over next 3–5 days.`,

    "Disorder: Heat + Drought Stress":
      header +
      `HEAT AND DROUGHT STRESS DETECTED\n` +
      `Conditions: Temperature ${ctx.max_temp_c}°C + soil moisture only ${ctx.soil_moisture_percent}%.\n` +
      `Action: Irrigate immediately — prioritise this today. ` +
      `Apply mulch to retain soil moisture. ` +
      `Water early morning (before 8AM) or evening (after 6PM). ` +
      `Beans can fail to pod-set above 35°C — this is urgent.`,

    "Disorder: Drought Stress":
      header +
      `DROUGHT STRESS DETECTED\n` +
      `Conditions: Soil moisture critically low (${ctx.soil_moisture_percent}%).\n` +
      `Action: Irrigate immediately. ` +
      `Apply 25–30mm water evenly across field. ` +
      `Add mulch layer to reduce evaporation. ` +
      `Check irrigation system for blockages or leaks.`,
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
