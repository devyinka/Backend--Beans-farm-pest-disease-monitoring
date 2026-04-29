import twilio from "twilio";
import { AlertContext } from "../type/types";
import { buildMessage } from "../helper/message";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!,
);

const FROM_PHONE = process.env.TWILIO_FROM_PHONE!;
const FARMER_PHONE1 = process.env.FARMER_PHONE1;
const FARMER_PHONE2 = process.env.FARMER_PHONE2;

const FARMER_PHONE_NUMBERS: string[] = [
  FARMER_PHONE1 || "",
  FARMER_PHONE2 || "",
].filter(Boolean);

export async function sendFarmAlert(
  prediction: string,
  confidence: number,
  context: AlertContext,
): Promise<{ success: boolean; sids: string[]; errors: string[] }> {
  if (FARMER_PHONE_NUMBERS.length === 0) {
    console.error("[Twilio] No farmer phone numbers configured in .env");
    return {
      success: false,
      sids: [],
      errors: ["No phone numbers configured"],
    };
  }

  const messageBody = buildMessage(prediction, { ...context, confidence });

  console.log(
    `[Twilio] Sending alert to ${FARMER_PHONE_NUMBERS.length} number(s)...`,
  );
  console.log(`[Twilio] Prediction: ${prediction} (${confidence}%)`);

  const sids: string[] = [];
  const errors: string[] = [];

  // Send to every configured phone number
  for (const toNumber of FARMER_PHONE_NUMBERS) {
    try {
      const message = await client.messages.create({
        body: messageBody,
        from: FROM_PHONE,
        to: toNumber,
      });

      sids.push(message.sid);
      console.log(`[Twilio] ✓ SMS sent to ${toNumber} — SID: ${message.sid}`);
    } catch (error: any) {
      const errMsg = `Failed to send to ${toNumber}: ${error.message}`;
      errors.push(errMsg);
      console.error(`[Twilio] ✗ ${errMsg}`);
    }
  }

  return {
    success: sids.length > 0,
    sids,
    errors,
  };
}

// ════════════════════════════════════════════════════════════════════════════
//  SAFE CONDITION — optional daily summary SMS
//
//  Called from aggregation job when prediction === "Safe"
//  and you want to send a daily "all clear" message.
//  This is OPTIONAL — only runs if SEND_SAFE_SMS=true in .env
// ════════════════════════════════════════════════════════════════════════════
export async function sendSafeConditionSummary(
  context: AlertContext,
): Promise<void> {
  if (process.env.SEND_SAFE_SMS !== "true") return;
  if (FARMER_PHONE_NUMBERS.length === 0) return;

  const time = context.time_of_day === "morning" ? "Morning" : "Evening";
  const body =
    `✅ BEAN FARM — ${time} Report [${context.machine_location}]\n` +
    `Beans: ${context.plant_age_days} days (${context.growth_stage.toUpperCase()})\n` +
    `Temp: ${context.max_temp_c}°C | Soil: ${context.soil_moisture_percent}%\n` +
    `Rain: ${context.rain_level_mm}mm\n\n` +
    `All conditions SAFE. No action needed.`;

  for (const toNumber of FARMER_PHONE_NUMBERS) {
    try {
      await client.messages.create({ body, from: FROM_PHONE, to: toNumber });
      console.log(`[Twilio] ✓ Safe summary sent to ${toNumber}`);
    } catch (error: any) {
      console.error(
        `[Twilio] ✗ Failed safe summary to ${toNumber}: ${error.message}`,
      );
    }
  }
}

export {};
