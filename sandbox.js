(() => {
    const DOM_IDS = {
        apiBaseInput: 'sandbox-api-base',
        saveApi: 'sandbox-save-api',
        openDashboard: 'sandbox-open-dashboard',
        tokenStatus: 'sandbox-token-status',
        userInfo: 'sandbox-user-info',
        clearToken: 'sandbox-clear-token',
        refreshUser: 'sandbox-refresh-user',
        endpoint: 'sandbox-endpoint',
        runCall: 'sandbox-run-call',
        copyResult: 'sandbox-copy-result',
        response: 'sandbox-response',
        notes: 'sandbox-notes',
        saveNotes: 'sandbox-save-notes',
        clearNotes: 'sandbox-clear-notes',
    };

    const select = (id) => document.getElementById(id);

    const getApiBase = () => {
        const base =
            window.lpwfAuth?.getApiBase?.() || window.lpwfAuth?.ensureBaseForLocation?.() || '/api';
        return base.replace(/\/$/, '');
    };

    const updateTokenInfo = () => {
        const token = window.lpwfAuth?.getToken?.();
        const tokenEl = select(DOM_IDS.tokenStatus);
        if (tokenEl) {
            tokenEl.textContent = token ? `${token.slice(0, 6)}…${token.slice(-6)}` : 'Assente';
        }
    };

    const showUserInfo = (info) => {
        const userEl = select(DOM_IDS.userInfo);
        if (!userEl) return;
        if (!info) {
            userEl.textContent = 'Non disponibile';
            return;
        }
        const parts = [info.nome || info.name, info.email].filter(Boolean).join(' · ');
        userEl.textContent = parts || `ID ${info.id}`;
    };

    const loadStoredNotes = () => {
        try {
            const saved = window.localStorage.getItem('lpwf_sandbox_notes');
            const notes = select(DOM_IDS.notes);
            if (notes && saved) {
                notes.value = saved;
            }
        } catch (err) {
            /* ignore storage errors */
        }
    };

    const saveNotes = () => {
        const notes = select(DOM_IDS.notes);
        if (!notes) return;
        try {
            window.localStorage.setItem('lpwf_sandbox_notes', notes.value);
        } catch (err) {
            console.warn('Impossibile salvare le note', err);
        }
    };

    const clearNotes = () => {
        const notes = select(DOM_IDS.notes);
        if (!notes) return;
        notes.value = '';
        try {
            window.localStorage.removeItem('lpwf_sandbox_notes');
        } catch (err) {
            /* ignore */
        }
    };

    const fetchWithAuth = async (endpoint) => {
        const apiBase = getApiBase();
        const url = `${apiBase}/${endpoint.replace(/^\/+/, '')}`;
        const headers = window.lpwfAuth?.buildHeaders?.({}, false) || {};

        const response = await fetch(url, { headers });
        const text = await response.text();
        let payload = null;
        try {
            payload = text ? JSON.parse(text) : null;
        } catch (err) {
            return { ok: response.ok, status: response.status, raw: text || '' };
        }
        return { ok: response.ok, status: response.status, data: payload };
    };

    const renderResponse = (result) => {
        const container = select(DOM_IDS.response);
        if (!container) return;
        const payload = {
            ok: result.ok,
            status: result.status,
            ...(result.data ? { data: result.data } : {}),
            ...(result.raw ? { raw: result.raw } : {}),
        };
        container.textContent = JSON.stringify(payload, null, 2);
    };

    const refreshUserInfo = async () => {
        try {
            const result = await fetchWithAuth('auth/me');
            if (!result.ok) {
                showUserInfo(null);
                renderResponse(result);
                return;
            }
            window.lpwfAuth?.setCurrentUser?.(result.data);
            showUserInfo(result.data);
            renderResponse(result);
        } catch (err) {
            console.error('Errore durante il recupero utente', err);
        } finally {
            updateTokenInfo();
        }
    };

    const initEvents = () => {
        const apiInput = select(DOM_IDS.apiBaseInput);
        if (apiInput) {
            apiInput.value = getApiBase();
        }

        const saveBtn = select(DOM_IDS.saveApi);
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const value = apiInput?.value?.trim();
                if (!value) return;
                const finalBase = window.lpwfAuth?.setApiBase?.(value) || value;
                if (apiInput) apiInput.value = finalBase;
            });
        }

        const openDashboardBtn = select(DOM_IDS.openDashboard);
        if (openDashboardBtn) {
            openDashboardBtn.addEventListener('click', () => {
                window.location.href = 'mia_dashboard.html';
            });
        }

        const clearTokenBtn = select(DOM_IDS.clearToken);
        if (clearTokenBtn) {
            clearTokenBtn.addEventListener('click', () => {
                window.lpwfAuth?.clearToken?.();
                window.lpwfAuth?.clearCurrentUser?.();
                updateTokenInfo();
                showUserInfo(null);
            });
        }

        const refreshUserBtn = select(DOM_IDS.refreshUser);
        if (refreshUserBtn) {
            refreshUserBtn.addEventListener('click', refreshUserInfo);
        }

        const runCallBtn = select(DOM_IDS.runCall);
        if (runCallBtn) {
            runCallBtn.addEventListener('click', async () => {
                const endpointEl = select(DOM_IDS.endpoint);
                const endpoint = endpointEl?.value?.trim() || 'health';
                const result = await fetchWithAuth(endpoint);
                renderResponse(result);
            });
        }

        const copyBtn = select(DOM_IDS.copyResult);
        if (copyBtn) {
            copyBtn.addEventListener('click', async () => {
                const responseEl = select(DOM_IDS.response);
                if (!responseEl) return;
                const content = responseEl.textContent || '';
                try {
                    await navigator.clipboard.writeText(content);
                } catch (err) {
                    console.warn('Impossibile copiare il risultato', err);
                }
            });
        }

        const saveNotesBtn = select(DOM_IDS.saveNotes);
        if (saveNotesBtn) {
            saveNotesBtn.addEventListener('click', saveNotes);
        }

        const clearNotesBtn = select(DOM_IDS.clearNotes);
        if (clearNotesBtn) {
            clearNotesBtn.addEventListener('click', clearNotes);
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        updateTokenInfo();
        const storedUser = window.lpwfAuth?.getCurrentUser?.();
        showUserInfo(storedUser);
        loadStoredNotes();
        initEvents();
    });
})();
