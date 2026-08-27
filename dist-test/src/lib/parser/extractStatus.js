"use strict";
/**
 * extractStatus — extract status from notification text (Bagian 3.6).
 * Priority: first match wins.
 * Default: "pending" + perlu_review=true if nothing found.
 * Updated with expanded keywords for Fase 2.3.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractStatus = extractStatus;
const keywords_1 = require("./keywords");
function extractStatus(text) {
    const lower = text.toLowerCase();
    for (const [status, keywords] of Object.entries(keywords_1.STATUS_KEYWORDS)) {
        for (const kw of keywords) {
            if (lower.includes(kw)) {
                return status;
            }
        }
    }
    return "pending";
}
