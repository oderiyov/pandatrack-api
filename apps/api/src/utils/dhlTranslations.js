// apps/api/src/utils/dhlTranslations.js - Українська локалізація статусів DHL
// Базується на статусах офіційної DHL документації

const statusTranslations = {
    // DHL Express статуси
    'Shipment information received': 'Дані вашої посилки отримані, тепер ви можете відстежити її',
    'Processed at': 'Посилка знаходиться в процесі обробки',
    'Arrived at DHL Sort Facility': 'Ваша посилка знаходиться в сортувальному центрі DHL',
    'The shipment has departed from a DHL Sort Facility': 'Посилка відправлена з сортувального центру DHL',
    'Arrived at DHL Delivery Facility': 'Посилка прибула на термінал доставки і чекає на повторну обробку перед відправкою одержувачу',
    'Customs clearance status updated': 'Статус митного оформлення оновлено',
    'Shipment picked up': 'Посилка скоро буде передана кур\'єру',
    'Shipment is on hold': 'Доставка затримується',
    'Shipment is out with courier for delivery': 'Посилка в процесі доставки до місця призначення',
    'Delivered': 'Доставлено',
    
    // Загальні статуси для всіх DHL сервісів
    'Pre-transit': 'Підготовка до відправки',
    'Transit': 'В дорозі',
    'In transit': 'В транзиті',
    'Out for delivery': 'Передано на доставку',
    'Delivery attempt': 'Спроба доставки',
    'Exception': 'Виняток в доставці',
    'Returned': 'Повертається',
    'Processed': 'Оброблено',
    'Picked up': 'Забрано',
    
    // DHL Global Mail/eCommerce статуси
    'Electronic notification received': 'Отримано електронне повідомлення',
    'Departed from origin country': 'Відправлено з країни походження',
    'Arrived at destination country': 'Прибуло до країни призначення',
    'Released by customs': 'Випущено митницею',
    'Processing at delivery facility': 'Обробка на складі доставки',
    'Available for pickup': 'Готово до отримання',
    
    // DHL Global Forwarding статуси
    'Shipment Delivered': 'Вантаж доставлено',
    'Gated out at Port/Terminal': 'Випущено з порту/терміналу',
    'Actual Vessel Arrival': 'Фактичне прибуття судна',
    'Actual Vessel Departure': 'Фактичне відправлення судна',
    'Consignee / Broker Notified': 'Одержувача/брокера повідомлено',
    'Export Customs Cleared': 'Експортне митне оформлення завершено',
    'Booking Confirmed to Customer': 'Бронювання підтверджено клієнту',
    'Customer Booking Received': 'Отримано бронювання від клієнта',
    'Shipment Entered into System': 'Вантаж внесено в систему',
    
    // Додаткові статуси
    'Sorting complete': 'Сортування завершено',
    'Departed facility': 'Покинув склад',
    'Arrived at facility': 'Прибув на склад',
    'With delivery courier': 'У кур\'єра на доставці',
    'Ready for collection': 'Готовий до отримання',
    'Collection arranged': 'Збір організовано',
    'Forwarded': 'Переслано далі',
    'Held for collection': 'Утримується для отримання',
    'Customs examination required': 'Потрібна митна перевірка',
    'Delivery postponed': 'Доставка відкладена',
    'Address correction required': 'Потрібне виправлення адреси',
    'Recipient not available': 'Одержувач недоступний',
    'Damaged': 'Пошкоджено',
    'Lost': 'Втрачено'
};

const locationTranslations = {
    // Країни
    'Germany': 'Німеччина',
    'China': 'Китай',
    'United States': 'Сполучені Штати',
    'United Kingdom': 'Великобританія',
    'France': 'Франція',
    'Netherlands': 'Нідерланди',
    'Poland': 'Польща',
    'Ukraine': 'Україна',
    
    // Міста
    'Beijing': 'Пекін',
    'Shanghai': 'Шанхай',
    'Hong Kong': 'Гонконг',
    'London': 'Лондон',
    'Frankfurt': 'Франкфурт',
    'Amsterdam': 'Амстердам',
    'Warsaw': 'Варшава',
    'Kyiv': 'Київ',
    'Kiev': 'Київ',
    
    // Типи об'єктів
    'Sort Facility': 'сортувальний центр',
    'Delivery Facility': 'центр доставки',
    'Distribution Center': 'центр розподілу',
    'Hub': 'хаб',
    'Terminal': 'термінал',
    'Warehouse': 'склад',
    'Depot': 'депо',
    'Port': 'порт',
    'Airport': 'аеропорт'
};

/**
 * Переклад статусу DHL українською мовою
 * @param {string} status - Оригінальний статус
 * @returns {string} - Перекладений статус
 */
function translateStatus(status) {
    if (!status) return 'Невідомий статус';
    
    // Точний збіг
    if (statusTranslations[status]) {
        return statusTranslations[status];
    }
    
    // Pattern-based переклади для динамічних статусів
    const statusLower = status.toLowerCase();
    
    // Пошук часткових збігів
    for (const [key, translation] of Object.entries(statusTranslations)) {
        if (statusLower.includes(key.toLowerCase())) {
            return translation;
        }
    }
    
    // Спеціальна обробка для складних статусів
    if (statusLower.includes('customs') && statusLower.includes('clearance')) {
        return 'Митне оформлення';
    }
    
    if (statusLower.includes('delivery') && statusLower.includes('attempt')) {
        return 'Спроба доставки';
    }
    
    if (statusLower.includes('out') && statusLower.includes('delivery')) {
        return 'Передано на доставку';
    }
    
    // Якщо вже українською - повертаємо як є
    if (containsUkrainian(status)) {
        return status;
    }
    
    // За замовчуванням повертаємо оригінал
    return status;
}

/**
 * Переклад локації українською мовою
 * @param {string} location - Оригінальна локація
 * @returns {string} - Перекладена локація
 */
function translateLocation(location) {
    if (!location) return '';
    
    let translatedLocation = location;
    
    // Переклад країн та міст
    for (const [eng, ukr] of Object.entries(locationTranslations)) {
        const regex = new RegExp(`\\b${eng}\\b`, 'gi');
        translatedLocation = translatedLocation.replace(regex, ukr);
    }
    
    return translatedLocation;
}

/**
 * Перевіряє чи містить рядок українські символи
 * @param {string} text - Текст для перевірки
 * @returns {boolean} - true якщо містить українські символи
 */
function containsUkrainian(text) {
    const ukrainianChars = /[іїєґ]/i;
    return ukrainianChars.test(text);
}

/**
 * Спеціальна обробка для різних типів DHL сервісів
 * @param {string} status - Статус
 * @param {string} serviceType - Тип сервісу (Express, eCommerce, Forwarding)
 * @returns {string} - Перекладений статус з урахуванням типу сервісу
 */
function translateStatusByService(status, serviceType) {
    const baseTranslation = translateStatus(status);
    
    // Додаткова контекстуалізація для різних сервісів
    if (serviceType === 'eCommerce/Global Mail') {
        if (status.includes('Electronic notification')) {
            return 'Створено електронну накладну (посилка ще не відправлена)';
        }
    }
    
    if (serviceType === 'Freight/Forwarding') {
        if (status.includes('Vessel')) {
            return baseTranslation + ' (морські перевезення)';
        }
    }
    
    return baseTranslation;
}

/**
 * Комбінована функція для повного перекладу з контекстом
 * @param {string} status - Статус
 * @param {string} location - Локація
 * @param {string} serviceType - Тип сервісу
 * @returns {object} - Об'єкт з перекладеними даними
 */
function translateDHLData(status, location, serviceType = '') {
    return {
        status: translateStatusByService(status, serviceType),
        location: translateLocation(location),
        serviceType: serviceType
    };
}

module.exports = {
    translateStatus,
    translateLocation,
    translateStatusByService,
    translateDHLData,
    statusTranslations,
    locationTranslations
};