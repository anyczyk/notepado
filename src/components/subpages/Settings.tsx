import React from 'react';
import { useTranslation } from 'react-i18next';

const Settings: React.FC = () => {
    const { t, i18n } = useTranslation();
    return (
        <div className="o-container">
            <h2>{t('settings')}</h2>
            <p>...</p>
        </div>
    );
};

export default Settings;