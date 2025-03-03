const AdMobPluginCustom = {
    // Inicjalizacja SDK (raz, np. zaraz po starcie aplikacji)
    initializeAdMob: function (successCallback, errorCallback) {
        cordova.exec(
            successCallback,
            errorCallback,
            "AdMobPluginCustom",
            "initializeAdMob",
            []
        );
    },

    // Ładowanie reklamy pełnoekranowej (interstitial)
    loadInterstitial: function (successCallback, errorCallback) {
        cordova.exec(
            successCallback,
            errorCallback,
            "AdMobPluginCustom",
            "loadInterstitial",
            []
        );
    },

    // Wyświetlenie załadowanej reklamy pełnoekranowej
    showInterstitial: function (successCallback, errorCallback) {
        cordova.exec(
            successCallback,
            errorCallback,
            "AdMobPluginCustom",
            "showInterstitial",
            []
        );
    },

    // [NEW] Wyświetlenie banera
    showBanner: function (successCallback, errorCallback) {
        cordova.exec(
            successCallback,
            errorCallback,
            "AdMobPluginCustom",
            "showBanner",
            []
        );
    },

    // [NEW] Ukrycie banera
    hideBanner: function (successCallback, errorCallback) {
        cordova.exec(
            successCallback,
            errorCallback,
            "AdMobPluginCustom",
            "hideBanner",
            []
        );
    }
};

module.exports = AdMobPluginCustom;
