// apps/api/src/utils/novaPoshtaTranslations.js - ВИПРАВЛЕНА ВЕРСІЯ

// Точні переклади найпоширеніших статусів
const EXACT_TRANSLATIONS = {
    // Створення та реєстрація
    'Registered and being prepared': 'Зареєстровано та готується до відправки',
    
    // Прийняття
    'Accepted at branch': 'Прийнято у відділенні',
    'Accepted at pickup point': 'Прийнято у пункті прийому',
    
    // Відправка
    'Left branch': 'Вийшло з відділення',
    'Left the branch': 'Вийшло з відділення',
    
    // Доставка
    'Delivered at parcel locker': 'Доставлено до поштомату',
    'Delivered at address': 'Доставлено за адресою',
    'Delivered': 'Доставлено',
    
    // Прибуття
    'Arrived at parcel locker': 'Прибуло до поштомату', 
    'Arrived at the address depot': 'Прибуло до адресного депо',
    'Arrived at the depot': 'Прибуло до депо',
    'Arrived at the KIT': 'Прибуло до КІТ',
    'Arrived at terminal': 'Прибуло до terминалу',
    
    // Відправка
    'Left the address depot': 'Вийшло з адресного депо',
    'Left the KIT': 'Вийшло з КІТ',
    'Left the terminal': 'Вийшло з терміналу',
    
    // ✅ НОВІ: Майбутні події
    'Will arrive at': 'Прибуде до',
    'Will leave from': 'Виїде з',
    'Will depart from': 'Відправиться з',
    'Leaving the': 'Виїде з',
    
    // ✅ СПЕЦІАЛЬНІ
    'Return': 'Повернення',
    'Returned': 'Повернено'
};

// Словник локацій та термінів
const LOCATION_TERMS = {
    'parcel locker': 'поштомат',
    'depot': 'депо', 
    'terminal': 'термінал',
    'branch': 'відділення',
    'pickup point': 'пункт прийому',
    'address depot': 'адресне депо',
    'KIT': 'КІТ',
    'warehouse': 'склад',
    
    // ✅ НОВІ: Терміни з API
    'термінал': 'термінал',  // вже українською, залишаємо
    'відділення': 'відділення', // вже українською
    'депо': 'депо', // вже українською
    
    // Міста
    'Kyiv': 'Київ',
    'Kiev': 'Київ', 
    'Lutsk': 'Луцьк',
    'Chernihiv': 'Чернігів',
    'Lviv': 'Львів',
    'Dnipro': 'Дніпро',
    'Kharkiv': 'Харків',
    'Odesa': 'Одеса',
    'Sumy': 'Суми', // ✅ ДОДАНО
    'Velykyi Omelianyk': 'Великий Омеляник',
    'urban villagе Sad': 'смт Сад' // ✅ ВИПРАВЛЕНО
};

/**
 * Перекладає статус Nova Poshta з англійської на українську
 * @param {string} englishStatus - Статус англійською
 * @returns {string} Переклад українською
 */
function translateStatus(englishStatus) {
    if (!englishStatus || typeof englishStatus !== 'string') {
        return englishStatus || 'Невідомий статус';
    }

    // Спочатку шукаємо точний переклад
    if (EXACT_TRANSLATIONS[englishStatus]) {
        return EXACT_TRANSLATIONS[englishStatus];
    }

    // ✅ ВИПРАВЛЕНО: Розширені pattern-based переклади
    let translated = englishStatus;

    // ✅ МАЙБУТНІ ПОДІЇ - найвищий пріоритет
    translated = translated
        // Will arrive patterns
        .replace(/^Will arrive at (.+)$/g, 'Прибуде до $1')
        .replace(/^Will leave from (.+)$/g, 'Виїде з $1')
        .replace(/^Will depart from (.+)$/g, 'Відправиться з $1')
        .replace(/^Leaving the (.+)$/g, 'Виїде з $1')
        
        // ✅ ПОТОЧНІ ТА МИНУЛІ ПОДІЇ  
        // Delivered patterns - з номерами
        .replace(/^Delivered at parcel locker (\d+)$/g, 'Отримано в поштоматі $1')
        .replace(/^Delivered at branch (\d+)$/g, 'Отримано у відділенні $1') 
        .replace(/^Delivered at (.+)$/g, 'Доставлено до $1')
        
        // Arrived patterns  
        .replace(/^Arrived at parcel locker (\d+)$/g, 'Прибуло до поштомату $1')
        .replace(/^Arrived at branch (\d+)$/g, 'Прибуло до відділення $1')
        .replace(/^Arrived at the (.+)$/g, 'Прибуло до $1')
        .replace(/^Arrived at (.+)$/g, 'Прибуло до $1')
        
        // Left patterns
        .replace(/^Left the (.+)$/g, 'Вийшло з $1')
        .replace(/^Left branch (\d+)$/g, 'Вийшло з відділення $1')
        .replace(/^Left (.+)$/g, 'Вийшло з $1')
        
        // Accepted patterns  
        .replace(/^Accepted at branch (\d+)$/g, 'Прийнято у відділенні $1')
        .replace(/^Accepted at pickup point (\d+)$/g, 'Прийнято у пункті прийому $1')
        .replace(/^Accepted at (.+)$/g, 'Прийнято у $1')
        
        // ✅ СПЕЦІАЛЬНІ СТАТУСИ
        .replace(/^Return$/g, 'Повернення')
        .replace(/^Returned$/g, 'Повернено');

    // ✅ ВИПРАВЛЕНО: Замінюємо терміни та локації
    Object.entries(LOCATION_TERMS).forEach(([english, ukrainian]) => {
        // Використовуємо точні заміни без word boundaries для кращої роботи з різними мовами
        translated = translated.replace(new RegExp(english, 'g'), ukrainian);
    });

    return translated;
}

/**
 * Перекладає локацію з англійської на українську
 * @param {string} englishLocation - Локація англійською
 * @returns {string} Переклад українською
 */
function translateLocation(englishLocation) {
    if (!englishLocation || typeof englishLocation !== 'string') {
        return englishLocation || 'Невідоме місце';
    }

    let translated = englishLocation;

    // Замінюємо терміни та назви міст
    Object.entries(LOCATION_TERMS).forEach(([english, ukrainian]) => {
        translated = translated.replace(new RegExp(english, 'g'), ukrainian);
    });

    return translated;
}

/**
 * ✅ НОВА ФУНКЦІЯ: Визначає тип події на основі eventStatus
 * @param {string} eventStatus - Статус події з API (future|now|passed)
 * @param {string} status - Текст статусу
 * @returns {string} Тип для UI (future|current|past)
 */
function getEventType(eventStatus, status) {
    if (eventStatus === 'future') return 'future';
    if (eventStatus === 'now') return 'current';
    if (eventStatus === 'passed') return 'past';
    
    // Fallback логіка по ключовим словам
    const futureKeywords = ['will', 'прибуде', 'виїде', 'leaving the'];
    const currentKeywords = ['в дорозі', 'обробляється', 'готується'];
    
    const statusLower = status.toLowerCase();
    
    if (futureKeywords.some(keyword => statusLower.includes(keyword.toLowerCase()))) {
        return 'future';
    }
    if (currentKeywords.some(keyword => statusLower.includes(keyword))) {
        return 'current';
    }
    
    return 'past'; // За замовчуванням
}

/**
 * Додає новий переклад до словника (для розширення)
 * @param {string} english - Англійський термін
 * @param {string} ukrainian - Український переклад
 */
function addTranslation(english, ukrainian) {
    EXACT_TRANSLATIONS[english] = ukrainian;
}

module.exports = {
    translateStatus,
    translateLocation,
    getEventType, // ✅ НОВА ФУНКЦІЯ
    addTranslation,
    EXACT_TRANSLATIONS,
    LOCATION_TERMS
};