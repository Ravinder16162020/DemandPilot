-- Make password column nullable to support Google auth users
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
