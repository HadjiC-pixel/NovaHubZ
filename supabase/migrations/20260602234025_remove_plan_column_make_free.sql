/*
  # Remove pricing plan system - make Sudo Lua Shield completely free

  ## Changes
  - Remove `plan` column from profiles table
  - All features are now available to all users at no cost
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'plan'
  ) THEN
    ALTER TABLE profiles DROP COLUMN plan;
  END IF;
END $$;
