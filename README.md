# HAL Control System
**House of Automated Leaks - HVAC Training Interface**

A web-based control system for HVAC training equipment with servo-controlled dampers. Multiple users can connect via phones/tablets to control servo positions and manage preset scenes.

## Features

- **Real-time Web Interface**: Control servos from any device with a web browser
- **Multi-user Support**: Multiple people can connect and see live updates
- **Config Mode**: Toggle between normal operation and configuration modes to prevent accidental changes
- **Enhanced Scene Management**: Save/recall preset configurations with custom names, descriptions, and lock protection
- **User-Friendly Display**: 0-100% scale for valve positions instead of raw servo values
- **Visual Indicators**: Multiple display styles (bar, gate graphic, percentage) for at-a-glance status
- **Customizable Names**: Configure servo names like "Return", "Kitchen", "Make-up Air" in config.py
- **Safety Limits**: Automatic enforcement of servo position limits
- **Live Updates**: WebSocket communication for real-time feedback
- **Responsive Design**: Optimized for touchscreens, tablets, and desktops

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

### Operation Modes

#### Normal Mode (Default)
Safe operation mode for day-to-day use:
- Adjust servo positions freely
- Recall any scene
- Locked scenes cannot be overwritten
- Prevents accidental configuration changes

#### Config Mode
Full control for setup and maintenance:
- Click **"Config Mode"** button (turns orange when active)
- Edit scene names, descriptions, and lock status
- Save over locked scenes
- Modify any configuration

### Servo Control
- **Percentage Display**: Positions shown as 0-100% (0=closed, 100=open)
- **Custom Names**: Each servo displays its configured name (Return, Kitchen, etc.)
- **Visual Indicators**: See valve opening with bar graph, gate graphic, or percentage display
- **Individual Control**: Use sliders or +/- buttons for fine control
- **Real-time Updates**: All connected users see position changes instantly

### Scene Management

#### Saving Scenes
1. Adjust servos to desired positions
2. Click **"Save"** on any scene slot
3. If scene exists, confirm overwrite (shows scene name and description)
4. Locked scenes require Config Mode to modify

#### Scene Metadata (Config Mode only)
1. Enter **Config Mode**
2. Click **"Edit"** on any saved scene
3. Set custom name (e.g., "Full Airflow", "Bedroom Test")
4. Add description (e.g., "All vents 50% open for baseline")
5. Lock scene to prevent accidental changes

#### Recalling Scenes
- Click **"Recall"** button to restore saved positions
- All servos move to saved values simultaneously
- Empty slots show "Empty Slot X"

### Emergency Stop
- **ALL OFF Button**: Immediately closes all valves (sets to 0%)

## Technical Details

### Communication
- **Backend**: Python Flask with WebSocket support
- **Frontend**: HTML5, CSS3, JavaScript with Socket.IO
- **Hardware Interface**: Pololu UscCmd.exe command-line tool
- **Data Storage**: JSON files for scene persistence

### Configuration

Customize your system by editing `config.py`:

#### Servo Names
```python
SERVO_NAMES = {
    0: "Return",
    1: "Kitchen",
    2: "Make-up Air",
    3: "Living Room",
    # ... customize for your installation
}
```

#### Visual Display Style
```python
VISUAL_DISPLAY_STYLE = "bar"  # Options: "bar", "rectangle", "percentage", "all"
```
- **bar**: Horizontal gradient progress bar (default)
- **rectangle**: Physical gate representation with dimensions
- **percentage**: Large numeric percentage display
- **all**: Show all three styles side-by-side

#### Gate Dimensions
```python
GATE_DIMENSIONS = {
    0: {"width": 1, "height": 5},  # 1" × 5" opening
    1: {"width": 5, "height": 5},  # 5" × 5" opening
    # ... configure per servo
}
```

#### Other Settings
- `NUM_SERVOS = 8` (channels 0-7)
- `MIN_POSITION = 1984` (496μs pulse width)
- `MAX_POSITION = 7232` (1808μs pulse width)
- `NUDGE_AMOUNT = 128` (32μs increments)
- `SHOW_RAW_VALUES = False` (show raw values alongside percentages)
- `MAX_SCENES = 8` (number of scene slots)

### API Endpoints
- `GET /api/config` - Get system configuration (servo names, display style, etc.)
- `GET /api/status` - Get current servo positions (includes percentage and names)
- `POST /api/servo/{id}/position` - Set servo position (raw value)
- `POST /api/servo/{id}/nudge` - Nudge servo +/-
- `POST /api/all-off` - Turn all servos off
- `GET /api/scenes` - Get available scenes (with names, descriptions, lock status)
- `POST /api/scenes/{id}/save` - Save current scene (with optional name, description, locked)
- `POST /api/scenes/{id}/update` - Update scene metadata only (name, description, locked)
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