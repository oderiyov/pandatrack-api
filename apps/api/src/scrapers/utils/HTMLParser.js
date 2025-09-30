// apps/api/src/scrapers/utils/HTMLParser.js

const cheerio = require('cheerio');

/**
 * HTML parsing utilities wrapper для cheerio
 */
class HTMLParser {
    static parse(html) {
        return cheerio.load(html, {
            normalizeWhitespace: true,
            decodeEntities: true
        });
    }

    static getText($, selector, parent = null) {
        const element = parent ? parent.find(selector) : $(selector);
        const text = element.text().trim();
        return text.replace(/\s+/g, ' ');
    }

    static getAttribute($, selector, attribute) {
        return $(selector).attr(attribute);
    }

    static getAll($, selector) {
        return $(selector).toArray().map(el => $(el));
    }

    static exists($, selector) {
        return $(selector).length > 0;
    }

    static getDataAttributes($, selector) {
        const element = $(selector);
        const data = {};
        
        const attributes = element.attr();
        if (attributes) {
            Object.keys(attributes).forEach(key => {
                if (key.startsWith('data-')) {
                    data[key.replace('data-', '')] = attributes[key];
                }
            });
        }
        
        return data;
    }

    static extractTable($, tableSelector) {
        const rows = [];
        
        $(`${tableSelector} tr`).each((i, row) => {
            const cells = [];
            $(row).find('td, th').each((j, cell) => {
                cells.push($(cell).text().trim());
            });
            if (cells.length > 0) {
                rows.push(cells);
            }
        });
        
        return rows;
    }

    static cleanText(text) {
        if (!text) return '';
        
        return text
            .replace(/\s+/g, ' ')
            .replace(/\n+/g, ' ')
            .trim();
    }

    static extractJSON($, selector) {
        const scriptContent = $(selector).html();
        if (!scriptContent) return null;
        
        try {
            const jsonMatch = scriptContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (error) {
            console.error('Failed to parse JSON from script:', error.message);
        }
        
        return null;
    }
}

module.exports = HTMLParser;