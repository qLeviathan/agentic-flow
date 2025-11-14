-- PostgreSQL initialization script for Phi AI system
-- This script runs automatically when the container is first created

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS phi_core;
CREATE SCHEMA IF NOT EXISTS phi_analytics;
CREATE SCHEMA IF NOT EXISTS phi_audit;

-- Set search path
SET search_path TO phi_core, public;

-- Create custom types
CREATE TYPE task_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');
CREATE TYPE agent_role AS ENUM ('coordinator', 'worker', 'monitor', 'analyzer');

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status task_status DEFAULT 'pending',
    priority INTEGER DEFAULT 0,
    assigned_agent UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    result JSONB,
    error TEXT,
    CONSTRAINT tasks_priority_check CHECK (priority >= 0 AND priority <= 100)
);

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX idx_tasks_metadata ON tasks USING gin(metadata);

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    role agent_role NOT NULL,
    status VARCHAR(50) DEFAULT 'idle',
    capabilities JSONB DEFAULT '[]',
    config JSONB DEFAULT '{}',
    last_heartbeat TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metrics JSONB DEFAULT '{}'
);

CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_role ON agents(role);
CREATE INDEX idx_agents_capabilities ON agents USING gin(capabilities);

-- Memory store table
CREATE TABLE IF NOT EXISTS memory_store (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(512) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    access_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_memory_key ON memory_store(key);
CREATE INDEX idx_memory_agent ON memory_store(agent_id);
CREATE INDEX idx_memory_expires ON memory_store(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_memory_value ON memory_store USING gin(value);

-- Task dependencies table
CREATE TABLE IF NOT EXISTS task_dependencies (
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (task_id, depends_on_task_id),
    CONSTRAINT no_self_dependency CHECK (task_id != depends_on_task_id)
);

CREATE INDEX idx_task_deps_task ON task_dependencies(task_id);
CREATE INDEX idx_task_deps_depends ON task_dependencies(depends_on_task_id);

-- Analytics schema tables
SET search_path TO phi_analytics, public;

-- Metrics table
CREATE TABLE IF NOT EXISTS metrics (
    id BIGSERIAL PRIMARY KEY,
    metric_name VARCHAR(255) NOT NULL,
    metric_value DOUBLE PRECISION NOT NULL,
    labels JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_metrics_name ON metrics(metric_name);
CREATE INDEX idx_metrics_timestamp ON metrics(timestamp DESC);
CREATE INDEX idx_metrics_labels ON metrics USING gin(labels);

-- Performance tracking
CREATE TABLE IF NOT EXISTS performance_logs (
    id BIGSERIAL PRIMARY KEY,
    task_id UUID,
    agent_id UUID,
    operation VARCHAR(255) NOT NULL,
    duration_ms INTEGER NOT NULL,
    success BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_perf_task ON performance_logs(task_id);
CREATE INDEX idx_perf_agent ON performance_logs(agent_id);
CREATE INDEX idx_perf_timestamp ON performance_logs(timestamp DESC);

-- Audit schema tables
SET search_path TO phi_audit, public;

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    actor VARCHAR(255),
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_timestamp ON audit_log(timestamp DESC);
CREATE INDEX idx_audit_actor ON audit_log(actor);

-- Functions and triggers
SET search_path TO phi_core, public;

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update timestamp triggers
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memory_updated_at BEFORE UPDATE ON memory_store
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Clean expired memory function
CREATE OR REPLACE FUNCTION clean_expired_memory()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM memory_store
    WHERE expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO phi_audit.audit_log (entity_type, entity_id, action, changes)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO phi_audit.audit_log (entity_type, entity_id, action, changes)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE',
                jsonb_build_object('old', row_to_json(OLD)::jsonb, 'new', row_to_json(NEW)::jsonb));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO phi_audit.audit_log (entity_type, entity_id, action, changes)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD)::jsonb);
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers
CREATE TRIGGER audit_tasks_changes AFTER INSERT OR UPDATE OR DELETE ON tasks
    FOR EACH ROW EXECUTE FUNCTION audit_changes();

CREATE TRIGGER audit_agents_changes AFTER INSERT OR UPDATE OR DELETE ON agents
    FOR EACH ROW EXECUTE FUNCTION audit_changes();

-- Create views
CREATE OR REPLACE VIEW active_tasks AS
SELECT * FROM tasks
WHERE status IN ('pending', 'running')
ORDER BY priority DESC, created_at ASC;

CREATE OR REPLACE VIEW agent_workload AS
SELECT
    a.id,
    a.name,
    a.role,
    a.status,
    COUNT(t.id) as active_tasks,
    AVG(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - t.started_at))) as avg_task_duration
FROM agents a
LEFT JOIN tasks t ON a.id = t.assigned_agent AND t.status = 'running'
GROUP BY a.id, a.name, a.role, a.status;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA phi_core TO phi_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA phi_core TO phi_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA phi_analytics TO phi_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA phi_analytics TO phi_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA phi_audit TO phi_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA phi_audit TO phi_user;

-- Insert initial data
INSERT INTO agents (name, role, status, capabilities) VALUES
    ('coordinator-01', 'coordinator', 'idle', '["task_distribution", "load_balancing"]'),
    ('worker-01', 'worker', 'idle', '["computation", "data_processing"]'),
    ('worker-02', 'worker', 'idle', '["computation", "data_processing"]'),
    ('monitor-01', 'monitor', 'idle', '["health_check", "metrics_collection"]'),
    ('analyzer-01', 'analyzer', 'idle', '["performance_analysis", "optimization"]')
ON CONFLICT (name) DO NOTHING;

-- Analyze tables for better query planning
ANALYZE tasks;
ANALYZE agents;
ANALYZE memory_store;
ANALYZE task_dependencies;
ANALYZE phi_analytics.metrics;
ANALYZE phi_analytics.performance_logs;
ANALYZE phi_audit.audit_log;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Phi AI database initialized successfully';
END $$;
