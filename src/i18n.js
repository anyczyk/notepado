// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationAM from './languages/am/translation.json';
import translationAR from './languages/ar/translation.json';
import translationARC from './languages/arc/translation.json';
import translationAZ from './languages/az/translation.json';
import translationBE from './languages/be/translation.json';
import translationBG from './languages/bg/translation.json';
import translationCKB from './languages/ckb/translation.json';
import translationCRS from './languages/crs/translation.json';
import translationCS from './languages/cs/translation.json';
import translationDA from './languages/da/translation.json';
import translationDE from './languages/de/translation.json';
import translationEL from './languages/el/translation.json';
import translationEN from './languages/en/translation.json';
import translationES from './languages/es/translation.json';
import translationET from './languages/et/translation.json';
import translationFA from './languages/fa/translation.json';
import translationFI from './languages/fi/translation.json';
import translationFR from './languages/fr/translation.json';
import translationHA from './languages/ha/translation.json';
import translationHAW from './languages/haw/translation.json';
import translationHE from './languages/he/translation.json';
import translationHI from './languages/hi/translation.json';
import translationHR from './languages/hr/translation.json';
import translationHT from './languages/ht/translation.json';
import translationHU from './languages/hu/translation.json';
import translationHY from './languages/hy/translation.json';
import translationID from './languages/id/translation.json';
import translationIG from './languages/ig/translation.json';
import translationIT from './languages/it/translation.json';
import translationJA from './languages/ja/translation.json';
import translationKA from './languages/ka/translation.json';
import translationKK from './languages/kk/translation.json';
import translationKL from './languages/kl/translation.json';
import translationKM from './languages/km/translation.json';
import translationKO from './languages/ko/translation.json';
import translationKS from './languages/ks/translation.json';
import translationKY from './languages/ky/translation.json';
import translationLN from './languages/ln/translation.json';
import translationLO from './languages/lo/translation.json';
import translationLT from './languages/lt/translation.json';
import translationLV from './languages/lv/translation.json';
import translationMI from './languages/mi/translation.json';
import translationMN from './languages/mn/translation.json';
import translationMS from './languages/ms/translation.json';
import translationNE from './languages/ne/translation.json';
import translationNL from './languages/nl/translation.json';
import translationNO from './languages/no/translation.json';
import translationPL from './languages/pl/translation.json';
import translationPS from './languages/ps/translation.json';
import translationPT from './languages/pt/translation.json';
import translationRO from './languages/ro/translation.json';
import translationRU from './languages/ru/translation.json';
import translationSD from './languages/sd/translation.json';
import translationSK from './languages/sk/translation.json';
import translationSL from './languages/sl/translation.json';
import translationSO from './languages/so/translation.json';
import translationSQ from './languages/sq/translation.json';
import translationSR from './languages/sr/translation.json';
import translationSV from './languages/sv/translation.json';
import translationSW from './languages/sw/translation.json';
import translationSYR from './languages/syr/translation.json';
import translationTG from './languages/tg/translation.json';
import translationTH from './languages/th/translation.json';
import translationTK from './languages/tk/translation.json';
import translationTL from './languages/tl/translation.json';
import translationTPI from './languages/tpi/translation.json';
import translationTR from './languages/tr/translation.json';
import translationUG from './languages/ug/translation.json';
import translationUK from './languages/uk/translation.json';
import translationUR from './languages/ur/translation.json';
import translationUZ from './languages/uz/translation.json';
import translationVI from './languages/vi/translation.json';
import translationWO from './languages/wo/translation.json';
import translationXH from './languages/xh/translation.json';
import translationYO from './languages/yo/translation.json';
import translationZH from './languages/zh/translation.json';
import translationZU from './languages/zu/translation.json';

const resources = {
    am: { translation: translationAM },
    ar: { translation: translationAR },
    arc: { translation: translationARC },
    az: { translation: translationAZ },
    be: { translation: translationBE },
    bg: { translation: translationBG },
    ckb: { translation: translationCKB },
    crs: { translation: translationCRS },
    cs: { translation: translationCS },
    da: { translation: translationDA },
    de: { translation: translationDE },
    el: { translation: translationEL },
    en: { translation: translationEN },
    es: { translation: translationES },
    et: { translation: translationET },
    fa: { translation: translationFA },
    fi: { translation: translationFI },
    fr: { translation: translationFR },
    ha: { translation: translationHA },
    haw: { translation: translationHAW },
    he: { translation: translationHE },
    hi: { translation: translationHI },
    hr: { translation: translationHR },
    ht: { translation: translationHT },
    hu: { translation: translationHU },
    hy: { translation: translationHY },
    id: { translation: translationID },
    ig: { translation: translationIG },
    it: { translation: translationIT },
    ja: { translation: translationJA },
    ka: { translation: translationKA },
    kk: { translation: translationKK },
    kl: { translation: translationKL },
    km: { translation: translationKM },
    ko: {translation: translationKO},
    ks: { translation: translationKS },
    ky: { translation: translationKY },
    ln: { translation: translationLN },
    lo: { translation: translationLO },
    lt: { translation: translationLT },
    lv: { translation: translationLV },
    mi: { translation: translationMI },
    mn: { translation: translationMN },
    ms: { translation: translationMS },
    ne: { translation: translationNE },
    nl: { translation: translationNL },
    no: { translation: translationNO },
    pl: { translation: translationPL },
    ps: { translation: translationPS },
    pt: { translation: translationPT },
    ro: { translation: translationRO },
    ru: { translation: translationRU },
    sd: { translation: translationSD },
    sk: { translation: translationSK },
    sl: { translation: translationSL },
    so: { translation: translationSO },
    sq: { translation: translationSQ },
    sr: { translation: translationSR },
    sv: { translation: translationSV },
    sw: { translation: translationSW },
    syr: { translation: translationSYR },
    tg: { translation: translationTG },
    th: { translation: translationTH },
    tk: { translation: translationTK },
    tl: { translation: translationTL },
    tpi: { translation: translationTPI },
    tr: { translation: translationTR },
    ug: { translation: translationUG },
    uk: { translation: translationUK },
    ur: { translation: translationUR },
    uz: { translation: translationUZ },
    vi: { translation: translationVI },
    wo: { translation: translationWO },
    xh: { translation: translationXH },
    yo: { translation: translationYO },
    zh: { translation: translationZH },
    zu: { translation: translationZU }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        supportedLngs: [
            'am', 'ar', 'arc', 'az', 'be', 'bg', 'ckb', 'crs', 'cs', 'da',
            'de', 'el', 'en', 'es', 'et', 'fa', 'fi', 'fr', 'ha', 'haw',
            'he', 'hi', 'hr', 'ht', 'hu', 'hy', 'id', 'ig', 'it', 'ja',
            'ka', 'kk', 'kl', 'km', 'ko', 'ks', 'ky', 'ln', 'lo', 'lt',
            'lv', 'mi', 'mn', 'ms', 'ne', 'nl', 'no', 'pl', 'ps',
            'pt', 'ro', 'ru', 'sd', 'sk', 'sl', 'so', 'sq', 'sr', 'sv',
            'sw', 'syr', 'tg', 'th', 'tk', 'tl', 'tpi', 'tr', 'ug', 'uk',
            'ur', 'uz', 'vi', 'wo', 'xh', 'yo', 'zh', 'zu'
        ],
        load: 'languageOnly',
        detection: {
            order: ['localStorage', 'cookie', 'navigator'],
            caches: ['localStorage', 'cookie']
        },
        interpolation: { escapeValue: false }
    });

export default i18n;
