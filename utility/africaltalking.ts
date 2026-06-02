import axios from "axios";
import { AlertContext } from "../type/types";
import { buildMessage } from "../helper/message";
import { AUTHSERVICE } from "../Services/Authservice";

// Africa's Talking Credentials Configuration
const AT_API_KEY = process.env.AT_API_KEY!;
const AT_USERNAME = process.env.AT_USERNAME!;
const AT_BASE_URL = "https://api.africastalking.com/version1/messaging";

/**
 * Utility function to sanitize and format numbers for Africa's Talking (+234...)
 */
function formatPhoneNumberForAT(phone: string): string {
  let cleaned = phone.replace(/[\s\-\+]/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "234" + cleaned.slice(1);
  }
  return "+" + cleaned;
}

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
      `[Africa's Talking] ✗ No phone number found for location ${context.machine_location}. Alert not sent.`,
    );
    return { success: false, sids: [], errors: ["No phone number found."] };
  }

  const formattedPhone = formatPhoneNumberForAT(FARMER_PHONE_NUMBER);
  const messageBody = buildMessage(prediction, { ...context, confidence });
  const sids: string[] = [];
  const errors: string[] = [];

  // Africa's Talking requires x-www-form-urlencoded string payloads
  const payload = new URLSearchParams();
  payload.append("username", AT_USERNAME);
  payload.append("to", formattedPhone);
  payload.append("message", messageBody);

  try {
    const response = await axios.post(AT_BASE_URL, payload.toString(), {
      headers: {
        "apiKey": AT_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
    });

    const recipients = response.data.SMSMessageData?.Recipients || [];
    
    if (recipients.length > 0) {
      const recipient = recipients[0];
      // Success states from Africa's Talking gateway
      if (recipient.status === "Success" || recipient.status === "Sent" || recipient.status === "Queued") {
        const messageId = recipient.messageId;
        sids.push(messageId);
        console.log(`[Africa's Talking] ✓ SMS sent to ${formattedPhone} — Message ID: ${messageId}`);
      } else {
        throw new Error(`Gateway rejected with status: ${recipient.status} (Code: ${recipient.statusCode})`);
      }
    } else {
      throw new Error("No recipient payload returned from gateway response.");
    }
  } catch (error: any) {
    const errMsg = `Failed to send to ${formattedPhone}: ${error.response?.data?.Message || error.message}`;
    errors.push(errMsg);
    console.error(`[Africa's Talking] ✗ ${errMsg}`);
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

  const formattedPhone = formatPhoneNumberForAT(FARMER_PHONE_NUMBER);
  const time = context.time_of_day === "morning" ? "Morning" : "Evening";
  
  const body =
    `✅ BEAN FARM — ${time} Report [${context.machine_location}]\n` +
    `Beans: ${context.plant_age_days} days (${context.growth_stage.toUpperCase()})\n` +
    `Temp: ${context.max_temp_c}°C | Soil: ${context.soil_moisture_percent}%\n` +
    `Rain: ${context.rain_level_mm}mm\n\n` +
    `All conditions SAFE. No action needed.`;

  const payload = new URLSearchParams();
  payload.append("username", AT_USERNAME);
  payload.append("to", formattedPhone);
  payload.append("message", body);

  try {
    const response = await axios.post(AT_BASE_URL, payload.toString(), {
      headers: {
        "apiKey": AT_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
    });
    
    const recipients = response.data.SMSMessageData?.Recipients || [];
    if (recipients.length > 0 && (recipients[0].status === "Success" || recipients[0].status === "Sent" || recipients[0].status === "Queued")) {
      console.log(`[Africa's Talking] ✓ Safe summary sent to ${formattedPhone}`);
    } else {
      console.error(`[Africa's Talking] ✗ Failed safe summary routing to ${formattedPhone}: ${recipients[0]?.status}`);
    }
  } catch (error: any) {
    console.error(
      `[Africa's Talking] ✗ Failed safe summary to ${formattedPhone}: ${error.response?.data?.Message || error.message}`,
    );
  }
}