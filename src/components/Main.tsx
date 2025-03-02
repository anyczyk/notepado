import React, { useContext } from 'react';
import NotepadSave from "./subpages/notepadSave";
// import Settings from "./subpages/Settings";
import { NotepadoContext } from '../context/NotepadoContext';
import { Routes, Route, Navigate } from 'react-router-dom';

const Main: React.FC = () => {
    const { isDescriptionVisible } = useContext(NotepadoContext);

    return (
        <div className={`o-main-content ${isDescriptionVisible ? 'o-main-content--single' : ''}`}>
            <Routes>
                {/* Ścieżka główna – ładuje NotepadSave */}
                <Route path="/" element={<NotepadSave />} />
                {/* Przekierowanie dla wszystkich nieznanych ścieżek na "/" */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
    );
};

export default Main;
