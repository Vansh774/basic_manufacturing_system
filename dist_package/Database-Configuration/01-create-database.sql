-- Check and create database manufacturing_db
SELECT 'CREATE DATABASE manufacturing_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'manufacturing_db')\gexec
