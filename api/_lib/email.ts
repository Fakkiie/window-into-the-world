import { Resend } from 'resend';

export function createEmailClient(apiKey: string): Resend | null {
  return apiKey ? new Resend(apiKey) : null;
}

function welcomeEmailText(): string {
  return [
    'Welcome to Project Connect.',
    'Each week, we share one question and real answers from around the world.',
    '',
    'Reply in any format. Short is fine.',
    '',
    '1) What country are you from (and what city if you want)?',
    '2) What is considered rude in your culture?',
    '3) What do outsiders usually misunderstand?',
    '',
    'Thanks for being here.',
    'Landon',
  ].join('\n');
}

function weeklyPromptText(promptText: string): string {
  return ['This week, one simple question:', '', promptText, '', 'Reply with your answer.', '', 'Landon'].join('\n');
}

interface SendArgs {
  resendClient: Resend | null;
  from: string;
  to: string;
}

export async function sendWelcomeEmail({ resendClient, from, to }: SendArgs): Promise<{ skipped: boolean; id?: string | null }> {
  if (!resendClient) return { skipped: true };

  const result = await resendClient.emails.send({
    from,
    to,
    subject: '🌍 Quick question — where are you from?',
    text: welcomeEmailText(),
    replyTo: from,
  });

  return {
    skipped: false,
    id: result.data?.id || null,
  };
}

interface WeeklyArgs extends SendArgs {
  promptText: string;
}

export async function sendWeeklyPrompt({ resendClient, from, to, promptText }: WeeklyArgs): Promise<{ skipped: boolean; id?: string | null }> {
  if (!resendClient) return { skipped: true };

  const result = await resendClient.emails.send({
    from,
    to,
    subject: `🌎 This week's question: ${promptText}`,
    text: weeklyPromptText(promptText),
    replyTo: from,
  });

  return {
    skipped: false,
    id: result.data?.id || null,
  };
}
