-- Initial schema for Rock or Bust Gateway

-- Table for managing isolated keys
CREATE TABLE IF NOT EXISTS rob_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_string TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table for tracking active residential nodes
CREATE TABLE IF NOT EXISTS rob_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id UUID REFERENCES rob_keys(id) ON DELETE CASCADE,
  hostname TEXT,
  ip_address TEXT,
  status BOOLEAN DEFAULT false,
  last_ping TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(key_id, hostname)
);
