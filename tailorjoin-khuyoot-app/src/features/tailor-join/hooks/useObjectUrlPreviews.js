import { useEffect, useRef } from 'react';

const useObjectUrlPreviews = (files) => {
    const previewUrlsRef = useRef({});

    useEffect(() => {
        const objectUrls = [];

        if (files && files.length > 0) {
            for (const file of files) {
                const objectUrl = URL.createObjectURL(file);
                objectUrls.push(objectUrl);
                previewUrlsRef.current[file.name] = objectUrl;
            }
        }

        return () => {
            objectUrls.forEach(url => URL.revokeObjectURL(url));
        };
    }, [files]);

    return previewUrlsRef.current;
};

export default useObjectUrlPreviews;