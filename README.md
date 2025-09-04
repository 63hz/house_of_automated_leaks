# HAL Control System
**House of Automated Leaks - HVAC Training Interface**

A web-based control system for HVAC training equipment with servo-controlled dampers. Multiple users can connect via phones/tablets to control servo positions and manage preset scenes.

## Features

- **Real-time Web Interface**: Control servos from any device with a web browser
- **Multi-user Support**: Multiple people can connect and see live updates
- **Scene Management**: Save and recall preset damper configurations
- **Safety Limits**: Automatic enforcement of servo position limits
- **Live Updates**: WebSocket communication for real-time feedback
- **Responsive Design**: Works on phones, tablets, and desktops

## Quick Start

### 1. Prerequisites
- Python 3.13.5 (already installed ✓)
- Pololu Maestro servo controller connected via USB
- Pololu Maestro Control Center software installed ✓

### 2. Setup
```bash
# Activate the virtual environment (in PowerShell/CMD)
venv\Scripts\activate

# Verify installation
python test_basic.py
```

### 3. Run the Application
```bash
# Start the web server
python app.py
```

### 4. Access the Interface
Open your web browser and go to: `http://localhost:5000`

From other devices on the same network, use your computer's IP address:
`http://YOUR_IP_ADDRESS:5000`

## Project Structure

```
house_of_automated_leaks/
├── app.py                 # Main Flask web server
├── servo_controller.py    # Maestro communication logic
├── config.py              # Configuration settings
├── test_basic.py          # Basic functionality tests
├── requirements.txt       # Python dependencies
├── templates/
│   └── index.html         # Web interface template
├── static/
│   ├── css/style.css      # Interface styling
│   └── js/app.js          # Frontend JavaScript
├── scenes/                # Saved scene configurations
├── scripts/               # Your original batch/PowerShell scripts
└── docs/                  # Project documentation
```

## Usage

### Servo Control
- **Individual Control**: Use sliders, input boxes, or +/- buttons
- **Fine Tuning**: +/- buttons move in 32μs increments
- **Safety Limits**: Positions automatically clamped to safe range (1984-7232)
- **Real-time Updates**: All connected users see position changes instantly

### Scene Management
- **Save Scene**: Click "Save" button to capture current positions
- **Recall Scene**: Click "Recall Scene X" to restore saved positions
- **8 Scene Slots**: Scenes 1-8 available
- **Persistent Storage**: Scenes saved as JSON files in `/scenes` directory

### Emergency Stop
- **ALL OFF Button**: Immediately sets all servos to position 0 (closed)

## Technical Details

### Communication
- **Backend**: Python Flask with WebSocket support
- **Frontend**: HTML5, CSS3, JavaScript with Socket.IO
- **Hardware Interface**: Pololu UscCmd.exe command-line tool
- **Data Storage**: JSON files for scene persistence

### Configuration
Key settings in `config.py`:
- `NUM_SERVOS = 8` (channels 0-7)
- `MIN_POSITION = 1984` (496μs pulse width)
- `MAX_POSITION = 7232` (1808μs pulse width)
- `NUDGE_AMOUNT = 128` (32μs increments)

### API Endpoints
- `GET /api/status` - Get current servo positions
- `POST /api/servo/{id}/position` - Set servo position
- `POST /api/servo/{id}/nudge` - Nudge servo +/-
- `POST /api/all-off` - Turn all servos off
- `GET /api/scenes` - Get available scenes
- `POST /api/scenes/{id}/save` - Save current scene
- `POST /api/scenes/{id}/recall` - Recall saved scene

## Development

### Git Workflow
This project uses a simple branching strategy:
- `master`: Always working, deployable code
- `feature/*`: Individual features (merge when complete)

### VS Code Setup
The project includes VS Code configuration:
- Python virtual environment automatically activated
- Debug configuration for Flask app
- Proper file associations for PowerShell scripts

### Testing
```bash
# Run basic functionality tests
python test_basic.py

# Test with hardware connected for full validation
```

## Troubleshooting

### Common Issues

**"UscCmd.exe not found"**
- Ensure Pololu Maestro Control Center is installed
- Check path in `config.py` matches your installation

**"Permission denied" or "Access denied"**
- Make sure Maestro Control Center is closed
- Only one program can access the Maestro at a time

**Web interface not loading**
- Check that Flask server started successfully
- Verify firewall isn't blocking port 5000
- Try accessing via `127.0.0.1:5000` instead of `localhost:5000`

**Servos not responding**
- Check USB connection to Maestro
- Verify servo power supply is connected
- Run Maestro Control Center to test hardware

### Getting Help
- Check the activity log in the web interface for error messages
- Run `python test_basic.py` to diagnose configuration issues
- Review servo positions in Maestro Control Center

## Original Scripts
Your original batch and PowerShell scripts are preserved in the `/scripts` directory and remain fully functional. The new web interface provides the same functionality with a modern, multi-user interface.