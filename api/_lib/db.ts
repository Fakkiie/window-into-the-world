import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { AppConfig } from './config.js';

interface Subscriber {
  id: string;
  email: string;
  status: 'active' | 'unsubscribed';
}

interface Prompt {
  id: string;
  prompt_text: string;
  sent_at: string;
}

interface CreateResponseInput {
  subscriber_id: string;
  prompt_id?: string;
  from_email: string;
  subject?: string;
  body_text: string;
  received_at: string;
}

export function createDb(config: AppConfig): SupabaseClient {
  return createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });
}

export function normalizeEmail(email = ''): string {
  return String(email).trim().toLowerCase();
}

export async function upsertSubscriber(supabase: SupabaseClient, email: string): Promise<Subscriber> {
  const normalized = normalizeEmail(email);
  const { data, error } = await supabase
    .from('subscribers')
    .upsert(
      {
        email: normalized,
        status: 'active',
      },
      {
        onConflict: 'email',
        ignoreDuplicates: false,
      }
    )
    .select('id,email,status')
    .single<Subscriber>();

  if (error) throw error;
  return data;
}

export async function findSubscriberByEmail(supabase: SupabaseClient, email: string): Promise<Subscriber | null> {
  const normalized = normalizeEmail(email);
  const { data, error } = await supabase
    .from('subscribers')
    .select('id,email,status')
    .eq('email', normalized)
    .maybeSingle<Subscriber>();

  if (error) throw error;
  return data;
}

export async function createResponse(supabase: SupabaseClient, payload: CreateResponseInput): Promise<void> {
  const { error } = await supabase.from('responses').insert(payload);
  if (error) throw error;
}

export async function getActiveSubscribers(supabase: SupabaseClient): Promise<Array<Pick<Subscriber, 'id' | 'email'>>> {
  const { data, error } = await supabase
    .from('subscribers')
    .select('id,email')
    .eq('status', 'active')
    .returns<Array<Pick<Subscriber, 'id' | 'email'>>>();

  if (error) throw error;
  return data || [];
}

export async function createPrompt(supabase: SupabaseClient, promptText: string): Promise<Prompt> {
  const { data, error } = await supabase
    .from('prompts')
    .insert({ prompt_text: promptText, sent_at: new Date().toISOString() })
    .select('id,prompt_text,sent_at')
    .single<Prompt>();

  if (error) throw error;
  return data;
}

export async function setLastPromptSentAt(
  supabase: SupabaseClient,
  subscriberIds: string[],
  sentAtIso: string
): Promise<void> {
  if (!subscriberIds.length) return;

  const { error } = await supabase
    .from('subscribers')
    .update({ last_prompt_sent_at: sentAtIso })
    .in('id', subscriberIds);

  if (error) throw error;
}
