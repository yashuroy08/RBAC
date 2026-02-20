USE master;
GO

-- 1. Create the login 'springuser' if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'springuser')
BEGIN
    CREATE LOGIN springuser WITH PASSWORD = 'Spring@123', CHECK_POLICY = OFF;
END
GO

-- 2. Connect to the rbac_db database
USE rbac_db;
GO

-- 3. Create a user for this login in the database
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'springuser')
BEGIN
    CREATE USER springuser FOR LOGIN springuser;
END
GO

-- 4. Grant full ownership permissions to this user
ALTER ROLE db_owner ADD MEMBER springuser;
GO
