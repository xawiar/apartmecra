#!/bin/bash

# Git Remote URL Düzeltme Scripti

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🔧 Git remote URL düzeltiliyor...${NC}"

# Proje dizinine git
cd "$(dirname "$0")/.." || exit 1

# Mevcut remote URL'i göster
echo -e "${YELLOW}📋 Mevcut remote URL:${NC}"
git remote -v

# Remote URL'i SSH'a çevir
echo -e "${YELLOW}🔄 Remote URL SSH'a çevriliyor...${NC}"
git remote set-url origin git@github.com-xawiar:xawiar/ilce-sekreterlik.git

# SSH key'i ekle
echo -e "${YELLOW}🔑 SSH key ekleniyor...${NC}"
ssh-add ~/.ssh/id_ed25519_xawiar 2>/dev/null

# Doğrula
echo -e "${GREEN}✅ Yeni remote URL:${NC}"
git remote -v

# Test
echo -e "${YELLOW}🧪 SSH bağlantısı test ediliyor...${NC}"
if ssh -T git@github.com-xawiar 2>&1 | grep -q "successfully authenticated"; then
    echo -e "${GREEN}✅ SSH bağlantısı başarılı!${NC}"
else
    echo -e "${RED}❌ SSH bağlantısı başarısız!${NC}"
fi

echo -e "${GREEN}✅ Tamamlandı! Şimdi 'git push origin version1' komutunu çalıştırabilirsiniz.${NC}"
