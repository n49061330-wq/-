#!/usr/bin/env node

/**
 * أداة اختبار ربط N8N Webhook
 * هذا الملف يساعد في اختبار الاتصال بـ N8N webhook
 * 
 * الاستخدام:
 * node test-webhook.js
 * أو عبر الكود في المتصفح (انسخ الكود وألصقه في Console)
 */

// بيانات الاختبار
const TEST_CONFIG = {
    webhookUrl: 'https://nada07.app.n8n.cloud/webhook/lead-generation',
    googleKey: 'YOUR_GOOGLE_API_KEY',
    googleCx: 'YOUR_CX_ID',
    geminiKey: 'YOUR_GEMINI_API_KEY',
    city: 'الرياض',
    keyword: 'مطاعم',
    lead_limit: 3,
    prompt_template: `اكتب رسالة تسويقية مخصصة باللغة العربية وموجهة للشركة المذكورة أعلاه.
يجب أن تركز الرسالة على تقديم خدماتنا لحلول تطوير الأعمال والتحول الرقمي والأتمتة الذكية لعملياتهم لزيادة مبيعاتهم وتوفير نفقاتهم.
الأسلوب: حماسي، مهني، ومقنع جداً.
الطول: لا تتجاوز 4 أسطر، واقترح موعداً للاجتماع الهاتفي.
ابدأ بالتحية باسم الشركة مباشرة.`
};

/**
 * اختبار 1: التحقق من البيانات الأساسية
 */
function testBasicConfig() {
    console.log('🧪 اختبار 1: التحقق من البيانات الأساسية...\n');
    
    const missing = [];
    
    if (!TEST_CONFIG.webhookUrl || TEST_CONFIG.webhookUrl.includes('YOUR_')) {
        missing.push('✗ Webhook URL مفقود أو لم يتم تعديله');
    }
    if (!TEST_CONFIG.googleKey || TEST_CONFIG.googleKey.includes('YOUR_')) {
        missing.push('✗ Google API Key مفقود أو لم يتم تعديله');
    }
    if (!TEST_CONFIG.googleCx || TEST_CONFIG.googleCx.includes('YOUR_')) {
        missing.push('✗ Google CX ID مفقود أو لم يتم تعديله');
    }
    if (!TEST_CONFIG.geminiKey || TEST_CONFIG.geminiKey.includes('YOUR_')) {
        missing.push('✗ Gemini API Key مفقود أو لم يتم تعديله');
    }
    
    if (missing.length > 0) {
        console.log('❌ المشكلة: بيانات ناقصة\n');
        missing.forEach(m => console.log(m));
        console.log('\n⚠️  يجب إدخال جميع مفاتيح API قبل الاختبار!\n');
        return false;
    }
    
    console.log('✅ جميع البيانات الأساسية موجودة\n');
    return true;
}

/**
 * اختبار 2: اختبار الاتصال بـ Webhook
 */
async function testWebhookConnection() {
    console.log('🧪 اختبار 2: اختبار الاتصال بـ N8N Webhook...\n');
    
    const payload = {
        google_search_api_key: TEST_CONFIG.googleKey,
        google_search_cx: TEST_CONFIG.googleCx,
        gemini_api_key: TEST_CONFIG.geminiKey,
        prompt_template: TEST_CONFIG.prompt_template,
        city: TEST_CONFIG.city,
        keyword: TEST_CONFIG.keyword,
        lead_limit: TEST_CONFIG.lead_limit
    };
    
    try {
        console.log('📤 جاري الإرسال...\n');
        console.log('البيانات المرسلة:');
        console.log(JSON.stringify({
            ...payload,
            google_search_api_key: '[مخفي]',
            gemini_api_key: '[مخفي]'
        }, null, 2));
        console.log('\n');
        
        const response = await fetch(TEST_CONFIG.webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        console.log(`📊 الحالة: ${response.status} ${response.statusText}\n`);
        
        if (!response.ok) {
            console.log('❌ خطأ في الاتصال!');
            console.log(`الخطأ: ${response.status} - ${response.statusText}\n`);
            return false;
        }
        
        const data = await response.json();
        
        if (!data.leads || !Array.isArray(data.leads)) {
            console.log('❌ استجابة غير صحيحة!');
            console.log('الاستجابة يجب أن تحتوي على: { "leads": [...] }\n');
            console.log('الاستجابة الفعلية:');
            console.log(JSON.stringify(data, null, 2));
            return false;
        }
        
        console.log(`✅ تم استقبال ${data.leads.length} عميل\n`);
        
        if (data.leads.length > 0) {
            console.log('مثال على أول عميل:');
            console.log(JSON.stringify(data.leads[0], null, 2));
        }
        
        return true;
        
    } catch (error) {
        console.log('❌ خطأ في الاتصال:\n');
        console.log(`${error.message}\n`);
        console.log('الأسباب المحتملة:');
        console.log('- Webhook URL غير صحيح');
        console.log('- الـ N8N workflow غير مفعل (Active)');
        console.log('- مشكلة في الاتصال بالإنترنت');
        console.log('- N8N server معطل\n');
        return false;
    }
}

/**
 * اختبار 3: التحقق من استجابة Gemini
 */
async function testGeminiIntegration() {
    console.log('🧪 اختبار 3: التحقق من توليد الرسائل بـ Gemini...\n');
    
    try {
        console.log('📤 اختبار اتصال Gemini API مباشرة...\n');
        
        const testPrompt = 'اكتب رسالة تسويقية بسيطة بالعربية للشركة "مطعم شواية الخليج"';
        
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${TEST_CONFIG.geminiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: testPrompt
                        }]
                    }]
                })
            }
        );
        
        console.log(`📊 الحالة: ${response.status} ${response.statusText}\n`);
        
        if (!response.ok) {
            const error = await response.json();
            console.log('❌ خطأ في Gemini API!\n');
            console.log('رسالة الخطأ:');
            console.log(JSON.stringify(error, null, 2));
            return false;
        }
        
        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            console.log('❌ استجابة Gemini غير صحيحة!\n');
            console.log(JSON.stringify(data, null, 2));
            return false;
        }
        
        const message = data.candidates[0].content.parts[0].text;
        console.log('✅ Gemini يعمل بشكل صحيح!\n');
        console.log('الرسالة المولدة:');
        console.log(`"${message}"\n`);
        
        return true;
        
    } catch (error) {
        console.log('❌ خطأ في اتصال Gemini:\n');
        console.log(`${error.message}\n`);
        return false;
    }
}

/**
 * عرض النتائج النهائية
 */
async function runAllTests() {
    console.clear();
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔧 أداة اختبار ربط N8N Webhook - منصة جذب العملاء الذكية');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // قراءة البيانات من المستخدم إذا كان في Node.js
    if (typeof require !== 'undefined') {
        console.log('⚠️  لاختبار الـ Webhook، يرجى:\n');
        console.log('1. فتح التطبيق في المتصفح');
        console.log('2. فتح Developer Tools (F12)');
        console.log('3. الذهاب إلى Console');
        console.log('4. نسخ والصق الكود من test-webhook.js\n');
        process.exit(0);
    }
    
    const results = [];
    
    // الاختبار 1
    results.push({
        name: 'التحقق من البيانات الأساسية',
        passed: testBasicConfig()
    });
    
    if (!results[0].passed) {
        console.log('\n⛔ توقف الاختبار لأن البيانات الأساسية ناقصة\n');
        return;
    }
    
    // الاختبار 2
    const test2 = await testWebhookConnection();
    results.push({
        name: 'الاتصال بـ N8N Webhook',
        passed: test2
    });
    
    // الاختبار 3
    const test3 = await testGeminiIntegration();
    results.push({
        name: 'توليد الرسائل بـ Gemini',
        passed: test3
    });
    
    // عرض النتائج النهائية
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 ملخص النتائج:\n');
    
    results.forEach((result, index) => {
        const icon = result.passed ? '✅' : '❌';
        console.log(`${index + 1}. ${icon} ${result.name}`);
    });
    
    const passedCount = results.filter(r => r.passed).length;
    const totalCount = results.length;
    
    console.log(`\n النتيجة: ${passedCount}/${totalCount}\n`);
    
    if (passedCount === totalCount) {
        console.log('🎉 ممتاز! جميع الاختبارات نجحت!');
        console.log('الآن يمكنك استخدام التطبيق بشكل طبيعي.\n');
    } else {
        console.log('⚠️  هناك بعض المشاكل، يرجى مراجعة الأخطاء أعلاه.\n');
    }
}

// تشغيل الاختبارات
if (typeof window !== 'undefined') {
    // في المتصفح
    runAllTests();
} else {
    // في Node.js
    console.log('⚠️  هذا الملف يعمل فقط في متصفح الويب أثناء استخدام التطبيق.\n');
    console.log('لاختبار الـ Webhook:\n');
    console.log('1. افتح التطبيق في المتصفح');
    console.log('2. اضغط F12 لفتح Developer Tools');
    console.log('3. انسخ والصق كود الاختبار في Console');
    console.log('4. اضغط Enter\n');
}
