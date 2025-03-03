const dataExport = async (dataToExport) => {
    if (window.cordova) { // Cordova
        try {
            const jsonData = JSON.stringify(dataToExport, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json' });
            const fileName = `index-db-${Date.now()}.json`;

            window.resolveLocalFileSystemURL(cordova.file.dataDirectory, async (dirEntry) => {
                try {
                    const fileEntry = await new Promise((resolve, reject) => {
                        dirEntry.getFile(fileName, { create: true, exclusive: false }, resolve, reject);
                    });

                    const fileWriter = await new Promise((resolve, reject) => {
                        fileEntry.createWriter(resolve, reject);
                    });

                    fileWriter.onwriteend = async () => {
                        const filePath = fileEntry.nativeURL;
                        console.log("File saved at:", filePath);

                        if (window.plugins && window.plugins.socialsharing) {
                            window.plugins.socialsharing.share(
                                'Exported data',
                                'Exported data',
                                filePath,
                                null,
                                () => {
                                    alert("The file has been successfully exported and shared.");
                                },
                                (error) => {
                                    console.error("Sharing failed:", error);
                                    alert("Could not share file: " + error);
                                }
                            );
                        } else {
                            alert("Missing SocialSharing plugin.");
                        }
                    };

                    fileWriter.onerror = (e) => {
                        console.error("File save failed:", e);
                        alert("Could not save file: " + e.toString());
                    };

                    fileWriter.write(blob);
                } catch (error) {
                    console.error("Error during file operations:", error);
                    alert("An error occurred while exporting the file.");
                }
            }, (error) => {
                console.error("Error resolving file system:", error);
                alert("An error occurred while resolving the file system: " + error.toString());
            });

        } catch (error) {
            console.error("Export failed: ", error);
            alert("An error occurred during export.");
        }
    } else { // Browser
        try {
            const jsonData = JSON.stringify(dataToExport, null, 2);

            const fileName = `index-db-${Date.now()}.json`;
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();

            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Browser export failed:", error);
            alert("An error occurred during browser export.");
        }
    }
};

export default dataExport;
