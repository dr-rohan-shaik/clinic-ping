-- ClinicPing Database Initialization Script
-- This script runs once when the database is first created

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schema
CREATE SCHEMA IF NOT EXISTS clinicping;

-- Configure PostgreSQL for proper timezone
SET timezone = 'Asia/Kolkata';

-- Note: Tables will be created via Drizzle ORM migrations
-- Run: npx drizzle-kit push:pg

-- Create a default clinic for testing
INSERT INTO clinicping.clinics (id, name, address, phone, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Demo Clinic',
    '123 Demo Street, Mumbai, Maharashtra 400001',
    '+91 22 1234 5678',
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;