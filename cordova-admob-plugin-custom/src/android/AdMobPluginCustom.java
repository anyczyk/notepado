package com.plugin.cordova.admobplugincustom;

import android.app.Activity;
import android.util.Log;

import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;
import com.google.android.gms.ads.LoadAdError;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;

public class AdMobPluginCustom extends CordovaPlugin {

    private static final String TAG = "AdMobPluginCustom";

    private InterstitialAd mInterstitialAd;

    @Override
    public boolean execute(String action, JSONArray args, final CallbackContext callbackContext) throws JSONException {
        if ("initializeAdMob".equals(action)) {
            cordova.getActivity().runOnUiThread(() -> initializeAdMob(callbackContext));
            return true;
        } else if ("loadInterstitial".equals(action)) {
            cordova.getActivity().runOnUiThread(() -> loadInterstitial(callbackContext));
            return true;
        } else if ("showInterstitial".equals(action)) {
            cordova.getActivity().runOnUiThread(() -> showInterstitial(callbackContext));
            return true;
        }
        return false;
    }

    /**
     * Inicjalizuje AdMob SDK. Wywołaj raz np. na starcie aplikacji.
     */
    private void initializeAdMob(final CallbackContext callbackContext) {
        MobileAds.initialize(cordova.getActivity(), initializationStatus -> {
            Log.d(TAG, "AdMob SDK initialized");
            callbackContext.success("AdMob SDK initialized");
        });
    }

    /**
     * Ładuje reklamę pełnoekranową (interstitial) do pamięci, by można ją było
     * później szybko wyświetlić.
     */
    private void loadInterstitial(final CallbackContext callbackContext) {
        final Activity activity = cordova.getActivity();

        // Tworzymy zapytanie o reklamę
        AdRequest adRequest = new AdRequest.Builder().build();

        // Ładowanie reklamy (w tle)
        InterstitialAd.load(
            activity,
            "ca-app-pub-4263972941440160/1860443826",  // test: ca-app-pub-3940256099942544/1033173712
            adRequest,
            new InterstitialAdLoadCallback() {
                @Override
                public void onAdLoaded(InterstitialAd interstitialAd) {
                    Log.d(TAG, "Interstitial loaded");
                    mInterstitialAd = interstitialAd;

                    // Ustawiamy callback zdarzeń (np. zamknięcie reklamy)
                    mInterstitialAd.setFullScreenContentCallback(new FullScreenContentCallback() {
                        @Override
                        public void onAdDismissedFullScreenContent() {
                            Log.d(TAG, "Reklama zamknięta. Możesz załadować nową.");
                            mInterstitialAd = null;
                            // Ewentualnie automatycznie załaduj kolejną:
                            // loadInterstitial(callbackContext);
                            // Wysyłamy zdarzenie do JavaScript, aby poinformować, że reklama została zamknięta
                            cordova.getActivity().runOnUiThread(() -> {
                                webView.loadUrl("javascript:cordova.fireDocumentEvent('adDismissed');");
                            });
                        }

                        @Override
                        public void onAdFailedToShowFullScreenContent(AdError adError) {
                            Log.e(TAG, "Błąd wyświetlania: " + adError.getMessage());
                            mInterstitialAd = null;
                        }

                        @Override
                        public void onAdShowedFullScreenContent() {
                            Log.d(TAG, "Reklama wyświetlona w pełnym ekranie.");
                        }
                    });

                    callbackContext.success("Interstitial ad loaded");
                }

                @Override
                public void onAdFailedToLoad(LoadAdError adError) {
                    Log.e(TAG, "Failed to load interstitial: " + adError.getMessage());
                    mInterstitialAd = null;
                    callbackContext.error("Interstitial failed to load: " + adError.getMessage());
                }
            }
        );
    }

    /**
     * Wyświetla wcześniej załadowaną reklamę pełnoekranową.
     * Jeżeli nie została jeszcze wczytana, zwraca błąd.
     */
    private void showInterstitial(final CallbackContext callbackContext) {
        final Activity activity = cordova.getActivity();

        if (mInterstitialAd != null) {
            mInterstitialAd.show(activity);

            // Po wyświetleniu reklamy AdMob zwykle unieważnia obiekt reklamowy
            // (zależnie od wersji), więc warto go wyzerować:
            mInterstitialAd = null;

            callbackContext.success("Ad shown");
        } else {
            callbackContext.error("Interstitial is not ready yet");
        }
    }
}
