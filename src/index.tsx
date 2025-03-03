import './i18n';
import './fonts/fontello/css/fontello.css';
import './styles/styles.scss';
import React, {useEffect, useState} from 'react';
import ReactDOM from 'react-dom/client';
import Header from './components/Header';
import Main from './components/Main';
import Footer from './components/Footer';
import { NotepadoProvider } from './context/NotepadoContext';
import { HashRouter } from 'react-router-dom';

declare global {
    interface Window {
        StatusBar?: {
            backgroundColorByHexString: (color: string) => void;
        };
        NavigationBar?: {
            backgroundColorByHexString: (color: string) => void;
        };
    }
}

const App: React.FC = () => {
    const [mainMenuVisible, setMainMenuVisible] = useState(false);
    const [admobBanner, setAdmobBanner] = useState(false);

    useEffect(() => {
        // Funkcja wywoływana po zdarzeniu deviceready
        console.log("useEffect ready");
        const onDeviceReady = () => {
            // Sprawdzamy, czy uruchomiono w środowisku Cordova
            if (!window.cordova) {
                console.log("Cordova nie istnieje");
                return;
            }

            console.log('Device is ready');

            // 1. Inicjalizacja AdMob SDK
            (window as any).AdMobPluginCustom.initializeAdMob(
                () => {
                    console.log('SDK initialized');
                    // 2. Ładowanie reklamy pełnoekranowej (interstitial)
                    (window as any).AdMobPluginCustom.loadInterstitial(
                        () => {
                            console.log('Interstitial loaded');
                        },
                        (err) => {
                            console.log('Failed to load interstitial: ' + err);
                        }
                    );
                    (window as any).AdMobPluginCustom.showBanner(
                        () => {
                            setAdmobBanner(true);
                            console.log("Banner is showing/being loaded");
                        },
                        (err) => {
                            console.log("Banner error:" + err);
                        }
                    );
                },
                (err) => {
                    console.log('Error initializing AdMob' + err);
                }
            );

        };

        document.addEventListener('deviceready', onDeviceReady, false);

        // Funkcja wywoływana po zamknięciu reklamy (adDismissed)
        const onAdDismissed = () => {
            console.log('Interstitial ad dismissed, loading new one...');

            (window as any).AdMobPluginCustom.loadInterstitial(
                () => {
                    console.log('Interstitial loaded');
                },
                (err) => {
                    console.log('Failed to load interstitial: ' + err);
                }
            );

            if (window.StatusBar) {
                window.StatusBar.backgroundColorByHexString('#181818');
            }
        };

        document.addEventListener('adDismissed', onAdDismissed, false);

        return () => {
            document.removeEventListener('deviceready', onDeviceReady, false);
            document.removeEventListener('adDismissed', onAdDismissed, false);
        };
    }, []);

    return (
        <div className={`o ${mainMenuVisible ? 'o-menu-visible' : ''} ${admobBanner ? 'o-banner-visible' : ''}`}>
            <NotepadoProvider>
                <Header mainMenuVisible={mainMenuVisible} setMainMenuVisible={setMainMenuVisible} />
                <Main />
                <Footer />
            </NotepadoProvider>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <HashRouter>
        <App />
    </HashRouter>
);
