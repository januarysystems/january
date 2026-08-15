# JANUARY

PROJECT NAME:

JANUARY

PROJECT DESCRIPTION:

Build a premium futuristic AI web application called "JANUARY".

IMPORTANT:

I am uploading a ZIP containing all UI reference images.

Your job is NOT to redesign anything.

Use those uploaded images as the PRIMARY DESIGN REFERENCE.

The final UI should match the uploaded design as closely as possible.

==========================================================

DESIGN REQUIREMENTS

==========================================================

The application should look like a premium futuristic operating system.

Theme:

• Dark Theme

• Premium Liquid Glass Interface

• Black / Charcoal Background

• Amber / Golden Accent Color

• Glassmorphism Cards

• Frosted Blur

• Soft Glow

• Rounded Corners

• Modern Minimal UI

• Smooth Animations

• High-End Premium Look

DO NOT redesign the interface.

Replicate the uploaded UI with responsive behavior.

==========================================================

TECH STACK

==========================================================

Frontend:

Next.js

React

TypeScript

Tailwind CSS

Framer Motion

React Three Fiber

Three.js

Lucide Icons

ShadCN UI

PWA Support

==========================================================

RESPONSIVE

==========================================================

Desktop

Laptop

Tablet

Mobile

The UI should adapt without changing the design language.

==========================================================

LOGIN

==========================================================

Create a very simple authentication system.

NO Google Login.

NO OAuth.

NO Two Factor Authentication.

Only:

• Login

• Sign Up

• Forgot Password

Login Fields

Email

Password

Remember Me

Login Button

Forgot Password

Sign Up

Signup Fields

Full Name

Email

Password

Confirm Password

Create Account

Forgot Password Page

Email Input

Reset Password Button

The login page should exactly match the uploaded design.

==========================================================

AFTER LOGIN

==========================================================

The user lands on the Dashboard.

==========================================================

LEFT SIDEBAR

==========================================================

Create the following navigation items exactly.

Home

Chat

Projects

Memory

AI Models

Automations

Simulations

3D Lab

IoT & Robotics

Vision & Camera

Documents

Settings

Use icons similar to the uploaded UI.

Sidebar should collapse on smaller screens.

==========================================================

TOP NAVIGATION

==========================================================

Contains

JANUARY Logo

Search Bar

Notification Icon

Settings Shortcut

Profile Dropdown

==========================================================

HOME DASHBOARD

==========================================================

Exactly like the uploaded design.

Center:

Reserve a large space for the AI Core.

IMPORTANT:

For now,

I will provide a 4K 60 FPS MP4 animation.

Embed that video inside the center AI Core container.

The video should:

Loop

Autoplay

Mute

Play smoothly

Fit perfectly

Rounded corners

Later this will be replaced by a real Three.js 3D Model.

Design the layout so replacing the video requires minimal changes.

==========================================================

RIGHT PANEL

==========================================================

Exactly as reference.

Contains

Voice Status Card

System Status

Quick Actions

Recent Projects

Everything should currently be UI only.

No backend logic.

==========================================================

CHAT PAGE

==========================================================

Create the chat interface exactly matching the uploaded design.

Include

Conversation Area

Input Box

Voice Button

Attachment Button

Send Button

Markdown Ready

Code Block Ready

Thinking Placeholder

Typing Placeholder

No AI implementation yet.

==========================================================

PROJECTS PAGE

==========================================================

Create

Project Cards

Grid View

List View

Project Status

Project Categories

Search

Filters

Sorting

Project Preview Cards

No backend.

==========================================================

MEMORY PAGE

==========================================================

Create UI for

Conversation Memory

Saved Knowledge

Saved Projects

Saved Preferences

Pinned Memory

Search Memory

Memory Categories

==========================================================

AI MODELS PAGE

==========================================================

Create

Installed Models

Available Models

Download Button

Activate Button

Model Cards

GPU Usage Placeholder

RAM Usage Placeholder

Performance Cards

UI only.

==========================================================

AUTOMATIONS PAGE

==========================================================

Create

Automation Cards

Triggers

Schedules

Active

Disabled

Automation History

Create Automation Button

Everything UI only.

==========================================================

SIMULATIONS PAGE

==========================================================

Simulation Cards

Categories

Physics

Electronics

IoT

Mechanical

Robotics

Chemical

AI

Status

Progress

Analytics

UI only.

==========================================================

3D LAB

==========================================================

Model Cards

Preview Cards

Render Queue

Animation Queue

Import Button

Export Button

STL Placeholder

GLB Placeholder

Viewer Placeholder

==========================================================

IOT & ROBOTICS

==========================================================

ESP32 Cards

Arduino Cards

STM32 Cards

MQTT Placeholder

Robotics Dashboard

Sensor Cards

Analytics

Graphs

Live Monitoring Placeholder

==========================================================

VISION & CAMERA

==========================================================

Camera Grid

Detection Cards

Recognition Cards

OCR Placeholder

PCB Detection Placeholder

Object Detection Placeholder

Face Recognition Placeholder

Everything UI only.

==========================================================

DOCUMENTS

==========================================================

Document Library

Recent Files

PDF Cards

Research Papers

Search

Filters

Categories

Bookmarks

==========================================================

SETTINGS

==========================================================

General

Appearance

Voice

Performance

Privacy

Security

Developer

About

==========================================================

PROFILE

==========================================================

Profile Picture

Name

Email

Edit Profile

Manage Account

Logout

==========================================================

ANIMATIONS

==========================================================

Use Framer Motion.

Page Transitions

Sidebar Hover

Card Hover

Button Ripple

Smooth Fade

Scale

Blur

Glow

Everything should feel premium.

==========================================================

COLORS

==========================================================

Background

#090909

Cards

Glass Black

Accent

Amber / Gold

Soft White Text

==========================================================

COMPONENTS

==========================================================

Everything must be reusable.

Buttons

Cards

Dialogs

Inputs

Dropdowns

Sidebar

Topbar

Status Cards

==========================================================

IMPORTANT

==========================================================

Do NOT implement backend functionality.

Do NOT create dummy APIs.

Do NOT connect databases.

Do NOT connect authentication.

Do NOT implement AI.

Do NOT implement simulations.

Do NOT implement camera.

Do NOT implement robotics.

Do NOT implement IoT.

Build ONLY the frontend architecture.

Every page should be fully navigable.

Use clean reusable React components.

Organize code professionally.

Leave placeholders where backend integration will later happen.

==========================================================

FINAL GOAL

==========================================================

When Phase 1 is complete,

JANUARY should look exactly like the uploaded UI and behave like a polished premium desktop application.

Every page should be production-quality from a UI perspective, ready for backend integration in the next phase.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b1224d15-6fd7-46b5-a4d0-b5b888bd13cc).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

==========================================================
LOCAL AI SETUP (PHASE 2)
==========================================================

JANUARY now runs with a completely local AI stack.

COMPONENTS:
• Local LLM: PORTABLE Ollama + Qwen2.5-Coder 32B
• Local Speech-to-Text: Whisper (faster-whisper)
• Local Text-to-Speech: Piper (Female Voice)

🚀 SUPER SIMPLE SETUP:

Just run these two commands:

npm install
npm run dev

That's it! JANUARY will:
✅ Automatically download PORTABLE Ollama for your platform
✅ Install Ollama WITHIN the app (no system installation needed!)
✅ Pull the Qwen2.5-Coder 32B model automatically
✅ Start all services automatically
✅ Be ready to chat in minutes

NO MORE MANUAL STEPS!
NO SYSTEM INSTALLATION REQUIRED!

FIRST RUN DETAILS:

On first launch, JANUARY will:
1. Check if portable Ollama is downloaded
2. Download Ollama binary for your platform automatically
3. Pull the qwen2.5-coder:32b model (~19GB download)
4. Start portable Ollama from the app directory
5. Display installation progress in the UI
6. Be ready for chat!

The model download takes a few minutes, but then JANUARY works completely offline.

PORTABLE OLLAMA SYSTEM:

✅ NO SYSTEM INSTALLATION REQUIRED
✅ Works on macOS (Intel & Apple Silicon)
✅ Works on Linux (AMD64 & ARM64)
✅ Works on Windows (AMD64 & ARM64)
✅ All binaries stored in JANUARY app directory
✅ No admin privileges required
✅ Completely isolated from system

STORAGE LOCATIONS:
• macOS: ~/Library/Application Support/january/january-ollama
• Linux: ~/.local/share/january/january-ollama
• Windows: %LOCALAPPDATA%\january\january-ollama

ENVIRONMENT VARIABLES (Optional):

# Auto-Installation (Automatic Setup)
AUTO_INSTALL_ENABLED=true
AUTO_INSTALL_OLLAMA=true
AUTO_PULL_MODEL=true
AUTO_INSTALL_WHISPER=false
AUTO_INSTALL_PIPER=false

# Auto-Run (Automatic Service Startup)
AUTO_RUN_ENABLED=true
AUTO_START_SERVICES=true
AUTO_RUN_OLLAMA=true

# Ollama (Local AI - Portable)
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5-coder:32b

# Whisper (Speech-to-Text)
WHISPER_HOST=127.0.0.1
WHISPER_PORT=8080
WHISPER_MODEL=base
WHISPER_LANGUAGE=en

# Piper (Text-to-Speech - Female Voice)
TTS_ENGINE=piper
TTS_HOST=127.0.0.1
TTS_PORT=8081
TTS_VOICE=en_US-amy-medium

TESTING:

TEXT CHAT:
1. Open Chat page
2. Type "Hello JANUARY"
3. Expected: Real AI response from portable Ollama
4. Test conversation context:
   - "My name is Ashwin."
   - "What is my name?"
   - Expected: "Ashwin"

VOICE INPUT:
1. Press microphone button
2. Speak: "Hello JANUARY"
3. Expected: Transcript appears, AI responds

VOICE OUTPUT:
1. Enable TTS in Settings
2. Send any message
3. Expected: JANUARY speaks with female voice

3D CORE STATES:
The 3D Core should transition:
• IDLE → LISTENING → THINKING → SPEAKING → IDLE

TROUBLESHOOTING:

"Portable Ollama not installed":
→ JANUARY will download it automatically on first run
→ Check your internet connection
→ Available on macOS, Linux, and Windows

"Model not installed":
→ Use JANUARY's model download interface
→ Or it will be pulled automatically on first chat
→ Model: qwen2.5-coder:32b (~19GB)

"Whisper unavailable":
→ Install faster-whisper: pip install faster-whisper
→ Check service is running on port 8080

"TTS unavailable":
→ Install Piper: pip install piper-tts
→ Check service is running on port 8081
→ Verify female voice is installed

"Port 11434 in use":
→ Stop any existing Ollama instances
→ JANUARY uses portable Ollama on port 11434

PRIVACY & SECURITY:

• All AI processing happens locally
• No data sent to cloud AI services
• No API keys required
• Portable Ollama runs from JANUARY app directory
• Whisper and Piper run locally
• Complete data isolation

ARCHITECTURE:

Frontend → JANUARY AI Service → Portable Ollama → Qwen2.5-Coder 32B
         ↓
         Supabase (Chat persistence)
         ↓
         Local TTS (Piper - Female Voice)
         ↓
         Browser Audio Output

Voice Input → Local Whisper → Transcript → AI → Response

PORTABLE ARCHITECTURE:

• Ollama Binary: Downloaded per-platform, stored in app directory
• Models: Stored in app data directory (not system-wide)
• No system PATH modifications
• No admin privileges required
• Complete isolation from system Ollama installations

==========================================================
