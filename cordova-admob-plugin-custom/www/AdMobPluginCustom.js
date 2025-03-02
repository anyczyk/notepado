const AdMobPluginCustom = {
    // Inicjalizacja SDK (raz, np. zaraz po starcie aplikacji)
    initializeAdMob: function(successCallback, errorCallback) {
        cordova.exec(
            successCallback,
            errorCallback,
            "AdMobPluginCustom", // nazwa "service" (z <feature name="AdMobPluginCustom">)
            "initializeAdMob",   // nazwa metody w Java
            []
        );
    },

    // Ładowanie reklamy pełnoekranowej (interstitial)
    loadInterstitial: function(successCallback, errorCallback) {
        cordova.exec(
            successCallback,
            errorCallback,
            "AdMobPluginCustom",
            "loadInterstitial",
            []
        );
    },

    // Wyświetlenie załadowanej reklamy pełnoekranowej
    showInterstitial: function(successCallback, errorCallback) {
        cordova.exec(
            successCallback,
            errorCallback,
            "AdMobPluginCustom",
            "showInterstitial",
            []
        );
    }
};

module.exports = AdMobPluginCustom;