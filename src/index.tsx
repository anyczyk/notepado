import './i18n';
import './fonts/fontello/css/fontello.css';
import './styles/styles.scss';
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import Header from './components/Header';
import Main from './components/Main';
import Footer from './components/Footer';
import { NotepadoProvider } from './context/NotepadoContext';
import { HashRouter } from 'react-router-dom';

const App: React.FC = () => {
    const [mainMenuVisible, setMainMenuVisible] = useState(false);

    return (
        <div className={`o ${mainMenuVisible ? 'o-menu-visible' : ''}`}>
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
