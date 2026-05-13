const cleanOrigin = (value?: string | null): string | null => {
  const trimmed = value?.trim().replace(/^['\"]|['\"]$/g, "");
  return trimmed ? trimmed : null;
};

export const getAllowedOrigins = (): string[] => {
  const configuredFrontendOrigin = cleanOrigin(process.env.FRONTEND_URL);
  const esp32Origin = cleanOrigin(process.env.ESP32_ORIGIN);
  const extraOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => cleanOrigin(origin))
    .filter((origin): origin is string => Boolean(origin));

  // Keep local development working even if env vars are missing or loaded late.
  const localFallbackOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
  ];

  return Array.from(
    new Set(
      [
        ...localFallbackOrigins,
        configuredFrontendOrigin,
        esp32Origin,
        ...extraOrigins,
      ].filter((origin): origin is string => Boolean(origin)),
    ),
  );
};
