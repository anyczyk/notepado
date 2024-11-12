// DragAndDropFormList.tsx
import React, { useState, useEffect, ChangeEvent } from 'react';
import {
    DragDropContext,
    Droppable,
    Draggable,
    DropResult,
} from '@hello-pangea/dnd';
import { translations } from '../elements/notepadSaveTranslations';
import NavButtons from './NavButtons';
import {
    openDB,
    saveData,
    loadAllData,
    deleteData,
    isValidFormData,
    saveDataToStorage,
    loadDataFromStorage,
    FormData,
} from '../elements/functions';

const DragAndDropFormList: React.FC = () => {
    const [items, setItems] = useState<FormData[]>([]);
    const [visibleDescriptions, setVisibleDescriptions] = useState<string | null>(null);
    const [isDescriptionVisible, setIsDescriptionVisible] = useState(false);
    const [confirmRemoveId, setConfirmRemoveId] = useState<number | null>(null);
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

    const language: string = localStorage.getItem('notepadSaveLanguage') || 'en';
    const currentTranslations = translations[language] || translations.en;

    useEffect(() => {
        const fetchData = async () => {
            const loadedData = await loadAllData();
            const orderedData = loadOrderFromStorage(loadedData);
            setItems(orderedData);
        };
        fetchData();
    }, []);

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
            return reorderedItems;
        }
        return loadedItems;
    };

    const handleOnDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const reorderedItems = Array.from(items);
        const [reorderedItem] = reorderedItems.splice(result.source.index, 1);
        reorderedItems.splice(result.destination.index, 0, reorderedItem);

        setItems(reorderedItems);
        saveOrderToStorage(reorderedItems);
    };

    const handleAddNewItem = async () => {
        const newItem: FormData = {
            id: Date.now(),
            title: '',
            description: '',
            date: new Date().toLocaleString('pl-PL', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            }),
        };
        setItems((prevItems) => [newItem, ...prevItems]);
        setVisibleDescriptions(String(newItem.id));
        setIsDescriptionVisible(true);
    };

    const handleTitleChange = (e: ChangeEvent<HTMLInputElement>, id: number) => {
        const newTitle = e.target.value;
        setItems((prevItems) =>
            prevItems.map((item) =>
                item.id === id ? { ...item, title: newTitle } : item
            )
        );

        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        const newTimeoutId = setTimeout(() => {
            document.getElementById(`save-button-${id}`)?.click();
        }, 1000);

        setTimeoutId(newTimeoutId);
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

        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        const newTimeoutId = setTimeout(() => {
            document.getElementById(`save-button-${id}`)?.click();
        }, 1000);

        setTimeoutId(newTimeoutId);
    };

    const handleSaveItem = async (id: number) => {
        const updatedItems = items.map((item) =>
            item.id === id
                ? {
                    ...item,
                    date: new Date().toLocaleString('pl-PL', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                    }),
                }
                : item
        );

        setItems(updatedItems);

        const itemToSave = updatedItems.find((item) => item.id === id);
        if (itemToSave) {
            await saveData(itemToSave);
            saveOrderToStorage(updatedItems);
        }
    };

    const handleRemoveItem = async (id: number) => {
        await deleteData(id);
        setItems((prevItems) => {
            const updatedItems = prevItems.filter((item) => item.id !== id);
            saveOrderToStorage(updatedItems);
            return updatedItems;
        });
        setConfirmRemoveId(null);
    };

    const toggleDescription = (id: string) => {
        setVisibleDescriptions((prevId) => (prevId === id ? null : id));
    };

    const showDescription = (id: string) => {
        setVisibleDescriptions(id);
        setIsDescriptionVisible(true);
    };

    const hideDescription = (id: string) => {
        setVisibleDescriptions(null);
        setIsDescriptionVisible(false);
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
                alert('Notes imported successfully.');
            } catch (error) {
                console.error('Error importing data:', error);
                alert('An error occurred while importing data.');
            } finally {
                e.target.value = '';
            }
        }
    };

    return (
        <div className={`notepad ${isDescriptionVisible ? 'notepad-single' : ''}`}>
            <NavButtons
                handleAddNewItem={handleAddNewItem}
                handleCopyIndexedDB={handleCopyIndexedDB}
                handleFileChange={handleFileChange}
                currentTranslations={currentTranslations}
            />
            <DragDropContext onDragEnd={handleOnDragEnd}>
                <Droppable droppableId="droppable">
                    {(provided) => (
                        <ul
                            className="notepad-list"
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                        >
                            {items.map((item, index) => (
                                <Draggable
                                    key={item.id}
                                    draggableId={item.id.toString()}
                                    index={index}
                                >
                                    {(provided) => (
                                        <li
                                            className={`notepad-item ${
                                                String(visibleDescriptions) === String(item.id)
                                                    ? 'notepad-active-item'
                                                    : ''
                                            }`}
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                        >
                                            <div
                                                className="notepad-item-move"
                                                {...provided.dragHandleProps}
                                                style={{ cursor: 'grab' }}
                                            >
                                                <i className="icon-move"></i>
                                                {currentTranslations.move}
                                                <p className="notepad-item-date">{item.date}</p>
                                            </div>
                                            <div className="notepad-options">
                                                {String(visibleDescriptions) ===
                                                String(item.id) ? (
                                                    <>
                                                        <button
                                                            onClick={() =>
                                                                hideDescription(String(item.id))
                                                            }
                                                        >
                                                            <i className="icon-level-up"></i>
                                                            {currentTranslations.returnToNotesList}
                                                        </button>
                                                        <button
                                                            id={`save-button-${item.id}`}
                                                            onClick={() => handleSaveItem(item.id)}
                                                        >
                                                            <i className="icon-floppy"></i>
                                                            {currentTranslations.save}
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() =>
                                                            showDescription(String(item.id))
                                                        }
                                                    >
                                                        <i className="icon-pencil"></i>
                                                        {currentTranslations.edit}
                                                    </button>
                                                )}
                                                {confirmRemoveId === item.id ? (
                                                    <div className="notepad-modal-remove">
                                                        <div className="notepad-modal-remove__container">
                                                            <p>
                                                                {
                                                                    currentTranslations.confirmNoteDeletion
                                                                }
                                                            </p>
                                                            <div className="notepad-modal-remove__row">
                                                                <button
                                                                    onClick={() => {
                                                                        hideDescription(
                                                                            String(item.id)
                                                                        );
                                                                        handleRemoveItem(item.id);
                                                                    }}
                                                                >
                                                                    <i className="icon-cancel-circled"></i>
                                                                    {currentTranslations.pleaseRemove}
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        setConfirmRemoveId(null)
                                                                    }
                                                                >
                                                                    <i className="icon-cancel-alt-filled"></i>
                                                                    {currentTranslations.cancel}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        className="notepad-btn-remove"
                                                        onClick={() =>
                                                            handleConfirmRemoveItem(item.id)
                                                        }
                                                    >
                                                        <i className="icon-cancel-circled"></i>
                                                        {currentTranslations.remove}
                                                    </button>
                                                )}
                                            </div>

                                            {!(
                                                String(visibleDescriptions) !== String(item.id) &&
                                                item.title === ''
                                            ) && (
                                                <input
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
                                                !(
                                                    String(visibleDescriptions) !==
                                                    String(item.id) &&
                                                    item.description === ''
                                                ) && (
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
        </div>
    );
};

export default DragAndDropFormList;
