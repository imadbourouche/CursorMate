export const storage = {
    get: (keys) => {
        return new Promise((resolve) => {
            chrome.storage.sync.get(keys, (result) => {
                resolve(result);
            });
        });
    },
    set: (items) => {
        return new Promise((resolve) => {
            chrome.storage.sync.set(items, () => {
                resolve();
            });
        });
    },
    onChanged: (callback) => {
        chrome.storage.onChanged.addListener(callback);
    }
};
