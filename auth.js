(() => {
    const TOKEN_KEY = 'lpwf_token';
    const API_BASE_KEY = 'lpwf_api_base';
    const USER_KEY = 'lpwf_user';

    const sanitizeUrl = (url) => {
        if (!url) {
            return '';
        }
        try {
            const trimmed = url.trim();
            const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `${window.location.protocol}//${trimmed.replace(/^\/+/, '')}`;
            const u = new URL(withProtocol);
            return `${u.origin}${u.pathname.replace(/\/$/, '')}`;
        } catch (err) {
            return url.trim();
        }
    };

    const computeDefaultApiBase = () => {
        const currentPath = window.location.pathname;
        const basePath = currentPath.includes('/') ? currentPath.replace(/\/[^/]*$/, '') : '';
        const normalizedBase = basePath.endsWith('/api') ? basePath : `${basePath.replace(/\/$/, '')}/api`;
        return `${window.location.origin}${normalizedBase}`;
    };

    const getStoredValue = (key) => {
        try {
            return window.localStorage.getItem(key);
        } catch (err) {
            return null;
        }
    };

    const setStoredValue = (key, value) => {
        try {
            if (value === null || value === undefined) {
                window.localStorage.removeItem(key);
            } else {
                window.localStorage.setItem(key, value);
            }
        } catch (err) {
            /* localStorage not available, ignore */
        }
    };

    const authApi = {
        TOKEN_KEY,
        API_BASE_KEY,
        getDefaultApiBase() {
            return computeDefaultApiBase();
        },
        ensureBaseForLocation() {
            const defaultBase = computeDefaultApiBase();
            const stored = getStoredValue(API_BASE_KEY);
            if (!stored) {
                setStoredValue(API_BASE_KEY, defaultBase);
                return defaultBase;
            }
            try {
                const storedUrl = new URL(stored);
                const defaultUrl = new URL(defaultBase);
                const sameOrigin = storedUrl.origin === defaultUrl.origin;
                if (!sameOrigin) {
                    setStoredValue(API_BASE_KEY, defaultBase);
                    return defaultBase;
                }
                const defaultPath = defaultUrl.pathname;
                const storedPath = storedUrl.pathname;
                if (sameOrigin && !storedPath.startsWith(defaultPath)) {
                    setStoredValue(API_BASE_KEY, defaultBase);
                    return defaultBase;
                }
            } catch (err) {
                setStoredValue(API_BASE_KEY, defaultBase);
                return defaultBase;
            }
            return stored;
        },
        getToken() {
            return getStoredValue(TOKEN_KEY);
        },
        setToken(token) {
            setStoredValue(TOKEN_KEY, token);
        },
        clearToken() {
            setStoredValue(TOKEN_KEY, null);
        },
        getCurrentUser() {
            const raw = getStoredValue(USER_KEY);
            if (!raw) return null;
            try {
                return JSON.parse(raw);
            } catch (err) {
                return null;
            }
        },
        setCurrentUser(user) {
            try {
                setStoredValue(USER_KEY, user ? JSON.stringify(user) : null);
            } catch (err) {
                /* ignore storage errors */
            }
        },
        clearCurrentUser() {
            setStoredValue(USER_KEY, null);
        },
        getApiBase() {
            const stored = getStoredValue(API_BASE_KEY);
            if (stored) {
                return stored;
            }
            return computeDefaultApiBase();
        },
        setApiBase(url) {
            const sanitized = sanitizeUrl(url);
            if (!sanitized) {
                setStoredValue(API_BASE_KEY, null);
                return sanitized;
            }
            const finalUrl = sanitized.endsWith('/api') ? sanitized : `${sanitized}/api`;
            setStoredValue(API_BASE_KEY, finalUrl);
            return finalUrl;
        },
        clearApiBase() {
            setStoredValue(API_BASE_KEY, null);
        },
        buildHeaders(additional = {}, includeJson = false) {
            const headers = { ...additional };
            if (includeJson) {
                headers['Content-Type'] = 'application/json';
            }
            const token = this.getToken();
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }
            return headers;
        }
    };

    window.lpwfAuth = authApi;
})();
