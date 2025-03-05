// NotepadoContext.tsx
import React, {createContext, useState, useEffect, useCallback, ChangeEvent} from 'react';
import {FormData} from "../components/elements/functions";

const rtlLangs = ["ug", "syr", "ks", "ar", "fa", "he", "ur", "ckb", "arc", "sd", "ps"];
const rtlCodeLangs = ["ug-CN", "syr-SY", "ks-IN", "ar-SA", "fa-IR", "he-IL", "ur-PK", "ckb-IQ", "arc-IQ", "sd-PK", "ps-AF"];

const languageMap = {
    "ar-SA": "العربية",
    "bg-BG": "български",
    "bn-BD": "বাংলা",
    "cs-CZ": "čeština",
    "da-DK": "dansk",
    "de-DE": "Deutsch",
    "el-GR": "Ελληνικά",
    "en-GB": "English",
    "en-US": "English",
    "es-ES": "Español",
    "es-US": "Español (Estados Unidos)",
    "es-MX": "Español",
    "et-EE": "eesti keel",
    "fa-IR": "فارسی",
    "fi-FI": "suomi",
    "fr-FR": "Français",
    "he-IL": "עברית",
    "hi-IN": "हिन्दी",
    "hr-HR": "hrvatski",
    "hu-HU": "magyar",
    "id-ID": "Bahasa Indonesia",
    "it-IT": "Italiano",
    "ja-JP": "日本語",
    "ko-KR": "한국어",
    "lt-LT": "lietuvių kalba",
    "lv-LV": "latviešu valoda",
    "mr-IN": "मराठी",
    "ms-MY": "Bahasa Melayu",
    "nl-NL": "Nederlands",
    "no-NO": "norsk",
    "pl-PL": "Polski",
    "pt-BR": "Português",
    "pt-PT": "Português",
    "ro-RO": "Română",
    "ru-RU": "Русский",
    "sk-SK": "slovenčina",
    "sl-SI": "slovenščina",
    "sv-SE": "svenska",
    "ta-IN": "தமிழ்",
    "te-IN": "తెలుగు",
    "th-TH": "ไทย",
    "tr-TR": "Türkçe",
    "uk-UA": "українська",
    "vi-VN": "Tiếng Việt",
    "zh-CN": "中文 (简体)",
    "zh-HK": "中文 (香港)",
    "zh-TW": "中文 (繁體)"
};

export const NotepadoContext = createContext(undefined);

export const NotepadoProvider = ({ children }) => {
    const [items, setItems] = useState<FormData[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [dirAttribute, setDirAttribute] = useState('ltr');
    const [visibleDescriptions, setVisibleDescriptions] = useState<string | null>(null);
    const [isDescriptionVisible, setIsDescriptionVisible] = useState(false);
    const [selectSort, setSelectSort] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [activePage, setActivePage] = useState<string>(() => {
        // Determine initial page based on the URL path
        const path = window.location.pathname;
        if (path === '/notepadSave') return 'notepadSave';
        if (path === '/settings') return 'settings';
        return ''; // Default to Homepage
    });

    const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };
    const updatePage = (page: string, url: string) => {
        setActivePage(page);
        window.history.pushState({ page }, '', url);
    };

    // Handlers to set the active page
    const loadNotepadSave = () => updatePage('', '/');

    const loadNotepadSaveLanguage = () => updatePage('settings', '/settings');

    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            const path = window.location.pathname;
            if (path === '/settings') setActivePage('settings');
            else setActivePage('');
        };

        window.addEventListener('popstate', handlePopState);

        // Cleanup event listener on component unmount
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);


    return (
        <NotepadoContext.Provider value={{
            items, setItems,
            dirAttribute, setDirAttribute,
            selectSort, setSelectSort,
            handleSearchChange,
            searchTerm, setSearchTerm,
            showSearch, setShowSearch,
            visibleDescriptions, setVisibleDescriptions,
            isDescriptionVisible, setIsDescriptionVisible,
            activePage, setActivePage,
            loadNotepadSave,
            loadNotepadSaveLanguage,
            rtlLangs,
            rtlCodeLangs,
            languageMap
        }}>
            {children}
        </NotepadoContext.Provider>
    );
};
