#!/bin/bash

echo "Starting Kirana Marketplace..."

# Exit if any command fails
set -e

echo "1. Installing backend dependencies..."
npm install

echo "2. Setting up the database..."
# Ensure the database is created and schema is pushed
npx prisma db push
# Seed the database with initial data
npm run seed

echo "3. Installing frontend dependencies..."
cd frontend
npm install

echo "4. Building the frontend..."
npm run build
cd ..

echo "5. Starting the server..."
echo "The application will be available at http://localhost:4000"
npm start
