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
        items, setItems
    } = useContext(NotepadoContext);

    const [filteredItems, setFilteredItems] = useState<FormData[]>([]);
    const [confirmRemoveId, setConfirmRemoveId] = useState<number | null>(null);
    const [saveTimers, setSaveTimers] = useState<{ [key: number]: NodeJS.Timeout }>({});
    const [currentSort, setCurrentSort] = useState<string>('my-sort');
    const [activeColorButtons, setActiveColorButtons] = useState<{ [id: number]: boolean }>({});
    const [focusedItemId, setFocusedItemId] = useState<number | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [undoHistories, setUndoHistories] = useState<{ [id: number]: string[] }>({});
    const editorRef = useRef<HTMLDivElement | null>(null);

    const [formatState, setFormatState] = useState({
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
    });

    const [fontSizeLevel, setFontSizeLevel] = useState<number>(3);

    const [isSelectionEmpty, setIsSelectionEmpty] = useState(true);

    const mutationObserverRef = useRef<MutationObserver | null>(null);
    const checkEditorEmpty = (editor: HTMLDivElement) => {
        const text = editor.innerText.trim();
        if (!text) {
            editor.classList.add("o-empty-text-box");
        } else {
            editor.classList.remove("o-empty-text-box");
        }
    };

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
    }, [setSelectSort]);

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
            default:
        }

        setFilteredItems(newFiltered);
    }, [items, searchTerm, currentSort]);

    useEffect(() => {
        const handleDocSelectionChange = () => {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) {
                setIsSelectionEmpty(true);
                return;
            }
            const range = selection.getRangeAt(0);
            const editor = editorRef.current;
            if (
                editor &&
                editor.contains(range.commonAncestorContainer) &&
                !selection.isCollapsed
            ) {
                setIsSelectionEmpty(false);
            } else {
                setIsSelectionEmpty(true);
            }
        };

        document.addEventListener('selectionchange', handleDocSelectionChange);
        return () => {
            document.removeEventListener('selectionchange', handleDocSelectionChange);
        };
    }, []);

    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) return;

        if (editor.childNodes.length === 0) {
            const initialDiv = document.createElement('div');
            initialDiv.innerHTML = '<br/>';
            editor.appendChild(initialDiv);
        } else {
            normalizeEditorContent(editor);
        }
        checkEditorEmpty(editor);

        mutationObserverRef.current = new MutationObserver((mutations) => {
            let contentChanged = false;
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeName === 'BR' && mutation.target === editor) {
                            const div = document.createElement('div');
                            div.innerHTML = '<br/>';
                            const parent = node.parentNode;
                            if (parent) {
                                parent.replaceChild(div, node);
                            }
                            placeCursorInNode(div);
                            contentChanged = true;
                        } else if (
                            node.nodeType === Node.TEXT_NODE &&
                            mutation.target === editor
                        ) {
                            const div = document.createElement('div');
                            div.textContent = node.textContent || '';
                            const parent = node.parentNode;
                            if (parent) {
                                parent.replaceChild(div, node);
                            }
                            contentChanged = true;
                        } else if (
                            node.nodeType === Node.ELEMENT_NODE &&
                            mutation.target === editor &&
                            node.nodeName !== 'DIV'
                        ) {
                            const replacement = document.createElement('div');
                            replacement.innerHTML = (node as HTMLElement).innerHTML;
                            const parent = node.parentNode;
                            if (parent) {
                                parent.replaceChild(replacement, node);
                            }
                            contentChanged = true;
                        }
                    });
                }
            });

            if (contentChanged) {
                if (visibleDescriptions) {
                    const currentDescId = parseInt(visibleDescriptions, 10);
                    if (!isNaN(currentDescId)) {
                        const html = editor.innerHTML;
                        handleDescriptionChange(html, currentDescId);
                    }
                }
                checkEditorEmpty(editor);
            }
        });

        mutationObserverRef.current.observe(editor, {
            childList: true,
            subtree: false,
        });

        return () => {
            if (mutationObserverRef.current) {
                mutationObserverRef.current.disconnect();
            }
        };
    }, [visibleDescriptions]);

    const handleKeyDownEditor = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            document.execCommand('insertHTML', false, '<div><br/></div>');
        }
    };

    const normalizeEditorContent = (editor: HTMLDivElement) => {
        const children = Array.from(editor.childNodes);
        let currentBlock: HTMLDivElement | null = null;

        children.forEach((node) => {
            if (node.nodeName === 'BR') {
                editor.removeChild(node);
                currentBlock = null;
            } else if (node.nodeName === 'DIV') {
                currentBlock = null;
            } else {
                if (!currentBlock) {
                    currentBlock = document.createElement('div');
                    editor.insertBefore(currentBlock, node);
                }
                currentBlock.appendChild(node);
            }
        });

        if (editor.childNodes.length === 0) {
            const div = document.createElement('div');
            div.innerHTML = '<br/>';
            editor.appendChild(div);
        }
    };

    const placeCursorInNode = (node: Node) => {
        const range = document.createRange();
        range.selectNodeContents(node);
        range.collapse(false);
        const sel = window.getSelection();
        if (sel) {
            sel.removeAllRanges();
            sel.addRange(range);
        }
    };

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
            toDoList: ''
        };
        setItems((prev) => [newItem, ...prev]);
        setFilteredItems((prev) => [newItem, ...prev]);

        setVisibleDescriptions(String(newItem.id));
        setIsDescriptionVisible(true);
        setFocusedItemId(newItem.id);

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

    const scheduleSaveItem = (id: number) => {
        if (saveTimers[id]) {
            clearTimeout(saveTimers[id]);
        }
        const newTimer = setTimeout(() => handleSaveItem(id), 500);
        setSaveTimers((prev) => ({ ...prev, [id]: newTimer }));
    };

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

    const handleDescriptionChange = (newDescription: string, id: number) => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = newDescription;
        const text = tempDiv.textContent?.trim();
        const hasText = text && text !== '';
        const hasImage = tempDiv.querySelector('img') || tempDiv.querySelector('svg');
        if (!hasText && !hasImage) {
            newDescription = "";
        }
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

    const updateActiveButtons = () => {
        setFormatState({
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline'),
            strikethrough: document.queryCommandState('strikeThrough'),
        });

        const sizeStr = document.queryCommandValue('fontSize');
        if (sizeStr) {
            const parsed = parseInt(sizeStr, 10);
            setFontSizeLevel(!isNaN(parsed) ? parsed : 3);
        } else {
            setFontSizeLevel(3);
        }

        if (editorRef.current) {
            checkEditorEmpty(editorRef.current);
            editorRef.current.focus();
        }
    };

    const handleFormatText = (
        command: 'bold' | 'italic' | 'underline' | 'strikeThrough'
    ) => {
        document.execCommand(command, false, '');
        updateActiveButtons();
    };

    const handleIncreaseFontSize = () => {
        if (!window.getSelection) return;
        const newLevel = Math.min(fontSizeLevel + 1, 7);
        setFontSizeLevel(newLevel);
        document.execCommand('fontSize', false, String(newLevel));
        updateActiveButtons();
    };

    const handleDecreaseFontSize = () => {
        if (!window.getSelection) return;
        const newLevel = Math.max(fontSizeLevel - 1, 1);
        setFontSizeLevel(newLevel);
        document.execCommand('fontSize', false, String(newLevel));
        updateActiveButtons();
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
        setUndoHistories((prev) => {
            const { [id]: _omit, ...rest } = prev;
            return rest;
        });
    };

    const showDescription = (id: string) => {
        setVisibleDescriptions(id);
        setIsDescriptionVisible(true);
        setFocusedItemId(Number(id));

        const numId = Number(id);
        const currentItem = items.find((it) => it.id === numId);
        const existingText = currentItem?.description || '';
        setUndoHistories((prev) => ({
            ...prev,
            [numId]: prev[numId] || [existingText],
        }));
    };

    const hideDescription = async (id: string) => {
        setVisibleDescriptions(null);
        setIsDescriptionVisible(false);

        const item = items.find((it) => String(it.id) === id);
        if (item && item.title.trim() === '' && item.description.trim() === '') {
            await deleteData(item.id);
        }

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

    const toggleColorButton = (id: number) => {
        setActiveColorButtons((prev) => {
            if (prev[id]) {
                return {};
            } else {
                return { [id]: true };
            }
        });
    };

    const pushUndoHistory = (id: number, content: string) => {
        setUndoHistories((prev) => {
            const currentHistory = prev[id] || [''];
            if (currentHistory[currentHistory.length - 1] === content) {
                return prev;
            }
            const maxStates = 100;
            const newHistory = [...currentHistory, content].slice(-maxStates);
            return {
                ...prev,
                [id]: newHistory,
            };
        });
    };

    const handleUndo = (id: number) => {
        setUndoHistories((prev) => {
            const currentHistory = prev[id] || [''];
            if (currentHistory.length < 2) {
                return prev;
            }
            const newHistory = currentHistory.slice(0, -1);
            const previousContent = newHistory[newHistory.length - 1];
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

    const handleClearSelection = () => {
        const editorElement = editorRef.current;
        if (!editorElement) return;

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        let targetElem: Node = range.commonAncestorContainer;
        if (targetElem.nodeType === Node.TEXT_NODE) {
            targetElem = (targetElem as Text).parentElement!;
        }
        if (!(targetElem instanceof HTMLElement)) return;

        if (targetElem.classList.contains('o-editor__main')) {
            const fragment = range.cloneContents();
            const tempDiv = document.createElement('div');
            tempDiv.appendChild(fragment);
            const htmlFragment = tempDiv.innerHTML;
            const cleanText = htmlFragment
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<[^>]+>/g, '');
            range.deleteContents();
            const textNode = document.createTextNode(cleanText);
            range.insertNode(textNode);
        } else {
            let current: HTMLElement = targetElem as HTMLElement;
            while (current.parentElement && current.parentElement !== editorElement) {
                current = current.parentElement;
            }
            if (current === editorElement || current.classList.contains('o-editor__main')) {
                const fragment = range.cloneContents();
                const tempDiv = document.createElement('div');
                tempDiv.appendChild(fragment);
                const htmlFragment = tempDiv.innerHTML;
                const cleanText = htmlFragment
                    .replace(/<br\s*\/?>/gi, '\n')
                    .replace(/<[^>]+>/g, '');
                range.deleteContents();
                const textNode = document.createTextNode(cleanText);
                range.insertNode(textNode);
            } else {
                const plainText = current.textContent || '';
                const newWrapper = document.createElement('div');
                newWrapper.textContent = plainText;
                if (current.parentElement) {
                    current.parentElement.replaceChild(newWrapper, current);
                }
            }
        }

        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.selectNodeContents(editorElement);
        newRange.collapse(false);
        selection.addRange(newRange);

        if (visibleDescriptions) {
            const currentDescId = parseInt(visibleDescriptions, 10);
            if (!isNaN(currentDescId)) {
                pushUndoHistory(currentDescId, editorElement.innerHTML);
                handleDescriptionChange(editorElement.innerHTML, currentDescId);
            }
        }
        updateActiveButtons();
    };

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
            .replace(/<\/?[^>]+(>|$)/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    };

    const handleToggleToDo = async (id: number) => {
        setItems((prevItems) => {
            return prevItems.map((it) => {
                if (it.id === id) {
                    const toggledValue = it.toDoList === 'true' ? '' : 'true';
                    return { ...it, toDoList: toggledValue };
                }
                return it;
            });
        });

        setFilteredItems((prevFiltered) => {
            return prevFiltered.map((it) => {
                if (it.id === id) {
                    const toggledValue = it.toDoList === 'true' ? '' : 'true';
                    return { ...it, toDoList: toggledValue };
                }
                return it;
            });
        });

        const currentItem = items.find((it) => it.id === id);
        if (currentItem) {
            const toggledValue = currentItem.toDoList === 'true' ? '' : 'true';
            const updatedItem: FormData = { ...currentItem, toDoList: toggledValue };
            try {
                await saveData(updatedItem);
            } catch (error) {
                console.error('Error toggling to-do:', error);
            }
        }
    };

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
                                                    ${selectedIds.includes(item.id) ? 'o-item--check' : 'o-item--check-empty'}
                                                    ${String(visibleDescriptions) === String(item.id) ? 'o-active-item' : ''}
                                                    ${item.toDoList === 'true' ? 'o-item--to-do' : ''}
                                                `}
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
                                                            {t('created')}: {item.creationDate}
                                                        </span>
                                                        <br />
                                                        {item.lastModifiedDate && (
                                                            <span className="o-last-modified-date">
                                                                {t('modified')}: {item.lastModifiedDate}
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>

                                                <div className="o-options">
                                                    {String(visibleDescriptions) === String(item.id) ? (
                                                        <>
                                                            <button
                                                                title={t('go_back')}
                                                                className="o-circle-btn o-circle-btn--go-back o-circle-btn--fixed"
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
                                                                {t('go_back')}
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            onClick={() =>
                                                                showDescription(String(item.id))
                                                            }
                                                        >
                                                            <i className="icon-pencil"></i>
                                                        </button>
                                                    )}
                                                    <button
                                                        className={`o-note-bg ${activeColorButtons[item.id] ? 'o-bg-dark' : ''}`}
                                                        onClick={() => toggleColorButton(item.id)}
                                                    >
                                                        <i className={activeColorButtons[item.id] ? 'icon-cancel' : 'icon-down-open'} />
                                                        <span className={`o-note-bg__box-color ${item.bgColor}`} />
                                                    </button>
                                                    {String(visibleDescriptions) === String(item.id) && (
                                                        <button
                                                            className="o-btn-save"
                                                            onClick={() => handleSaveItem(item.id)}
                                                        >
                                                            <i className="icon-floppy"></i>
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
                                                                            hideDescription(String(item.id));
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
                                                        </button>
                                                    )}

                                                    {String(visibleDescriptions) === String(item.id) && (
                                                        <button
                                                            className="o-btn-to-do ml-auto"
                                                            onClick={() => handleToggleToDo(item.id)}
                                                        >
                                                            <span className="o-cloud-info">{t('list')}</span>
                                                            <i className="icon-list-numbered"></i>
                                                            {/*<i className="icon-clipboard"></i>*/}
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

                                                    {String(visibleDescriptions) !== String(item.id) && (
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

                                                {!(String(visibleDescriptions) !== String(item.id) && item.title === '') && (
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
                                                        placeholder={`${t('enter_title')}...`}
                                                        onClick={() =>
                                                            showDescription(String(item.id))
                                                        }
                                                    />
                                                )}

                                                {visibleDescriptions === String(item.id) ? (
                                                    <div className="o-editor">
                                                        <div
                                                            title={(item.toDoList === 'true') ? `${t('enter_items_into_the_list')}:` : `${t('enter_text')}...`}
                                                            className="o-editor__main"
                                                            contentEditable
                                                            suppressContentEditableWarning
                                                            onKeyDown={handleKeyDownEditor}
                                                            onKeyUp={(e) => {
                                                                updateActiveButtons();
                                                                pushUndoHistory(item.id, e.currentTarget.innerHTML);
                                                                checkEditorEmpty(e.currentTarget);
                                                            }}
                                                            onMouseUp={() => updateActiveButtons()}
                                                            onBlur={(e) => {
                                                                const el = e.currentTarget;
                                                                if (el.innerHTML.trim() === '<br>') {
                                                                    el.innerHTML = '';
                                                                }
                                                                const newDesc = el.innerHTML;
                                                                handleDescriptionChange(newDesc, item.id);
                                                                checkEditorEmpty(el);
                                                            }}
                                                            ref={(el) => {
                                                                if (el) {
                                                                    editorRef.current = el;
                                                                    if (el.innerHTML.trim() === '' && item.description.trim() !== '') {
                                                                        el.innerHTML = item.description;
                                                                        normalizeEditorContent(el);
                                                                    } else if (el.innerHTML.trim() === '') {
                                                                        el.innerHTML = '<div><br/></div>';
                                                                    }
                                                                    checkEditorEmpty(el);
                                                                }
                                                            }}
                                                        />
                                                        <div className="o-editor__buttons">
                                                            <button
                                                                className={formatState.bold ? 'o-btn--active' : ''}
                                                                onClick={() => handleFormatText('bold')}
                                                            >
                                                                b
                                                            </button>
                                                            <button
                                                                className={formatState.italic ? 'o-btn--active' : ''}
                                                                onClick={() => handleFormatText('italic')}
                                                            >
                                                                i
                                                            </button>
                                                            <button
                                                                className={formatState.underline ? 'o-btn--active' : ''}
                                                                onClick={() => handleFormatText('underline')}
                                                            >
                                                                u
                                                            </button>
                                                            <button
                                                                className={`o-btn--strike ${formatState.strikethrough ? 'o-btn--active' : ''}`}
                                                                onClick={() => handleFormatText('strikeThrough')}
                                                            >
                                                                del
                                                            </button>
                                                            <button onClick={handleIncreaseFontSize}>
                                                                A+
                                                            </button>
                                                            <button onClick={handleDecreaseFontSize}>
                                                                A-
                                                            </button>
                                                            <button
                                                                className="o-btn--undo"
                                                                onClick={() => handleUndo(item.id)}
                                                                disabled={!undoHistories[item.id] || undoHistories[item.id].length < 2}
                                                            >
                                                                {t('undo')}
                                                            </button>
                                                            <button
                                                                className="o-btn--clear"
                                                                onClick={handleClearSelection}
                                                                disabled={isSelectionEmpty}
                                                            >
                                                                {t('clear')}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
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
