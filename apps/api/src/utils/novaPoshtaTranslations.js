// apps/api/src/utils/novaPoshtaTranslations.js - ТОЧНО как на сайте Nova Poshta

// ✅ ТОЧНЫЕ переводы с сайта Nova Poshta
const EXACT_TRANSLATIONS = {
    // Створення та реєстрація
    'Registered and being prepared': 'Відправник оформив посилку, але ще не відправив',
    
    // Прийняття
    'Accepted at branch': 'Прийняли у відділенні',
    'Accepted at pickup point': 'Прийнято у пункті прийому',
    
    // ✅ МАЙБУТНІ ПОДІЇ - як на офіційному сайті
    'Will arrive at': 'Прибуде до',
    'Will leave from': 'Виїде з',
    'Will depart from': 'Виїде з',
    
    // ✅ ВІДПРАВКА - точні формулювання
    'Left branch': 'Виїхала з відділення',
    'Left the branch': 'Виїхала з відділення',
    'Left the terminal': 'Виїхала з терміналу',
    'Left the KIT': 'Виїхала з КІТ',
    'Left the address depot': 'Виїхала з депо',
    'Leaving the': 'Виїхала з', // ✅ ВИПРАВЛЕНО
    
    // ✅ ПРИБУТТЯ - точні формулювання  
    'Arrived at parcel locker': 'Прибула до поштомату',
    'Arrived at the address depot': 'Прибула в депо',
    'Arrived at the depot': 'Прибула в депо', 
    'Arrived at the KIT': 'Прибула до КІТ',
    'Arrived at terminal': 'Прибула до терміналу',
    'Arrived at the terminal': 'Прибула до терміналу',
    
    // ✅ ДОСТАВКА
    'Delivered at parcel locker': 'Доставлено до поштомату',
    'Delivered at address': 'Доставлено за адресою',
    'Delivered': 'Доставлено',
    
    // ✅ СПЕЦІАЛЬНІ СТАТУСИ
    'Return': 'Повернення',
    'Returned': 'Повернуто'
};

// ✅ ТОЧНІ назви локацій з сайту Nova Poshta
const LOCATION_TERMS = {
    'parcel locker': 'поштомат',
    'depot': 'депо', 
    'terminal': 'термінал',
    'branch': 'відділення',
    'pickup point': 'пункт прийому',
    'address depot': 'депо',
    'KIT': 'КІТ',
    'warehouse': 'склад',
    
    // ✅ МІСТА - як на сайті
    'Kyiv': 'Київ',
    'Kiev': 'Київ', 
    'Lutsk': 'Луцьк',
    'Chernihiv': 'Чернігів',
    'Lviv': 'Львів',
    'Dnipro': 'Дніпро',
    'Kharkiv': 'Харків',
    'Odesa': 'Одеса',
    'Sumy': 'Суми',
    'urban villagе Sad': 'Сад' // ✅ ВИПРАВЛЕНО: коротко як на сайті
};

/**
 * Перекладає статус Nova Poshta ТОЧНО як на офіційному сайті
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

    // ✅ PATTERN-BASED переклади в порядку пріоритету
    let translated = englishStatus;

    translated = translated
        // ✅ МАЙБУТНІ ПОДІЇ (найвищий пріоритет)
        .replace(/^Will arrive at (.+)$/g, 'Прибуде до $1')
        .replace(/^Will leave from (.+)$/g, 'Виїде з $1')
        
        // ✅ ПОТОЧНІ/МИНУЛІ ПОДІЇ  
        .replace(/^Leaving the (.+)$/g, 'Виїхала з $1') // ✅ КЛЮЧОВЕ ВИПРАВЛЕННЯ
        .replace(/^Left the (.+)$/g, 'Виїхала з $1')
        .replace(/^Left (.+)$/g, 'Виїхала з $1')
        
        // Arrived patterns
        .replace(/^Arrived at the (.+)$/g, 'Прибула до $1')
        .replace(/^Arrived at (.+)$/g, 'Прибула до $1')
        
        // Delivered patterns
        .replace(/^Delivered at (.+)$/g, 'Доставлено до $1')
        
        // Accepted patterns  
        .replace(/^Accepted at (.+)$/g, 'Прийняли у $1')
        
        // Return patterns
        .replace(/^Return$/g, 'Повернення');

    // ✅ ЗАМІНА локацій та термінів
    Object.entries(LOCATION_TERMS).forEach(([english, ukrainian]) => {
        // Глобальна заміна для всіх входжень
        translated = translated.replace(new RegExp(english, 'gi'), ukrainian);
    });

    return translated;
}

/**
 * Перекладає локацію точно як на сайті Nova Poshta
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
        translated = translated.replace(new RegExp(english, 'gi'), ukrainian);
    });

    return translated;
}

/**
 * Додає новий переклад до словника
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