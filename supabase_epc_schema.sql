-- EPC (Energy Performance Certificate) Database Schema for Supabase
-- This schema extends the existing DEFRA Contract Management Database

-- Table to store EPC certificate data
CREATE TABLE epc_certificates (
    id SERIAL PRIMARY KEY,
    uprn VARCHAR(50),
    address TEXT,
    postcode VARCHAR(10) NOT NULL,
    current_energy_rating VARCHAR(1) CHECK (current_energy_rating IN ('A', 'B', 'C', 'D', 'E', 'F', 'G')),
    current_energy_efficiency INTEGER CHECK (current_energy_efficiency BETWEEN 1 AND 100),
    potential_energy_rating VARCHAR(1) CHECK (potential_energy_rating IN ('A', 'B', 'C', 'D', 'E', 'F', 'G')),
    potential_energy_efficiency INTEGER CHECK (potential_energy_efficiency BETWEEN 1 AND 100),
    co2_emissions DECIMAL(8,2),
    property_type VARCHAR(100),
    built_form VARCHAR(100),
    inspection_date DATE,
    lodgement_date DATE,
    certificate_hash VARCHAR(64) UNIQUE,
    total_floor_area DECIMAL(8,2),
    lmk_key VARCHAR(100),
    building_reference_number VARCHAR(100),
    assessor_name VARCHAR(200),
    assessment_company VARCHAR(200),
    improvement_summary_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Composite index for efficient lookups
    INDEX idx_epc_uprn (uprn),
    INDEX idx_epc_postcode (postcode),
    INDEX idx_epc_address (address),
    INDEX idx_epc_rating (current_energy_rating),
    INDEX idx_epc_lodgement (lodgement_date),
    INDEX idx_epc_hash (certificate_hash)
);

-- Table to link OSMM building features to EPC certificates
CREATE TABLE osmm_epc_links (
    id SERIAL PRIMARY KEY,
    osmm_feature_id VARCHAR(100) NOT NULL,
    epc_certificate_id INTEGER NOT NULL,
    match_confidence DECIMAL(4,3) CHECK (match_confidence BETWEEN 0 AND 1),
    match_method VARCHAR(50) CHECK (match_method IN ('uprn', 'postcode', 'address', 'fuzzy_address')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key relationship
    CONSTRAINT fk_epc_certificate 
        FOREIGN KEY (epc_certificate_id) 
        REFERENCES epc_certificates(id) 
        ON DELETE CASCADE,
    
    -- Ensure unique links (one OSMM feature to one EPC certificate)
    CONSTRAINT unique_osmm_epc 
        UNIQUE (osmm_feature_id, epc_certificate_id),
    
    -- Indexes for performance
    INDEX idx_osmm_epc_feature (osmm_feature_id),
    INDEX idx_osmm_epc_certificate (epc_certificate_id),
    INDEX idx_osmm_epc_method (match_method),
    INDEX idx_osmm_epc_confidence (match_confidence)
);

-- Table to store EPC processing jobs and their status
CREATE TABLE epc_processing_jobs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    estate_name VARCHAR(200),
    total_buildings INTEGER,
    processed_buildings INTEGER DEFAULT 0,
    matched_buildings INTEGER DEFAULT 0,
    status VARCHAR(50) CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_epc_jobs_user (user_id),
    INDEX idx_epc_jobs_status (status),
    INDEX idx_epc_jobs_created (created_at)
);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_epc_certificates_updated_at 
    BEFORE UPDATE ON epc_certificates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_epc_processing_jobs_updated_at 
    BEFORE UPDATE ON epc_processing_jobs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
-- Users can only access their own EPC processing jobs
ALTER TABLE epc_processing_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own EPC jobs" ON epc_processing_jobs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own EPC jobs" ON epc_processing_jobs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own EPC jobs" ON epc_processing_jobs
    FOR UPDATE USING (auth.uid() = user_id);

-- EPC certificates and links are public (read-only for authenticated users)
ALTER TABLE epc_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE osmm_epc_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view EPC certificates" ON epc_certificates
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view OSMM-EPC links" ON osmm_epc_links
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only service accounts can insert/update EPC data
CREATE POLICY "Service accounts can manage EPC certificates" ON epc_certificates
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service accounts can manage OSMM-EPC links" ON osmm_epc_links
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Create indexes for improved query performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_epc_certs_composite 
    ON epc_certificates (postcode, current_energy_rating, inspection_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_osmm_links_composite 
    ON osmm_epc_links (osmm_feature_id, match_confidence DESC);

-- Add comments for documentation
COMMENT ON TABLE epc_certificates IS 'Stores Energy Performance Certificate data from the UK EPC database';
COMMENT ON TABLE osmm_epc_links IS 'Links OS MasterMap building features to EPC certificates with confidence scoring';
COMMENT ON TABLE epc_processing_jobs IS 'Tracks EPC data processing jobs for estates and buildings';

COMMENT ON COLUMN epc_certificates.uprn IS 'Unique Property Reference Number';
COMMENT ON COLUMN epc_certificates.certificate_hash IS 'Hash of EPC data to prevent duplicates';
COMMENT ON COLUMN epc_certificates.lmk_key IS 'Landmark Key from EPC database';
COMMENT ON COLUMN osmm_epc_links.match_confidence IS 'Confidence score (0-1) for the OSMM to EPC match';
COMMENT ON COLUMN osmm_epc_links.match_method IS 'Method used to match OSMM feature to EPC certificate';

-- Example function to get EPC summary for an estate (based on OSMM feature IDs)
CREATE OR REPLACE FUNCTION get_estate_epc_summary(feature_ids TEXT[])
RETURNS TABLE (
    total_buildings INTEGER,
    buildings_with_epc INTEGER,
    coverage_percentage DECIMAL,
    avg_efficiency DECIMAL,
    rating_distribution JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH estate_links AS (
        SELECT DISTINCT oel.osmm_feature_id, oel.epc_certificate_id
        FROM osmm_epc_links oel
        WHERE oel.osmm_feature_id = ANY(feature_ids)
    ),
    epc_stats AS (
        SELECT 
            ec.current_energy_rating,
            ec.current_energy_efficiency
        FROM estate_links el
        JOIN epc_certificates ec ON el.epc_certificate_id = ec.id
    )
    SELECT 
        ARRAY_LENGTH(feature_ids, 1)::INTEGER as total_buildings,
        COUNT(DISTINCT el.epc_certificate_id)::INTEGER as buildings_with_epc,
        ROUND((COUNT(DISTINCT el.epc_certificate_id)::DECIMAL / ARRAY_LENGTH(feature_ids, 1) * 100), 1) as coverage_percentage,
        ROUND(AVG(ec.current_energy_efficiency), 1) as avg_efficiency,
        JSONB_OBJECT_AGG(
            COALESCE(ec.current_energy_rating, 'No Rating'),
            COUNT(ec.current_energy_rating)
        ) as rating_distribution
    FROM (SELECT unnest(feature_ids) as feature_id) features
    LEFT JOIN estate_links el ON features.feature_id = el.osmm_feature_id
    LEFT JOIN epc_certificates ec ON el.epc_certificate_id = ec.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;