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
      - Public read access
      - Authenticated users can insert pixels
      - Authenticated users can update pixels with 5-second cooldown
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can read pixels" ON pixels;
  DROP POLICY IF EXISTS "Authenticated users can insert pixels" ON pixels;
  DROP POLICY IF EXISTS "Users can update pixels with cooldown" ON pixels;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END $$;

-- Create pixels table
CREATE TABLE IF NOT EXISTS pixels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  x integer NOT NULL,
  y integer NOT NULL,
  color text NOT NULL,
  user_id text NOT NULL,
  last_updated timestamptz DEFAULT now(),
  UNIQUE(x, y)
);

-- Enable RLS
ALTER TABLE pixels ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read pixels
CREATE POLICY "Anyone can read pixels"
  ON pixels
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert pixels
CREATE POLICY "Authenticated users can insert pixels"
  ON pixels
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update pixels with cooldown
CREATE POLICY "Users can update pixels with cooldown"
  ON pixels
  FOR UPDATE
  TO authenticated
  USING (
    -- Check if enough time has passed since last update (5 seconds cooldown)
    EXTRACT(EPOCH FROM (now() - last_updated)) >= 5
  )
  WITH CHECK (true);

-- Create index for faster coordinate lookups
CREATE INDEX IF NOT EXISTS pixels_coordinates_idx ON pixels (x, y);