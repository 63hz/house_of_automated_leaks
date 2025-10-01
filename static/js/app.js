// HAL Control System JavaScript
class HALController {
    constructor() {
        this.socket = null;
        this.servos = {};
        this.scenes = {};
        this.config = {};
        this.configMode = false;  // Start in normal operation mode
        this.init();
    }

    async init() {
        await this.loadConfig();
        this.createServoControls();
        this.createSceneControls();
        this.setupSocket();
        this.setupEventListeners();
        await this.loadInitialData();
        this.updateConfigModeUI();
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

        // Config mode toggle
        const configModeBtn = document.getElementById('configModeBtn');
        if (configModeBtn) {
            configModeBtn.addEventListener('click', () => {
                this.toggleConfigMode();
            });
        }
    }

    async loadConfig() {
        try {
            const response = await fetch('/api/config');
            const data = await response.json();
            if (data.success) {
                this.config = data.config;
            }
        } catch (error) {
            this.log(`Failed to load config: ${error.message}`, 'error');
        }
    }

    toggleConfigMode() {
        this.configMode = !this.configMode;
        this.updateConfigModeUI();
        this.log(`${this.configMode ? 'Config' : 'Normal'} mode activated`, 'info');
    }

    updateConfigModeUI() {
        const configModeBtn = document.getElementById('configModeBtn');
        const body = document.body;

        if (this.configMode) {
            body.classList.add('config-mode');
            if (configModeBtn) configModeBtn.textContent = 'Exit Config Mode';
        } else {
            body.classList.remove('config-mode');
            if (configModeBtn) configModeBtn.textContent = 'Config Mode';
        }

        // Update scene controls visibility
        this.updateSceneButtonsState();
    }

    updateSceneButtonsState() {
        for (let i = 1; i <= (this.config.max_scenes || 8); i++) {
            const sceneData = this.scenes[i];
            const saveBtn = document.querySelector(`[data-scene-save="${i}"]`);
            const editBtn = document.querySelector(`[data-scene-edit="${i}"]`);

            if (saveBtn && sceneData?.locked && !this.configMode) {
                saveBtn.disabled = true;
                saveBtn.title = 'Scene is locked - enter Config Mode to edit';
            } else if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.title = '';
            }

            if (editBtn) {
                editBtn.style.display = this.configMode ? 'inline-block' : 'none';
            }
        }
    }

    createServoControls() {
        const servosGrid = document.getElementById('servosGrid');
        const numServos = this.config.num_servos || 8;

        for (let i = 0; i < numServos; i++) {
            const servoName = this.config.servo_names?.[i] || `Servo ${i}`;
            const servoControl = document.createElement('div');
            servoControl.className = 'servo-control';
            servoControl.innerHTML = `
                <div class="servo-header">
                    <span class="servo-title">${servoName}</span>
                    <span class="servo-position" id="position-${i}">0%</span>
                    ${this.config.show_raw_values ? `<span class="servo-raw" id="raw-${i}">(0)</span>` : ''}
                </div>
                <div class="visual-indicator" id="visual-${i}"></div>
                <div class="servo-controls">
                    <button class="btn btn-secondary nudge-btn" onclick="hal.nudgeServo(${i}, 'minus')">−</button>
                    <input type="range" class="position-slider" id="slider-${i}"
                           min="0" max="100" value="0" step="0.1"
                           oninput="hal.setServoPercentage(${i}, this.value)">
                    <button class="btn btn-secondary nudge-btn" onclick="hal.nudgeServo(${i}, 'plus')">+</button>
                </div>
            `;
            servosGrid.appendChild(servoControl);
        }
    }

    createSceneControls() {
        const scenesGrid = document.getElementById('scenesGrid');
        const maxScenes = this.config.max_scenes || 8;

        for (let i = 1; i <= maxScenes; i++) {
            const sceneControl = document.createElement('div');
            sceneControl.className = 'scene-control';
            sceneControl.id = `scene-control-${i}`;
            sceneControl.innerHTML = `
                <div class="scene-info" id="scene-info-${i}">
                    <span class="scene-name" id="scene-name-${i}">Empty Slot ${i}</span>
                    <span class="scene-description" id="scene-desc-${i}"></span>
                </div>
                <div class="scene-buttons">
                    <button class="btn btn-primary scene-btn" onclick="hal.recallScene(${i})">
                        Recall
                    </button>
                    <button class="btn btn-secondary scene-save-btn" data-scene-save="${i}" onclick="hal.saveScenePrompt(${i})">
                        Save
                    </button>
                    <button class="btn btn-tertiary scene-edit-btn" data-scene-edit="${i}" onclick="hal.editSceneMetadata(${i})" style="display:none;">
                        Edit
                    </button>
                </div>
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
                this.updateSceneDisplay();
                this.updateSceneButtonsState();
            }
        } catch (error) {
            this.log(`Failed to load initial data: ${error.message}`, 'error');
        }
    }

    updateSceneDisplay() {
        // Update all scene slots
        for (let i = 1; i <= (this.config.max_scenes || 8); i++) {
            const nameEl = document.getElementById(`scene-name-${i}`);
            const descEl = document.getElementById(`scene-desc-${i}`);
            const controlEl = document.getElementById(`scene-control-${i}`);

            const sceneData = this.scenes[i];

            if (sceneData) {
                // Scene exists - show its data
                if (nameEl) nameEl.textContent = sceneData.name || `Scene ${i}`;
                if (descEl) descEl.textContent = sceneData.description || '';
                if (controlEl && sceneData.locked) {
                    controlEl.classList.add('locked');
                } else if (controlEl) {
                    controlEl.classList.remove('locked');
                }
            } else {
                // Empty scene slot - show placeholder
                if (nameEl) nameEl.textContent = `Empty Slot ${i}`;
                if (descEl) descEl.textContent = '';
                if (controlEl) controlEl.classList.remove('locked');
            }
        }
    }

    updateServoDisplay(servoId, position) {
        const positionElement = document.getElementById(`position-${servoId}`);
        const rawElement = document.getElementById(`raw-${servoId}`);
        const sliderElement = document.getElementById(`slider-${servoId}`);
        const visualElement = document.getElementById(`visual-${servoId}`);

        // Convert position to percentage
        const percentage = this.positionToPercentage(position);

        if (positionElement) positionElement.textContent = `${percentage}%`;
        if (rawElement) rawElement.textContent = `(${position})`;
        if (sliderElement) sliderElement.value = percentage;
        if (visualElement) this.updateVisualIndicator(visualElement, percentage, servoId);
    }

    positionToPercentage(position) {
        if (position === 0) return 0;
        const minPos = 1984;
        const maxPos = 7232;
        const percentage = ((position - minPos) / (maxPos - minPos)) * 100;
        return Math.max(0, Math.min(100, Math.round(percentage * 10) / 10));
    }

    percentageToPosition(percentage) {
        if (percentage <= 0) return 0;
        const minPos = 1984;
        const maxPos = 7232;
        const position = minPos + ((percentage / 100) * (maxPos - minPos));
        return Math.round(Math.max(minPos, Math.min(maxPos, position)));
    }

    updateVisualIndicator(element, percentage, servoId) {
        const style = this.config.visual_display_style || 'bar';
        const gateDim = this.config.gate_dimensions?.[servoId] || {width: 1, height: 5};

        // Clear previous content
        element.innerHTML = '';

        if (style === 'bar' || style === 'all') {
            const bar = document.createElement('div');
            bar.className = 'visual-bar';
            bar.innerHTML = `
                <div class="visual-bar-bg">
                    <div class="visual-bar-fill" style="width: ${percentage}%"></div>
                </div>
            `;
            element.appendChild(bar);
        }

        if (style === 'rectangle' || style === 'all') {
            const rect = document.createElement('div');
            rect.className = 'visual-rectangle';
            const aspectRatio = gateDim.width / gateDim.height;
            const openHeight = percentage;
            rect.innerHTML = `
                <div class="gate-container" style="aspect-ratio: ${aspectRatio}">
                    <div class="gate-closed"></div>
                    <div class="gate-open" style="height: ${openHeight}%"></div>
                    <div class="gate-label">${gateDim.width}"×${gateDim.height}"</div>
                </div>
            `;
            element.appendChild(rect);
        }

        if (style === 'percentage' || style === 'all') {
            const pct = document.createElement('div');
            pct.className = 'visual-percentage';
            pct.innerHTML = `<span class="percentage-large">${percentage}%</span>`;
            element.appendChild(pct);
        }
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

    async setServoPercentage(servoId, percentage) {
        const position = this.percentageToPosition(parseFloat(percentage));
        await this.setServoPosition(servoId, position);
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

    async saveScenePrompt(sceneId) {
        const existingScene = this.scenes[sceneId];

        // Check if scene is locked and not in config mode
        if (existingScene?.locked && !this.configMode) {
            alert('This scene is locked. Enter Config Mode to modify it.');
            return;
        }

        // Confirm overwrite if scene exists
        if (existingScene) {
            const confirmMsg = `Overwrite "${existingScene.name}"?\n\n${existingScene.description || 'No description'}`;
            if (!confirm(confirmMsg)) {
                return;
            }
        }

        await this.saveScene(sceneId);
    }

    async saveScene(sceneId, name = null, description = null, locked = null) {
        try {
            const payload = {};
            if (name) payload.name = name;
            if (description !== null) payload.description = description;
            if (locked !== null) payload.locked = locked;

            const response = await fetch(`/api/scenes/${sceneId}/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (data.success) {
                this.log(`Scene ${sceneId} saved successfully`, 'success');
                // Reload scenes to update UI
                await this.reloadScenes();
            } else {
                this.log(`Failed to save scene ${sceneId}: ${data.error}`, 'error');
            }
        } catch (error) {
            this.log(`Error saving scene ${sceneId}: ${error.message}`, 'error');
        }
    }

    async editSceneMetadata(sceneId) {
        const existingScene = this.scenes[sceneId];
        if (!existingScene) {
            alert('Scene not found. Save it first.');
            return;
        }

        const name = prompt('Scene Name:', existingScene.name || `Scene ${sceneId}`);
        if (name === null) return;

        const description = prompt('Scene Description:', existingScene.description || '');
        if (description === null) return;

        const lockChoice = confirm('Lock this scene to prevent accidental changes?');

        try {
            const response = await fetch(`/api/scenes/${sceneId}/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: name,
                    description: description,
                    locked: lockChoice
                })
            });

            const data = await response.json();
            if (data.success) {
                this.log(`Scene ${sceneId} metadata updated`, 'success');
                await this.reloadScenes();
            } else {
                this.log(`Failed to update scene ${sceneId}: ${data.error}`, 'error');
            }
        } catch (error) {
            this.log(`Error updating scene ${sceneId}: ${error.message}`, 'error');
        }
    }

    async reloadScenes() {
        try {
            const scenesResponse = await fetch('/api/scenes');
            const scenesData = await scenesResponse.json();

            if (scenesData.success) {
                this.scenes = scenesData.scenes;
                this.updateSceneDisplay();
                this.updateSceneButtonsState();
            }
        } catch (error) {
            this.log(`Failed to reload scenes: ${error.message}`, 'error');
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