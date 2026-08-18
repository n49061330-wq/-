# 🚀 البدء السريع - منصة جذب العملاء

## ⏱️ المدة المتوقعة: 15 دقيقة

---

## الخطوة 1: تحضير مفاتيح API (5 دقائق)

### Google Search API
1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com/welcome)
2. اضغط على "Create Project"
3. أكمل البيانات المطلوبة
4. اذهب إلى "APIs & Services" → "Library"
5. ابحث عن "Custom Search API"
6. اضغط "Enable"
7. اذهب إلى "Credentials"
8. اضغط "Create Credentials" → "API Key"
9. **انسخ API Key** (ستحتاجها لاحقاً)

### Google Custom Search Engine
1. اذهب إلى [Google Custom Search](https://cse.google.com/cse/)
2. اضغط على "Create"
3. اختر "Search the entire web"
4. أكمل الإنشاء
5. **انسخ CX ID** من الإعدادات

### Gemini API
1. اذهب إلى [Google AI Studio](https://aistudio.google.com/apikey)
2. اضغط على "Get API Key"
3. اختر مشروع Google Cloud الذي أنشأته
4. **انسخ Gemini API Key**

---

## الخطوة 2: إعداد N8N (5 دقائق)

### استيراد الـ Workflow
1. اذهب إلى [N8N Cloud](https://nada07.app.n8n.cloud/) (أو instance الخاص بك)
2. اضغط على "+" لـ Workflow جديد
3. اضغط على "Import from URL" أو "Import from File"
4. اختر ملف `n8n_workflow.json`
5. **انسخ رابط Webhook** (ستجده في الـ node الأول)
   - يبدو مثل: `https://your-instance.n8n.cloud/webhook/lead-generation`

### تفعيل الـ Workflow
- اضغط على المفتاح الأخضر في الأعلى (Active/Inactive)
- يجب أن يتحول الـ indicator إلى أخضر

---

## الخطوة 3: إدخال البيانات في التطبيق (5 دقائق)

1. **افتح التطبيق** في متصفحك (`index.html`)
2. **اضغط على ⚙️ الإعدادات** (أعلى اليمين)
3. **أدخل البيانات:**

```
🔗 رابط Webhook N8N:
[الرابط الذي نسخته من N8N]

🔑 مفتاح Google API:
[API Key من Google Cloud]

🔎 معرف محرك البحث (CX):
[CX من Google Custom Search]

🤖 مفتاح Gemini:
[API Key من Google AI Studio]
```

4. **اضغط "حفظ الإعدادات"**

---

## الخطوة 4: اختبار النظام (لا يتطلب إدخال بيانات)

### اختبار 1: وضع التجريب (لا يحتاج API keys)
1. **فعّل "وضع التجريب"** ✓
2. اختر نشاط: "مطاعم"
3. اختر مدينة: "الرياض"
4. اضغط "🔍 بدء البحث"
5. **يجب أن تظهر بيانات تجريبية بعد ثانيتين**

### اختبار 2: البحث الحقيقي
1. **أغلق "وضع التجريب"** ☐
2. اختر نشاط ومدينة
3. اضغط "🔍 بدء البحث"
4. **يجب أن تظهر نتائج حقيقية من Google و Gemini (10-30 ثانية)**

---

## ✅ قائمة التحقق

- [ ] تم إنشاء Google Cloud Project
- [ ] تم تفعيل Custom Search API
- [ ] تم إنشاء Custom Search Engine
- [ ] تم الحصول على Google API Key
- [ ] تم الحصول على Google CX ID
- [ ] تم الحصول على Gemini API Key
- [ ] تم استيراد N8N Workflow
- [ ] تم تفعيل N8N Workflow
- [ ] تم نسخ رابط Webhook
- [ ] تم إدخال جميع البيانات في التطبيق
- [ ] اختبار وضع التجريب نجح
- [ ] اختبار البحث الحقيقي نجح ✨

---

## 🎉 تم!

الآن يمكنك:
- ✅ البحث عن عملاء محتملين
- ✅ توليد رسائل تسويقية بـ AI
- ✅ إرسال رسائل واتساب
- ✅ تتبع حالة العملاء
- ✅ تصدير البيانات إلى CSV

---

## ⚠️ في حالة المشاكل

### المشكلة: "Cannot connect to webhook"
- ✓ تحقق من صحة الرابط (بدون مسافات)
- ✓ تأكد من تفعيل N8N Workflow
- ✓ افتح F12 واطلع على رسالة الخطأ الدقيقة

### المشكلة: "No results found"
- ✓ تحقق من API keys في الإعدادات
- ✓ جرب كلمة بحثية أخرى
- ✓ تأكد من أن Google quota لم تنفد

### المشكلة: "Invalid API Key"
- ✓ تحقق من نسخ المفتاح بالكامل (بدون مسافات)
- ✓ تأكد من تفعيل الـ API في Google Cloud Console

---

## 📞 للمساعدة

1. افتح **Developer Console** (F12)
2. انسخ رسالة الخطأ
3. اطلع على **SETUP_GUIDE.md** لمزيد من التفاصيل
4. راجع N8N logs في [N8N Dashboard](https://nada07.app.n8n.cloud/)

---

**ملاحظة:** الـ API المجانية لـ Google محدودة بـ 300 طلب/يوم. إذا تجاوزت الحد، انتظر حتى اليوم التالي أو ارفع خطتك.
