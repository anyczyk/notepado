import './fonts/fontello/css/fontello.css';
import './styles/styles.scss';
import React from 'react';
import ReactDOM from 'react-dom/client';
import Header from './components/Header';
import Main from './components/Main';
import Footer from './components/Footer';

const App: React.FC = () => (
    <>
        <Header />
        <Main />
        <Footer />
    </>
);

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);