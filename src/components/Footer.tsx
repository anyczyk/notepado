import React, { useEffect, useState } from 'react';

const Footer: React.FC = () => {
    const [platform, setPlatform] = useState<string>('browser');

    useEffect(() => {
        const onDeviceReady = () => {
            const currentPlatform = (window.cordova && (window as any).cordova.file) ? 'device' : 'browser';
            setPlatform(currentPlatform);
        };

        document.addEventListener('deviceready', onDeviceReady, false);

        if (!window.cordova) {
            onDeviceReady();
        }

        return () => {
            document.removeEventListener('deviceready', onDeviceReady);
        };
    }, []);

    return (
        <footer>
            <p>&copy; Semdesign - {platform}</p>
        </footer>
    );
};

export default Footer;