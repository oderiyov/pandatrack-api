// apps/api/src/utils/meestTranslations.js

// Точні переклади статусів Meest Express
const EXACT_TRANSLATIONS = {
    // Базові статуси Meest
    'Accepted': 'Прийнято',
    'In Transit': 'В дорозі',
    'Out for Delivery': 'Доставляється',
    'Delivered': 'Доставлено',
    'Exception': 'Виняток',
    'Returned': 'Повернуто',
    'Cancelled': 'Скасовано',
    'At Warehouse': 'На складі',
    'At Pickup Point': 'У пункті видачі',
    'Ready for Pickup': 'Готово до отримання',
    
    // Детальні статуси відправлення
    'Package accepted by courier': 'Посилку прийнято кур\'єром',
    'Package picked up': 'Посилку забрано',
    'Shipment created': 'Відправлення створено',
    'Label printed': 'Етикетку надруковано',
    'Package processed at facility': 'Посилку оброблено на складі',
    'Package sorted': 'Посилку відсортовано',
    'Package loaded on vehicle': 'Посилку завантажено в транспорт',
    
    // В дорозі
    'In transit to destination': 'В дорозі до пункту призначення',
    'In transit to sorting facility': 'В дорозі до сортувального центру',
    'In transit to pickup point': 'В дорозі до пункту видачі',
    'Package in transit': 'Посилка в дорозі',
    'Shipment in transit': 'Відправлення в дорозі',
    'En route': 'В шляху',
    
    // Прибуття
    'Arrived at facility': 'Прибуло на склад',
    'Arrived at sorting facility': 'Прибуло до сортувального центру',
    'Arrived at destination facility': 'Прибуло до пункту призначення',
    'Arrived at pickup point': 'Прибуло до пункту видачі',
    'Arrived at delivery office': 'Прибуло до відділення доставки',
    'Package arrived': 'Посилка прибула',
    
    // Відправлення
    'Departed from facility': 'Виїхало зі складу',
    'Departed from sorting facility': 'Виїхало з сортувального центру',
    'Departed from origin': 'Виїхало з пункту відправлення',
    'Package departed': 'Посилка виїхала',
    'Left facility': 'Залишило склад',
    
    // Доставка
    'Out for delivery': 'Передано кур\'єру для доставки',
    'Package out for delivery': 'Посилка передана для доставки',
    'On delivery route': 'На маршруті доставки',
    'With delivery courier': 'У кур\'єра',
    'Delivery in progress': 'Доставка в процесі',
    'Delivery scheduled': 'Доставка заплановано',
    
    // Успішна доставка
    'Successfully delivered': 'Успішно доставлено',
    'Package delivered': 'Посилку доставлено',
    'Delivered to recipient': 'Доставлено одержувачу',
    'Delivered to address': 'Доставлено за адресою',
    'Handed over to recipient': 'Передано одержувачу',
    'Signed for by recipient': 'Підписано одержувачем',
    
    // Доставка до пункту видачі
    'Delivered to pickup point': 'Доставлено до пункту видачі',
    'Available for pickup': 'Готово до отримання',
    'Awaiting pickup': 'Очікує отримання',
    'Package ready for collection': 'Посилка готова до отримання',
    'At pickup location': 'У пункті самовивозу',
    
    // Проблеми з доставкою
    'Delivery attempt failed': 'Невдала спроба доставки',
    'Failed delivery attempt': 'Невдала спроба доставки',
    'Recipient not available': 'Одержувач недоступний',
    'Address not found': 'Адресу не знайдено',
    'Incorrect address': 'Неправильна адреса',
    'Delivery postponed': 'Доставку відкладено',
    'Redelivery scheduled': 'Повторну доставку заплановано',
    
    // Повернення
    'Return to sender': 'Повернення відправнику',
    'Returned to origin': 'Повернуто до пункту відправлення',
    'Return in progress': 'Повернення в процесі',
    'Package returned': 'Посилку повернуто',
    'Return delivery': 'Зворотна доставка',
    
    // Митниця та міжнародні відправлення
    'At customs': 'На митниці',
    'Customs clearance': 'Митне оформлення',
    'Customs processing': 'Митна обробка',
    'Released from customs': 'Випущено з митниці',
    'Held at customs': 'Затримано митницею',
    'Customs declaration required': 'Потрібна митна декларація',
    'Duty payment required': 'Потрібна сплата мита',
    
    // Міжнародні статуси
    'International departure': 'Міжнародний відправ',
    'International arrival': 'Міжнародне прибуття',
    'Export scan': 'Експортне сканування',
    'Import scan': 'Імпортне сканування',
    'Arrived in destination country': 'Прибуло до країни призначення',
    'Left origin country': 'Залишило країну відправлення',
    
    // Спеціальні статуси
    'Package damaged': 'Посилку пошкоджено',
    'Package lost': 'Посилку втрачено',
    'Investigation in progress': 'Розслідування в процесі',
    'Claim filed': 'Подано претензію',
    'Refund processed': 'Повернення коштів оброблено',
    'Insurance claim': 'Страхова претензія',
    
    // Статуси відміни та скасування
    'Shipment cancelled': 'Відправлення скасовано',
    'Pickup cancelled': 'Забір скасовано',
    'Delivery cancelled': 'Доставку скасовано',
    'Cancelled by sender': 'Скасовано відправником',
    'Cancelled by recipient': 'Скасовано одержувачем'
};

// Словник локацій та термінів
const LOCATION_TERMS = {
    'Facility': 'Склад',
    'Sorting Facility': 'Сортувальний центр',
    'Distribution Center': 'Центр розподілу',
    'Warehouse': 'Склад',
    'Pickup Point': 'Пункт видачі',
    'Delivery Office': 'Відділення доставки',
    'Post Office': 'Поштове відділення',
    'Depot': 'Депо',
    'Hub': 'Хаб',
    'Terminal': 'Термінал',
    
    // Міста України
    'Kyiv': 'Київ',
    'Kiev': 'Київ',
    'Kharkiv': 'Харків',
    'Lviv': 'Львів',
    'Dnipro': 'Дніпро',
    'Odesa': 'Одеса',
    'Zaporizhzhia': 'Запоріжжя',
    'Vinnytsia': 'Вінниця',
    'Poltava': 'Полтава',
    'Chernihiv': 'Чернігів',
    'Cherkasy': 'Черкаси',
    'Zhytomyr': 'Житомир',
    'Sumy': 'Суми',
    'Rivne': 'Рівне',
    'Khmelnytskyi': 'Хмельницький',
    'Ivano-Frankivsk': 'Івано-Франківськ',
    'Ternopil': 'Тернопіль',
    'Lutsk': 'Луцьк',
    'Uzhhorod': 'Ужгород',
    'Chernivtsi': 'Чернівці',
    'Mykolaiv': 'Миколаїв',
    'Kherson': 'Херсон',
    'Kramatorsk': 'Краматорськ',
    'Mariupol': 'Маріуполь',
    
    // Міжнародні локації
    'Poland': 'Польща',
    'Germany': 'Німеччина',
    'USA': 'США',
    'Canada': 'Канада',
    'United States': 'Сполучені Штати',
    'United Kingdom': 'Велика Британія',
    'France': 'Франція',
    'Italy': 'Італія',
    'Spain': 'Іспанія',
    'Netherlands': 'Нідерланди',
    'Belgium': 'Бельгія',
    'Czech Republic': 'Чехія',
    'Slovakia': 'Словаччина',
    'Hungary': 'Угорщина',
    'Romania': 'Румунія',
    'Bulgaria': 'Болгарія',
    'Lithuania': 'Литва',
    'Latvia': 'Латвія',
    'Estonia': 'Естонія'
};

/**
 * Перекладає статус Meest Express з англійської на українську
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

    // Pattern-based переклади для складних статусів
    let translated = englishStatus;

    translated = translated
        // Package patterns
        .replace(/^Package (.+)$/g, 'Посилку $1')
        .replace(/^Shipment (.+)$/g, 'Відправлення $1')
        
        // Arrived patterns
        .replace(/^Arrived at (.+)$/g, 'Прибуло до $1')
        .replace(/^Arrived in (.+)$/g, 'Прибуло до $1')
        
        // Departed patterns
        .replace(/^Departed from (.+)$/g, 'Виїхало з $1')
        .replace(/^Left (.+)$/g, 'Залишило $1')
        
        // Delivered patterns
        .replace(/^Delivered to (.+)$/g, 'Доставлено до $1')
        .replace(/^Delivered at (.+)$/g, 'Доставлено у $1')
        
        // In transit patterns
        .replace(/^In transit to (.+)$/g, 'В дорозі до $1')
        .replace(/^En route to (.+)$/g, 'В шляху до $1')
        
        // Processing patterns
        .replace(/^Processing at (.+)$/g, 'Обробка у $1')
        .replace(/^Processed at (.+)$/g, 'Оброблено у $1')
        
        // Failed patterns
        .replace(/^Failed (.+)$/g, 'Невдала $1')
        .replace(/^Unable to (.+)$/g, 'Неможливо $1');

    // Замінюємо терміни та локації
    Object.entries(LOCATION_TERMS).forEach(([english, ukrainian]) => {
        translated = translated.replace(new RegExp(english, 'gi'), ukrainian);
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