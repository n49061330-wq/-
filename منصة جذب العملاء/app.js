// متحكمات تطبيق مستكشف العملاء الذكي

// الإعدادات الافتراضية لقالب Gemini
const DEFAULT_PROMPT_TEMPLATE = `اكتب رسالة تسويقية مخصصة باللغة العربية وموجهة للشركة المذكورة أعلاه.
يجب أن تركز الرسالة على تقديم خدماتنا لحلول تطوير الأعمال والتحول الرقمي والأتمتة الذكية لعملياتهم لزيادة مبيعاتهم وتوفير نفقاتهم.
الأسلوب: حماسي، مهني، ومقنع جداً.
الطول: لا تتجاوز 4 أسطر، واقترح موعداً للاجتماع الهاتفي.
ابدأ بالتحية باسم الشركة مباشرة.`;

// المتغيرات العامة لحالة التطبيق
let appState = {
    leads: [],
    settings: {
        webhookUrl: 'https://nada07.app.n8n.cloud/webhook/lead-generation',
        googleKey: '',
        googleCx: '',
        geminiKey: '',
        promptTemplate: DEFAULT_PROMPT_TEMPLATE
    },
    currentEditingLeadId: null,
    currentTab: 'all', // all or deals
    currentViewMode: 'cards' // cards or table
};

// عناصر واجهة المستخدم الرئيسية (UI Elements)
const portalScreen = document.getElementById('portal-screen');
const appScreen = document.getElementById('app-screen');
const enterPortalBtn = document.getElementById('enter-portal-btn');
const backToPortalBtn = document.getElementById('back-to-portal-btn');

const searchForm = document.getElementById('search-form');
const activitySelect = document.getElementById('activity-select');
const customActivityInput = document.getElementById('custom-activity-input');
const citySelect = document.getElementById('city-select');
const customCityInput = document.getElementById('custom-city-input');
const leadLimitRange = document.getElementById('lead-limit-range');
const limitVal = document.getElementById('limit-val');
const demoModeToggle = document.getElementById('demo-mode-toggle');
const searchingLoader = document.getElementById('searching-loader');
const statsDashboard = document.getElementById('stats-dashboard');

const openSettingsBtn = document.getElementById('open-settings-btn');
const settingsModal = document.getElementById('settings-modal');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const closeSettingsBtns = document.querySelectorAll('.close-settings');

const detailsModal = document.getElementById('details-modal');
const closeDetailsBtns = document.querySelectorAll('.close-details');
const saveLeadDetailsBtn = document.getElementById('save-lead-details-btn');
const deleteLeadBtn = document.getElementById('delete-lead-btn');

const leadsTableBody = document.getElementById('leads-table-body');
const emptyTableState = document.getElementById('empty-table-state');
const tableSearchInput = document.getElementById('table-search-input');
const filterStatusSelect = document.getElementById('filter-status-select');
const exportCsvBtn = document.getElementById('export-csv-btn');

const tabAllBtn = document.getElementById('tab-all-btn');
const tabDealsBtn = document.getElementById('tab-deals-btn');

const leadsCardsContainer = document.getElementById('leads-cards-container');
const leadsTableContainer = document.getElementById('leads-table-container');
const viewCardsBtn = document.getElementById('view-cards-btn');
const viewTableBtn = document.getElementById('view-table-btn');

// كائنات المخططات البيانية (ChartJS)
let statusChartInstance = null;
let cityChartInstance = null;

// تشغيل التطبيق والتحقق الأولي
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadLeads();
    initEventListeners();
    updateDashboardStats();
    updateSettingsUIIndicators();
});

// إعداد مستمعي الأحداث التفاعلية
function initEventListeners() {
    // الانتقال بين الشاشات
    enterPortalBtn.addEventListener('click', () => {
        portalScreen.classList.add('hidden');
        appScreen.classList.remove('hidden');
        // تهيئة المخططات بعد ظهور الشاشة
        initCharts();
    });

    backToPortalBtn.addEventListener('click', () => {
        appScreen.classList.add('hidden');
        portalScreen.classList.remove('hidden');
    });

    // إظهار حقول الكتابة المخصصة عند الاختيار
    activitySelect.addEventListener('change', () => {
        if (activitySelect.value === 'custom') {
            customActivityInput.classList.remove('hidden');
            customActivityInput.setAttribute('required', 'true');
        } else {
            customActivityInput.classList.add('hidden');
            customActivityInput.removeAttribute('required');
        }
    });

    citySelect.addEventListener('change', () => {
        if (citySelect.value === 'custom') {
            customCityInput.classList.remove('hidden');
            customCityInput.setAttribute('required', 'true');
        } else {
            customCityInput.classList.add('hidden');
            customCityInput.removeAttribute('required');
        }
    });

    // تحديث رقم شريط الحد الأقصى
    leadLimitRange.addEventListener('input', (e) => {
        limitVal.textContent = `${e.target.value} عملاء`;
    });

    // التحكم بالنافذة المنبثقة للإعدادات
    openSettingsBtn.addEventListener('click', () => {
        // تعبئة البيانات الحالية
        document.getElementById('setting-webhook-url').value = appState.settings.webhookUrl || '';
        document.getElementById('setting-google-key').value = appState.settings.googleKey || '';
        document.getElementById('setting-google-cx').value = appState.settings.googleCx || '';
        document.getElementById('setting-gemini-key').value = appState.settings.geminiKey || '';
        document.getElementById('setting-prompt').value = appState.settings.promptTemplate || DEFAULT_PROMPT_TEMPLATE;
        
        settingsModal.classList.remove('hidden');
    });

    closeSettingsBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            settingsModal.classList.add('hidden');
        });
    });

    saveSettingsBtn.addEventListener('click', saveSettings);

    // التحكم بنوافذ تفاصيل العميل والملاحظات
    closeDetailsBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            detailsModal.classList.add('hidden');
        });
    });

    saveLeadDetailsBtn.addEventListener('click', saveLeadDetails);
    deleteLeadBtn.addEventListener('click', deleteCurrentLead);

    // إطلاق عملية البحث والطلب
    searchForm.addEventListener('submit', handleSearchSubmit);

    // فلترة وبحث الجدول
    tableSearchInput.addEventListener('input', renderLeadsTable);
    filterStatusSelect.addEventListener('change', renderLeadsTable);

    // تبديل التبويبات (كل العملاء / الصفقات والاتفاق)
    tabAllBtn.addEventListener('click', () => {
        appState.currentTab = 'all';
        tabAllBtn.className = "border-b-2 border-cyan-glow text-cyan-glow px-4 py-3 font-semibold text-sm flex items-center gap-2";
        tabDealsBtn.className = "border-b-2 border-transparent text-slate-400 hover:text-slate-200 px-4 py-3 font-semibold text-sm flex items-center gap-2";
        renderLeadsTable();
    });

    tabDealsBtn.addEventListener('click', () => {
        appState.currentTab = 'deals';
        tabDealsBtn.className = "border-b-2 border-cyan-glow text-cyan-glow px-4 py-3 font-semibold text-sm flex items-center gap-2";
        tabAllBtn.className = "border-b-2 border-transparent text-slate-400 hover:text-slate-200 px-4 py-3 font-semibold text-sm flex items-center gap-2";
        renderLeadsTable();
    });

    // تبديل طرق عرض النتائج (بطاقات مقابل جدول)
    viewCardsBtn.addEventListener('click', () => {
        appState.currentViewMode = 'cards';
        viewCardsBtn.className = "bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition";
        viewTableBtn.className = "text-slate-400 hover:text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition";
        renderLeadsTable();
    });

    viewTableBtn.addEventListener('click', () => {
        appState.currentViewMode = 'table';
        viewTableBtn.className = "bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition";
        viewCardsBtn.className = "text-slate-400 hover:text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition";
        renderLeadsTable();
    });

    // تصدير النتائج
    exportCsvBtn.addEventListener('click', exportLeadsToCSV);
}

// تحميل الإعدادات من LocalStorage
function loadSettings() {
    const savedSettings = localStorage.getItem('smart_explorer_settings');
    if (savedSettings) {
        appState.settings = { ...appState.settings, ...JSON.parse(savedSettings) };
    }
    // وضع رابط افتراضي للـ Webhook لتسهيل البدء
    if (!appState.settings.webhookUrl) {
        appState.settings.webhookUrl = 'https://nada07.app.n8n.cloud/webhook/lead-generation';
    }
}

// حفظ الإعدادات في LocalStorage
function saveSettings() {
    appState.settings.webhookUrl = document.getElementById('setting-webhook-url').value.trim();
    appState.settings.googleKey = document.getElementById('setting-google-key').value.trim();
    appState.settings.googleCx = document.getElementById('setting-google-cx').value.trim();
    appState.settings.geminiKey = document.getElementById('setting-gemini-key').value.trim();
    appState.settings.promptTemplate = document.getElementById('setting-prompt').value.trim() || DEFAULT_PROMPT_TEMPLATE;

    localStorage.setItem('smart_explorer_settings', JSON.stringify(appState.settings));
    
    settingsModal.classList.add('hidden');
    updateSettingsUIIndicators();
    alert('تم حفظ الإعدادات بنجاح في متصفحك!');
}

// تحديث مؤشرات الإعدادات في الواجهة
function updateSettingsUIIndicators() {
    const webhookStat = document.getElementById('webhook-status');
    const googleStat = document.getElementById('google-api-status');
    const geminiStat = document.getElementById('gemini-api-status');

    if (appState.settings.webhookUrl) {
        webhookStat.textContent = 'مفعل (نشط)';
        webhookStat.className = 'text-green-400 font-bold';
    } else {
        webhookStat.textContent = 'غير مدخل';
        webhookStat.className = 'text-slate-500';
    }

    if (appState.settings.googleKey && appState.settings.googleCx) {
        googleStat.textContent = 'مفعل (نشط)';
        googleStat.className = 'text-green-400 font-bold';
    } else {
        googleStat.textContent = 'غير مدخل';
        googleStat.className = 'text-slate-500';
    }

    if (appState.settings.geminiKey) {
        geminiStat.textContent = 'مفعل (نشط)';
        geminiStat.className = 'text-green-400 font-bold';
    } else {
        geminiStat.textContent = 'غير مدخل';
        geminiStat.className = 'text-slate-500';
    }
}

// تحميل العملاء من LocalStorage
function loadLeads() {
    const savedLeads = localStorage.getItem('smart_explorer_leads');
    if (savedLeads) {
        appState.leads = JSON.parse(savedLeads);
    } else {
        appState.leads = [];
    }
}

// حفظ العملاء في LocalStorage
function saveLeadsToStorage() {
    localStorage.setItem('smart_explorer_leads', JSON.stringify(appState.leads));
    updateDashboardStats();
    updateChartsData();
}

// إرسال طلب البحث (n8n / Mock)
async function handleSearchSubmit(e) {
    e.preventDefault();

    const activity = activitySelect.value === 'custom' ? customActivityInput.value.trim() : activitySelect.value;
    const city = citySelect.value === 'custom' ? customCityInput.value.trim() : citySelect.value;
    const limit = parseInt(leadLimitRange.value);
    const isDemo = demoModeToggle.checked;

    if (!activity || !city) {
        alert('الرجاء إدخال النشاط والمدينة للبدء.');
        return;
    }

    // التحقق من الإعدادات في حال البحث الحقيقي
    if (!isDemo) {
        if (!appState.settings.webhookUrl) {
            alert('يرجى تهيئة رابط Webhook n8n في الإعدادات أولاً لإجراء البحث الحقيقي.');
            openSettingsBtn.click();
            return;
        }
        if (!appState.settings.googleKey || !appState.settings.googleCx || !appState.settings.geminiKey) {
            alert('تحذير: قد تفشل عملية الأتمتة في n8n إذا لم تكن قد هيأت مفاتيح Google API و Gemini في الإعدادات بشكل صحيح.');
        }
    }

    // إظهار شاشة الانتظار والنبضات الحماسية
    searchingLoader.classList.remove('hidden');
    statsDashboard.classList.add('opacity-50');

    try {
        let results = [];
        if (isDemo) {
            // محاكاة الاتصال والبحث وتوليد البيانات بذكاء
            results = await getMockSearchResults(activity, city, limit);
        } else {
            // الاتصال الحقيقي مع n8n Webhook
            results = await fetchLiveFromN8N(activity, city, limit);
        }

        if (results && results.length > 0) {
            // دمج النتائج الجديدة مع النتائج السابقة في البداية
            const formattedResults = results.map(item => ({
                id: 'lead_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
                name: item.name || 'شركة غير معروفة',
                phone: item.phone || 'غير متوفر',
                location: item.location || city,
                activity: activity,
                website: item.website || '#',
                message: item.message || 'رسالة مخصصة سيتم إنشاؤها بالطلب...',
                status: 'مكتشف',
                notes: '',
                createdAt: new Date().toISOString()
            }));

            appState.leads = [...formattedResults, ...appState.leads];
            saveLeadsToStorage();
            renderLeadsTable();
            alert(`نجاح الاستكشاف! تم العثور على ${formattedResults.length} عميل محتمل وتوليد رسائلهم بالذكاء الاصطناعي.`);
        } else {
            alert('انتهى البحث ولكن لم يتم العثور على أي عملاء جدد في هذا النطاق، يرجى تجربة كلمات بحثية مختلفة.');
        }

    } catch (error) {
        console.error(error);
        alert('حدث خطأ أثناء الاتصال بالـ Webhook الخاص بـ n8n. يرجى مراجعة رابط الإعدادات والتحقق من تشغيل سير العمل.');
    } finally {
        searchingLoader.classList.add('hidden');
        statsDashboard.classList.remove('opacity-50');
    }
}

// محاكاة جلب البيانات للوضع التجريبي (البرمجة الإبداعية للبيانات)
function getMockSearchResults(activity, city, limit) {
    return new Promise((resolve) => {
        // مدة تحميل واقعية للبحث والرادار (2.5 ثانية)
        setTimeout(() => {
            const mockLeads = [];
            
            // قوالب أسماء الشركات حسب الأنشطة
            const companyNames = {
                'مطاعم': ['مطعم شواية الخليج', 'مطعم ضيعتنا التراثي', 'مطعم برجر وبطاطس', 'مطعم بيتزا إيطالية', 'مطعم لوسين الأرمني', 'شاورما هليل المتميزة', 'مطعم بخاري النور', 'مطعم وادي العريش'],
                'مقاهي': ['جولت كافيه (Jolt)', 'هاف مليون مقهى ومحمصة', 'دوز كافيه المتميز', 'عنوان القهوة (Address)', 'مقهى إكسير البن', 'برو 92 كافيه مختص', 'كيان كافيه (Keyan)', 'عنوان ومذاق للقهوة'],
                'صالونات تجميل': ['صالون روزا للتزيين النسائي', 'صالون لمسات الأناقة والجمال', 'مشغل روعة المخملية النسائي', 'صالون داليا للعناية والتجميل', 'صالون شيار النسائي', 'مركز سبا وجمال المرأة'],
                'شركات تقنية': ['مؤسسة الحلول التقنية المتقدمة', 'شركة مسار البرمجيات والحلول الرقمية', 'مؤسسة الابتكار الرقمي للمعلومات', 'شركة ترميز الرقمية لتصميم التطبيقات', 'مؤسسة التقنية السعودية للاتصالات'],
                'عيادات طبية': ['مجمع عيادات النخبة الطبي', 'عيادات الطبابة المتخصصة', 'مركز ريادة لطب الأسنان والجلدية', 'مجمع شفاء الوطن الطبي', 'عيادات د. خالد التخصصية'],
                'مكاتب عقارية': ['مكتب عقارات الرياض المتميزة', 'مؤسسة سهم العقارية للتطوير', 'مكتب الجوف للاستثمار العقاري', 'مكتب قصر الدار للخدمات العقارية', 'مؤسسة إعمار الوطن العقارية'],
                'نوادي رياضية': ['نادي أبطال اللياقة الرياضي', 'نادي جولد جيم الرياضي للرجال', 'مركز فتنس برو النسائي', 'صالة القوة والحديد الرياضية']
            };

            const selectedActivityNames = companyNames[activity] || [`مؤسسة ${activity} المتميزة`, `شركة ${activity} العربية`, `مركز ${activity} التقدمي`, `مكتب ${activity} الذهبي`];
            
            const localPitches = [
                `مرحباً، لاحظنا شعبية [NAME] الكبيرة في مدينة [CITY]. في منصتنا، نقدم لكم نظام أتمتة متقدم لتلقي الطلبات وإدارة حسابات التواصل بشكل آلي بالكامل، مما يوفر لكم أكثر من 35% من كلفة التشغيل. يسعدنا ترتيب موعد سريع لمناقشة التفاصيل!`,
                `السلام عليكم، نهنئكم على خدمات [NAME] الممتازة. بصفتنا شريك تقني معتمد، قمنا بتجهيز نموذج مبدئي لتطبيق هاتف مخصص لـ [NAME] لزيادة طلبات عملائكم المباشرة وتقليل عمولات تطبيقات التوصيل. هل يمكننا الاتصال بكم غداً لعرضه؟`,
                `أهلاً بكم فريق [NAME]، نقدر ريادتكم في مجال [ACTIVITY] بمدينة [CITY]. نود تزويدكم بنظام ذكاء اصطناعي مخصص لتحليل مراجعات العملاء والرد على استفساراتهم تلقائياً لزيادة رضاهم وتقييمكم على خرائط جوجل. ننتظر ردكم لبدء التعاون.`
            ];

            const phonePrefixes = ['050', '055', '054', '056', '053', '059'];

            for (let i = 0; i < limit; i++) {
                // اختيار اسم عشوائي دون تكرار بقدر الإمكان
                const nameIndex = i % selectedActivityNames.length;
                const companyName = selectedActivityNames[nameIndex] + (i >= selectedActivityNames.length ? ` فرع ${Math.floor(i/selectedActivityNames.length) + 1}` : '');
                
                // توليد هاتف سعودي عشوائي
                const prefix = phonePrefixes[Math.floor(Math.random() * phonePrefixes.length)];
                const suffix = Math.floor(1000000 + Math.random() * 9000000);
                const phone = `${prefix}${suffix}`;

                // رابط ويب
                const cleanName = companyName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10) || 'company';
                const website = `https://www.${cleanName}-${city === 'الرياض' ? 'ruh' : 'jed'}.com`;

                // توليد رسالة تسويقية ذكية محاكية
                let message = localPitches[i % localPitches.length]
                    .replace('[NAME]', companyName)
                    .replace('[CITY]', city)
                    .replace('[ACTIVITY]', activity);

                mockLeads.push({
                    name: companyName,
                    phone: phone,
                    location: city,
                    website: website,
                    message: message
                });
            }

            resolve(mockLeads);
        }, 2500);
    });
}

// طلب اتصال حقيقي مع n8n Webhook
async function fetchLiveFromN8N(activity, city, limit) {
    const payload = {
        google_search_api_key: appState.settings.googleKey,
        google_search_cx: appState.settings.googleCx,
        gemini_api_key: appState.settings.geminiKey,
        prompt_template: appState.settings.promptTemplate,
        city: city,
        keyword: activity,
        lead_limit: limit
    };

    try {
        const response = await fetch(appState.settings.webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`n8n webhook returned status ${response.status}: ${text || response.statusText}`);
        }

        const rawText = await response.text();
        let data = null;

        try {
            data = rawText ? JSON.parse(rawText) : null;
        } catch (parseError) {
            console.warn('استجابة n8n ليست JSON صالحة:', rawText);
            throw new Error('استجابة n8n ليست JSON صالحاً. تأكد من أن سير العمل يرجع JSON.');
        }

        console.log('Response from n8n:', data);

        const normalizedLeads = normalizeWebhookResponse(data, activity, city);
        if (!normalizedLeads.length) {
            console.warn('لم يتم العثور على leads صحيحة في الاستجابة');
            return [];
        }

        return normalizedLeads;
    } catch (error) {
        console.error('خطأ في fetchLiveFromN8N:', error);
        throw new Error(`فشل الاتصال مع n8n: ${error.message}`);
    }
}

function normalizeWebhookResponse(data, fallbackActivity, fallbackCity) {
    const candidates = [];

    if (Array.isArray(data)) {
        candidates.push(...data);
    } else if (data && typeof data === 'object') {
        const keys = ['leads', 'data', 'results', 'items', 'customers', 'companies'];
        for (const key of keys) {
            if (Array.isArray(data[key])) {
                candidates.push(...data[key]);
            }
        }

        if (!candidates.length && data && typeof data === 'object' && !Array.isArray(data)) {
            candidates.push(data);
        }
    }

    if (!candidates.length) return [];

    return candidates
        .map(item => {
            if (!item || typeof item !== 'object') return null;

            const name = item.name || item.company || item.businessName || item.brand || item.title || item.company_name || 'شركة غير معروفة';
            const phone = item.phone || item.phoneNumber || item.mobile || item.telephone || item.whatsapp || item.phone_number || 'غير متوفر';
            const location = item.location || item.city || item.area || item.address || fallbackCity || 'غير محدد';
            const website = item.website || item.url || item.link || item.websiteUrl || '#';
            const message = item.message || item.pitch || item.text || item.generatedMessage || item.description || 'رسالة التسويق غير متاحة';
            const activity = item.activity || item.category || item.industry || fallbackActivity || 'عام';

            if (!name || (!phone && phone !== 'غير متوفر') || !message) {
                return null;
            }

            return {
                name,
                phone,
                location,
                website,
                message,
                activity,
                status: 'مكتشف',
                notes: ''
            };
        })
        .filter(Boolean)
        .slice(0, 50);
}

// تحديث إحصائيات لوحة التحكم الإدارية
function updateDashboardStats() {
    const totalLeads = appState.leads.length;
    const contactedLeads = appState.leads.filter(l => l.status === 'تم التواصل').length;
    const agreedLeads = appState.leads.filter(l => l.status === 'تم الاتفاق').length;
    
    // حساب نسبة النجاح (الاتفاق من إجمالي من تواصلنا معهم أو الإجمالي العام)
    // هنا سنحسبها بناءً على إجمالي العملاء الإيجابيين
    const conversionRate = totalLeads > 0 ? Math.round((agreedLeads / totalLeads) * 100) : 0;

    document.getElementById('stat-total').textContent = totalLeads;
    document.getElementById('stat-contacted').textContent = contactedLeads;
    document.getElementById('stat-agreed').textContent = agreedLeads;
    document.getElementById('stat-conversion').textContent = `${conversionRate}%`;
}

// تهيئة الرسوم البيانية لأول مرة
function initCharts() {
    // 1. مخطط الحالات
    const statusCtx = document.getElementById('statusChart').getContext('2d');
    statusChartInstance = new Chart(statusCtx, {
        type: 'doughnut',
        data: {
            labels: ['مكتشف', 'تم التواصل', 'تم الاتفاق', 'غير مهتم'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#ef4444'],
                borderWidth: 2,
                borderColor: '#0d1527'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#94a3b8', font: { family: 'Cairo', size: 11 } }
                }
            }
        }
    });

    // 2. مخطط المدن
    const cityCtx = document.getElementById('cityChart').getContext('2d');
    cityChartInstance = new Chart(cityCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'عدد العملاء',
                data: [],
                backgroundColor: '#00f0ff',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8', font: { family: 'Cairo' } }
                },
                y: {
                    grid: { color: '#1e2e56' },
                    ticks: { color: '#94a3b8', precision: 0 }
                }
            }
        }
    });

    updateChartsData();
}

// تحديث بيانات المخططات ديناميكياً
function updateChartsData() {
    if (!statusChartInstance || !cityChartInstance) return;

    // تحديث بيانات الحالات
    const maktashaf = appState.leads.filter(l => l.status === 'مكتشف').length;
    const contacted = appState.leads.filter(l => l.status === 'تم التواصل').length;
    const agreed = appState.leads.filter(l => l.status === 'تم الاتفاق').length;
    const disinterested = appState.leads.filter(l => l.status === 'غير مهتم').length;

    statusChartInstance.data.datasets[0].data = [maktashaf, contacted, agreed, disinterested];
    statusChartInstance.update();

    // تحديث بيانات توزيع المدن
    const cityCounts = {};
    appState.leads.forEach(l => {
        cityCounts[l.location] = (cityCounts[l.location] || 0) + 1;
    });

    // فرز المدن تنازلياً وعرض أعلى 5 مدن
    const sortedCities = Object.entries(cityCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    cityChartInstance.data.labels = sortedCities.map(item => item[0]);
    cityChartInstance.data.datasets[0].data = sortedCities.map(item => item[1]);
    cityChartInstance.update();
}

// فلترة قائمة العملاء استناداً إلى البحث والتبويب والحالة
function getFilteredLeads() {
    const searchText = tableSearchInput.value.toLowerCase().trim();
    const filterStatus = filterStatusSelect.value;

    let filteredLeads = [...appState.leads];

    if (appState.currentTab === 'deals') {
        filteredLeads = filteredLeads.filter(lead => lead.status === 'تم التواصل' || lead.status === 'تم الاتفاق');
    }

    if (searchText) {
        filteredLeads = filteredLeads.filter(lead =>
            lead.name.toLowerCase().includes(searchText) ||
            lead.location.toLowerCase().includes(searchText) ||
            lead.activity.toLowerCase().includes(searchText) ||
            lead.phone.includes(searchText)
        );
    }

    if (filterStatus !== 'all') {
        filteredLeads = filteredLeads.filter(lead => lead.status === filterStatus);
    }

    return filteredLeads;
}

// عرض نتائج العملاء كبطاقات Lead Cards في الواجهة الرئيسية
function renderLeadCards(filteredLeads = getFilteredLeads()) {
    if (!leadsCardsContainer) return;

    if (filteredLeads.length === 0) {
        leadsCardsContainer.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center min-h-[220px] rounded-2xl border border-dashed border-navy-700 bg-navy-900/40 text-center p-8">
                <i class="fa-solid fa-circle-nodes text-navy-600 text-5xl mb-4 animate-pulse"></i>
                <p class="text-slate-400 font-medium">لا توجد نتائج حالياً</p>
                <p class="text-xs text-slate-600 mt-1">قم بتغيير شروط البحث أو أطلق استكشافاً جديداً.</p>
            </div>
        `;
        return;
    }

    leadsCardsContainer.innerHTML = filteredLeads.map(lead => {
        const whatsappText = encodeURIComponent(lead.message);
        let cleanPhone = lead.phone.trim();
        if (cleanPhone.startsWith('0')) {
            cleanPhone = '966' + cleanPhone.substring(1);
        } else if (!cleanPhone.startsWith('966') && cleanPhone !== 'غير متوفر') {
            cleanPhone = '966' + cleanPhone;
        }

        const whatsappLink = cleanPhone !== 'غير متوفر' ? `https://wa.me/${cleanPhone}?text=${whatsappText}` : '#';

        let statusBadgeClass = 'bg-blue-900/60 text-blue-300 border-blue-800';
        if (lead.status === 'تم التواصل') statusBadgeClass = 'bg-amber-900/60 text-amber-300 border-amber-800';
        else if (lead.status === 'تم الاتفاق') statusBadgeClass = 'bg-emerald-900/60 text-emerald-300 border-emerald-800 font-bold neon-text-gold';
        else if (lead.status === 'غير مهتم') statusBadgeClass = 'bg-red-900/60 text-red-300 border-red-800';

        const agreedGlow = lead.status === 'تم الاتفاق' ? 'lead-card-agreed' : 'lead-engine-card';
        const hasNotesIndicator = lead.notes ? '<span class="inline-block w-2 h-2 rounded-full bg-cyan-glow" title="يوجد ملاحظات"></span>' : '';

        return `
            <article class="${agreedGlow} rounded-2xl p-5 flex flex-col gap-4">
                <div class="flex items-start justify-between gap-3">
                    <div>
                        <h4 class="text-lg font-bold text-white flex items-center gap-2">
                            ${lead.status === 'تم الاتفاق' ? '<i class="fa-solid fa-medal text-gold-glow"></i>' : '<i class="fa-solid fa-user-tie text-cyan-glow"></i>'}
                            <span>${lead.name}</span>
                        </h4>
                        <p class="text-xs text-slate-400 mt-1">${lead.activity}</p>
                    </div>
                    <span class="status-badge ${statusBadgeClass} border text-[10px] rounded-full px-2 py-1 font-bold">${lead.status}</span>
                </div>

                <div class="space-y-2 text-sm text-slate-300">
                    <div class="flex items-center gap-2"><i class="fa-solid fa-location-dot text-cyan-glow"></i><span>${lead.location}</span></div>
                    <div class="flex items-center gap-2"><i class="fa-solid fa-phone text-cyan-glow"></i><span>${lead.phone}</span></div>
                    ${lead.website !== '#' ? `<div class="flex items-center gap-2"><i class="fa-solid fa-globe text-cyan-glow"></i><a href="${lead.website}" target="_blank" class="text-blue-400 hover:underline">زيارة الموقع</a></div>` : '<div class="flex items-center gap-2"><i class="fa-solid fa-globe text-slate-500"></i><span class="text-slate-500">لا يوجد موقع</span></div>'}
                </div>

                <div class="bg-navy-950/60 border border-navy-800 rounded-xl p-3 text-sm text-slate-300">
                    <p class="line-clamp-4">${lead.message}</p>
                </div>

                <div class="flex flex-wrap gap-2 mt-auto">
                    <button onclick="openLeadDetails('${lead.id}')" class="bg-navy-800 hover:bg-navy-700 text-slate-200 px-3 py-2 rounded-lg text-xs border border-navy-700 transition flex items-center gap-1">
                        <i class="fa-regular fa-comment-dots text-cyan-glow"></i>
                        <span>تفاصيل</span>
                        ${hasNotesIndicator}
                    </button>
                    <button onclick="copyLeadMessage('${lead.id}')" class="bg-navy-800 hover:bg-navy-700 text-slate-200 px-3 py-2 rounded-lg text-xs border border-navy-700 transition">
                        <i class="fa-solid fa-copy"></i>
                    </button>
                    ${lead.phone !== 'غير متوفر' ? `
                        <a href="${whatsappLink}" target="_blank" class="bg-green-950/60 hover:bg-green-900/60 text-green-300 px-3 py-2 rounded-lg text-xs border border-green-800 transition flex items-center gap-1">
                            <i class="fa-brands fa-whatsapp text-base"></i>
                            <span>واتساب</span>
                        </a>
                    ` : ''}
                </div>

                <div class="pt-2 border-t border-navy-800">
                    <select onchange="updateLeadStatus('${lead.id}', this.value)" class="status-badge ${statusBadgeClass} border text-xs rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer w-full">
                        <option value="مكتشف" ${lead.status === 'مكتشف' ? 'selected' : ''}>🔍 مكتشف</option>
                        <option value="تم التواصل" ${lead.status === 'تم التواصل' ? 'selected' : ''}>📞 تم التواصل</option>
                        <option value="تم الاتفاق" ${lead.status === 'تم الاتفاق' ? 'selected' : ''}>🤝 تم الاتفاق</option>
                        <option value="غير مهتم" ${lead.status === 'غير مهتم' ? 'selected' : ''}>❌ غير مهتم</option>
                    </select>
                </div>
            </article>
        `;
    }).join('');
}

// عرض بيانات جدول العملاء مع الفلاتر والبحث والتبويبات
function renderLeadsTable() {
    const filteredLeads = getFilteredLeads();

    if (appState.currentViewMode === 'cards') {
        leadsCardsContainer.classList.remove('hidden');
        leadsTableContainer.classList.add('hidden');
        renderLeadCards(filteredLeads);
    } else {
        leadsCardsContainer.classList.add('hidden');
        leadsTableContainer.classList.remove('hidden');
    }

    if (filteredLeads.length === 0) {
        emptyTableState.classList.remove('hidden');
        leadsTableBody.innerHTML = '';
        return;
    }

    emptyTableState.classList.add('hidden');

    if (appState.currentViewMode === 'table') {
        leadsTableBody.innerHTML = filteredLeads.map(lead => {
            const whatsappText = encodeURIComponent(lead.message);
            let cleanPhone = lead.phone.trim();
            if (cleanPhone.startsWith('0')) {
                cleanPhone = '966' + cleanPhone.substring(1);
            } else if (!cleanPhone.startsWith('966') && cleanPhone !== 'غير متوفر') {
                cleanPhone = '966' + cleanPhone;
            }

            const whatsappLink = cleanPhone !== 'غير متوفر' ? `https://wa.me/${cleanPhone}?text=${whatsappText}` : '#';

            let statusBadgeClass = '';
            if (lead.status === 'مكتشف') statusBadgeClass = 'bg-blue-900/60 text-blue-300 border-blue-800';
            else if (lead.status === 'تم التواصل') statusBadgeClass = 'bg-amber-900/60 text-amber-300 border-amber-800';
            else if (lead.status === 'تم الاتفاق') statusBadgeClass = 'bg-emerald-900/60 text-emerald-300 border-emerald-800 font-bold neon-text-gold';
            else if (lead.status === 'غير مهتم') statusBadgeClass = 'bg-red-900/60 text-red-300 border-red-800';

            const hasNotesIndicator = lead.notes ? `<span class="inline-block w-2 h-2 rounded-full bg-cyan-glow" title="يوجد ملاحظات"></span>` : '';

            return `
                <tr class="border-b border-navy-800/40 align-middle">
                    <td class="p-4">
                        <div class="font-bold text-white flex items-center gap-2">
                            ${lead.status === 'تم الاتفاق' ? '<i class="fa-solid fa-medal text-gold-glow"></i>' : ''}
                            <span>${lead.name}</span>
                        </div>
                        <div class="text-xs text-slate-400 mt-0.5">${lead.activity}</div>
                    </td>
                    <td class="p-4 text-slate-300 font-medium">${lead.location}</td>
                    <td class="p-4">
                        <div class="text-slate-300 text-xs font-semibold">${lead.phone}</div>
                        <div class="mt-1">
                            ${lead.website !== '#' ? `<a href="${lead.website}" target="_blank" class="text-[11px] text-blue-400 hover:underline flex items-center gap-1"><i class="fa-solid fa-globe text-[9px]"></i> الموقع الإلكتروني</a>` : '<span class="text-slate-600 text-[10px]">بلا موقع</span>'}
                        </div>
                    </td>
                    <td class="p-4 max-w-xs">
                        <div class="truncate text-slate-400 text-xs" title="${lead.message.replace(/"/g, '&quot;')}">
                            ${lead.message}
                        </div>
                        <button onclick="openLeadDetails('${lead.id}')" class="text-cyan-glow hover:underline text-[10px] mt-1 font-semibold flex items-center gap-0.5">
                            <span>عرض ونسخ الرسالة بالكامل</span>
                            <i class="fa-solid fa-up-right-from-square text-[8px]"></i>
                        </button>
                    </td>
                    <td class="p-4">
                        <select onchange="updateLeadStatus('${lead.id}', this.value)" class="status-badge ${statusBadgeClass} border text-xs rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer">
                            <option value="مكتشف" ${lead.status === 'مكتشف' ? 'selected' : ''}>🔍 مكتشف</option>
                            <option value="تم التواصل" ${lead.status === 'تم التواصل' ? 'selected' : ''}>📞 تم التواصل</option>
                            <option value="تم الاتفاق" ${lead.status === 'تم الاتفاق' ? 'selected' : ''}>🤝 تم الاتفاق</option>
                            <option value="غير مهتم" ${lead.status === 'غير مهتم' ? 'selected' : ''}>❌ غير مهتم</option>
                        </select>
                    </td>
                    <td class="p-4 text-left">
                        <div class="inline-flex gap-2">
                            <button onclick="openLeadDetails('${lead.id}')" class="bg-navy-800 hover:bg-navy-700 text-slate-300 p-2 rounded-lg text-xs border border-navy-700 transition flex items-center gap-1" title="ملاحظات وتفاصيل">
                                <i class="fa-regular fa-comment-dots text-cyan-glow"></i>
                                <span>تعديل</span>
                                ${hasNotesIndicator}
                            </button>
                            <button onclick="copyLeadMessage('${lead.id}')" class="bg-navy-800 hover:bg-navy-700 text-slate-300 p-2 rounded-lg text-xs border border-navy-700 transition" title="نسخ الرسالة">
                                <i class="fa-solid fa-copy"></i>
                            </button>
                            ${lead.phone !== 'غير متوفر' ? `
                                <a href="${whatsappLink}" target="_blank" class="bg-green-950/60 hover:bg-green-900/60 text-green-400 p-2 rounded-lg text-xs border border-green-800 transition flex items-center gap-1" title="تواصل عبر الواتساب">
                                    <i class="fa-brands fa-whatsapp text-lg"></i>
                                    <span class="hidden md:inline">مراسلة</span>
                                </a>
                            ` : `
                                <button class="bg-slate-800 text-slate-600 p-2 rounded-lg text-xs border border-slate-700 cursor-not-allowed" disabled title="لا يوجد هاتف">
                                    <i class="fa-solid fa-phone-slash"></i>
                                </button>
                            `}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }
}

// تغيير حالة العميل
function updateLeadStatus(id, newStatus) {
    const leadIndex = appState.leads.findIndex(l => l.id === id);
    if (leadIndex !== -1) {
        appState.leads[leadIndex].status = newStatus;
        saveLeadsToStorage();
        renderLeadsTable();
    }
}

// نسخ الرسالة التسويقية إلى الحافظة
function copyLeadMessage(id) {
    const lead = appState.leads.find(l => l.id === id);
    if (lead) {
        navigator.clipboard.writeText(lead.message)
            .then(() => alert(`تم نسخ رسالة شركة "${lead.name}" إلى الحافظة بنجاح!`))
            .catch(err => console.error('خطأ أثناء النسخ: ', err));
    }
}

// فتح شاشة الملاحظات والتفاصيل
function openLeadDetails(id) {
    const lead = appState.leads.find(l => l.id === id);
    if (lead) {
        appState.currentEditingLeadId = id;
        document.getElementById('detail-name').textContent = lead.name;
        document.getElementById('detail-activity-city').textContent = `${lead.activity} • ${lead.location}`;
        document.getElementById('detail-phone').textContent = lead.phone;
        
        const websiteLink = document.getElementById('detail-website');
        if (lead.website && lead.website !== '#') {
            websiteLink.href = lead.website;
            websiteLink.textContent = 'زيارة الموقع الإلكتروني للشركة';
            websiteLink.className = 'text-sm font-bold text-blue-400 hover:underline';
        } else {
            websiteLink.removeAttribute('href');
            websiteLink.textContent = 'موقع إلكتروني غير متوفر';
            websiteLink.className = 'text-sm font-semibold text-slate-500 cursor-not-allowed';
        }

        document.getElementById('detail-message').textContent = lead.message;
        document.getElementById('detail-notes').value = lead.notes || '';

        detailsModal.classList.remove('hidden');
    }
}

// حفظ الملاحظات للعميل الحالي
function saveLeadDetails() {
    const id = appState.currentEditingLeadId;
    if (id) {
        const leadIndex = appState.leads.findIndex(l => l.id === id);
        if (leadIndex !== -1) {
            appState.leads[leadIndex].notes = document.getElementById('detail-notes').value.trim();
            saveLeadsToStorage();
            renderLeadsTable();
            detailsModal.classList.add('hidden');
        }
    }
}

// حذف العميل الحالي
function deleteCurrentLead() {
    const id = appState.currentEditingLeadId;
    if (id) {
        const lead = appState.leads.find(l => l.id === id);
        if (confirm(`هل أنت متأكد من حذف العميل "${lead.name}" بالكامل؟ لا يمكن التراجع عن هذا الإجراء.`)) {
            appState.leads = appState.leads.filter(l => l.id !== id);
            saveLeadsToStorage();
            renderLeadsTable();
            detailsModal.classList.add('hidden');
        }
    }
}

// تصدير العملاء إلى ملف CSV متوافق مع Excel والأحرف العربية (UTF-8 with BOM)
function exportLeadsToCSV() {
    // تحديد العملاء المراد تصديرهم بناءً على التبويب
    let exportList = [...appState.leads];
    if (appState.currentTab === 'deals') {
        exportList = exportList.filter(lead => lead.status === 'تم التواصل' || lead.status === 'تم الاتفاق');
    }

    if (exportList.length === 0) {
        alert('لا توجد بيانات لتصديرها حالياً.');
        return;
    }

    // ترويسة الجدول
    const headers = ['اسم الشركة', 'النشاط', 'المدينة', 'رقم الهاتف', 'الموقع الإلكتروني', 'الرسالة التسويقية', 'الحالة', 'ملاحظات التواصل', 'تاريخ الاستكشاف'];
    
    // توليد الأسطر
    const rows = exportList.map(lead => [
        lead.name,
        lead.activity,
        lead.location,
        lead.phone,
        lead.website,
        lead.message.replace(/\n/g, ' '), // تنظيف الفواصل السطرية
        lead.status,
        (lead.notes || '').replace(/\n/g, ' '),
        lead.createdAt
    ]);

    // تحويل البيانات إلى تنسيق CSV مع حماية الحقول بالفواصل والاقتباسات
    const csvContent = [headers, ...rows]
        .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
        .join("\n");

    // إضافة BOM لـ UTF-8 لفتح الملف باللغة العربية في Excel دون تشويه
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `مستكشف_العملاء_${appState.currentTab === 'deals' ? 'الصفقات_' : ''}${new Date().toLocaleDateString('en-US').replace(/\//g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
