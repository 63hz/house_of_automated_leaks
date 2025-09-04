// HAL Control System JavaScript
class HALController {
    constructor() {
        this.socket = null;
        this.servos = {};
        this.scenes = {};
        this.init();
    }

    init() {
        this.setupSocket();
        this.setupEventListeners();
        this.createServoControls();
        this.createSceneControls();
        this.loadInitialData();
    }

    setupSocket() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            this.updateConnectionStatus(true);
            this.log('Connected to server', 'success');
        });

        this.socket.on('disconnect', () => {
            this.updateConnectionStatus(false);
            this.log('Disconnected from server', 'error');
        });

        this.socket.on('servo_update', (data) => {
            this.updateServoDisplay(data.servo_id, data.position);
            this.log(`Servo ${data.servo_id} moved to ${data.position}`, 'info');
        });

        this.socket.on('all_servos_off', () => {
            for (let i = 0; i < 8; i++) {
                this.updateServoDisplay(i, 0);
            }
            this.log('All servos turned off', 'info');
        });

        this.socket.on('scene_recalled', (data) => {
            for (const [servoId, position] of Object.entries(data.positions)) {
                this.updateServoDisplay(parseInt(servoId), position);
            }
            this.log(`Scene ${data.scene_id} recalled`, 'success');
        });

        this.socket.on('status_update', (positions) => {
            for (const [servoId, position] of Object.entries(positions)) {
                this.updateServoDisplay(parseInt(servoId), position);
            }
        });

        this.socket.on('error', (data) => {
            this.log(`Error: ${data.message}`, 'error');
        });
    }

    setupEventListeners() {
        document.getElementById('allOffBtn').addEventListener('click', () => {
            this.allOff();
        });
    }

    createServoControls() {
        const servosGrid = document.getElementById('servosGrid');
        
        for (let i = 0; i < 8; i++) {
            const servoControl = document.createElement('div');
            servoControl.className = 'servo-control';
            servoControl.innerHTML = `
                <div class="servo-header">
                    <span class="servo-title">Servo ${i}</span>
                    <span class="servo-position" id="position-${i}">0</span>
                </div>
                <div class="servo-controls">
                    <button class="btn btn-secondary nudge-btn" onclick="hal.nudgeServo(${i}, 'minus')">−</button>
                    <input type="number" class="position-input" id="input-${i}" 
                           min="1984" max="7232" value="0" 
                           onchange="hal.setServoPosition(${i}, this.value)">
                    <button class="btn btn-secondary nudge-btn" onclick="hal.nudgeServo(${i}, 'plus')">+</button>
                </div>
                <input type="range" class="position-slider" id="slider-${i}"
                       min="1984" max="7232" value="0"
                       oninput="hal.setServoPosition(${i}, this.value)">
            `;
            servosGrid.appendChild(servoControl);
        }
    }

    createSceneControls() {
        const scenesGrid = document.getElementById('scenesGrid');
        
        for (let i = 1; i <= 8; i++) {
            const sceneControl = document.createElement('div');
            sceneControl.className = 'scene-control';
            sceneControl.innerHTML = `
                <button class="btn btn-primary scene-btn" onclick="hal.recallScene(${i})">
                    Recall Scene ${i}
                </button>
                <button class="btn btn-secondary scene-save-btn" onclick="hal.saveScene(${i})">
                    Save
                </button>
            `;
            scenesGrid.appendChild(sceneControl);
        }
    }

    async loadInitialData() {
        try {
            // Load current servo positions
            const statusResponse = await fetch('/api/status');
            const statusData = await statusResponse.json();
            
            if (statusData.success) {
                for (const [servoId, position] of Object.entries(statusData.positions)) {
                    this.updateServoDisplay(parseInt(servoId), position);
                }
            }

            // Load available scenes
            const scenesResponse = await fetch('/api/scenes');
            const scenesData = await scenesResponse.json();
            
            if (scenesData.success) {
                this.scenes = scenesData.scenes;
                // You could update scene buttons to show which ones are saved
            }
        } catch (error) {
            this.log(`Failed to load initial data: ${error.message}`, 'error');
        }
    }

    updateServoDisplay(servoId, position) {
        const positionElement = document.getElementById(`position-${servoId}`);
        const inputElement = document.getElementById(`input-${servoId}`);
        const sliderElement = document.getElementById(`slider-${servoId}`);
        
        if (positionElement) positionElement.textContent = position;
        if (inputElement) inputElement.value = position;
        if (sliderElement) sliderElement.value = position;
    }

    updateConnectionStatus(connected) {
        const statusIndicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');
        
        if (connected) {
            statusIndicator.className = 'status-indicator connected';
            statusText.textContent = 'Connected';
        } else {
            statusIndicator.className = 'status-indicator disconnected';
            statusText.textContent = 'Disconnected';
        }
    }

    async setServoPosition(servoId, position) {
        try {
            const response = await fetch(`/api/servo/${servoId}/position`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ position: parseInt(position) })
            });
            
            const data = await response.json();
            if (!data.success) {
                this.log(`Failed to set servo ${servoId}: ${data.error}`, 'error');
            }
        } catch (error) {
            this.log(`Error setting servo ${servoId}: ${error.message}`, 'error');
        }
    }

    async nudgeServo(servoId, direction) {
        try {
            const response = await fetch(`/api/servo/${servoId}/nudge`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ direction })
            });
            
            const data = await response.json();
            if (!data.success) {
                this.log(`Failed to nudge servo ${servoId}: ${data.error}`, 'error');
            }
        } catch (error) {
            this.log(`Error nudging servo ${servoId}: ${error.message}`, 'error');
        }
    }

    async allOff() {
        try {
            const response = await fetch('/api/all-off', {
                method: 'POST'
            });
            
            const data = await response.json();
            if (!data.success) {
                this.log(`Failed to turn off all servos: ${data.error}`, 'error');
            }
        } catch (error) {
            this.log(`Error turning off servos: ${error.message}`, 'error');
        }
    }

    async saveScene(sceneId) {
        try {
            const response = await fetch(`/api/scenes/${sceneId}/save`, {
                method: 'POST'
            });
            
            const data = await response.json();
            if (data.success) {
                this.log(`Scene ${sceneId} saved successfully`, 'success');
            } else {
                this.log(`Failed to save scene ${sceneId}: ${data.error}`, 'error');
            }
        } catch (error) {
            this.log(`Error saving scene ${sceneId}: ${error.message}`, 'error');
        }
    }

    async recallScene(sceneId) {
        try {
            const response = await fetch(`/api/scenes/${sceneId}/recall`, {
                method: 'POST'
            });
            
            const data = await response.json();
            if (!data.success) {
                this.log(`Failed to recall scene ${sceneId}: ${data.error}`, 'error');
            }
        } catch (error) {
            this.log(`Error recalling scene ${sceneId}: ${error.message}`, 'error');
        }
    }

    log(message, type = 'info') {
        const logContainer = document.getElementById('logContainer');
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.textContent = `[${timestamp}] ${message}`;
        
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
        
        // Keep only last 50 log entries
        while (logContainer.children.length > 50) {
            logContainer.removeChild(logContainer.firstChild);
        }
    }
}

// Initialize the application
let hal;
document.addEventListener('DOMContentLoaded', () => {
    hal = new HALController();
});