// NavButtons.tsx

import React, { ChangeEvent, useContext, useState } from 'react';
import { NotepadoContext } from "../../context/NotepadoContext";
import { useTranslation } from 'react-i18next';

interface NavButtonsProps {
    filteredItems: any[];
    handleAddNewItemAll: () => void;
    handleCopyIndexedDB: () => void;
    handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;

    // Zarządzanie zaznaczeniami:
    selectedCount: number;
    areAllSelected: boolean;
    onSelectAllToggle: () => void;
    onSelectAction: (action: string) => void;
}

const NavButtons: React.FC<NavButtonsProps> = ({
                                                   filteredItems,
                                                   handleAddNewItemAll,
                                                   handleCopyIndexedDB,
                                                   handleFileChange,
                                                   selectedCount,
                                                   areAllSelected,
                                                   onSelectAllToggle,
                                                   onSelectAction
                                               }) => {
    const { t } = useTranslation();
    const {
        selectSort, setSelectSort,
    } = useContext(NotepadoContext);

    const [selectValue, setSelectValue] = useState<string>("");

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const action = e.target.value;
        if (action !== "action") {
            onSelectAction(action);
            // Nie resetujemy selectedIds, jedynie przywracamy domyślną opcję selecta
            setSelectValue("action");
        }
    };

    return (
        <>
            <div className="o-sub-buttons">
                <div className="o-submenu">
                    <button
                        title={t('add')}
                        className="o-btn--icon o-circle-btn"
                        onClick={handleAddNewItemAll}
                    >
                        <i className="icon-plus-circle"></i>
                        <span>{t('add')}</span>
                    </button>

                    {/*<button className="o-copy-json" onClick={handleCopyIndexedDB}>*/}
                    {/*    {t('copy')}*/}
                    {/*</button>*/}

                    <button
                        className="o-btn--icon o-import"
                        onClick={() => document.getElementById('import-file-input')?.click()}
                    >
                        <i className="icon-download" />
                        <span>{t('import')}</span>
                    </button>

                    {/*<button className="o-export">*/}
                    {/*    {t('export')}*/}
                    {/*</button>*/}


                    {(filteredItems.length > 0) && <>

                        <button
                            className={`o-btn--icon o-sort ${selectSort ? 'o-bg-dark-gray' : ''}`}
                            onClick={() => {
                                setSelectSort(prevState => !prevState);
                            }}
                        >
                            <i className={selectSort ? 'icon-cancel' : 'icon-down-open'}/>
                            <span>{t('sortuj')}</span>
                        </button>

                        {/* Select pojawia się tylko, jeśli jest cokolwiek zaznaczone */}
                        {selectedCount > 0 && (
                            <select
                                className="ml-auto o-bg-dark-gray"
                                value={selectValue || "action"}
                                onChange={handleSelectChange}
                            >
                                <option value="action">-- Akcja --</option>
                                <option value="export-checked">Exportuj</option>
                                <option value="copy-checked">Kopiuj</option>
                                <option value="remove-checked">Usuń</option>
                            </select>
                        )}
                        <button className={`ml-auto o-btn--checked-all ${selectedCount > 0 ? '' : ''}`}
                                onClick={onSelectAllToggle}>
                            {(areAllSelected || (selectedCount > 0)) ? '' : <span>Zaznacz wszystkie</span>}
                            <i className={`${areAllSelected ? 'icon-check' : 'icon-check-empty'} icon--bigger`}/>
                        </button>
                    </>}
                </div>

                <input
                    type="file"
                    id="import-file-input"
                    accept="application/json"
                    style={{display: 'none'}}
                    onChange={handleFileChange}
                />
            </div>
        </>
    );
};

export default NavButtons;
