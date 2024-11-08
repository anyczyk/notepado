import React, { useState, useEffect, ChangeEvent } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { translations } from '../elements/notepadSaveTranslations';

declare global {
    interface Window {
        resolveLocalFileSystemURL(uri: string, successCallback: (entry: any) => void, errorCallback?: (error: any) => void): void;
    }
}

declare global {
    interface Window {
        cordova: Cordova;
    }
}

interface FormData {
    id: number;
    title: string;
    description: string;
    date: string;
}

const openDB = async (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('myDatabase', 1);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains('formData')) {
                db.createObjectStore('formData', { keyPath: 'id', autoIncrement: true });
            }
        };

        request.onsuccess = (event) => {
            resolve((event.target as IDBOpenDBRequest).result);
        };

        request.onerror = (event) => {
            reject((event.target as IDBOpenDBRequest).error);
        };
    });
};

const saveData = async (data: FormData): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction('formData', 'readwrite');
    const store = transaction.objectStore('formData');
    store.put(data);
};

const loadAllData = async (): Promise<FormData[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('formData', 'readonly');
        const store = transaction.objectStore('formData');
        const request = store.getAll();

        request.onsuccess = (event) => {
            resolve((event.target as IDBRequest<FormData[]>).result);
        };

        request.onerror = (event) => {
            reject((event.target as IDBRequest).error);
        };
    });
};

const deleteData = async (id: number): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction('formData', 'readwrite');
    const store = transaction.objectStore('formData');
    store.delete(id);
};

// Function to validate FormData
const isValidFormData = (data: any): data is FormData => {
    return (
        typeof data === 'object' &&
        data !== null &&
        typeof data.id === 'number' &&
        typeof data.title === 'string' &&
        typeof data.description === 'string' &&
        typeof data.date === 'string'
    );
};

const DragAndDropFormList: React.FC = () => {
    const [items, setItems] = useState<FormData[]>([]);
    const [visibleDescriptions, setVisibleDescriptions] = useState<string | null>(null);
    const [isDescriptionVisible, setIsDescriptionVisible] = useState(false);
    const [confirmRemoveId, setConfirmRemoveId] = useState<number | null>(null);
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

    const language: string = localStorage.getItem('notepadSaveLanguage') || 'en';
    const currentTranslations = translations[language] || translations.en;

    // Function to save data to localStorage
    const saveDataToStorage = (key: string, value: string): void => {
        localStorage.setItem(key, value);
    };

    // Function to load data from localStorage
    const loadDataFromStorage = (key: string): string | null => {
        return localStorage.getItem(key);
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
            return reorderedItems;
        }
        return loadedItems;
    };

    useEffect(() => {
        const fetchData = async () => {
            const loadedData = await loadAllData();
            const orderedData = loadOrderFromStorage(loadedData);
            setItems(orderedData);
        };
        fetchData();
    }, []);

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

    const handleDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>, id: number) => {
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


    // const requestPermissions = () => {
    //     const permissions = (window as any).cordova.plugins.permissions;
    //     const perms = [
    //         permissions.WRITE_EXTERNAL_STORAGE,
    //         permissions.READ_EXTERNAL_STORAGE
    //     ];
    //
    //     permissions.requestPermissions(perms, (status: any) => {
    //         if (!status.hasPermission) {
    //             alert("Missing required permissions to write files.");
    //         }
    //     }, (error: any) => {
    //         console.error("Error requesting permissions:", error);
    //         alert("Failed to obtain permissions.");
    //     });
    // };

    // const handleExportIndexedDB = async () => {
    //     try {
    //         console.log('Loading data from IndexedDB...');
    //         const allData = await loadAllData();
    //         if (!allData) {
    //             throw new Error('No data returned from IndexedDB');
    //         }
    //
    //         console.log('Converting data to JSON...');
    //         const jsonData = JSON.stringify(allData, null, 2);
    //         const blob = new Blob([jsonData], { type: 'application/json' });
    //
    //         const onDeviceReady = () => {
    //             if (window.cordova) {
    //                 requestPermissions();
    //                 saveFile();
    //             } else {
    //                 console.log('Browser environment - Cordova functions are not available.');
    //             }
    //         };
    //
    //         const saveFile = () => {
    //             const mimeType = 'application/json';
    //             const fileName = 'data.json';
    //
    //             const intent = (window as any).cordova.plugins.intentShim;
    //
    //             intent.startActivityForResult(
    //                 {
    //                     action: intent.ACTION_CREATE_DOCUMENT,
    //                     type: mimeType,
    //                     extras: {
    //                         'android.intent.extra.TITLE': fileName
    //                     }
    //                 },
    //                 (result: any) => {
    //                     if (result && result.data) {
    //                         const uri = result.data;
    //                         writeFile(uri);
    //                     } else {
    //                         alert('Failed to obtain file URI.');
    //                     }
    //                 },
    //                 (error: any) => {
    //                     console.error('Error creating document:', error);
    //                     alert('Failed to create document.');
    //                 }
    //             );
    //         };
    //
    //         const writeFile = (uri: string) => {
    //             window.resolveLocalFileSystemURL(uri, (fileEntry: any) => {
    //                 fileEntry.createWriter((fileWriter: any) => {
    //                     fileWriter.onwriteend = () => {
    //                         alert('File was successfully exported.');
    //                     };
    //                     fileWriter.onerror = (e: any) => {
    //                         console.error('Failed to save file:', e);
    //                         alert('Failed to export file.');
    //                     };
    //                     fileWriter.write(blob);
    //                 });
    //             }, (error: any) => {
    //                 console.error('Error accessing file:', error);
    //                 alert('Failed to access file.');
    //             });
    //         };
    //
    //         if (window.cordova) {
    //             document.addEventListener('deviceready', onDeviceReady, false);
    //         } else {
    //             onDeviceReady();
    //         }
    //     } catch (error) {
    //         console.error('Detailed error:', error);
    //         alert('An error occurred while exporting data from IndexedDB. Details: ' + error);
    //     }
    // };


    const handleCopyIndexedDB = async () => {
        try {
            console.log('Loading data from IndexedDB...');
            const allData = await loadAllData();
            if (!allData) {
                throw new Error('No data returned from IndexedDB');
            }
            console.log('Converting data to JSON...');
            const jsonData = JSON.stringify(allData, null, 2);

            // Copy jsonData to the clipboard
            await navigator.clipboard.writeText(jsonData);
        } catch (error) {
            console.error('Detailed error:', error);
            // alert('An error occurred while copying data from IndexedDB. Details: ' + error);
        }
    };

    // Function to handle file change event
    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const text = await file.text();
                const importedData = JSON.parse(text);
                // Validate the data format
                if (!Array.isArray(importedData)) {
                    alert('Invalid data format: expected an array of notes.');
                    return;
                }
                // Validate each item
                const validData: FormData[] = [];
                for (const item of importedData) {
                    if (isValidFormData(item)) {
                        validData.push(item);
                    } else {
                        alert('Invalid data format in one of the notes.');
                        return;
                    }
                }
                // Get existing data to check for ID conflicts
                const existingData = await loadAllData();
                const existingIds = new Set(existingData.map(item => item.id));
                // Adjust IDs if necessary
                let maxExistingId = existingData.reduce((maxId, item) => Math.max(maxId, item.id), 0);
                const newData = validData.map(item => {
                    if (existingIds.has(item.id)) {
                        // Adjust the ID
                        maxExistingId += 1;
                        return { ...item, id: maxExistingId };
                    } else {
                        return item;
                    }
                });
                // Save new items to IndexedDB
                for (const item of newData) {
                    await saveData(item);
                }
                // Update the items state
                setItems(prevItems => {
                    const updatedItems = [...prevItems, ...newData];
                    saveOrderToStorage(updatedItems);
                    return updatedItems;
                });
                alert('Notes imported successfully.');
            } catch (error) {
                console.error('Error importing data:', error);
                alert('An error occurred while importing data.');
            } finally {
                // Reset the file input
                e.target.value = '';
            }
        }
    };

    return (
        <div className={`notepad ${isDescriptionVisible ? 'notepad-single' : ''}`}>

            <button title={currentTranslations.addNewNote} className="notepad-add-new-note notepad-add-new-note--fixed" onClick={handleAddNewItem}>
                <i className="icon-plus-circle"></i>
            </button>
            <div className="notepad-submenu">
                <button title={currentTranslations.addNewNote} className="notepad-add-new-note"
                        onClick={handleAddNewItem}>
                    <i className="icon-plus-circle"></i>
                    {currentTranslations.addNewNote}
                </button>
                <button className="notepad-copy-json" onClick={handleCopyIndexedDB}>Copy json note</button>
                {/*<button className="notepad-export" onClick={handleExportIndexedDB}>Export note to json</button>*/}
                <button className="notepad-import"
                        onClick={() => document.getElementById('import-file-input')?.click()}>
                    Import note
                </button>
            </div>
            <input
                type="file"
                id="import-file-input"
                accept="application/json"
                style={{display: 'none'}}
                onChange={handleFileChange}
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
                                                String(visibleDescriptions) === String(item.id) ? 'notepad-active-item' : ''
                                            }`}
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                        >
                                            <div
                                                className="notepad-item-move"
                                                {...provided.dragHandleProps}
                                                style={{cursor: 'grab'}}
                                            >
                                                <i className="icon-move"></i>
                                                {currentTranslations.move}

                                                <p className="notepad-item-date">{item.date}</p>
                                            </div>
                                            <div className="notepad-options">
                                                {String(visibleDescriptions) === String(item.id) ? (
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
                                                            <p>{currentTranslations.confirmNoteDeletion}</p>
                                                            <div className="notepad-modal-remove__row">
                                                                <button
                                                                    onClick={() => {
                                                                        hideDescription(String(item.id));
                                                                        handleRemoveItem(item.id);
                                                                    }}
                                                                >
                                                                    <i className="icon-cancel-circled"></i>
                                                                    {currentTranslations.pleaseRemove}
                                                                </button>
                                                                <button
                                                                    onClick={() => setConfirmRemoveId(null)}
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

                                            {(!(String(visibleDescriptions) !== String(item.id) && (item.title === ''))) &&
                                                <input
                                                    type="text"
                                                    value={item.title}
                                                    onChange={(e) => handleTitleChange(e, item.id)}
                                                    placeholder="Enter title"
                                                    onClick={() => showDescription(String(item.id))}
                                                />}

                                            {visibleDescriptions === String(item.id) ? (
                                                <textarea
                                                    value={item.description}
                                                    onChange={(e) =>
                                                        handleDescriptionChange(e, item.id)
                                                    }
                                                    placeholder="Enter description"
                                                ></textarea>
                                            ) : (
                                                ((item.title === '') && !(String(visibleDescriptions) !== String(item.id) && (item.description === ''))) &&
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={
                                                        item.description.length > 40
                                                            ? `${item.description.substring(0, 40)}...`
                                                            : item.description
                                                    }
                                                    placeholder="Enter description"
                                                    onClick={() => showDescription(String(item.id))}
                                                />
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
