#!/bin/bash

# Efficient deployment script for Azure App Service
set -e

echo "🚀 Starting optimized deployment..."

# Set environment variables for performance
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=8192 --optimize-for-size"
export GENERATE_SOURCEMAP=false
export CI=true

# Clean any existing node_modules to avoid conflicts
echo "🧹 Cleaning previous installations..."
rm -rf node_modules package-lock.json

# Install dependencies with optimizations
echo "📦 Installing dependencies..."
npm ci --only=production --no-audit --no-fund --quiet

# Install dev dependencies needed for build
echo "🔧 Installing build dependencies..."
npm install react-scripts --no-audit --no-fund --quiet

# Build with optimizations
echo "🏗️ Building application..."
GENERATE_SOURCEMAP=false \
NODE_OPTIONS="--max-old-space-size=8192 --optimize-for-size" \
npm run build

# Copy build files
echo "📋 Copying build files..."
cp -r build/* /home/site/wwwroot/

# Create optimized web.config
echo "⚙️ Creating web.config..."
cat > /home/site/wwwroot/web.config << 'EOF'
<?xml version="1.0"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="React Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
    <staticContent>
      <mimeMap fileExtension=".json" mimeType="application/json" />
      <mimeMap fileExtension=".woff" mimeType="application/font-woff" />
      <mimeMap fileExtension=".woff2" mimeType="application/font-woff2" />
    </staticContent>
    <httpCompression>
      <dynamicTypes>
        <add mimeType="application/json" enabled="true"/>
        <add mimeType="application/javascript" enabled="true"/>
      </dynamicTypes>
      <staticTypes>
        <add mimeType="text/css" enabled="true"/>
        <add mimeType="application/javascript" enabled="true"/>
      </staticTypes>
    </httpCompression>
  </system.webServer>
</configuration>
EOF

# Clean up to save space
echo "🧹 Cleaning up..."
rm -rf node_modules

echo "✅ Deployment completed successfully!"
echo "📊 Your iCUDA Dashboard should be available shortly."