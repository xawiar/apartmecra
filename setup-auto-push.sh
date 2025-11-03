#!/bin/bash

# Otomatik GitHub Push Kurulum Scripti
# Bu script git hook'unu kurar ve otomatik push'u aktifleştirir

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🔧 Otomatik GitHub Push kurulumu başlatılıyor...${NC}"

# Git dizinini kontrol et
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Hata: Bu dizin bir git repository değil!${NC}"
    exit 1
fi

# Hooks dizinini oluştur
mkdir -p .git/hooks
echo -e "${GREEN}✅ .git/hooks dizini hazır${NC}"

# Post-commit hook'unu oluştur
HOOK_FILE=".git/hooks/post-commit"
cat > "$HOOK_FILE" << 'EOF'
#!/bin/bash

# Git Post-Commit Hook - Otomatik GitHub Push
# Her commit sonrası otomatik olarak GitHub'a push eder

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Auto-push script'ini bul
AUTO_PUSH_SCRIPT="$PROJECT_ROOT/scripts/auto-push.sh"

# Script varsa çalıştır
if [ -f "$AUTO_PUSH_SCRIPT" ]; then
    # Arka planda çalıştır (commit'i bloklamasın)
    bash "$AUTO_PUSH_SCRIPT" &
else
    echo "⚠️  Auto-push script bulunamadı: $AUTO_PUSH_SCRIPT"
fi

exit 0
EOF

chmod +x "$HOOK_FILE"
echo -e "${GREEN}✅ Post-commit hook kuruldu${NC}"

# Auto-push script'inin çalıştırılabilir olduğundan emin ol
if [ -f "scripts/auto-push.sh" ]; then
    chmod +x scripts/auto-push.sh
    echo -e "${GREEN}✅ Auto-push script hazır${NC}"
else
    echo -e "${RED}❌ Hata: scripts/auto-push.sh bulunamadı!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Kurulum tamamlandı!${NC}"
echo -e "${YELLOW}💡 Artık her commit sonrası otomatik olarak GitHub'a push edilecek.${NC}"
echo -e "${YELLOW}💡 Manuel push için: npm run push${NC}"

