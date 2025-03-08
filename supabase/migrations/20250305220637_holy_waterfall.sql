/*
  # Create pixels table for r/place clone

  1. New Tables
    - `pixels`
      - `id` (uuid, primary key)
      - `x` (integer) - x coordinate
      - `y` (integer) - y coordinate
      - `color` (text) - hex color value
      - `user_id` (text) - user identifier
      - `last_updated` (timestamp) - last update timestamp

  2. Security
    - Enable RLS on `pixels` table
    - Add policy for public read access
    - Add policy for authenticated users to update pixels
*/

CREATE TABLE IF NOT EXISTS pixels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  x integer NOT NULL,
  y integer NOT NULL,
  color text NOT NULL,
  user_id text NOT NULL,
  last_updated timestamptz DEFAULT now(),
  UNIQUE(x, y)
);

ALTER TABLE pixels ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read pixels
CREATE POLICY "Pixels are viewable by everyone"
  ON pixels
  FOR SELECT
  TO public
  USING (true);

-- Allow anyone to insert/update pixels (since we're using anonymous access for this demo)
CREATE POLICY "Anyone can create pixels"
  ON pixels
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update pixels"
  ON pixels
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);