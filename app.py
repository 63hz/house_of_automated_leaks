"""
HAL (House of Automated Leaks) Control System
Web-based interface for HVAC training equipment
"""
from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
from servo_controller import ServoController
from config import Config
import json

app = Flask(__name__)
app.config['SECRET_KEY'] = Config.SECRET_KEY
socketio = SocketIO(app, cors_allowed_origins="*")

# Initialize servo controller
servo_controller = ServoController()

@app.route('/')
def index():
    """Main control interface"""
    return render_template('index.html', config=Config)

@app.route('/api/status')
def get_status():
    """Get current servo positions"""
    try:
        positions = servo_controller.get_servo_status()
        # Add servo names to the response
        servo_data = {}
        for servo_id, position in positions.items():
            servo_data[servo_id] = {
                'position': position,
                'percentage': Config.position_to_percentage(position),
                'name': Config.get_servo_name(servo_id)
            }
        return jsonify({'success': True, 'positions': positions, 'servo_data': servo_data})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/servo/<int:servo_id>/position', methods=['POST'])
def set_servo_position(servo_id):
    """Set servo to specific position"""
    try:
        data = request.get_json()
        position = int(data['position'])
        servo_controller.set_servo_position(servo_id, position)
        
        # Broadcast update to all connected clients
        socketio.emit('servo_update', {
            'servo_id': servo_id, 
            'position': position
        })
        
        return jsonify({'success': True, 'position': position})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/servo/<int:servo_id>/nudge', methods=['POST'])
def nudge_servo(servo_id):
    """Nudge servo in specified direction"""
    try:
        data = request.get_json()
        direction = data['direction']
        new_position = servo_controller.nudge_servo(servo_id, direction)
        
        # Broadcast update to all connected clients
        socketio.emit('servo_update', {
            'servo_id': servo_id, 
            'position': new_position
        })
        
        return jsonify({'success': True, 'position': new_position})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/all-off', methods=['POST'])
def all_off():
    """Turn all servos off"""
    try:
        servo_controller.all_off()
        
        # Broadcast update to all connected clients
        socketio.emit('all_servos_off')
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/scenes')
def get_scenes():
    """Get available scenes"""
    try:
        scenes = servo_controller.get_available_scenes()
        return jsonify({'success': True, 'scenes': scenes})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/scenes/<int:scene_id>/update', methods=['POST'])
def update_scene_metadata(scene_id):
    """Update scene metadata (name, description, locked status)"""
    try:
        data = request.get_json()
        servo_controller.update_scene_metadata(scene_id, data)
        return jsonify({'success': True, 'message': f'Scene {scene_id} updated'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/config')
def get_config():
    """Get system configuration for frontend"""
    try:
        config_data = {
            'num_servos': Config.NUM_SERVOS,
            'servo_names': Config.SERVO_NAMES,
            'max_scenes': Config.MAX_SCENES,
            'visual_display_style': Config.VISUAL_DISPLAY_STYLE,
            'gate_dimensions': Config.GATE_DIMENSIONS,
            'show_raw_values': Config.SHOW_RAW_VALUES
        }
        return jsonify({'success': True, 'config': config_data})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/scenes/<int:scene_id>/save', methods=['POST'])
def save_scene(scene_id):
    """Save current positions as a scene"""
    try:
        data = request.get_json() or {}
        name = data.get('name', f'Scene {scene_id}')
        description = data.get('description', '')
        locked = data.get('locked', False)
        servo_controller.save_scene(scene_id, name=name, description=description, locked=locked)
        return jsonify({'success': True, 'message': f'Scene {scene_id} saved'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/scenes/<int:scene_id>/recall', methods=['POST'])
def recall_scene(scene_id):
    """Recall a saved scene"""
    try:
        servo_controller.recall_scene(scene_id)
        
        # Get new positions and broadcast to all clients
        positions = servo_controller.get_servo_status()
        socketio.emit('scene_recalled', {
            'scene_id': scene_id,
            'positions': positions
        })
        
        return jsonify({'success': True, 'positions': positions})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    print('Client connected')
    # Send current status to newly connected client
    try:
        positions = servo_controller.get_servo_status()
        emit('status_update', positions)
    except Exception as e:
        emit('error', {'message': str(e)})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    print('Client disconnected')

if __name__ == '__main__':
    print("Starting HAL Control System...")
    print(f"Web interface will be available at http://localhost:{Config.PORT}")
    socketio.run(app, host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)