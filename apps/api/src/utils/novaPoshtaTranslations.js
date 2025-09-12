// apps/api/src/utils/novaPoshtaTranslations.js

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
    'Delivered': 'Доставлено',
    'Delivered at parcel locker': 'Доставлено до поштомату',
    'Delivered at address': 'Доставлено за адресою'
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
    
    // Міста
    'Kyiv': 'Київ',
    'Kiev': 'Київ',
    'Lutsk': 'Луцьк',
    'Chernihiv': 'Чернігів',
    'Lviv': 'Львів',
    'Dnipro': 'Дніпро',
    'Kharkiv': 'Харків',
    'Odesa': 'Одеса',
    'Velykyi Omelianyk': 'Великий Омеляник'
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

    // Застосовуємо pattern-based переклади
    let translated = englishStatus;

    // Основні patterns для статусів
    translated = translated
        // Delivered patterns
        .replace(/^Delivered at parcel locker (\d+)$/g, 'Доставлено до поштомату $1')
        .replace(/^Delivered at (.+)$/g, 'Доставлено до $1')
        
        // Arrived patterns  
        .replace(/^Arrived at parcel locker (\d+)$/g, 'Прибуло до поштомату $1')
        .replace(/^Arrived at the (.+)$/g, 'Прибуло до $1')
        .replace(/^Arrived at (.+)$/g, 'Прибуло до $1')
        
        // Left patterns
        .replace(/^Left the (.+)$/g, 'Вийшло з $1')
        .replace(/^Left (.+)$/g, 'Вийшло з $1')
        
        // Accepted patterns
        .replace(/^Accepted at (.+)$/g, 'Прийнято у $1');

    // Замінюємо терміни та локації
    Object.entries(LOCATION_TERMS).forEach(([english, ukrainian]) => {
        // Використовуємо word boundaries для точніших замін
        const regex = new RegExp(`\\b${english}\\b`, 'gi');
        translated = translated.replace(regex, ukrainian);
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
        const regex = new RegExp(`\\b${english}\\b`, 'gi');
        translated = translated.replace(regex, ukrainian);
    });

    return translated;
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
    addTranslation,
    EXACT_TRANSLATIONS,
    LOCATION_TERMS
};