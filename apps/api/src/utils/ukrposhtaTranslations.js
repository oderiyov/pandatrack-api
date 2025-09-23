// apps/api/src/utils/ukrposhtaTranslations.js

// Точні переклади статусів Укрпошти
const EXACT_TRANSLATIONS = {
    // Доставка
    'Delivered to Recipient': 'Вручено Одержувачу',
    'Delivered': 'Вручено',
    'Handed over to recipient': 'Передано одержувачу',
    
    // ДОДАНО: Проблемні статуси з вашого API
    'Registered': 'Прийнято',
    'Arrived to the Логістичний центр': 'Прибуло до Логістичного центру',
    'Виїхало з the Логістичний центр': 'Виїхало з Логістичного центру',
    'Виїхало з the Відділення': 'Виїхало з Відділення',
    'Arrived to the Відділення': 'Прибуло до Відділення',
    
    // ДОДАНО: Всі варіації змішаних статусів
    'Arrived to the Logistics center': 'Прибуло до Логістичного центру',
    'Departed from the Logistics center': 'Виїхало з Логістичного центру',
    'Arrived to the Branch': 'Прибуло до Відділення',
    'Departed from the Branch': 'Виїхало з Відділення',
    
    // Прибуття
    'Arrived at Branch': 'Прибуло до Відділення',
    'Arrived at Sorting depot': 'Прибуло до Сортувального депо',
    'Arrived at Logistics center': 'Прибуло до Логістичного центру',
    'Arrived at Distribution center': 'Прибуло до Центру розподілу',
    'Arrived at Processing center': 'Прибуло до Центру обробки',
    'Arrived at Post office': 'Прибуло до Поштового відділення',
    
    // Відправка
    'Departed from Branch': 'Виїхало з Відділення',
    'Departed from Sorting depot': 'Виїхало з Сортувального депо',
    'Departed from Logistics center': 'Виїхало з Логістичного центру',
    'Departed from Distribution center': 'Виїхало з Центру розподілу',
    'Departed from Processing center': 'Виїхало з Центру обробки',
    'Departed from Post office': 'Виїхало з Поштового відділення',
    
    // Прийняття
    'Accepted': 'Прийнято',
    'Accepted at Branch': 'Прийнято у Відділенні',
    'Accepted for processing': 'Прийнято до обробки',
    'Item received': 'Відправлення прийнято',
    
    // В дорозі
    'In transit': 'В дорозі',
    'Sorting': 'Сортування', 
    'Processing': 'Обробка',
    'On the way': 'У дорозі',
    'Forwarded': 'Пересланo',
    
    // Митниця
    'At customs': 'На митниці',
    'Customs clearance': 'Митне оформлення',
    'Released from customs': 'Випущено з митниці',
    'Customs processing': 'Митна обробка',
    
    // Проблеми
    'Exception': 'Виняток',
    'Returned': 'Повернуто',
    'Returned to sender': 'Повернуто відправнику',
    'Refused': 'Відмова від отримання',
    'Address unknown': 'Адреса невідома',
    'Recipient not found': 'Одержувача не знайдено',
    'Storage time expired': 'Термін зберігання закінчився',
    
    // Очікування
    'Awaiting pickup': 'Очікує отримання',
    'Ready for pickup': 'Готово до отримання',
    'Notification sent': 'Надіслано сповіщення',
    
    // Міжнародні
    'Left country of origin': 'Залишило країну відправлення',
    'Arrived in destination country': 'Прибуло до країни призначення',
    'International transit': 'Міжнародний транзит',
    
    // З документації Укрпошти (реальні статуси)
    'Приймання': 'Прийнято',
    'Надходження': 'Надходження до центру',
    'Відправлення': 'Відправлення з центру',
    'Надходження до відділення зв\'язку': 'Прибуло до відділення',
    'Відправлення до відділеня зв\'язку': 'Відправлено до відділення',
    'Вручення': 'Вручено',
    'Відправлення вручено': 'Вручено',
    'Відправлення вручено: відправнику': 'Повернуто відправнику',
    'Надходження на сортувальний центр': 'Прибуло до сортувального центру',
    'Відправлено до точки видачі/доставки': 'Відправлено до пункту видачі',
    'Відправлення у точці видачі/доставки': 'У пункті видачі',
    'Відправлення не вручено під час доставки': 'Невдала спроба доставки',
    'Повернення відправлення': 'Повернення',
    'Відправлення перенаправлене до іншого відділення': 'Перенаправлено',
    'Невдала спроба вручення (передача на зберігання)': 'Передано на зберігання',
    'Прийом скасовано': 'Прийом скасовано',
    'Передано на зберігання': 'На зберіганні'
};

// Словник локацій та термінів
const LOCATION_TERMS = {
    'City': 'м.',
    'Post office': 'Поштове відділення',
    'Branch': 'Відділення',
    'Sorting depot': 'Сортувальне депо',
    'Logistics center': 'Логістичний центр', 
    'Distribution center': 'Центр розподілу',
    'Processing center': 'Центр обробки',
    
    // Міста (англійською → українською)
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
    'Sloviansk': 'Слов\'янськ',
    
    // Скорочення відділень Укрпошти
    'ДКД': 'Депо комплексної доставки',
    'ДОПП': 'Депо обробки поштових посилок',
    'ЦЕХОП': 'Центр експедиції та обробки поштових відправлень',
    'ЦОКК': 'Центр обробки комплексної кореспонденції'
};

/**
 * Перекладає статус Укрпошти з англійської на українську
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

    // ДОДАНО: Спеціальна обробка змішаних англо-українських статусів
    translated = translated
        // Фікси для змішаних статусів з вашого API
        .replace(/Виїхало з the (.+)/g, 'Виїхало з $1')
        .replace(/Arrived to the (.+)/g, 'Прибуло до $1')
        .replace(/Departed from the (.+)/g, 'Виїхало з $1')
        
        // Заміна конкретних англійських термінів
        .replace(/Logistics center/gi, 'Логістичного центру')
        .replace(/Логістичний центр/gi, 'Логістичного центру')
        .replace(/Branch/gi, 'Відділення')  
        .replace(/Відділення/gi, 'Відділення')
        .replace(/Sorting depot/gi, 'Сортувального депо')
        .replace(/Distribution center/gi, 'Центру розподілу')
        .replace(/Processing center/gi, 'Центру обробки')
        .replace(/Post office/gi, 'Поштового відділення')
        
        // Registered -> Прийнято
        .replace(/^Registered$/gi, 'Прийнято')
        
        // Стандартні patterns
        .replace(/^Arrived at (.+)$/g, 'Прибуло до $1')
        .replace(/^Arrived in (.+)$/g, 'Прибуло до $1')
        .replace(/^Arrived to (.+)$/g, 'Прибуло до $1')
        
        // Departed patterns  
        .replace(/^Departed from (.+)$/g, 'Виїхало з $1')
        .replace(/^Left (.+)$/g, 'Залишило $1')
        
        // Delivered patterns
        .replace(/^Delivered to (.+)$/g, 'Доставлено до $1')
        .replace(/^Delivered at (.+)$/g, 'Доставлено у $1')
        
        // Accepted patterns
        .replace(/^Accepted at (.+)$/g, 'Прийнято у $1')
        .replace(/^Accepted in (.+)$/g, 'Прийнято у $1');

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