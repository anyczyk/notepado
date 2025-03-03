import React, {
    useState,
    useEffect,
    ChangeEvent,
    useContext,
    useRef
} from 'react';
import dataExport from "../../utils/dataExport";
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

/** Parsowanie dat w formacie dd.mm.yyyy HH:MM:SS (np. "03.03.2023 12:15:30"). */
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

    // Z kontekstu:
    const {
        searchTerm,
        isDescriptionVisible,
        setIsDescriptionVisible,
        visibleDescriptions,
        setVisibleDescriptions,
        selectSort,
        setShowSearch,
        setSearchTerm,
        setSelectSort
    } = useContext(NotepadoContext);

    // -------------------- STANY -------------------- //
    const [items, setItems] = useState<FormData[]>([]);
    const [filteredItems, setFilteredItems] = useState<FormData[]>([]);

    const [confirmRemoveId, setConfirmRemoveId] = useState<number | null>(null);
    const [saveTimers, setSaveTimers] = useState<{ [key: number]: NodeJS.Timeout }>({});

    const [currentSort, setCurrentSort] = useState<string>('my-sort');
    const [activeColorButtons, setActiveColorButtons] = useState<{ [id: number]: boolean }>({});

    const [focusedItemId, setFocusedItemId] = useState<number | null>(null);

    // Zaznaczone checkboxy (selektory zaznaczenia):
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Lokalna historia (stos) dla każdego item.id
    const [undoHistories, setUndoHistories] = useState<{ [id: number]: string[] }>({});

    const editorRef = useRef<HTMLDivElement | null>(null);

    // Stan przycisków formatowania (b/i/u/strikethrough):
    const [formatState, setFormatState] = useState({
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
    });

    /**
     * Poziom rozmiaru fontu 1..7
     * Domyślnie 3 (mniej więcej "środkowy" w staromodnej skali).
     */
    const [fontSizeLevel, setFontSizeLevel] = useState<number>(3);

    // -------------------- HOOKI -------------------- //

    /** Zamykamy color-picker, sort itp. przy kliknięciu poza. */
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (
                !target.closest('.o-note-bg') &&
                !target.closest('.o-color-picker')
            ) {
                setActiveColorButtons({});
            }
            if (
                !target.closest('.o-sort') &&
                !target.closest('.o-sub-nav__select-sort')
            ) {
                setSelectSort(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    /** Ładujemy notatki z IndexedDB + kolejność z localStorage. */
    useEffect(() => {
        const fetchData = async () => {
            const loadedData = await loadAllData();
            const orderedData = loadOrderFromStorage(loadedData);
            setItems(orderedData);
            setFilteredItems(orderedData);
        };
        fetchData();
    }, []);

    /** Filtrowanie i sortowanie przy zmianie items/searchTerm/currentSort. */
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
            default:
            // my-sort – nie sortujemy
        }

        setFilteredItems(newFiltered);
    }, [items, searchTerm, currentSort]);

    // -------------------- FUNKCJE POMOCNICZE -------------------- //

    /** Zapis kolejności do localStorage. */
    const saveOrderToStorage = (newOrder: FormData[]) => {
        const orderIds = newOrder.map((item) => item.id);
        saveDataToStorage('itemOrder', JSON.stringify(orderIds));
    };

    /** Odczyt kolejności z localStorage i narzucenie notatkom. */
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

    /** Obsługa drag&drop. */
    const handleOnDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        if (currentSort !== 'my-sort') {
            setCurrentSort('my-sort');
        }

        const reorderedItems = Array.from(filteredItems);
        const [moved] = reorderedItems.splice(result.source.index, 1);
        reorderedItems.splice(result.destination.index, 0, moved);
        setFilteredItems(reorderedItems);

        setItems((prevItems) => {
            const updatedItems = prevItems.filter((it) => it.id !== moved.id);
            updatedItems.splice(result.destination.index, 0, moved);
            saveOrderToStorage(updatedItems);
            return updatedItems;
        });
    };

    /** Dodanie nowej notatki. */
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
        setItems((prev) => [newItem, ...prev]);
        setFilteredItems((prev) => [newItem, ...prev]);

        // Pokaż edytor od razu
        setVisibleDescriptions(String(newItem.id));
        setIsDescriptionVisible(true);
        setFocusedItemId(newItem.id);

        // Inicjuj historię (undo) dla nowej notatki z tekstem bazowym (pustym)
        setUndoHistories((prev) => ({
            ...prev,
            [newItem.id]: [newItem.description],
        }));
    };

    const handleAddNewItemAll = () => {
        handleAddNewItem();
        setSearchTerm('');
        setShowSearch(false);
    };

    /** Debounce zapisu notatki w IndexedDB. */
    const scheduleSaveItem = (id: number) => {
        if (saveTimers[id]) {
            clearTimeout(saveTimers[id]);
        }
        const newTimer = setTimeout(() => handleSaveItem(id), 500);
        setSaveTimers((prev) => ({ ...prev, [id]: newTimer }));
    };

    /** Zmiana tytułu (input). */
    const handleTitleChange = (e: ChangeEvent<HTMLInputElement>, id: number) => {
        const newTitle = e.target.value;
        setItems((prev) =>
            prev.map((it) =>
                it.id === id ? { ...it, title: newTitle } : it
            )
        );
        setFilteredItems((prev) =>
            prev.map((it) =>
                it.id === id ? { ...it, title: newTitle } : it
            )
        );
        scheduleSaveItem(id);
    };

    /** Zmiana opisu w edytorze (przechowywana w item.description). */
    const handleDescriptionChange = (newDescription: string, id: number) => {
        setItems((prev) =>
            prev.map((it) =>
                it.id === id ? { ...it, description: newDescription } : it
            )
        );
        setFilteredItems((prev) =>
            prev.map((it) =>
                it.id === id ? { ...it, description: newDescription } : it
            )
        );
        scheduleSaveItem(id);
    };

    /**
     * Funkcja odświeżająca stan przycisków b/i/u/strikethrough
     * i wykrywająca rozmiar fontu.
     */
    const updateActiveButtons = () => {
        setFormatState({
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline'),
            strikethrough: document.queryCommandState('strikeThrough'),
        });

        // Wczytanie rozmiaru:
        const sizeStr = document.queryCommandValue('fontSize');
        if (sizeStr) {
            const parsed = parseInt(sizeStr, 10);
            if (!isNaN(parsed)) {
                setFontSizeLevel(parsed);
            } else {
                setFontSizeLevel(3);
            }
        } else {
            setFontSizeLevel(3);
        }

        editorRef.current?.focus();
    };

    /** Formatowanie tekstu: Bold/Italic/Underline/StrikeThrough. */
    const handleFormatText = (
        command: 'bold' | 'italic' | 'underline' | 'strikeThrough'
    ) => {
        document.execCommand(command, false, '');
        updateActiveButtons();
    };

    /** Zwiększenie rozmiaru fontu z poziomu `fontSizeLevel`. */
    const handleIncreaseFontSize = () => {
        if (!window.getSelection) return;
        // Zwiększamy w zakresie max 7
        const newLevel = Math.min(fontSizeLevel + 1, 7);
        setFontSizeLevel(newLevel);

        document.execCommand('fontSize', false, String(newLevel));
        updateActiveButtons();
    };

    /** Zmniejszenie rozmiaru fontu z poziomu `fontSizeLevel`. */
    const handleDecreaseFontSize = () => {
        if (!window.getSelection) return;
        // Minimalnie 1
        const newLevel = Math.max(fontSizeLevel - 1, 1);
        setFontSizeLevel(newLevel);

        document.execCommand('fontSize', false, String(newLevel));
        updateActiveButtons();
    };

    /** Zapis do IndexedDB. */
    const handleSaveItem = async (id: number) => {
        const newDate = new Date().toLocaleString('pl-PL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
        setItems((prev) =>
            prev.map((it) =>
                it.id === id ? { ...it, lastModifiedDate: newDate } : it
            )
        );
        setFilteredItems((prev) =>
            prev.map((it) =>
                it.id === id ? { ...it, lastModifiedDate: newDate } : it
            )
        );

        const currentItem = items.find((it) => it.id === id);
        if (currentItem) {
            const updatedItem: FormData = {
                ...currentItem,
                lastModifiedDate: newDate
            };
            try {
                await saveData(updatedItem);
                saveOrderToStorage(items);
            } catch (error) {
                console.error('Error during save: ', error);
            }
        }
    };

    /** Usuwanie notatki. */
    const handleRemoveItem = async (id: number) => {
        await deleteData(id);
        setItems((prev) => {
            const updated = prev.filter((it) => it.id !== id);
            saveOrderToStorage(updated);
            return updated;
        });
        setFilteredItems((prev) => prev.filter((it) => it.id !== id));
        setSelectedIds((prev) => prev.filter((x) => x !== id));
        setConfirmRemoveId(null);

        // Wyczyść historię „undo” dla usuniętej notatki
        setUndoHistories((prev) => {
            const { [id]: _omit, ...rest } = prev; // usuwamy klucz
            return rest;
        });
    };

    /** Pokaż opis (edytor). */
    const showDescription = (id: string) => {
        setVisibleDescriptions(id);
        setIsDescriptionVisible(true);
        setFocusedItemId(Number(id));

        // Upewnij się, że mamy zainicjowaną historię z aktualnym tekstem,
        // jeśli wcześniej jej nie było.
        const numId = Number(id);
        const currentItem = items.find((it) => it.id === numId);
        const existingText = currentItem?.description || '';
        setUndoHistories((prev) => ({
            ...prev,
            [numId]: prev[numId] || [existingText],
        }));
    };

    /** Ukryj opis, usuń puste. */
    const hideDescription = (id: string) => {
        setVisibleDescriptions(null);
        setIsDescriptionVisible(false);
        setItems((prev) => {
            const updated = prev.filter((it) => {
                if (String(it.id) === id) {
                    return it.title.trim() !== '' || it.description.trim() !== '';
                }
                return true;
            });
            saveOrderToStorage(updated);
            return updated;
        });
        setFilteredItems((prev) => {
            const updated = prev.filter((it) => {
                if (String(it.id) === id) {
                    return it.title.trim() !== '' || it.description.trim() !== '';
                }
                return true;
            });
            return updated;
        });
    };

    /** Potwierdzenie usuwania. */
    const handleConfirmRemoveItem = (id: number) => {
        setConfirmRemoveId(id);
    };

    /** Kopiowanie bazy do schowka. */
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

    /** Import pliku JSON. */
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
                const existingIds = new Set(existingData.map((it) => it.id));
                let maxExistingId = existingData.reduce(
                    (maxId, it) => Math.max(maxId, it.id),
                    0
                );

                const newData = validData.map((it) => {
                    if (existingIds.has(it.id)) {
                        maxExistingId += 1;
                        return { ...it, id: maxExistingId };
                    } else {
                        return it;
                    }
                });

                for (const it of newData) {
                    await saveData(it);
                }

                setItems((prev) => {
                    const updated = [...prev, ...newData];
                    saveOrderToStorage(updated);
                    return updated;
                });
                setFilteredItems((prev) => [...prev, ...newData]);
                alert('Notes imported successfully.');
            } catch (error) {
                console.error('Error importing data:', error);
                alert('An error occurred while importing data.');
            } finally {
                e.target.value = '';
            }
        }
    };

    /** Zmiana koloru tła notatki. */
    const addBgColor = (id: number, color: string) => {
        setItems((prev) => {
            const updated = prev.map((it) => {
                if (it.id === id) {
                    const newItem = { ...it, bgColor: color };
                    saveData(newItem).catch((error) =>
                        console.error('Error updating bgColor:', error)
                    );
                    return newItem;
                }
                return it;
            });
            return updated;
        });
        setFilteredItems((prev) =>
            prev.map((it) =>
                it.id === id ? { ...it, bgColor: color } : it
            )
        );
        setActiveColorButtons({});
    };

    /** Pokazywanie/ukrywanie palety kolorów. */
    const toggleColorButton = (id: number) => {
        setActiveColorButtons((prev) => {
            if (prev[id]) {
                return {};
            } else {
                return { [id]: true };
            }
        });
    };

    // -------------------- MECHANIZM UNDO -------------------- //

    /**
     * Zapisuje nową wersję opisu w historii (stos) po każdej zmianie, np. co klawisz (keyUp).
     * Nie duplikujemy identycznego stanu.
     */
    const pushUndoHistory = (id: number, content: string) => {
        setUndoHistories((prev) => {
            const currentHistory = prev[id] || [''];
            // Jeśli ostatni stan w historii jest taki sam, nie duplikuj
            if (currentHistory[currentHistory.length - 1] === content) {
                return prev;
            }
            // Ograniczamy do np. 10 ostatnich stanów
            const maxStates = 100;
            const newHistory = [...currentHistory, content].slice(-maxStates);

            return {
                ...prev,
                [id]: newHistory,
            };
        });
    };

    /**
     * Cofnięcie ostatniej zmiany w notatce o danym id.
     * Wraca do poprzedniego zapisanego stanu.
     */
    const handleUndo = (id: number) => {
        setUndoHistories((prev) => {
            const currentHistory = prev[id] || [''];
            // Jeśli mamy mniej niż 2 stany – nie cofamy:
            if (currentHistory.length < 2) {
                return prev;
            }
            // Usuwamy ostatni stan:
            const newHistory = currentHistory.slice(0, -1);

            // Wczytujemy poprzedni stan, który staje się aktualnym
            const previousContent = newHistory[newHistory.length - 1];

            // Aktualizuj editorRef i stan itemu:
            if (editorRef.current && String(visibleDescriptions) === String(id)) {
                editorRef.current.innerHTML = previousContent;
            }
            handleDescriptionChange(previousContent, id);

            return {
                ...prev,
                [id]: newHistory,
            };
        });
        editorRef.current?.focus();
    };

    // -------------------- SELECTION (checkboxy) -------------------- //

    const areAllSelected =
        filteredItems.length > 0 &&
        filteredItems.every((it) => selectedIds.includes(it.id));

    const handleSelectAll = () => {
        if (areAllSelected) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredItems.map((it) => it.id));
        }
    };

    const handleToggleItemSelection = (id: number) => {
        setSelectedIds((prev) => {
            if (prev.includes(id)) {
                return prev.filter((x) => x !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    const handleSelectAction = async (action: string) => {
        if (!selectedIds.length) return;

        const selectedItems = items.filter((it) => selectedIds.includes(it.id));

        switch (action) {
            case 'export-checked': {
                try {
                    await dataExport(selectedItems);
                } catch (error) {
                    console.error(t('export_error'), error);
                    alert(t('export_error'));
                }
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
                for (const note of selectedItems) {
                    await handleRemoveItem(note.id);
                }
                break;
            }
            default:
                break;
        }
    };

    const stripHtml = (html: string) => {
        return html
            .replace(/<\/?[^>]+(>|$)/g, ' ')  // zamień wszystkie tagi na spację
            .replace(/\s+/g, ' ')            // skompresuj wielokrotne spacje do jednej
            .trim();                         // usuń zbędne spacje na początku i końcu
    };

    // -------------------- RENDER -------------------- //

    return (
        <>
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
                                selectSort={selectSort}
                                currentSort={currentSort}
                                setCurrentSort={setCurrentSort}
                            />
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
                                                    ${
                                                    selectedIds.includes(item.id)
                                                        ? 'o-item--check'
                                                        : 'o-item--check-empty'
                                                }
                                                    ${
                                                    String(visibleDescriptions) === String(item.id)
                                                        ? ' o-active-item'
                                                        : ''
                                                }`}
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                            >
                                                <div
                                                    className="o-item-move"
                                                    {...provided.dragHandleProps}
                                                    style={{ cursor: 'grab' }}
                                                >
                                                    <i className="icon-move"></i>
                                                    <span>{t('move')}</span>
                                                    <p className="o-item-date">
                                                        <span className="o-creation-date">
                                                            Stworzono: {item.creationDate}
                                                        </span>
                                                        <br />
                                                        {item.lastModifiedDate && (
                                                            <span className="o-last-modified-date">
                                                                Modyfikowano: {item.lastModifiedDate}
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>

                                                <div className="o-options">
                                                    {String(visibleDescriptions) === String(item.id) ? (
                                                        <>
                                                            <button
                                                                title={t('return')}
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
                                                    {activeColorButtons[item.id] && (
                                                        <ul className="o-color-picker">
                                                            <li
                                                                role="button"
                                                                onClick={() =>
                                                                    addBgColor(item.id, 'o-bg-default')
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
                                                                    addBgColor(item.id, 'o-bg-green')
                                                                }
                                                                className="o-color-picker__btn o-bg-green"
                                                            />
                                                            <li
                                                                role="button"
                                                                onClick={() =>
                                                                    addBgColor(item.id, 'o-bg-yellow')
                                                                }
                                                                className="o-color-picker__btn o-bg-yellow"
                                                            />
                                                        </ul>
                                                    )}

                                                    {String(visibleDescriptions) !==
                                                        String(item.id) && (
                                                            <label className="o-checkbox">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedIds.includes(item.id)}
                                                                    onChange={() =>
                                                                        handleToggleItemSelection(item.id)
                                                                    }
                                                                />
                                                                <i
                                                                    className={`${
                                                                        selectedIds.includes(item.id)
                                                                            ? 'icon-check'
                                                                            : 'icon-check-empty'
                                                                    } icon--bigger`}
                                                                ></i>
                                                            </label>
                                                        )}
                                                </div>

                                                {/* Tytuł */}
                                                {!(String(visibleDescriptions) !== String(item.id) &&
                                                    item.title === '') && (
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

                                                {/* Edytor opisu */}
                                                {visibleDescriptions === String(item.id) ? (
                                                    <div className="o-editor">
                                                        <div
                                                            className="o-editor__main"
                                                            contentEditable
                                                            suppressContentEditableWarning
                                                            onFocus={(e) => {
                                                                const el = e.currentTarget;
                                                                if (el.innerHTML.trim() === '<br>') {
                                                                    el.innerHTML = '';
                                                                }
                                                            }}
                                                            onKeyUp={(e) => {
                                                                updateActiveButtons();
                                                                // Zapis stanu w historii przy każdej zmianie:
                                                                pushUndoHistory(item.id, e.currentTarget.innerHTML);
                                                            }}
                                                            onMouseUp={() => updateActiveButtons()}
                                                            onBlur={(e) => {
                                                                const el = e.currentTarget;
                                                                if (el.innerHTML.trim() === '<br>') {
                                                                    el.innerHTML = '';
                                                                }
                                                                const newDesc = el.innerHTML;
                                                                handleDescriptionChange(newDesc, item.id);
                                                            }}
                                                            ref={(el) => {
                                                                if (el) {
                                                                    editorRef.current = el;
                                                                }
                                                                // Jeśli notatka ma tekst, wypełnij edytor
                                                                if (
                                                                    el &&
                                                                    el.innerHTML.trim() === '' &&
                                                                    item.description.trim() !== ''
                                                                ) {
                                                                    el.innerHTML = item.description;
                                                                }
                                                            }}
                                                        />
                                                        <div className="o-editor__buttons">
                                                            <button
                                                                className={
                                                                    formatState.bold
                                                                        ? 'o-btn--active'
                                                                        : ''
                                                                }
                                                                onClick={() =>
                                                                    handleFormatText('bold')
                                                                }
                                                            >
                                                                b
                                                            </button>
                                                            <button
                                                                className={
                                                                    formatState.italic
                                                                        ? 'o-btn--active'
                                                                        : ''
                                                                }
                                                                onClick={() =>
                                                                    handleFormatText('italic')
                                                                }
                                                            >
                                                                i
                                                            </button>
                                                            <button
                                                                className={
                                                                    formatState.underline
                                                                        ? 'o-btn--active'
                                                                        : ''
                                                                }
                                                                onClick={() =>
                                                                    handleFormatText('underline')
                                                                }
                                                            >
                                                                u
                                                            </button>
                                                            <button
                                                                className={`o-btn--strike ${
                                                                    formatState.strikethrough
                                                                        ? 'o-btn--active'
                                                                        : ''
                                                                }`}
                                                                onClick={() =>
                                                                    handleFormatText('strikeThrough')
                                                                }
                                                            >
                                                                del
                                                            </button>
                                                            <button onClick={handleIncreaseFontSize}>
                                                                A+
                                                            </button>
                                                            <button onClick={handleDecreaseFontSize}>
                                                                A-
                                                            </button>

                                                            {/* Przycisk „Undo” */}
                                                            <button
                                                                className="o-btn--undo"
                                                                onClick={() => handleUndo(item.id)}
                                                                disabled={
                                                                    !undoHistories[item.id] ||
                                                                    undoHistories[item.id].length < 2
                                                                }
                                                            >
                                                                {t('undo')}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    // Gdy nie edytujemy, ale nie ma tytułu, a jest opis
                                                    item.title === '' &&
                                                    item.description !== '' && (
                                                        <input
                                                            type="text"
                                                            readOnly
                                                            value={
                                                                stripHtml(item.description).length > 40
                                                                    ? stripHtml(item.description).substring(0, 40) + '...'
                                                                    : stripHtml(item.description)
                                                            }
                                                            placeholder="Enter description"
                                                            onClick={() => showDescription(String(item.id))}
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
