import twilio from "twilio";
import { AlertContext } from "../type/types";
import { buildMessage } from "../helper/message";
import { AUTHSERVICE } from "../Services/Authservice";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!,
);

const FROM_PHONE = process.env.TWILIO_FROM_PHONE!;

export async function sendFarmAlert(
  prediction: string,
  confidence: number,
  context: AlertContext,
): Promise<{ success: boolean; sids: string[]; errors: string[] }> {
  const FARMER_PHONE_NUMBER = await AUTHSERVICE.getPhoneNumberByLocation(
    context.machine_location,
  );
  if (!FARMER_PHONE_NUMBER) {
    console.error(
      `[Twilio] ✗ No phone number found for location ${context.machine_location}. Alert not sent.`,
    );
    return { success: false, sids: [], errors: ["No phone number found."] };
  }

  const messageBody = buildMessage(prediction, { ...context, confidence });

  const sids: string[] = [];
  const errors: string[] = [];

  // Send to every configured phone number
  for (const toNumber of [FARMER_PHONE_NUMBER]) {
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

// This function can be called after every AI prediction, even if conditions are safe, to keep farmers informed with a daily summary of their farm's status. It will only send if SEND_SAFE_SMS is set to "true" in the environment variables, allowing you to control whether safe condition summaries are sent out.
export async function sendSafeConditionSummary(
  context: AlertContext,
): Promise<void> {
  if (process.env.SEND_SAFE_SMS !== "true") return;
  const FARMER_PHONE_NUMBER = await AUTHSERVICE.getPhoneNumberByLocation(
    context.machine_location,
  );
  if (!FARMER_PHONE_NUMBER) return;

  const time = context.time_of_day === "morning" ? "Morning" : "Evening";
  const body =
    `✅ BEAN FARM — ${time} Report [${context.machine_location}]\n` +
    `Beans: ${context.plant_age_days} days (${context.growth_stage.toUpperCase()})\n` +
    `Temp: ${context.max_temp_c}°C | Soil: ${context.soil_moisture_percent}%\n` +
    `Rain: ${context.rain_level_mm}mm\n\n` +
    `All conditions SAFE. No action needed.`;

  for (const toNumber of [FARMER_PHONE_NUMBER]) {
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
