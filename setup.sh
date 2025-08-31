#!/bin/bash

# Setup script for RohBot
python3 -m venv venv

# Activate virtual environment and install requirements
source venv/bin/activate
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    cp .env.example .env
    echo "Created .env file - please add your OpenAI API key"
fi

echo "Setup complete! To activate the virtual environment, run:"
echo "source venv/bin/activate"