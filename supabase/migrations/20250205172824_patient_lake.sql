/*
  # Create customers table

  1. New Tables
    - `customers`
      - `id` (uuid, primary key)
      - `first_name` (text)
      - `last_name` (text)
      - `phone_number` (text)
      - `account_number` (text, unique)
      - `created_by` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `customers` table
    - Add policies for authenticated users to manage their data
*/

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone_number TEXT,
    account_number TEXT UNIQUE NOT NULL,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read all customers"
    ON customers
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert customers"
    ON customers
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update customers"
    ON customers
    FOR UPDATE
    TO authenticated
    USING (true);

-- Create search index
CREATE INDEX IF NOT EXISTS customers_search_idx ON customers
    USING GIN (
        to_tsvector('english',
            coalesce(first_name, '') || ' ' ||
            coalesce(last_name, '') || ' ' ||
            coalesce(phone_number, '') || ' ' ||
            coalesce(account_number, '')
        )
    );