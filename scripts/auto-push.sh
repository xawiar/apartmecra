#!/bin/bash

# Otomatik GitHub Push Scripti
# Bu script commit sonrası otomatik olarak GitHub'a push eder

# Renk kodları
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔄 Otomatik GitHub push başlatılıyor...${NC}"

# Mevcut branch'i al
BRANCH=$(git branch --show-current)

if [ -z "$BRANCH" ]; then
    echo -e "${RED}❌ Hata: Branch bulunamadı!${NC}"
    exit 1
fi

echo -e "${YELLOW} branch: $BRANCH${NC}"

# Remote'un olup olmadığını kontrol et
if ! git remote | grep -q "origin"; then
    echo -e "${RED}❌ Hata: 'origin' remote bulunamadı!${NC}"
    echo -e "${YELLOW}💡 İpucu: git remote add origin <url> ile remote ekleyebilirsiniz.${NC}"
    exit 1
fi

# Remote URL'i göster
REMOTE_URL=$(git remote get-url origin)
echo -e "${YELLOW}🔗 Remote: $REMOTE_URL${NC}"

# Push yap
echo -e "${YELLOW}⬆️  GitHub'a push ediliyor...${NC}"
if git push origin "$BRANCH"; then
    echo -e "${GREEN}✅ Başarıyla GitHub'a push edildi!${NC}"
    echo -e "${GREEN}🔗 Branch: $BRANCH${NC}"
    exit 0
else
    echo -e "${RED}❌ Push başarısız oldu!${NC}"
    echo -e "${YELLOW}💡 Manuel olarak push yapmayı deneyin: git push origin $BRANCH${NC}"
    exit 1
fi

