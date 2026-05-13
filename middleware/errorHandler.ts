import { NextFunction, Request, Response } from "express";

export interface AppError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  const isValidationError = err.name === "ValidationError";
  const isCastError = err.name === "CastError";
  const isDuplicateKeyError = (err as { code?: number }).code === 11000;

  const statusCode =
    err.statusCode ?? (isValidationError || isCastError ? 400 : 500);
  const message =
    isValidationError || isCastError
      ? "Registration failed. Please check the submitted details and try again."
      : isDuplicateKeyError
        ? "An account with this email already exists."
        : process.env.NODE_ENV === "production" && statusCode === 500
          ? "Internal server error."
          : err.message;
  console.error(`[Error ${statusCode}]`, err.message);

  res.status(statusCode).json({ message });
};
