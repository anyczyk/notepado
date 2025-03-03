package com.plugin.cordova.admobplugincustom;

import android.app.Activity;
import android.util.Log;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;

// [NEW] Pamiętaj o imporcie:
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.AdSize;

import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;

public class AdMobPluginCustom extends CordovaPlugin {

    private static final String TAG = "AdMobPluginCustom";
    private InterstitialAd mInterstitialAd;

    // [NEW] Zmienne pomocnicze do banera
    private AdView mBannerAdView = null;           // Obiekt banera
    private FrameLayout mBannerContainer = null;   // Kontener na baner

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
        // [NEW] Obsługa akcji banera
        else if ("showBanner".equals(action)) {
            cordova.getActivity().runOnUiThread(() -> showBanner(callbackContext));
            return true;
        } else if ("hideBanner".equals(action)) {
            cordova.getActivity().runOnUiThread(() -> hideBanner(callbackContext));
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

        AdRequest adRequest = new AdRequest.Builder().build();

        InterstitialAd.load(
            activity,
//             "ca-app-pub-4263972941440160/6170539132", // Production Interstitial ID
            "ca-app-pub-3940256099942544/1033173712", // Test Interstitial ID
            adRequest,
            new InterstitialAdLoadCallback() {
                @Override
                public void onAdLoaded(InterstitialAd interstitialAd) {
                    Log.d(TAG, "Interstitial loaded");
                    mInterstitialAd = interstitialAd;

                    mInterstitialAd.setFullScreenContentCallback(new FullScreenContentCallback() {
                        @Override
                        public void onAdDismissedFullScreenContent() {
                            Log.d(TAG, "Reklama zamknięta. Możesz załadować nową.");
                            mInterstitialAd = null;
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
     */
    private void showInterstitial(final CallbackContext callbackContext) {
        final Activity activity = cordova.getActivity();

        if (mInterstitialAd != null) {
            mInterstitialAd.show(activity);
            mInterstitialAd = null;
            callbackContext.success("Ad shown");
        } else {
            callbackContext.error("Interstitial is not ready yet");
        }
    }

    // =========================================================================
    // [NEW] Poniżej metody dotyczące BANERA
    // =========================================================================

    /**
     * Wyświetla baner reklamowy (na dole ekranu).
     * Jeśli baner jest już załadowany, będzie odświeżony/widoczny.
     */
    private void showBanner(final CallbackContext callbackContext) {
        final Activity activity = cordova.getActivity();

        if (mBannerAdView == null) {
            // Inicjujemy AdView z testowym ID banera
            mBannerAdView = new AdView(activity);
            mBannerAdView.setAdSize(AdSize.BANNER);
            // Testowy Banner:
            mBannerAdView.setAdUnitId("ca-app-pub-4263972941440160/4790541683");
            // Produkcyjny Banner (przykład – jeśli chcesz użyć później):
            // mBannerAdView.setAdUnitId("ca-app-pub-4263972941440160/XXXXXXX");
        }

        // Kontener (FrameLayout) w którym będzie baner. Można go dodać do "root" widoku Activity.
        if (mBannerContainer == null) {
            mBannerContainer = new FrameLayout(activity);
            // LayoutParams, by baner był przyklejony do dołu ekranu:
            FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
            );
            // Dodajemy kontener do głównego widoku Activity
            activity.addContentView(mBannerContainer, params);
        }

        // Jeśli baner nie jest jeszcze dodany do kontenera, to go dodaj
        if (mBannerAdView.getParent() == null) {
            mBannerContainer.addView(mBannerAdView,
                    new FrameLayout.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            ViewGroup.LayoutParams.WRAP_CONTENT
                    )
            );
        }

        // Ładujemy/odświeżamy reklamę
        AdRequest adRequest = new AdRequest.Builder().build();
        mBannerAdView.loadAd(adRequest);

        callbackContext.success("Banner shown (loading/refreshing).");
    }

    /**
     * Usuwa baner reklamowy z ekranu (jeśli jest obecny).
     */
    private void hideBanner(final CallbackContext callbackContext) {
        if (mBannerAdView != null && mBannerContainer != null) {
            // Usunięcie widoku banera z kontenera
            mBannerContainer.removeView(mBannerAdView);
            mBannerAdView.destroy();
            mBannerAdView = null;
        }
        callbackContext.success("Banner hidden/removed.");
    }
}
