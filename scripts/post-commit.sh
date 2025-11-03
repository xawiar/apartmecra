#!/bin/bash

# Git Post-Commit Hook
# Commit sonrası otomatik olarak GitHub'a push eder

# Script dizinini bul
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
AUTO_PUSH_SCRIPT="$PROJECT_ROOT/scripts/auto-push.sh"

# Auto-push script'ini çalıştır
if [ -f "$AUTO_PUSH_SCRIPT" ]; then
    bash "$AUTO_PUSH_SCRIPT"
else
    echo "⚠️  Auto-push script bulunamadı: $AUTO_PUSH_SCRIPT"
    exit 0
fi

