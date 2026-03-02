#!/bin/bash

# OMEGA MAC SYSTEM AUDIT
# Run this in Terminal: bash omega_mac_audit.sh
# Copy results back to Claude

echo "========================================"
echo "OMEGA MAC SYSTEM AUDIT"
echo "========================================"
echo ""

# System Info
echo "=== SYSTEM ==="
echo "macOS: $(sw_vers -productVersion)"
echo "Chip: $(sysctl -n machdep.cpu.brand_string 2>/dev/null || echo "Apple Silicon")"
echo "RAM: $(sysctl -n hw.memsize | awk '{print $0/1073741824 " GB"}')"
echo "Architecture: $(uname -m)"
echo ""

# Apple Silicon Check
echo "=== APPLE SILICON ==="
if [[ $(uname -m) == "arm64" ]]; then
    echo "Apple Silicon: Yes ✓"
    echo "Rosetta 2: $(pkgutil --pkg-info com.apple.pkg.RosettaUpdateAuto 2>/dev/null && echo 'Installed' || echo 'Not installed')"
else
    echo "Apple Silicon: No (Intel)"
fi
echo ""

# GPU/Metal
echo "=== GPU/METAL ==="
system_profiler SPDisplaysDataType 2>/dev/null | grep -E "Chipset Model|VRAM|Metal"
echo ""

# Homebrew
echo "=== HOMEBREW ==="
if command -v brew &> /dev/null; then
    echo "Homebrew: $(brew --version | head -1)"
    echo ""
    echo "Installed formulae (relevant):"
    brew list | grep -E "python|node|git|ffmpeg|ollama|docker|cmake|wget|curl" | while read pkg; do
        echo "  ✓ $pkg"
    done
    echo ""
    echo "Installed casks (relevant):"
    brew list --cask 2>/dev/null | grep -E "docker|unity|blender|cursor|visual-studio|obs|discord|slack|zoom" | while read pkg; do
        echo "  ✓ $pkg"
    done
else
    echo "Homebrew: Not installed"
fi
echo ""

# Python
echo "=== PYTHON ==="
if command -v python3 &> /dev/null; then
    echo "Python3: $(python3 --version)"
    echo "Location: $(which python3)"
else
    echo "Python3: Not found"
fi

if command -v conda &> /dev/null; then
    echo "Conda: $(conda --version)"
    echo "Environments:"
    conda env list 2>/dev/null | grep -v "^#" | head -10
else
    echo "Conda: Not installed"
fi

if command -v pip3 &> /dev/null; then
    echo ""
    echo "Key Python Packages:"
    pip3 list 2>/dev/null | grep -iE "^numpy|^scipy|^torch|^tensorflow|^mujoco|^openai|^anthropic|^flask|^fastapi|^streamlit|^whisper|^transformers|^diffusers|^opencv|^pillow|^pandas|^matplotlib|^jupyter|^gradio|^mlx" | while read line; do
        echo "  ✓ $line"
    done
fi
echo ""

# Node.js
echo "=== NODE.JS ==="
if command -v node &> /dev/null; then
    echo "Node: $(node --version)"
    echo "NPM: $(npm --version 2>/dev/null)"
else
    echo "Node: Not installed"
fi
echo ""

# Docker
echo "=== DOCKER ==="
if command -v docker &> /dev/null; then
    echo "Docker: $(docker --version)"
    if docker ps &> /dev/null; then
        echo "Docker Status: Running ✓"
        echo "Containers:"
        docker ps --format "  {{.Names}}: {{.Status}}" 2>/dev/null
    else
        echo "Docker Status: Not running"
    fi
else
    echo "Docker: Not installed"
fi
echo ""

# Git
echo "=== GIT ==="
if command -v git &> /dev/null; then
    echo "Git: $(git --version)"
    if command -v git-lfs &> /dev/null; then
        echo "Git LFS: $(git lfs version 2>/dev/null | head -1)"
    else
        echo "Git LFS: Not installed"
    fi
else
    echo "Git: Not found"
fi
echo ""

# AI/ML Tools
echo "=== AI/ML TOOLS ==="
if command -v ollama &> /dev/null; then
    echo "Ollama: $(ollama --version 2>/dev/null || echo 'Installed')"
    echo "Ollama Models:"
    ollama list 2>/dev/null | head -10
else
    echo "Ollama: Not installed"
fi
echo ""

# MLX (Apple Silicon ML)
echo "=== MLX (Apple Silicon) ==="
python3 -c "import mlx; print('MLX: Installed ✓')" 2>/dev/null || echo "MLX: Not installed"
python3 -c "import mlx_lm; print('MLX-LM: Installed ✓')" 2>/dev/null || echo "MLX-LM: Not installed"
echo ""

# 3D/Simulation
echo "=== 3D/SIMULATION ==="
[ -d "/Applications/Blender.app" ] && echo "Blender: Installed ✓" || echo "Blender: Not found"
[ -d "/Applications/Unity Hub.app" ] && echo "Unity Hub: Installed ✓" || echo "Unity Hub: Not found"
[ -d "/Applications/Unity" ] && echo "Unity: Installed ✓" || echo "Unity: Not found"
[ -d "/Applications/Unreal Engine.app" ] && echo "Unreal Engine: Installed ✓" || echo "Unreal Engine: Not found"
[ -d "/Applications/NVIDIA Omniverse Launcher.app" ] && echo "Omniverse: Installed ✓" || echo "Omniverse: Not found (not available for Mac)"
echo ""

# IDEs
echo "=== IDEs & EDITORS ==="
[ -d "/Applications/Cursor.app" ] && echo "Cursor: Installed ✓" || echo "Cursor: Not found"
[ -d "/Applications/Visual Studio Code.app" ] && echo "VS Code: Installed ✓" || echo "VS Code: Not found"
[ -d "/Applications/Xcode.app" ] && echo "Xcode: Installed ✓" || echo "Xcode: Not found"
if command -v xcode-select &> /dev/null; then
    xcode-select -p &>/dev/null && echo "Xcode CLI Tools: Installed ✓" || echo "Xcode CLI Tools: Not installed"
fi
echo ""

# Communication/Other
echo "=== OTHER APPS ==="
[ -d "/Applications/OBS.app" ] && echo "OBS: Installed ✓" || echo "OBS: Not found"
[ -d "/Applications/Discord.app" ] && echo "Discord: Installed ✓" || echo "Discord: Not found"
[ -d "/Applications/Slack.app" ] && echo "Slack: Installed ✓" || echo "Slack: Not found"
[ -d "/Applications/zoom.us.app" ] && echo "Zoom: Installed ✓" || echo "Zoom: Not found"

if command -v ffmpeg &> /dev/null; then
    echo "FFmpeg: $(ffmpeg -version 2>/dev/null | head -1)"
else
    echo "FFmpeg: Not installed"
fi
echo ""

# Disk Space
echo "=== DISK SPACE ==="
df -h / | tail -1 | awk '{print "Main Drive: " $4 " free / " $2 " total (" $5 " used)"}'
echo ""

# OMEGA on Mac
echo "=== OMEGA ON MAC ==="
omega_paths=("$HOME/OmegaStack" "$HOME/omega" "$HOME/Documents/OmegaStack" "$HOME/Projects/omega")
found_omega=false
for path in "${omega_paths[@]}"; do
    if [ -d "$path" ]; then
        echo "OMEGA folder found: $path"
        echo "Contents:"
        ls -la "$path" | head -20
        found_omega=true
        break
    fi
done
if [ "$found_omega" = false ]; then
    echo "No OMEGA folder found"
    echo "Searched: ${omega_paths[*]}"
fi
echo ""

# Network/Ports
echo "=== ACTIVE SERVICES ==="
echo "Listening ports (relevant):"
lsof -i -P -n | grep LISTEN | grep -E ":5000|:8000|:8080|:3000|:11434" | awk '{print "  " $1 " on " $9}' | head -10
echo ""

# Summary
echo "========================================"
echo "AUDIT COMPLETE"
echo "Copy this output and paste it back to Claude"
echo "========================================"

