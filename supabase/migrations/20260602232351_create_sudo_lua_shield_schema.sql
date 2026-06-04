/*
  # Sudo Lua Shield - Core Schema

  ## Summary
  Creates the core tables for the Sudo Lua Shield application: a Lua script protection,
  obfuscation, and key-gating service.

  ## New Tables

  ### profiles
  - Stores public user profile data linked to auth.users
  - `id` (uuid, PK, references auth.users)
  - `username` (text, optional display name)
  - `plan` (text, default 'free' — free | creator | enterprise)
  - `created_at` (timestamptz)

  ### scripts
  - Stores user-uploaded Lua scripts and their obfuscated variants
  - `id` (uuid, PK)
  - `user_id` (uuid, FK → profiles.id)
  - `name` (text, script display name)
  - `original_code` (text, raw Lua source)
  - `obfuscated_code` (text, processed/obfuscated output)
  - `script_key` (text, unique short identifier used in loadstring URL)
  - `executions` (int, execution counter)
  - `is_active` (bool, whether the endpoint is live)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### license_keys
  - Stores generated license keys for key-gating scripts
  - `id` (uuid, PK)
  - `user_id` (uuid, FK → profiles.id)
  - `key_string` (text, unique key like kaoru-key-XXXX)
  - `script_id` (uuid, optional FK → scripts.id)
  - `expiry_type` (text — permanent | timed | execution_count)
  - `expires_at` (timestamptz, nullable)
  - `max_executions` (int, nullable)
  - `executions_used` (int, default 0)
  - `is_active` (bool, default true)
  - `created_at` (timestamptz)

  ### script_executions
  - Audit log of every script execution attempt
  - `id` (uuid, PK)
  - `script_id` (uuid, FK → scripts.id)
  - `key_used` (text, nullable)
  - `user_agent` (text)
  - `ip_hash` (text, hashed for privacy)
  - `success` (bool)
  - `executed_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
  - script_executions can be read by the script owner
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text,
  plan text NOT NULL DEFAULT 'free',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Scripts table
CREATE TABLE IF NOT EXISTS scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Untitled Script',
  original_code text NOT NULL DEFAULT '',
  obfuscated_code text NOT NULL DEFAULT '',
  script_key text UNIQUE NOT NULL,
  executions integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own scripts"
  ON scripts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scripts"
  ON scripts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scripts"
  ON scripts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scripts"
  ON scripts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow public read for active scripts (needed for executor delivery endpoint)
CREATE POLICY "Anyone can read active scripts by key"
  ON scripts FOR SELECT
  TO anon
  USING (is_active = true);

-- License keys table
CREATE TABLE IF NOT EXISTS license_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  key_string text UNIQUE NOT NULL,
  script_id uuid REFERENCES scripts(id) ON DELETE SET NULL,
  expiry_type text NOT NULL DEFAULT 'permanent',
  expires_at timestamptz,
  max_executions integer,
  executions_used integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE license_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own keys"
  ON license_keys FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own keys"
  ON license_keys FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own keys"
  ON license_keys FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own keys"
  ON license_keys FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Script executions audit log
CREATE TABLE IF NOT EXISTS script_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id uuid NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  key_used text,
  user_agent text NOT NULL DEFAULT '',
  ip_hash text NOT NULL DEFAULT '',
  success boolean NOT NULL DEFAULT false,
  executed_at timestamptz DEFAULT now()
);

ALTER TABLE script_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Script owners can read executions"
  ON script_executions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scripts
      WHERE scripts.id = script_executions.script_id
      AND scripts.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert execution logs"
  ON script_executions FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated can insert execution logs"
  ON script_executions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scripts_user_id ON scripts(user_id);
CREATE INDEX IF NOT EXISTS idx_scripts_script_key ON scripts(script_key);
CREATE INDEX IF NOT EXISTS idx_license_keys_user_id ON license_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_license_keys_key_string ON license_keys(key_string);
CREATE INDEX IF NOT EXISTS idx_script_executions_script_id ON script_executions(script_id);

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, username)
  VALUES (new.id, split_part(new.email, '@', 1))
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
