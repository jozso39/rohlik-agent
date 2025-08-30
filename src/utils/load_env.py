import os
from dotenv import load_dotenv

def load_env():
    """Load environment variables from .env file"""
    env_loaded = load_dotenv()
    
    if env_loaded:
        print("✅ Loaded environment variables from .env file")
    else:
        if os.path.exists(".env"):
            print("⚠️  .env file found but failed to load")
        else:
            print("ℹ️  No .env file found, using system environment variables")
    
    return env_loaded
