import React, { useState, useEffect } from 'react';
import { translations } from '../elements/notepadSaveTranslations';

const LanguageFormList: React.FC = () => {
    const [language, setLanguage] = useState('en');

    useEffect(() => {
        const savedLanguage = localStorage.getItem('notepadSaveLanguage');
        if (savedLanguage) {
            setLanguage(savedLanguage);
        }
    }, []);

    const currentTranslations = translations[language] || translations.en;

    const languageNames: Record<string, string> = {
        en: 'English',
        pl: 'Polski',
        id: 'Bahasa Indonesia',
    };

    const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedLanguage = event.target.value;
        setLanguage(selectedLanguage);
        localStorage.setItem('notepadSaveLanguage', selectedLanguage);
    };

    return (
        <>
            <p>
                {currentTranslations.currentLanguage}: <strong>{languageNames[language]}</strong>
            </p>
            <select size={5} value={language} onChange={handleLanguageChange}>
                <option value="en">English</option>
                <option value="pl">Polski</option>
                <option value="id">Bahasa Indonesia</option>
            </select>
        </>
    );
};

export default LanguageFormList;