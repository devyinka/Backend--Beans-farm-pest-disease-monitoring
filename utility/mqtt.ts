import mqtt, { MqttClient } from "mqtt";

//  Hold the live connection in memory
let mqttClient: MqttClient | null = null;

export const connectMQTT = async (): Promise<void> => {
  const brokerHost = process.env.HiveMQTT_BROKER_URL;
  const brokerPort = process.env.HiveMQTT_BROKER_PORT;
  const brokerUsername = process.env.HiveMQTT_USERNAME;
  const brokerPassword = process.env.HiveMQTT_PASSWORD;

  if (!brokerHost || !brokerPort || !brokerUsername || !brokerPassword) {
    console.warn("MQTT not configured. Skipping broker connection.");
    return;
  }

  const brokerUrl = brokerHost.startsWith("mqtt://") || brokerHost.startsWith("mqtts://")
    ? brokerHost
    : `mqtts://${brokerHost}:${brokerPort}`;

  try {
    mqttClient = await mqtt.connectAsync(brokerUrl, {
      port: Number.parseInt(brokerPort, 10),
      username: brokerUsername,
      password: brokerPassword,
      protocol: "mqtts",
    });
    console.log("Successfully connected to HiveMQ!");
  } catch (error) {
    console.error("Failed to connect to MQTT broker:", error);
    mqttClient = null;
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