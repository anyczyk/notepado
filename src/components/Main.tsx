import React, { useState, useEffect } from 'react';
import NotepadSave from "./subpages/notepadSave";
import NotepadSaveLanguage from "./subpages/notepadSaveLanguage";

const Main: React.FC = () => {
    const [activePage, setActivePage] = useState<string>(() => {
        // Determine initial page based on the URL path
        const path = window.location.pathname;
        if (path === '/notepadSave') return 'notepadSave';
        if (path === '/notepadsavelanguage') return 'notepadsavelanguage';
        return ''; // Default to Homepage
    });

    // Function to update the URL and state when a page is loaded
    const updatePage = (page: string, url: string) => {
        setActivePage(page);
        window.history.pushState({ page }, '', url);
    };

    // Handlers to set the active page
    const loadNotepadSave = () => updatePage('', '/');

    const loadNotepadSaveLanguage = () => updatePage('notepadsavelanguage', '/notepadsavelanguage');


    // Effect to handle back/forward navigation using the popstate event
    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            const path = window.location.pathname;
            if (path === '/notepadsavelanguage') setActivePage('notepadsavelanguage');
            else setActivePage('');
        };

        window.addEventListener('popstate', handlePopState);

        // Cleanup event listener on component unmount
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    return (
        <>
            <nav className="notepad-main-nav">
                <ul>
                    <li>
                        <button onClick={loadNotepadSave}>Notepad</button>
                    </li>
                    <li>
                        <button onClick={loadNotepadSaveLanguage}><i className="icon-language"></i> Language</button>
                    </li>
                </ul>
            </nav>
            <div className="notepad-body">
                {activePage === 'notepadsavelanguage' && <NotepadSaveLanguage />}
                {activePage === '' && <NotepadSave />}
            </div>
        </>
    );
};

export default Main;