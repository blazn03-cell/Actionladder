#!/bin/bash

echo "🚀 Setting up Action Ladder monorepo..."
echo "🔄 Using pnpm as package manager..."

# Install root dependencies
echo "📦 Installing root dependencies..."
pnpm install

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client && pnpm install && cd ..

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server && pnpm install && cd ..

# Install shared dependencies
echo "📦 Installing shared dependencies..."
cd shared && pnpm install && cd ..

echo "✅ Installation complete!"
echo ""
echo "Available commands:"
echo "  pnpm run dev          # Start both client and server in development"
echo "  pnpm run dev:client   # Start only client (port 5173)"
echo "  pnpm run dev:server   # Start only server (port 5000)"
echo "  pnpm run build        # Build both client and server"
echo "  pnpm run start        # Start production server"
echo ""
echo "Development URLs:"
echo "  Client: http://localhost:5173"
echo "  Server: http://localhost:5000"
