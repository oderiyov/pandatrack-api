// apps/api/src/utils/ukrposhtaTranslations.js - ОЧИЩЕНА ВЕРСІЯ

const EXACT_TRANSLATIONS = {
    // === ОСНОВНІ СТАТУСИ ===
    // Створення та прийняття
    'Created online. Waiting acceptance': 'Створено онлайн. Очікує прийняття',
    'Created online': 'Створено онлайн',
    'Online created': 'Створено онлайн', 
    'Waiting acceptance': 'Очікує прийняття',
    'Pending acceptance': 'Очікує прийняття',
    'Awaiting acceptance': 'Очікує прийняття',
    'Item created online': 'Відправлення створено онлайн',
    'Shipment created': 'Відправлення створено',
    'Label created': 'Етикетка створена',
    'Ready for pickup by courier': 'Готово до забирання кур\'єром',
    'Pickup scheduled': 'Забирання заплановано',
    
    // Прийняття
    'Registered': 'Прийнято',
    'Accepted': 'Прийнято',
    'Acceptance': 'Приймання',
    'Item accepted': 'Відправлення прийнято',
    'Accepted at Branch': 'Прийнято у Відділенні',
    'Accepted for processing': 'Прийнято до обробки',
    'Item received': 'Відправлення прийнято',
    'Acceptance canceled': 'Приймання скасовано',
    'Deleted by client': 'Видалено клієнтом',
    
    // === ЗМІШАНІ АНГЛО-УКРАЇНСЬКІ СТАТУСИ (з вашого API) ===
    'Arrived to the Логістичний центр': 'Прибуло до Логістичного центру',
    'Виїхало з the Логістичний центр': 'Виїхало з Логістичного центру',
    'Виїхало з the Відділення': 'Виїхало з Відділення',
    'Arrived to the Відділення': 'Прибуло до Відділення',
    'Arrived to the Logistics center': 'Прибуло до Логістичного центру',
    'Departed from the Logistics center': 'Виїхало з Логістичного центру',
    'Arrived to the Branch': 'Прибуло до Відділення',
    'Departed from the Branch': 'Виїхало з Відділення',
    
    // === РУХ ПОСИЛОК ===
    // Прибуття
    'Arrived at Branch': 'Прибуло до Відділення',
    'Arrived at Sorting depot': 'Прибуло до Сортувального депо',
    'Arrived at Logistics center': 'Прибуло до Логістичного центру',
    'Arrived at Distribution center': 'Прибуло до Центру розподілу',
    'Arrived at Processing center': 'Прибуло до Центру обробки',
    'Arrived at Post office': 'Прибуло до Поштового відділення',
    'Arrival at sorting center': 'Прибуло до сортувального центру',
    'Arrival at logistics center': 'Надходження до логістичного центру',
    
    // Відправка
    'Departed from Branch': 'Виїхало з Відділення',
    'Departed from Sorting depot': 'Виїхало з Сортувального депо',
    'Departed from Logistics center': 'Виїхало з Логістичного центру',
    'Departed from Distribution center': 'Виїхало з Центру розподілу',
    'Departed from Processing center': 'Виїхало з Центру обробки',
    'Departed from Post office': 'Виїхало з Поштового відділення',
    'Departure from sorting center': 'Відправлення з сортувального центру',
    'Departure from logistics center': 'Відправлення з логістичного центру',
    
    // Транзит
    'In transit': 'В дорозі',
    'Sorting': 'Сортування', 
    'Processing': 'Обробка',
    'On the way': 'У дорозі',
    'Forwarded': 'Переслано',
    
    // === ДОСТАВКА ===
    'Delivered to Recipient': 'Вручено Одержувачу',
    'Delivered': 'Вручено',
    'Item delivered': 'Відправлення доставлено',
    'Handed over to recipient': 'Передано одержувачу',
    'Handed to recipient': 'Передано одержувачу',
    'Released': 'Видано',
    'Delivered to recipient': 'Доставлено одержувачу',
    'Final delivery': 'Кінцева доставка',
    
    // Готовність до видачі
    'Ready for pickup': 'Готово до видачі',
    'At delivery office': 'У відділенні доставки',
    'Available for pickup': 'Доступно для отримання',
    'Awaiting pickup': 'Очікує видачі',
    'Item ready for pickup': 'Відправлення готове до видачі',
    'At pickup point': 'У пункті видачі',
    
    // Спроби доставки
    'Out for delivery': 'Передано на доставку',
    'Item out for delivery': 'Відправлено на доставку',
    'Delivery attempt': 'Спроба доставки',
    'Unsuccessful delivery attempt': 'Невдала спроба доставки',
    'Delivery failed': 'Доставка не вдалася',
    'Failed delivery': 'Доставка не вдалася',
    'Delivery failed - no answer': 'Доставка не вдалася - немає відповіді',
    'Delivery failed - incorrect address': 'Доставка не вдалася - неправильна адреса',
    'Second delivery attempt': 'Друга спроба доставки',
    'Final delivery attempt': 'Остання спроба доставки',
    'Notice left': 'Залишено повідомлення',
    'Pickup notice sent': 'Надіслано повідомлення про отримання',
    
    // === ПРОБЛЕМИ ТА ВИНЯТКИ ===
    'Exception': 'Виняток',
    'Delivery exception': 'Виняток доставки',
    'Processing exception': 'Виняток обробки',
    'Address issue': 'Проблема з адресою',
    'Address unknown': 'Адреса невідома',
    'Recipient not found': 'Одержувача не знайдено',
    'Refused': 'Відмова від отримання',
    'Refused by recipient': 'Відмова одержувача',
    'Storage time expired': 'Термін зберігання закінчився',
    
    // Повернення
    'Return': 'Повернення',
    'Returned': 'Повернуто',
    'Returning to sender': 'Повертається відправнику',
    'Return to sender': 'Повернення відправнику',
    'Item returned': 'Відправлення повернено',
    'Returning': 'Повертається',
    'Return processing': 'Обробка повернення',
    
    // Пересилка
    'Forwarding': 'Пересилка',
    'Redirected': 'Перенаправлено',
    'Address changed': 'Адреса змінена',
    
    // === ЗБЕРІГАННЯ ===
    'Storage': 'На зберіганні',
    'In storage': 'На зберіганні',
    'Awaiting collection': 'Очікує забирання',
    'Sent to delivery office': 'Відправлено до відділення доставки',
    'Dispatched to branch': 'Відправлено до відділення',
    
    // === МИТНИЦЯ ===
    'At customs': 'На митниці',
    'Customs clearance': 'Митне оформлення',
    'Released from customs': 'Випущено з митниці',
    'Customs processing': 'Митна обробка',
    'Transmission for customs control': 'Передано для митного контролю',
    'Released from customs for further delivery': 'Випущено з митниці для доставки',
    'Item tendered to Customs': 'Передано до митниці',
    'Held in Customs': 'Затримано митницею',
    'Item presented to import Customs': 'Відправлення подано до імпортної митниці',
    'Customs clearance processing complete': 'Митне оформлення завершено',
    'Released from import Customs': 'Випущено з імпортної митниці',
    
    // === МІЖНАРОДНІ СТАТУСИ UPU ===
    'Acceptance ': 'Відправлення прийняте',
    'Arrival at outward office of exchange ': 'Прибуло до установи обміну відправлення',
    'Arrival at outward office of exchange': 'Прибуло до установи обміну відправлення',
    'Departure from outward office of exchange ': 'Виїхало з установи обміну відправлення',
    'Departure from outward office of exchange': 'Виїхало з установи обміну відправлення',
    'Arrival at inward office of exchange': 'Прибуло до установи обміну призначення',
    'Departure from inward office of exchange': 'Виїхало з установи обміну призначення',
    'Left country of origin': 'Залишило країну відправлення',
    'Arrived in destination country': 'Прибуло до країни призначення',
    'International transit': 'Міжнародний транзит',
    'International item has left originating country': 'Міжнародне відправлення залишило країну походження',
    'International item arrived in destination country': 'Міжнародне відправлення прибуло до країни призначення',
    
    // === УКРАЇНСЬКІ СТАТУСИ (УЖЕ ПЕРЕКЛАДЕНІ) ===
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
    'Передано на зберігання': 'На зберіганні',
    
    // === НОВІ СТАТУСИ 2025 ===
    'Online registration': 'Онлайн реєстрація',
    'Electronic manifest': 'Електронний маніфест',  
    'Digital tracking': 'Цифрове відстеження',
    'Mobile pickup': 'Мобільне забирання',
    'Contactless delivery': 'Безконтактна доставка',
    'Safe delivery': 'Безпечна доставка',
    'Locker delivery': 'Доставка до поштомату',
    'Self-service pickup': 'Самообслуговування',
    'Quarantine processing': 'Карантинна обробка',
    'Safety protocols applied': 'Застосовано протоколи безпеки',
    'Delayed due to restrictions': 'Затримано через обмеження',
    'Service temporarily suspended': 'Сервіс тимчасово призупинено'
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
    
    // Міста
    'Kyiv': 'Київ',
    'Kiev': 'Київ',
    'Kharkiv': 'Харків',
    'Lviv': 'Львів',
    'Dnipro': 'Дніпро',
    'Odesa': 'Одеса',
    'Zaporizhzhia': 'Запоріжжя',
    'Vinnytsia': 'Вінниця',
    'Bila Tserkva': 'Біла Церква',
    'White Church': 'Біла Церква',
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
    
    // Скорочення відділень
    'ДКД': 'Депо комплексної доставки',
    'ДОПП': 'Депо обробки поштових посилок',
    'ЦЕХОП': 'Центр експедиції та обробки поштових відправлень',
    'ЦОКК': 'Центр обробки комплексної кореспонденції'
};

/**
 * Перекладає статус Укрпошти з англійської на українську
 * @param {string} status - Статус (англійською або українською)
 * @returns {string} Переклад українською або оригінал якщо уже українською
 */
function translateStatus(status) {
    if (!status || typeof status !== 'string') {
        return status || 'Невідомий статус';
    }

    const cleanStatus = status.trim();
    
    // Якщо точний переклад існує - використовуємо його
    if (EXACT_TRANSLATIONS[cleanStatus]) {
        return EXACT_TRANSLATIONS[cleanStatus];
    }

    // Pattern-based переклади для складних статусів
    let translated = cleanStatus;

    translated = translated
        // Змішані статуси
        .replace(/Виїхало з the (.+)/g, 'Виїхало з $1')
        .replace(/Arrived to the (.+)/g, 'Прибуло до $1')
        .replace(/Departed from the (.+)/g, 'Виїхало з $1')
        
        // Заміна термінів
        .replace(/Logistics center/gi, 'Логістичного центру')
        .replace(/Логістичний центр/gi, 'Логістичного центру')
        .replace(/Branch/gi, 'Відділення')
        .replace(/Sorting depot/gi, 'Сортувального депо')
        .replace(/Distribution center/gi, 'Центру розподілу')
        .replace(/Processing center/gi, 'Центру обробки')
        .replace(/Post office/gi, 'Поштового відділення')
        
        // Patterns
        .replace(/^Arrived at (.+)$/g, 'Прибуло до $1')
        .replace(/^Arrived in (.+)$/g, 'Прибуло до $1')
        .replace(/^Arrived to (.+)$/g, 'Прибуло до $1')
        .replace(/^Departed from (.+)$/g, 'Виїхало з $1')
        .replace(/^Left (.+)$/g, 'Залишило $1')
        .replace(/^Delivered to (.+)$/g, 'Доставлено до $1')
        .replace(/^Delivered at (.+)$/g, 'Доставлено у $1')
        .replace(/^Accepted at (.+)$/g, 'Прийнято у $1')
        .replace(/^Accepted in (.+)$/g, 'Прийнято у $1');

    // Замінюємо локації
    Object.entries(LOCATION_TERMS).forEach(([english, ukrainian]) => {
        translated = translated.replace(new RegExp(english, 'gi'), ukrainian);
    });

    return translated;
}

/**
 * Перекладає локацію
 */
function translateLocation(location) {
    if (!location || typeof location !== 'string') {
        return location || 'Невідоме місце';
    }

    let translated = location;

    Object.entries(LOCATION_TERMS).forEach(([english, ukrainian]) => {
        translated = translated.replace(new RegExp(english, 'gi'), ukrainian);
    });

    return translated;
}

module.exports = {
    translateStatus,
    translateLocation,
    EXACT_TRANSLATIONS,
    LOCATION_TERMS
};