import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  username: string | null;
  created_at: string;
};

export type Script = {
  id: string;
  user_id: string;
  name: string;
  original_code: string;
  obfuscated_code: string;
  script_key: string;
  executions: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type LicenseKey = {
  id: string;
  user_id: string;
  key_string: string;
  script_id: string | null;
  expiry_type: 'permanent' | 'timed' | 'execution_count';
  expires_at: string | null;
  max_executions: number | null;
  executions_used: number;
  is_active: boolean;
  created_at: string;
};

export type ScriptExecution = {
  id: string;
  script_id: string;
  key_used: string | null;
  user_agent: string;
  ip_hash: string;
  success: boolean;
  executed_at: string;
};
