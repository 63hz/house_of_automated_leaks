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

    # Servo Names (customize for your installation)
    SERVO_NAMES = {
        0: "Bath",
        1: "Bedroom Return",
        2: "Laundry Room",
        3: "Bedroom Supply",
        4: "Main House Hall",
        5: "Return Air Main",
        6: "Supply Air Main",
        7: "Main House Kitchen"
    }

    # Gate/Valve Visual Configuration
    # Visual representation options: "bar", "rectangle", "percentage"
    VISUAL_DISPLAY_STYLE = "rectangle"  # Options: "bar", "rectangle", "percentage", "all"

    # Gate dimensions (width x height in inches)
    GATE_DIMENSIONS = {
        0: {"width": 1, "height": 5},
        1: {"width": 1, "height": 5},
        2: {"width": 1, "height": 5},
        3: {"width": 1, "height": 5},
        4: {"width": 1, "height": 5},
        5: {"width": 1, "height": 5},
        6: {"width": 1, "height": 5},
        7: {"width": 1, "height": 5}
    }

    # Scene Storage
    SCENES_DIR = "scenes"
    MAX_SCENES = 8

    # UI Configuration
    SHOW_RAW_VALUES = False  # Set to True to show raw servo values alongside percentages
    DEFAULT_CONFIG_MODE = True  # Start in normal operation mode (not config mode)

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

    @classmethod
    def get_servo_name(cls, servo_id):
        """Get the display name for a servo"""
        return cls.SERVO_NAMES.get(servo_id, f"Servo {servo_id}")

    @classmethod
    def position_to_percentage(cls, position):
        """Convert raw servo position to 0-100 percentage"""
        if position == 0:
            return 0
        # Map MIN_POSITION to 0% and MAX_POSITION to 100%
        percentage = ((position - cls.MIN_POSITION) / (cls.MAX_POSITION - cls.MIN_POSITION)) * 100
        return max(0, min(100, round(percentage, 1)))

    @classmethod
    def percentage_to_position(cls, percentage):
        """Convert 0-100 percentage to raw servo position"""
        if percentage <= 0:
            return 0
        # Map 0% to MIN_POSITION and 100% to MAX_POSITION
        position = cls.MIN_POSITION + ((percentage / 100) * (cls.MAX_POSITION - cls.MIN_POSITION))
        return int(max(cls.MIN_POSITION, min(cls.MAX_POSITION, position)))