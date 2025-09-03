# Product Requirements Document: House of Automated Leaks (HAL) Control System

## 1. Introduction & Vision
This document outlines the requirements for the HAL Control System, a web-based graphical user interface (GUI) designed for the intuitive control of a Pololu Maestro-powered animatronic display. The system is used for training HVAC professionals. The vision is to create a robust, easy-to-use, and scalable control surface that can be accessed by multiple users simultaneously on a local WiFi network via any modern web browser on a phone, tablet, or computer.

## 2. User Persona & Goal
* **Persona:** HVAC Trainer / Operator
* **Goal:** "To provide an intuitive, easy to learn, robust multi-user interface for recalling and fine-tuning preset servo-controlled automation scenes on a local network."

## 3. Core Features (Version 1.0)

### 3.1. Dynamic Control Surface
The web interface must not be hard-coded. It will read a configuration file (`config.json`) at startup to dynamically generate all necessary controls. This allows the system to easily scale from 1 to 24+ servos without changing the source code.

### 3.2. Live Servo Control & Position Feedback
* For each servo defined in the configuration, the UI must display its name, a slider for control, and a numerical readout of its current position.
* Moving a slider must send a command to the server to move the corresponding physical servo in real-time.
* The numerical readout and slider position in the GUI must update automatically to reflect the actual position of the physical servos. Updates do not need to be instantaneous but should occur every 1-2 seconds to keep the GUI synchronized with the physical state.

### 3.3. Scene Management
* The UI must display a button for each "scene" defined in the configuration file.
* **Recall Scene:** Tapping a scene button will execute a script that moves all servos to their predefined positions for that scene.
* **Save Scene:** A "Save" button next to each scene name will query the Maestro for the current position of all servos and overwrite the corresponding scene file, updating the pose for future recall.

## 4. Key Constraints & Non-Goals (Version 1.0)
* **Local Network Only:** The server will not be exposed to the public internet.
* **No User Authentication:** The system will run on a trusted private network, and no login/password system is required for the first version.
* **No Web-Based Configuration:** All configuration of servos and scenes will be done by manually editing the `config.json` and associated script files on the host PC. A web-based editor is a non-goal for V1.

## 5. Future Expansion Possibilities (Post-V1)
* Web-based editor for the `config.json` file.
* A "Macro Recorder" to save a series of manual slider movements as a new sequence.
* Timed execution of scenes for fully automated presentations.
* Simple password protection.