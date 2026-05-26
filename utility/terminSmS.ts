import axios from "axios";
import { AlertContext } from "../type/types";
import { buildMessage } from "../helper/message";
import { AUTHSERVICE } from "../Services/Authservice";


const TERMII_API_KEY = process.env.TERMII_API_KEY!;
const TERMII_SENDER_ID = process.env.TERMII_SENDER_ID || "N-Alert"; 
const TERMII_BASE_URL = process.env.TERMII_BASE_URL;

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
      `[Termii] ✗ No phone number found for location ${context.machine_location}. Alert not sent.`,
    );
    return { success: false, sids: [], errors: ["No phone number found."] };
  }

  const messageBody = buildMessage(prediction, { ...context, confidence });
  const sids: string[] = [];
  const errors: string[] = [];

  // Construct the Termii JSON Payload
  const payload = {
    to: FARMER_PHONE_NUMBER,
    from: TERMII_SENDER_ID,
    sms: messageBody,
    type: "plain",
    channel: "dnd",
    api_key: TERMII_API_KEY,
  };

  try {
    const response = await axios.post(`${TERMII_BASE_URL}/api/sms/send`, payload);
    
    // Termii returns a 'message_id' instead of Twilio's 'sid'
    const messageId = response.data.message_id; 
    sids.push(messageId);
    
    console.log(`[Termii] ✓ SMS sent to ${FARMER_PHONE_NUMBER} — Message ID: ${messageId}`);
  } catch (error: any) {
    // Axios errors contain detailed response data from the server
    const errMsg = `Failed to send to ${FARMER_PHONE_NUMBER}: ${error.response?.data?.message || error.message}`;
    errors.push(errMsg);
    console.error(`[Termii] ✗ ${errMsg}`);
  }

  return {
    success: sids.length > 0,
    sids,
    errors,
  };
}

// Function for Safe Condition Summaries
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

  const payload = {
    to: FARMER_PHONE_NUMBER,
    from: TERMII_SENDER_ID,
    sms: body,
    type: "plain",
    channel: "dnd",
    api_key: TERMII_API_KEY,
  };

  try {
    await axios.post(`${TERMII_BASE_URL}/api/sms/send`, payload);
    console.log(`[Termii] ✓ Safe summary sent to ${FARMER_PHONE_NUMBER}`);
  } catch (error: any) {
    console.error(
      `[Termii] ✗ Failed safe summary to ${FARMER_PHONE_NUMBER}: ${error.response?.data?.message || error.message}`,
    );
  }
}