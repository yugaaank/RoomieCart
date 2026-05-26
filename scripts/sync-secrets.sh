#!/bin/bash

# Check if .env file exists
if [ ! -f .env ]; then
  echo ".env file not found!"
  exit 1
fi

# Read .env file line by line
while IFS='=' read -r name value || [ -n "$name" ]; do
  # Skip empty lines and comments
  if [[ -z "$name" || "$name" =~ ^# ]]; then
    continue
  fi

  # Only process variables starting with EXPO_PUBLIC_
  if [[ "$name" == EXPO_PUBLIC_* ]]; then
    echo "Processing $name..."
    
    # Try to create the secret. If it exists, delete and recreate it to ensure it's updated.
    # We use --scope project and --type string as standard.
    # Note: value might contain special characters, so we handle it carefully.
    
    # First, try to create it. If it fails, we assume it exists and delete/recreate.
    if eas secret:create --name "$name" --value "$value" --scope project --type string --non-interactive 2>/dev/null; then
      echo "✅ Created $name"
    else
      echo "Secret $name already exists. Updating..."
      # Delete existing
      eas secret:delete --name "$name" --non-interactive 2>/dev/null
      # Recreate
      if eas secret:create --name "$name" --value "$value" --scope project --type string --non-interactive; then
        echo "✅ Updated $name"
      else
        echo "❌ Failed to update $name"
      fi
    fi
  fi
done < .env

echo "Done! All EXPO_PUBLIC_ variables from .env have been synced to EAS Secrets."
