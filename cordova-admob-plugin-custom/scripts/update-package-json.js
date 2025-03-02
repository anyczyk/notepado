#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

module.exports = function (context) {
    const projectRoot = context.opts.projectRoot;
    const packageJsonPath = path.join(projectRoot, 'package.json');
    const pluginName = "com.plugin.cordova.admobplugincustom";
    const pluginPath = "file:cordova-admob-plugin-custom";

    if (!fs.existsSync(packageJsonPath)) {
        console.warn("package.json nie został znaleziony w katalogu projektu.");
        return;
    }

    let packageJson;
    try {
        packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    } catch (err) {
        console.error("Błąd parsowania package.json:", err);
        return;
    }

    if (!packageJson.dependencies) {
        packageJson.dependencies = {};
    }

    if (!packageJson.dependencies[pluginName]) {
        packageJson.dependencies[pluginName] = pluginPath;
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
        console.log(`Dodano ${pluginName} do dependencies w package.json.`);
    } else {
        console.log(`Wpis dla ${pluginName} już istnieje w package.json.`);
    }
};
