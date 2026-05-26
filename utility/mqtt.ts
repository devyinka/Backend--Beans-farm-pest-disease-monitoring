import mqtt, { MqttClient } from "mqtt";

//  Hold the live connection in memory
let mqttClient: MqttClient | null = null;

export const connectMQTT = async (): Promise<void> => {
  try {
    mqttClient = await mqtt.connectAsync(
      "135e2067aa8b40e7b8ee44698f52f249.s1.eu.hivemq.cloud",
      {
        port: parseInt(process.env.HiveMQTT_BROKER_PORT!),
        username: process.env.HiveMQTT_USERNAME!,
        password: process.env.HiveMQTT_PASSWORD!,
        protocol: "mqtts",
      }
    );
    console.log("Successfully connected to HiveMQ!");
  } catch (error) {
    console.error("Failed to connect to MQTT broker:", error);
    throw error;
  }
};

// Export a reusable publisher function
export const sendCommandToFarm = async (topic: string, payload: object): Promise<Boolean> => {
  if (!mqttClient) {
    throw new Error("Cannot publish: MQTT Client is not connected yet!");
  }

  try {
    const messageString = JSON.stringify(payload);
    await mqttClient.publishAsync(topic, messageString, { qos: 1 });
    
    console.log(`Successfully published to ${topic}:`, payload);
  } catch (error) {
    console.error(`Failed to publish to ${topic}:`, error);
    throw error;
  }
  return true;
};