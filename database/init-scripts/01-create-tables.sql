
-- Create tables for sensor data pipeline

-- Table for storing sensor data
CREATE TABLE IF NOT EXISTS sensor_data (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    vibration DECIMAL(10, 4) NOT NULL,
    temperature DECIMAL(10, 4) NOT NULL,
    pressure DECIMAL(10, 4) NOT NULL,
    flow_rate DECIMAL(10, 4) NOT NULL,
    rotational_speed DECIMAL(10, 4) NOT NULL,
    machine_type VARCHAR(50) NOT NULL,
    machine_id VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries on timestamp
CREATE INDEX IF NOT EXISTS idx_sensor_data_timestamp ON sensor_data(timestamp);

-- Index for faster queries on machine_id
CREATE INDEX IF NOT EXISTS idx_sensor_data_machine_id ON sensor_data(machine_id);

-- Index for faster queries on machine_type
CREATE INDEX IF NOT EXISTS idx_sensor_data_machine_type ON sensor_data(machine_type);

-- Table for storing prediction results
CREATE TABLE IF NOT EXISTS prediction_results (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    machine_id VARCHAR(50) NOT NULL,
    machine_type VARCHAR(50) NOT NULL,
    anomaly_probability DECIMAL(10, 8) NOT NULL,
    is_anomaly BOOLEAN NOT NULL,
    prediction_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries on timestamp
CREATE INDEX IF NOT EXISTS idx_prediction_results_timestamp ON prediction_results(timestamp);

-- Index for faster queries on machine_id
CREATE INDEX IF NOT EXISTS idx_prediction_results_machine_id ON prediction_results(machine_id);

-- Index for faster queries on anomaly status
CREATE INDEX IF NOT EXISTS idx_prediction_results_anomaly ON prediction_results(is_anomaly);

-- Table for storing machine types and their corresponding models
CREATE TABLE IF NOT EXISTS machine_models (
    id SERIAL PRIMARY KEY,
    machine_type VARCHAR(50) UNIQUE NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(20),
    model_path VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default machine types and models
INSERT INTO machine_models (machine_type, model_name, model_version, model_path) VALUES
    ('Pump', 'LSTM-Anomaly-Detector', '1.0.0', '/models/pump_model.h5'),
    ('Compressor', 'LSTM-Anomaly-Detector', '1.0.0', '/models/compressor_model.h5'),
    ('Motor', 'LSTM-Anomaly-Detector', '1.0.0', '/models/motor_model.h5'),
    ('Valve', 'LSTM-Anomaly-Detector', '1.0.0', '/models/valve_model.h5')
ON CONFLICT (machine_type) DO NOTHING;

-- Table for storing user roles and permissions
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('System', 'Agent', 'Admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for storing LLM analysis results
CREATE TABLE IF NOT EXISTS llm_analysis (
    id SERIAL PRIMARY KEY,
    query_text TEXT NOT NULL,
    analysis_result TEXT,
    related_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries on creation time
CREATE INDEX IF NOT EXISTS idx_llm_analysis_created_at ON llm_analysis(created_at);

