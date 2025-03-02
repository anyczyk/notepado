#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Funkcja do wyświetlania instrukcji użycia
function printUsage() {
    console.log(`Użycie: node copy.js <plik_źródłowy.json> <plik_docelowy.json> <klucz>`);
    console.log(`Przykład: node copy.js source.json destination.json nazwaKlucza`);
}

// Sprawdzenie liczby argumentów
const args = process.argv.slice(2);
if (args.length !== 3) {
    console.error('Błędna liczba argumentów.');
    printUsage();
    process.exit(1);
}

const [sourceFile, destFile, key] = args;

// Ścieżki do plików
const folderPath = path.join(__dirname, 'copy-and-overwrite');
const sourcePath = path.join(folderPath, sourceFile);
const destPath = path.join(folderPath, destFile);

// Funkcja do czytania pliku JSON
function readJSON(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error(`Błąd podczas czytania lub parsowania pliku ${filePath}:`, err.message);
        process.exit(1);
    }
}

// Funkcja do zapisywania pliku JSON z każdym obiektem w jednej linii
function writeJSONCompact(filePath, data) {
    try {
        // Tworzymy tablicę stringów, gdzie każdy obiekt jest stringiem JSON w jednej linii
        const jsonLines = data.map(item => JSON.stringify(item));
        // Łączymy je w tablicę JSON z nowymi liniami
        const jsonString = '[\n' + jsonLines.join(',\n') + '\n]';
        fs.writeFileSync(filePath, jsonString, 'utf8');
    } catch (err) {
        console.error(`Błąd podczas zapisywania pliku ${filePath}:`, err.message);
        process.exit(1);
    }
}

// Czytanie plików JSON
const sourceData = readJSON(sourcePath);
const destData = readJSON(destPath);

// Sprawdzenie, czy oba pliki zawierają tablice
if (!Array.isArray(sourceData)) {
    console.error(`Plik źródłowy ${sourceFile} nie zawiera tablicy JSON.`);
    process.exit(1);
}

if (!Array.isArray(destData)) {
    console.error(`Plik docelowy ${destFile} nie zawiera tablicy JSON.`);
    process.exit(1);
}

// Sprawdzenie, czy długości tablic są takie same
if (sourceData.length !== destData.length) {
    console.error('Tablice w plikach źródłowym i docelowym mają różne długości.');
    process.exit(1);
}

// Kopiowanie wartości klucza
for (let i = 0; i < sourceData.length; i++) {
    const sourceItem = sourceData[i];
    const destItem = destData[i];

    if (sourceItem.hasOwnProperty(key)) {
        destData[i][key] = sourceItem[key];
    } else {
        console.warn(`Item ${i} w pliku źródłowym nie zawiera klucza "${key}".`);
    }
}

// Zapisywanie zmodyfikowanego pliku docelowego z obiektami w jednej linii
writeJSONCompact(destPath, destData);

console.log(`Kopiowanie klucza "${key}" z ${sourceFile} do ${destFile} zakończone sukcesem.`);
