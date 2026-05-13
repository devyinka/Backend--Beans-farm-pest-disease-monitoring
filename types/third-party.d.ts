declare module "nodemailer" {
  export interface TransportAuth {
    user?: string;
    pass?: string;
  }

  export interface TransportOptions {
    host?: string;
    port?: number;
    secure?: boolean;
    auth?: TransportAuth;
  }

  export interface SendMailOptions {
    from?: string;
    to?: string;
    subject?: string;
    text?: string;
  }

  export interface Transporter {
    sendMail(mailOptions: SendMailOptions): Promise<unknown>;
  }

  export function createTransport(options: TransportOptions): Transporter;

  const nodemailer: {
    createTransport: typeof createTransport;
  };

  export default nodemailer;
}

declare module "mongoose-sequence" {
  import type mongoose from "mongoose";

  type SequencePlugin = (schema: mongoose.Schema, options?: Record<string, unknown>) => void;

  type SequenceFactory = (mongooseInstance: typeof mongoose) => SequencePlugin;

  const AutoincrementFactory: SequenceFactory;

  export default AutoincrementFactory;
}