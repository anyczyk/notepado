import React from 'react';
import LanguageFormList from "../parts/LanguageFormList";

const NotepadSaveLanguage: React.FC = () => {
    return (
        <div className="notepade-save-language-container">
            <h2>Languages</h2>
            <LanguageFormList />
        </div>
    );
};

export default NotepadSaveLanguage;