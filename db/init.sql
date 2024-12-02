-- Connect to the default 'postgres' database
\c postgres;

-- Check if the database exists, if not, create it
DO
$do$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'fuel_delivery') THEN
      CREATE DATABASE fuel_delivery;
   END IF;
END
$do$;

-- Connect to the fuel_delivery database
\c fuel_delivery;

-- Create enum types
CREATE TYPE order_status AS ENUM ('Created', 'Truck Loading Confirmation', 'Loading Confirmed', 'BL & Invoice', 'Completed');
CREATE TYPE order_type AS ENUM ('PACK', 'VRAC');
CREATE TYPE user_role AS ENUM ('admin', 'user');

-- Now, create the users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- Create clients table (without unique constraints on Customer Sold to and Customer Ship to)
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    "Customer Sold to" VARCHAR(50) NOT NULL,
    "Customer Sold to name" VARCHAR(100),
    "Customer Sold to city" VARCHAR(100),
    "Statut de droit" VARCHAR(10),
    "Statut de droit name" VARCHAR(100),
    "ID Fiscal" VARCHAR(50),
    "ICE" VARCHAR(50),
    "Distribution channel" VARCHAR(10),
    "Division" VARCHAR(10),
    "Customer Ship to" VARCHAR(50),
    "Customer ship to name" VARCHAR(100),
    "Customer ship to Address" VARCHAR(200),
    "Customer ship to city" VARCHAR(100),
    "Postal code" VARCHAR(20),
    "Country" VARCHAR(10),
    "Paiement terms" VARCHAR(100),
    "Shipping condition" VARCHAR(50),
    "Transport mode" VARCHAR(10),
    "Delivering plant" VARCHAR(10),
    "Transportation zone" VARCHAR(20)
);

-- Create plants table
CREATE TABLE IF NOT EXISTS plants (
    id SERIAL PRIMARY KEY,
    "Plant Code" VARCHAR(10) UNIQUE NOT NULL,
    "Description" VARCHAR(100),
    "Plant Category" VARCHAR(50),
    "Old code" VARCHAR(50)
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    "Material" VARCHAR(50) UNIQUE NOT NULL,
    "DF at client level" VARCHAR(50),
    "Material type" VARCHAR(50),
    "Material Group" VARCHAR(50),
    "Old Material Number" VARCHAR(50),
    "Base Unit of Measure" VARCHAR(10),
    "Lab/Office" VARCHAR(50),
    "Gross Weight" DECIMAL(10, 3),
    "Net weight" DECIMAL(10, 3),
    "Weight unit" VARCHAR(10),
    "Volume" DECIMAL(10, 3),
    "Volume unit" VARCHAR(10),
    "Division" VARCHAR(10),
    "Material description" VARCHAR(100),
    "Tax" DECIMAL(10, 3),
    density FLOAT,
    temp FLOAT,
    type VARCHAR
);

-- Create prices table
CREATE TABLE IF NOT EXISTS prices (
  id SERIAL PRIMARY KEY,
  "Ship to SAP" VARCHAR(50) NOT NULL,
  "SAP material" VARCHAR(50) NOT NULL,
  "Price Unit (HT)" DECIMAL(10, 6) NOT NULL
);

-- Create tanks table
CREATE TABLE IF NOT EXISTS tanks (
    id SERIAL PRIMARY KEY,
    "Tank" VARCHAR(20) NOT NULL,
    "Name" VARCHAR(100),
    "Code depot" VARCHAR(20),
    "Depot name" VARCHAR(100),
    "Group" VARCHAR(50)
);

-- Create trucks table
CREATE TABLE IF NOT EXISTS trucks (
    "Vehicle" VARCHAR(50) PRIMARY KEY,
    "Vehicle-Type" VARCHAR(100),
    "Class-Group" VARCHAR(50),
    "MPGI" VARCHAR(100),
    "Haulier number" VARCHAR(50),
    "Haulier name" VARCHAR(100),
    "Trailer Number" VARCHAR(20),
    "Driver name" VARCHAR(100),
    "Driver CIN" VARCHAR(50),
    "Seals" VARCHAR(50),
    "Vehicle-Weight" DECIMAL(10, 2),
    "Vehicule Capacity" DECIMAL(10, 2),
    "Comp1" DECIMAL(10, 2),
    "Comp2" DECIMAL(10, 2),
    "Comp3" DECIMAL(10, 2),
    "Comp4" DECIMAL(10, 2),
    "Comp5" DECIMAL(10, 2),
    "Comp6" DECIMAL(10, 2),
    "Comp7" DECIMAL(10, 2),
    "Comp8" DECIMAL(10, 2),
    "Comp9" DECIMAL(10, 2)
);

-- Create trips table
CREATE TABLE trips (
  id SERIAL PRIMARY KEY,
  "Trip Num" INTEGER UNIQUE,
  "Tour Start Date" DATE NOT NULL,
  "Requested delivery date" DATE NOT NULL,
  "Vehicle Id" VARCHAR(255) NOT NULL REFERENCES trucks("Vehicle"),
  "Order Qty" FLOAT NOT NULL,
  "Status" VARCHAR(50) NOT NULL DEFAULT 'Planned' CHECK ("Status" IN ('Planned', 'In Progress', 'Completed', 'Cancelled')),
  sealnumbers TEXT[] DEFAULT '{}',
  totalorders JSONB NOT NULL DEFAULT '[]',
  uniquedalesorders JSONB NOT NULL DEFAULT '[]'
);

-- Create orders table
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  "Sales Order" INTEGER NOT NULL,
  "Order Type" VARCHAR(255) NOT NULL,
  "Customer" VARCHAR(255) NOT NULL,
  "Customer Name" VARCHAR(255) NOT NULL,
  "Plant" VARCHAR(255) NOT NULL,
  "Plant Name" VARCHAR(255) NOT NULL,
  "Ship To Party" VARCHAR(255) NOT NULL,
  "Ship To Name" VARCHAR(255) NOT NULL,
  "Valution Type" VARCHAR(255),
  "City(Ship To)" VARCHAR(255),
  "Item" INTEGER NOT NULL,
  "Material Code" VARCHAR(255) NOT NULL,
  "Material Name" VARCHAR(255) NOT NULL,
  "Order Qty" FLOAT NOT NULL,
  "Sls.UOM" VARCHAR(255) NOT NULL,
  "Requested delivery date" DATE NOT NULL,
  "Pat.Doc" VARCHAR(255),
  "Trip Num" INTEGER,
  "Tour Start Date" DATE,
  "Org Name" VARCHAR(255),
  "Driver Name" VARCHAR(255),
  "Vehicle Id" VARCHAR(255),
  status VARCHAR(255) DEFAULT 'Created' CHECK (status IN ('Created', 'Truck Loading Confirmation', 'Loading Confirmed', 'BL & Invoice', 'Completed')),
  order_type VARCHAR(255) NOT NULL CHECK (order_type IN ('PACK', 'VRAC')),
  "Total Price" DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- Create import_history table
CREATE TABLE IF NOT EXISTS import_history (
    id SERIAL PRIMARY KEY,
    import_type VARCHAR NOT NULL,
    file_name VARCHAR NOT NULL,
    records_imported INTEGER NOT NULL,
    status VARCHAR NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create an index on the email column for faster lookups
CREATE INDEX idx_users_email ON users(email);