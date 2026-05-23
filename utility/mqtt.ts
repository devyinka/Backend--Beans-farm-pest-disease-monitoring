import mqtt, { MqttClient } from "mqtt";

//  Hold the live connection in memory
let mqttClient: MqttClient | null = null;

export const connectMQTT = async (): Promise<void> => {
  try {
    const brokerHost = process.env.HiveMQTT_BROKER_URL;
    const brokerPort = process.env.HiveMQTT_BROKER_PORT;
    const username = process.env.HiveMQTT_USERNAME;
    const password = process.env.HiveMQTT_PASSWORD;

    if (!brokerHost || !brokerPort || !username || !password) {
      throw new Error(
        "Missing MQTT env vars. Required: HiveMQTT_BROKER_URL, HiveMQTT_BROKER_PORT, HiveMQTT_USERNAME, HiveMQTT_PASSWORD",
      );
    }

    const port = Number(brokerPort);
    if (!Number.isFinite(port)) {
      throw new Error(`Invalid HiveMQTT_BROKER_PORT: ${brokerPort}`);
    }

    // mqtt.connect expects a fully-qualified URL. Passing a bare hostname may be treated as a path and
    // can result in connecting to localhost.
    const url = brokerHost.includes("://")
      ? brokerHost
      : `mqtts://${brokerHost}:${port}`;

    console.log("Connecting to MQTT broker:", url);

    mqttClient = await mqtt.connectAsync(url, {
      username,
      password,
      protocol: "mqtts",
      reconnectPeriod: 1000,
      connectTimeout: 30_000,
    });
    console.log("Successfully connected to HiveMQ!");
  } catch (error) {
    console.error("Failed to connect to MQTT broker:", error);
    throw error;
  }
};

// Export a reusable publisher function
export const sendCommandToFarm = async (topic: string, payload: object): Promise<void> => {
  if (!mqttClient || !mqttClient.connected) {
    // Try to (re)connect on-demand to avoid failing requests during startup or after disconnects.
    await connectMQTT();
  }

  if (!mqttClient || !mqttClient.connected) {
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
};