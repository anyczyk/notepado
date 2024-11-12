// NavButtons.tsx
import React, { ChangeEvent } from 'react';

interface NavButtonsProps {
    handleAddNewItem: () => void;
    currentTranslations: any;
    handleCopyIndexedDB: () => void;
    handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

const NavButtons: React.FC<NavButtonsProps> = ({handleAddNewItem, currentTranslations, handleCopyIndexedDB, handleFileChange,}) => {
    return (
        <div>
            <button
                title={currentTranslations.addNewNote}
                className="notepad-add-new-note notepad-add-new-note--fixed"
                onClick={handleAddNewItem}
            >
                <i className="icon-plus-circle"></i>
            </button>
            <div className="notepad-submenu">
                <button
                    title={currentTranslations.addNewNote}
                    className="notepad-add-new-note"
                    onClick={handleAddNewItem}
                >
                    <i className="icon-plus-circle"></i>
                    {currentTranslations.addNewNote}
                </button>
                <button className="notepad-copy-json" onClick={handleCopyIndexedDB}>
                    Copy json note
                </button>
                <button
                    className="notepad-import"
                    onClick={() => document.getElementById('import-file-input')?.click()}
                >
                    Import note
                </button>
            </div>
            <input
                type="file"
                id="import-file-input"
                accept="application/json"
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />
        </div>
    );
};

export default NavButtons;
