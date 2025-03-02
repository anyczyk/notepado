const fs = require('fs');
const path = require('path');
const languagesDir = path.join(__dirname, 'src', 'languages');
const newTranslationsPath = path.join(__dirname, 'new_translations.json');

const readJSON = (filePath) => {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error(`Error reading file ${filePath}:`, err);
        return null;
    }
};

const writeJSON = (filePath, data) => {
    try {
        const jsonContent = JSON.stringify(data, null, 2); // 2-space indentation for readability
        fs.writeFileSync(filePath, jsonContent, 'utf8');
        console.log(`Updated file: ${filePath}`);
    } catch (err) {
        console.error(`Error writing file ${filePath}:`, err);
    }
};

const updateTranslations = () => {
    const newTranslations = readJSON(newTranslationsPath);
    if (!newTranslations) {
        console.error('Failed to read new translations.');
        return;
    }

    for (const [lang, translations] of Object.entries(newTranslations)) {
        const langDir = path.join(languagesDir, lang);
        const langFile = path.join(langDir, 'translation.json');

        if (!fs.existsSync(langDir)) {
            console.warn(`Folder for language "${lang}" does not exist. Skipping...`);
            continue;
        }

        if (!fs.existsSync(langFile)) {
            console.warn(`translation.json file for language "${lang}" does not exist. Creating a new file.`);
            fs.writeFileSync(langFile, JSON.stringify({}, null, 2), 'utf8');
        }

        const existingTranslations = readJSON(langFile);
        if (!existingTranslations) {
            console.warn(`Failed to read file for language "${lang}". Skipping...`);
            continue;
        }

        let updated = false;
        for (const [key, value] of Object.entries(translations)) {
            if (existingTranslations.hasOwnProperty(key)) {
                console.log(`Key "${key}" exists in file "${langFile}". Overwriting with new value.`);
            } else {
                console.log(`Adding key "${key}" to language "${lang}".`);
            }
            existingTranslations[key] = value;
            updated = true;
        }

        if (updated) {
            writeJSON(langFile, existingTranslations);
        } else {
            console.log(`No changes made for language "${lang}".`);
        }
    }

    console.log('Translation update completed.');
};

updateTranslations();






// const fs = require('fs');
// const path = require('path');
// const languagesDir = path.join(__dirname, 'src', 'languages');
// const newTranslationsPath = path.join(__dirname, 'new_translations.json');
//
// const readJSON = (filePath) => {
//     try {
//         const data = fs.readFileSync(filePath, 'utf8');
//         return JSON.parse(data);
//     } catch (err) {
//         console.error(`Error reading file ${filePath}:`, err);
//         return null;
//     }
// };
// const writeJSON = (filePath, data) => {
//     try {
//         const jsonContent = JSON.stringify(data, null, 2); // 2-space indentation for readability
//         fs.writeFileSync(filePath, jsonContent, 'utf8');
//         console.log(`Updated file: ${filePath}`);
//     } catch (err) {
//         console.error(`Error writing file ${filePath}:`, err);
//     }
// };
//
// const updateTranslations = () => {
//     const newTranslations = readJSON(newTranslationsPath);
//     if (!newTranslations) {
//         console.error('Failed to read new translations.');
//         return;
//     }
//
//     for (const [lang, translations] of Object.entries(newTranslations)) {
//         const langDir = path.join(languagesDir, lang);
//         const langFile = path.join(langDir, 'translation.json');
//
//         if (!fs.existsSync(langDir)) {
//             console.warn(`Folder for language "${lang}" does not exist. Skipping...`);
//             continue;
//         }
//
//         if (!fs.existsSync(langFile)) {
//             console.warn(`translation.json file for language "${lang}" does not exist. Creating a new file.`);
//             fs.writeFileSync(langFile, JSON.stringify({}, null, 2), 'utf8');
//         }
//
//         const existingTranslations = readJSON(langFile);
//         if (!existingTranslations) {
//             console.warn(`Failed to read file for language "${lang}". Skipping...`);
//             continue;
//         }
//
//         let updated = false;
//         for (const [key, value] of Object.entries(translations)) {
//             if (existingTranslations.hasOwnProperty(key)) {
//                 console.warn(`Key "${key}" already exists in file "${langFile}". Skipping...`);
//             } else {
//                 existingTranslations[key] = value;
//                 console.log(`Added key "${key}" to language "${lang}".`);
//                 updated = true;
//             }
//         }
//
//         if (updated) {
//             writeJSON(langFile, existingTranslations);
//         } else {
//             console.log(`No new keys to add for language "${lang}".`);
//         }
//     }
//
//     console.log('Translation update completed.');
// };
//
// updateTranslations();