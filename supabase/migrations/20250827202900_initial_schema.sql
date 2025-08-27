-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create carriers table
CREATE TABLE public.carriers (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    name_ua VARCHAR(255) NOT NULL,
    country VARCHAR(2) NOT NULL DEFAULT 'UA',
    logo_url TEXT,
    website_url TEXT,
    api_type VARCHAR(20) NOT NULL DEFAULT 'official',
    tracking_url_template TEXT,
    is_active BOOLEAN DEFAULT true,
    supports_realtime BOOLEAN DEFAULT false,
    rate_limit_per_hour INTEGER DEFAULT 1000,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial carriers
INSERT INTO public.carriers (code, name, name_ua, country, api_type) VALUES
('novaposhta', 'Nova Poshta', 'Нова Пошта', 'UA', 'official'),
('ukrposhta', 'Ukrposhta', 'Укрпошта', 'UA', 'official'),
('meest', 'Meest Express', 'Міст Експрес', 'UA', 'official'),
('dhl', 'DHL Express', 'DHL Експрес', 'DE', 'official'),
('fedex', 'FedEx', 'ФедЕкс', 'US', 'official');

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email VARCHAR(255),
    full_name VARCHAR(255),
    plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'pro')),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    subscription_status VARCHAR(20) DEFAULT 'inactive',
    subscription_ends_at TIMESTAMPTZ,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create shipments table
CREATE TABLE public.shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracking_number_hash VARCHAR(64) NOT NULL,
    tracking_number_encrypted TEXT NOT NULL,
    encryption_version INTEGER DEFAULT 1,
    carrier_id INTEGER REFERENCES public.carriers(id) NOT NULL,
    status VARCHAR(50) DEFAULT 'unknown',
    status_description TEXT,
    destination_country VARCHAR(2),
    estimated_delivery TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    last_event_at TIMESTAMPTZ,
    next_check_at TIMESTAMPTZ,
    check_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    
    user_id UUID REFERENCES public.profiles(id),
    ip_hash VARCHAR(64),
    user_agent_hash VARCHAR(64),
    session_id VARCHAR(255),
    
    is_favorite BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    tags TEXT[],
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_hash_carrier UNIQUE(tracking_number_hash, carrier_id)
);

-- Create events table (simplified without partitioning for MVP)
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID REFERENCES public.shipments(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    description TEXT,
    description_ua TEXT,
    location TEXT,
    location_details JSONB,
    timestamp TIMESTAMPTZ NOT NULL,
    is_estimated BOOLEAN DEFAULT false,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT uniq_events UNIQUE (shipment_id, timestamp, status)
);

-- Create carrier_quotas table (missing from original)
CREATE TABLE public.carrier_quotas (
    carrier_id INTEGER NOT NULL REFERENCES public.carriers(id),
    date DATE NOT NULL,
    requests_count INTEGER DEFAULT 0,
    cost_usd NUMERIC(10,4) DEFAULT 0,
    requests_limit INTEGER DEFAULT 100000,
    cost_limit_usd NUMERIC(10,2) DEFAULT 50,
    is_blocked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    PRIMARY KEY (carrier_id, date)
);

-- Create rate_limits table (Redis fallback)
CREATE TABLE public.rate_limits (
    id SERIAL PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL,
    identifier_type VARCHAR(20) NOT NULL,
    endpoint VARCHAR(100) NOT NULL,
    requests_count INTEGER DEFAULT 0,
    window_start TIMESTAMPTZ DEFAULT NOW(),
    blocked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_rate_limit UNIQUE (identifier, endpoint, window_start)
);

-- Create indexes for performance
CREATE INDEX idx_shipments_carrier_hash ON public.shipments(carrier_id, tracking_number_hash);
CREATE INDEX idx_shipments_user_created ON public.shipments(user_id, created_at DESC);
CREATE INDEX idx_shipments_next_check ON public.shipments(next_check_at) 
    WHERE next_check_at IS NOT NULL AND status NOT IN ('delivered', 'returned');
CREATE INDEX idx_events_shipment_time ON public.events(shipment_id, timestamp DESC);
CREATE INDEX idx_carrier_quotas_date ON public.carrier_quotas(date, is_blocked);
CREATE INDEX idx_rate_limits_window ON public.rate_limits(identifier, endpoint, window_start);

-- Function for incrementing carrier quotas
CREATE OR REPLACE FUNCTION increment_carrier_quota(
    p_carrier_id INTEGER,
    p_date DATE DEFAULT CURRENT_DATE,
    p_cost NUMERIC DEFAULT 0.001
) RETURNS void AS $$
BEGIN
    INSERT INTO public.carrier_quotas (carrier_id, date, requests_count, cost_usd)
    VALUES (p_carrier_id, p_date, 1, p_cost)
    ON CONFLICT (carrier_id, date)
    DO UPDATE SET 
        requests_count = carrier_quotas.requests_count + 1,
        cost_usd = carrier_quotas.cost_usd + p_cost,
        is_blocked = CASE 
            WHEN carrier_quotas.requests_count + 1 >= carrier_quotas.requests_limit 
            OR carrier_quotas.cost_usd + p_cost >= carrier_quotas.cost_limit_usd 
            THEN true 
            ELSE false 
        END;
END;
$$ LANGUAGE plpgsql;

-- Create cleanup function
CREATE OR REPLACE FUNCTION cleanup_old_anonymous_shipments()
RETURNS void AS $$
BEGIN
    -- Delete anonymous trackings older than 7 days
    DELETE FROM public.shipments 
    WHERE user_id IS NULL 
      AND created_at < NOW() - INTERVAL '7 days';
    
    -- Delete old rate limits (older than 1 day)
    DELETE FROM public.rate_limits 
    WHERE window_start < NOW() - INTERVAL '1 day';
    
    RAISE NOTICE 'Cleanup completed at %', NOW();
END;
$$ LANGUAGE plpgsql;