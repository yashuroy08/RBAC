-- ================================================
-- RBAC RISK EVALUATOR SYSTEM - DATABASE SCHEMA
-- ================================================
-- Project: Design and Development of a Secure RBAC System
--          with Risk Evaluation Mechanism
-- Database: Microsoft SQL Server (T-SQL)
-- ================================================

-- Create database (run this separately if needed)
-- CREATE DATABASE rbac_db;
-- GO
-- USE rbac_db;
-- GO

-- ================================================
-- TABLE: roles
-- Stores role information (ROLE_USER, ROLE_ADMIN)
-- ================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[roles]') AND type in (N'U'))
BEGIN
    CREATE TABLE roles (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        name VARCHAR(20) NOT NULL UNIQUE,
        description VARCHAR(255)
    );
END
GO

-- ================================================
-- TABLE: users
-- Stores user account information
-- ================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND type in (N'U'))
BEGIN
    CREATE TABLE users (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL, -- BCrypt hashed

        account_non_expired BIT DEFAULT 1,
        account_non_locked BIT DEFAULT 1,
        credentials_non_expired BIT DEFAULT 1,
        enabled BIT DEFAULT 1,
        created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()
    );
END
GO

-- ================================================
-- TABLE: user_roles (Many-to-Many relationship)
-- Associates users with roles
-- ================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[user_roles]') AND type in (N'U'))
BEGIN
    CREATE TABLE user_roles (
        user_id BIGINT NOT NULL,
        role_id BIGINT NOT NULL,
        PRIMARY KEY (user_id, role_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
    );
END
GO

-- ================================================
-- TABLE: user_sessions
-- Tracks active user sessions for Risk Evaluation
-- ================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[user_sessions]') AND type in (N'U'))
BEGIN
    CREATE TABLE user_sessions (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        user_id BIGINT NOT NULL,
        session_id VARCHAR(100) NOT NULL UNIQUE,
        device_id VARCHAR(255),
        ip_address VARCHAR(45),
        login_time DATETIME2 NOT NULL,
        last_accessed_time DATETIME2,
        is_active BIT DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
END
GO

-- Create indexes for performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_user_id' AND object_id = OBJECT_ID('user_sessions'))
    CREATE INDEX idx_user_id ON user_sessions(user_id);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_session_id' AND object_id = OBJECT_ID('user_sessions'))
    CREATE INDEX idx_session_id ON user_sessions(session_id);
GO

-- ================================================
-- TABLE: risk_events
-- Logs risk evaluation events
-- ================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[risk_events]') AND type in (N'U'))
BEGIN
    CREATE TABLE risk_events (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        user_id BIGINT NOT NULL,
        username VARCHAR(100) NOT NULL,
        active_sessions INTEGER NOT NULL,
        allowed_sessions INTEGER NOT NULL,
        risk_score FLOAT NOT NULL,
        action_taken VARCHAR(50),
        description VARCHAR(500),
        event_time DATETIME2 NOT NULL DEFAULT SYSDATETIME()
    );
END
GO

-- Create index for querying events by user
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_risk_events_user_id' AND object_id = OBJECT_ID('risk_events'))
    CREATE INDEX idx_risk_events_user_id ON risk_events(user_id);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_risk_events_event_time' AND object_id = OBJECT_ID('risk_events'))
    CREATE INDEX idx_risk_events_event_time ON risk_events(event_time DESC);
GO

-- ================================================
-- Spring Session Tables
-- Required for JDBC session management
-- ================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[spring_session]') AND type in (N'U'))
BEGIN
    CREATE TABLE spring_session (
        primary_id CHAR(36) NOT NULL,
        session_id CHAR(36) NOT NULL,
        creation_time BIGINT NOT NULL,
        last_access_time BIGINT NOT NULL,
        max_inactive_interval INT NOT NULL,
        expiry_time BIGINT NOT NULL,
        principal_name VARCHAR(100),
        CONSTRAINT spring_session_pk PRIMARY KEY (primary_id)
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'spring_session_ix1' AND object_id = OBJECT_ID('spring_session'))
    CREATE UNIQUE INDEX spring_session_ix1 ON spring_session(session_id);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'spring_session_ix2' AND object_id = OBJECT_ID('spring_session'))
    CREATE INDEX spring_session_ix2 ON spring_session(expiry_time);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'spring_session_ix3' AND object_id = OBJECT_ID('spring_session'))
    CREATE INDEX spring_session_ix3 ON spring_session(principal_name);
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[spring_session_attributes]') AND type in (N'U'))
BEGIN
    CREATE TABLE spring_session_attributes (
        session_primary_id CHAR(36) NOT NULL,
        attribute_name VARCHAR(200) NOT NULL,
        attribute_bytes VARBINARY(MAX) NOT NULL,
        CONSTRAINT spring_session_attributes_pk PRIMARY KEY (session_primary_id, attribute_name),
        CONSTRAINT spring_session_attributes_fk FOREIGN KEY (session_primary_id) 
            REFERENCES spring_session(primary_id) ON DELETE CASCADE
    );
END
GO

-- ================================================
-- INSERT DEFAULT DATA
-- ================================================

-- Insert default roles
IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ROLE_USER')
    INSERT INTO roles (name, description) VALUES ('ROLE_USER', 'Standard user role');

IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ROLE_ADMIN')
    INSERT INTO roles (name, description) VALUES ('ROLE_ADMIN', 'Administrator role with full access');
GO

-- Insert default admin user
-- Password: admin123 (BCrypt hash)
IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin')
BEGIN
    INSERT INTO users (username, email, password, enabled) 
    VALUES (
        'admin',
        'admin@rbac.com',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi',  -- admin123
        1
    );
END
GO

-- Assign ADMIN and USER roles to admin user
IF NOT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN users u ON ur.user_id = u.id
    JOIN roles r ON ur.role_id = r.id
    WHERE u.username = 'admin' AND r.name = 'ROLE_ADMIN'
)
BEGIN
    INSERT INTO user_roles (user_id, role_id)
    SELECT u.id, r.id
    FROM users u, roles r
    WHERE u.username = 'admin' AND r.name IN ('ROLE_USER', 'ROLE_ADMIN');
END
GO
