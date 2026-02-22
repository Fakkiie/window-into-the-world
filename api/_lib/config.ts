export interface AppConfig {
  appUrl: string;
  fromEmail: string;
  resendApiKey: string;
  resendWebhookSecret: string;
  manualSendSecret: string;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
}

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] as const;

export function getConfig(): AppConfig {
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    appUrl: process.env.APP_URL || 'http://localhost:3000',
    fromEmail: process.env.RESEND_FROM_EMAIL || 'hello@stedycheck.com',
    resendApiKey: process.env.RESEND_API_KEY || '',
    resendWebhookSecret: process.env.RESEND_WEBHOOK_SECRET || '',
    manualSendSecret: process.env.MANUAL_SEND_SECRET || '',
    supabaseUrl: process.env.SUPABASE_URL as string,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  };
}
