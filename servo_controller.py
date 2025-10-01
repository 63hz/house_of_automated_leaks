"""
Servo Controller Module for HAL System
Interfaces with Pololu Maestro via UscCmd.exe
"""
import subprocess
import json
import os
from typing import Dict, List, Optional
from config import Config

class ServoController:
    def __init__(self):
        self.config = Config()
        self.config.ensure_scenes_dir()
    
    def _run_usc_cmd(self, args: List[str]) -> str:
        """Execute UscCmd.exe with given arguments"""
        try:
            cmd = [self.config.USC_CMD_PATH] + args
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
            if result.returncode != 0:
                raise Exception(f"UscCmd failed: {result.stderr}")
            return result.stdout
        except FileNotFoundError:
            raise Exception("UscCmd.exe not found. Please ensure Pololu Maestro software is installed.")
        except subprocess.TimeoutExpired:
            raise Exception("UscCmd.exe timed out. Check Maestro connection.")
    
    def get_servo_status(self) -> Dict[int, int]:
        """Get current positions of all servos"""
        try:
            output = self._run_usc_cmd(['--status'])
            positions = {}
            
            for line in output.split('\n'):
                if line.strip():
                    parts = line.split()
                    if len(parts) >= 5 and parts[0].isdigit():
                        servo_id = int(parts[0])
                        if servo_id < self.config.NUM_SERVOS:
                            positions[servo_id] = int(parts[4])  # 'pos' column
            
            return positions
        except Exception as e:
            raise Exception(f"Failed to get servo status: {str(e)}")
    
    def set_servo_position(self, servo_id: int, position: int) -> None:
        """Set a specific servo to a specific position"""
        if not 0 <= servo_id < self.config.NUM_SERVOS:
            raise ValueError(f"Servo ID must be between 0 and {self.config.NUM_SERVOS - 1}")
        
        # Enforce safety limits
        position = max(self.config.MIN_POSITION, min(self.config.MAX_POSITION, position))
        
        try:
            self._run_usc_cmd(['--servo', f'{servo_id},{position}'])
        except Exception as e:
            raise Exception(f"Failed to set servo {servo_id} to position {position}: {str(e)}")
    
    def nudge_servo(self, servo_id: int, direction: str) -> int:
        """Nudge servo in given direction, returns new position"""
        if not 0 <= servo_id < self.config.NUM_SERVOS:
            raise ValueError(f"Servo ID must be between 0 and {self.config.NUM_SERVOS - 1}")
        
        current_positions = self.get_servo_status()
        if servo_id not in current_positions:
            raise Exception(f"Could not read current position for servo {servo_id}")
        
        current_pos = current_positions[servo_id]
        
        if direction == "plus":
            new_pos = current_pos + self.config.NUDGE_AMOUNT
        elif direction == "minus":
            new_pos = current_pos - self.config.NUDGE_AMOUNT
        else:
            raise ValueError("Direction must be 'plus' or 'minus'")
        
        # Enforce limits
        new_pos = max(self.config.MIN_POSITION, min(self.config.MAX_POSITION, new_pos))
        
        self.set_servo_position(servo_id, new_pos)
        return new_pos
    
    def all_off(self) -> None:
        """Set all servos to position 0 (off)"""
        for servo_id in range(self.config.NUM_SERVOS):
            self.set_servo_position(servo_id, 0)
    
    def save_scene(self, scene_id: int, name: str = None, description: str = '', locked: bool = False) -> None:
        """Save current servo positions as a scene"""
        if not 1 <= scene_id <= self.config.MAX_SCENES:
            raise ValueError(f"Scene ID must be between 1 and {self.config.MAX_SCENES}")

        positions = self.get_servo_status()

        # Preserve existing metadata if updating
        scene_file = os.path.join(self.config.SCENES_DIR, f"scene_{scene_id}.json")
        existing_data = {}
        if os.path.exists(scene_file):
            try:
                with open(scene_file, 'r') as f:
                    existing_data = json.load(f)
            except Exception:
                pass

        scene_data = {
            'scene_id': scene_id,
            'name': name or existing_data.get('name', f'Scene {scene_id}'),
            'description': description or existing_data.get('description', ''),
            'locked': locked if locked is not None else existing_data.get('locked', False),
            'positions': positions
        }

        with open(scene_file, 'w') as f:
            json.dump(scene_data, f, indent=2)
    
    def recall_scene(self, scene_id: int) -> None:
        """Recall a saved scene"""
        if not 1 <= scene_id <= self.config.MAX_SCENES:
            raise ValueError(f"Scene ID must be between 1 and {self.config.MAX_SCENES}")
        
        scene_file = os.path.join(self.config.SCENES_DIR, f"scene_{scene_id}.json")
        if not os.path.exists(scene_file):
            raise FileNotFoundError(f"Scene {scene_id} not found")
        
        with open(scene_file, 'r') as f:
            scene_data = json.load(f)
        
        for servo_id, position in scene_data['positions'].items():
            self.set_servo_position(int(servo_id), position)
    
    def get_available_scenes(self) -> Dict[int, dict]:
        """Get list of available saved scenes"""
        scenes = {}
        for scene_id in range(1, self.config.MAX_SCENES + 1):
            scene_file = os.path.join(self.config.SCENES_DIR, f"scene_{scene_id}.json")
            if os.path.exists(scene_file):
                try:
                    with open(scene_file, 'r') as f:
                        scene_data = json.load(f)
                        scenes[scene_id] = {
                            'name': scene_data.get('name', f'Scene {scene_id}'),
                            'description': scene_data.get('description', ''),
                            'locked': scene_data.get('locked', False),
                            'positions': scene_data['positions']
                        }
                except Exception:
                    continue  # Skip corrupted scene files
        return scenes

    def update_scene_metadata(self, scene_id: int, metadata: dict) -> None:
        """Update scene metadata without changing positions"""
        if not 1 <= scene_id <= self.config.MAX_SCENES:
            raise ValueError(f"Scene ID must be between 1 and {self.config.MAX_SCENES}")

        scene_file = os.path.join(self.config.SCENES_DIR, f"scene_{scene_id}.json")
        if not os.path.exists(scene_file):
            raise FileNotFoundError(f"Scene {scene_id} not found")

        with open(scene_file, 'r') as f:
            scene_data = json.load(f)

        # Update only provided metadata fields
        if 'name' in metadata:
            scene_data['name'] = metadata['name']
        if 'description' in metadata:
            scene_data['description'] = metadata['description']
        if 'locked' in metadata:
            scene_data['locked'] = metadata['locked']

        with open(scene_file, 'w') as f:
            json.dump(scene_data, f, indent=2)