# Technical Specification: HAL Control System Web Server

## 1. System Architecture
The system will run on a central Windows PC which acts as the host.
* **Host PC:**
    * Physically connected to the Pololu Maestro(s) and Elgato Stream Deck via USB.
    * Runs the Python-based web server.
    * Stores and executes all PowerShell/Batch control scripts.
* **Web Server (Backend):** A Python application built with the Flask framework and Flask-SocketIO for real-time communication.
* **Web Clients (Frontend):** Any device with a modern web browser on the local network (phones, tablets, PCs).
* **Data Flow:**
    1.  Clients connect to the Flask server and receive the HTML/JS/CSS frontend.
    2.  The server starts a background thread to periodically poll the Maestro for servo status using `UscCmd.exe`.
    3.  This status is broadcast to all connected clients via WebSockets.
    4.  Clients send user actions (slider moves, button presses) back to the server via API calls.
    5.  The server translates these API calls into commands to execute the appropriate control scripts.



## 2. Technology Stack
* **Backend:** Python 3.x, Flask, Flask-SocketIO
* **Control Scripts:** PowerShell, Windows Batch Files
* **Frontend:** HTML5, CSS3, JavaScript (no complex JS frameworks are necessary for V1)

## 3. Configuration (`config.json`)
The server's behavior must be driven by a `config.json` file in the root directory. This allows for easy scaling and modification.

**Example `config.json`:**
```json
{
  "servos": [
    {
      "channel": 0,
      "name": "Main Damper",
      "min_us": 500,
      "max_us": 1800
    },
    {
      "channel": 1,
      "name": "Basement Vent",
      "min_us": 500,
      "max_us": 1800
    }
  ],
  "scenes": [
    {
      "name": "All Open",
      "description": "Sets all dampers to their fully open position.",
      "file": "Recall-Scene-1.bat"
    },
    {
      "name": "Standard Airflow",
      "description": "A standard operating configuration.",
      "file": "Recall-Scene-2.bat"
    }
  ]
}

4. Backend Design (Python/Flask)
    4.1. API Endpoints
    The server will expose a simple RESTful API for actions.

    GET /config: Returns the config.json file to the frontend so it can build the UI.

    POST /api/set_servo:

    Payload: { "channel": <int>, "target_us": <int> }

    Action: Executes a script to set a single servo to a specific microsecond value. This is used by the sliders.

    POST /api/recall_scene:

    Payload: { "scene_name": "<string>" }

    Action: Executes the batch file associated with the named scene.

    POST /api/save_scene:

    Payload: { "scene_name": "<string>" }

    Action: Executes the PowerShell script to save the current servo states to the named scene file.

    4.2. WebSocket Communication
    A background thread will run every 1-2 seconds.

    In the thread, it will execute UscCmd.exe --status, parse the full output, and build a JSON object of the current servo positions (e.g., { "0": 1500, "1": 1240, ... } in microseconds).

    The server will then emit this data to all connected clients on a 'status_update' event: socketio.emit('status_update', servo_positions).

5. Frontend Design (JavaScript)
    On page load, fetch /config to get the servo and scene definitions.

    Dynamically generate the HTML controls (a div for each servo with a name, slider, and text display; a button for each scene).

    Establish a WebSocket connection to the server.

    Listen for the 'status_update' event. On receipt, update the values and slider positions for all servos to match the incoming data.

    When a user moves a slider, send a POST request to /api/set_servo with the channel number and new target value.

    When a user clicks a scene button, send a POST request to /api/recall_scene or /api/save_scene.

6. Code Maintainability
    The generated code must be clean, well-commented, and maintainable by a human developer.

    Use clear and descriptive variable and function names.

    Add comments to explain the purpose of complex functions, especially in the backend (parsing logic, script execution) and frontend (UI generation, WebSocket handling).

    The Python server should be contained in a single, well-structured file (server.py).

    The frontend should be in a static subfolder with standard index.html, style.css, and script.js files.