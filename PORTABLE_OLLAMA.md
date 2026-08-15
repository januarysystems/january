# Portable Ollama System for JANUARY

## Overview

JANUARY now includes a **Portable Ollama System** that allows the application to run on any system without requiring system-level installation of Ollama. All binaries are downloaded and managed within the JANUARY application directory.

## Features

✅ **No System Installation Required**
- Downloads Ollama binaries automatically for your platform
- Stores everything in JANUARY app directory
- No admin privileges required
- No PATH modifications needed

✅ **Cross-Platform Support**
- macOS (Intel & Apple Silicon/ARM64)
- Linux (AMD64 & ARM64)
- Windows (AMD64 & ARM64)

✅ **Complete Isolation**
- Portable Ollama doesn't interfere with system Ollama installations
- Models stored in app data directory
- Complete data isolation

## Architecture

### New Files Created

1. **[portable-ollama.ts](src/lib/services/portable-ollama.ts)**
   - Core portable Ollama manager
   - Downloads platform-specific binaries
   - Manages Ollama lifecycle (start/stop)
   - Handles model storage

### Modified Files

1. **[install-manager.ts](src/lib/services/install-manager.ts)**
   - Updated to use portable Ollama instead of system installation
   - Removed Homebrew/Linux script dependencies

2. **[ollama-service.ts](src/lib/ai/ollama-service.ts)**
   - Integrated with portable Ollama manager
   - Auto-starts portable Ollama on initialization

3. **[auto-run-service.ts](src/lib/services/auto-run-service.ts)**
   - Uses portable Ollama for service startup

4. **[installation.ts](src/lib/api/installation.ts)**
   - New API endpoints for portable Ollama management
   - Updated help text

5. **[auto-run.ts](src/lib/api/auto-run.ts)**
   - Updated to use portable Ollama

## Storage Locations

Binaries and models are stored in platform-specific locations:

- **macOS**: `~/Library/Application Support/january/january-ollama/`
- **Linux**: `~/.local/share/january/january-ollama/`
- **Windows**: `%LOCALAPPDATA%\january\january-ollama/`

### Directory Structure

```
january-ollama/
├── binaries/          # Platform-specific Ollama binaries
│   ├── ollama         # macOS/Linux executable
│   └── ollama.exe     # Windows executable
└── models/            # Downloaded models stored here
    ├── qwen2.5-coder:32b/
    └── ...
```

## API Endpoints

### New Endpoints

- `getPortableOllamaStatusFn` - Get portable Ollama status
- `startPortableOllamaFn` - Start portable Ollama
- `stopPortableOllamaFn` - Stop portable Ollama

### Updated Endpoints

- `installOllamaFn` - Now installs portable Ollama
- `checkInstallationStatusFn` - Checks portable Ollama status
- `autoInstallFn` - Performs portable installation

## Default Model

Updated from `qwen3-coder:30b` to **`qwen2.5-coder:32b`**

This newer model provides:
- Better coding assistance
- More accurate responses
- Improved performance

## How It Works

### First Run Flow

1. **User starts JANUARY**: `npm run dev`
2. **System checks**: Is portable Ollama installed?
3. **If not installed**: Downloads Ollama binary for current platform
4. **Binary setup**: Makes executable (Unix) or ready to run (Windows)
5. **Model check**: Is `qwen2.5-coder:32b` available?
6. **If not**: Pulls model automatically (~19GB download)
7. **Service start**: Starts portable Ollama from app directory
8. **Ready to chat**: JANUARY is now fully functional

### Subsequent Runs

1. **User starts JANUARY**
2. **System checks**: Portable Ollama already installed ✓
3. **Service start**: Starts portable Ollama immediately
4. **Ready to chat**: JANUARY is ready in seconds

## Environment Variables

The following environment variables control the portable system:

```bash
# Auto-Installation (Automatic Setup)
AUTO_INSTALL_ENABLED=true
AUTO_INSTALL_OLLAMA=true
AUTO_PULL_MODEL=true

# Auto-Run (Automatic Service Startup)
AUTO_RUN_ENABLED=true
AUTO_START_SERVICES=true
AUTO_RUN_OLLAMA=true

# Ollama (Local AI - Portable)
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5-coder:32b
```

## Troubleshooting

### "Portable Ollama not installed"

**Solution**: JANUARY will download it automatically. Ensure:
- Internet connection is active
- Download URLs are accessible
- Sufficient disk space (~500MB for binary + ~19GB for model)

### "Port 11434 in use"

**Solution**: Stop any existing Ollama instances:
```bash
# macOS/Linux
pkill ollama

# Windows
taskkill /IM ollama.exe /F
```

### "Model not installed"

**Solution**: Use JANUARY's model download interface or wait for automatic pull on first chat.

### "Permission denied"

**Solution**: Ensure the JANUARY app data directory is writable:
```bash
# macOS/Linux
chmod -R 755 ~/Library/Application\ Support/january/  # macOS
chmod -R 755 ~/.local/share/january/                    # Linux
```

## Technical Details

### Binary Download URLs

The system downloads official Ollama releases from GitHub:

- **macOS**: `https://github.com/ollama/ollama/releases/download/v{version}/ollama-darwin-{arch}`
- **Linux**: `https://github.com/ollama/ollama/releases/download/v{version}/ollama-linux-{arch}`
- **Windows**: `https://github.com/ollama/ollama/releases/download/v{version}/ollama-windows-{arch}.zip`

### Process Management

Portable Ollama is spawned as a child process with:
- Custom environment variables (OLLAMA_MODELS points to app directory)
- Isolated from system PATH
- Managed lifecycle (start/stop/restart)

### Model Storage

Models are stored in the portable directory, not system-wide:
- Environment variable `OLLAMA_MODELS` points to portable models directory
- Complete isolation from system Ollama models
- No interference with other Ollama installations

## Benefits

### For Users

- **Zero setup**: Just `npm install && npm run dev`
- **No admin rights**: Works in user directory
- **Portable**: Can be moved between systems
- **Isolated**: Doesn't affect system Ollama

### For Developers

- **Consistent environments**: Same setup across all platforms
- **Easy testing**: Isolated test environments
- **Simple deployment**: No system dependencies
- **Clean uninstall**: Just delete app directory

## Migration from System Ollama

If you were previously using system Ollama:

1. **Stop system Ollama**: `pkill ollama` or `taskkill ollama`
2. **Start JANUARY**: It will use portable version
3. **Download models**: JANUARY will pull models to portable directory
4. **Optional**: Uninstall system Ollama if desired

## Future Enhancements

Potential improvements for the portable system:

- [ ] Model management UI (list, delete, download models)
- [ ] Automatic updates for Ollama binaries
- [ ] Multiple model support per session
- [ ] Model caching and cleanup
- [ ] Portable Whisper and Piper integration

## Credits

This portable system makes JANUARY truly "just works" on any system without requiring users to manually install dependencies or configure system-level services.
