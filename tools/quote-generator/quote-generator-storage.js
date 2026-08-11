/**
 * Quote Generator - Draft persistence
 * Ray2Volt Solar Toolbox
 *
 * Two stores, because they hold different things:
 *   - localStorage keeps the serializable draft (everything in the model).
 *   - IndexedDB keeps the annexure File/Blob content, which localStorage
 *     cannot hold, keyed by the attachment ID recorded in the draft.
 *
 * Nothing here is uploaded anywhere. A draft survives a refresh on the same
 * browser and device and nowhere else.
 *
 * Every entry point resolves rather than throws: losing a draft must never
 * take the tool down with it.
 */
(function (root, factory) {
    'use strict';
    const config = (typeof require === 'function' && typeof module === 'object')
        ? require('./quote-generator-config.js')
        : root.QuoteGeneratorConfig;
    const model = (typeof require === 'function' && typeof module === 'object')
        ? require('./quote-generator-model.js')
        : root.QuoteGeneratorModel;

    const api = factory(config, model, root);

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.QuoteGeneratorStorage = api;
    }
}(typeof self !== 'undefined' ? self : this, function (Config, Model, globalScope) {
    'use strict';

    const STATUS = {
        IDLE: 'idle',
        SAVING: 'saving',
        SAVED: 'saved',
        FAILED: 'failed'
    };

    function hasLocalStorage() {
        try {
            return Boolean(globalScope && globalScope.localStorage);
        } catch (error) {
            return false;
        }
    }

    function hasIndexedDb() {
        try {
            return Boolean(globalScope && globalScope.indexedDB);
        } catch (error) {
            return false;
        }
    }

    // ---------------------------------------------------------------------
    // Draft (localStorage)
    // ---------------------------------------------------------------------

    function saveDraft(state) {
        if (!hasLocalStorage()) {
            return { ok: false, reason: 'unavailable' };
        }

        try {
            globalScope.localStorage.setItem(Config.STORAGE.draftKey, Model.serialize(state));
            return { ok: true };
        } catch (error) {
            // Most often a quota error from a very large draft.
            return { ok: false, reason: 'write-failed', error };
        }
    }

    /**
     * Reads the stored draft. Returns the same shape as Model.deserialize, so a
     * future schema version arrives as { ok: false, reason: 'future-version' }
     * and the caller can offer a new draft instead of crashing on load.
     */
    function loadDraft() {
        if (!hasLocalStorage()) {
            return { ok: false, reason: 'unavailable', state: null };
        }

        let raw = null;

        try {
            raw = globalScope.localStorage.getItem(Config.STORAGE.draftKey);
        } catch (error) {
            return { ok: false, reason: 'read-failed', state: null };
        }

        return Model.deserialize(raw);
    }

    function clearDraft() {
        if (!hasLocalStorage()) return { ok: false, reason: 'unavailable' };

        try {
            globalScope.localStorage.removeItem(Config.STORAGE.draftKey);
            return { ok: true };
        } catch (error) {
            return { ok: false, reason: 'write-failed', error };
        }
    }

    /**
     * Debounced autosave. Reports Saving… immediately so the status is honest
     * about work in flight, then Saved locally or Save failed.
     */
    function createAutosave(options) {
        const settings = options || {};
        const delay = settings.delay || Config.STORAGE.autosaveDelayMs;
        const onStatus = settings.onStatus || function () {};
        let timer = null;

        function flush(state) {
            const result = saveDraft(state);
            onStatus(result.ok ? STATUS.SAVED : STATUS.FAILED, result);
            return result;
        }

        return {
            schedule(state) {
                onStatus(STATUS.SAVING);
                if (timer) clearTimeout(timer);
                timer = setTimeout(() => {
                    timer = null;
                    flush(state);
                }, delay);
            },
            flush(state) {
                if (timer) {
                    clearTimeout(timer);
                    timer = null;
                }
                return flush(state);
            },
            cancel() {
                if (timer) {
                    clearTimeout(timer);
                    timer = null;
                }
            }
        };
    }

    // ---------------------------------------------------------------------
    // Annexure blobs (IndexedDB)
    // ---------------------------------------------------------------------

    let dbPromise = null;

    function openDatabase() {
        if (!hasIndexedDb()) {
            return Promise.reject(new Error('IndexedDB is not available in this browser.'));
        }

        if (!dbPromise) {
            dbPromise = new Promise((resolve, reject) => {
                const request = globalScope.indexedDB.open(
                    Config.STORAGE.databaseName,
                    Config.STORAGE.databaseVersion
                );

                request.onupgradeneeded = () => {
                    const db = request.result;
                    if (!db.objectStoreNames.contains(Config.STORAGE.annexureStore)) {
                        db.createObjectStore(Config.STORAGE.annexureStore, { keyPath: 'id' });
                    }
                };

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error || new Error('Could not open the annexure store.'));
                request.onblocked = () => reject(new Error('The annexure store is blocked by another open tab.'));
            }).catch(error => {
                dbPromise = null;
                throw error;
            });
        }

        return dbPromise;
    }

    function withStore(mode, work) {
        return openDatabase().then(db => new Promise((resolve, reject) => {
            const transaction = db.transaction(Config.STORAGE.annexureStore, mode);
            const store = transaction.objectStore(Config.STORAGE.annexureStore);
            let result;

            try {
                result = work(store);
            } catch (error) {
                reject(error);
                return;
            }

            transaction.oncomplete = () => resolve(result && result.result !== undefined ? result.result : result);
            transaction.onerror = () => reject(transaction.error || new Error('Annexure store transaction failed.'));
            transaction.onabort = () => reject(transaction.error || new Error('Annexure store transaction aborted.'));
        }));
    }

    /** Stores the raw file for an annexure against its attachment ID. */
    function saveAnnexureFile(id, file) {
        return withStore('readwrite', store => store.put({
            id,
            blob: file,
            fileName: file && file.name ? file.name : '',
            fileType: file && file.type ? file.type : '',
            fileSize: file && file.size ? file.size : 0,
            savedAt: new Date().toISOString()
        }));
    }

    function loadAnnexureFile(id) {
        return withStore('readonly', store => store.get(id))
            .then(record => (record && record.blob) ? record : null);
    }

    function loadAllAnnexureFiles() {
        return withStore('readonly', store => store.getAll())
            .then(records => {
                const byId = {};
                (records || []).forEach(record => {
                    if (record && record.id) byId[record.id] = record;
                });
                return byId;
            });
    }

    function deleteAnnexureFile(id) {
        return withStore('readwrite', store => store.delete(id));
    }

    function clearAnnexureFiles() {
        return withStore('readwrite', store => store.clear());
    }

    /** Removes stored blobs whose annexure is no longer in the draft. */
    function pruneAnnexureFiles(keepIds) {
        const keep = {};
        (keepIds || []).forEach(id => { keep[id] = true; });

        return loadAllAnnexureFiles().then(records => {
            const stale = Object.keys(records).filter(id => !keep[id]);
            return Promise.all(stale.map(deleteAnnexureFile));
        });
    }

    /**
     * New Quotation: drop every stored annexure blob and then the draft.
     *
     * Order matters. Clearing the draft first and failing on the blobs would
     * destroy the quotation while leaving the customer's documents behind, so
     * the draft is only removed once the blobs are actually gone.
     */
    function clearAll() {
        if (!hasIndexedDb()) {
            const result = clearDraft();
            return Promise.resolve({ ok: result.ok !== false, annexures: false });
        }

        return clearAnnexureFiles()
            .then(() => {
                const result = clearDraft();
                return { ok: result.ok !== false, annexures: true };
            })
            .catch(error => ({ ok: false, annexures: false, error }));
    }

    return {
        STATUS,
        hasLocalStorage,
        hasIndexedDb,
        saveDraft,
        loadDraft,
        clearDraft,
        createAutosave,
        openDatabase,
        saveAnnexureFile,
        loadAnnexureFile,
        loadAllAnnexureFiles,
        deleteAnnexureFile,
        clearAnnexureFiles,
        pruneAnnexureFiles,
        clearAll
    };
}));
