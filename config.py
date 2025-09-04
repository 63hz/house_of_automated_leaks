"""
Configuration settings for the HAL Control System
"""
import os

class Config:
    # Maestro Configuration
    USC_CMD_PATH = r"C:\Program Files (x86)\Pololu\Maestro\bin\UscCmd.exe"
    
    # Servo Configuration
    NUM_SERVOS = 8
    MIN_POSITION = 1984  # 496 μs
    MAX_POSITION = 7232  # 1808 μs
    NUDGE_AMOUNT = 128   # 32 μs
    
    # Scene Storage
    SCENES_DIR = "scenes"
    MAX_SCENES = 8
    
    # Web Server Configuration  
    HOST = "0.0.0.0"  # Listen on all interfaces
    PORT = 5000
    DEBUG = True
    
    # Security (for production deployment later)
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-change-in-production'
    
    @classmethod
    def ensure_scenes_dir(cls):
        """Create scenes directory if it doesn't exist"""
        if not os.path.exists(cls.SCENES_DIR):
            os.makedirs(cls.SCENES_DIR)