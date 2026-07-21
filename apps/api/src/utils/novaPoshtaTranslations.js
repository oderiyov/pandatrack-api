// apps/api/src/utils/novaPoshtaTranslations.js
// ✅ ПЕРЕПИСАНО: маппінг по eventType (стабільний машинний код), а не по тексту статусу.
// Nova Poshta повертає нестабільний текст (мішанина укр/англ), тому текстовий переклад
// ламався на кожному новому формулюванні. eventType не змінюється — це надійне джерело.

// ─────────────────────────────────────────────────────────────
// ГОЛОВНИЙ СЛОВНИК: eventType → український статус
// ─────────────────────────────────────────────────────────────
// Значення {location} у шаблоні підставляється з location події.
// Джерело: реальні eventType з Nova Poshta FullTracking API + стандартні коди.
const EVENT_TYPE_TRANSLATIONS = {
    // ── Створення / реєстрація ──
    'CreatedByRecipient': 'Відправник оформив посилку',
    'OrderCreated': 'Відправник оформив посилку',
    'ExpectedArrivalOnTheWarehouse': 'Очікується прибуття у відділення',
    'CreateID': 'Відправник оформив посилку',

    // ── Прийняття ──
    'ArrivalSenderWarehouse': 'Прийняли у відділенні',
    'ArrivalSenderPostomat': 'Прийнято в поштоматі',
    'Departure': 'Виїхала',
    'ArrivalSenderCityDeliveryService': 'Прибула до депо',
    'DepartureSenderCityDeliveryService': 'Виїхала з депо',
    'AcceptedAtBranch': 'Прийняли у відділенні',
    'ReceivedFromSender': 'Прийняли у відправника',

    // ── Відправлення з міста відправника ──
    'DepartureSenderWarehouse': 'Виїхала з відділення',
    'DepartureSenderCityTerminal': 'Виїхала з сортувального терміналу',
    'DepartureSenderCityDepot': 'Виїхала з депо',
    'ArrivalSenderCityTerminal': 'Прибула до сортувального терміналу',
    'ArrivalSenderCityDepot': 'Прибула до депо',

    // ── Митниця (міжнародні) ──
    'DeclarationAddedToManifest': 'Готується до передачі на митницю',
    'DeclarationArrivalCustomTerminal': 'Очікує митного оформлення',
    'DeclarationRequireCustomsClearance': 'Відправлення потребує митного оформлення',
    'DeclarationCustomClearanceIsCompleted': 'Митне оформлення завершено',
    'DeclarationSentToDestinationCountry': 'Митницю пройдено, в дорозі',
    'DeclarationCustomsInspection': 'Митний контроль',

    // ── Транзит / місто отримувача ──
    'ArrivalDestinationTerminal': 'Прибула до терміналу',
    'DepartureDestinationTerminal': 'Виїхала з терміналу',
    'ArrivalDestinationCityTerminal': 'Прибула до терміналу',
    'DepartureDestinationCityTerminal': 'Виїхала з терміналу',
    'ArrivalDestinationDepot': 'Прибула в депо',
    'DepartureDestinationDepot': 'Виїхала з депо',
    'ArrivalDestinationDeliveryService': 'Прибула в депо',
    'DepartureDestinationDeliveryService': 'Виїхала з депо',

    // ── Прибуття до місця видачі ──
    'ArrivalRecipientWarehouse': 'Прибула до відділення',
    'ArrivalRecipientPostomat': 'Прибула до поштомату',
    'ArrivalCargoInCity': 'Прибула у місто отримувача',

    // ── Доставка / вручення (ФІНАЛЬНІ статуси) ──
    'ReceivedWarehouse': 'Отримано',
    'ReceivedPostomat': 'Отримано з поштомату',
    'Received': 'Отримано',
    'Delivered': 'Доставлено',
    'CargoDelivered': 'Доставлено',

    // ── Повернення ──
    'ReturnCreated': 'Оформлено повернення',
    'ReturnDelivered': 'Повернення доставлено',
    'Return': 'Повернення',
};

// ─────────────────────────────────────────────────────────────
// eventType які означають ДОСТАВЛЕНО (фінальний успішний статус)
// Використовується для маркера "Доставлено" і розрахунку строків.
// ─────────────────────────────────────────────────────────────
const DELIVERED_EVENT_TYPES = new Set([
    'ReceivedWarehouse',
    'ReceivedPostomat',
    'Received',
    'Delivered',
    'CargoDelivered',
]);

// statusCode Nova Poshta які означають доставлено (додаткова перевірка)
const DELIVERED_STATUS_CODES = new Set(['9', '10', '11']);

// ─────────────────────────────────────────────────────────────
// FALLBACK: старий текстовий переклад для невідомих eventType
// ─────────────────────────────────────────────────────────────
const EXACT_TRANSLATIONS = {
    'Registered and being prepared': 'Відправник оформив посилку',
    'Accepted at branch': 'Прийняли у відділенні',
    'Accepted at pickup point': 'Прийнято у пункті прийому',
    'Left branch': 'Виїхала з відділення',
    'Left the terminal': 'Виїхала з терміналу',
    'Arrived at terminal': 'Прибула до терміналу',
    'Arrived at the terminal': 'Прибула до терміналу',
    'Delivered': 'Доставлено',
    'Received': 'Отримано',
};

const LOCATION_TERMS = {
    'parcel locker': 'поштомат',
    'sorting center': 'сортувальний термінал',
    'address depot': 'депо',
    'depot': 'депо',
    'terminal': 'термінал',
    'branch': 'відділення',
    'pickup point': 'пункт прийому',
    'KIT': 'КІТ',
    'warehouse': 'склад',
    'Kyiv': 'Київ',
    'Kiev': 'Київ',
    'Lutsk': 'Луцьк',
    'Chernihiv': 'Чернігів',
    'Lviv': 'Львів',
    'Dnipro': 'Дніпро',
    'Kharkiv': 'Харків',
    'Odesa': 'Одеса',
    'Sumy': 'Суми',
};

// ─────────────────────────────────────────────────────────────
// ОСНОВНА ФУНКЦІЯ: переклад по eventType з fallback на текст
// ─────────────────────────────────────────────────────────────
/**
 * @param {string} originalStatus - текст статусу від API (може бути англ/укр)
 * @param {string} eventType - машинний код події (напр. 'ReceivedWarehouse')
 * @returns {string} український статус
 */
function translateStatus(originalStatus, eventType) {
    // 1. Пріоритет — маппінг по eventType (надійний)
    if (eventType && EVENT_TYPE_TRANSLATIONS[eventType]) {
        return EVENT_TYPE_TRANSLATIONS[eventType];
    }

    // 2. Fallback — точний текстовий переклад
    if (originalStatus && EXACT_TRANSLATIONS[originalStatus]) {
        return EXACT_TRANSLATIONS[originalStatus];
    }

    // 3. Fallback — заміна англійських термінів локацій у тексті
    if (originalStatus && typeof originalStatus === 'string') {
        let translated = originalStatus;
        Object.entries(LOCATION_TERMS).forEach(([en, ua]) => {
            translated = translated.replace(new RegExp(en, 'gi'), ua);
        });
        // прибираємо типові англійські дієслова що лишились
        translated = translated
            .replace(/^Received at /i, 'Отримано в ')
            .replace(/^Arrived at /i, 'Прибула до ')
            .replace(/^Left /i, 'Виїхала з ')
            .replace(/^Departed /i, 'Виїхала з ');
        return translated;
    }

    return originalStatus || 'Статус оновлюється';
}

/**
 * @param {string} originalLocation
 * @returns {string}
 */
function translateLocation(originalLocation) {
    if (!originalLocation || typeof originalLocation !== 'string') {
        return originalLocation || '';
    }
    let translated = originalLocation;
    Object.entries(LOCATION_TERMS).forEach(([en, ua]) => {
        translated = translated.replace(new RegExp(en, 'gi'), ua);
    });
    return translated;
}

/**
 * Чи є подія доставкою (фінальний успішний статус)
 * @param {string} eventType
 * @param {string} statusCode
 * @returns {boolean}
 */
function isDeliveredEvent(eventType, statusCode) {
    if (eventType && DELIVERED_EVENT_TYPES.has(eventType)) return true;
    if (statusCode && DELIVERED_STATUS_CODES.has(String(statusCode))) return true;
    return false;
}

module.exports = {
    translateStatus,
    translateLocation,
    isDeliveredEvent,
    EVENT_TYPE_TRANSLATIONS,
    DELIVERED_EVENT_TYPES,
    DELIVERED_STATUS_CODES,
    LOCATION_TERMS,
};