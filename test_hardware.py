"""
Hardware Connection Test for HAL Control System
Tests actual hardware connectivity with clear status reporting
"""
import sys
import os
import subprocess

# Add current directory to path so we can import our modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from servo_controller import ServoController
from config import Config

def test_usccmd_directly():
    """Test UscCmd.exe directly to see what it returns"""
    print("=" * 60)
    print("DIRECT UscCmd.exe TEST")
    print("=" * 60)
    
    try:
        cmd = [Config.USC_CMD_PATH, '--status']
        print(f"Running: {' '.join(cmd)}")
        print("-" * 40)
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
        
        print("RETURN CODE:", result.returncode)
        print("STDOUT:")
        print(result.stdout)
        print("STDERR:")
        print(result.stderr)
        print("-" * 40)
        
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n')
            servo_lines = [line for line in lines if line.strip() and line.split()[0].isdigit()]
            print(f"ANALYSIS: Found {len(servo_lines)} servo status lines")
            
            if len(servo_lines) == 0:
                print("CONCLUSION: UscCmd.exe runs but NO SERVOS detected")
                print("This means:")
                print("  - Pololu software is installed correctly")
                print("  - Maestro is either not connected or not recognized")
                print("  - No servos are configured/connected")
            else:
                print("CONCLUSION: Hardware detected!")
                for line in servo_lines[:3]:  # Show first 3 servos
                    parts = line.split()
                    if len(parts) >= 6:
                        print(f"  Servo {parts[0]}: position {parts[5]}")
        else:
            print("CONCLUSION: UscCmd.exe failed - hardware communication problem")
            
    except FileNotFoundError:
        print("ERROR: UscCmd.exe not found!")
        print(f"Expected path: {Config.USC_CMD_PATH}")
        print("Please install Pololu Maestro Control Center")
        return False
        
    except subprocess.TimeoutExpired:
        print("ERROR: UscCmd.exe timed out - possible hardware issue")
        return False
        
    except Exception as e:
        print(f"ERROR: Unexpected error: {e}")
        return False
    
    return True

def test_servo_controller_with_hardware():
    """Test our servo controller's interpretation"""
    print("\n" + "=" * 60)
    print("SERVO CONTROLLER TEST")
    print("=" * 60)
    
    controller = ServoController()
    
    try:
        print("Attempting to get servo status...")
        positions = controller.get_servo_status()
        
        print(f"SUCCESS: Controller found {len(positions)} servos")
        if len(positions) == 0:
            print("INTERPRETATION: No active servos detected")
            print("This is normal when:")
            print("  - Maestro not connected via USB")
            print("  - Maestro connected but no servos attached")
            print("  - Servos attached but not powered")
        else:
            print("DETECTED SERVOS:")
            for servo_id, position in positions.items():
                print(f"  Servo {servo_id}: {position}")
                
        # Test a safe command
        print("\nTesting safe command (set servo 0 to current position)...")
        try:
            controller.set_servo_position(0, 2000)  # Safe middle position
            print("SUCCESS: Command sent (hardware may not have moved)")
        except Exception as e:
            print(f"FAILED: {e}")
            
    except Exception as e:
        print(f"FAILED: {e}")

def main():
    print("HAL Hardware Connection Test")
    print("This test will show the REAL hardware status\n")
    
    # Test UscCmd directly first
    if test_usccmd_directly():
        # Then test our controller
        test_servo_controller_with_hardware()
    
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print("If you saw '0 servos detected', this means:")
    print("  ✓ Software is working correctly")
    print("  ✓ UscCmd.exe can be found and executed")
    print("  ⚠ No Maestro hardware is currently connected/detected")
    print("\nTo get hardware working:")
    print("  1. Connect Maestro via USB")
    print("  2. Open Pololu Maestro Control Center")
    print("  3. Verify device shows up and servos respond")
    print("  4. Close Maestro Control Center")
    print("  5. Re-run this test")

if __name__ == "__main__":
    main()