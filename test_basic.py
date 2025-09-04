"""
Basic functionality test for HAL Control System
Tests basic operations with and without hardware
"""
import sys
import os

# Add current directory to path so we can import our modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from servo_controller import ServoController
from config import Config

def test_config():
    """Test that configuration loads properly"""
    print("Testing configuration...")
    config = Config()
    assert config.NUM_SERVOS == 8
    assert config.MIN_POSITION == 1984
    assert config.MAX_POSITION == 7232
    print("[OK] Configuration test passed")

def test_servo_controller_init():
    """Test servo controller initialization"""
    print("Testing servo controller initialization...")
    try:
        controller = ServoController()
        print("[OK] Servo controller initialized successfully")
        return controller
    except Exception as e:
        print(f"[ERROR] Servo controller initialization failed: {e}")
        return None

def test_hardware_connection(controller):
    """Test connection to actual Maestro hardware"""
    print("Testing hardware connection...")
    try:
        positions = controller.get_servo_status()
        print(f"[OK] Successfully connected to Maestro! Found {len(positions)} servos")
        print("Current positions:")
        for servo_id, position in positions.items():
            print(f"  Servo {servo_id}: {position}")
        return True
    except Exception as e:
        print(f"[INFO] Hardware not connected or not available: {e}")
        print("  This is normal if you don't have the Maestro connected right now")
        return False

def test_scene_directory():
    """Test scene directory creation"""
    print("Testing scene directory...")
    Config.ensure_scenes_dir()
    if os.path.exists(Config.SCENES_DIR):
        print(f"[OK] Scene directory exists at: {Config.SCENES_DIR}")
    else:
        print("[ERROR] Scene directory was not created")

def run_basic_tests():
    """Run all basic tests"""
    print("=" * 50)
    print("HAL Control System - Basic Tests")
    print("=" * 50)
    
    # Test configuration
    test_config()
    print()
    
    # Test servo controller
    controller = test_servo_controller_init()
    print()
    
    # Test hardware (if available)
    if controller:
        hardware_available = test_hardware_connection(controller)
        print()
        
        if hardware_available:
            # If hardware is available, test a safe operation
            print("Testing safe servo operation...")
            try:
                print("  Current status before test:")
                positions = controller.get_servo_status()
                for servo_id, pos in positions.items():
                    print(f"    Servo {servo_id}: {pos}")
                
                # Note: Not actually moving servos in this test to be safe
                print("  [OK] Safe hardware test completed")
                print("  (No servos were moved during this test)")
            except Exception as e:
                print(f"  [ERROR] Hardware test failed: {e}")
        else:
            print("Skipping hardware-specific tests (no hardware connected)")
    
    print()
    
    # Test scene directory
    test_scene_directory()
    print()
    
    print("=" * 50)
    print("Basic tests completed!")
    print()
    print("Next steps:")
    print("1. If hardware tests failed, connect your Maestro via USB")
    print("2. Run 'python app.py' to start the web server")
    print("3. Open http://localhost:5000 in your browser")
    print("4. Test the web interface!")
    print("=" * 50)

if __name__ == "__main__":
    run_basic_tests()