// DragAndDropFormList.tsx

import React, {
    useState,
    useEffect,
    ChangeEvent,
    useContext,
} from 'react';
import { NotepadoContext } from '../../context/NotepadoContext';
import { useTranslation } from 'react-i18next';

import {
    DragDropContext,
    Droppable,
    Draggable,
    DropResult,
} from '@hello-pangea/dnd';
import NavButtons from './NavButtons';
import {
    saveData,
    loadAllData,
    deleteData,
    isValidFormData,
    saveDataToStorage,
    loadDataFromStorage,
    FormData,
} from '../elements/functions';

const parsePolishDateString = (dateStr?: string): number => {
    if (!dateStr) {
        console.warn('parsePolishDateString: brak daty');
        return 0;
    }
    const match = dateStr.match(
        /^(\d{2})\.(\d{2})\.(\d{4}),?\s+(\d{2}):(\d{2}):(\d{2})$/
    );
    if (!match) {
        console.warn(`parsePolishDateString: nie udało się sparsować "${dateStr}"`);
        return 0;
    }
    const [_, dd, mm, yyyy, HH, MM, SS] = match;
    return new Date(
        Number(yyyy),
        Number(mm) - 1,
        Number(dd),
        Number(HH),
        Number(MM),
        Number(SS)
    ).getTime();
};

const getSortableUpdateDate = (item: FormData): number => {
    const lastModified = parsePolishDateString(item.lastModifiedDate);
    return lastModified > 0 ? lastModified : parsePolishDateString(item.creationDate);
};

const DragAndDropFormList: React.FC = () => {
    const { t } = useTranslation();
    const {
        searchTerm,
        isDescriptionVisible,
        setIsDescriptionVisible,
        visibleDescriptions,
        setVisibleDescriptions,
        selectSort,
        setShowSearch,
        setSearchTerm,
        setSelectSort,
    } = useContext(NotepadoContext);

    // Lista notatek
    const [items, setItems] = useState<FormData[]>([]);
    // Lista notatek po filtrze i sortowaniu
    const [filteredItems, setFilteredItems] = useState<FormData[]>([]);
    // ID notatki, którą chcemy usunąć (potwierdzenie)
    const [confirmRemoveId, setConfirmRemoveId] = useState<number | null>(null);
    // Obiekt z timerami do debounce (klucz = id notatki)
    const [saveTimers, setSaveTimers] = useState<{ [key: number]: NodeJS.Timeout }>({});
    // Aktualnie wybrany sposób sortowania
    const [currentSort, setCurrentSort] = useState<string>('my-sort');
    // Stan przechowujący aktywność przycisku zmiany koloru (klucz = id notatki)
    const [activeColorButtons, setActiveColorButtons] = useState<{ [id: number]: boolean }>({});

    // [FOCUS] ID notatki, której pole tytułu chcemy sfokusować
    const [focusedItemId, setFocusedItemId] = useState<number | null>(null);

    // [SELECTION] Tablica z zaznaczonymi ID
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (
                !target.closest('.o-note-bg') &&
                !target.closest('.o-color-picker')
            ) {
                setActiveColorButtons({});
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    // Ładowanie danych i kolejności z IndexedDB oraz localStorage
    useEffect(() => {
        const fetchData = async () => {
            const loadedData = await loadAllData();
            const orderedData = loadOrderFromStorage(loadedData);
            setItems(orderedData);
            setFilteredItems(orderedData);
        };
        fetchData();
    }, []);

    useEffect(() => {
        let newFiltered = [...items];

        if (searchTerm && searchTerm.length >= 2) {
            const lowerSearchTerm = searchTerm.toLowerCase();
            newFiltered = newFiltered.filter(
                (item) =>
                    item.title.toLowerCase().includes(lowerSearchTerm) ||
                    item.description.toLowerCase().includes(lowerSearchTerm)
            );
        }

        switch (currentSort) {
            case 'by-date-added-from-newest':
                newFiltered.sort(
                    (a, b) =>
                        parsePolishDateString(b.creationDate) -
                        parsePolishDateString(a.creationDate)
                );
                break;
            case 'by-date-added-from-oldest':
                newFiltered.sort(
                    (a, b) =>
                        parsePolishDateString(a.creationDate) -
                        parsePolishDateString(b.creationDate)
                );
                break;
            case 'by-update-date-from-newest':
                newFiltered.sort(
                    (a, b) => getSortableUpdateDate(b) - getSortableUpdateDate(a)
                );
                break;
            case 'by-update-date-from-oldest':
                newFiltered.sort(
                    (a, b) => getSortableUpdateDate(a) - getSortableUpdateDate(b)
                );
                break;
            // "my-sort" – nie zmieniamy kolejności
        }

        setFilteredItems(newFiltered);
    }, [items, searchTerm, currentSort]);

    const saveOrderToStorage = (newOrder: FormData[]) => {
        const orderIds = newOrder.map((item) => item.id);
        saveDataToStorage('itemOrder', JSON.stringify(orderIds));
    };

    const loadOrderFromStorage = (loadedItems: FormData[]): FormData[] => {
        const savedOrder = loadDataFromStorage('itemOrder');
        if (savedOrder) {
            const orderIds = JSON.parse(savedOrder) as number[];
            const reorderedItems = orderIds
                .map((id) => loadedItems.find((item) => item.id === id))
                .filter((item): item is FormData => item !== undefined);
            const notListedItems = loadedItems.filter(
                (it) => !orderIds.includes(it.id)
            );
            return [...reorderedItems, ...notListedItems];
        }
        return loadedItems;
    };

    const handleOnDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        if (currentSort !== 'my-sort') {
            setCurrentSort('my-sort');
        }

        const reorderedItems = Array.from(filteredItems);
        const [reorderedItem] = reorderedItems.splice(result.source.index, 1);
        reorderedItems.splice(result.destination.index, 0, reorderedItem);

        setFilteredItems(reorderedItems);

        setItems((prevItems) => {
            const updatedItems = prevItems.filter(
                (item) => item.id !== reorderedItem.id
            );
            updatedItems.splice(result.destination.index, 0, reorderedItem);
            saveOrderToStorage(updatedItems);
            return updatedItems;
        });
    };

    const handleAddNewItem = async () => {
        const now = new Date().toLocaleString('pl-PL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
        const newItem: FormData = {
            id: Date.now(),
            title: '',
            description: '',
            creationDate: now,
            lastModifiedDate: now,
            bgColor: 'o-bg-default',
        };
        setItems((prevItems) => [newItem, ...prevItems]);
        setFilteredItems((prevFiltered) => [newItem, ...prevFiltered]);

        setVisibleDescriptions(String(newItem.id));
        setIsDescriptionVisible(true);
        setFocusedItemId(newItem.id);
    };

    const handleAddNewItemAll = () => {
        handleAddNewItem();
        setSearchTerm('');
        setShowSearch(false);
    };

    const scheduleSaveItem = (id: number) => {
        if (saveTimers[id]) {
            clearTimeout(saveTimers[id]);
        }
        const newTimer = setTimeout(() => handleSaveItem(id), 500);
        setSaveTimers((prev) => ({
            ...prev,
            [id]: newTimer,
        }));
    };

    const handleTitleChange = (e: ChangeEvent<HTMLInputElement>, id: number) => {
        const newTitle = e.target.value;
        setItems((prevItems) =>
            prevItems.map((item) =>
                item.id === id ? { ...item, title: newTitle } : item
            )
        );
        setFilteredItems((prevItems) =>
            prevItems.map((item) =>
                item.id === id ? { ...item, title: newTitle } : item
            )
        );
        scheduleSaveItem(id);
    };

    const handleDescriptionChange = (
        e: ChangeEvent<HTMLTextAreaElement>,
        id: number
    ) => {
        const newDescription = e.target.value;
        setItems((prevItems) =>
            prevItems.map((item) =>
                item.id === id ? { ...item, description: newDescription } : item
            )
        );
        setFilteredItems((prevItems) =>
            prevItems.map((item) =>
                item.id === id ? { ...item, description: newDescription } : item
            )
        );
        scheduleSaveItem(id);
    };

    const handleSaveItem = async (id: number) => {
        const newDate = new Date().toLocaleString('pl-PL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
        setItems((prevItems) =>
            prevItems.map((item) =>
                item.id === id ? { ...item, lastModifiedDate: newDate } : item
            )
        );
        setFilteredItems((prevItems) =>
            prevItems.map((item) =>
                item.id === id ? { ...item, lastModifiedDate: newDate } : item
            )
        );

        const currentItem = items.find((item) => item.id === id);
        if (currentItem) {
            const updatedItem: FormData = {
                ...currentItem,
                lastModifiedDate: newDate,
            };
            try {
                await saveData(updatedItem);
                saveOrderToStorage(items);
            } catch (error) {
                console.error('Error during save: ', error);
            }
        }
    };

    // Usuwanie pojedynczej notatki
    const handleRemoveItem = async (id: number) => {
        await deleteData(id);
        setItems((prevItems) => {
            const updatedItems = prevItems.filter((item) => item.id !== id);
            saveOrderToStorage(updatedItems);
            return updatedItems;
        });
        setFilteredItems((prevItems) => prevItems.filter((item) => item.id !== id));

        // Usuń ID z selectedIds (jeśli było zaznaczone)
        setSelectedIds((prev) => prev.filter((itemId) => itemId !== id));

        setConfirmRemoveId(null);
    };

    const showDescription = (id: string) => {
        setVisibleDescriptions(id);
        setIsDescriptionVisible(true);
        setFocusedItemId(Number(id));
    };

    const hideDescription = (id: string) => {
        setVisibleDescriptions(null);
        setIsDescriptionVisible(false);
        setItems((prevItems) => {
            const updatedItems = prevItems.filter((item) => {
                if (String(item.id) === id) {
                    return (
                        item.title.trim() !== '' || item.description.trim() !== ''
                    );
                }
                return true;
            });
            saveOrderToStorage(updatedItems);
            return updatedItems;
        });
        setFilteredItems((prevItems) => {
            const updatedItems = prevItems.filter((item) => {
                if (String(item.id) === id) {
                    return (
                        item.title.trim() !== '' || item.description.trim() !== ''
                    );
                }
                return true;
            });
            return updatedItems;
        });
    };

    const handleConfirmRemoveItem = (id: number) => {
        setConfirmRemoveId(id);
    };

    const handleCopyIndexedDB = async () => {
        try {
            const allData = await loadAllData();
            if (!allData) {
                throw new Error('No data returned from IndexedDB');
            }
            const jsonData = JSON.stringify(allData, null, 2);
            await navigator.clipboard.writeText(jsonData);
        } catch (error) {
            console.error('Detailed error:', error);
        }
    };

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const text = await file.text();
                const importedData = JSON.parse(text);
                if (!Array.isArray(importedData)) {
                    alert('Invalid data format: expected an array of notes.');
                    return;
                }
                const validData: FormData[] = [];
                for (const item of importedData) {
                    if (isValidFormData(item)) {
                        validData.push(item);
                    } else {
                        alert('Invalid data format in one of the notes.');
                        return;
                    }
                }
                const existingData = await loadAllData();
                const existingIds = new Set(existingData.map((item) => item.id));
                let maxExistingId = existingData.reduce(
                    (maxId, item) => Math.max(maxId, item.id),
                    0
                );

                const newData = validData.map((item) => {
                    if (existingIds.has(item.id)) {
                        maxExistingId += 1;
                        return { ...item, id: maxExistingId };
                    } else {
                        return item;
                    }
                });

                for (const item of newData) {
                    await saveData(item);
                }

                setItems((prevItems) => {
                    const updatedItems = [...prevItems, ...newData];
                    saveOrderToStorage(updatedItems);
                    return updatedItems;
                });
                setFilteredItems((prevFiltered) => [...prevFiltered, ...newData]);
                alert('Notes imported successfully.');
            } catch (error) {
                console.error('Error importing data:', error);
                alert('An error occurred while importing data.');
            } finally {
                e.target.value = '';
            }
        }
    };

    const addBgColor = (id: number, color: string) => {
        setItems((prevItems) => {
            const updatedItems = prevItems.map((item) => {
                if (item.id === id) {
                    const updatedItem = { ...item, bgColor: color };
                    saveData(updatedItem).catch((error) =>
                        console.error('Error updating bgColor:', error)
                    );
                    return updatedItem;
                }
                return item;
            });
            return updatedItems;
        });

        setFilteredItems((prevItems) =>
            prevItems.map((item) =>
                item.id === id ? { ...item, bgColor: color } : item
            )
        );
        setActiveColorButtons({});
    };

    const toggleColorButton = (id: number) => {
        setActiveColorButtons((prev) => {
            if (prev[id]) {
                return {};
            } else {
                return { [id]: true };
            }
        });
    };

    // [SELECTION] Czy wszystkie widoczne notatki są zaznaczone?
    const areAllSelected =
        filteredItems.length > 0 &&
        filteredItems.every((item) => selectedIds.includes(item.id));

    // [SELECTION] Zaznacz/odznacz wszystkie
    const handleSelectAll = () => {
        if (areAllSelected) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredItems.map((item) => item.id));
        }
    };

    // [SELECTION] Togglowanie pojedynczego checkboxa
    const handleToggleItemSelection = (id: number) => {
        setSelectedIds((prev) => {
            if (prev.includes(id)) {
                return prev.filter((itemId) => itemId !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    // [SELECTION] Akcje z selecta (export, copy, remove)
    const handleSelectAction = async (action: string) => {
        if (!selectedIds.length) return;

        const selectedItems = items.filter((it) => selectedIds.includes(it.id));

        switch (action) {
            case 'export-checked': {
                const jsonString = JSON.stringify(selectedItems, null, 2);
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `notes-export-${Date.now()}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                break;
            }
            case 'copy-checked': {
                const jsonString = JSON.stringify(selectedItems, null, 2);
                try {
                    await navigator.clipboard.writeText(jsonString);
                    alert('Skopiowano do schowka!');
                } catch (error) {
                    console.error('Clipboard error:', error);
                }
                break;
            }
            case 'remove-checked': {
                // Usuwamy tylko zaznaczone
                for (const note of selectedItems) {
                    await handleRemoveItem(note.id);
                }
                break;
            }
            default:
                break;
        }

        // <== UWAGA: usunięto reset selectedIds (by nie odznaczać automatycznie)
        // Poprzednio było: setSelectedIds([]);
        // Teraz checkboxy zostają w stanie w jakim są, z wyjątkiem tych usuniętych w akcji remove
    };

    return (
        <>
            {/*<div id="editableDiv" contentEditable="true" className="editable-box">Test test test</div>*/}
            <div className={`o-notepad ${isDescriptionVisible ? 'o-single' : ''}`}>
                {!isDescriptionVisible && (
                    <>
                        <button
                            title={t('add')}
                            className="o-circle-btn o-circle-btn--fixed"
                            onClick={handleAddNewItemAll}
                        >
                            <i className="icon-plus-circle"></i>
                        </button>
                        <div className="o-sub-nav">
                            <NavButtons
                                filteredItems={filteredItems}
                                handleAddNewItemAll={handleAddNewItemAll}
                                handleCopyIndexedDB={handleCopyIndexedDB}
                                handleFileChange={handleFileChange}
                                selectedCount={selectedIds.length}
                                areAllSelected={areAllSelected}
                                onSelectAllToggle={handleSelectAll}
                                onSelectAction={handleSelectAction}
                            />
                            {(selectSort && (filteredItems.length > 0)) && (
                                <select
                                    className="o-bg-dark-gray"
                                    value={currentSort}
                                    onChange={(e) => setCurrentSort(e.target.value)}
                                >
                                    <option value="my-sort">Mój sort</option>
                                    <option value="by-date-added-from-newest">
                                        Wg daty dodania od najnowszego
                                    </option>
                                    <option value="by-date-added-from-oldest">
                                        Wg daty dodania od najstarszego
                                    </option>
                                    <option value="by-update-date-from-newest">
                                        Wg daty aktualizacji od najnowszego
                                    </option>
                                    <option value="by-update-date-from-oldest">
                                        Wg daty aktualizacji od najstarszego
                                    </option>
                                </select>
                            )}
                        </div>
                    </>
                )}

                <DragDropContext onDragEnd={handleOnDragEnd}>
                    <Droppable droppableId="droppable">
                        {(provided) => (
                            <ul
                                className="o-list"
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                            >
                                {filteredItems.map((item, index) => (
                                    <Draggable
                                        key={item.id}
                                        draggableId={item.id.toString()}
                                        index={index}
                                    >
                                        {(provided) => (
                                            <li
                                                className={`o-item ${item.bgColor} 
                                                ${selectedIds.includes(item.id) ? 'o-item--check' : 'o-item--check-empty'}
                                                ${
                                                    String(visibleDescriptions) ===
                                                    String(item.id)
                                                        ? ' o-active-item'
                                                        : ''
                                                }`}
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                            >
                                                <div
                                                    className="o-item-move"
                                                    {...provided.dragHandleProps}
                                                    style={{cursor: 'grab'}}
                                                >
                                                    <i className="icon-move"></i>
                                                    <span>{t('move')}</span>
                                                    <p className="o-item-date">
                                                        <span className="o-creation-date">
                                                            Stworzono: {item.creationDate}
                                                        </span>
                                                        <br/>
                                                        {item.lastModifiedDate && (
                                                            <span className="o-last-modified-date">
                                                                Modyfikowano: {item.lastModifiedDate}
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="o-options">
                                                    {String(visibleDescriptions) ===
                                                    String(item.id) ? (
                                                        <>
                                                            <button
                                                                title={t('add')}
                                                                className="o-circle-btn o-circle-btn--fixed"
                                                                onClick={() =>
                                                                    hideDescription(String(item.id))
                                                                }
                                                            >
                                                                <i className="icon-level-up"></i>
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    hideDescription(String(item.id))
                                                                }
                                                            >
                                                                <i className="icon-level-up"></i>
                                                                {t('return')}
                                                            </button>
                                                            <button
                                                                className="o-btn-save"
                                                                onClick={() => handleSaveItem(item.id)}
                                                            >
                                                                <i className="icon-floppy"></i>
                                                                {t('save')}
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            onClick={() =>
                                                                showDescription(String(item.id))
                                                            }
                                                        >
                                                            <i className="icon-pencil"></i>
                                                            {t('edit')}
                                                        </button>
                                                    )}

                                                    {confirmRemoveId === item.id ? (
                                                        <div className="o-modal-remove">
                                                            <div className="o-modal-remove__container">
                                                                <p>{t('confirm')}</p>
                                                                <div className="o-modal-remove__row">
                                                                    <button
                                                                        className="o-btn-remove"
                                                                        onClick={() => {
                                                                            hideDescription(
                                                                                String(item.id)
                                                                            );
                                                                            handleRemoveItem(item.id);
                                                                        }}
                                                                    >
                                                                        <i className="icon-trash-empty"></i>
                                                                        {t('remove')}
                                                                    </button>
                                                                    <button
                                                                        onClick={() =>
                                                                            setConfirmRemoveId(null)
                                                                        }
                                                                    >
                                                                        <i className="icon-cancel-alt-filled"></i>
                                                                        {t('cancel')}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            className="o-btn-remove"
                                                            onClick={() =>
                                                                handleConfirmRemoveItem(item.id)
                                                            }
                                                        >
                                                            <i className="icon-trash-empty"></i>
                                                            {t('remove')}
                                                        </button>
                                                    )}

                                                    <button
                                                        className={`o-note-bg ${
                                                            activeColorButtons[item.id]
                                                                ? 'o-bg-dark'
                                                                : ''
                                                        }`}
                                                        onClick={() => toggleColorButton(item.id)}
                                                    >
                                                        <i
                                                            className={
                                                                activeColorButtons[item.id]
                                                                    ? 'icon-cancel'
                                                                    : 'icon-down-open'
                                                            }
                                                        />
                                                        Color{' '}
                                                        <span
                                                            className={`o-note-bg__box-color ${item.bgColor}`}
                                                        />
                                                    </button>
                                                    {activeColorButtons[item.id] && (
                                                        <ul className="o-color-picker">
                                                            <li
                                                                role="button"
                                                                onClick={() =>
                                                                    addBgColor(
                                                                        item.id,
                                                                        'o-bg-default'
                                                                    )
                                                                }
                                                                className="o-color-picker__btn o-bg-default"
                                                            />
                                                            <li
                                                                role="button"
                                                                onClick={() =>
                                                                    addBgColor(item.id, 'o-bg-red')
                                                                }
                                                                className="o-color-picker__btn o-bg-red"
                                                            />
                                                            <li
                                                                role="button"
                                                                onClick={() =>
                                                                    addBgColor(item.id, 'o-bg-blue')
                                                                }
                                                                className="o-color-picker__btn o-bg-blue"
                                                            />
                                                            <li
                                                                role="button"
                                                                onClick={() =>
                                                                    addBgColor(
                                                                        item.id,
                                                                        'o-bg-green'
                                                                    )
                                                                }
                                                                className="o-color-picker__btn o-bg-green"
                                                            />
                                                            <li
                                                                role="button"
                                                                onClick={() =>
                                                                    addBgColor(
                                                                        item.id,
                                                                        'o-bg-yellow'
                                                                    )
                                                                }
                                                                className="o-color-picker__btn o-bg-yellow"
                                                            />
                                                        </ul>
                                                    )}

                                                    {!(String(visibleDescriptions) === String(item.id)) && (
                                                        <label className="o-checkbox">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedIds.includes(item.id)}
                                                                onChange={() =>
                                                                    handleToggleItemSelection(item.id)
                                                                }
                                                            />
                                                            <i className={`${selectedIds.includes(item.id) ? 'icon-check' : 'icon-check-empty'} icon--bigger`}></i>
                                                        </label>
                                                    )}
                                                </div>

                                                {!(
                                                    String(visibleDescriptions) !==
                                                    String(item.id) && item.title === ''
                                                ) && (
                                                    <input
                                                        ref={(el) => {
                                                            if (el && item.id === focusedItemId) {
                                                                el.focus();
                                                                setFocusedItemId(null);
                                                            }
                                                        }}
                                                        type="text"
                                                        value={item.title}
                                                        onChange={(e) =>
                                                            handleTitleChange(e, item.id)
                                                        }
                                                        placeholder="Enter title"
                                                        onClick={() =>
                                                            showDescription(String(item.id))
                                                        }
                                                    />
                                                )}

                                                {visibleDescriptions === String(item.id) ? (
                                                    <textarea
                                                        value={item.description}
                                                        onChange={(e) =>
                                                            handleDescriptionChange(e, item.id)
                                                        }
                                                        placeholder="Enter description"
                                                    ></textarea>
                                                ) : (
                                                    item.title === '' &&
                                                    item.description !== '' && (
                                                        <input
                                                            type="text"
                                                            readOnly
                                                            value={
                                                                item.description.length > 40
                                                                    ? `${item.description.substring(
                                                                        0,
                                                                        40
                                                                    )}...`
                                                                    : item.description
                                                            }
                                                            placeholder="Enter description"
                                                            onClick={() =>
                                                                showDescription(String(item.id))
                                                            }
                                                        />
                                                    )
                                                )}
                                            </li>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </ul>
                        )}
                    </Droppable>
                </DragDropContext>

                {!filteredItems.length && <p>No results...</p>}
            </div>
        </>
    );
};

export default DragAndDropFormList;
