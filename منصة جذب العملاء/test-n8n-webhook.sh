#!/bin/bash

# أداة اختبار N8N Webhook
# استخدام: bash test-n8n-webhook.sh

# ألوان للطباعة
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🧪 أداة اختبار N8N Webhook - منصة جذب العملاء${NC}"
echo -e "${BLUE}═════════════════════════════════════════════════════════════${NC}\n"

# البيانات المطلوبة
WEBHOOK_URL="${1:-https://nada07.app.n8n.cloud/webhook/lead-generation}"
GOOGLE_API_KEY="${2:-YOUR_GOOGLE_API_KEY}"
GOOGLE_CX="${3:-YOUR_CX_ID}"
GEMINI_API_KEY="${4:-YOUR_GEMINI_API_KEY}"

echo -e "${YELLOW}📋 البيانات المستخدمة:${NC}"
echo "Webhook URL: $WEBHOOK_URL"
echo "Google API Key: ${GOOGLE_API_KEY:0:10}..."
echo "Google CX: ${GOOGLE_CX:0:10}..."
echo "Gemini API Key: ${GEMINI_API_KEY:0:10}..."
echo ""

# التحقق من البيانات
if [[ "$GOOGLE_API_KEY" == "YOUR_GOOGLE_API_KEY" ]]; then
    echo -e "${RED}❌ خطأ: يجب إدخال مفاتيح API الحقيقية${NC}"
    echo -e "${YELLOW}الاستخدام:${NC}"
    echo "bash test-n8n-webhook.sh <webhook_url> <google_key> <cx_id> <gemini_key>"
    echo ""
    echo -e "${YELLOW}مثال:${NC}"
    echo "bash test-n8n-webhook.sh https://your-n8n.cloud/webhook/lead-generation AIzaSy... abc123... AIzaSy..."
    exit 1
fi

# الحمولة (Payload)
PAYLOAD=$(cat <<EOF
{
  "google_search_api_key": "$GOOGLE_API_KEY",
  "google_search_cx": "$GOOGLE_CX",
  "gemini_api_key": "$GEMINI_API_KEY",
  "keyword": "مطاعم",
  "city": "الرياض",
  "lead_limit": 3,
  "prompt_template": "اكتب رسالة تسويقية مخصصة باللغة العربية وموجهة للشركة المذكورة أعلاه."
}
EOF
)

echo -e "${YELLOW}📤 جاري الإرسال...${NC}\n"

# إرسال الطلب
RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" \
    "$WEBHOOK_URL" \
    -w "\n%{http_code}")

# فصل الاستجابة عن رمز الحالة
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo -e "${BLUE}═════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}📊 النتيجة:${NC}"
echo -e "${BLUE}═════════════════════════════════════════════════════════════${NC}\n"

# عرض رمز الحالة
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ حالة الاتصال: $HTTP_CODE OK${NC}\n"
else
    echo -e "${RED}❌ حالة الاتصال: $HTTP_CODE${NC}\n"
    echo -e "${YELLOW}ملاحظة:${NC} قد يكون الـ Webhook في حالة انتظار أو معطل"
fi

# محاولة تحليل الاستجابة
echo -e "${YELLOW}📋 الاستجابة:${NC}"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"

echo ""
echo -e "${BLUE}═════════════════════════════════════════════════════════════${NC}"

# التحليل
if echo "$BODY" | grep -q '"leads"'; then
    LEADS_COUNT=$(echo "$BODY" | jq '.leads | length' 2>/dev/null || echo "?")
    echo -e "${GREEN}✅ النجاح! تم استقبال $LEADS_COUNT عملاء${NC}"
    
    # عرض أول عميل
    echo -e "\n${YELLOW}مثال على أول عميل:${NC}"
    echo "$BODY" | jq '.leads[0]' 2>/dev/null || echo "(لا يمكن عرض التفاصيل)"
else
    echo -e "${RED}❌ فشل الاتصال أو استجابة غير متوقعة${NC}"
    echo -e "\n${YELLOW}الأسباب المحتملة:${NC}"
    echo "1. Webhook URL غير صحيح"
    echo "2. N8N Workflow غير مفعل"
    echo "3. مفاتيح API غير صحيحة"
    echo "4. مشكلة في الاتصال بـ Google API أو Gemini"
fi

echo ""
echo -e "${BLUE}═════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}💡 نصائح:${NC}"
echo "1. تحقق من الـ N8N logs في Dashboard"
echo "2. اختبر كل مفتاح API بشكل منفصل"
echo "3. تأكد من أن الـ Workflow في حالة Active"
echo ""
