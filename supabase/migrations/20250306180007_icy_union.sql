/*
  # Create pixels table for r/place clone

  1. New Tables
    - `pixels`
      - `id` (uuid, primary key)
      - `x` (integer) - X coordinate on canvas
      - `y` (integer) - Y coordinate on canvas
      - `color` (text) - Hex color value
      - `user_id` (text) - ID of user who placed pixel
      - `last_updated` (timestamptz) - When pixel was last updated
      - Unique constraint on (x,y) to ensure one color per coordinate

  2. Security
    - Enable RLS on `pixels` table
    - Add policies for:
      - Anyone can read pixels
      - Anyone can insert/update pixels (with cooldown)
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can read pixels" ON pixels;
  DROP POLICY IF EXISTS "Anyone can insert pixels" ON pixels;
  DROP POLICY IF EXISTS "Anyone can update pixels" ON pixels;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END $$;

-- Create or update the pixels table
CREATE TABLE IF NOT EXISTS pixels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  x integer NOT NULL,
  y integer NOT NULL,
  color text NOT NULL,
  user_id text NOT NULL,
  last_updated timestamptz NOT NULL DEFAULT now(),
  UNIQUE(x, y)
);

-- Enable RLS
ALTER TABLE pixels ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Anyone can read pixels"
  ON pixels
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert pixels"
  ON pixels
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update pixels"
  ON pixels
  FOR UPDATE
  TO public
  USING (
    -- Check if enough time has passed since last update (5 seconds cooldown)
    EXTRACT(EPOCH FROM (now() - last_updated)) >= 5
  )
  WITH CHECK (true);

-- Create index for faster coordinate lookups
CREATE INDEX IF NOT EXISTS pixels_coordinates_idx ON pixels (x, y);