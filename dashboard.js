// Dashboard minimale - gestione workflow/task
// Versione semplificata per ripartire da un setup pulito

((document) => {
    document.addEventListener('DOMContentLoaded', () => {
        // Usa la base API salvata dall'accesso; fallback al path locale /api
        const apiBase = (
            window.lpwfAuth?.getApiBase?.() ||
            window.lpwfAuth?.ensureBaseForLocation?.() ||
            '/api'
        ).replace(/\/$/, '');
        // Config: limiti predefiniti per audit (override da data-* o API /config)
        const AUDIT_ROLE_LIMIT = 200;
        const AUDIT_AUTH_DEFAULT_LIMIT = 200;

        const dom = {
            main: document.getElementById('dashboard-main'),
            taskSearch: document.getElementById('task-search'),
            userSelector: document.getElementById('user-selector'),
            todoCol: document.getElementById('tasks-todo'),
            doingCol: document.getElementById('tasks-doing'),
            doneCol: document.getElementById('tasks-done'),
            workflowsList: document.getElementById('workflows-list'),
            instancesList: document.getElementById('instances-list'),
            clientsList: document.getElementById('clients-list'),
            clientDetail: document.getElementById('client-detail'),
            groupsList: document.getElementById('gruppi-list'),
            usersList: document.getElementById('utenti-list'),
            filterUsers: document.getElementById('filter-users'),
            filterUsersGroup: document.getElementById('filter-users-group'),
            filterUsersSupervisor: document.getElementById('filter-users-supervisor'),
            filterUsersRole: document.getElementById('filter-users-role'),
            btnResetUserFiltersTop: document.getElementById('btn-reset-user-filters-top'),
            supervisedSection: document.getElementById('supervisor-assoc'),
            supervisedMulti: document.getElementById('supervised-users-multi'),
            userSupervisorSelect: document.getElementById('user-supervisor-select'),
            supervisedSaveBtn: document.getElementById('btn-supervised-save'),
            roleUserSelect: document.getElementById('role-user-select'),
            roleRoleSelect: document.getElementById('role-role-select'),
            roleSaveBtn: document.getElementById('btn-role-save'),
            roleSaveStatus: document.getElementById('role-save-status'),
            auditRolesList: document.getElementById('audit-roles-list'),
            auditAuthList: document.getElementById('audit-auth-list'),
            auditAuthResults: document.getElementById('audit-auth-results'),
            badgeAuditRolesLimit: document.getElementById('badge-audit-roles-limit'),
            badgeAuditAuthLimit: document.getElementById('badge-audit-auth-limit'),
            filterAuthUser: document.getElementById('filter-auth-user'),
            filterAuthAction: document.getElementById('filter-auth-action'),
            filterAuthLimit: document.getElementById('filter-auth-limit'),
            filterAuthFrom: document.getElementById('filter-auth-from'),
            filterAuthTo: document.getElementById('filter-auth-to'),
            btnAuthAuditReset: document.getElementById('btn-auth-audit-reset'),
            btnAuthAuditRefresh: document.getElementById('btn-auth-audit-refresh'),
            btnRunDiagnostics: document.getElementById('btn-run-diagnostics'),
            btnTestLogout: document.getElementById('btn-test-logout'),
            btnOpenAuditAuth: document.getElementById('btn-open-audit-auth'),
            btnAuthLimit500: document.getElementById('btn-auth-limit-500'),
            btnOpenAuditRoles: document.getElementById('btn-open-audit-roles'),
            btnRolesLimit500: document.getElementById('btn-roles-limit-500'),
            diagResults: document.getElementById('diag-results'),
            toastContainer: document.getElementById('toast-container'),
            usersByRole: document.getElementById('users-by-role'),
            listRoleAdmin: document.getElementById('list-role-admin'),
            listRoleSupervisor: document.getElementById('list-role-supervisor'),
            listRoleUser: document.getElementById('list-role-user'),
            countRoleAdmin: document.getElementById('count-role-admin'),
            countRoleSupervisor: document.getElementById('count-role-supervisor'),
            countRoleUser: document.getElementById('count-role-user'),
            filterUsersByRole: document.getElementById('filter-users-by-role'),
            toggleUsersByRoleActive: document.getElementById('toggle-users-by-role-active'),
            filterUsersByRoleSupervisor: document.getElementById('filter-users-by-role-supervisor'),
            filterGroups: document.getElementById('filter-groups'),
            filterGroupsHasUsers: document.getElementById('filter-groups-hasusers'),
            toggleUsersInactive: document.getElementById('toggle-users-inactive'),
            toggleGroupsInactive: document.getElementById('toggle-groups-inactive'),
            opsAssignedList: document.getElementById('ops-assigned-list'),
            opsUnassignedList: document.getElementById('ops-pending-list'),
            opsEmptyAssigned: document.getElementById('my-tasks-empty'),
            opsEmptyPending: document.getElementById('pending-tasks-empty'),
            taskOpsPanel: document.getElementById('task-ops-panel'),
            opsSectionAssigned: document.getElementById('ops-section-assigned'),
            opsSectionPending: document.getElementById('ops-section-pending'),
            logoutBtn: document.querySelector('[data-action="logout"]'),
            clientsSearch: document.getElementById('filter-clients'),
            btnClientsRefresh: document.getElementById('btn-clients-refresh'),
            clientsProvSel: document.getElementById('filter-clients-province'),
            clientsCitySel: document.getElementById('filter-clients-city'),
            clientsCount: document.getElementById('clients-count'),
            clientsPrev: document.getElementById('clients-prev'),
            clientsNext: document.getElementById('clients-next'),
            clientsPageInfo: document.getElementById('clients-page-info'),
            clientsPageSizeSel: document.getElementById('clients-page-size'),
            // Catalogo Prodotti & Servizi
            productsList: document.getElementById('products-list'),
            productsCount: document.getElementById('products-count'),
            filterProducts: document.getElementById('filter-products'),
            filterProductsType: document.getElementById('filter-products-type'),
            btnProductsRefresh: document.getElementById('btn-products-refresh'),
            btnProductNew: document.getElementById('btn-product-new'),
            btnProductEdit: document.getElementById('btn-product-edit'),
            filterProductsCategory: document.getElementById('filter-products-category'),
            filterProductsTenant: document.getElementById('filter-products-tenant'),
            filterProductsOwnTenant: document.getElementById('filter-products-own-tenant'),
            filterProductsVisibility: document.getElementById('filter-products-visibility'),
            productDetailTitle: document.getElementById('product-detail-title'),
            productDetailSubtitle: document.getElementById('product-detail-subtitle'),
            productDetailSku: document.getElementById('product-detail-sku'),
            productDetailType: document.getElementById('product-detail-type'),
            productDetailStatus: document.getElementById('product-detail-status'),
            productDetailPrice: document.getElementById('product-detail-price'),
            productDetailDescription: document.getElementById('product-detail-description'),
            productDetailAvailability: document.getElementById('product-detail-availability'),
            productDetailMedia: document.getElementById('product-detail-media'),
            btnSuggestMedia: document.getElementById('btn-suggest-media'),
            suggestMediaStatus: document.getElementById('suggest-media-status'),
            suggestedMedia: document.getElementById('suggested-media'),
            mediaSrcWiki: document.getElementById('media-src-wikimedia'),
            mediaSrcUnsplash: document.getElementById('media-src-unsplash'),
            mediaSrcPexels: document.getElementById('media-src-pexels'),
            mediaSrcPrefer: document.getElementById('media-src-prefer'),
            // Ticket metrics (overview)
            metricTicketOpen: document.getElementById('metric-ticket-open'),
            metricTicketDoing: document.getElementById('metric-ticket-doing'),
            metricTicketClosed30: document.getElementById('metric-ticket-closed30'),
            metricTicketOpenTeam: document.getElementById('metric-ticket-open-team'),
            metricTicketDoingTeam: document.getElementById('metric-ticket-doing-team'),
            metricTicketClosed30Team: document.getElementById('metric-ticket-closed30-team'),
            // Media upload controls
            uploadMediaInput: document.getElementById('input-upload-media'),
            uploadMediaAlt: document.getElementById('input-upload-alt'),
            btnUploadMedia: document.getElementById('btn-upload-media'),
            // Client map elements
            clientMapEl: document.getElementById('client-map'),
            clientMapLinks: document.getElementById('client-map-links'),
            clientStreetView: document.getElementById('client-streetview'),
            mapModeSelect: document.getElementById('map-mode-select'),
            mapZoomRange: document.getElementById('map-zoom'),
            svHeading: document.getElementById('sv-heading'),
            svPitch: document.getElementById('sv-pitch'),
            svFov: document.getElementById('sv-fov'),
            svControlsWrap: document.getElementById('sv-controls'),
            mapZoomWrap: document.getElementById('map-zoom-wrap'),
            clientMapWarning: document.getElementById('client-map-warning'),
            btnEditClientAddress: document.getElementById('btn-edit-client-address'),
            formEditClientAddress: document.getElementById('form-edit-client-address'),
            editClientFields: {
                id: document.getElementById('edit-client-id'),
                indirizzo: document.getElementById('edit-client-indirizzo'),
                cap: document.getElementById('edit-client-cap'),
                citta: document.getElementById('edit-client-citta'),
                provincia: document.getElementById('edit-client-provincia'),
                nazione: document.getElementById('edit-client-nazione'),
            },
            btnSaveGeo: document.getElementById('btn-save-geo'),
            // Product edit modal
            formEditProduct: document.getElementById('form-edit-product'),
            suggestProductQuery: document.getElementById('suggest-product-query'),
            suggestProductList: document.getElementById('suggest-product-list'),
            editProductFields: {
                id: document.getElementById('edit-product-id'),
                sku: document.getElementById('edit-product-sku'),
                codiceTenant: document.getElementById('edit-product-codice-tenant'),
                marca: document.getElementById('edit-product-marca'),
                modello: document.getElementById('edit-product-modello'),
                versione: document.getElementById('edit-product-versione'),
                tipologia: document.getElementById('edit-product-tipologia'),
                titolo: document.getElementById('edit-product-titolo'),
                sottotitolo: document.getElementById('edit-product-sottotitolo'),
                descrizione: document.getElementById('edit-product-descrizione'),
                stato: document.getElementById('edit-product-stato'),
                visibilita: document.getElementById('edit-product-visibilita'),
            },
            // Pricelists modal
            btnManagePricelists: document.getElementById('btn-manage-pricelists'),
            modalPricelists: document.getElementById('modal-manage-pricelists'),
            pricelistsList: document.getElementById('pricelists-list'),
            formPricelist: document.getElementById('form-pricelist'),
            pricelistFields: {
                id: document.getElementById('pricelist-id'),
                codice: document.getElementById('pricelist-codice'),
                nome: document.getElementById('pricelist-nome'),
                valuta: document.getElementById('pricelist-valuta'),
                priorita: document.getElementById('pricelist-priorita'),
                dal: document.getElementById('pricelist-dal'),
                al: document.getElementById('pricelist-al'),
                btnDelete: document.getElementById('btn-delete-pricelist'),
            },
            // Categories modal
            btnManageCategories: document.getElementById('btn-manage-categories'),
            modalCategories: document.getElementById('modal-manage-categories'),
            categoriesList: document.getElementById('categories-list'),
            categoriesSearch: document.getElementById('categories-search'),
            formCategory: document.getElementById('form-category'),
            categoryFields: {
                id: document.getElementById('category-id'),
                name: document.getElementById('category-name'),
                slug: document.getElementById('category-slug'),
                parent: document.getElementById('category-parent'),
                btnDelete: document.getElementById('btn-delete-category'),
            },
            // Import media wizard
            modalImportMedia: document.getElementById('modal-import-media'),
            importMediaList: document.getElementById('import-media-list'),
            importMediaSelectAll: document.getElementById('import-media-select-all'),
            btnImportMediaConfirm: document.getElementById('btn-import-media-confirm'),
            btnImportMediaCancel: document.getElementById('btn-import-media-cancel'),
        };

        const stepActionSelect = document.getElementById('select-step-action');
        const actionParamsSection = document.getElementById('action-params-section');
        const actionParamsContainer = document.getElementById('action-params-container');
        const formCreateWorkflow = document.getElementById('form-create-workflow');
        const formCreateStep = document.getElementById('form-create-step');
        const formStartInstance = document.getElementById('form-start-instance');
        const modalStepTitle = document.getElementById('modal-create-step-title');
        const stepSubmitBtn = formCreateStep
            ? formCreateStep.querySelector('button[type="submit"]')
            : null;
        const btnAddStep = document.getElementById('btn-add-step');
        const btnStartInstance = document.getElementById('btn-start-instance');
        const instanceDetailEls = {
            container: document.getElementById('instance-detail'),
            name: document.getElementById('instance-detail-name'),
            description: document.getElementById('instance-detail-description'),
            workflow: document.getElementById('instance-detail-workflow'),
            status: document.getElementById('instance-detail-status'),
            started: document.getElementById('instance-detail-started'),
            startedBy: document.getElementById('instance-detail-started-by'),
            updated: document.getElementById('instance-detail-updated'),
            tasks: document.getElementById('instance-tasks'),
            assignees: document.getElementById('instance-detail-assignees'),
        };
        const unusedModalTaskWork = document.getElementById('modal-task-work');
        const taskModalElements = {
            title: document.getElementById('task-modal-title'),
            workflow: document.getElementById('task-modal-workflow'),
            status: document.getElementById('task-modal-status'),
            assignee: document.getElementById('task-modal-assignee'),
            updated: document.getElementById('task-modal-updated'),
            notesList: document.getElementById('task-modal-notes'),
            noteForm: document.getElementById('form-task-note'),
            noteInput: document.getElementById('task-note-text'),
            noteFiles: document.getElementById('task-note-files'),
            noteMessage: document.getElementById('task-note-message'),
            takeBtn: document.getElementById('btn-task-take'),
            completeBtn: document.getElementById('btn-task-complete'),
            openInstanceBtn: document.getElementById('btn-task-open-instance'),
            subflowForm: document.getElementById('form-task-subflow'),
            subflowWorkflow: document.getElementById('task-subflow-workflow'),
            subflowUser: document.getElementById('task-subflow-user'),
            subflowMessage: document.getElementById('task-subflow-message'),
        };
        const groupOptions = document.getElementById('workflow-group-options');
        const userOptions = document.getElementById('workflow-user-options');
        const adminUserOptions = document.getElementById('user-options-admin');
        const groupLabelInput = formCreateStep
            ? formCreateStep.querySelector('[data-role="group-picker"]')
            : null;
        const userLabelInput = formCreateStep
            ? formCreateStep.querySelector('[data-role="user-picker"]')
            : null;
        const groupHiddenInput = formCreateStep
            ? formCreateStep.querySelector('input[name="responsabile_gruppo_id"]')
            : null;
        const userHiddenInput = formCreateStep
            ? formCreateStep.querySelector('input[name="responsabile_utente_id"]')
            : null;

        attachPickerListeners(groupLabelInput, groupHiddenInput, groupOptions);
        attachPickerListeners(userLabelInput, userHiddenInput, userOptions);

        // Modals: group/user management
        const unusedModalGroup = document.getElementById('modal-manage-group');
        const unusedModalUser = document.getElementById('modal-manage-user');
        const formManageGroup = document.getElementById('form-manage-group');
        const formManageUser = document.getElementById('form-manage-user');
        const userGroupsSection = document.getElementById('user-groups-section');
        const userGroupsList = document.getElementById('user-groups-list');
        const userGroupLabel = document.getElementById('user-group-label');
        const userGroupIdHidden = document.getElementById('user-group-id');
        const btnUserAddGroup = document.getElementById('btn-user-add-group');
        const userGroupsMulti = document.getElementById('user-groups-multi');
        const groupMembersSection = document.getElementById('group-members-section');
        const groupMembersList = document.getElementById('group-members-list');
        const groupUserLabel = document.getElementById('group-user-label');
        const groupUserIdHidden = document.getElementById('group-user-id');
        const btnGroupAddUser = document.getElementById('btn-group-add-user');
        const btnDeleteGroup = document.getElementById('btn-delete-group');
        const btnDeleteUser = document.getElementById('btn-delete-user');

        attachPickerListeners(groupUserLabel, groupUserIdHidden, adminUserOptions);
        const adminGroupOptions = document.getElementById('group-options-admin');
        // Roles & audit UI refs (usiamo quelli in `dom`)
        attachPickerListeners(userGroupLabel, userGroupIdHidden, adminGroupOptions);

        if (!window.lpwfAuth || !window.lpwfAuth.getToken()) {
            if (dom.main) {
                dom.main.innerHTML =
                    '<p>Autenticazione richiesta. Effettua il login da <a href="login.html">login.html</a>.</p>';
            }
            return;
        }

        const state = {
            currentUser: 'all',
            search: '',
            users: [],
            groups: [],
            clients: [],
            selectedClientId: null,
            clientFilters: { search: '', province: '', city: '' },
            clientPage: 1,
            clientPageSize: 50,
            auditAuth: [],
            config: {
                auditRoleLimit: AUDIT_ROLE_LIMIT,
                auditAuthDefaultLimit: AUDIT_AUTH_DEFAULT_LIMIT,
            },
            permissions: {
                viewConfig: false,
                viewUsers: false,
                manageUsers: false,
                viewGroups: true,
                manageGroups: false,
                manageWorkflows: false,
                manageRoles: false,
            },
            filters: {
                usersSearch: '',
                usersIncludeInactive: false,
                usersGroupId: 'all',
                usersSupervisorId: 'all',
                groupsSearch: '',
                groupsIncludeInactive: false,
                groupsHasUsers: 'all',
                instancesClientId: '',
            },
            currentUserInfo: null,
            currentUserId: null,
            isAdmin: false,
            taskBuckets: {
                todo: [],
                doing: [],
                done: [],
            },
            activeTask: null,
            activeTaskNotes: [],
            activeTaskSubflows: [],
            notifications: {
                seenSubflows: {},
                count: 0,
            },
            // Catalogo
            products: [],
            selectedProductId: null,
            productFilters: { q: '', type: '' },
            productFilterCategory: '',
            productFilterTenant: '',
            productOwnTenantOnly: true,
            pendingCategoriesForNew: null,
            pendingMediaForNew: null,
            // Relazioni: filtri/sort
            relationFilterType: '',
            relationSort: 'priority',
            relationSortDir: 'asc',
            // Map state
            clientMap: null,
            clientMapMarker: null,
            clientGeo: null,
            mapZoom: 15,
            mapMode: 'map',
            clientAddress: '',
            selectedClientDetail: null,
            // Pricing state
            selectedPriceListCode: 'DEFAULT',
        };

        const NOTIF_STORAGE_KEY = 'lpwf_notif_seen_subflows';
        const unusedTAB_STORAGE_KEY = 'lpwf_active_tab';

        const loadSeenSubflows = () => {
            try {
                const raw = window.localStorage.getItem(NOTIF_STORAGE_KEY);
                state.notifications.seenSubflows = raw ? JSON.parse(raw) : {};
            } catch (e) {
                state.notifications.seenSubflows = {};
            }
        };

        const saveSeenSubflows = () => {
            try {
                window.localStorage.setItem(
                    NOTIF_STORAGE_KEY,
                    JSON.stringify(state.notifications.seenSubflows || {}),
                );
            } catch (e) {
                /* ignore */
            }
        };

        // Forward declarations to satisfy linter/static analysis; real logic is provided where needed.
        // These ensure names exist before first usage in the file.
        function attachMediaDnD() {}
        function openImportMediaWizard() {}
        function pushOrderHistory() {}
        async function applyStepsOrder() {}

        function buildUserLabel(user) {
            if (!user) return '';
            const fullname = [user.nome, user.cognome].filter(Boolean).join(' ').trim();
            const email = user.email || user.username || '';
            if (fullname && email) {
                return `${fullname} (${email})`;
            }
            return fullname || email || `Utente #${user.id}`;
        }

        function buildGroupLabel(group) {
            if (!group) return '';
            const name = group.nome_gruppo || group.nome || '';
            const descr = group.descrizione || '';
            if (name && descr) {
                return `${name} - ${descr}`;
            }
            return name || `Gruppo #${group.id}`;
        }

        function populateDatalist(datalist, items, labelBuilder) {
            if (!datalist) return;
            datalist.innerHTML = '';
            items.forEach((item) => {
                const option = document.createElement('option');
                option.value = labelBuilder(item);
                option.dataset.id = item.id;
                datalist.appendChild(option);
            });
        }

        function findOptionByValue(datalist, value) {
            if (!datalist || !value) return null;
            const options = datalist.querySelectorAll('option');
            for (const option of options) {
                if (option.value === value) {
                    return option;
                }
            }
            return null;
        }

        function normalizeListResponse(payload, candidates = []) {
            if (Array.isArray(payload)) {
                return payload;
            }
            if (payload && typeof payload === 'object') {
                for (const key of candidates) {
                    if (Array.isArray(payload[key])) {
                        return payload[key];
                    }
                }
                if (Array.isArray(payload.data)) {
                    return payload.data;
                }
                const keys = Object.keys(payload);
                if (keys.length && keys.every((key) => /^\d+$/.test(key))) {
                    return keys
                        .map((key) => payload[key])
                        .filter((item) => item && typeof item === 'object');
                }
                const flattened = Object.values(payload).filter(Array.isArray);
                if (flattened.length) {
                    return flattened.flat();
                }
            }
            return [];
        }

        function formatDateTime(value) {
            if (!value) return '--';
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) {
                return String(value);
            }
            return date.toLocaleString('it-IT');
        }

        function humanizeStatus(status) {
            if (!status) return '--';
            const normalized = String(status).replace(/_/g, ' ').toLowerCase();
            return normalized.replace(/(^|\s)\w/g, (char) => char.toUpperCase());
        }

        function attachPickerListeners(inputEl, hiddenEl, datalistEl) {
            if (!inputEl || !hiddenEl) return;

            const syncHidden = () => {
                const value = inputEl.value.trim();
                const option = findOptionByValue(datalistEl, value);
                if (option) {
                    hiddenEl.value = option.dataset.id || '';
                    inputEl.setAttribute('data-selected-id', hiddenEl.value);
                } else {
                    hiddenEl.value = '';
                    inputEl.removeAttribute('data-selected-id');
                }
            };

            inputEl.addEventListener('input', syncHidden);
            inputEl.addEventListener('change', syncHidden);

            inputEl.addEventListener('blur', () => {
                if (inputEl.value.trim() === '') {
                    hiddenEl.value = '';
                    inputEl.removeAttribute('data-selected-id');
                }
            });
        }

        const ensureUserContext = async () => {
            if (!state.currentUserInfo) {
                const storedUser = window.lpwfAuth?.getCurrentUser?.();
                if (storedUser) {
                    state.currentUserInfo = storedUser;
                }
            }

            try {
                const me = await authFetch('auth/me');
                if (me && typeof me === 'object') {
                    state.currentUserInfo = me;
                    window.lpwfAuth?.setCurrentUser?.(me);
                }
            } catch (error) {
                if (!state.currentUserInfo) {
                    throw error;
                }
            }

            if (!state.currentUserInfo) {
                throw new Error("Impossibile recuperare le informazioni dell'utente corrente.");
            }

            state.currentUserId = Number(state.currentUserInfo.id);
            const role = (state.currentUserInfo.ruolo || '').toUpperCase();
            state.isAdmin = role === 'ADMIN';
            state.permissions = computePermissions(role);

            if (!state.isAdmin) {
                state.currentUser = String(state.currentUserId);
            }
        };

        const computePermissions = (role) => {
            const isAdmin = role === 'ADMIN';
            const isSupervisor = role === 'SUPERVISOR';
            return {
                // Config solo per Admin (Supervisor non vede la sezione Configurazione)
                viewConfig: isAdmin,
                // Audit solo Admin (richiesta aggiornata)
                viewAudit: isAdmin,
                viewUsers: isAdmin || isSupervisor,
                manageUsers: isAdmin || isSupervisor,
                viewGroups: true,
                manageGroups: isAdmin || isSupervisor,
                manageWorkflows: isAdmin || isSupervisor,
                manageRoles: isAdmin,
            };
        };

        const applyPermissions = () => {
            const p = state.permissions || {};
            const configSection = document.getElementById('config');
            // Configurazione visibile solo Admin
            if (configSection) configSection.hidden = !p.viewConfig;
            // Modelli Workflow visibili solo Admin
            const modelsSection = document.getElementById('workflow-models');
            if (modelsSection) modelsSection.hidden = !p.viewConfig;
            // Pannelli diagnostica/audit: solo Admin
            try {
                const diagPanel = document.querySelector('article[data-resource="diagnostics"]');
                if (diagPanel) diagPanel.hidden = !p.viewConfig;
                const auditRoles = document.querySelector('article[data-resource="audit-roles"]');
                if (auditRoles) auditRoles.hidden = !p.viewAudit;
                const auditAuth = document.querySelector('article[data-resource="audit-auth"]');
                if (auditAuth) auditAuth.hidden = !p.viewAudit;
            } catch (e) {
                /* ignore */
            }
            // Nascondi/mostra voci sidebar per Admin
            try {
                const linkModels = document.querySelector(
                    'a.sidebar__link[href="#workflow-models"]',
                );
                if (linkModels) linkModels.hidden = !p.viewConfig;
                const linkConfig = document.querySelector('a.sidebar__link[href="#config"]');
                if (linkConfig) linkConfig.hidden = !p.viewConfig;
            } catch (e) {
                /* ignore */
            }
            const usersPanel = document.querySelector('article[data-resource="utenti"]');
            const groupsPanel = document.querySelector('article[data-resource="gruppi"]');
            if (usersPanel) usersPanel.hidden = true; // pannello utenti rimosso
            if (groupsPanel) groupsPanel.hidden = !(p.viewConfig && p.viewGroups);
            document
                .querySelectorAll('[data-action="open-create-user"]')
                .forEach((b) => (b.hidden = !p.manageUsers));
            document
                .querySelectorAll('[data-action="open-create-group"]')
                .forEach((b) => (b.hidden = !p.manageGroups));
            const rolesPanel = document.querySelector('article[data-resource="roles"]');
            if (rolesPanel) rolesPanel.hidden = !p.manageRoles;
            // Audit: solo Admin
        };

        const workflowState = {
            list: [],
            actions: [],
            selectedId: null,
            editingStepId: null,
            editingStepData: null,
            detailCache: {},
            includeInactive: false,
            search: '',
            orderBackup: {},
        };

        const instanceState = {
            list: [],
            selectedId: null,
            detailCache: {},
            alerts: {},
            childrenCache: {},
            progress: {},
            assignees: {},
            assigneesFull: {},
            assigneeMap: {},
            assigneesExpanded: {},
        };

        const renderStatusBar = () => {
            const elUser = document.getElementById('status-user');
            const elRole = document.getElementById('status-role');
            const elApi = document.getElementById('status-api');
            const elTok = document.getElementById('status-token');
            const me = state.currentUserInfo || window.lpwfAuth?.getCurrentUser?.() || {};
            const fullname =
                [me.nome, me.cognome].filter(Boolean).join(' ') ||
                me.email ||
                `#${me.id || ''}` ||
                '—';
            const role = (me.ruolo || '').toUpperCase() || '—';
            const apiBase =
                window.lpwfAuth?.ensureBaseForLocation?.() ||
                window.lpwfAuth?.getApiBase?.() ||
                '' ||
                '—';
            const tokenOk = !!window.lpwfAuth?.getToken?.();
            if (elUser) elUser.textContent = fullname;
            if (elRole) elRole.textContent = role;
            if (elApi) elApi.textContent = apiBase;
            if (elTok) elTok.textContent = tokenOk ? 'OK' : 'MANCANTE';
        };

        // Aggiorna badge health rapidi (API DB + Tenant DB)
        const updateHealthBadges = async () => {
            const api = (
                window.lpwfAuth?.getApiBase?.() ||
                window.lpwfAuth?.ensureBaseForLocation?.() ||
                '/api'
            ).replace(/\/$/, '');
            const elApi = document.getElementById('status-health-api');
            const elTen = document.getElementById('status-health-tenant');
            const elMaps = document.getElementById('status-maps');
            const setBadge = (el, ok) => {
                if (!el) return;
                el.textContent = ok ? 'OK' : 'KO';
                el.classList.remove('badge-success', 'badge-error');
                el.classList.add(ok ? 'badge-success' : 'badge-error');
            };
            try {
                const r = await fetch(`${api}/health`);
                const h = await r.json();
                setBadge(elApi, !!h?.db_ok);
            } catch (e) {
                setBadge(elApi, false);
            }
            try {
                const r2 = await fetch(`${api}/tenant_health`);
                const h2 = await r2.json();
                setBadge(elTen, !!h2?.db_ok);
            } catch (e) {
                setBadge(elTen, false);
            }
            try {
                const cfg = await authFetch('config');
                const hasKey = !!cfg?.gmaps_embed_key;
                setBadge(elMaps, hasKey);
            } catch (e) {
                setBadge(elMaps, false);
            }
        };

        const unusedRenderSupervisorBadge = async () => {
            const role = (state.currentUserInfo?.ruolo || '').toUpperCase();
            const badge = document.getElementById('supervisor-users-badge');
            const listEl = document.getElementById('supervisor-users-list');
            if (!badge || !listEl) return;
            if (role !== 'SUPERVISOR') {
                badge.hidden = true;
                return;
            }
            try {
                let supervised = await authFetch(`utenti/${state.currentUserId}/supervised`);
                supervised = Array.isArray(supervised) ? supervised : [];
                if (!supervised.length) {
                    badge.hidden = true;
                    return;
                }
                listEl.innerHTML = supervised
                    .map((u) => `<span class="badge">${sanitize(buildUserLabel(u))}</span>`)
                    .join(' ');
                badge.hidden = false;
            } catch (e) {
                badge.hidden = true;
            }
        };

        const sanitize = (value) => {
            if (value === null || value === undefined) return '';
            return String(value);
        };

        const serializeForm = (form) => {
            const data = {};
            const formData = new FormData(form);
            formData.forEach((value, key) => {
                if (data[key] !== undefined) {
                    if (!Array.isArray(data[key])) {
                        data[key] = [data[key]];
                    }
                    data[key].push(value);
                } else {
                    data[key] = value;
                }
            });

            form.querySelectorAll('input[type="checkbox"]').forEach((input) => {
                if (input.name) {
                    data[input.name] = input.checked ? 1 : 0;
                }
            });

            return data;
        };

        const authFetch = async (endpoint, options = {}) => {
            const t0 = performance.now();
            const url = `${apiBase}/${endpoint.replace(/^\/+/, '')}`;
            const init = {
                method: options.method || 'GET',
                headers: window.lpwfAuth.buildHeaders(options.headers || {}, options.json === true),
            };
            if (options.body !== undefined) {
                init.body = options.json ? JSON.stringify(options.body) : options.body;
            }

            let response;
            try {
                response = await fetch(url, init);
            } catch (networkErr) {
                const t1 = performance.now();
                const lastEl = document.getElementById('status-api-last');
                if (lastEl)
                    lastEl.textContent = `${init.method} ${endpoint} → NETWORK ERR (${Math.round(t1 - t0)}ms)`;
                throw networkErr;
            }
            const text = await response.text();
            let payload = null;

            if (text) {
                try {
                    payload = JSON.parse(text);
                } catch (err) {
                    console.error('Risposta non valida dal server', err, text);
                }
            }

            if (!response.ok) {
                if (response.status === 401) {
                    window.lpwfAuth.clearToken?.();
                    alert(
                        (payload && payload.message) ||
                            'Sessione scaduta. Effettua nuovamente il login.',
                    );
                    window.location.href = 'login.html';
                    const t1 = performance.now();
                    const lastEl = document.getElementById('status-api-last');
                    if (lastEl)
                        lastEl.textContent = `${init.method} ${endpoint} → 401 (scaduta) (${Math.round(t1 - t0)}ms)`;
                    return Promise.reject(new Error('Non autenticato'));
                }
                const message =
                    payload && payload.message ? payload.message : `Errore HTTP ${response.status}`;
                const t1 = performance.now();
                const lastEl = document.getElementById('status-api-last');
                if (lastEl)
                    lastEl.textContent = `${init.method} ${endpoint} → ${response.status} (${Math.round(t1 - t0)}ms)`;
                return Promise.reject(new Error(message));
            }
            const t1 = performance.now();
            const lastEl = document.getElementById('status-api-last');
            if (lastEl)
                lastEl.textContent = `${init.method} ${endpoint} → ${response.status} OK (${Math.round(t1 - t0)}ms)`;
            return payload;
        };

        const renderMessage = (container, text) => {
            if (!container) return;
            container.innerHTML = `<p>${sanitize(text)}</p>`;
        };

        // Hub Catalogo fetch (read-only)
        const siteRoot = apiBase.replace(/\/api$/, '');
        // Preferisci chiamare direttamente index.php con ?path= per compatibilità hosting senza rewrite
        const hubBase = (
            window.lpwfAuth?.getHubBase?.() || siteRoot + '/hub_catalogo/index.php'
        ).replace(/\/$/, '');
        const hubFetch = async (endpoint) => {
            const ep = String(endpoint || '');
            const [pathOnly, qs] = ep.split('?');
            let url = '';
            if (hubBase.endsWith('index.php')) {
                url = `${hubBase}?path=${encodeURIComponent(pathOnly)}` + (qs ? `&${qs}` : '');
            } else {
                url = `${hubBase}/${pathOnly.replace(/^\/+/, '')}` + (qs ? `?${qs}` : '');
            }
            const res = await fetch(url, { headers: { Accept: 'application/json' } });
            if (!res.ok) {
                let msg = `Errore HTTP ${res.status}`;
                try {
                    const j = await res.json();
                    msg = j?.errore?.messaggio || msg;
                } catch (e) {
                    /* ignore */
                }
                throw new Error(msg);
            }
            return await res.json();
        };

        const renderTaskColumn = (container, tasks, emptyMsg) => {
            if (!container) return;
            const list = Array.isArray(tasks)
                ? tasks
                : normalizeListResponse(tasks, ['tasks', 'records', 'items']);
            if (!Array.isArray(list) || list.length === 0) {
                renderMessage(container, emptyMsg);
                return;
            }

            container.innerHTML = '';
            list.forEach((task) => {
                const card = document.createElement('div');
                card.className = 'task-card';

                const title = sanitize(task.nome || `Task #${task.id}`);
                const description = sanitize(task.descrizione || 'Nessuna descrizione.');
                const assignee = sanitize(task.nome_utente_completo || 'Non assegnato');
                const stato = sanitize(task.stato_nome || task.stato || '—');
                const instId = Number(task.workflow_istanza_id);
                const instAlerts =
                    (instanceState.alerts && instanceState.alerts[String(instId)]) || 0;

                card.innerHTML = `
                    <div class="task-card-header">
                        <h3>${title}</h3>
                        <span class="task-status">${stato}</span>
                    </div>
                    <div class="task-card-body">
                        <p>${description}</p>
                        <small>Assegnato a: ${assignee}</small>
                    </div>
                `;

                if (instAlerts > 0) {
                    const flag = document.createElement('button');
                    flag.type = 'button';
                    flag.className = 'task-subflow-flag has-tip';
                    flag.dataset.action = 'open-instance';
                    flag.dataset.instId = String(instId);
                    flag.dataset.tip = `${instAlerts} sottoworkflow (clic per dettaglio)`;
                    flag.textContent = instAlerts > 9 ? '9+' : String(instAlerts);

                    let loadedTooltip = false;
                    flag.addEventListener('mouseenter', async () => {
                        if (loadedTooltip) return;
                        loadedTooltip = true;
                        const children = await fetchInstanceChildren(instId);
                        flag.dataset.tip = buildSubflowTooltip(children);
                    });

                    card.appendChild(flag);
                }

                container.appendChild(card);
            });
        };

        const unusedRenderSimpleList = (container, items, formatter) => {
            if (!container) return;
            if (!Array.isArray(items) || items.length === 0) {
                renderMessage(container, 'Nessun elemento.');
                return;
            }

            container.innerHTML = '';
            items.forEach((item) => {
                const div = document.createElement('div');
                div.className = 'list-item';
                div.innerHTML = formatter(item);
                container.appendChild(div);
            });
        };

        const loadActions = async () => {
            try {
                const actions = await authFetch('azioni');
                workflowState.actions = Array.isArray(actions) ? actions : [];
                populateActionSelect();
            } catch (error) {
                console.error('Errore caricamento azioni standard', error);
                workflowState.actions = [];
                populateActionSelect();
            }
        };

        const renderUsersList = () => {
            if (!dom.usersList) return;
            // Applica filtri solo client-side sulla lista
            let list = Array.isArray(state.users) ? [...state.users] : [];
            // Includi solo attivi se il toggle non è selezionato
            if (!state.filters.usersIncludeInactive) {
                list = list.filter((u) => String(u.stato || 'ATTIVO').toUpperCase() === 'ATTIVO');
            }
            // Ricerca testuale su nome/cognome/email/username
            const q = (state.filters.usersSearch || '').toLowerCase().trim();
            if (q) {
                list = list.filter((u) => {
                    const name = [u.nome, u.cognome].filter(Boolean).join(' ').toLowerCase();
                    const email = String(u.email || '').toLowerCase();
                    const username = String(u.username || '').toLowerCase();
                    return name.includes(q) || email.includes(q) || username.includes(q);
                });
            }
            // Applica filtro per gruppo (richiede with_groups=1 nel fetch)
            const groupId = state.filters.usersGroupId;
            if (groupId && groupId !== 'all') {
                const gid = Number(groupId);
                list = list.filter(
                    (u) => Array.isArray(u.gruppi) && u.gruppi.some((g) => Number(g.id) === gid),
                );
            }
            const roleFilter = (state.filters.usersRole || 'all').toUpperCase();
            if (roleFilter && roleFilter !== 'all') {
                list = list.filter((u) => String(u.ruolo || '').toUpperCase() === roleFilter);
            }
            const supervisorId = state.filters.usersSupervisorId;
            if (supervisorId && supervisorId !== 'all') {
                const sid = Number(supervisorId);
                list = list.filter(
                    (u) =>
                        Array.isArray(u.supervisors) &&
                        u.supervisors.some((s) => Number(s.id) === sid),
                );
            }
            // Aggiorna il titolo con il conteggio corrente
            try {
                const titleEl = document.getElementById('users-panel-title');
                if (titleEl) titleEl.textContent = `Utenti (${list.length || 0})`;
            } catch (e) {
                /* no-op */
            }
            if (!list || list.length === 0) {
                dom.usersList.innerHTML = `
                  <div class="placeholder">
                    <p>Nessun utente corrisponde ai filtri attivi.</p>
                    <button type="button" class="btn" id="btn-reset-user-filters">Reset filtri</button>
                  </div>
                `;
                return;
            }
            dom.usersList.innerHTML = '';
            list.forEach((u) => {
                const div = document.createElement('div');
                const inactive = String(u.stato || '').toUpperCase() !== 'ATTIVO';
                div.className = 'list-item' + (inactive ? ' is-inactive' : '');
                const label = buildUserLabel(u);
                const badge = inactive
                    ? ' <span class="badge badge-error">Inattivo</span>'
                    : ' <span class="badge badge-success">Attivo</span>';
                const actions = inactive
                    ? `<button type="button" class="btn btn-primary" data-action="restore-user" data-id="${u.id}">Ripristina</button>`
                    : `<button type="button" class="btn btn-danger" data-action="delete-user" data-id="${u.id}">Disattiva</button>`;
                div.innerHTML = `<div class="column-header"><strong>${sanitize(label)}${badge}</strong>
                    <div class="item-actions">
                        <button type="button" class="btn btn-secondary" data-action="edit-user" data-id="${u.id}">Modifica</button>
                        ${actions}
                    </div></div>`;

                // Container per badge gruppi
                const groupsContainer = document.createElement('div');
                groupsContainer.className = 'item-details';
                groupsContainer.id = `user-groups-${u.id}`;
                if (Array.isArray(u.gruppi)) {
                    if (u.gruppi.length) {
                        groupsContainer.innerHTML = u.gruppi
                            .map((g) => {
                                const label = sanitize(
                                    buildGroupLabel(g) || g.nome || 'Gruppo #' + g.id,
                                );
                                const m = state.groups?.find((x) => Number(x.id) === Number(g.id));
                                const cnt =
                                    m && m.users_count !== undefined
                                        ? ` (${Number(m.users_count) || 0})`
                                        : '';
                                return `<span class="badge">${label}${cnt}</span>`;
                            })
                            .join(' ');
                    } else {
                        groupsContainer.innerHTML =
                            '<small class="form-hint">Nessun gruppo assegnato.</small>';
                    }
                } else {
                    groupsContainer.innerHTML =
                        '<small class="form-hint">Caricamento gruppi…</small>';
                }
                div.appendChild(groupsContainer);
                // Supervisors (se presenti)
                if (Array.isArray(u.supervisors) && u.supervisors.length) {
                    const supEl = document.createElement('div');
                    supEl.className = 'item-details';
                    supEl.id = `user-sup-${u.id}`;
                    supEl.innerHTML =
                        '<small class="form-hint">Supervisor:</small> ' +
                        u.supervisors
                            .map((s) => `<span class="badge">${sanitize(buildUserLabel(s))}</span>`)
                            .join(' ');
                    div.appendChild(supEl);
                }
                dom.usersList.appendChild(div);

                // Carica gruppi per l'utente e renderizza
                if (!Array.isArray(u.gruppi)) {
                    ensureUserGroupsBadges(u.id);
                }
            });
        };

        const resetUserFilters = () => {
            state.filters.usersSearch = '';
            state.filters.usersIncludeInactive = false;
            state.filters.usersGroupId = 'all';
            state.filters.usersSupervisorId = 'all';
            state.filters.usersRole = 'all';
            const inp = document.getElementById('filter-users');
            if (inp) inp.value = '';
            const selG = document.getElementById('filter-users-group');
            if (selG) selG.value = 'all';
            const selS = document.getElementById('filter-users-supervisor');
            if (selS) selS.value = 'all';
            const selR = document.getElementById('filter-users-role');
            if (selR) selR.value = 'all';
            const chk = document.getElementById('toggle-users-inactive');
            if (chk) chk.checked = false;
            renderUsersList();
        };

        const ensureUserGroupsBadges = async (userId) => {
            const target = document.getElementById(`user-groups-${userId}`);
            if (!target) return;
            try {
                const data = await authFetch(`utenti/${userId}/groups`);
                const groups = Array.isArray(data)
                    ? data
                    : normalizeListResponse(data, ['gruppi', 'groups']);
                if (!groups || groups.length === 0) {
                    target.innerHTML = '<small class="form-hint">Nessun gruppo assegnato.</small>';
                    return;
                }
                target.innerHTML = groups
                    .map((g) => {
                        const label = sanitize(buildGroupLabel(g) || g.nome || 'Gruppo #' + g.id);
                        const m = state.groups?.find((x) => Number(x.id) === Number(g.id));
                        const cnt =
                            m && m.users_count !== undefined
                                ? ` (${Number(m.users_count) || 0})`
                                : '';
                        return `<span class="badge">${label}${cnt}</span>`;
                    })
                    .join(' ');
            } catch (e) {
                target.innerHTML = '<small class="form-hint">Errore caricamento gruppi.</small>';
            }
        };

        const populateActionSelect = () => {
            if (!stepActionSelect) return;
            const current = stepActionSelect.value;
            stepActionSelect.innerHTML = '<option value="">Nessuna</option>';
            workflowState.actions.forEach((action) => {
                const option = document.createElement('option');
                option.value = action.id;
                const label = action.nome || action.nome_azione || action.codice || `Azione #${action.id}`;
                option.textContent = sanitize(label);
                stepActionSelect.appendChild(option);
            });
            stepActionSelect.value = current || '';
            renderActionParameterInputs(stepActionSelect.value);
        };

        const parseActionParameters = (action) => {
            if (!action) return [];
            let raw = action.parametri_richiesti;
            if (!raw) return [];
            if (typeof raw === 'string') {
                try {
                    raw = JSON.parse(raw);
                } catch (err) {
                    console.warn('Impossibile parsare parametri per azione', action.id, raw);
                    return [];
                }
            }

            if (Array.isArray(raw)) {
                return raw
                    .map((item) => {
                        if (typeof item === 'string') {
                            return { name: item, label: item, type: 'text' };
                        }
                        return {
                            name: item.name || item.key,
                            label: item.label || item.name || item.key,
                            type: item.type || 'text',
                            options: item.options || [],
                            placeholder: item.placeholder || '',
                        };
                    })
                    .filter((def) => def && def.name);
            }

            if (raw && typeof raw === 'object') {
                return Object.entries(raw).map(([key, value]) => {
                    if (typeof value === 'string') {
                        return { name: key, label: value, type: 'text' };
                    }
                    return {
                        name: key,
                        label: value.label || key,
                        type: value.type || 'text',
                        options: value.options || [],
                        placeholder: value.placeholder || '',
                    };
                });
            }

            return [];
        };

        const renderActionParameterInputs = (actionId) => {
            if (!actionParamsSection || !actionParamsContainer) return;
            actionParamsContainer.innerHTML = '';
            actionParamsSection.hidden = true;

            if (!actionId) {
                return;
            }

            const action = workflowState.actions.find((a) => a.id == actionId);
            const params = parseActionParameters(action);
            if (!params.length) {
                return;
            }

            params.forEach((param) => {
                const wrapper = document.createElement('label');
                wrapper.className = 'form-control';
                wrapper.innerHTML = `<span>${sanitize(param.label || param.name)}</span>`;

                let input;
                if (
                    param.type === 'select' &&
                    Array.isArray(param.options) &&
                    param.options.length
                ) {
                    input = document.createElement('select');
                    input.dataset.paramKey = param.name;
                    input.innerHTML =
                        '<option value="">Seleziona...</option>' +
                        param.options
                            .map((opt) => {
                                if (typeof opt === 'string') {
                                    return `<option value="${sanitize(opt)}">${sanitize(opt)}</option>`;
                                }
                                return `<option value="${sanitize(opt.value)}">${sanitize(opt.label || opt.value)}</option>`;
                            })
                            .join('');
                } else {
                    input = document.createElement('input');
                    input.type = param.type || 'text';
                    input.placeholder = param.placeholder || '';
                    input.dataset.paramKey = param.name;
                }

                wrapper.appendChild(input);
                actionParamsContainer.appendChild(wrapper);
            });

            actionParamsSection.hidden = false;
        };

        const resetStepForm = () => {
            if (!formCreateStep) return;
            formCreateStep.reset();
            formCreateStep.dataset.mode = 'create';
            delete formCreateStep.dataset.stepId;
            if (modalStepTitle) modalStepTitle.textContent = 'Nuovo passo';
            if (stepSubmitBtn) stepSubmitBtn.textContent = 'Aggiungi passo';
            if (actionParamsContainer) actionParamsContainer.innerHTML = '';
            if (actionParamsSection) actionParamsSection.hidden = true;
            if (stepActionSelect) stepActionSelect.value = '';
            workflowState.editingStepId = null;
            workflowState.editingStepData = null;
            if (groupHiddenInput) groupHiddenInput.value = '';
            if (groupLabelInput) {
                groupLabelInput.value = '';
                groupLabelInput.removeAttribute('data-selected-id');
            }
            if (userHiddenInput) userHiddenInput.value = '';
            if (userLabelInput) {
                userLabelInput.value = '';
                userLabelInput.removeAttribute('data-selected-id');
            }
        };

        const populateStepForm = (step) => {
            if (!formCreateStep) return;
            resetStepForm();
            formCreateStep.dataset.mode = 'edit';
            formCreateStep.dataset.stepId = step.id;
            workflowState.editingStepId = step.id;
            if (modalStepTitle) modalStepTitle.textContent = 'Modifica passo';
            if (stepSubmitBtn) stepSubmitBtn.textContent = 'Salva modifiche';
            workflowState.editingStepData = step;

            formCreateStep.elements.nome_passo.value = step.nome_passo || '';
            formCreateStep.elements.descrizione.value = step.descrizione || '';
            if (formCreateStep.elements.ordine)
                formCreateStep.elements.ordine.value = step.ordine || 1;
            if (formCreateStep.elements.sottopasso)
                formCreateStep.elements.sottopasso.value = step.sottopasso || 1;
            if (formCreateStep.elements.scadenza_standard_valore) {
                formCreateStep.elements.scadenza_standard_valore.value =
                    step.scadenza_standard_valore ?? '';
            }
            if (formCreateStep.elements.scadenza_standard_unita) {
                formCreateStep.elements.scadenza_standard_unita.value =
                    step.scadenza_standard_unita ?? '';
            }
            if (groupHiddenInput) {
                const groupId = step.responsabile_gruppo_id ?? '';
                groupHiddenInput.value = groupId;
                if (groupLabelInput) {
                    const groupObj = state.groups.find((g) => Number(g.id) === Number(groupId));
                    const label = groupObj
                        ? buildGroupLabel(groupObj)
                        : groupId
                          ? `Gruppo #${groupId}`
                          : '';
                    groupLabelInput.value = label;
                    if (groupObj) {
                        groupLabelInput.setAttribute('data-selected-id', groupId);
                    } else {
                        groupLabelInput.removeAttribute('data-selected-id');
                    }
                }
            }
            if (userHiddenInput) {
                const userId = step.responsabile_utente_id ?? '';
                userHiddenInput.value = userId;
                if (userLabelInput) {
                    const userObj = state.users.find((u) => Number(u.id) === Number(userId));
                    const label = userObj
                        ? buildUserLabel(userObj)
                        : userId
                          ? `Utente #${userId}`
                          : '';
                    userLabelInput.value = label;
                    if (userObj) {
                        userLabelInput.setAttribute('data-selected-id', userId);
                    } else {
                        userLabelInput.removeAttribute('data-selected-id');
                    }
                }
            }

            if (stepActionSelect) {
                stepActionSelect.value = step.tipo_azione_standard || '';
                renderActionParameterInputs(stepActionSelect.value);
                if (step.parametri_azione && actionParamsContainer) {
                    let paramsData = step.parametri_azione;
                    if (typeof paramsData === 'string') {
                        try {
                            paramsData = JSON.parse(paramsData);
                        } catch (err) {
                            paramsData = {};
                        }
                    }
                    if (paramsData && typeof paramsData === 'object') {
                        actionParamsContainer
                            .querySelectorAll('[data-param-key]')
                            .forEach((input) => {
                                const key = input.dataset.paramKey;
                                if (key && paramsData[key] !== undefined) {
                                    input.value = paramsData[key];
                                }
                            });
                    }
                }
            }
        };

        const openStepEdit = async (stepId) => {
            try {
                const step = await authFetch(`workflowsteps/${stepId}`);
                populateStepForm(step);
                openModal('modal-create-step');
            } catch (error) {
                alert(error.message || 'Impossibile caricare il passo selezionato.');
            }
        };

        const renderWorkflowList = () => {
            if (!dom.workflowsList) return;
            const container = dom.workflowsList;
            if (!workflowState.list.length) {
                renderMessage(container, 'Nessun workflow disponibile.');
                return;
            }

            container.innerHTML = '';
            workflowState.list.forEach((wf) => {
                const card = document.createElement('article');
                card.className = 'workflow-card';
                if (wf.id === workflowState.selectedId) {
                    card.classList.add('is-active');
                }
                card.dataset.action = 'select-workflow';
                card.dataset.id = wf.id;

                const name = sanitize(wf.nome_workflow || wf.nome || `Workflow #${wf.id}`);
                const descr = sanitize(wf.descrizione || '—');
                const attivo =
                    wf.attivo === undefined || wf.attivo === null
                        ? 'Sconosciuto'
                        : wf.attivo
                          ? 'Attivo'
                          : 'Disattivo';

                card.innerHTML = `
                    <h4>${name}</h4>
                    <p>${descr}</p>
                    <small>Stato: ${attivo}</small>
                `;

                container.appendChild(card);
            });
        };

        const renderWorkflowDetail = (workflow) => {
            const nameEl = document.getElementById('workflow-detail-name');
            const descEl = document.getElementById('workflow-detail-description');
            const infoEl = document.getElementById('workflow-info');
            const stepsEl = document.getElementById('workflow-steps');
            const btnEditWf = document.getElementById('btn-edit-workflow');
            const btnToggleWf = document.getElementById('btn-toggle-workflow');

            if (!workflow) {
                if (nameEl) nameEl.textContent = 'Nessun workflow selezionato';
                if (descEl)
                    descEl.textContent =
                        "Scegli un elemento dall'elenco per vedere passi, assegnazioni e impostazioni.";
                if (infoEl) infoEl.innerHTML = '';
                if (stepsEl) stepsEl.innerHTML = '';
                if (btnAddStep) btnAddStep.disabled = true;
                if (btnStartInstance) btnStartInstance.disabled = true;
                return;
            }

            const name = sanitize(
                workflow.nome || workflow.nome_workflow || `Workflow #${workflow.id}`,
            );
            const descr = sanitize(workflow.descrizione || '—');
            const attivo = workflow.attivo ? 'Attivo' : 'Disattivo';
            const steps = Array.isArray(workflow.steps) ? workflow.steps : [];
            // Salva snapshot ordine iniziale se non presente
            try {
                if (workflow && workflow.id && !workflowState.orderBackup[workflow.id]) {
                    workflowState.orderBackup[workflow.id] = (steps || []).map((s) => ({
                        id: Number(s.id),
                        ordine: Number(s.ordine),
                        sottopasso: Number(s.sottopasso),
                    }));
                }
            } catch (e) {
                /* ignore */
            }

            if (nameEl) nameEl.textContent = name;
            if (descEl) descEl.textContent = descr;
            if (btnAddStep) btnAddStep.disabled = false;
            if (btnStartInstance) btnStartInstance.disabled = false;
            if (btnEditWf) btnEditWf.disabled = false;
            if (btnToggleWf) {
                btnToggleWf.disabled = false;
                btnToggleWf.textContent = workflow.attivo ? 'Disattiva' : 'Attiva';
                btnToggleWf.classList.toggle('btn-danger', !!workflow.attivo);
            }

            if (infoEl) {
                infoEl.innerHTML = `
                    <div class="workflow-info__item">
                        <strong>ID modello</strong>
                        <span>${workflow.id}</span>
                    </div>
                    <div class="workflow-info__item">
                        <strong>Stato</strong>
                        <span>${attivo}</span>
                    </div>
                    <div class="workflow-info__item">
                        <strong>Numero passi</strong>
                        <span>${steps.length}</span>
                    </div>
                `;
            }

            if (stepsEl) {
                if (!steps.length) {
                    stepsEl.innerHTML = '<p>Nessun passo definito per questo workflow.</p>';
                } else {
                    const rows = steps
                        .map((step) => {
                            const scadenza = step.scadenza_standard_valore
                                ? `${step.scadenza_standard_valore} ${step.scadenza_standard_unita === 'ORE' ? 'ore' : 'giorni'}`
                                : '—';
                            const action = workflowState.actions.find(
                                (a) => a.id == step.tipo_azione_standard,
                            );
                            const actionName = action
                                ? sanitize(action.nome || action.nome_azione || action.codice || `Azione #${action.id}`)
                                : step.tipo_azione_standard
                                  ? `Azione #${step.tipo_azione_standard}`
                                  : '—';
                            const groupObj = step.responsabile_gruppo_id
                                ? state.groups.find(
                                      (g) => Number(g.id) === Number(step.responsabile_gruppo_id),
                                  )
                                : null;
                            const userObj = step.responsabile_utente_id
                                ? state.users.find(
                                      (u) => Number(u.id) === Number(step.responsabile_utente_id),
                                  )
                                : null;
                            const groupLabel = step.responsabile_gruppo_id
                                ? sanitize(
                                      groupObj
                                          ? buildGroupLabel(groupObj)
                                          : `Gruppo #${step.responsabile_gruppo_id}`,
                                  )
                                : '—';
                            const userLabel = step.responsabile_utente_id
                                ? sanitize(
                                      userObj
                                          ? buildUserLabel(userObj)
                                          : `Utente #${step.responsabile_utente_id}`,
                                  )
                                : '—';
                            let actionParams = '';
                            if (step.parametri_azione) {
                                try {
                                    const parsed =
                                        typeof step.parametri_azione === 'string'
                                            ? JSON.parse(step.parametri_azione)
                                            : step.parametri_azione;
                                    const entries = Object.entries(parsed || {});
                                    if (entries.length) {
                                        actionParams = entries
                                            .map(
                                                ([key, value]) =>
                                                    `${sanitize(key)}: ${sanitize(value)}`,
                                            )
                                            .join(', ');
                                    }
                                } catch (err) {
                                    actionParams = sanitize(step.parametri_azione);
                                }
                            }
                            const hasActive = step.attivo !== undefined && step.attivo !== null;
                            const actionsHtml = `
                            <button class="btn-link" data-action="edit-step" data-step-id="${step.id}">Modifica</button>
                            <button class="btn-link" data-action="promote-step" data-step-id="${step.id}" title="Sposta al livello precedente">↑ Promuovi</button>
                            <button class="btn-link" data-action="demote-step" data-step-id="${step.id}" title="Sposta al livello successivo">↓ Demota</button>
                            ${hasActive ? `<button class="btn-link" data-action="toggle-step" data-step-id="${step.id}" data-next="${step.attivo ? 0 : 1}">${step.attivo ? 'Disattiva' : 'Attiva'}</button>` : ''}
                            <button class="btn-link" data-action="delete-step" data-step-id="${step.id}">Elimina</button>
                        `;
                            return `
                            <tr>
                                <td class="dnd-handle" title="Trascina per riordinare">≡</td>
                                <td>${step.ordine}.${step.sottopasso}</td>
                                <td>${sanitize(step.nome_passo)}</td>
                                <td>${sanitize(step.descrizione || '—')}</td>
                                <td>${scadenza}</td>
                                <td>${actionName}${actionParams ? `<br><small>${actionParams}</small>` : ''}</td>
                                <td>${groupLabel}</td>
                                <td>${userLabel}</td>
                                <td>${actionsHtml}</td>
                            </tr>
                        `;
                        })
                        .join('');

                    stepsEl.innerHTML = `
                        <div class="steps-toolbar" style="display:flex; gap:8px; align-items:center; margin-bottom:8px;">
                            <button class="btn btn-secondary" data-action="restore-steps-order">Ripristina ordine</button>
                            <button class="btn" data-action="snapshot-steps-order">Imposta come base</button>
                            <button class="btn" data-action="snapshot-steps-order-reset" title="Imposta come base e azzera history">Imposta base + azzera</button>
                            <small id="steps-order-status" class="badge" style="margin-left:auto;">—</small>
                            <button class="btn" data-action="undo-steps-order" id="btn-steps-undo" title="Annulla" style="margin-left:8px;">↶ Undo</button>
                            <button class="btn" data-action="redo-steps-order" id="btn-steps-redo" title="Ripristina">↷ Redo</button>
                            <small id="steps-history-count" class="badge" title="Posizione history"></small>
                        </div>
                        <div class="workflow-steps__table">
                            <table>
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th>Ordine</th>
                                        <th>Nome</th>
                                        <th>Descrizione</th>
                                        <th>Scadenza</th>
                                        <th>Azione</th>
                                        <th>Gruppo</th>
                                        <th>Utente</th>
                                        <th>Azioni</th>
                                    </tr>
                                </thead>
                                <tbody>${rows}</tbody>
                            </table>
                        </div>
                    `;
                    // Aggiorna lo stato visuale dell'ordine
                    try {
                        updateStepsOrderStatus();
                    } catch (e) {
                        /* ignore */
                    }
                    // Abilita drag&drop per riordinare sottopassi e cambiare ordine
                    try {
                        setupStepsDragAndDrop(steps);
                    } catch (e) {
                        /* ignore */
                    }
                }
            }

            if (btnAddStep) btnAddStep.disabled = false;
            if (btnStartInstance) btnStartInstance.disabled = false;
        };

        // DnD: riordino sottopassi entro lo stesso 'ordine'
        const setupStepsDragAndDrop = (steps) => {
            const table = document.querySelector('.workflow-steps__table tbody');
            if (!table) return;
            // Annotazioni su righe
            [...table.querySelectorAll('tr')].forEach((tr, idx) => {
                const step = steps[idx];
                if (!step) return;
                tr.dataset.stepId = String(step.id);
                tr.dataset.stepOrdine = String(step.ordine);
                tr.dataset.stepSottopasso = String(step.sottopasso);
                tr.setAttribute('draggable', 'true');
            });

            let dragging = null;
            const onDragStart = (e) => {
                const tr = e.currentTarget;
                dragging = tr;
                tr.classList.add('is-dragging');
                e.dataTransfer.effectAllowed = 'move';
            };
            const onDragEnd = (e) => {
                const tr = e.currentTarget;
                tr.classList.remove('is-dragging');
                [...table.querySelectorAll('tr')].forEach((r) =>
                    r.classList.remove('drop-before', 'drop-after'),
                );
                dragging = null;
            };
            const onDragOver = (e) => {
                if (!dragging) return;
                const tgt = e.currentTarget;
                if (tgt === dragging) return;
                e.preventDefault();
                const rect = tgt.getBoundingClientRect();
                const before = e.clientY - rect.top < rect.height / 2;
                [...table.querySelectorAll('tr')].forEach((r) =>
                    r.classList.remove('drop-before', 'drop-after'),
                );
                tgt.classList.add(before ? 'drop-before' : 'drop-after');
            };
            const onDrop = async (e) => {
                if (!dragging) return;
                const tgt = e.currentTarget;
                e.preventDefault();
                const before = tgt.classList.contains('drop-before');
                // Se l'ordine è già modificato e il drop cambia ordine, chiedi conferma
                const srcOrder = Number(dragging.dataset.stepOrdine);
                const tgtOrder = Number(tgt.dataset.stepOrdine);
                if (srcOrder !== tgtOrder) {
                    const badge = document.getElementById('steps-order-status');
                    if (badge && badge.dataset.dirty === '1') {
                        const ok = confirm(
                            "Ci sono modifiche all'ordine non ripristinate. Procedere con lo spostamento tra ordini?",
                        );
                        if (!ok) {
                            tgt.classList.remove('drop-before', 'drop-after');
                            return;
                        }
                    }
                }
                tgt.classList.remove('drop-before', 'drop-after');
                // muovi DOM
                if (before) table.insertBefore(dragging, tgt);
                else table.insertBefore(dragging, tgt.nextSibling);
                // calcola nuovo assetto ordini/sottopassi leggendo il DOM
                // srcOrder/tgtOrder già calcolati sopra
                // se cambiato ordine, aggiorna dataset per il dragging
                if (srcOrder !== tgtOrder) {
                    dragging.dataset.stepOrdine = String(tgtOrder);
                }
                const rows = [...table.querySelectorAll('tr')];
                // Gruppo per ordine
                const groups = new Map();
                for (const row of rows) {
                    const ord = Number(row.dataset.stepOrdine);
                    if (!groups.has(ord)) groups.set(ord, []);
                    groups.get(ord).push(row);
                }
                const updates = [];
                for (const [ord, arr] of groups.entries()) {
                    arr.forEach((row, idx) => {
                        const id = Number(row.dataset.stepId);
                        const newSub = idx + 1;
                        const oldSub = Number(row.dataset.stepSottopasso);
                        const oldOrd = Number(row.dataset.stepOrdine);
                        if (newSub !== oldSub || ord !== oldOrd) {
                            updates.push({ id, ordine: ord, sottopasso: newSub });
                        }
                    });
                }
                // salva solo i cambi effettivi
                for (const u of updates) {
                    try {
                        await authFetch(`workflowsteps/${u.id}`, {
                            method: 'PUT',
                            json: true,
                            body: { ordine: u.ordine, sottopasso: u.sottopasso },
                        });
                    } catch (err) {
                        try {
                            showToast(err.message || 'Errore salvataggio ordine passo', {
                                type: 'error',
                            });
                        } catch (e) {}
                    }
                }
                // ricarica dettaglio per allineare stato
                try {
                    if (workflowState.selectedId) {
                        await loadWorkflowDetail(workflowState.selectedId);
                        const wfId = workflowState.selectedId;
                        const order = getStepsOrderList(
                            (workflowState.detailCache[wfId] || {}).steps || [],
                        );
                        pushOrderHistory(wfId, order);
                    }
                } catch (e) {}
            };

            [...table.querySelectorAll('tr')].forEach((tr) => {
                tr.addEventListener('dragstart', onDragStart);
                tr.addEventListener('dragend', onDragEnd);
                tr.addEventListener('dragover', onDragOver);
                tr.addEventListener('drop', onDrop);
            });
        };

        // Stato ordine: badge aggiornato in base a differenze con snapshot
        const updateStepsOrderStatus = () => {
            const wfId = workflowState.selectedId;
            const el = document.getElementById('steps-order-status');
            if (!el || !wfId) return;
            const steps = (workflowState.detailCache[wfId] || {}).steps || [];
            const curr = JSON.stringify(getStepsOrderList(steps));
            const base = JSON.stringify(workflowState.orderBackup[wfId] || []);
            const dirty = curr !== base;
            el.textContent = dirty ? 'Ordine modificato' : 'Ordine allineato';
            el.classList.toggle('badge-error', dirty);
            el.classList.toggle('badge-success', !dirty);
            // Rendilo cliccabile come "Annulla modifiche" quando dirty
            el.dataset.dirty = dirty ? '1' : '0';
            el.title = dirty
                ? "Clicca per annullare le modifiche all'ordine"
                : 'Ordine allineato alla base';
            el.style.cursor = dirty ? 'pointer' : 'default';
        };

        // Helpers snapshot ordine passi
        const getStepsOrderList = (steps) =>
            (steps || [])
                .map((s) => ({
                    id: Number(s.id),
                    ordine: Number(s.ordine),
                    sottopasso: Number(s.sottopasso),
                }))
                .sort((a, b) =>
                    a.ordine === b.ordine ? a.sottopasso - b.sottopasso : a.ordine - b.ordine,
                );

        const restoreStepsOrder = async () => {
            const wfId = workflowState.selectedId;
            if (!wfId) return;
            const backup = workflowState.orderBackup[wfId];
            // removed unused variable 'current'
            if (!backup || !backup.length) {
                alert('Nessun ordine di riferimento salvato.');
                return;
            }
            await applyStepsOrder(wfId, backup);
            try {
                showToast('Ordine ripristinato', { type: 'success' });
            } catch (e) {}
        };

        const snapshotCurrentStepsOrder = () => {
            const wfId = workflowState.selectedId;
            if (!wfId) return;
            const steps = (workflowState.detailCache[wfId] || {}).steps || [];
            workflowState.orderBackup[wfId] = (steps || []).map((s) => ({
                id: Number(s.id),
                ordine: Number(s.ordine),
                sottopasso: Number(s.sottopasso),
            }));
            try {
                showToast('Snapshot ordine aggiornato', { type: 'success' });
            } catch (e) {}
            updateStepsOrderStatus();
        };

        const snapshotCurrentStepsOrderAndResetHistory = () => {
            const wfId = workflowState.selectedId;
            if (!wfId) return;
            const steps = (workflowState.detailCache[wfId] || {}).steps || [];
            const order = (steps || []).map((s) => ({
                id: Number(s.id),
                ordine: Number(s.ordine),
                sottopasso: Number(s.sottopasso),
            }));
            workflowState.orderBackup[wfId] = order;
            workflowState.orderHistory[wfId] = { stack: [order], index: 0 };
            try {
                showToast('Base impostata e history azzerata', { type: 'success' });
            } catch (e) {}
            updateStepsOrderStatus();
            updateStepsHistoryUI();
        };

        const updateStepsHistoryUI = () => {
            const wfId = workflowState.selectedId;
            const hist = wfId ? workflowState.orderHistory[wfId] : null;
            const canUndo = !!hist && hist.index > 0;
            const canRedo = !!hist && hist.index < hist.stack.length - 1;
            const btnUndo = document.getElementById('btn-steps-undo');
            const btnRedo = document.getElementById('btn-steps-redo');
            if (btnUndo) btnUndo.disabled = !canUndo;
            if (btnRedo) btnRedo.disabled = !canRedo;
            const ctr = document.getElementById('steps-history-count');
            if (ctr) {
                if (hist && hist.stack && hist.stack.length) {
                    ctr.textContent = `${hist.index + 1}/${hist.stack.length}`;
                } else {
                    ctr.textContent = '0/0';
                }
            }
        };

        // Sposta un passo su ordine precedente/successivo e rinumera i sottopassi
        const moveStepAcrossOrders = async (stepId, delta) => {
            try {
                const wfId = workflowState.selectedId;
                if (!wfId) return;
                let steps = workflowState.detailCache[wfId]?.steps || [];
                const step = steps.find((s) => Number(s.id) === Number(stepId));
                if (!step) return;
                const currentOrder = Number(step.ordine) || 1;
                const targetOrder = currentOrder + (delta > 0 ? 1 : -1);
                if (targetOrder < 1) return;
                // Re-numera source: chiude il buco del sottopasso
                const src = steps
                    .filter(
                        (s) => Number(s.ordine) === currentOrder && Number(s.id) !== Number(stepId),
                    )
                    .sort((a, b) => Number(a.sottopasso) - Number(b.sottopasso));
                const tgt = steps
                    .filter((s) => Number(s.ordine) === targetOrder)
                    .sort((a, b) => Number(a.sottopasso) - Number(b.sottopasso));
                const updates = [];
                // Aggiorna il passo spostato: nuovo ordine e sottopasso in coda
                updates.push({
                    id: Number(stepId),
                    ordine: targetOrder,
                    sottopasso: tgt.length + 1,
                });
                // Rinumera i sottopassi della sorgente
                src.forEach((s, idx) => {
                    const newSub = idx + 1;
                    if (Number(s.sottopasso) !== newSub) {
                        updates.push({
                            id: Number(s.id),
                            sottopasso: newSub,
                            ordine: currentOrder,
                        });
                    }
                });

                for (const u of updates) {
                    await authFetch(`workflowsteps/${u.id}`, {
                        method: 'PUT',
                        json: true,
                        body: { ordine: u.ordine, sottopasso: u.sottopasso },
                    });
                }
                await loadWorkflowDetail(wfId);
                try {
                    showToast('Ordine passi aggiornato', { type: 'success' });
                } catch (e) {}
            } catch (e) {
                alert(e.message || 'Errore durante il riordino del passo.');
            }
        };

        const loadWorkflowDetail = async (id) => {
            if (!id) return;
            try {
                workflowState.editingStepId = null;
                workflowState.editingStepData = null;
                if (!workflowState.detailCache[id]) {
                    const detail = await authFetch(`workflows/${id}`);
                    workflowState.detailCache[id] = detail;
                }
                workflowState.selectedId = id;
                renderWorkflowList();
                renderWorkflowDetail(workflowState.detailCache[id]);
            } catch (error) {
                alert(error.message || 'Impossibile caricare i dettagli del workflow.');
            }
        };

        const normalizeUsersResponse = (data) => {
            const list = normalizeListResponse(data, ['utenti', 'users']);
            return list.filter((item) => item && typeof item === 'object' && item.id !== undefined);
        };

        const loadUsers = async () => {
            try {
                // Fetch completo: includi sempre inattivi, gruppi e supervisor
                const params = new URLSearchParams();
                params.set('include_inactive', '1');
                params.set('with_groups', '1');
                params.set('with_supervisors', '1');
                const raw = await authFetch(`utenti?${params.toString()}`);
                const users = normalizeUsersResponse(raw);
                state.users = Array.isArray(users) ? users : [];

                // Popola il pannello ruoli e utenti per ruolo
                populateRoleUserSelect();
                populateUsersByRoleSupervisor();
                renderUsersByRole();
                // Popola combo supervisor nel pannello Ruoli
                try {
                    populateRoleUserSupervisorSelect();
                } catch (e) {}
                // Se un utente è già selezionato e ha ruolo USER, pre-seleziona suo supervisor
                try {
                    const uid = dom.roleUserSelect?.value;
                    const roleSel = (dom.roleRoleSelect?.value || '').toUpperCase();
                    if (uid && roleSel === 'USER') preselectRoleUserSupervisor(uid);
                } catch (e) {}

                if (dom.userSelector) {
                    dom.userSelector.innerHTML = '';

                    const role = (state.currentUserInfo.ruolo || '').toUpperCase();
                    if (role === 'ADMIN') {
                        const allOpt = document.createElement('option');
                        allOpt.value = 'all';
                        allOpt.textContent = 'Tutti gli utenti';
                        dom.userSelector.appendChild(allOpt);

                        if (state.users.length === 0) {
                            const warnOpt = document.createElement('option');
                            warnOpt.value = '';
                            warnOpt.disabled = true;
                            warnOpt.textContent = 'Nessun utente disponibile';
                            dom.userSelector.appendChild(warnOpt);
                        }

                        state.users.forEach((user) => {
                            const opt = document.createElement('option');
                            opt.value = user.id;
                            opt.textContent = buildUserLabel(user);
                            dom.userSelector.appendChild(opt);
                        });

                        dom.userSelector.disabled = false;
                        dom.userSelector.value = 'all';
                        state.currentUser = state.currentUser || 'all';
                    } else if (role === 'SUPERVISOR') {
                        let supervised = [];
                        try {
                            supervised = await authFetch(
                                `utenti/${state.currentUserId}/supervised`,
                            );
                        } catch (e) {
                            supervised = [];
                        }
                        supervised = Array.isArray(supervised) ? supervised : [];
                        if (supervised.length === 0) {
                            dom.userSelector.innerHTML =
                                '<option value="all" disabled>Nessun utente associato</option>';
                        } else {
                            supervised.forEach((user) => {
                                const opt = document.createElement('option');
                                opt.value = user.id;
                                opt.textContent = buildUserLabel(user);
                                dom.userSelector.appendChild(opt);
                            });
                            dom.userSelector.disabled = false;
                            dom.userSelector.value = supervised[0].id;
                            state.currentUser = String(supervised[0].id);
                        }
                    } else {
                        const currentOption = document.createElement('option');
                        const currentUser = state.users.find(
                            (u) => Number(u.id) === Number(state.currentUserId),
                        ) || {
                            id: state.currentUserId,
                            nome: state.currentUserInfo?.nome,
                            cognome: state.currentUserInfo?.cognome,
                            email: state.currentUserInfo?.email,
                        };
                        currentOption.value = currentUser.id;
                        currentOption.textContent = buildUserLabel(currentUser);
                        dom.userSelector.appendChild(currentOption);
                        dom.userSelector.disabled = true;
                        dom.userSelector.value = String(currentUser.id);
                        state.currentUser = String(currentUser.id);
                    }
                }

                if (userOptions) {
                    populateDatalist(userOptions, state.users, buildUserLabel);
                }
                if (adminUserOptions) {
                    populateDatalist(adminUserOptions, state.users, buildUserLabel);
                }
                // Aggiorna filtro supervisor con conteggi
                populateMainSupervisorFilter();
            } catch (error) {
                console.error('Errore caricamento utenti', error);
                if (dom.userSelector) {
                    dom.userSelector.innerHTML = '<option value="all">Tutti gli utenti</option>';
                    const warnOpt = document.createElement('option');
                    warnOpt.value = '';
                    warnOpt.disabled = true;
                    warnOpt.textContent = 'Errore nel caricamento';
                    dom.userSelector.appendChild(warnOpt);
                }
                state.users = [];
                if (userOptions) {
                    userOptions.innerHTML = '';
                }
            }
        };

        const populateMainSupervisorFilter = () => {
            if (!dom.filterUsersSupervisor) return;
            const sel = dom.filterUsersSupervisor;
            const current = sel.value || 'all';
            sel.innerHTML = '<option value="all">Tutti</option>';
            // calcola conteggi: quanti utenti hanno quel supervisor
            const supervisors = (state.users || []).filter(
                (u) => (u.ruolo || '').toUpperCase() === 'SUPERVISOR',
            );
            const counts = new Map();
            (state.users || []).forEach((u) => {
                (u.supervisors || []).forEach((s) => {
                    const id = Number(s.id);
                    counts.set(id, (counts.get(id) || 0) + 1);
                });
            });
            supervisors.forEach((s) => {
                const opt = document.createElement('option');
                opt.value = s.id;
                const cnt = counts.get(Number(s.id)) || 0;
                opt.textContent = `${buildUserLabel(s)} (${cnt})`;
                sel.appendChild(opt);
            });
            sel.value = current;
        };

        const populateRoleUserSelect = () => {
            if (!dom.roleUserSelect) return;
            const sel = dom.roleUserSelect;
            const current = sel.value || '';
            sel.innerHTML = '<option value="">Seleziona utente…</option>';
            state.users.forEach((u) => {
                const opt = document.createElement('option');
                opt.value = u.id;
                opt.textContent = buildUserLabel(u);
                opt.dataset.role = (u.ruolo || '').toUpperCase();
                sel.appendChild(opt);
            });
            sel.value = current;
            // sincronizza select ruolo se coerente
            if (sel.value && dom.roleRoleSelect) {
                const selected = sel.options[sel.selectedIndex];
                if (selected && selected.dataset.role)
                    dom.roleRoleSelect.value = selected.dataset.role;
            }
        };

        const renderUsersByRole = () => {
            if (!dom.usersByRole) return;
            const byRole = { ADMIN: [], SUPERVISOR: [], USER: [] };
            const q = (dom.filterUsersByRole?.value || '').toLowerCase();
            const onlyActive = !!dom.toggleUsersByRoleActive?.checked;
            const supSel = dom.filterUsersByRoleSupervisor;
            const supFilter = supSel ? supSel.value : 'all';
            (state.users || []).forEach((u) => {
                const r = (u.ruolo || 'USER').toUpperCase();
                if (!byRole[r]) byRole[r] = [];
                const label = (buildUserLabel(u) || '').toLowerCase();
                const isActive = String(u.stato || 'ATTIVO').toUpperCase() === 'ATTIVO';
                if (q && !label.includes(q)) return;
                if (onlyActive && !isActive) return;
                if (supFilter && supFilter !== 'all') {
                    const sid = Number(supFilter);
                    if (
                        !(
                            Array.isArray(u.supervisors) &&
                            u.supervisors.some((s) => Number(s.id) === sid)
                        )
                    )
                        return;
                }
                byRole[r].push(u);
            });
            const renderList = (container, list) => {
                if (!container) return;
                if (!list || list.length === 0) {
                    container.innerHTML = '<p class="form-hint">Nessun utente.</p>';
                    return;
                }
                container.innerHTML = list
                    .map(
                        (u) =>
                            `<div class="list-item"><div class="item-header"><strong>${sanitize(buildUserLabel(u))}</strong><span class="badge">${sanitize(u.ruolo || '')}</span></div></div>`,
                    )
                    .join('');
            };
            renderList(dom.listRoleAdmin, byRole.ADMIN);
            renderList(dom.listRoleSupervisor, byRole.SUPERVISOR);
            renderList(dom.listRoleUser, byRole.USER);
            if (dom.countRoleAdmin)
                dom.countRoleAdmin.textContent = String(byRole.ADMIN.length || 0);
            if (dom.countRoleSupervisor)
                dom.countRoleSupervisor.textContent = String(byRole.SUPERVISOR.length || 0);
            if (dom.countRoleUser) dom.countRoleUser.textContent = String(byRole.USER.length || 0);
        };

        // Listeners per filtro Users-by-Role
        dom.filterUsersByRole?.addEventListener('input', () => renderUsersByRole());
        dom.toggleUsersByRoleActive?.addEventListener('change', () => renderUsersByRole());
        dom.filterUsersByRoleSupervisor?.addEventListener('change', () => renderUsersByRole());

        const populateUsersByRoleSupervisor = () => {
            const sel = dom.filterUsersByRoleSupervisor;
            if (!sel) return;
            const current = sel.value || 'all';
            sel.innerHTML = '<option value="all">Tutti</option>';
            const supervisors = (state.users || []).filter(
                (u) => (u.ruolo || '').toUpperCase() === 'SUPERVISOR',
            );
            supervisors.forEach((s) => {
                const opt = document.createElement('option');
                opt.value = s.id;
                opt.textContent = buildUserLabel(s);
                sel.appendChild(opt);
            });
            sel.value = current;
        };

        if (dom.roleUserSelect) {
            dom.roleUserSelect.addEventListener('change', () => {
                const opt = dom.roleUserSelect.options[dom.roleUserSelect.selectedIndex];
                if (opt && dom.roleRoleSelect) {
                    dom.roleRoleSelect.value = opt.dataset.role || 'USER';
                }
                const userId = dom.roleUserSelect.value;
                const role = (dom.roleRoleSelect.value || '').toUpperCase();
                if (dom.supervisedSection) dom.supervisedSection.hidden = role !== 'SUPERVISOR';
                if (role === 'SUPERVISOR') {
                    populateSupervisedMulti();
                    preselectSupervised(userId);
                }
                // Supervisione per USER
                const userSupField = document.getElementById('user-supervisor-field');
                if (userSupField) userSupField.hidden = role !== 'USER';
                if (role === 'USER') {
                    populateRoleUserSupervisorSelect();
                    preselectRoleUserSupervisor(userId);
                }
            });
        }

        if (dom.roleSaveBtn) {
            dom.roleSaveBtn.addEventListener('click', async () => {
                if (!state.permissions.manageRoles) {
                    alert('Permesso negato.');
                    return;
                }
                const uid = dom.roleUserSelect?.value;
                const role = dom.roleRoleSelect?.value;
                if (!uid || !role) {
                    alert('Seleziona utente e ruolo.');
                    return;
                }
                try {
                    if (dom.roleSaveStatus) dom.roleSaveStatus.textContent = 'Salvataggio ruolo…';
                    await authFetch(`utenti/${uid}`, {
                        method: 'PUT',
                        json: true,
                        body: { ruolo: role },
                    });
                    // Se ho cambiato il mio ruolo, aggiorno contesto e permessi
                    if (String(state.currentUserId) === String(uid)) {
                        try {
                            const me = await authFetch('auth/me');
                            if (me && typeof me === 'object') {
                                state.currentUserInfo = me;
                                const newRole = (me.ruolo || '').toUpperCase();
                                state.permissions = computePermissions(newRole);
                                applyPermissions();
                            }
                        } catch (e) {
                            /* ignore */
                        }
                    }
                    await loadUsers();
                    renderUsersList();
                    if (state.permissions.manageRoles) {
                        try {
                            await loadRoleAudit();
                        } catch (e) {}
                    }
                    if (dom.roleSaveStatus)
                        dom.roleSaveStatus.textContent = 'Ruolo aggiornato e registrato in audit.';
                    try {
                        showToast('Ruolo aggiornato', { type: 'success' });
                    } catch (e) {}
                } catch (e) {
                    const msg = e.message || 'Errore aggiornamento ruolo.';
                    if (dom.roleSaveStatus) dom.roleSaveStatus.textContent = msg;
                    try {
                        showToast(msg, { type: 'error' });
                    } catch (err) {}
                }
            });
        }

        // Associazione supervisor per utenti ruolo USER
        const roleUserSupervisorSelect = document.getElementById('role-user-supervisor');
        const btnRoleSetSupervisor = document.getElementById('btn-role-set-supervisor');
        const btnRoleCreateSupervisor = document.getElementById('btn-role-create-supervisor');
        const roleUserSupervisorStatus = document.getElementById('role-user-supervisor-status');

        const populateRoleUserSupervisorSelect = () => {
            if (!roleUserSupervisorSelect) return;
            const current = roleUserSupervisorSelect.value || '';
            roleUserSupervisorSelect.innerHTML = '<option value="">— Nessuno —</option>';
            const supervisors = (state.users || []).filter(
                (u) => (u.ruolo || '').toUpperCase() === 'SUPERVISOR',
            );
            if (supervisors.length === 0) {
                const opt = document.createElement('option');
                opt.value = '';
                opt.disabled = true;
                opt.textContent = 'Nessun supervisor disponibile';
                roleUserSupervisorSelect.appendChild(opt);
            } else {
                supervisors.forEach((s) => {
                    const opt = document.createElement('option');
                    opt.value = s.id;
                    opt.textContent = buildUserLabel(s);
                    roleUserSupervisorSelect.appendChild(opt);
                });
            }
            roleUserSupervisorSelect.value = current;
        };

        const preselectRoleUserSupervisor = async (userId) => {
            if (!roleUserSupervisorSelect || !userId) return;
            try {
                let sups = await authFetch(`utenti/${userId}/supervisors`);
                sups = Array.isArray(sups) ? sups : [];
                const sup = sups[0]?.id ? String(sups[0].id) : '';
                roleUserSupervisorSelect.value = sup || '';
            } catch (e) {
                /* ignore */
            }
        };

        // Aggiorna campo supervisor quando cambia il ruolo selezionato
        if (dom.roleRoleSelect) {
            dom.roleRoleSelect.addEventListener('change', () => {
                const role = (dom.roleRoleSelect.value || '').toUpperCase();
                const userSupField = document.getElementById('user-supervisor-field');
                if (userSupField) userSupField.hidden = role !== 'USER';
                if (role === 'USER') {
                    populateRoleUserSupervisorSelect();
                    const uid = dom.roleUserSelect?.value;
                    if (uid) preselectRoleUserSupervisor(uid);
                }
            });
        }

        if (btnRoleSetSupervisor) {
            btnRoleSetSupervisor.addEventListener('click', async () => {
                const uid = dom.roleUserSelect?.value;
                if (!uid) {
                    showToast('Seleziona un utente', { type: 'warn' });
                    return;
                }
                const role = (dom.roleRoleSelect?.value || '').toUpperCase();
                if (role !== 'USER') {
                    showToast('Supervisor disponibile solo per utenti USER', { type: 'warn' });
                    return;
                }
                const supId = roleUserSupervisorSelect?.value || '';
                try {
                    await authFetch(`utenti/${uid}/set_supervisor/${supId || 0}`, {
                        method: 'POST',
                    });
                    if (roleUserSupervisorStatus)
                        roleUserSupervisorStatus.textContent = 'Supervisor impostato.';
                    showToast('Supervisor impostato', { type: 'success' });
                } catch (e) {
                    const msg = e.message || 'Errore impostazione supervisor.';
                    if (roleUserSupervisorStatus) roleUserSupervisorStatus.textContent = msg;
                    showToast(msg, { type: 'error' });
                }
            });
        }

        if (btnRoleCreateSupervisor) {
            btnRoleCreateSupervisor.addEventListener('click', () => {
                openUserModal('create');
                try {
                    // Preimposta ruolo SUPERVISOR nel modal creazione utente
                    setTimeout(() => {
                        if (formManageUser && formManageUser.elements.ruolo) {
                            formManageUser.elements.ruolo.value = 'SUPERVISOR';
                        }
                    }, 50);
                } catch (e) {
                    /* ignore */
                }
            });
        }

        // Azioni gestione utente dal pannello Ruoli
        const btnRoleEditUser = document.getElementById('btn-role-edit-user');
        const btnRoleDeactivateUser = document.getElementById('btn-role-deactivate-user');
        const btnRoleRestoreUser = document.getElementById('btn-role-restore-user');

        const refreshRoleUserButtons = () => {
            const uid = dom.roleUserSelect?.value;
            if (!uid) {
                if (btnRoleEditUser) btnRoleEditUser.disabled = true;
                if (btnRoleDeactivateUser) btnRoleDeactivateUser.disabled = true;
                if (btnRoleRestoreUser) btnRoleRestoreUser.hidden = true;
                return;
            }
            const u = (state.users || []).find((x) => String(x.id) === String(uid));
            if (btnRoleEditUser) btnRoleEditUser.disabled = false;
            const isActive = String(u?.stato || 'ATTIVO').toUpperCase() === 'ATTIVO';
            if (btnRoleDeactivateUser) btnRoleDeactivateUser.disabled = !isActive;
            if (btnRoleRestoreUser) btnRoleRestoreUser.hidden = isActive;
        };

        dom.roleUserSelect?.addEventListener('change', refreshRoleUserButtons);

        if (btnRoleEditUser) {
            btnRoleEditUser.addEventListener('click', () => {
                const uid = dom.roleUserSelect?.value;
                if (!uid) {
                    alert('Seleziona un utente.');
                    return;
                }
                openUserModal('edit', Number(uid));
            });
        }
        if (btnRoleDeactivateUser) {
            btnRoleDeactivateUser.addEventListener('click', async () => {
                const uid = dom.roleUserSelect?.value;
                if (!uid) {
                    alert('Seleziona un utente.');
                    return;
                }
                await handleDeleteUser(Number(uid));
                await loadUsers();
                populateRoleUserSelect();
                refreshRoleUserButtons();
            });
        }
        if (btnRoleRestoreUser) {
            btnRoleRestoreUser.addEventListener('click', async () => {
                const uid = dom.roleUserSelect?.value;
                if (!uid) {
                    alert('Seleziona un utente.');
                    return;
                }
                await handleRestoreUser(Number(uid));
                await loadUsers();
                populateRoleUserSelect();
                refreshRoleUserButtons();
            });
        }

        const buildTaskEndpoint = (statoId, extra = '') => {
            const params = new URLSearchParams();
            params.append('id_stato', statoId);

            if (state.search) {
                params.append('search', state.search);
            }

            if (state.currentUser && state.currentUser !== 'all') {
                const extraParams = new URLSearchParams(extra);
                const isUnassigned = extraParams.has('unassigned');
                if (!isUnassigned) {
                    params.append('id_utente_assegnato', state.currentUser);
                }
            }

            if (extra) {
                const extraParams = new URLSearchParams(extra);
                extraParams.forEach((value, key) => params.append(key, value));
            }

            return `tasks?${params.toString()}`;
        };

        const loadTasks = async () => {
            const tasksContainers = [
                {
                    container: dom.todoCol,
                    endpoint: buildTaskEndpoint(1, 'unassigned=true'),
                    empty: 'Nessun task da fare.',
                },
                {
                    container: dom.doingCol,
                    endpoint: buildTaskEndpoint(2),
                    empty: 'Nessun task in gestione.',
                },
                {
                    container: dom.doneCol,
                    endpoint: buildTaskEndpoint(3),
                    empty: 'Nessun task completato.',
                },
            ];

            const results = await Promise.all(
                tasksContainers.map(async ({ container, endpoint, empty }) => {
                    renderMessage(container, 'Caricamento...');
                    try {
                        const data = await authFetch(endpoint);
                        const list = normalizeListResponse(data, ['tasks', 'records', 'items']);
                        renderTaskColumn(container, list, empty);
                        return list;
                    } catch (error) {
                        renderMessage(container, error.message || 'Errore nel caricamento.');
                        return [];
                    }
                }),
            );

            state.taskBuckets = {
                todo: results[0] || [],
                doing: results[1] || [],
                done: results[2] || [],
            };

            const flatTasks = results.flat();
            const open = results[0]?.length || 0;
            const running = results[1]?.length || 0;
            const done = results[2]?.length || 0;

            const metrics = {
                'metric-open-tasks': open,
                'metric-running-workflows': running,
                'metric-sync-pending': '--',
                'metric-alerts': flatTasks.filter((task) => task.stato === 'ANNULLATO').length,
            };

            Object.entries(metrics).forEach(([id, value]) => {
                const el = document.getElementById(id);
                if (el) {
                    el.textContent = value === undefined ? '--' : value;
                }
            });

            renderTaskOperations();
        };

        const loadWorkflows = async () => {
            if (!dom.workflowsList) return;
            renderMessage(dom.workflowsList, 'Caricamento...');
            try {
                const params = new URLSearchParams();
                if (workflowState.includeInactive) params.set('include_inactive', '1');
                if (workflowState.search && workflowState.search.trim())
                    params.set('search', workflowState.search.trim());
                const qs = params.toString();
                const workflows = await authFetch('workflows' + (qs ? `?${qs}` : ''));
                workflowState.list = Array.isArray(workflows) ? workflows : [];
                renderWorkflowList();
                if (!workflowState.list.length) {
                    renderWorkflowDetail(null);
                    return;
                }
                if (
                    workflowState.selectedId &&
                    !workflowState.list.some((wf) => wf.id === workflowState.selectedId)
                ) {
                    workflowState.selectedId = workflowState.list[0].id;
                }
                if (!workflowState.selectedId) {
                    await loadWorkflowDetail(workflowState.list[0].id);
                } else {
                    delete workflowState.detailCache[workflowState.selectedId];
                    await loadWorkflowDetail(workflowState.selectedId);
                }
            } catch (error) {
                renderMessage(
                    dom.workflowsList,
                    error.message || 'Errore nel caricamento dei workflow.',
                );
            }
        };

        const renderInstanceList = () => {
            if (!dom.instancesList) return;
            if (!instanceState.list.length) {
                dom.instancesList.innerHTML = '<p>Nessuna istanza disponibile.</p>';
                renderInstanceDetail(null);
                return;
            }

            dom.instancesList.innerHTML = '';
            const clientFilterId = String(state.filters.instancesClientId || '').trim();
            const matchesClient = (inst) => {
                if (!clientFilterId) return true;
                const tipo = String(inst.entita_collegata_tipo || '').toUpperCase();
                const eid = String(inst.entita_collegata_id || '');
                return tipo === 'CLIENTE' && eid === clientFilterId;
            };

            instanceState.list.forEach((istanza) => {
                const childrenList = instanceState.childrenCache[String(istanza.id)] || [];
                const childMatches =
                    Array.isArray(childrenList) && childrenList.some((c) => matchesClient(c));
                if (clientFilterId && !(matchesClient(istanza) || childMatches)) {
                    return;
                }
                const button = document.createElement('button');
                button.type = 'button';
                button.className =
                    'instance-card' +
                    (Number(istanza.id) === Number(instanceState.selectedId) ? ' is-active' : '');
                button.dataset.id = istanza.id;

                const title = document.createElement('h4');
                const wfName = istanza.nome_workflow || 'Workflow';
                title.textContent = `#${istanza.id} · ${wfName}`;

                const meta = document.createElement('small');
                const statusLabel = humanizeStatus(istanza.stato_istanza || istanza.stato);
                const startedLabel = istanza.avviato_il ? formatDateTime(istanza.avviato_il) : '--';
                meta.textContent = `${statusLabel} • ${startedLabel}`;

                button.appendChild(title);
                button.appendChild(meta);

                const key = String(istanza.id);
                const unusedWho = instanceState.assignees[key] || '';
                const full = instanceState.assigneesFull[key] || [];
                const count = full.length || 0;
                const expanded = !!instanceState.assigneesExpanded[key];
                const assEl = document.createElement('small');
                assEl.className = 'instance-assignees has-tip';
                assEl.dataset.tip = full.length ? `Tutti: ${full.join(', ')}` : 'Nessuno in carico';
                const shownNames = expanded ? full : full.slice(0, 3);
                const map = instanceState.assigneeMap[key] || [];
                const toId = (nm) => {
                    const m = map.find((x) => x.name === nm);
                    return m ? m.id : null;
                };
                const htmlNames = shownNames
                    .map((nm) => {
                        const uid = toId(nm);
                        return uid
                            ? `<a class="assignee-link" data-user-id="${uid}">${sanitize(nm)}</a>`
                            : sanitize(nm);
                    })
                    .join(', ');
                assEl.innerHTML = `In carico (${count}): <span class="assignees-list">${htmlNames || '—'}</span>`;
                if (full.length > 3) {
                    const toggle = document.createElement('button');
                    toggle.type = 'button';
                    toggle.className = 'instance-assignees-toggle btn-link';
                    toggle.dataset.instId = key;
                    toggle.textContent = expanded ? 'riduci' : 'mostra tutti';
                    assEl.appendChild(document.createTextNode(' '));
                    assEl.appendChild(toggle);
                }
                button.appendChild(assEl);

                const alertCount = instanceState.alerts[String(istanza.id)] || 0;
                const progCount = instanceState.progress[String(istanza.id)] || 0;
                if (alertCount > 0) {
                    const badge = document.createElement('span');
                    badge.className = 'instance-badge has-tip';
                    badge.dataset.tip = `${alertCount} sottoworkflow (passa per dettaglio)`;
                    badge.textContent = alertCount > 9 ? '9+' : String(alertCount);

                    let loadedInstTooltip = false;
                    badge.addEventListener('mouseenter', async () => {
                        if (loadedInstTooltip) return;
                        loadedInstTooltip = true;
                        const children = await fetchInstanceChildren(istanza.id);
                        badge.dataset.tip = buildSubflowTooltip(children);
                    });

                    button.appendChild(badge);
                }
                if (progCount > 0) {
                    const badgeP = document.createElement('span');
                    badgeP.className = 'instance-badge instance-badge--progress has-tip';
                    badgeP.dataset.tip = `${progCount} sottoworkflow in corso`;
                    badgeP.textContent = progCount > 9 ? '9+' : String(progCount);
                    let loadedInstTooltipP = false;
                    badgeP.addEventListener('mouseenter', async () => {
                        if (loadedInstTooltipP) return;
                        loadedInstTooltipP = true;
                        const children = await fetchInstanceChildren(istanza.id);
                        badgeP.dataset.tip = buildSubflowTooltip(children);
                    });
                    button.appendChild(badgeP);
                }

                // Badge fisso per sottoworkflow collegati (totale), se presenti
                try {
                    const children = instanceState.childrenCache[String(istanza.id)] || [];
                    const totalChildren = Array.isArray(children) ? children.length : 0;
                    if (totalChildren > 0) {
                        const badgeC = document.createElement('span');
                        badgeC.className = 'instance-badge has-tip';
                        badgeC.dataset.tip = `${totalChildren} sottoworkflow collegati`;
                        badgeC.textContent = totalChildren > 9 ? '9+' : String(totalChildren);
                        let loadedInstTooltipC = false;
                        badgeC.addEventListener('mouseenter', async () => {
                            if (loadedInstTooltipC) return;
                            loadedInstTooltipC = true;
                            const ch = await fetchInstanceChildren(istanza.id);
                            badgeC.dataset.tip = buildSubflowTooltip(ch);
                        });
                        button.appendChild(badgeC);
                    }
                } catch (e) {
                    /* ignore */
                }

                dom.instancesList.appendChild(button);

                // Mostra anche istanze correlate (figlie) con evidenza
                if (Array.isArray(childrenList) && childrenList.length) {
                    const showChildren = clientFilterId
                        ? childrenList.filter((c) => matchesClient(c))
                        : childrenList;
                    showChildren.forEach((child) => {
                        const cbtn = document.createElement('button');
                        cbtn.type = 'button';
                        cbtn.className =
                            'instance-card instance-card--child' +
                            (Number(child.id) === Number(instanceState.selectedId)
                                ? ' is-active'
                                : '');
                        cbtn.dataset.id = child.id;
                        const chTitle = document.createElement('h4');
                        const chName = child.nome_workflow || 'Workflow';
                        chTitle.textContent = `#${child.id} · ${chName}`;
                        const chMeta = document.createElement('small');
                        const chStatus = humanizeStatus(child.stato_istanza || child.stato);
                        const chStarted = child.avviato_il
                            ? formatDateTime(child.avviato_il)
                            : '--';
                        chMeta.textContent = `${chStatus} • ${chStarted} • Sub di #${istanza.id}`;
                        cbtn.appendChild(chTitle);
                        cbtn.appendChild(chMeta);
                        dom.instancesList.appendChild(cbtn);
                    });
                }
            });
        };

        const renderClientsList = () => {
            const container = dom.clientsList;
            if (!container) return;
            const all = Array.isArray(state.clients) ? state.clients : [];
            const search = (dom.clientsSearch?.value || '').trim().toLowerCase();
            const prov = (state.clientFilters.province || '').toLowerCase();
            const city = (state.clientFilters.city || '').toLowerCase();
            let list = all
                .filter((c) => {
                    const matchSearch =
                        !search ||
                        [c.ragione_sociale, c.partita_iva, c.email]
                            .filter(Boolean)
                            .some((v) => String(v).toLowerCase().includes(search));
                    const matchProv = !prov || String(c.provincia || '').toLowerCase() === prov;
                    const matchCity = !city || String(c.citta || '').toLowerCase() === city;
                    return matchSearch && matchProv && matchCity;
                })
                .sort((a, b) =>
                    String(a.ragione_sociale || '').localeCompare(
                        String(b.ragione_sociale || ''),
                        'it',
                    ),
                );
            // Update count
            if (dom.clientsCount) dom.clientsCount.textContent = String(list.length);
            // Pagination
            const total = list.length;
            const pageSize = state.clientPageSize;
            const totalPages = Math.max(1, Math.ceil(total / pageSize));
            if (state.clientPage > totalPages) state.clientPage = totalPages;
            if (state.clientPage < 1) state.clientPage = 1;
            const start = (state.clientPage - 1) * pageSize;
            const pageItems = list.slice(start, start + pageSize);
            if (dom.clientsPageInfo)
                dom.clientsPageInfo.textContent = `${state.clientPage}/${totalPages}`;
            if (dom.clientsPrev) dom.clientsPrev.disabled = state.clientPage <= 1;
            if (dom.clientsNext) dom.clientsNext.disabled = state.clientPage >= totalPages;
            // Render
            if (!pageItems.length) {
                container.innerHTML = '<p>Nessun cliente trovato.</p>';
                return;
            }
            container.innerHTML = '';
            pageItems.forEach((cli) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className =
                    'instance-card client-card' +
                    (Number(cli.id) === Number(state.selectedClientId) ? ' is-active' : '');
                btn.dataset.id = cli.id;
                const title = document.createElement('h4');
                title.textContent = `${cli.ragione_sociale || 'Cliente #' + cli.id}`;
                const meta = document.createElement('small');
                const piva = cli.partita_iva || '--';
                const mail = cli.email || '--';
                meta.textContent = `P.IVA ${piva} • ${mail}`;
                btn.appendChild(title);
                btn.appendChild(meta);
                container.appendChild(btn);
            });
        };

        // Catalogo: render lista prodotti/servizi
        const renderProductsList = () => {
            const container = dom.productsList;
            if (!container) return;
            const list = Array.isArray(state.products) ? state.products : [];
            if (dom.productsCount) dom.productsCount.textContent = String(list.length || 0);
            if (!list.length) {
                container.innerHTML = '<p>Nessun elemento trovato.</p>';
                return;
            }
            container.innerHTML = '';
            list.forEach((item) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className =
                    'instance-card product-card' +
                    (Number(item.id) === Number(state.selectedProductId) ? ' is-active' : '');
                btn.dataset.id = item.id;
                const h = document.createElement('h4');
                const name = item.titolo || 'Articolo #' + item.id;
                const brandModel = [item.marca, item.modello].filter(Boolean).join(' ');
                h.textContent = brandModel ? `${brandModel} — ${name}` : name;
                const meta = document.createElement('small');
                const t = String(item.tipologia || '').toUpperCase();
                const vis = String(item.visibilita || '').toUpperCase();
                const sku = item.sku || item.sku_globale || '—';
                const code = item.codice_tenant || '';
                const cats = item.categorie || '';
                const price =
                    item.prezzo_min !== null && item.prezzo_min !== undefined
                        ? ` • da € ${Number(item.prezzo_min).toFixed(2)}`
                        : '';
                meta.textContent = `${t || '—'} • ${vis || ''} • SKU ${sku}${code ? ' • COD ' + code : ''}${cats ? ' • ' + cats : ''}${price}`;
                btn.appendChild(h);
                btn.appendChild(meta);
                container.appendChild(btn);
            });
        };

        const renderProductDetail = (detail) => {
            if (!detail) {
                if (dom.productDetailTitle)
                    dom.productDetailTitle.textContent = 'Nessun elemento selezionato';
                if (dom.productDetailSubtitle) dom.productDetailSubtitle.textContent = '';
                if (dom.productDetailSku) dom.productDetailSku.textContent = '--';
                if (dom.productDetailType) dom.productDetailType.textContent = '--';
                if (dom.productDetailStatus) dom.productDetailStatus.textContent = '--';
                if (dom.productDetailPrice) dom.productDetailPrice.textContent = '--';
                if (dom.productDetailDescription) dom.productDetailDescription.textContent = '--';
                if (dom.productDetailAvailability) dom.productDetailAvailability.textContent = '--';
                if (dom.productDetailMedia) dom.productDetailMedia.innerHTML = '';
                return;
            }
            if (dom.productDetailTitle)
                dom.productDetailTitle.textContent = detail.titolo || `Articolo #${detail.id}`;
            if (dom.productDetailSubtitle)
                dom.productDetailSubtitle.textContent = detail.sottotitolo || '';
            const catsAgg =
                Array.isArray(detail.categorie) && detail.categorie.length
                    ? detail.categorie.map((c) => c.nome).join(', ')
                    : '--';
            const brandEl = document.getElementById('product-detail-brand');
            if (brandEl) brandEl.textContent = detail.marca || '--';
            const modelEl = document.getElementById('product-detail-model');
            if (modelEl) modelEl.textContent = detail.modello || '--';
            const verEl = document.getElementById('product-detail-version');
            if (verEl) verEl.textContent = detail.versione || '--';
            if (dom.productDetailSku) dom.productDetailSku.textContent = detail.sku || '--';
            const codeEl = document.getElementById('product-detail-code');
            if (codeEl) codeEl.textContent = detail.codice_tenant || '--';
            if (dom.productDetailType)
                dom.productDetailType.textContent =
                    String(detail.tipologia || '').toUpperCase() || '--';
            if (dom.productDetailStatus)
                dom.productDetailStatus.textContent = humanizeStatus(
                    detail.stato_pubblicazione || '',
                );
            let pmin = null;
            let pmax = null;
            if (Array.isArray(detail.varianti)) {
                detail.varianti.forEach((v) => {
                    if (v.prezzo_min !== null && v.prezzo_min !== undefined) {
                        const pv = Number(v.prezzo_min);
                        pmin = pmin === null ? pv : Math.min(pmin, pv);
                    }
                    if (v.prezzo_max !== null && v.prezzo_max !== undefined) {
                        const pv = Number(v.prezzo_max);
                        pmax = pmax === null ? pv : Math.max(pmax, pv);
                    }
                });
            }
            let priceText = '--';
            if (pmin !== null && pmax !== null) {
                priceText =
                    pmin === pmax
                        ? `€ ${pmin.toFixed(2)}`
                        : `€ ${pmin.toFixed(2)} – € ${pmax.toFixed(2)}`;
            } else if (pmin !== null) {
                priceText = `da € ${pmin.toFixed(2)}`;
            }
            if (dom.productDetailPrice) dom.productDetailPrice.textContent = priceText;
            if (dom.productDetailDescription)
                dom.productDetailDescription.textContent = detail.descrizione || '--';
            const catEl = document.getElementById('product-detail-categories');
            if (catEl) catEl.textContent = catsAgg;

            // Disponibilita (solo per servizi, se presente in varianti)
            try {
                const box = dom.productDetailAvailability;
                if (box) {
                    if (String(detail.tipologia || '').toUpperCase() !== 'SERVIZIO') {
                        box.innerHTML = '<small class="form-hint">Non applicabile</small>';
                    } else {
                        const items = [];
                        (detail.varianti || []).forEach((v) => {
                            (v.disponibilita || []).forEach((s) => {
                                const start = formatDateTime(s.inizio);
                                const end = formatDateTime(s.fine);
                                const free = Number(
                                    s.capacita_disponibile ??
                                        Number(s.capacita_totale || 0) -
                                            Number(s.capacita_prenotata || 0),
                                );
                                items.push({
                                    variant: v.nome || v.sku || `Var #${v.id}`,
                                    start,
                                    end,
                                    free,
                                });
                            });
                        });
                        if (!items.length) {
                            box.innerHTML =
                                '<small class="form-hint">Nessuno slot nelle prossime 2 settimane.</small>';
                        } else {
                            const html = items
                                .slice(0, 10)
                                .map(
                                    (i) =>
                                        `<div class="list-item"><strong>${sanitize(i.variant)}</strong><br><small>${sanitize(i.start)} → ${sanitize(i.end)} • posti liberi: ${sanitize(i.free)}</small></div>`,
                                )
                                .join('');
                            box.innerHTML = html;
                        }
                    }
                }
            } catch (e) {
                /* ignore */
            }

            // Media gallery
            try {
                const g = dom.productDetailMedia;
                if (g) {
                    const media = Array.isArray(detail.media) ? detail.media : [];
                    if (!media.length) {
                        g.innerHTML = '<small class="form-hint">Nessun media associato.</small>';
                    } else {
                        g.innerHTML = media
                            .map(
                                (m) => `
                          <figure class="media-thumb" data-media-id="${m.id}" draggable="true" style="display:inline-block; margin:6px;">
                            <img src="${sanitize(m.url)}" alt="${sanitize(m.testo_alternativo || '')}" style="max-width:140px; max-height:140px; object-fit:cover; display:block;">
                            <figcaption>
                              <small>${sanitize(m.tipologia || '')}</small>
                              <div style="margin-top:4px; display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
                                <button type="button" class="btn" data-action="media-up" data-id="${m.id}">Su</button>
                                <button type="button" class="btn" data-action="media-down" data-id="${m.id}">Giù</button>
                                <button type="button" class="btn" data-action="media-cover" data-id="${m.id}">Copertina</button>
                                <input type="text" class="media-alt-input" data-id="${m.id}" value="${sanitize(m.testo_alternativo || '')}" placeholder="Alt" style="max-width:160px;">
                                <button type="button" class="btn" data-action="media-save-alt" data-id="${m.id}">Salva alt</button>
                                <button type="button" class="btn btn-danger" data-action="media-delete" data-id="${m.id}">Rimuovi</button>
                              </div>
                            </figcaption>
                          </figure>`,
                            )
                            .join(' ');
                        try {
                            attachMediaDnD(g);
                        } catch (e) {}
                    }
                }
            } catch (e) {
                /* ignore */
            }

            // Relazioni: render elenco con modifica/elimina + applica filtro/ordinamento
            renderRelationsBox(detail);

            // Varianti & prezzi list
            try {
                const box = document.getElementById('product-variants-list');
                if (box) {
                    const vars = Array.isArray(detail.varianti) ? detail.varianti : [];
                    if (!vars.length) {
                        box.innerHTML = '<p class="form-hint">Nessuna variante.</p>';
                    } else {
                        box.innerHTML = vars
                            .map((v) => {
                                const pmin =
                                    v.prezzo_min !== null && v.prezzo_min !== undefined
                                        ? Number(v.prezzo_min).toFixed(2)
                                        : '--';
                                const pmax =
                                    v.prezzo_max !== null && v.prezzo_max !== undefined
                                        ? Number(v.prezzo_max).toFixed(2)
                                        : '--';
                                const price =
                                    pmin !== '--' && pmax !== '--'
                                        ? pmin === pmax
                                            ? `€ ${pmin}`
                                            : `€ ${pmin} – € ${pmax}`
                                        : '--';
                                const listBadge = state.selectedPriceListCode
                                    ? `<small class="badge" data-price-for="${v.id}">${sanitize(state.selectedPriceListCode)}: …</small>`
                                    : '';
                                return `<div class="list-item" data-variant-id="${v.id}"><strong>${sanitize(v.nome || 'Variante')}</strong> <small class="badge">SKU ${sanitize(v.sku || '')}</small> <small class="badge">${price}</small> ${listBadge}
                                <div class="item-actions">
                                  <button type="button" class="btn" data-action="variant-set-price" data-id="${v.id}">Imposta prezzo</button>
                                  <button type="button" class="btn btn-danger" data-action="variant-delete" data-id="${v.id}">Elimina</button>
                                </div>
                            </div>`;
                            })
                            .join('');
                    }
                }
            } catch (e) {
                /* ignore */
            }

            // Categorie: popolamento multi-select
            try {
                const sel = document.getElementById('edit-product-categories');
                if (sel) {
                    // Load categories if empty
                    if (!sel.options.length) {
                        hubFetch('categorie').then((list) => {
                            sel.innerHTML = (Array.isArray(list) ? list : [])
                                .map(
                                    (c) =>
                                        `<option value="${sanitize(c.slug)}">${sanitize(c.nome)}</option>`,
                                )
                                .join('');
                            preselectCategories(detail);
                        });
                    } else {
                        preselectCategories(detail);
                    }
                }
            } catch (e) {
                /* ignore */
            }
        };

        function preselectCategories(detail) {
            try {
                const sel = document.getElementById('edit-product-categories');
                if (!sel) return;
                const slugs = (detail.categorie || []).map((c) => c.slug);
                const set = new Set(slugs);
                [...sel.options].forEach((o) => {
                    o.selected = set.has(o.value);
                });
            } catch (e) {
                /* ignore */
            }
        }

        function applyRelationFilterSort(rels) {
            let arr = Array.isArray(rels) ? [...rels] : [];
            const f = (state.relationFilterType || '').toUpperCase();
            if (f) arr = arr.filter((r) => String(r.tipo_relazione || '').toUpperCase() === f);
            const sort = state.relationSort || 'priority';
            const dir = (state.relationSortDir || 'asc').toLowerCase() === 'desc' ? -1 : 1;
            arr.sort((a, b) => {
                if (sort === 'title') {
                    const ta = String(a.titolo || '');
                    const tb = String(b.titolo || '');
                    return ta.localeCompare(tb, 'it') * dir;
                }
                if (sort === 'type') {
                    const ta = String(a.tipo_relazione || '');
                    const tb = String(b.tipo_relazione || '');
                    return ta.localeCompare(tb, 'it') * dir;
                }
                // default priority
                const pa = Number(a.priorita || 0);
                const pb = Number(b.priorita || 0);
                return (pa - pb) * dir;
            });
            return arr;
        }

        function renderRelationsBox(detail) {
            try {
                const box = document.getElementById('product-relations-list');
                if (!box) return;
                const rels = applyRelationFilterSort(detail.relazioni || []);
                if (!rels.length) {
                    box.innerHTML = '<p class="form-hint">Nessuna relazione.</p>';
                    return;
                }
                box.innerHTML = rels
                    .map((r) => {
                        const label = `${sanitize(r.titolo || 'Articolo #' + r.articolo_id)}`;
                        const tipo = sanitize(r.tipo_relazione || 'REL');
                        const pr = Number(r.priorita || 0);
                        return `<div class="list-item" data-relation-id="${Number(r.id)}">
                        <div class="item-header"><strong>${label}</strong> <small class="badge">${tipo}</small> <button type="button" class="btn" data-action="rel-open" data-target-id="${Number(r.articolo_id)}">Apri</button></div>
                        <div class="item-actions" style="display:flex; gap:8px; align-items:center;">
                            <label class="form-control form-control--inline"><span>Priorità</span><input type="number" value="${pr}" data-field="prio" style="width:90px;"></label>
                            <label class="form-control form-control--inline"><span>Tipo</span>
                                <select data-field="tipo">
                                    <option value="UPSELL" ${r.tipo_relazione === 'UPSELL' ? 'selected' : ''}>UPSELL</option>
                                    <option value="CROSS_SELL" ${r.tipo_relazione === 'CROSS_SELL' ? 'selected' : ''}>CROSS_SELL</option>
                                    <option value="SERVIZIO_AUSILIARIO" ${r.tipo_relazione === 'SERVIZIO_AUSILIARIO' ? 'selected' : ''}>SERVIZIO_AUSILIARIO</option>
                                    <option value="SOSTITUTIVO" ${r.tipo_relazione === 'SOSTITUTIVO' ? 'selected' : ''}>SOSTITUTIVO</option>
                                    <option value="ADD_ON" ${r.tipo_relazione === 'ADD_ON' ? 'selected' : ''}>ADD_ON</option>
                                </select>
                            </label>
                            <button type="button" class="btn" data-action="rel-update" data-id="${Number(r.id)}">Aggiorna</button>
                            <button type="button" class="btn btn-danger" data-action="rel-delete" data-id="${Number(r.id)}">Elimina</button>
                        </div>
                    </div>`;
                    })
                    .join('');
            } catch (e) {
                /* ignore */
            }
        }

        async function loadPriceListsForArticle(detail) {
            try {
                const tenantId = Number(detail.tenant_id || 0);
                const sel = document.getElementById('price-list-code');
                const cur = state.selectedPriceListCode || 'DEFAULT';
                if (!sel || !tenantId) return;
                const lists = await authFetch(
                    `catalogo_listini?tenant_id=${encodeURIComponent(tenantId)}`,
                );
                const arr = Array.isArray(lists) ? lists : [];
                const codes = new Set(arr.map((x) => x.codice));
                if (!codes.has('DEFAULT')) {
                    arr.unshift({ codice: 'DEFAULT', nome: 'DEFAULT', valuta: 'EUR' });
                }
                sel.innerHTML = arr
                    .map(
                        (l) =>
                            `<option value="${sanitize(l.codice)}">${sanitize(l.codice)} (${sanitize(l.valuta || 'EUR')})</option>`,
                    )
                    .join('');
                sel.value = cur && codes.has(cur) ? cur : 'DEFAULT';
                state.selectedPriceListCode = sel.value;
                const curList = arr.find((l) => l.codice === state.selectedPriceListCode);
                const curCurrency = document.getElementById('price-list-currency');
                if (curCurrency)
                    curCurrency.value =
                        curList && curList.valuta ? curList.valuta : curCurrency.value || 'EUR';
                await refreshPerVariantListinoPrices(detail);
            } catch (e) {
                /* ignore */
            }
        }

        async function refreshPerVariantListinoPrices(detail) {
            try {
                const code = state.selectedPriceListCode || 'DEFAULT';
                const vars = Array.isArray(detail.varianti) ? detail.varianti : [];
                for (const v of vars) {
                    try {
                        const p = await authFetch(
                            `catalogo_prezzi?variante_id=${encodeURIComponent(v.id)}&listino_codice=${encodeURIComponent(code)}`,
                        );
                        const badge = document.querySelector(`[data-price-for="${v.id}"]`);
                        if (badge) {
                            const txt =
                                p && p.prezzo !== undefined && p.prezzo !== null
                                    ? `${code}: ${Number(p.prezzo).toFixed(2)} ${p.valuta || ''}`
                                    : `${code}: —`;
                            badge.textContent = txt;
                        }
                    } catch (e) {
                        /* ignore single */
                    }
                }
            } catch (e) {
                /* ignore */
            }
        }

        const loadProductById = async (id) => {
            try {
                const detail = await hubFetch(`articoli/${id}`);
                state.selectedProductDetail = detail;
                renderProductDetail(detail);
                // Load listini and refresh per-variant prices for selected code
                await loadPriceListsForArticle(detail);
            } catch (e) {
                state.selectedProductDetail = null;
                renderProductDetail(null);
            }
        };

        const loadProducts = async () => {
            const term = (dom.filterProducts?.value || '').trim();
            const typeSel = (dom.filterProductsType?.value || '').trim();
            const catSel = (dom.filterProductsCategory?.value || '').trim();
            const tenantSel = (dom.filterProductsTenant?.value || '').trim();
            const params = new URLSearchParams();
            if (term) params.set('q', term);
            if (typeSel) params.set('tipologia', typeSel);
            if (catSel) params.set('categoria', catSel);
            if (tenantSel) params.set('tenant', tenantSel);
            const visSel = (dom.filterProductsVisibility?.value || '').trim();
            if (visSel) params.set('visibilita', visSel);
            try {
                const list = await hubFetch(
                    `articoli${params.toString() ? '?' + params.toString() : ''}`,
                );
                state.products = Array.isArray(list) ? list : [];
                renderProductsList();
                if (!state.selectedProductId && state.products.length) {
                    state.selectedProductId = state.products[0].id;
                    await loadProductById(state.selectedProductId);
                }
            } catch (e) {
                if (dom.productsList)
                    dom.productsList.innerHTML = `<p>${sanitize(e.message || 'Errore caricamento catalogo')}</p>`;
            }
        };

        // Catalogo: caricamento filtri (categorie/tenants)
        const loadProductFilters = async () => {
            try {
                const cats = await hubFetch('categorie');
                if (dom.filterProductsCategory) {
                    const cur = dom.filterProductsCategory.value;
                    dom.filterProductsCategory.innerHTML =
                        '<option value="">Tutte</option>' +
                        (Array.isArray(cats) ? cats : [])
                            .map(
                                (c) =>
                                    `<option value="${sanitize(c.slug)}">${sanitize(c.nome)}</option>`,
                            )
                            .join('');
                    if (cur) dom.filterProductsCategory.value = cur;
                }
            } catch (e) {
                /* ignore */
            }
            try {
                const tenants = await hubFetch('tenants');
                if (dom.filterProductsTenant) {
                    const curT = dom.filterProductsTenant.value;
                    dom.filterProductsTenant.innerHTML =
                        '<option value="">Tutti</option>' +
                        (Array.isArray(tenants) ? tenants : [])
                            .map(
                                (t) =>
                                    `<option value="${sanitize(t.slug)}" data-id="${Number(t.id)}">${sanitize(t.ragione_sociale || t.slug)}</option>`,
                            )
                            .join('');
                    if (curT) dom.filterProductsTenant.value = curT;
                    // Se "Solo mio tenant" attivo, pre-seleziona il tenant corrente
                    if (dom.filterProductsOwnTenant && dom.filterProductsOwnTenant.checked) {
                        const curTid = Number(state.currentUserInfo?.tenant_id || 0);
                        if (curTid) {
                            const opt = [...dom.filterProductsTenant.options].find(
                                (o) => Number(o.dataset.id) === curTid,
                            );
                            if (opt) dom.filterProductsTenant.value = opt.value;
                        }
                    }
                }
            } catch (e) {
                /* ignore */
            }
        };

        const renderClientDetail = (cli) => {
            const nameEl = document.getElementById('client-detail-name');
            const descEl = document.getElementById('client-detail-description');
            const pivaEl = document.getElementById('client-detail-piva');
            const emailEl = document.getElementById('client-detail-email');
            const phoneEl = document.getElementById('client-detail-phone');
            const typeEl = document.getElementById('client-detail-type');
            const addrEl = document.getElementById('client-detail-address');
            const cfEl = document.getElementById('client-detail-cf');
            const countryEl = document.getElementById('client-detail-country');
            const latEl = document.getElementById('client-detail-lat');
            const lonEl = document.getElementById('client-detail-lon');
            const createdEl = document.getElementById('client-detail-created');
            const updatedEl = document.getElementById('client-detail-updated');
            const notesEl = document.getElementById('client-detail-notes');
            if (!cli) {
                if (nameEl) nameEl.textContent = 'Nessun cliente selezionato';
                if (descEl)
                    descEl.textContent =
                        'Seleziona un cliente per visualizzare informazioni e contatti.';
                if (pivaEl) pivaEl.textContent = '--';
                if (emailEl) emailEl.textContent = '--';
                if (phoneEl) phoneEl.textContent = '--';
                if (typeEl) typeEl.textContent = '--';
                if (addrEl) addrEl.textContent = '--';
                if (cfEl) cfEl.textContent = '--';
                if (countryEl) countryEl.textContent = '--';
                if (latEl) latEl.textContent = '--';
                if (lonEl) lonEl.textContent = '--';
                if (createdEl) createdEl.textContent = '--';
                if (updatedEl) updatedEl.textContent = '--';
                if (notesEl) notesEl.textContent = '--';
                return;
            }
            if (nameEl) nameEl.textContent = cli.ragione_sociale || 'Cliente #' + cli.id;
            if (descEl) descEl.textContent = `ID #${cli.id}`;
            if (pivaEl) pivaEl.textContent = cli.partita_iva || '--';
            if (emailEl)
                emailEl.innerHTML = cli.email
                    ? `<a href="mailto:${sanitize(cli.email)}">${sanitize(cli.email)}</a>`
                    : '--';
            if (phoneEl) phoneEl.textContent = cli.telefono || '--';
            if (typeEl) typeEl.textContent = cli.tipo_cliente || '--';
            if (cfEl) cfEl.textContent = cli.codice_fiscale || '--';
            if (countryEl) countryEl.textContent = cli.nazione || '--';
            if (latEl) {
                const v =
                    cli.latitudine !== undefined && cli.latitudine !== null && cli.latitudine !== ''
                        ? Number(cli.latitudine)
                        : null;
                latEl.textContent =
                    v !== null && !Number.isNaN(v) ? v.toFixed(6) : cli.latitudine || '--';
            }
            if (lonEl) {
                const v =
                    cli.longitudine !== undefined &&
                    cli.longitudine !== null &&
                    cli.longitudine !== ''
                        ? Number(cli.longitudine)
                        : null;
                lonEl.textContent =
                    v !== null && !Number.isNaN(v) ? v.toFixed(6) : cli.longitudine || '--';
            }
            if (createdEl)
                createdEl.textContent = cli.creato_il ? formatDateTime(cli.creato_il) : '--';
            if (updatedEl)
                updatedEl.textContent = cli.aggiornato_il
                    ? formatDateTime(cli.aggiornato_il)
                    : '--';
            const parts = [];
            if (cli.indirizzo) parts.push(cli.indirizzo);
            const city = [cli.cap, cli.citta].filter(Boolean).join(' ');
            const prov = cli.provincia ? `(${cli.provincia})` : '';
            const line2 = [city, prov].filter(Boolean).join(' ');
            const addr = [parts.join(' '), line2].filter(Boolean).join('\n');
            if (addrEl) addrEl.textContent = addr || '--';
            if (notesEl) notesEl.textContent = cli.note || '--';
            // Aggiorna mappa indirizzo
            try {
                updateClientMap(cli, addr);
            } catch (e) {
                /* ignore */
            }
        };

        const loadClientById = async (id) => {
            try {
                const cli = await authFetch(`clienti/${id}`);
                state.selectedClientDetail = cli;
                renderClientDetail(cli);
            } catch (e) {
                const fallback = state.clients.find((c) => Number(c.id) === Number(id)) || null;
                state.selectedClientDetail = fallback;
                renderClientDetail(fallback);
            }
        };

        // Geocoding via Nominatim (OSM)
        const geocodeAddress = async (address) => {
            if (!address) return null;
            const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`;
            try {
                const res = await fetch(url, { headers: { Accept: 'application/json' } });
                const data = await res.json();
                if (Array.isArray(data) && data.length) {
                    const { lat, lon, display_name } = data[0];
                    return { lat: parseFloat(lat), lon: parseFloat(lon), label: display_name };
                }
            } catch (e) {
                /* ignore */
            }
            return null;
        };

        const ensureLeaflet = () => (typeof window.L !== 'undefined' ? window.L : null);

        const updateClientMap = async (cli, addr) => {
            const container = dom.clientMapEl;
            if (!container) return;
            const hasCity = !!cli?.citta;
            const hasCountry = !!cli?.nazione;
            if (dom.clientMapWarning) {
                if (!hasCity || !hasCountry) {
                    dom.clientMapWarning.innerHTML =
                        '<span class="badge badge-warning">Dati incompleti: specifica almeno Città e Nazione per visualizzare la mappa.</span>';
                    dom.clientMapWarning.hidden = false;
                } else {
                    dom.clientMapWarning.hidden = true;
                    dom.clientMapWarning.innerHTML = '';
                }
            }
            const partsFull = [cli?.indirizzo, cli?.cap, cli?.citta, cli?.provincia, cli?.nazione]
                .filter(Boolean)
                .map(String);
            const addressFull = partsFull.join(', ');
            if (!addressFull) {
                container.innerHTML = '';
                return;
            }
            state.clientAddress = addressFull;
            // Applica preferenze salvate per questo cliente (zoom, sv params)
            try {
                const prefs = loadClientMapPrefs(cli?.id);
                if (prefs) {
                    if (typeof prefs.mapZoom === 'number') {
                        state.mapZoom = prefs.mapZoom;
                        if (dom.mapZoomRange) dom.mapZoomRange.value = String(prefs.mapZoom);
                    }
                    if (typeof prefs.mapMode === 'string') {
                        state.mapMode = prefs.mapMode;
                        if (dom.mapModeSelect) dom.mapModeSelect.value = prefs.mapMode;
                    }
                    if (typeof prefs.svHeading === 'number' && dom.svHeading)
                        dom.svHeading.value = String(prefs.svHeading);
                    if (typeof prefs.svPitch === 'number' && dom.svPitch)
                        dom.svPitch.value = String(prefs.svPitch);
                    if (typeof prefs.svFov === 'number' && dom.svFov)
                        dom.svFov.value = String(prefs.svFov);
                }
            } catch (e) {
                /* ignore */
            }
            let geo = await geocodeAddress(addressFull);
            if (!geo) {
                const addrCityProv = [cli?.citta, cli?.provincia, cli?.nazione]
                    .filter(Boolean)
                    .join(', ');
                if (addrCityProv) geo = await geocodeAddress(addrCityProv);
            }
            if (!geo) {
                const addrCityOnly = [cli?.citta, cli?.nazione].filter(Boolean).join(', ');
                if (addrCityOnly) geo = await geocodeAddress(addrCityOnly);
            }
            if (!geo) {
                container.innerHTML =
                    '<small class="form-hint">Impossibile geocodificare l\'indirizzo.</small>';
                return;
            }
            state.clientGeo = geo;
            const L = ensureLeaflet();
            if (!L) {
                container.innerHTML =
                    '<small class="form-hint">Libreria mappe non caricata.</small>';
                return;
            }
            try {
                if (!state.clientMap) {
                    state.clientMap = L.map(container, { scrollWheelZoom: false });
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        maxZoom: 19,
                        attribution: '&copy; OpenStreetMap contributors',
                    }).addTo(state.clientMap);
                }
                state.clientMap.setView([geo.lat, geo.lon], state.mapZoom || 15);
                if (!state.clientMapMarker) {
                    state.clientMapMarker = L.marker([geo.lat, geo.lon]).addTo(state.clientMap);
                } else {
                    state.clientMapMarker.setLatLng([geo.lat, geo.lon]);
                }
                state.clientMapMarker.bindPopup(
                    (cli?.ragione_sociale || 'Cliente') + '<br>' + sanitize(addressFull),
                );
            } catch (e) {
                container.innerHTML =
                    '<small class="form-hint">Errore nel rendering della mappa.</small>';
            }
            try {
                updateExternalMapLinks();
                applyMapMode();
            } catch (e) {
                /* ignore */
            }
        };

        const loadClientMapPrefs = (clientId) => {
            if (!clientId) return null;
            try {
                const raw = window.localStorage.getItem(`lpwf_client_map_prefs_${clientId}`);
                return raw ? JSON.parse(raw) : null;
            } catch (e) {
                return null;
            }
        };

        const saveClientMapPrefs = (clientId, data) => {
            if (!clientId) return;
            try {
                const key = `lpwf_client_map_prefs_${clientId}`;
                const prev = loadClientMapPrefs(clientId) || {};
                const val = { ...prev, ...data };
                window.localStorage.setItem(key, JSON.stringify(val));
            } catch (e) {
                /* ignore */
            }
        };

        const buildStreetViewLink = () => {
            if (!state.clientGeo) return '';
            const h = Number(dom.svHeading?.value || 210) || 210;
            const p = Number(dom.svPitch?.value || 10) || 10;
            const f = Number(dom.svFov?.value || 80) || 80;
            return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${state.clientGeo.lat},${state.clientGeo.lon}&heading=${h}&pitch=${p}&fov=${f}`;
        };

        const updateExternalMapLinks = () => {
            const links = dom.clientMapLinks;
            if (!links || !state.clientGeo) return;
            const q = encodeURIComponent(state.clientAddress || '');
            const glink = `https://www.google.com/maps/search/?api=1&query=${q}`;
            const g3d = `https://www.google.com/maps/@${state.clientGeo.lat},${state.clientGeo.lon},17z/data=!3m1!1e3`;
            const earth = `https://earth.google.com/web/search/${q}`;
            const sv = buildStreetViewLink();
            links.innerHTML = `
              <a class="btn btn-secondary" href="${glink}" target="_blank" rel="noopener">Apri in Google Maps</a>
              <a class="btn" href="${g3d}" target="_blank" rel="noopener">Vista 3D</a>
              <a class="btn" href="${earth}" target="_blank" rel="noopener">Google Earth</a>
              <a class="btn btn-primary" href="${sv}" target="_blank" rel="noopener">Street View (fullscreen)</a>
            `;
        };

        const applyMapMode = () => {
            const mode = dom.mapModeSelect?.value || state.mapMode || 'map';
            state.mapMode = mode;
            const hasSV = !!state.config?.gmaps_embed_key;
            if (dom.svControlsWrap) dom.svControlsWrap.hidden = !(hasSV && mode === 'street');
            if (dom.mapZoomWrap) dom.mapZoomWrap.hidden = !(mode === 'map');
            // Toggle visibility
            if (dom.clientMapEl) dom.clientMapEl.style.display = mode === 'map' ? '' : 'none';
            if (dom.clientStreetView)
                dom.clientStreetView.style.display = mode === 'street' ? '' : 'none';
            // Update content
            if (mode === 'map' && state.clientMap && state.clientGeo) {
                try {
                    state.clientMap.setZoom(state.mapZoom || 15);
                } catch (e) {
                    /* ignore */
                }
            }
            if (mode === 'street' && hasSV && state.clientGeo) {
                const key = state.config?.gmaps_embed_key;
                const h = Number(dom.svHeading?.value || 210) || 210;
                const p = Number(dom.svPitch?.value || 10) || 10;
                const f = Number(dom.svFov?.value || 80) || 80;
                dom.clientStreetView.innerHTML = `<iframe loading="lazy" allowfullscreen src="https://www.google.com/maps/embed/v1/streetview?key=${encodeURIComponent(key)}&location=${state.clientGeo.lat},${state.clientGeo.lon}&heading=${h}&pitch=${p}&fov=${f}"></iframe>`;
            }
            // Aggiorna link esterni (incluso Street View fullscreen)
            updateExternalMapLinks();
            // Salva preferenze per cliente corrente
            if (state.selectedClientId) {
                saveClientMapPrefs(state.selectedClientId, {
                    mapMode: state.mapMode,
                    mapZoom: state.mapZoom,
                    svHeading: Number(dom.svHeading?.value || 210) || 210,
                    svPitch: Number(dom.svPitch?.value || 10) || 10,
                    svFov: Number(dom.svFov?.value || 80) || 80,
                });
            }
        };

        const setupMapControls = () => {
            if (dom.mapModeSelect) {
                // Disable street option if no key
                try {
                    if (!state.config?.gmaps_embed_key)
                        dom.mapModeSelect.querySelector('option[value="street"]').disabled = true;
                } catch (e) {
                    /* ignore */
                }
                dom.mapModeSelect.addEventListener('change', () => applyMapMode());
            }
            if (dom.mapZoomRange) {
                dom.mapZoomRange.addEventListener('input', () => {
                    state.mapZoom = Number(dom.mapZoomRange.value) || 15;
                    applyMapMode();
                });
            }
            if (dom.svHeading) dom.svHeading.addEventListener('input', applyMapMode);
            if (dom.svPitch) dom.svPitch.addEventListener('input', applyMapMode);
            if (dom.svFov) dom.svFov.addEventListener('input', applyMapMode);
        };

        // Edit client address modal handlers
        if (dom.btnEditClientAddress) {
            dom.btnEditClientAddress.addEventListener('click', () => {
                const cli = state.selectedClientDetail;
                if (!cli || !state.selectedClientId) {
                    alert('Seleziona un cliente.');
                    return;
                }
                const f = dom.formEditClientAddress;
                if (!f) return;
                dom.editClientFields.id.value = String(state.selectedClientId);
                dom.editClientFields.indirizzo.value = cli.indirizzo || '';
                dom.editClientFields.cap.value = cli.cap || '';
                dom.editClientFields.citta.value = cli.citta || '';
                dom.editClientFields.provincia.value = cli.provincia || '';
                dom.editClientFields.nazione.value = cli.nazione || '';
                openModal('modal-edit-client-address');
            });
        }

        if (dom.formEditClientAddress) {
            dom.formEditClientAddress.addEventListener('submit', async (ev) => {
                ev.preventDefault();
                const id = Number(dom.editClientFields.id.value || state.selectedClientId);
                if (!id) {
                    alert('Cliente non valido.');
                    return;
                }
                const payload = {
                    indirizzo: dom.editClientFields.indirizzo.value.trim(),
                    cap: dom.editClientFields.cap.value.trim(),
                    citta: dom.editClientFields.citta.value.trim(),
                    provincia: dom.editClientFields.provincia.value.trim(),
                    nazione: dom.editClientFields.nazione.value.trim(),
                };
                if (!payload.citta || !payload.nazione) {
                    alert('Compila almeno Città e Nazione.');
                    return;
                }
                try {
                    await authFetch(`clienti/${id}`, { method: 'PUT', json: true, body: payload });
                    closeAllModals();
                    await loadClients();
                    await loadClientById(id);
                } catch (e) {
                    alert(e.message || 'Errore nel salvataggio indirizzo.');
                }
            });
        }

        // Save geocoded lat/lon to cliente
        if (dom.btnSaveGeo) {
            dom.btnSaveGeo.addEventListener('click', async () => {
                if (!state.selectedClientId) {
                    alert('Seleziona un cliente.');
                    return;
                }
                if (!state.clientGeo) {
                    alert("Nessuna coordinata calcolata. Correggi l'indirizzo e riprova.");
                    return;
                }
                try {
                    await authFetch(`clienti/${state.selectedClientId}`, {
                        method: 'PUT',
                        json: true,
                        body: {
                            latitudine: state.clientGeo.lat,
                            longitudine: state.clientGeo.lon,
                        },
                    });
                    try {
                        showToast('Coordinate salvate', { type: 'success' });
                    } catch (e) {}
                } catch (e) {
                    alert(e.message || 'Errore nel salvataggio coordinate.');
                }
            });
        }

        const loadClients = async () => {
            const term = (dom.clientsSearch?.value || '').trim();
            const qs = new URLSearchParams();
            if (term) qs.set('search', term);
            let url = 'clienti';
            if ([...qs.keys()].length) url += `?${qs.toString()}`;
            try {
                const list = await authFetch(url);
                state.clients = Array.isArray(list) ? list : [];
                // Populate filters options
                if (dom.clientsProvSel) {
                    const uniqProv = Array.from(
                        new Set(state.clients.map((c) => c.provincia).filter(Boolean)),
                    ).sort();
                    const current = dom.clientsProvSel.value;
                    dom.clientsProvSel.innerHTML =
                        '<option value="">Tutte</option>' +
                        uniqProv
                            .map((p) => `<option value="${sanitize(p)}">${sanitize(p)}</option>`)
                            .join('');
                    dom.clientsProvSel.value = current || '';
                }
                if (dom.clientsCitySel) {
                    const prov = dom.clientsProvSel?.value || '';
                    const filteredForCity = prov
                        ? state.clients.filter((c) => String(c.provincia || '') === prov)
                        : state.clients;
                    const uniqCity = Array.from(
                        new Set(filteredForCity.map((c) => c.citta).filter(Boolean)),
                    ).sort((a, b) => String(a).localeCompare(String(b), 'it'));
                    const currentC = dom.clientsCitySel.value;
                    dom.clientsCitySel.innerHTML =
                        '<option value="">Tutte</option>' +
                        uniqCity
                            .map((ci) => `<option value="${sanitize(ci)}">${sanitize(ci)}</option>`)
                            .join('');
                    dom.clientsCitySel.value = currentC || '';
                }
                renderClientsList();
                if (!state.selectedClientId && state.clients.length) {
                    state.selectedClientId = state.clients[0].id;
                }
                await loadClientById(state.selectedClientId);
            } catch (e) {
                if (dom.clientsList)
                    dom.clientsList.innerHTML = `<p>${sanitize(e.message || 'Errore caricamento clienti')}</p>`;
            }
        };

        const renderInstanceDetail = (detail) => {
            if (!instanceDetailEls.name) return;

            if (!detail) {
                instanceDetailEls.name.textContent = 'Nessuna istanza selezionata';
                if (instanceDetailEls.description)
                    instanceDetailEls.description.textContent =
                        'Seleziona una istanza per visualizzare workflow, progressi e task.';
                if (instanceDetailEls.workflow) instanceDetailEls.workflow.textContent = '--';
                if (instanceDetailEls.status) instanceDetailEls.status.textContent = '--';
                if (instanceDetailEls.started) instanceDetailEls.started.textContent = '--';
                if (instanceDetailEls.startedBy) instanceDetailEls.startedBy.textContent = '--';
                if (instanceDetailEls.updated) instanceDetailEls.updated.textContent = '--';
                if (instanceDetailEls.tasks) {
                    instanceDetailEls.tasks.innerHTML =
                        '<p>Seleziona una istanza per visualizzare i task.</p>';
                }
                return;
            }

            const info =
                instanceState.list.find((item) => Number(item.id) === Number(detail.id)) || detail;
            const workflowName =
                info.nome_workflow ||
                detail.nome_workflow ||
                `Workflow #${detail.workflow_modello_id}`;
            const stato = detail.stato || info.stato_istanza || info.stato;
            const startedAt = detail.avviato_il || info.avviato_il;
            const startedBy = info.nome_utente_avvio || detail.nome_utente_avvio;
            // Calcolo "Aggiornato il": prendo il massimo tra timestamp dell'istanza
            // e quelli dei task collegati (es. note/azioni che aggiornano il task)
            const candidateTs = [];
            if (detail.completato_il) candidateTs.push(detail.completato_il);
            if (detail.data_aggiornamento) candidateTs.push(detail.data_aggiornamento);
            if (detail.avviato_il) candidateTs.push(detail.avviato_il);
            try {
                const tasksForTs = Array.isArray(detail.tasks) ? detail.tasks : [];
                tasksForTs.forEach((t) => {
                    if (t.completato_il) candidateTs.push(t.completato_il);
                    if (t.assegnato_il) candidateTs.push(t.assegnato_il);
                    if (t.data_aggiornamento) candidateTs.push(t.data_aggiornamento);
                    if (t.avviato_il) candidateTs.push(t.avviato_il);
                });
            } catch (e) {
                /* ignore */
            }
            const updatedAt = candidateTs.length
                ? candidateTs.reduce((max, ts) => {
                      const d = new Date(ts);
                      return isNaN(d.getTime()) ? max : Math.max(max, d.getTime());
                  }, 0)
                : null;
            const description = detail.entita_collegata_tipo
                ? `Collegata a ${detail.entita_collegata_tipo}${detail.entita_collegata_id ? ` #${detail.entita_collegata_id}` : ''}`
                : 'Dettaglio workflow in corso.';

            instanceDetailEls.name.textContent = workflowName;
            if (instanceDetailEls.description)
                instanceDetailEls.description.textContent = description;
            if (instanceDetailEls.workflow) instanceDetailEls.workflow.textContent = workflowName;
            if (instanceDetailEls.status)
                instanceDetailEls.status.textContent = humanizeStatus(stato);
            if (instanceDetailEls.started)
                instanceDetailEls.started.textContent = formatDateTime(startedAt);
            if (instanceDetailEls.startedBy)
                instanceDetailEls.startedBy.textContent = startedBy || '--';
            if (instanceDetailEls.updated)
                instanceDetailEls.updated.textContent = updatedAt
                    ? formatDateTime(new Date(updatedAt))
                    : '--';

            // Se collegata a CLIENTE, risolvi e mostra la ragione sociale anche nella descrizione e nei meta
            try {
                const tipo = String(detail.entita_collegata_tipo || '').toUpperCase();
                const eid = detail.entita_collegata_id;
                if (tipo === 'CLIENTE' && eid) {
                    (async () => {
                        try {
                            const cli = await authFetch(`clienti/${eid}`);
                            const name = cli && (cli.ragione_sociale || cli.nome || cli.email);
                            if (name && instanceDetailEls.description) {
                                instanceDetailEls.description.textContent = `Collegata a CLIENTE #${eid} — ${name}`;
                            }
                            const meta = document.querySelector('.instance-detail__meta');
                            if (meta) {
                                let dd = document.getElementById('instance-detail-client');
                                const label = name ? sanitize(name) : `#${sanitize(eid)}`;
                                if (!dd) {
                                    const div = document.createElement('div');
                                    div.innerHTML = `<dt>Cliente</dt><dd id="instance-detail-client"><a href="#" class="btn-link" data-action="open-client" data-client-id="${sanitize(eid)}">${label}</a></dd>`;
                                    meta.appendChild(div);
                                } else {
                                    dd.innerHTML = `<a href="#" class="btn-link" data-action="open-client" data-client-id="${sanitize(eid)}">${label}</a>`;
                                }
                            }
                        } catch (e) {
                            /* ignore */
                        }
                    })();
                }
            } catch (e) {
                /* ignore */
            }

            if (instanceDetailEls.tasks) {
                const tasks = Array.isArray(detail.tasks)
                    ? detail.tasks
                    : normalizeListResponse(detail.tasks, ['tasks', 'records', 'items']);
                if (!tasks.length) {
                    instanceDetailEls.tasks.innerHTML =
                        '<p>Nessun task generato per questa istanza.</p>';
                } else {
                    const rows = tasks
                        .map((task) => {
                            const stepParts = [];
                            if (task.step_ordine !== undefined && task.step_ordine !== null) {
                                stepParts.push(task.step_ordine);
                            }
                            if (
                                task.step_sottopasso !== undefined &&
                                task.step_sottopasso !== null
                            ) {
                                stepParts.push(task.step_sottopasso);
                            }
                            const stepLabel = stepParts.length ? stepParts.join('.') : '—';
                            const name = task.nome || `Task #${task.id}`;
                            const status = humanizeStatus(task.stato || task.stato_nome);
                            const assignee =
                                task.nome_utente_completo ||
                                task.assegnato_a_nome ||
                                (task.assegnato_a_utente_id
                                    ? `Utente #${task.assegnato_a_utente_id}`
                                    : 'Non assegnato');
                            const updated =
                                task.completato_il ||
                                task.assegnato_il ||
                                task.data_aggiornamento ||
                                '';

                            return `
                            <tr>
                                <td>${sanitize(stepLabel)}</td>
                                <td>${sanitize(name)}</td>
                                <td>${sanitize(status)}</td>
                                <td>${sanitize(assignee)}</td>
                                <td>${sanitize(updated ? formatDateTime(updated) : '--')}</td>
                            </tr>
                        `;
                        })
                        .join('');

                    instanceDetailEls.tasks.innerHTML = `
                        <table>
                            <thead>
                                <tr>
                                    <th>Step</th>
                                    <th>Nome</th>
                                    <th>Stato</th>
                                    <th>Assegnato a</th>
                                    <th>Aggiornato il</th>
                                </tr>
                            </thead>
                            <tbody>${rows}</tbody>
                        </table>
                    `;
                }
            }

            // Assignees (chi ce l'ha in carico)
            if (instanceDetailEls.assignees) {
                const key = String(detail.id);
                let label = instanceState.assignees[key] || '';
                const setLabel = (text) => {
                    instanceDetailEls.assignees.textContent = text && text.trim() ? text : '—';
                };
                if (label) {
                    setLabel(label);
                } else {
                    // Fallback: carica in tempo reale
                    (async () => {
                        try {
                            const data = await authFetch(
                                `tasks?workflow_istanza_id=${detail.id}&id_stato=2`,
                            );
                            const list = normalizeListResponse(data, ['tasks', 'records', 'items']);
                            const names = [];
                            (list || []).forEach((t) => {
                                const n =
                                    (t.nome_utente_completo &&
                                        String(t.nome_utente_completo).trim()) ||
                                    (t.assegnato_a_utente_id
                                        ? `Utente #${t.assegnato_a_utente_id}`
                                        : '');
                                if (n && !names.includes(n)) names.push(n);
                            });
                            label = names.join(', ');
                            if (names.length > 3)
                                label = names.slice(0, 3).join(', ') + ` +${names.length - 3}`;
                            instanceState.assignees[key] = label;
                            setLabel(label);
                        } catch (e) {
                            setLabel('—');
                        }
                    })();
                }
            }

            // Notifiche: sottoworkflow completati avviati dall'utente corrente + indicazioni riassuntive
            (async () => {
                try {
                    const children = await authFetch(
                        `workflowistanze?id_istanza_padre=${detail.id}`,
                    );
                    const list = normalizeListResponse(children, ['istanze', 'records', 'items']);
                    // Banner di stato sottoworkflow
                    try {
                        const total = list.length;
                        const open = list.filter(
                            (inst) => String(inst.stato || inst.stato_istanza) !== 'COMPLETATO',
                        ).length;
                        const header = instanceDetailEls.container?.querySelector(
                            '.instance-detail__header',
                        );
                        if (header) {
                            let note = document.getElementById('instance-detail-subflows');
                            if (!note) {
                                note = document.createElement('p');
                                note.id = 'instance-detail-subflows';
                                note.className = 'form-hint';
                                header.appendChild(note);
                            }
                            if (total === 0) {
                                note.textContent = 'Nessun sottoworkflow collegato.';
                            } else {
                                note.textContent = `Sottoworkflow collegati: ${total} · In corso: ${open} · Completati: ${total - open}`;
                            }
                        }
                    } catch (e) {
                        /* ignore */
                    }
                    const myCompleted = list.filter(
                        (inst) =>
                            String(inst.stato || inst.stato_istanza) === 'COMPLETATO' &&
                            Number(inst.avviato_da) === Number(state.currentUserId),
                    );
                    if (myCompleted.length) {
                        loadSeenSubflows();
                        let newOnes = 0;
                        myCompleted.forEach((inst) => {
                            const key = String(inst.id);
                            if (!state.notifications.seenSubflows[key]) {
                                state.notifications.seenSubflows[key] = true;
                                newOnes += 1;
                            }
                        });
                        if (newOnes > 0) {
                            saveSeenSubflows();
                            state.notifications.count += newOnes;
                            const alertsEl = document.getElementById('metric-alerts');
                            if (alertsEl) {
                                alertsEl.textContent = state.notifications.count;
                            }
                        }
                    }
                } catch (e) {
                    /* ignore */
                }
            })();
        };

        const renderTaskOperations = () => {
            const userId = Number(state.currentUserId);
            const assigned = Array.isArray(state.taskBuckets.doing)
                ? state.taskBuckets.doing.filter(
                      (task) => Number(task.assegnato_a_utente_id) === userId,
                  )
                : [];
            const pending = Array.isArray(state.taskBuckets.todo)
                ? state.taskBuckets.todo.filter((task) => !task.assegnato_a_utente_id)
                : [];

            const statusClass = (raw) => {
                if (raw === 'APERTO') return 'status--open';
                if (raw === 'IN_LAVORAZIONE') return 'status--doing';
                if (raw === 'COMPLETATO') return 'status--done';
                return '';
            };

            const renderCards = (rows, type) =>
                rows
                    .map((task) => {
                        const workflow = sanitize(
                            task.nome_workflow || `Workflow #${task.workflow_modello_id}`,
                        );
                        const name = sanitize(task.nome || `Task #${task.id}`);
                        const assignee = sanitize(task.nome_utente_completo || '—');
                        const status = sanitize(humanizeStatus(task.stato || task.stato_nome));
                        const step =
                            task.step_ordine !== undefined && task.step_sottopasso !== undefined
                                ? `${task.step_ordine}.${task.step_sottopasso}`
                                : '—';
                        const id = sanitize(task.id);
                        const instId = sanitize(task.workflow_istanza_id);
                        const rawStatus = String(task.stato || task.stato_nome);
                        const sclass = statusClass(rawStatus);

                        const actions =
                            type === 'assigned'
                                ? `<button type="button" class="btn btn-secondary" data-action="task-open" data-task-id="${task.id}">Apri</button>
                       <button type="button" class="btn btn-success" data-action="task-complete" data-task-id="${task.id}">Completa</button>`
                                : `<button type="button" class="btn btn-primary" data-action="task-take" data-task-id="${task.id}">Prendi in carico</button>`;

                        return `
                  <article class="op-card">
                    <div class="op-card__header">
                      <h5 class="op-card__title">${name}</h5>
                      <span class="status-badge ${sclass}">${status}</span>
                    </div>
                    <div class="op-card__meta">
                      <div><strong>ID</strong> #${id}</div>
                      <div><strong>Istanza</strong> ${instId}</div>
                      <div><strong>Step</strong> ${step}</div>
                      <div><strong>Workflow</strong> ${workflow}</div>
                      <div><strong>Assegnato a</strong> ${assignee}</div>
                    </div>
                    <div class="op-card__actions">${actions}</div>
                  </article>
                `;
                    })
                    .join('');

            if (dom.opsAssignedList) {
                if (assigned.length) {
                    dom.opsAssignedList.innerHTML = renderCards(assigned, 'assigned');
                    if (dom.opsEmptyAssigned) dom.opsEmptyAssigned.hidden = true;
                } else {
                    dom.opsAssignedList.innerHTML = '';
                    if (dom.opsEmptyAssigned) dom.opsEmptyAssigned.hidden = false;
                }
            }

            if (dom.opsUnassignedList) {
                if (pending.length) {
                    dom.opsUnassignedList.innerHTML = renderCards(pending, 'pending');
                    if (dom.opsEmptyPending) dom.opsEmptyPending.hidden = true;
                } else {
                    dom.opsUnassignedList.innerHTML = '';
                    if (dom.opsEmptyPending) dom.opsEmptyPending.hidden = false;
                }
            }

            const attachDelegation = (container) => {
                if (!container || container._opsDelegationBound) return;
                container.addEventListener('click', (ev) => {
                    let t = ev.target;
                    if (!(t instanceof Element)) t = t?.parentElement || null;
                    if (!t) return;
                    const openBtn = t.closest('[data-action="task-open"]');
                    const takeBtn = t.closest('[data-action="task-take"]');
                    const completeBtn = t.closest('[data-action="task-complete"]');
                    if (openBtn) {
                        ev.preventDefault();
                        loadTaskDetail(openBtn.dataset.taskId);
                        return;
                    }
                    if (takeBtn) {
                        ev.preventDefault();
                        handleTaskTake(takeBtn.dataset.taskId);
                        return;
                    }
                    if (completeBtn) {
                        ev.preventDefault();
                        handleTaskComplete(completeBtn.dataset.taskId);
                        return;
                    }
                });
                container._opsDelegationBound = true;
            };
            attachDelegation(dom.opsAssignedList);
            attachDelegation(dom.opsUnassignedList);
        };

        const ensureOpsToolbar = () => {
            const panel = dom.taskOpsPanel;
            if (!panel) return;
            if (panel.querySelector('.ops-toolbar')) return; // già presente
            const body = panel.querySelector('.panel__body');
            if (!body) return;

            const toolbar = document.createElement('div');
            toolbar.className = 'ops-toolbar';
            toolbar.innerHTML = `
                <div class="segmented" id="ops-filter" role="tablist" aria-label="Filtro operatività">
                    <button type="button" class="segmented__btn is-active" data-ops-filter="all" aria-selected="true">Tutto</button>
                    <button type="button" class="segmented__btn" data-ops-filter="mine" aria-selected="false">In carico</button>
                    <button type="button" class="segmented__btn" data-ops-filter="available" aria-selected="false">Disponibili</button>
                </div>
                <small class="ops-legend">
                    <span class="legend legend--open">Aperto</span>
                    <span class="legend legend--doing">In gestione</span>
                    <span class="legend legend--done">Completato</span>
                </small>
            `;
            body.prepend(toolbar);

            const applyFilter = (mode) => {
                let secAssigned = dom.opsSectionAssigned;
                let secPending = dom.opsSectionPending;
                if ((!secAssigned || !secPending) && panel) {
                    const sections = panel.querySelectorAll('section.task-ops__section');
                    secAssigned = secAssigned || sections[0] || null;
                    secPending = secPending || sections[1] || null;
                }
                if (!secAssigned || !secPending) return;
                switch (mode) {
                    case 'mine':
                        secAssigned.hidden = false;
                        secPending.hidden = true;
                        break;
                    case 'available':
                        secAssigned.hidden = true;
                        secPending.hidden = false;
                        break;
                    default:
                        secAssigned.hidden = false;
                        secPending.hidden = false;
                }
            };

            toolbar.addEventListener('click', (ev) => {
                const btn = ev.target.closest('.segmented__btn');
                if (!btn) return;
                toolbar.querySelectorAll('.segmented__btn').forEach((b) => {
                    b.classList.toggle('is-active', b === btn);
                    b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
                });
                applyFilter(btn.dataset.opsFilter);
            });

            applyFilter('all');
            // Esporta funzione globale per uso esterno
            window.__lpwfSetOpsFilter = (mode) => {
                const btn =
                    toolbar.querySelector(`.segmented__btn[data-ops-filter="${mode}"]`) ||
                    toolbar.querySelector('.segmented__btn');
                if (!btn) return;
                toolbar.querySelectorAll('.segmented__btn').forEach((b) => {
                    b.classList.toggle('is-active', b === btn);
                    b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
                });
                applyFilter(mode);
            };
        };

        const jumpToUserOps = (userId) => {
            if (!userId) return;
            if (state.isAdmin && dom.userSelector) {
                dom.userSelector.disabled = false;
                dom.userSelector.value = String(userId);
                state.currentUser = String(userId);
            }
            setActiveView('ops');
            ensureOpsToolbar();
            try {
                window.__lpwfSetOpsFilter && window.__lpwfSetOpsFilter('mine');
            } catch (e) {}
            loadTasks();
        };

        const populateSubflowSelectors = () => {
            if (!taskModalElements.subflowWorkflow) return;

            const selectWorkflow = taskModalElements.subflowWorkflow;
            selectWorkflow.innerHTML = '<option value="">Seleziona workflow...</option>';
            workflowState.list.forEach((wf) => {
                const opt = document.createElement('option');
                opt.value = wf.id;
                opt.textContent = sanitize(wf.nome_workflow || wf.nome || `Workflow #${wf.id}`);
                selectWorkflow.appendChild(opt);
            });

            const selectUser = taskModalElements.subflowUser;
            if (selectUser) {
                selectUser.innerHTML = '<option value="">Seleziona operatore...</option>';
                state.users.forEach((user) => {
                    const opt = document.createElement('option');
                    opt.value = user.id;
                    opt.textContent = buildUserLabel(user);
                    selectUser.appendChild(opt);
                });
            }
        };

        const renderTaskModal = () => {
            if (!state.activeTask || !taskModalElements.title) return;

            const task = state.activeTask;
            const workflowLabel = sanitize(
                task.nome_workflow || `Workflow #${task.workflow_modello_id}`,
            );
            const statusLabel = sanitize(humanizeStatus(task.stato || task.stato_nome));
            const assigneeLabel = task.nome_utente_completo
                ? sanitize(task.nome_utente_completo)
                : task.assegnato_a_utente_id
                  ? `Utente #${task.assegnato_a_utente_id}`
                  : 'Nessuno';
            const updatedLabel =
                task.completato_il ||
                task.assegnato_il ||
                task.data_aggiornamento ||
                task.avviato_il;
            const isMine = Number(task.assegnato_a_utente_id) === Number(state.currentUserId);
            const isOpen = (task.stato || task.stato_nome) === 'APERTO';
            const isInProgress = (task.stato || task.stato_nome) === 'IN_LAVORAZIONE';
            const hasNotes =
                Array.isArray(state.activeTaskNotes) && state.activeTaskNotes.length > 0;
            const subflows = Array.isArray(state.activeTaskSubflows)
                ? state.activeTaskSubflows
                : [];
            const openSubflows = subflows.filter(
                (s) => String(s.stato || s.stato_istanza) !== 'COMPLETATO',
            );

            taskModalElements.title.textContent = sanitize(task.nome || `Task #${task.id}`);
            if (taskModalElements.workflow) taskModalElements.workflow.textContent = workflowLabel;
            if (taskModalElements.status) taskModalElements.status.textContent = statusLabel;
            if (taskModalElements.assignee) taskModalElements.assignee.textContent = assigneeLabel;
            if (taskModalElements.updated)
                taskModalElements.updated.textContent = updatedLabel
                    ? formatDateTime(updatedLabel)
                    : '--';

            if (taskModalElements.takeBtn) {
                taskModalElements.takeBtn.dataset.taskId = task.id;
                taskModalElements.takeBtn.hidden = !(
                    isOpen ||
                    (!task.assegnato_a_utente_id && !isMine)
                );
            }

            if (taskModalElements.completeBtn) {
                taskModalElements.completeBtn.dataset.taskId = task.id;
                taskModalElements.completeBtn.hidden = !isMine || !isInProgress;
                // Disabilita se mancano note o ci sono sottoworkflow aperti
                taskModalElements.completeBtn.disabled = !hasNotes || openSubflows.length > 0;
            }

            if (taskModalElements.noteInput) {
                taskModalElements.noteInput.value = '';
            }

            if (taskModalElements.subflowMessage) {
                taskModalElements.subflowMessage.textContent = '';
            }

            if (taskModalElements.subflowForm) {
                taskModalElements.subflowForm.dataset.taskId = task.id;
                populateSubflowSelectors();
            }

            if (taskModalElements.notesList) {
                if (!state.activeTaskNotes.length) {
                    taskModalElements.notesList.innerHTML =
                        '<p class="empty-state">Nessuna nota presente.</p>';
                } else {
                    const items = state.activeTaskNotes
                        .map((note) => {
                            const author = [note.utente_nome, note.utente_cognome]
                                .filter(Boolean)
                                .join(' ')
                                .trim();
                            const timestamp = note.data_creazione
                                ? formatDateTime(note.data_creazione)
                                : '';
                            const body = sanitize(note.nota || '');
                            const atts =
                                Array.isArray(note.allegati) && note.allegati.length
                                    ? '<div class="task-note__attachments">' +
                                      note.allegati
                                          .map(
                                              (a) =>
                                                  `<a href="${sanitize(a.percorso)}" target="_blank" rel="noopener">${sanitize(a.nome_file)}</a>`,
                                          )
                                          .join(' ') +
                                      '</div>'
                                    : '';
                            return `
                            <article class="task-note">
                                <header>
                                    <strong>${sanitize(author || 'Operatore')}</strong>
                                    <span>${sanitize(timestamp)}</span>
                                </header>
                                <p>${body}</p>
                                ${atts}
                            </article>
                        `;
                        })
                        .join('');
                    taskModalElements.notesList.innerHTML = items;
                }
            }

            // Sezione sottoworkflow correlati (crea/aggiorna dinamicamente)
            try {
                const modalBody = document.querySelector('#modal-task-work .task-modal');
                if (modalBody) {
                    let sec = document.getElementById('task-subflows-section');
                    if (!sec) {
                        sec = document.createElement('section');
                        sec.id = 'task-subflows-section';
                        sec.className = 'task-modal__section';
                        const ref = document.getElementById('form-task-subflow');
                        if (ref && ref.parentElement) {
                            ref.parentElement.insertBefore(sec, ref);
                        } else {
                            modalBody.appendChild(sec);
                        }
                    }
                    if (!subflows.length) {
                        sec.innerHTML =
                            '<h4>Sottoworkflow correlati</h4><p class="form-hint">Nessun sottoworkflow avviato da questo task.</p>';
                    } else {
                        const items = subflows
                            .map((inst) => {
                                const sid = sanitize(inst.id);
                                const st = sanitize(String(inst.stato || inst.stato_istanza));
                                const name = sanitize(
                                    inst.nome_workflow ||
                                        `Workflow #${inst.workflow_modello_id || ''}`,
                                );
                                return `<li><a href="#" class="btn-link" data-action="open-instance" data-inst-id="${sid}">#${sid}</a> · ${name} · <strong>${st}</strong></li>`;
                            })
                            .join('');
                        const warn = openSubflows.length
                            ? `<p class="form-hint" style="color:#b91c1c;">Attenzione: ${openSubflows.length} sottoworkflow non completato/i. Completa prima i sottoworkflow per poter chiudere il task.</p>`
                            : '';
                        sec.innerHTML = `<h4>Sottoworkflow correlati</h4><ul>${items}</ul>${warn}`;
                    }
                }
            } catch (e) {
                /* ignore */
            }
        };

        const loadTaskDetail = async (taskId) => {
            try {
                const detail = await authFetch(`tasks/${taskId}`);
                if (!detail || typeof detail !== 'object') {
                    throw new Error('Task non trovato.');
                }
                state.activeTask = detail;
                try {
                    const notes = await authFetch(`tasks/${taskId}/note`);
                    state.activeTaskNotes = Array.isArray(notes) ? notes : [];
                } catch (err) {
                    state.activeTaskNotes = [];
                }
                // Carica sottoworkflow correlati avviati da questo task (figli dell'istanza del task)
                try {
                    const instId = Number(detail.workflow_istanza_id);
                    const children = await authFetch(`workflowistanze?id_istanza_padre=${instId}`);
                    const list = normalizeListResponse(children, ['istanze', 'records', 'items']);
                    state.activeTaskSubflows = (list || []).filter(
                        (x) =>
                            String(x.entita_collegata_tipo) === 'SOTTOPROCESSO' &&
                            String(x.entita_collegata_id) === String(detail.id),
                    );
                } catch (e) {
                    state.activeTaskSubflows = [];
                }
                renderTaskModal();
                openModal('modal-task-work');
            } catch (error) {
                alert(error.message || 'Impossibile caricare il task selezionato.');
            }
        };

        const handleTaskTake = async (taskId) => {
            try {
                // Lasciamo al backend la risoluzione dell'utente corrente (user_id opzionale)
                await authFetch(`tasks/${taskId}/assign`, { method: 'PUT', json: true, body: {} });
                await Promise.all([loadTasks(), loadInstances()]);
                // Dopo la presa in carico, apri direttamente la modale del task
                await loadTaskDetail(taskId);
                try {
                    showToast(`Task #${taskId} preso in carico`, { type: 'success' });
                } catch (e) {}
            } catch (error) {
                try {
                    showToast(error.message || 'Impossibile prendere in carico il task.', {
                        type: 'error',
                    });
                } catch (e) {}
            }
        };

        const preCheckTaskComplete = async (taskId) => {
            try {
                const task = await authFetch(`tasks/${taskId}`);
                // Note
                let notes = [];
                try {
                    notes = await authFetch(`tasks/${taskId}/note`);
                } catch (e) {
                    notes = [];
                }
                const hasNotes = Array.isArray(notes) && notes.length > 0;
                if (!hasNotes) {
                    return {
                        ok: false,
                        reason: 'Inserisci almeno una nota prima di completare il task.',
                    };
                }
                // Subflows
                let children = [];
                try {
                    const resp = await authFetch(
                        `workflowistanze?id_istanza_padre=${task.workflow_istanza_id}`,
                    );
                    children = normalizeListResponse(resp, ['istanze', 'records', 'items']);
                } catch (e) {
                    children = [];
                }
                const subs = (children || []).filter(
                    (x) =>
                        String(x.entita_collegata_tipo) === 'SOTTOPROCESSO' &&
                        String(x.entita_collegata_id) === String(taskId),
                );
                const openSubs = subs.filter(
                    (s) => String(s.stato || s.stato_istanza) !== 'COMPLETATO',
                );
                if (openSubs.length > 0) {
                    return {
                        ok: false,
                        reason: `Esiste un sottoworkflow correlato non completato (ID: ${openSubs.map((s) => s.id).join(', ')}). Completa prima il flusso correlato.`,
                    };
                }
                return { ok: true };
            } catch (e) {
                return { ok: false, reason: e.message || 'Verifica completamento fallita.' };
            }
        };

        const handleTaskComplete = async (taskId) => {
            try {
                const check = await preCheckTaskComplete(taskId);
                if (!check.ok) {
                    try {
                        showToast(check.reason, { type: 'error' });
                    } catch (e) {}
                    // se il task aperto non è in modale, aprilo per maggiori info
                    if (!state.activeTask || Number(state.activeTask.id) !== Number(taskId)) {
                        try {
                            await loadTaskDetail(taskId);
                        } catch (e) {}
                    } else {
                        // aggiorna UI del bottone disabilitandolo
                        renderTaskModal();
                    }
                    return;
                }
                await authFetch(`tasks/${taskId}/complete`, {
                    method: 'PUT',
                    json: true,
                    body: {},
                });
                closeAllModals();
                await Promise.all([loadTasks(), loadInstances()]);
                try {
                    showToast(`Task #${taskId} completato`, { type: 'success' });
                } catch (e) {}
            } catch (error) {
                try {
                    showToast(error.message || 'Impossibile completare il task.', {
                        type: 'error',
                    });
                } catch (e) {}
            }
        };

        const handleTaskNoteSubmit = async (event) => {
            event.preventDefault();
            if (!state.activeTask || !taskModalElements.noteInput) return;
            const noteText = taskModalElements.noteInput.value.trim();
            if (!noteText) {
                alert('Inserisci il testo della nota prima di procedere.');
                return;
            }

            try {
                const res = await authFetch(`tasks/${state.activeTask.id}/note`, {
                    method: 'POST',
                    json: true,
                    body: {
                        nota: noteText,
                        id_utente: state.currentUserId,
                    },
                });
                taskModalElements.noteInput.value = '';
                const noteId = res && typeof res === 'object' ? res.id : null;
                // Upload allegati se presenti
                const filesInput = taskModalElements.noteFiles;
                if (noteId && filesInput && filesInput.files && filesInput.files.length) {
                    const oks = [];
                    const errs = [];
                    for (const file of filesInput.files) {
                        const fd = new FormData();
                        fd.append('note_id', String(noteId));
                        fd.append('file', file);
                        try {
                            await authFetch(`tasks/${state.activeTask.id}/note_attach`, {
                                method: 'POST',
                                body: fd,
                            });
                            oks.push(file.name);
                        } catch (e) {
                            errs.push(`${file.name}: ${e.message || 'errore'}`);
                        }
                    }
                    filesInput.value = '';
                    if (oks.length)
                        showToast(`Caricati: ${oks.join(', ')}`, {
                            type: 'success',
                            duration: 6000,
                        });
                    if (errs.length)
                        showToast(`Scartati: ${errs.join(' | ')}`, {
                            type: 'warn',
                            duration: 8000,
                        });
                }
                await loadTaskDetail(state.activeTask.id);
                // Aggiorna anche istanze: lista + dettaglio (campo "Aggiornato il")
                try {
                    const instId = Number(state.activeTask.workflow_istanza_id);
                    if (!Number.isNaN(instId)) {
                        await loadInstances();
                        delete instanceState.detailCache[String(instId)];
                        await loadInstanceDetail(instId);
                    }
                } catch (e) {
                    /* ignore */
                }
                try {
                    showToast('Nota salvata', { type: 'success' });
                } catch (e) {}
            } catch (error) {
                try {
                    showToast(error.message || 'Errore durante il salvataggio della nota.', {
                        type: 'error',
                    });
                } catch (e) {}
            }
        };

        const handleTaskSubflowSubmit = async (event) => {
            event.preventDefault();
            if (!state.activeTask || !taskModalElements.subflowWorkflow) return;

            const workflowId = Number(taskModalElements.subflowWorkflow.value);
            const userId = taskModalElements.subflowUser
                ? Number(taskModalElements.subflowUser.value) || null
                : null;

            if (!workflowId) {
                if (taskModalElements.subflowMessage) {
                    taskModalElements.subflowMessage.textContent =
                        'Seleziona un workflow da avviare.';
                }
                return;
            }

            if (taskModalElements.subflowMessage) {
                taskModalElements.subflowMessage.textContent = 'Avvio sottoworkflow in corso...';
            }

            try {
                await authFetch(`tasks/${state.activeTask.id}/start_subflow/${workflowId}`, {
                    method: 'POST',
                    json: true,
                    body: {
                        id_utente_avvio: state.currentUserId,
                        assegna_a_utente_id: userId,
                    },
                });
                if (taskModalElements.subflowMessage) {
                    taskModalElements.subflowMessage.textContent =
                        'Sottoworkflow avviato con successo.';
                }
                await Promise.all([loadTaskDetail(state.activeTask.id), loadInstances()]);
                try {
                    showToast('Sottoworkflow avviato', { type: 'success' });
                } catch (e) {}
            } catch (error) {
                if (taskModalElements.subflowMessage) {
                    taskModalElements.subflowMessage.textContent =
                        error.message || "Errore durante l'avvio del sottoworkflow.";
                } else {
                    try {
                        showToast(error.message || "Errore durante l'avvio del sottoworkflow.", {
                            type: 'error',
                        });
                    } catch (e) {}
                }
            }
        };

        const loadInstanceDetail = async (instanceId) => {
            if (!instanceId) {
                renderInstanceDetail(null);
                return;
            }

            const cacheKey = String(instanceId);

            if (instanceState.detailCache[cacheKey]) {
                renderInstanceDetail(instanceState.detailCache[cacheKey]);
                return;
            }

            if (instanceDetailEls.tasks) {
                instanceDetailEls.tasks.innerHTML = '<p>Caricamento task...</p>';
            }

            try {
                const detail = await authFetch(`workflowistanze/${instanceId}`);
                if (detail && detail.tasks && !Array.isArray(detail.tasks)) {
                    detail.tasks = normalizeListResponse(detail.tasks, [
                        'tasks',
                        'records',
                        'items',
                    ]);
                }
                detail.id = detail.id ?? instanceId;
                instanceState.detailCache[cacheKey] = detail;
                renderInstanceDetail(detail);
            } catch (error) {
                if (instanceDetailEls.tasks) {
                    instanceDetailEls.tasks.innerHTML = `<p>${sanitize(error.message || 'Errore nel caricamento dei task.')}</p>`;
                }
            }
        };

        const loadInstances = async () => {
            if (!dom.instancesList) return;
            dom.instancesList.innerHTML = '<p>Caricamento...</p>';
            try {
                const response = await authFetch('workflowistanze');
                const list = normalizeListResponse(response, ['istanze', 'records', 'items']);
                instanceState.list = Array.isArray(list)
                    ? list.map((item) => ({
                          ...item,
                          id: item.id !== undefined ? Number(item.id) || item.id : item.id,
                      }))
                    : [];
                instanceState.detailCache = {};

                if (!instanceState.list.length) {
                    dom.instancesList.innerHTML = '<p>Nessuna istanza disponibile.</p>';
                    instanceState.selectedId = null;
                    renderInstanceDetail(null);
                    return;
                }

                if (
                    !instanceState.selectedId ||
                    !instanceState.list.some(
                        (item) => Number(item.id) === Number(instanceState.selectedId),
                    )
                ) {
                    instanceState.selectedId = Number(instanceState.list[0].id);
                }

                await checkInstancesAlerts();
                renderInstanceList();
                await loadInstanceDetail(instanceState.selectedId);
            } catch (error) {
                dom.instancesList.innerHTML = `<p>${sanitize(error.message || 'Errore nel caricamento delle istanze.')}</p>`;
                instanceState.list = [];
                instanceState.selectedId = null;
                renderInstanceDetail(null);
            }
        };

        const checkInstancesAlerts = async () => {
            instanceState.alerts = {};
            instanceState.progress = {};
            const promises = instanceState.list.map(async (inst) => {
                try {
                    const children = await authFetch(`workflowistanze?id_istanza_padre=${inst.id}`);
                    const list = normalizeListResponse(children, ['istanze', 'records', 'items']);
                    instanceState.childrenCache[String(inst.id)] = list;
                    const mine = list.filter(
                        (child) => Number(child.avviato_da) === Number(state.currentUserId),
                    );
                    const done = mine.filter(
                        (child) => String(child.stato || child.stato_istanza) === 'COMPLETATO',
                    ).length;
                    const doing = mine.filter(
                        (child) => String(child.stato || child.stato_istanza) !== 'COMPLETATO',
                    ).length;
                    if (done > 0) instanceState.alerts[String(inst.id)] = done;
                    if (doing > 0) instanceState.progress[String(inst.id)] = doing;
                } catch (e) {
                    /* ignore per singola istanza */
                }
            });
            await Promise.all(promises);
        };

        const updateInstanceAssignees = async () => {
            instanceState.assignees = {};
            const tasksPerInstance = await Promise.all(
                instanceState.list.map(async (inst) => {
                    try {
                        const data = await authFetch(
                            `tasks?workflow_istanza_id=${inst.id}&id_stato=2`,
                        );
                        const list = normalizeListResponse(data, ['tasks', 'records', 'items']);
                        return { id: inst.id, tasks: list };
                    } catch (e) {
                        return { id: inst.id, tasks: [] };
                    }
                }),
            );
            tasksPerInstance.forEach(({ id, tasks }) => {
                const names = [];
                const pairs = [];
                (tasks || []).forEach((t) => {
                    const n =
                        (t.nome_utente_completo && String(t.nome_utente_completo).trim()) ||
                        (t.assegnato_a_utente_id ? `Utente #${t.assegnato_a_utente_id}` : '');
                    if (n && !names.includes(n)) names.push(n);
                    if (
                        n &&
                        t.assegnato_a_utente_id &&
                        !pairs.find((x) => x.id === t.assegnato_a_utente_id)
                    ) {
                        pairs.push({ id: Number(t.assegnato_a_utente_id), name: n });
                    }
                });
                let label = names.join(', ');
                if (names.length > 3) {
                    label = names.slice(0, 3).join(', ') + ` +${names.length - 3}`;
                }
                const k = String(id);
                instanceState.assignees[k] = label;
                instanceState.assigneesFull[k] = names;
                instanceState.assigneeMap[k] = pairs;
            });
        };

        const fetchInstanceChildren = async (instId) => {
            const key = String(instId);
            if (instanceState.childrenCache[key]) return instanceState.childrenCache[key];
            try {
                const children = await authFetch(`workflowistanze?id_istanza_padre=${instId}`);
                const list = normalizeListResponse(children, ['istanze', 'records', 'items']);
                instanceState.childrenCache[key] = list;
                return list;
            } catch (e) {
                return [];
            }
        };

        const buildSubflowTooltip = (children) => {
            if (!children || !children.length) return 'Nessun sottoworkflow';
            const comp = children.filter(
                (c) => String(c.stato || c.stato_istanza) === 'COMPLETATO',
            );
            const prog = children.filter(
                (c) => String(c.stato || c.stato_istanza) !== 'COMPLETATO',
            );
            const fmt = (arr) =>
                arr.map((c) => {
                    const id = c.id;
                    const stato = humanizeStatus(c.stato || c.stato_istanza);
                    const who = c.nome_utente_avvio || '';
                    return `#${id} ${stato}${who ? ' • ' + who : ''}`;
                });
            const compLines = fmt(comp).slice(0, 4);
            const progLines = fmt(prog).slice(0, 4);
            const moreC =
                comp.length > compLines.length ? ` (+${comp.length - compLines.length})` : '';
            const moreP =
                prog.length > progLines.length ? ` (+${prog.length - progLines.length})` : '';
            let tip = '';
            if (progLines.length) tip += 'In corso:\n' + progLines.join('\n') + moreP + '\n';
            if (compLines.length)
                tip +=
                    (progLines.length ? '\n' : '') + 'Completati:\n' + compLines.join('\n') + moreC;
            return tip || 'Nessun sottoworkflow';
        };

        const loadGroups = async () => {
            if (!dom.groupsList) return;
            renderMessage(dom.groupsList, 'Caricamento...');
            try {
                // Richiedi anche users_count per filtro
                const groups = await authFetch('gruppi?with_user_counts=1');
                let list = Array.isArray(groups) ? groups : [];
                // Client-side filters: search + includeInactive flag using attivo se presente
                const q = (state.filters.groupsSearch || '').toLowerCase();
                if (q) {
                    list = list.filter((g) => {
                        const name = (g.nome_gruppo || g.nome || '').toLowerCase();
                        const descr = (g.descrizione || '').toLowerCase();
                        return name.includes(q) || descr.includes(q);
                    });
                }
                if (!state.filters.groupsIncludeInactive) {
                    list = list.filter((g) =>
                        g.attivo === undefined || g.attivo === null
                            ? true
                            : Number(g.attivo) === 1 || g.attivo === true,
                    );
                }
                // Filtro per contenuto utenti
                const hasUsers = state.filters.groupsHasUsers;
                if (hasUsers === 'with') {
                    list = list.filter((g) => Number(g.users_count || 0) > 0);
                } else if (hasUsers === 'without') {
                    list = list.filter((g) => Number(g.users_count || 0) === 0);
                }
                // Aggiorna titolo con conteggio
                try {
                    const ttl = document.getElementById('groups-panel-title');
                    if (ttl) ttl.textContent = `Gruppi di lavoro (${list.length || 0})`;
                } catch (e) {
                    /* no-op */
                }
                state.groups = list;
                dom.groupsList.innerHTML = '';
                state.groups.forEach((group) => {
                    const count = Number(group.users_count || 0);
                    const baseName = sanitize(
                        group.nome_gruppo || group.nome || `Gruppo #${group.id}`,
                    );
                    const name = `${baseName} (${count})`;
                    const descr = sanitize(group.descrizione || 'Nessuna descrizione');
                    const div = document.createElement('div');
                    const isInactive = !(Number(group.attivo) === 1 || group.attivo === true);
                    div.className = 'list-item' + (isInactive ? ' is-inactive' : '');
                    const badge = isInactive
                        ? ' <span class="badge badge-error">Disattivato</span>'
                        : ' <span class="badge badge-success">Attivo</span>';
                    const actions = isInactive
                        ? `<button type="button" class="btn btn-primary" data-action="restore-group" data-id="${group.id}">Ripristina</button>`
                        : `<button type="button" class="btn btn-danger" data-action="delete-group" data-id="${group.id}">Disattiva</button>`;
                    div.innerHTML = `<div class="item-header"><div><strong>${name}${badge}</strong><p class="form-hint">${descr}</p></div>
                        <div class="item-actions">
                            <button type="button" class="btn btn-link" data-action="toggle-group-users" data-id="${group.id}">Utenti (${count})</button>
                            <button type="button" class="btn btn-secondary" data-action="edit-group" data-id="${group.id}">Modifica</button>
                            ${actions}
                        </div></div>`;
                    const details = document.createElement('div');
                    details.className = 'item-details';
                    details.id = `group-users-${group.id}`;
                    details.hidden = true;
                    details.innerHTML = '<small class="form-hint">—</small>';
                    div.appendChild(details);
                    dom.groupsList.appendChild(div);
                });
                if (groupOptions) {
                    populateDatalist(groupOptions, state.groups, buildGroupLabel);
                }
                const adminGroupOptions = document.getElementById('group-options-admin');
                if (adminGroupOptions) {
                    populateDatalist(adminGroupOptions, state.groups, buildGroupLabel);
                }
                // Aggiorna filtro utenti per gruppo
                if (dom.filterUsersGroup) {
                    const current = dom.filterUsersGroup.value || 'all';
                    dom.filterUsersGroup.innerHTML = '<option value="all">Tutti i gruppi</option>';
                    (state.groups || []).forEach((g) => {
                        const opt = document.createElement('option');
                        opt.value = g.id;
                        const base = buildGroupLabel(g) || `Gruppo #${g.id}`;
                        const cnt = Number(g.users_count || 0);
                        opt.textContent = `${base} (${cnt})`;
                        dom.filterUsersGroup.appendChild(opt);
                    });
                    dom.filterUsersGroup.value = current;
                }
            } catch (error) {
                renderMessage(
                    dom.groupsList,
                    error.message || 'Errore nel caricamento dei gruppi.',
                );
                state.groups = [];
                if (groupOptions) {
                    groupOptions.innerHTML = '';
                }
            }
        };

        const setupFilters = () => {
            const debounce = (fn, ms = 300) => {
                let t;
                return (...args) => {
                    clearTimeout(t);
                    t = setTimeout(() => fn(...args), ms);
                };
            };
            if (dom.filterUsers) {
                dom.filterUsers.addEventListener(
                    'input',
                    debounce(() => {
                        state.filters.usersSearch = dom.filterUsers.value.trim();
                        renderUsersList();
                    }),
                );
            }
            if (dom.filterUsersGroup) {
                dom.filterUsersGroup.addEventListener('change', () => {
                    state.filters.usersGroupId = dom.filterUsersGroup.value || 'all';
                    // Filtra solo client-side
                    renderUsersList();
                });
            }
            if (dom.filterGroups) {
                dom.filterGroups.addEventListener(
                    'input',
                    debounce(() => {
                        state.filters.groupsSearch = dom.filterGroups.value.trim();
                        loadGroups();
                    }),
                );
            }
            // Ricerca modelli workflow
            const wfSearch = document.getElementById('filter-workflows-search');
            if (wfSearch) {
                wfSearch.addEventListener(
                    'input',
                    debounce(() => {
                        workflowState.search = wfSearch.value || '';
                        loadWorkflows();
                    }, 300),
                );
            }
            if (dom.filterGroupsHasUsers) {
                dom.filterGroupsHasUsers.addEventListener('change', () => {
                    state.filters.groupsHasUsers = dom.filterGroupsHasUsers.value || 'all';
                    loadGroups();
                });
            }
            // Ricerca clienti
            if (dom.clientsSearch) {
                dom.clientsSearch.addEventListener(
                    'input',
                    debounce(() => {
                        loadClients();
                    }, 300),
                );
            }
            if (dom.btnClientsRefresh) {
                dom.btnClientsRefresh.addEventListener('click', () => loadClients());
            }
            // Catalogo: filtri Prodotti & Servizi
            if (dom.filterProducts) {
                dom.filterProducts.addEventListener(
                    'input',
                    debounce(() => {
                        loadProducts();
                    }, 300),
                );
            }
            if (dom.filterProductsType) {
                dom.filterProductsType.addEventListener('change', () => {
                    loadProducts();
                });
            }
            if (dom.btnProductsRefresh) {
                dom.btnProductsRefresh.addEventListener('click', () => loadProducts());
            }
            if (dom.filterProductsCategory) {
                dom.filterProductsCategory.addEventListener('change', () => {
                    loadProducts();
                });
            }
            if (dom.filterProductsTenant) {
                dom.filterProductsTenant.addEventListener('change', () => {
                    loadProducts();
                });
            }
            if (dom.filterProductsOwnTenant) {
                dom.filterProductsOwnTenant.addEventListener('change', () => {
                    const chk = !!dom.filterProductsOwnTenant.checked;
                    state.productOwnTenantOnly = chk;
                    if (chk) {
                        // Imposta filtro tenant al tenant corrente
                        const curTid = Number(state.currentUserInfo?.tenant_id || 0);
                        if (curTid && dom.filterProductsTenant) {
                            // se già popolato, seleziona la voce corrispondente
                            const opt = [...dom.filterProductsTenant.options].find(
                                (o) => o.dataset && Number(o.dataset.id) === curTid,
                            );
                            if (opt) dom.filterProductsTenant.value = opt.value;
                        }
                    } else {
                        if (dom.filterProductsTenant) dom.filterProductsTenant.value = '';
                    }
                    loadProducts();
                });
            }
            if (dom.filterProductsVisibility) {
                dom.filterProductsVisibility.addEventListener('change', () => {
                    loadProducts();
                });
            }
            if (dom.clientsPrev) {
                dom.clientsPrev.addEventListener('click', () => {
                    if (state.clientPage > 1) {
                        state.clientPage -= 1;
                        renderClientsList();
                    }
                });
            }
            if (dom.clientsNext) {
                dom.clientsNext.addEventListener('click', () => {
                    state.clientPage += 1;
                    renderClientsList();
                });
            }
            if (dom.clientsPageSizeSel) {
                dom.clientsPageSizeSel.addEventListener('change', () => {
                    const v = parseInt(dom.clientsPageSizeSel.value, 10) || 50;
                    state.clientPageSize = Math.max(1, v);
                    state.clientPage = 1;
                    renderClientsList();
                });
            }
            if (dom.clientsProvSel) {
                dom.clientsProvSel.addEventListener('change', () => {
                    state.clientFilters.province = dom.clientsProvSel.value || '';
                    // When province changes, rebuild city options and reset city filter
                    if (dom.clientsCitySel) {
                        const prov = dom.clientsProvSel.value || '';
                        const filteredForCity = prov
                            ? state.clients.filter((c) => String(c.provincia || '') === prov)
                            : state.clients;
                        const uniqCity = Array.from(
                            new Set(filteredForCity.map((c) => c.citta).filter(Boolean)),
                        ).sort((a, b) => String(a).localeCompare(String(b), 'it'));
                        dom.clientsCitySel.innerHTML =
                            '<option value="">Tutte</option>' +
                            uniqCity
                                .map(
                                    (ci) =>
                                        `<option value="${sanitize(ci)}">${sanitize(ci)}</option>`,
                                )
                                .join('');
                        dom.clientsCitySel.value = '';
                        state.clientFilters.city = '';
                    }
                    state.clientPage = 1;
                    renderClientsList();
                });
            }
            if (dom.clientsCitySel) {
                dom.clientsCitySel.addEventListener('change', () => {
                    state.clientFilters.city = dom.clientsCitySel.value || '';
                    state.clientPage = 1;
                    renderClientsList();
                });
            }
            if (dom.filterUsersSupervisor) {
                dom.filterUsersSupervisor.addEventListener('change', () => {
                    state.filters.usersSupervisorId = dom.filterUsersSupervisor.value || 'all';
                    renderUsersList();
                });
            }
            if (dom.filterUsersRole) {
                dom.filterUsersRole.addEventListener('change', () => {
                    state.filters.usersRole = dom.filterUsersRole.value || 'all';
                    renderUsersList();
                });
            }
            // dedup: listener supervisor già definito sopra
            if (dom.toggleUsersInactive) {
                dom.toggleUsersInactive.addEventListener('change', () => {
                    state.filters.usersIncludeInactive = dom.toggleUsersInactive.checked;
                    renderUsersList();
                });
            }
            // Toggle: mostra anche workflow disattivi
            const toggleWfInactive = document.getElementById('toggle-workflows-include-inactive');
            if (toggleWfInactive) {
                toggleWfInactive.checked = !!workflowState.includeInactive;
                toggleWfInactive.addEventListener('change', () => {
                    workflowState.includeInactive = !!toggleWfInactive.checked;
                    loadWorkflows();
                });
            }
            if (dom.toggleGroupsInactive) {
                dom.toggleGroupsInactive.addEventListener('change', () => {
                    state.filters.groupsIncludeInactive = dom.toggleGroupsInactive.checked;
                    loadGroups();
                });
            }
            // Filtro cliente per istanze attive
            const instClientLabel = document.getElementById('instances-client-label');
            const instClientId = document.getElementById('instances-client-id');
            const instClientOptions = document.getElementById('client-options-instances');
            const fetchClients2 = async (term) => {
                try {
                    const qs = term ? `?search=${encodeURIComponent(term)}` : '';
                    const list = await authFetch(`clienti${qs}`);
                    return Array.isArray(list) ? list : [];
                } catch (e) {
                    return [];
                }
            };
            const populateClientOptions2 = (items) => {
                if (!instClientOptions) return;
                instClientOptions.innerHTML = '';
                (items || []).forEach((cli) => {
                    const opt = document.createElement('option');
                    opt.value = `${cli.ragione_sociale} — ${cli.partita_iva || ''}`.trim();
                    opt.dataset.id = cli.id;
                    instClientOptions.appendChild(opt);
                });
            };
            const findClientOption2 = (label) => {
                if (!instClientOptions) return null;
                const opts = instClientOptions.querySelectorAll('option');
                for (const o of opts) {
                    if (o.value === label) return o;
                }
                return null;
            };
            if (instClientLabel) {
                instClientLabel.addEventListener(
                    'input',
                    debounce(async () => {
                        if (!instClientLabel.value || instClientLabel.value.length < 2) {
                            populateClientOptions2([]);
                            return;
                        }
                        const list = await fetchClients2(instClientLabel.value.trim());
                        populateClientOptions2(list);
                    }, 250),
                );
                instClientLabel.addEventListener('change', () => {
                    const opt = findClientOption2(instClientLabel.value);
                    if (instClientId) instClientId.value = opt ? opt.dataset.id || '' : '';
                    state.filters.instancesClientId = instClientId?.value || '';
                    renderInstanceList();
                });
            }
            const btnClearClient = document.getElementById('btn-clear-client-filter');
            if (btnClearClient) {
                btnClearClient.addEventListener('click', () => {
                    if (instClientLabel) instClientLabel.value = '';
                    if (instClientId) instClientId.value = '';
                    state.filters.instancesClientId = '';
                    renderInstanceList();
                });
            }
            // Audit autenticazione: listener filtri
            if (dom.filterAuthUser)
                dom.filterAuthUser.addEventListener('change', () => renderAuthAudit());
            if (dom.filterAuthAction)
                dom.filterAuthAction.addEventListener('change', () => renderAuthAudit());
            if (dom.filterAuthFrom)
                dom.filterAuthFrom.addEventListener('change', () => renderAuthAudit());
            if (dom.filterAuthTo)
                dom.filterAuthTo.addEventListener('change', () => renderAuthAudit());
            if (dom.btnAuthAuditReset)
                dom.btnAuthAuditReset.addEventListener('click', () => {
                    if (dom.filterAuthUser) dom.filterAuthUser.value = 'all';
                    if (dom.filterAuthAction) dom.filterAuthAction.value = 'all';
                    if (dom.filterAuthFrom) dom.filterAuthFrom.value = '';
                    if (dom.filterAuthTo) dom.filterAuthTo.value = '';
                    if (dom.filterAuthLimit) {
                        const dflt = String(
                            Number(
                                state.config?.auditAuthDefaultLimit || AUDIT_AUTH_DEFAULT_LIMIT,
                            ) || AUDIT_AUTH_DEFAULT_LIMIT,
                        );
                        dom.filterAuthLimit.value = dflt;
                    }
                    // Ricarica lista con il limite predefinito
                    loadAuthAudit();
                });
            if (dom.filterAuthLimit)
                dom.filterAuthLimit.addEventListener('change', () => {
                    loadAuthAudit();
                    updateAuditBadges();
                });
            if (dom.btnAuthAuditRefresh)
                dom.btnAuthAuditRefresh.addEventListener('click', () => {
                    loadAuthAudit();
                    updateAuditBadges();
                });
            if (dom.btnRunDiagnostics)
                dom.btnRunDiagnostics.addEventListener('click', () => runDiagnostics());
            if (dom.btnTestLogout)
                dom.btnTestLogout.addEventListener('click', (e) => {
                    e.preventDefault();
                    performLogout();
                });
            if (dom.btnOpenAuditAuth)
                dom.btnOpenAuditAuth.addEventListener('click', () => {
                    // Apri audit con il limite di default configurato
                    const def =
                        Number(state.config?.auditAuthDefaultLimit || AUDIT_AUTH_DEFAULT_LIMIT) ||
                        AUDIT_AUTH_DEFAULT_LIMIT;
                    openAuditAuthPanel(def);
                });
            if (dom.btnAuthLimit500)
                dom.btnAuthLimit500.addEventListener('click', () => {
                    openAuditAuthPanel(500);
                });
            if (dom.btnOpenAuditRoles)
                dom.btnOpenAuditRoles.addEventListener('click', () => {
                    openAuditRolesPanel();
                });
            if (dom.btnRolesLimit500)
                dom.btnRolesLimit500.addEventListener('click', () => {
                    setRolesAuditLimit(500);
                    openAuditRolesPanel();
                });
        };

        const openGroupModal = async (mode, id = null) => {
            if (!formManageGroup) return;
            formManageGroup.reset();
            formManageGroup.dataset.mode = mode;
            formManageGroup.querySelector('input[name="id"]').value = id ? String(id) : '';
            const title = document.getElementById('modal-manage-group-title');
            if (title) title.textContent = mode === 'edit' ? 'Modifica gruppo' : 'Nuovo gruppo';
            if (btnDeleteGroup) btnDeleteGroup.hidden = mode !== 'edit';
            if (groupMembersSection) groupMembersSection.hidden = true;
            if (groupMembersList) groupMembersList.innerHTML = '';

            if (adminUserOptions)
                populateDatalist(adminUserOptions, state.users || [], buildUserLabel);

            if (mode === 'edit' && id) {
                try {
                    const data = await authFetch(`gruppi/${id}`);
                    if (data) {
                        formManageGroup.elements.nome_gruppo.value =
                            data.nome_gruppo || data.nome || '';
                        formManageGroup.elements.descrizione.value = data.descrizione || '';
                        if (formManageGroup.elements.attivo) {
                            formManageGroup.elements.attivo.checked =
                                String(data.attivo) === '1' ||
                                data.attivo === 1 ||
                                data.attivo === true;
                        }
                        const users = Array.isArray(data.users) ? data.users : [];
                        if (groupMembersSection) groupMembersSection.hidden = false;
                        renderGroupMembers(id, users);
                    }
                } catch (e) {
                    alert(e.message || 'Errore nel caricamento del gruppo.');
                }
            }
            openModal('modal-manage-group');
        };

        const renderGroupMembers = (groupId, users) => {
            if (!groupMembersList) return;
            groupMembersList.innerHTML = '';
            if (!users || users.length === 0) {
                groupMembersList.innerHTML = '<p class="empty-state">Nessun membro nel gruppo.</p>';
                return;
            }
            users.forEach((u) => {
                const item = document.createElement('div');
                item.className = 'task-note';
                const label = sanitize(buildUserLabel(u));
                item.innerHTML = `<header><strong>${label}</strong><button type="button" class="btn btn-danger" data-action="remove-user-from-group" data-group-id="${groupId}" data-user-id="${u.id}">Rimuovi</button></header>`;
                groupMembersList.appendChild(item);
            });
        };

        const openUserModal = async (mode, id = null) => {
            if (!formManageUser) return;
            formManageUser.reset();
            formManageUser.dataset.mode = mode;
            formManageUser.querySelector('input[name="id"]').value = id ? String(id) : '';
            const title = document.getElementById('modal-manage-user-title');
            if (title) title.textContent = mode === 'edit' ? 'Modifica utente' : 'Nuovo utente';
            if (btnDeleteUser) btnDeleteUser.hidden = mode !== 'edit';

            // Gestione required per password su create vs edit
            const pwd = formManageUser.elements.password;
            const pwd2 = formManageUser.elements.password_confirm;
            if (pwd && pwd2) {
                if (mode === 'create') {
                    pwd.required = true;
                    pwd2.required = true;
                } else {
                    pwd.required = false;
                    pwd2.required = false;
                }
            }

            // Multiselezione gruppi: popola opzioni
            if (userGroupsMulti) {
                populateGroupsMulti();
                // reset selections
                [...userGroupsMulti.options].forEach((opt) => (opt.selected = false));
            }
            // Supervisors list
            if (dom.userSupervisorSelect) {
                populateSupervisorSelect();
                dom.userSupervisorSelect.value = '';
            }
            // Sezione legacy add/rimuovi: nascondi per evitare confusione
            if (userGroupsSection) userGroupsSection.hidden = true;

            if (mode === 'edit' && id) {
                try {
                    const data = await authFetch(`utenti/${id}`);
                    if (data) {
                        formManageUser.elements.nome.value = data.nome || '';
                        formManageUser.elements.cognome.value = data.cognome || '';
                        formManageUser.elements.email.value = data.email || '';
                        if (formManageUser.elements.ruolo)
                            formManageUser.elements.ruolo.value = data.ruolo || '';
                        if (formManageUser.elements.stato)
                            formManageUser.elements.stato.value = data.stato || 'ATTIVO';
                    }
                    // Popola gruppi dell'utente
                    if (userGroupsMulti) {
                        // pre-seleziona gruppi correnti
                        const current = await fetchUserGroupIds(id);
                        [...userGroupsMulti.options].forEach((opt) => {
                            opt.selected = current.includes(Number(opt.value));
                        });
                    }
                    if (dom.userSupervisorSelect) {
                        let sups = await authFetch(`utenti/${id}/supervisors`);
                        sups = Array.isArray(sups) ? sups : [];
                        const sup = sups[0]?.id ? String(sups[0].id) : '';
                        dom.userSupervisorSelect.value = sup;
                    }
                } catch (e) {
                    alert(e.message || 'Errore nel caricamento utente.');
                }
            }
            openModal('modal-manage-user');
        };

        const populateSupervisorSelect = () => {
            if (!dom.userSupervisorSelect) return;
            dom.userSupervisorSelect.innerHTML = '<option value="">— Nessuno —</option>';
            const supers = state.users.filter(
                (u) => (u.ruolo || '').toUpperCase() === 'SUPERVISOR',
            );
            supers.forEach((u) => {
                const opt = document.createElement('option');
                opt.value = u.id;
                opt.textContent = buildUserLabel(u);
                dom.userSupervisorSelect.appendChild(opt);
            });
        };

        const populateGroupsMulti = () => {
            if (!userGroupsMulti) return;
            userGroupsMulti.innerHTML = '';
            (state.groups || []).forEach((g) => {
                const opt = document.createElement('option');
                opt.value = g.id;
                opt.textContent = buildGroupLabel(g) || `Gruppo #${g.id}`;
                userGroupsMulti.appendChild(opt);
            });
        };

        const fetchUserGroupIds = async (userId) => {
            try {
                const groups = await authFetch(`utenti/${userId}/groups`);
                const list = Array.isArray(groups)
                    ? groups
                    : normalizeListResponse(groups, ['gruppi', 'groups']);
                return list.map((g) => Number(g.id)).filter((id) => !Number.isNaN(id));
            } catch (e) {
                return [];
            }
        };

        const getSelectedGroupIdsFromMulti = () => {
            if (!userGroupsMulti) return [];
            return [...userGroupsMulti.selectedOptions]
                .map((opt) => Number(opt.value))
                .filter((v) => !Number.isNaN(v));
        };

        const syncUserGroups = async (userId, selectedIds) => {
            const currentIds = await fetchUserGroupIds(userId);
            const selectedSet = new Set(selectedIds);
            const currentSet = new Set(currentIds);
            const toAdd = [...selectedSet].filter((id) => !currentSet.has(id));
            const toRemove = [...currentSet].filter((id) => !selectedSet.has(id));
            for (const gid of toAdd) {
                await authFetch(`gruppi/${gid}/add/${userId}`, { method: 'POST' });
            }
            for (const gid of toRemove) {
                await authFetch(`gruppi/${gid}/remove/${userId}`, { method: 'DELETE' });
            }
        };

        const refreshUserGroups = async (userId) => {
            if (!userGroupsList) return;
            userGroupsList.innerHTML = '<p>Caricamento gruppi...</p>';
            try {
                const groups = await authFetch(`utenti/${userId}/groups`);
                const list = Array.isArray(groups)
                    ? groups
                    : normalizeListResponse(groups, ['gruppi', 'groups']);
                renderUserGroups(userId, list);
            } catch (e) {
                userGroupsList.innerHTML =
                    '<p class="empty-state">Errore nel caricamento dei gruppi.</p>';
            }
        };

        const renderUserGroups = (userId, groups) => {
            if (!userGroupsList) return;
            userGroupsList.innerHTML = '';
            const list = Array.isArray(groups) ? groups : [];
            if (!list.length) {
                userGroupsList.innerHTML = '<p class="empty-state">Nessun gruppo assegnato.</p>';
                return;
            }
            list.forEach((g) => {
                const item = document.createElement('div');
                item.className = 'task-note';
                const label = sanitize(buildGroupLabel(g));
                item.innerHTML = `<header><strong>${label}</strong><button type="button" class="btn btn-danger" data-action="remove-group-from-user" data-user-id="${userId}" data-group-id="${g.id}">Rimuovi</button></header>`;
                userGroupsList.appendChild(item);
            });
        };

        const initializeSearch = () => {
            if (!dom.taskSearch) return;
            let debounceTimer = null;
            dom.taskSearch.addEventListener('input', () => {
                state.search = dom.taskSearch.value.trim();
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(loadTasks, 300);
            });
        };

        const initializeUserSelector = () => {
            if (!dom.userSelector) return;
            dom.userSelector.addEventListener('change', () => {
                if (dom.userSelector.disabled) return;
                state.currentUser = dom.userSelector.value || 'all';
                loadTasks();
            });
            if (!state.isAdmin) {
                dom.userSelector.disabled = true;
            }
        };

        const performLogout = async () => {
            try {
                await authFetch('auth/logout', { method: 'POST' });
            } catch (e) {
                /* ignore */
            }
            try {
                window.lpwfAuth?.clearToken?.();
                window.lpwfAuth?.clearCurrentUser?.();
            } catch (e) {
                /* ignore */
            }
            window.location.href = 'login.html';
        };

        // Delegated global handler di massima priorità per assicurare il logout
        document.addEventListener(
            'click',
            (ev) => {
                const target = ev.target;
                if (!target) return;
                const btn = target.closest?.('[data-action="logout"]');
                if (btn) {
                    ev.preventDefault();
                    performLogout();
                }
            },
            true,
        );

        // Delegated handler globale per bottone "Nuovo utente" anche fuori da dom.main
        document.addEventListener('click', (ev) => {
            const target = ev.target;
            if (!target) return;
            const btn = target.closest?.('[data-action="open-create-user"]');
            if (!btn) return;
            ev.preventDefault();
            if (!state.permissions.manageUsers) {
                alert('Permesso negato.');
                return;
            }
            openUserModal('create');
        });

        // Delegated handler globale per aprire dettaglio istanza (es. link da modale task)
        document.addEventListener('click', (ev) => {
            const target = ev.target;
            if (!target) return;
            const btn = target.closest?.('[data-action="open-instance"]');
            if (!btn) return;
            ev.preventDefault();
            const instId = Number(btn.dataset.instId);
            if (Number.isNaN(instId)) return;
            instanceState.selectedId = instId;
            renderInstanceList();
            loadInstanceDetail(instId);
            // evidenzia la card nell'elenco e porta in vista il dettaglio
            try {
                const el = document.querySelector(`.instance-card[data-id="${instId}"]`);
                if (el) {
                    el.classList.add('is-highlight');
                    setTimeout(() => el.classList.remove('is-highlight'), 1800);
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            } catch (e) {
                /* ignore */
            }
            document
                .getElementById('instance-detail')
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

        // Apri dettagli cliente (sotto il dettaglio istanza)
        document.addEventListener('click', async (ev) => {
            const target = ev.target;
            if (!target) return;
            const link = target.closest?.('[data-action="open-client"]');
            if (!link) return;
            ev.preventDefault();
            const cid = Number(link.dataset.clientId);
            if (Number.isNaN(cid)) return;
            try {
                const cli = await authFetch(`clienti/${cid}`);
                const boxId = 'instance-client-details';
                const container =
                    instanceDetailEls.container || document.getElementById('instance-detail');
                if (!container) return;
                let box = document.getElementById(boxId);
                const html = `
                    <h5>Dettagli cliente</h5>
                    <div class="form-grid">
                        <div><strong>Ragione sociale</strong><div>${sanitize(cli.ragione_sociale || '—')}</div></div>
                        <div><strong>P.IVA</strong><div>${sanitize(cli.partita_iva || '—')}</div></div>
                        <div><strong>Email</strong><div>${sanitize(cli.email || '—')}</div></div>
                        <div><strong>Tipo</strong><div>${sanitize(cli.tipo_cliente || '—')}</div></div>
                    </div>
                `;
                if (!box) {
                    box = document.createElement('section');
                    box.id = boxId;
                    box.className = 'task-modal__section';
                    container.appendChild(box);
                }
                box.innerHTML = html;
                box.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } catch (e) {
                try {
                    showToast('Impossibile caricare dettagli cliente', { type: 'error' });
                } catch (err) {}
            }
        });

        const initializeActionGuards = () => {
            if (!dom.main) return;
            dom.main.addEventListener('click', (event) => {
                const target = event.target;
                if (!target) return;

                if (target.closest('[data-action="open-create-workflow"]')) {
                    event.preventDefault();
                    if (!state.permissions.manageWorkflows) {
                        alert('Permesso negato.');
                        return;
                    }
                    openModal('modal-create-workflow');
                }

                if (target.closest('[data-action="open-create-step"]')) {
                    event.preventDefault();
                    if (!state.permissions.manageWorkflows) {
                        alert('Permesso negato.');
                        return;
                    }
                    if (!workflowState.selectedId) {
                        alert('Seleziona un workflow prima di aggiungere un passo.');
                        return;
                    }
                    resetStepForm();
                    openModal('modal-create-step');
                }

                if (target.closest('[data-action="open-edit-workflow"]')) {
                    event.preventDefault();
                    if (!state.permissions.manageWorkflows) {
                        alert('Permesso negato.');
                        return;
                    }
                    openEditWorkflow();
                }

                if (target.closest('[data-action="toggle-workflow-active"]')) {
                    event.preventDefault();
                    if (!state.permissions.manageWorkflows) {
                        alert('Permesso negato.');
                        return;
                    }
                    const id = workflowState.selectedId;
                    if (!id) {
                        alert('Seleziona un workflow.');
                        return;
                    }
                    const wf = workflowState.detailCache[id];
                    const next = wf && wf.attivo ? 0 : 1;
                    const label = next ? 'attivare' : 'disattivare';
                    if (!confirm(`Confermi di ${label} il workflow?`)) return;
                    (async () => {
                        try {
                            await authFetch(`workflows/${id}`, {
                                method: 'PUT',
                                json: true,
                                body: { attivo: next },
                            });
                            workflowState.detailCache = {};
                            await loadWorkflows();
                            await loadWorkflowDetail(id);
                            try {
                                showToast(next ? 'Workflow attivato' : 'Workflow disattivato', {
                                    type: 'success',
                                });
                            } catch (e) {}
                        } catch (e) {
                            alert(e.message || 'Errore aggiornamento stato workflow.');
                        }
                    })();
                }

                if (target.closest('[data-action="open-start-instance"]')) {
                    event.preventDefault();
                    if (!workflowState.selectedId) {
                        alert('Seleziona un workflow da avviare.');
                        return;
                    }
                    if (formStartInstance) {
                        formStartInstance.reset();
                        // reset campi cliente
                        const ci = document.getElementById('start-customer-id');
                        const cl = document.getElementById('start-customer-label');
                        if (ci) ci.value = '';
                        if (cl) cl.value = '';
                    }
                    openModal('modal-start-instance');
                }

                if (target.closest('[data-action="edit-step"]')) {
                    event.preventDefault();
                    const button = target.closest('[data-action="edit-step"]');
                    const stepId = Number(button.dataset.stepId);
                    if (!Number.isNaN(stepId)) {
                        openStepEdit(stepId);
                    }
                }

                if (target.closest('[data-action="task-take"]')) {
                    event.preventDefault();
                    const button = target.closest('[data-action="task-take"]');
                    const taskId = button?.dataset.taskId;
                    if (taskId) {
                        handleTaskTake(taskId);
                    }
                }

                if (target.closest('[data-action="task-open"]')) {
                    event.preventDefault();
                    const button = target.closest('[data-action="task-open"]');
                    const taskId = button?.dataset.taskId;
                    if (taskId) {
                        loadTaskDetail(taskId);
                    }
                }

                if (target.closest('[data-action="task-complete"]')) {
                    event.preventDefault();
                    const button = target.closest('[data-action="task-complete"]');
                    const taskId = button?.dataset.taskId;
                    if (taskId) {
                        handleTaskComplete(taskId);
                    }
                }

                if (target.closest('[data-action="open-instance"]')) {
                    event.preventDefault();
                    const button = target.closest('[data-action="open-instance"]');
                    const instId = Number(button?.dataset.instId);
                    if (!Number.isNaN(instId)) {
                        instanceState.selectedId = instId;
                        renderInstanceList();
                        loadInstanceDetail(instId);
                        document
                            .getElementById('instance-detail')
                            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }

                // Groups/Users management
                if (target.closest('[data-action="open-create-group"]')) {
                    event.preventDefault();
                    if (!state.permissions.manageGroups) {
                        alert('Permesso negato.');
                        return;
                    }
                    openGroupModal('create');
                }
                if (target.closest('[data-action="edit-group"]')) {
                    event.preventDefault();
                    if (!state.permissions.manageGroups) {
                        alert('Permesso negato.');
                        return;
                    }
                    const id = Number(target.closest('[data-action="edit-group"]').dataset.id);
                    if (!Number.isNaN(id)) openGroupModal('edit', id);
                }
                if (target.closest('[data-action="delete-group"]')) {
                    event.preventDefault();
                    if (!state.permissions.manageGroups) {
                        alert('Permesso negato.');
                        return;
                    }
                    const id = Number(target.closest('[data-action="delete-group"]').dataset.id);
                    if (!Number.isNaN(id)) handleDeleteGroup(id);
                }
                if (target.closest('[data-action="restore-group"]')) {
                    event.preventDefault();
                    const id = Number(target.closest('[data-action="restore-group"]').dataset.id);
                    if (!Number.isNaN(id)) handleRestoreGroup(id);
                }

                if (target.closest('[data-action="open-create-user"]')) {
                    event.preventDefault();
                    if (!state.permissions.manageUsers) {
                        alert('Permesso negato.');
                        return;
                    }
                    openUserModal('create');
                }
                if (target.closest('[data-action="delete-step"]')) {
                    event.preventDefault();
                    if (!state.permissions.manageWorkflows) {
                        alert('Permesso negato.');
                        return;
                    }
                    const btn = target.closest('[data-action="delete-step"]');
                    const stepId = Number(btn?.dataset.stepId);
                    if (Number.isNaN(stepId)) return;
                    if (!confirm('Confermi la cancellazione del passo?')) return;
                    (async () => {
                        try {
                            await authFetch(`workflowsteps/${stepId}`, { method: 'DELETE' });
                            if (workflowState.selectedId)
                                await loadWorkflowDetail(workflowState.selectedId);
                            try {
                                showToast('Passo eliminato', { type: 'success' });
                            } catch (e) {}
                        } catch (e) {
                            alert(e.message || "Errore durante l'eliminazione del passo.");
                        }
                    })();
                }
                if (target.closest('[data-action="toggle-step"]')) {
                    event.preventDefault();
                    if (!state.permissions.manageWorkflows) {
                        alert('Permesso negato.');
                        return;
                    }
                    const btn = target.closest('[data-action="toggle-step"]');
                    const stepId = Number(btn?.dataset.stepId);
                    const next = Number(btn?.dataset.next) === 1 ? 1 : 0;
                    if (Number.isNaN(stepId)) return;
                    (async () => {
                        try {
                            await authFetch(`workflowsteps/${stepId}`, {
                                method: 'PUT',
                                json: true,
                                body: { attivo: next },
                            });
                            if (workflowState.selectedId)
                                await loadWorkflowDetail(workflowState.selectedId);
                            try {
                                showToast(next ? 'Passo attivato' : 'Passo disattivato', {
                                    type: 'success',
                                });
                            } catch (e) {}
                        } catch (e) {
                            alert(e.message || "Errore durante l'aggiornamento stato del passo.");
                        }
                    })();
                }
                if (target.closest('[data-action="open-set-supervisor"]')) {
                    event.preventDefault();
                    const btn = target.closest('[data-action="open-set-supervisor"]');
                    const userId = Number(btn?.dataset.id);
                    if (Number.isNaN(userId)) return;
                    openSetSupervisor(userId);
                }
                if (target.closest('[data-action="logout"]')) {
                    event.preventDefault();
                    performLogout();
                }
                if (target.closest('[data-action="toggle-group-users"]')) {
                    event.preventDefault();
                    const btn = target.closest('[data-action="toggle-group-users"]');
                    const id = Number(btn.dataset.id);
                    if (Number.isNaN(id)) return;
                    const container = document.getElementById(`group-users-${id}`);
                    const holder = btn.closest('.list-item');
                    if (!container) return;
                    const isHidden = container.hidden;
                    container.hidden = !isHidden;
                    if (holder) {
                        holder.classList.toggle('active', !isHidden);
                    }
                    if (isHidden) {
                        container.innerHTML =
                            '<small class="form-hint">Caricamento utenti…</small>';
                        loadGroupUsersInline(id, container);
                    }
                }
                if (target.closest('[data-action="restore-steps-order"]')) {
                    event.preventDefault();
                    if (!state.permissions.manageWorkflows) {
                        alert('Permesso negato.');
                        return;
                    }
                    if (
                        confirm(
                            "Sei sicuro di voler annullare le modifiche all'ordine dei passi e ripristinare la base?",
                        )
                    ) {
                        restoreStepsOrder();
                    }
                }
                if (target.closest('[data-action="snapshot-steps-order"]')) {
                    event.preventDefault();
                    if (!state.permissions.manageWorkflows) {
                        alert('Permesso negato.');
                        return;
                    }
                    snapshotCurrentStepsOrder();
                }
                if (target.closest('[data-action="snapshot-steps-order-reset"]')) {
                    event.preventDefault();
                    if (!state.permissions.manageWorkflows) {
                        alert('Permesso negato.');
                        return;
                    }
                    if (confirm("Impostare l'ordine attuale come base e azzerare la history?")) {
                        snapshotCurrentStepsOrderAndResetHistory();
                    }
                }
                // Badge stato ordine: clic come annulla quando "dirty"
                const statusBadge = target.closest && target.closest('#steps-order-status');
                if (statusBadge) {
                    const isDirty = statusBadge.dataset.dirty === '1';
                    if (isDirty) {
                        event.preventDefault();
                        if (!state.permissions.manageWorkflows) {
                            alert('Permesso negato.');
                            return;
                        }
                        if (
                            confirm(
                                "Sei sicuro di voler annullare le modifiche all'ordine dei passi e ripristinare la base?",
                            )
                        ) {
                            restoreStepsOrder();
                        }
                    }
                }
                if (target.closest('[data-action="promote-step"]')) {
                    event.preventDefault();
                    if (!state.permissions.manageWorkflows) {
                        alert('Permesso negato.');
                        return;
                    }
                    const btn = target.closest('[data-action="promote-step"]');
                    const stepId = Number(btn?.dataset.stepId);
                    if (!workflowState.selectedId || Number.isNaN(stepId)) return;
                    // Se l'ordine è già modificato (dirty), chiedi conferma prima di proseguire
                    const badge = document.getElementById('steps-order-status');
                    if (badge && badge.dataset.dirty === '1') {
                        const ok = confirm(
                            "Ci sono modifiche all'ordine non ripristinate. Procedere con la promozione del passo?",
                        );
                        if (!ok) return;
                    }
                    moveStepAcrossOrders(stepId, -1);
                }
                if (target.closest('[data-action="demote-step"]')) {
                    event.preventDefault();
                    if (!state.permissions.manageWorkflows) {
                        alert('Permesso negato.');
                        return;
                    }
                    const btn = target.closest('[data-action="demote-step"]');
                    const stepId = Number(btn?.dataset.stepId);
                    if (!workflowState.selectedId || Number.isNaN(stepId)) return;
                    // Se l'ordine è già modificato (dirty), chiedi conferma prima di proseguire
                    const badge2 = document.getElementById('steps-order-status');
                    if (badge2 && badge2.dataset.dirty === '1') {
                        const ok = confirm(
                            "Ci sono modifiche all'ordine non ripristinate. Procedere con la demozione del passo?",
                        );
                        if (!ok) return;
                    }
                    moveStepAcrossOrders(stepId, +1);
                }
                if (target.closest('[data-action="edit-user"]')) {
                    event.preventDefault();
                    if (!state.permissions.manageUsers) {
                        alert('Permesso negato.');
                        return;
                    }
                    const id = Number(target.closest('[data-action="edit-user"]').dataset.id);
                    if (!Number.isNaN(id)) openUserModal('edit', id);
                }
                if (target.closest('[data-action="delete-user"]')) {
                    event.preventDefault();
                    if (!state.permissions.manageUsers) {
                        alert('Permesso negato.');
                        return;
                    }
                    const id = Number(target.closest('[data-action="delete-user"]').dataset.id);
                    if (!Number.isNaN(id)) handleDeleteUser(id);
                }
                if (target.closest('[data-action="restore-user"]')) {
                    event.preventDefault();
                    const id = Number(target.closest('[data-action="restore-user"]').dataset.id);
                    if (!Number.isNaN(id)) handleRestoreUser(id);
                }
            });

            if (dom.workflowsList) {
                dom.workflowsList.addEventListener('click', (event) => {
                    const card = event.target.closest('[data-action="select-workflow"]');
                    if (card) {
                        const id = Number(card.dataset.id);
                        if (!Number.isNaN(id)) {
                            loadWorkflowDetail(id);
                        }
                    }
                });
            }

            // Clienti: delega click per selezione cliente
            if (dom.clientsList) {
                dom.clientsList.addEventListener('click', (event) => {
                    const card = event.target.closest('.instance-card');
                    if (!card) return;
                    const id = Number(card.dataset.id);
                    if (Number.isNaN(id)) return;
                    state.selectedClientId = id;
                    renderClientsList();
                    loadClientById(id);
                });
            }

            // Catalogo: delega click per selezione prodotto/servizio
            if (dom.productsList) {
                dom.productsList.addEventListener('click', (event) => {
                    const card = event.target.closest('.instance-card');
                    if (!card) return;
                    const id = Number(card.dataset.id);
                    if (Number.isNaN(id)) return;
                    state.selectedProductId = id;
                    renderProductsList();
                    loadProductById(id);
                });
            }

            // Product edit: open new/edit modal
            if (dom.btnProductNew) {
                dom.btnProductNew.addEventListener('click', () => {
                    const f = dom.formEditProduct;
                    if (!f) return;
                    f.reset();
                    dom.editProductFields.id.value = '';
                    document.getElementById('modal-edit-product-title').textContent =
                        'Nuovo articolo';
                    if (dom.editProductFields.sku) dom.editProductFields.sku.value = '';
                    if (dom.editProductFields.codiceTenant)
                        dom.editProductFields.codiceTenant.value = '';
                    if (dom.editProductFields.marca) dom.editProductFields.marca.value = '';
                    if (dom.editProductFields.modello) dom.editProductFields.modello.value = '';
                    if (dom.editProductFields.versione) dom.editProductFields.versione.value = '';
                    // Pulisci suggerimenti
                    if (dom.suggestProductQuery) dom.suggestProductQuery.value = '';
                    if (dom.suggestProductList)
                        dom.suggestProductList.innerHTML =
                            '<p class="form-hint">Digita per cercare prodotti esistenti…</p>';
                    openModal('modal-edit-product');
                });
            }
            if (dom.btnProductEdit) {
                dom.btnProductEdit.addEventListener('click', () => {
                    if (!state.selectedProductId) {
                        alert('Seleziona un articolo.');
                        return;
                    }
                    const f = dom.formEditProduct;
                    if (!f) return;
                    f.reset();
                    dom.editProductFields.id.value = String(state.selectedProductId);
                    // Pre-popola dai dettagli se disponibili
                    const d = state.selectedProductDetail || {};
                    dom.editProductFields.sku.value = d.sku || '';
                    dom.editProductFields.tipologia.value = String(
                        d.tipologia || 'FISICO',
                    ).toUpperCase();
                    if (dom.editProductFields.codiceTenant)
                        dom.editProductFields.codiceTenant.value = d.codice_tenant || '';
                    if (dom.editProductFields.marca)
                        dom.editProductFields.marca.value = d.marca || '';
                    if (dom.editProductFields.modello)
                        dom.editProductFields.modello.value = d.modello || '';
                    if (dom.editProductFields.versione)
                        dom.editProductFields.versione.value = d.versione || '';
                    dom.editProductFields.titolo.value = d.titolo || '';
                    dom.editProductFields.sottotitolo.value = d.sottotitolo || '';
                    dom.editProductFields.descrizione.value = d.descrizione || '';
                    dom.editProductFields.stato.value = String(
                        d.stato_pubblicazione || 'BOZZA',
                    ).toUpperCase();
                    dom.editProductFields.visibilita.value = String(
                        d.visibilita || 'PRIVATO',
                    ).toUpperCase();
                    document.getElementById('modal-edit-product-title').textContent =
                        'Modifica articolo';
                    openModal('modal-edit-product');
                });
            }

            if (dom.formEditProduct) {
                dom.formEditProduct.addEventListener('submit', async (ev) => {
                    ev.preventDefault();
                    const id = dom.editProductFields.id.value.trim();
                    const payload = {
                        tipologia: dom.editProductFields.tipologia.value,
                        titolo: dom.editProductFields.titolo.value.trim(),
                        sottotitolo: dom.editProductFields.sottotitolo.value.trim(),
                        descrizione: dom.editProductFields.descrizione.value.trim(),
                        stato_pubblicazione: dom.editProductFields.stato.value,
                        visibilita: dom.editProductFields.visibilita.value,
                    };
                    const codiceTenantVal = dom.editProductFields.codiceTenant?.value.trim();
                    if (codiceTenantVal) payload.codice_tenant = codiceTenantVal;
                    const marcaVal = dom.editProductFields.marca?.value.trim();
                    if (marcaVal) payload.marca = marcaVal;
                    const modelloVal = dom.editProductFields.modello?.value.trim();
                    if (modelloVal) payload.modello = modelloVal;
                    const versioneVal = dom.editProductFields.versione?.value.trim();
                    if (versioneVal) payload.versione = versioneVal;
                    if (!payload.titolo) {
                        alert('Compila il Titolo.');
                        return;
                    }
                    try {
                        if (id) {
                            await authFetch(`catalogo_articoli/${encodeURIComponent(id)}`, {
                                method: 'PUT',
                                json: true,
                                body: payload,
                            });
                            closeAllModals();
                            await loadProducts();
                        } else {
                            const res = await authFetch('catalogo_articoli', {
                                method: 'POST',
                                json: true,
                                body: payload,
                            });
                            const newId = Number(res?.id || 0);
                            closeAllModals();
                            // Se presenti categorie suggerite, applicale al nuovo articolo
                            if (
                                newId &&
                                Array.isArray(state.pendingCategoriesForNew) &&
                                state.pendingCategoriesForNew.length
                            ) {
                                try {
                                    await authFetch(`catalogo_articoli_categorie/${newId}`, {
                                        method: 'PUT',
                                        json: true,
                                        body: { categorie_slugs: state.pendingCategoriesForNew },
                                    });
                                } catch (e) {
                                    /* ignore */
                                }
                            }
                            // Se presenti media suggeriti, apri wizard di import
                            if (
                                newId &&
                                Array.isArray(state.pendingMediaForNew) &&
                                state.pendingMediaForNew.length
                            ) {
                                openImportMediaWizard(newId);
                            }
                            // Seleziona il nuovo articolo e scorre alla sezione categorie
                            await loadProducts();
                            if (newId) {
                                state.selectedProductId = newId;
                                renderProductsList();
                                await loadProductById(newId);
                                try {
                                    document
                                        .getElementById('edit-product-categories')
                                        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                } catch (e) {}
                            }
                            state.pendingCategoriesForNew = null;
                            state.pendingMediaForNew = null;
                        }
                    } catch (e) {
                        alert(e.message || 'Errore salvataggio articolo.');
                    }
                });
            }

            // Suggerimenti prodotto nel modale (ricerca live su hub)
            function openImportMediaWizard(articleId) {
                const items = Array.isArray(state.pendingMediaForNew)
                    ? state.pendingMediaForNew
                    : [];
                const list = dom.importMediaList;
                if (!list || !items.length) return;
                list.innerHTML = items
                    .map(
                        (m, idx) => `
              <div class="list-item">
                <div style="display:flex; align-items:center; gap:10px;">
                  <input type="checkbox" class="import-media-check" data-index="${idx}" checked>
                  <img src="${sanitize(m.url)}" alt="" style="width:80px; height:80px; object-fit:cover; border-radius:6px;">
                  <div>
                    <div><small>${sanitize(m.tipologia || 'IMMAGINE')}</small></div>
                    <small>${sanitize(m.alt || '')}</small>
                  </div>
                </div>
              </div>`,
                    )
                    .join('');
                if (dom.importMediaSelectAll) {
                    dom.importMediaSelectAll.checked = true;
                    dom.importMediaSelectAll.onchange = () => {
                        document
                            .querySelectorAll('#import-media-list .import-media-check')
                            .forEach((cb) => {
                                cb.checked = dom.importMediaSelectAll.checked;
                            });
                    };
                }
                if (dom.btnImportMediaConfirm) {
                    dom.btnImportMediaConfirm.onclick = async () => {
                        const selected = [
                            ...document.querySelectorAll('#import-media-list .import-media-check'),
                        ]
                            .filter((cb) => cb.checked)
                            .map((cb) => parseInt(cb.getAttribute('data-index'), 10))
                            .filter((n) => !Number.isNaN(n));
                        for (const i of selected) {
                            const m = items[i];
                            if (!m) continue;
                            try {
                                await authFetch('catalog_media/attach', {
                                    method: 'POST',
                                    json: true,
                                    body: {
                                        articolo_id: articleId,
                                        url: m.url,
                                        tipologia: m.tipologia || 'IMMAGINE',
                                        testo_alternativo: m.alt || '',
                                    },
                                });
                            } catch (e) {
                                /* no-op */
                            }
                        }
                        closeAllModals();
                        await loadProductById(articleId);
                        state.pendingMediaForNew = null;
                    };
                }
                if (dom.btnImportMediaCancel) {
                    dom.btnImportMediaCancel.onclick = () => {
                        state.pendingMediaForNew = null;
                        closeAllModals();
                    };
                }
                openModal('modal-import-media');
            }

            let suggestTimer = null;
            async function renderProductSuggestions(q) {
                const box = dom.suggestProductList;
                if (!box) return;
                if (!q || q.trim().length < 2) {
                    box.innerHTML = '<p class="form-hint">Digita almeno 2 caratteri…</p>';
                    return;
                }
                box.innerHTML = '<p>Ricerca…</p>';
                try {
                    const list = await hubFetch(`articoli?limite=8&q=${encodeURIComponent(q)}`);
                    const arr = Array.isArray(list) ? list : [];
                    if (!arr.length) {
                        box.innerHTML = '<p class="form-hint">Nessun risultato.</p>';
                        return;
                    }
                    box.innerHTML = arr
                        .map(
                            (a) => `
                  <div class="list-item">
                    <div class="item-header"><strong>${sanitize([a.marca, a.modello, a.titolo].filter(Boolean).join(' • ') || 'Articolo #' + a.id)}</strong></div>
                    <small>${sanitize(String(a.tipologia || '').toUpperCase())} • SKU ${sanitize(a.sku || '')}</small>
                    <div class="item-actions">
                      <button type="button" class="btn" data-action="suggest-open" data-id="${a.id}">Apri</button>
                      <button type="button" class="btn btn-primary" data-action="suggest-use" data-id="${a.id}">Usa come base</button>
                    </div>
                  </div>`,
                        )
                        .join('');
                } catch (e) {
                    box.innerHTML = `<p>${sanitize(e.message || 'Errore ricerca')}</p>`;
                }
            }
            function refreshSuggestFromFields() {
                const txt = [
                    dom.editProductFields.marca?.value || '',
                    dom.editProductFields.modello?.value || '',
                    dom.editProductFields.titolo?.value || '',
                ]
                    .map((s) => String(s || '').trim())
                    .filter(Boolean)
                    .join(' ');
                const q = dom.suggestProductQuery?.value?.trim() || txt;
                if (!q) {
                    if (dom.suggestProductList)
                        dom.suggestProductList.innerHTML =
                            '<p class="form-hint">Digita per cercare prodotti esistenti…</p>';
                    return;
                }
                renderProductSuggestions(q);
            }
            if (dom.suggestProductQuery) {
                dom.suggestProductQuery.addEventListener('input', () => {
                    if (suggestTimer) clearTimeout(suggestTimer);
                    suggestTimer = setTimeout(refreshSuggestFromFields, 300);
                });
            }
            // aggiorna suggerimenti quando si compila marca/modello/titolo
            ['marca', 'modello', 'titolo'].forEach((key) => {
                const el = dom.editProductFields[key];
                if (el) {
                    el.addEventListener('input', () => {
                        if (suggestTimer) clearTimeout(suggestTimer);
                        suggestTimer = setTimeout(refreshSuggestFromFields, 400);
                    });
                }
            });
            if (dom.suggestProductList) {
                dom.suggestProductList.addEventListener('click', async (ev) => {
                    const openBtn = ev.target.closest('[data-action="suggest-open"]');
                    const useBtn = ev.target.closest('[data-action="suggest-use"]');
                    if (openBtn) {
                        const id = Number(openBtn.dataset.id);
                        if (id) {
                            closeAllModals();
                            state.selectedProductId = id;
                            renderProductsList();
                            await loadProductById(id);
                        }
                        return;
                    }
                    if (useBtn) {
                        const id = Number(useBtn.dataset.id);
                        if (!id) return;
                        try {
                            const det = await hubFetch(`articoli/${id}`);
                            if (dom.editProductFields.marca)
                                dom.editProductFields.marca.value = det.marca || '';
                            if (dom.editProductFields.modello)
                                dom.editProductFields.modello.value = det.modello || '';
                            if (dom.editProductFields.versione)
                                dom.editProductFields.versione.value = det.versione || '';
                            if (dom.editProductFields.titolo)
                                dom.editProductFields.titolo.value = det.titolo || '';
                            if (dom.editProductFields.sottotitolo)
                                dom.editProductFields.sottotitolo.value = det.sottotitolo || '';
                            if (dom.editProductFields.descrizione)
                                dom.editProductFields.descrizione.value = det.descrizione || '';
                            // Prepara categorie suggerite per la nuova creazione
                            const slugs = Array.isArray(det.categorie)
                                ? det.categorie.map((c) => c.slug).filter(Boolean)
                                : [];
                            state.pendingCategoriesForNew = slugs.length ? slugs : null;
                            const note = document.getElementById('suggest-product-categories-note');
                            if (note)
                                note.textContent = slugs.length
                                    ? `Categorie suggerite: ${slugs.join(', ')}`
                                    : '';
                            // Prepara media suggeriti
                            const meds = Array.isArray(det.media)
                                ? det.media
                                      .filter((m) => m.url)
                                      .map((m) => ({
                                          url: m.url,
                                          alt: m.testo_alternativo || '',
                                          tipologia: m.tipologia || 'IMMAGINE',
                                      }))
                                : [];
                            state.pendingMediaForNew = meds.length ? meds : null;
                            if (note && meds && meds.length)
                                note.textContent +=
                                    (note.textContent ? ' • ' : '') +
                                    `Media suggeriti: ${meds.length}`;
                            // Aggiorna suggerimenti per coerenza
                            refreshSuggestFromFields();
                        } catch (e) {
                            alert(e.message || 'Errore lettura prodotto');
                        }
                        return;
                    }
                });
            }

            // Varianti actions
            const variantsContainer = document.getElementById('product-variants-list');
            if (variantsContainer) {
                variantsContainer.addEventListener('click', async (ev) => {
                    const setBtn = ev.target.closest('[data-action="variant-set-price"]');
                    const delBtn = ev.target.closest('[data-action="variant-delete"]');
                    if (setBtn) {
                        const id = Number(setBtn.dataset.id);
                        const listCode = (
                            document.getElementById('price-list-code')?.value || 'DEFAULT'
                        ).trim();
                        const listCurr = (
                            document.getElementById('price-list-currency')?.value || 'EUR'
                        ).trim();
                        const val = prompt(`Nuovo prezzo (listino ${listCode}):`);
                        if (!val) return;
                        const price = Number(val);
                        if (Number.isNaN(price) || price < 0) {
                            alert('Prezzo non valido');
                            return;
                        }
                        try {
                            await authFetch('catalogo_prezzi', {
                                method: 'PUT',
                                json: true,
                                body: {
                                    variante_id: id,
                                    prezzo: price,
                                    listino_codice: listCode,
                                    valuta: listCurr,
                                },
                            });
                            await loadProductById(state.selectedProductId);
                        } catch (e) {
                            alert(e.message || 'Errore salvataggio prezzo');
                        }
                    }
                    if (delBtn) {
                        const id = Number(delBtn.dataset.id);
                        if (!confirm('Eliminare la variante?')) return;
                        try {
                            await authFetch(`catalogo_varianti/${id}`, { method: 'DELETE' });
                            await loadProductById(state.selectedProductId);
                        } catch (e) {
                            alert(e.message || 'Errore eliminazione variante');
                        }
                    }
                });
            }
            const addVarBtn = document.getElementById('btn-add-variant');
            if (addVarBtn) {
                addVarBtn.addEventListener('click', async () => {
                    if (!state.selectedProductId) {
                        alert('Seleziona un articolo');
                        return;
                    }
                    const sku = (document.getElementById('new-variant-sku')?.value || '').trim();
                    const nome = (document.getElementById('new-variant-nome')?.value || '').trim();
                    const priceStr = (
                        document.getElementById('new-variant-price')?.value || ''
                    ).trim();
                    const listCode = (
                        document.getElementById('price-list-code')?.value || 'DEFAULT'
                    ).trim();
                    const listCurr = (
                        document.getElementById('price-list-currency')?.value || 'EUR'
                    ).trim();
                    if (!sku || !nome) {
                        alert('Compila SKU e Nome');
                        return;
                    }
                    try {
                        const res = await authFetch('catalogo_varianti', {
                            method: 'POST',
                            json: true,
                            body: { articolo_id: state.selectedProductId, sku, nome },
                        });
                        const vid = res?.id ? Number(res.id) : null;
                        if (vid && priceStr) {
                            const price = Number(priceStr);
                            if (!Number.isNaN(price)) {
                                await authFetch('catalogo_prezzi', {
                                    method: 'PUT',
                                    json: true,
                                    body: {
                                        variante_id: vid,
                                        prezzo: price,
                                        listino_codice: listCode,
                                        valuta: listCurr,
                                    },
                                });
                            }
                        }
                        document.getElementById('new-variant-sku').value = '';
                        document.getElementById('new-variant-nome').value = '';
                        document.getElementById('new-variant-price').value = '';
                        await loadProductById(state.selectedProductId);
                    } catch (e) {
                        alert(e.message || 'Errore creazione variante');
                    }
                });
            }

            // Pricelists: open/manage
            if (dom.btnManagePricelists) {
                dom.btnManagePricelists.addEventListener('click', async () => {
                    if (!state.selectedProductDetail || !state.selectedProductDetail.tenant_id) {
                        alert('Seleziona un articolo.');
                        return;
                    }
                    await renderPricelists(state.selectedProductDetail.tenant_id);
                    openModal('modal-manage-pricelists');
                });
            }

            async function renderPricelists(tenantId) {
                if (!dom.pricelistsList) return;
                dom.pricelistsList.innerHTML = '<p>Caricamento listini...</p>';
                try {
                    const lists = await authFetch(
                        `catalogo_listini?tenant_id=${encodeURIComponent(tenantId)}`,
                    );
                    const arr = Array.isArray(lists) ? lists : [];
                    if (!arr.length) {
                        dom.pricelistsList.innerHTML = '<p class="form-hint">Nessun listino.</p>';
                        return;
                    }
                    dom.pricelistsList.innerHTML = arr
                        .map(
                            (
                                l,
                            ) => `<div class="list-item" data-id="${l.id}"><strong>${sanitize(l.codice)}</strong> <small class="badge">${sanitize(l.valuta || 'EUR')}</small> <small class="badge">priorità ${sanitize(l.priorita || 0)}</small>
                    <div class="item-actions"><button type="button" class="btn" data-action="plist-edit" data-id="${l.id}">Modifica</button> <button type="button" class="btn btn-danger" data-action="plist-delete" data-id="${l.id}">Elimina</button></div></div>`,
                        )
                        .join('');
                } catch (e) {
                    dom.pricelistsList.innerHTML = `<p>${sanitize(e.message || 'Errore caricamento listini')}</p>`;
                }
            }

            if (dom.pricelistsList) {
                dom.pricelistsList.addEventListener('click', async (ev) => {
                    const editBtn = ev.target.closest('[data-action="plist-edit"]');
                    const delBtn = ev.target.closest('[data-action="plist-delete"]');
                    if (editBtn) {
                        const id = Number(editBtn.dataset.id);
                        try {
                            const data = await authFetch(`catalogo_listini/${id}`);
                            const f = dom.formPricelist;
                            if (!f) return;
                            dom.pricelistFields.id.value = String(id);
                            dom.pricelistFields.codice.value = data.codice || '';
                            dom.pricelistFields.nome.value = data.nome || '';
                            dom.pricelistFields.valuta.value = (data.valuta || 'EUR').toUpperCase();
                            dom.pricelistFields.priorita.value = Number(data.priorita || 0);
                            dom.pricelistFields.dal.value = data.valido_dal || '';
                            dom.pricelistFields.al.value = data.valido_al || '';
                            if (dom.pricelistFields.btnDelete)
                                dom.pricelistFields.btnDelete.hidden = false;
                        } catch (e) {
                            alert(e.message || 'Errore lettura listino');
                        }
                    }
                    if (delBtn) {
                        const id = Number(delBtn.dataset.id);
                        if (!confirm('Eliminare il listino?')) return;
                        try {
                            await authFetch(`catalogo_listini/${id}`, { method: 'DELETE' });
                            await renderPricelists(state.selectedProductDetail.tenant_id);
                            await loadPriceListsForArticle(state.selectedProductDetail);
                            try { showToast('Listino eliminato', { type: 'success' }); } catch (e) {}
                        } catch (e) {
                            alert(e.message || 'Errore eliminazione listino');
                        }
                    }
                });
            }

            if (dom.formPricelist) {
                dom.formPricelist.addEventListener('submit', async (ev) => {
                    ev.preventDefault();
                    const tid = state.selectedProductDetail?.tenant_id;
                    if (!tid) {
                        alert('Tenant non valido');
                        return;
                    }
                    const id = dom.pricelistFields.id.value.trim();
                    const payload = {
                        tenant_id: Number(tid),
                        codice: dom.pricelistFields.codice.value.trim(),
                        nome: dom.pricelistFields.nome.value.trim(),
                        valuta: dom.pricelistFields.valuta.value.trim().toUpperCase() || 'EUR',
                        priorita: Number(dom.pricelistFields.priorita.value || 0),
                        valido_dal: dom.pricelistFields.dal.value || null,
                        valido_al: dom.pricelistFields.al.value || null,
                    };
                    if (!payload.codice) {
                        alert('Codice obbligatorio');
                        return;
                    }
                    try {
                        const updating = !!id;
                        if (updating) {
                            await authFetch(`catalogo_listini/${encodeURIComponent(id)}`, {
                                method: 'PUT',
                                json: true,
                                body: payload,
                            });
                        } else {
                            await authFetch('catalogo_listini', {
                                method: 'POST',
                                json: true,
                                body: payload,
                            });
                        }
                        dom.formPricelist.reset();
                        if (dom.pricelistFields.btnDelete)
                            dom.pricelistFields.btnDelete.hidden = true;
                        await renderPricelists(tid);
                        await loadPriceListsForArticle(state.selectedProductDetail);
                        try { showToast(updating ? 'Listino aggiornato' : 'Listino creato', { type: 'success' }); } catch (e) {}
                    } catch (e) {
                        alert(e.message || 'Errore salvataggio listino');
                    }
                });
            }

            // Categories: open/manage
            if (dom.btnManageCategories) {
                dom.btnManageCategories.addEventListener('click', async () => {
                    try {
                        // Reset form state and hide delete until a category is selected
                        if (dom.formCategory) dom.formCategory.reset();
                        if (dom.categoryFields?.btnDelete)
                            dom.categoryFields.btnDelete.hidden = true;
                        await renderCategoriesList();
                        await populateCategoryParent('');
                    } catch (e) {
                        /* ignore; renderers already handle errors */
                    }
                    openModal('modal-manage-categories');
                });
            }

            // Categorie save
            const btnSaveCats = document.getElementById('btn-save-categories');
            if (btnSaveCats) {
                btnSaveCats.addEventListener('click', async () => {
                    if (!state.selectedProductId) {
                        alert('Seleziona un articolo');
                        return;
                    }
                    const sel = document.getElementById('edit-product-categories');
                    const slugs = [...(sel?.selectedOptions || [])].map((o) => o.value);
                    try {
                        await authFetch(`catalogo_articoli_categorie/${state.selectedProductId}`, {
                            method: 'PUT',
                            json: true,
                            body: { categorie_slugs: slugs },
                        });
                        await loadProductById(state.selectedProductId);
                        try { showToast('Categorie aggiornate', { type: 'success' }); } catch (e) {}
                    } catch (e) {
                        alert(e.message || 'Errore salvataggio categorie');
                    }
                });
            }

            // Categories CRUD modal handlers
            async function renderCategoriesList() {
                if (!dom.categoriesList) return;
                const q = (dom.categoriesSearch?.value || '').trim();
                dom.categoriesList.innerHTML = '<p>Caricamento categorie…</p>';
                try {
                    const list = await authFetch(
                        `catalogo_categorie${q ? '?q=' + encodeURIComponent(q) : ''}`,
                    );
                    const arr = Array.isArray(list) ? list : [];
                    if (!arr.length) {
                        dom.categoriesList.innerHTML =
                            '<p class="form-hint">Nessuna categoria.</p>';
                        return;
                    }
                    dom.categoriesList.innerHTML = arr
                        .map(
                            (c) =>
                                `<div class="list-item"><div class="item-header"><strong>${sanitize(c.nome)}</strong> <small class="badge">${sanitize(c.slug)}</small></div><div class="item-actions"><button type="button" class="btn" data-action="cat-edit" data-id="${c.id}">Modifica</button><button type="button" class="btn btn-danger" data-action="cat-delete" data-id="${c.id}">Elimina</button></div></div>`,
                        )
                        .join('');
                } catch (e) {
                    dom.categoriesList.innerHTML = `<p>${sanitize(e.message || 'Errore caricamento categorie')}</p>`;
                }
            }

            async function populateCategoryParent(selectedId) {
                if (!dom.categoryFields?.parent) return;
                try {
                    const list = await authFetch('catalogo_categorie');
                    const arr = Array.isArray(list) ? list : [];
                    dom.categoryFields.parent.innerHTML =
                        '<option value="">—</option>' +
                        arr
                            .map((c) => `<option value="${c.id}">${sanitize(c.nome)}</option>`)
                            .join('');
                    if (selectedId) dom.categoryFields.parent.value = String(selectedId);
                } catch (e) {
                    dom.categoryFields.parent.innerHTML = '<option value="">—</option>';
                }
            }

            if (dom.categoriesSearch) {
                dom.categoriesSearch.addEventListener('input', () => {
                    renderCategoriesList();
                });
            }
            if (dom.categoriesList) {
                dom.categoriesList.addEventListener('click', async (ev) => {
                    const edit = ev.target.closest('[data-action="cat-edit"]');
                    const del = ev.target.closest('[data-action="cat-delete"]');
                    if (edit) {
                        const id = Number(edit.dataset.id);
                        try {
                            const cat = await authFetch(`catalogo_categorie/${id}`);
                            if (dom.categoryFields?.id)
                                dom.categoryFields.id.value = String(cat.id);
                            if (dom.categoryFields?.name)
                                dom.categoryFields.name.value = cat.nome || '';
                            if (dom.categoryFields?.slug)
                                dom.categoryFields.slug.value = cat.slug || '';
                            await populateCategoryParent(cat.categoria_padre_id || '');
                            if (dom.categoryFields?.btnDelete)
                                dom.categoryFields.btnDelete.hidden = false;
                        } catch (e) {
                            alert(e.message || 'Errore lettura categoria');
                        }
                        return;
                    }
                    if (del) {
                        const id = Number(del.dataset.id);
                        if (!confirm('Eliminare la categoria?')) return;
                        try {
                            await authFetch(`catalogo_categorie/${id}`, { method: 'DELETE' });
                            await renderCategoriesList();
                            await loadProductFilters();
                            try { showToast('Categoria eliminata', { type: 'success' }); } catch (e) {}
                        } catch (e) {
                            alert(e.message || 'Errore eliminazione categoria');
                        }
                        return;
                    }
                });
            }
            if (dom.formCategory) {
                dom.formCategory.addEventListener('submit', async (ev) => {
                    ev.preventDefault();
                    const id = dom.categoryFields?.id?.value.trim();
                    const nome = dom.categoryFields?.name?.value.trim();
                    const slug = dom.categoryFields?.slug?.value.trim();
                    const parent = dom.categoryFields?.parent?.value || '';
                    const payload = { nome };
                    if (slug) payload.slug = slug;
                    payload.categoria_padre_id = parent ? Number(parent) : null;
                    if (!nome) {
                        alert('Nome obbligatorio');
                        return;
                    }
                    try {
                        const updating = !!id;
                        if (updating) {
                            await authFetch(`catalogo_categorie/${encodeURIComponent(id)}`, {
                                method: 'PUT',
                                json: true,
                                body: payload,
                            });
                        } else {
                            await authFetch('catalogo_categorie', {
                                method: 'POST',
                                json: true,
                                body: payload,
                            });
                        }
                        if (dom.formCategory) dom.formCategory.reset();
                        if (dom.categoryFields?.btnDelete)
                            dom.categoryFields.btnDelete.hidden = true;
                        await renderCategoriesList();
                        await loadProductFilters();
                        try {
                            showToast(updating ? 'Categoria aggiornata' : 'Categoria creata', {
                                type: 'success',
                            });
                        } catch (e) {}
                    } catch (e) {
                        alert(e.message || 'Errore salvataggio categoria');
                    }
                });
            }
            if (dom.categoryFields?.btnDelete) {
                dom.categoryFields.btnDelete.addEventListener('click', async () => {
                    const id = dom.categoryFields?.id?.value.trim();
                    if (!id) return;
                    if (!confirm('Eliminare la categoria?')) return;
                    try {
                        await authFetch(`catalogo_categorie/${encodeURIComponent(id)}`, {
                            method: 'DELETE',
                        });
                        if (dom.formCategory) dom.formCategory.reset();
                        dom.categoryFields.btnDelete.hidden = true;
                        await renderCategoriesList();
                        await loadProductFilters();
                        try { showToast('Categoria eliminata', { type: 'success' }); } catch (e) {}
                    } catch (e) {
                        alert(e.message || 'Errore eliminazione categoria');
                    }
                });
            }

            // Relazioni add/remove
            const btnAddRel = document.getElementById('btn-add-relation');
            if (btnAddRel) {
                btnAddRel.addEventListener('click', async () => {
                    const type = document.getElementById('relation-type')?.value || 'UPSELL';
                    const targetSel = document.getElementById('relation-target-select');
                    const target = Number(targetSel?.value || '');
                    const prio = Number(document.getElementById('relation-priority')?.value || '0');
                    if (!state.selectedProductId || !target) {
                        alert('Seleziona articolo e inserisci ID correlato');
                        return;
                    }
                    try {
                        await authFetch('catalogo_relazioni', {
                            method: 'POST',
                            json: true,
                            body: {
                                articolo_sorgente_id: state.selectedProductId,
                                articolo_correlato_id: target,
                                tipo_relazione: type,
                                priorita: prio,
                            },
                        });
                        await loadProductById(state.selectedProductId);
                        try { showToast('Relazione creata', { type: 'success' }); } catch (e) {}
                    } catch (e) {
                        alert(e.message || 'Errore creazione relazione');
                    }
                });
            }
            const relList = document.getElementById('product-relations-list');
            if (relList) {
                relList.addEventListener('click', async (ev) => {
                    const del = ev.target.closest('[data-action="rel-delete"]');
                    const upd = ev.target.closest('[data-action="rel-update"]');
                    const openBtn = ev.target.closest('[data-action="rel-open"]');
                    if (openBtn) {
                        const targetId = Number(openBtn.dataset.targetId);
                        if (targetId) {
                            state.selectedProductId = targetId;
                            renderProductsList();
                            await loadProductById(targetId);
                        }
                        return;
                    }
                    if (del) {
                        const id = Number(del.dataset.id);
                        if (!id) return;
                        if (!confirm('Eliminare relazione?')) return;
                        try {
                            await authFetch(`catalogo_relazioni/${id}`, { method: 'DELETE' });
                            await loadProductById(state.selectedProductId);
                            try { showToast('Relazione eliminata', { type: 'success' }); } catch (e) {}
                        } catch (e) {
                            alert(e.message || 'Errore eliminazione relazione');
                        }
                        return;
                    }
                    if (upd) {
                        const id = Number(upd.dataset.id);
                        if (!id) return;
                        const item = upd.closest('[data-relation-id]');
                        if (!item) return;
                        const prEl = item.querySelector('[data-field="prio"]');
                        const tpEl = item.querySelector('[data-field="tipo"]');
                        const prio = prEl ? Number(prEl.value || 0) : 0;
                        const tipo = tpEl ? tpEl.value || 'UPSELL' : 'UPSELL';
                        try {
                            await authFetch(`catalogo_relazioni/${id}`, {
                                method: 'PUT',
                                json: true,
                                body: { priorita: prio, tipo_relazione: tipo },
                            });
                            await loadProductById(state.selectedProductId);
                            try { showToast('Relazione aggiornata', { type: 'success' }); } catch (e) {}
                        } catch (e) {
                            alert(e.message || 'Errore aggiornamento relazione');
                        }
                        return;
                    }
                });
            }

            // Relazioni: popolamento dinamico target per categoria
            const relCat = document.getElementById('relation-category');
            const relTarget = document.getElementById('relation-target-select');
            async function refreshRelationCategories() {
                try {
                    const cats = await hubFetch('categorie');
                    if (relCat) {
                        relCat.innerHTML =
                            '<option value="">—</option>' +
                            (Array.isArray(cats) ? cats : [])
                                .map(
                                    (c) =>
                                        `<option value="${sanitize(c.slug)}">${sanitize(c.nome)}</option>`,
                                )
                                .join('');
                    }
                } catch (e) {
                    /* ignore */
                }
            }
            async function refreshRelationTargets() {
                if (!relTarget) return;
                const cat = relCat?.value || '';
                const params = new URLSearchParams();
                if (cat) params.set('categoria', cat);
                try {
                    let list = await hubFetch(
                        `articoli${params.toString() ? '?' + params.toString() : ''}`,
                    );
                    if (!Array.isArray(list) || list.length === 0) {
                        // Fallback: senza filtro categoria
                        list = await hubFetch('articoli');
                    }
                    relTarget.innerHTML =
                        '<option value="">—</option>' +
                        (Array.isArray(list) ? list : [])
                            .map(
                                (a) =>
                                    `<option value="${Number(a.id)}">${sanitize((a.marca ? a.marca + ' ' : '') + (a.modello || a.titolo || 'Articolo #' + a.id))} — ${sanitize(a.sku || '')}</option>`,
                            )
                            .join('');
                } catch (e) {
                    relTarget.innerHTML = '<option value="">—</option>';
                }
            }
            if (relCat) {
                relCat.addEventListener('change', refreshRelationTargets);
                refreshRelationCategories()
                    .then(refreshRelationTargets)
                    .catch(() => {});
            }

            // Relazioni: toolbar (filtro/sort) handlers
            const relFilterType = document.getElementById('relation-filter-type');
            const relSort = document.getElementById('relation-sort');
            const relSortDir = document.getElementById('relation-sort-dir');
            const applyRelToolbar = () => {
                state.relationFilterType = (relFilterType?.value || '').toUpperCase();
                state.relationSort = relSort?.value || 'priority';
                state.relationSortDir = relSortDir?.value || 'asc';
                if (state.selectedProductDetail) renderRelationsBox(state.selectedProductDetail);
            };
            if (relFilterType) relFilterType.addEventListener('change', applyRelToolbar);
            if (relSort) relSort.addEventListener('change', applyRelToolbar);
            if (relSortDir) relSortDir.addEventListener('change', applyRelToolbar);

            // Delegazione per pulsanti copia URL nelle proposte media
            if (dom.suggestedMedia) {
                dom.suggestedMedia.addEventListener('click', (event) => {
                    const btn = event.target.closest('[data-action="copy-url"]');
                    if (btn) {
                        const url = btn.getAttribute('data-url') || '';
                        if (!url) return;
                        try {
                            navigator.clipboard.writeText(url);
                            try {
                                showToast('URL copiato', { type: 'success', duration: 2000 });
                            } catch (e) {}
                        } catch (e) {
                            alert('Impossibile copiare negli appunti. URL: ' + url);
                        }
                        return;
                    }
                    const attach = event.target.closest('[data-action="attach-media"]');
                    if (attach) {
                        const url = attach.getAttribute('data-url') || '';
                        const title = attach.getAttribute('data-title') || '';
                        if (!state.selectedProductId || !url) return;
                        (async () => {
                            try {
                                await authFetch('catalog_media/attach', {
                                    method: 'POST',
                                    json: true,
                                    body: {
                                        articolo_id: Number(state.selectedProductId),
                                        url,
                                        tipologia: 'IMMAGINE',
                                        testo_alternativo: title,
                                    },
                                });
                                try {
                                    showToast('Media associato', { type: 'success' });
                                } catch (e) {}
                                await loadProductById(state.selectedProductId);
                            } catch (e) {
                                alert(e.message || "Errore durante l'associazione del media");
                            }
                        })();
                    }
                });
            }

            // Suggerisci media (enrichment)
            const suggestMedia = async () => {
                if (!state.selectedProductId) return;
                try {
                    if (dom.suggestMediaStatus)
                        dom.suggestMediaStatus.textContent = 'Ricerca suggerimenti…';
                    // Costruisce query da titolo+SKU
                    const title = (dom.productDetailTitle?.textContent || '').trim();
                    const sku = (dom.productDetailSku?.textContent || '').trim();
                    const attrs = state.selectedProductDetail?.attributi || [];
                    const ean = (
                        attrs.find((a) => String(a.nome_tecnico || '').toLowerCase() === 'ean')
                            ?.valore_testo || ''
                    ).trim();
                    const modello = (
                        attrs.find((a) => String(a.nome_tecnico || '').toLowerCase() === 'modello')
                            ?.valore_testo || ''
                    ).trim();
                    const q = [title, sku, modello, ean].filter(Boolean).join(' ');
                    const providers = [];
                    if (dom.mediaSrcWiki?.checked) providers.push('wikimedia');
                    if (dom.mediaSrcUnsplash?.checked) providers.push('unsplash');
                    if (dom.mediaSrcPexels?.checked) providers.push('pexels');
                    const prefer = (dom.mediaSrcPrefer?.value || '').trim();
                    const params = new URLSearchParams({ q, limit: '12' });
                    if (providers.length) params.set('providers', providers.join(','));
                    if (prefer) params.set('prefer', prefer);
                    const items = await authFetch(`enrichment/media?${params.toString()}`);
                    const cont = dom.suggestedMedia;
                    if (cont) {
                        if (!Array.isArray(items) || !items.length) {
                            cont.innerHTML = '<p>Nessun suggerimento trovato.</p>';
                        } else {
                            cont.innerHTML = items
                                .map(
                                    (i) => `
                          <div class="list-item">
                            <div style="display:flex; align-items:center; gap:10px;">
                              <img src="${sanitize(i.thumbnail || i.url)}" alt="" style="width:80px; height:80px; object-fit:cover; border-radius:6px;">
                              <div>
                                <div><strong>${sanitize(i.title || '')}</strong> <small class="badge">${sanitize(i.source || 'web')}</small> ${i.license ? `<small class="badge">${sanitize(i.license)}</small>` : ''}</div>
                                <small>${sanitize(i.description || '')}</small>
                                <div style="margin-top:4px; display:flex; gap:6px; flex-wrap:wrap;">
                                  <a class="btn btn-secondary" href="${sanitize(i.url)}" target="_blank" rel="noopener">Apri</a>
                                  <button type="button" class="btn btn-primary" data-action="copy-url" data-url="${sanitize(i.url)}">Copia URL</button>
                                  <button type="button" class="btn btn-success" data-action="attach-media" data-url="${sanitize(i.url)}" data-title="${sanitize(i.title || '')}">Associa</button>
                                </div>
                              </div>
                            </div>
                          </div>`,
                                )
                                .join('');
                        }
                    }
                } catch (e) {
                    if (dom.suggestedMedia)
                        dom.suggestedMedia.innerHTML = `<p>${sanitize(e.message || 'Errore ricerca suggerimenti')}</p>`;
                } finally {
                    if (dom.suggestMediaStatus) dom.suggestMediaStatus.textContent = '';
                }
            };

            if (dom.btnSuggestMedia) {
                dom.btnSuggestMedia.addEventListener('click', () => suggestMedia());
            }

            // Media delete handler
            const mediaBox = document.getElementById('product-detail-media');
            if (mediaBox) {
                mediaBox.addEventListener('click', async (ev) => {
                    const del = ev.target.closest('[data-action="media-delete"]');
                    const up = ev.target.closest('[data-action="media-up"]');
                    const down = ev.target.closest('[data-action="media-down"]');
                    const cover = ev.target.closest('[data-action="media-cover"]');
                    const saveAlt = ev.target.closest('[data-action="media-save-alt"]');
                    if (del) {
                        const id = Number(del.dataset.id);
                        if (!id) return;
                        if (!confirm('Eliminare media?')) return;
                        try {
                            await authFetch(`catalog_media/${id}`, { method: 'DELETE' });
                            await loadProductById(state.selectedProductId);
                        } catch (e) {
                            alert(e.message || 'Errore eliminazione media');
                        }
                        return;
                    }
                    if (up || down) {
                        const btn = up || down;
                        const id = Number(btn.dataset.id);
                        if (!id) return;
                        const direction = up ? 'up' : 'down';
                        try {
                            await authFetch(`catalog_media/${id}/move`, {
                                method: 'POST',
                                json: true,
                                body: { direction },
                            });
                            await loadProductById(state.selectedProductId);
                        } catch (e) {
                            alert(e.message || 'Errore riordino media');
                        }
                        return;
                    }
                    if (cover) {
                        const id = Number(cover.dataset.id);
                        if (!id) return;
                        try {
                            await authFetch(`catalog_media/${id}/cover`, { method: 'POST' });
                            await loadProductById(state.selectedProductId);
                        } catch (e) {
                            alert(e.message || 'Errore impostazione copertina');
                        }
                        return;
                    }
                    if (saveAlt) {
                        const id = Number(saveAlt.dataset.id);
                        if (!id) return;
                        const fig = saveAlt.closest('figure');
                        const input = fig
                            ? fig.querySelector('input.media-alt-input[data-id="' + id + '"]')
                            : null;
                        const nuovo = input ? input.value.trim() : '';
                        try {
                            await authFetch(`catalog_media/${id}`, {
                                method: 'PUT',
                                json: true,
                                body: { testo_alternativo: nuovo },
                            });
                            await loadProductById(state.selectedProductId);
                        } catch (e) {
                            alert(e.message || 'Errore aggiornamento media');
                        }
                        return;
                    }
                });
            }

            // Upload media (file → hub media)
            if (dom.btnUploadMedia) {
                dom.btnUploadMedia.addEventListener('click', async () => {
                    if (!state.selectedProductId) {
                        alert('Seleziona un articolo');
                        return;
                    }
                    const input = dom.uploadMediaInput;
                    if (!input || !input.files || !input.files[0]) {
                        alert('Seleziona un file');
                        return;
                    }
                    const file = input.files[0];
                    const maxBytes = 10 * 1024 * 1024; // 10 MB
                    if (file.size > maxBytes) {
                        alert('File troppo grande (max 10 MB)');
                        return;
                    }
                    const fd = new FormData();
                    fd.append('articolo_id', String(state.selectedProductId));
                    fd.append('file', file);
                    const alt = (dom.uploadMediaAlt?.value || '').trim();
                    if (alt) fd.append('testo_alternativo', alt);
                    try {
                        await authFetch('catalog_media/upload', { method: 'POST', body: fd });
                        if (dom.uploadMediaInput) dom.uploadMediaInput.value = '';
                        if (dom.uploadMediaAlt) dom.uploadMediaAlt.value = '';
                        await loadProductById(state.selectedProductId);
                    } catch (e) {
                        alert(e.message || 'Errore upload media');
                    }
                });
            }

            // Drag & Drop per riordinare media (dichiarata prima dell'uso)
            function attachMediaDnD(container) {
                if (!container) return;
                let dragEl = null;
                container.querySelectorAll('figure.media-thumb').forEach((fig) => {
                    fig.addEventListener('dragstart', (e) => {
                        dragEl = fig;
                        e.dataTransfer?.setData('text/plain', fig.dataset.mediaId || '');
                        e.dataTransfer?.setDragImage(fig, 10, 10);
                    });
                    fig.addEventListener('dragover', (e) => {
                        e.preventDefault();
                        fig.style.outline = '2px dashed #93c5fd';
                    });
                    fig.addEventListener('dragleave', () => {
                        fig.style.outline = '';
                    });
                    fig.addEventListener('drop', async (e) => {
                        e.preventDefault();
                        fig.style.outline = '';
                        if (!dragEl || dragEl === fig) return;
                        const all = [...container.querySelectorAll('figure.media-thumb')];
                        const dropIndex = all.indexOf(fig);
                        container.insertBefore(
                            dragEl,
                            dropIndex > -1 && dropIndex < all.length ? all[dropIndex] : null,
                        );
                        const ids = [...container.querySelectorAll('figure.media-thumb')].map((n) =>
                            Number(n.dataset.mediaId),
                        );
                        try {
                            await authFetch('catalog_media/reorder', {
                                method: 'POST',
                                json: true,
                                body: {
                                    articolo_id: Number(state.selectedProductId),
                                    ordered_ids: ids,
                                },
                            });
                            await loadProductById(state.selectedProductId);
                        } catch (err) {
                            /* no-op */
                        }
                    });
                    fig.addEventListener('dragend', () => {
                        dragEl = null;
                        fig.style.outline = '';
                    });
                });
            }

            if (dom.instancesList) {
                dom.instancesList.addEventListener('click', (event) => {
                    const card = event.target.closest('.instance-card');
                    if (card) {
                        const id = Number(card.dataset.id);
                        if (!Number.isNaN(id)) {
                            instanceState.selectedId = id;
                            renderInstanceList();
                            loadInstanceDetail(id);
                        }
                        return;
                    }
                    const toggle = event.target.closest('.instance-assignees-toggle');
                    if (toggle) {
                        const instId = toggle.dataset.instId;
                        if (instId) {
                            instanceState.assigneesExpanded[instId] =
                                !instanceState.assigneesExpanded[instId];
                            renderInstanceList();
                        }
                        return;
                    }
                    const userLink = event.target.closest('.assignee-link');
                    if (userLink) {
                        const uid = Number(userLink.dataset.userId);
                        if (!Number.isNaN(uid)) {
                            jumpToUserOps(uid);
                        }
                    }
                });
            }

            if (instanceDetailEls.container) {
                instanceDetailEls.container.addEventListener('click', (event) => {
                    const link = event.target.closest('.assignee-link');
                    if (link) {
                        const uid = Number(link.dataset.userId);
                        if (!Number.isNaN(uid)) {
                            jumpToUserOps(uid);
                        }
                    }
                });
            }
        };

        const openSetSupervisor = async (userId) => {
            const modal = document.getElementById('modal-set-supervisor');
            const form = document.getElementById('form-set-supervisor');
            const sel = document.getElementById('set-supervisor-select');
            const hid = document.getElementById('set-supervisor-user-id');
            if (!modal || !form || !sel || !hid) return;
            hid.value = String(userId);
            // Popola supervisor options: Admin vede tutti, Supervisor solo se stesso
            sel.innerHTML = '<option value="">— Nessuno —</option>';
            const role = (state.currentUserInfo.ruolo || '').toUpperCase();
            const supers = (state.users || []).filter(
                (u) => (u.ruolo || '').toUpperCase() === 'SUPERVISOR',
            );
            supers.forEach((u) => {
                if (role === 'SUPERVISOR' && Number(u.id) !== Number(state.currentUserId)) return;
                const opt = document.createElement('option');
                opt.value = u.id;
                opt.textContent = buildUserLabel(u);
                sel.appendChild(opt);
            });
            // Preseleziona supervisor corrente
            try {
                let sups = await authFetch(`utenti/${userId}/supervisors`);
                sups = Array.isArray(sups) ? sups : [];
                const sup = sups[0]?.id ? String(sups[0].id) : '';
                sel.value = sup || '';
            } catch (e) {
                /* ignore */
            }
            openModal('modal-set-supervisor');
        };

        const handleSetSupervisorSubmit = async (ev) => {
            ev.preventDefault();
            const hid = document.getElementById('set-supervisor-user-id');
            const sel = document.getElementById('set-supervisor-select');
            if (!hid || !sel) return;
            const uid = hid.value;
            const supId = sel.value || '';
            try {
                await authFetch(`utenti/${uid}/set_supervisor/${supId || 0}`, { method: 'POST' });
                closeAllModals();
                await loadUsers();
                renderUsersList();
                try {
                    showToast('Supervisor aggiornato', { type: 'success' });
                } catch (e) {}
            } catch (e) {
                try {
                    showToast(e.message || 'Errore impostazione supervisor.', { type: 'error' });
                } catch (err) {}
            }
        };

        document
            .getElementById('form-set-supervisor')
            ?.addEventListener('submit', handleSetSupervisorSubmit);
        dom.btnResetUserFiltersTop?.addEventListener('click', (e) => {
            e.preventDefault();
            resetUserFilters();
        });
        // Delegated handler per il bottone di reset inline nel placeholder della lista utenti
        if (dom.usersList) {
            dom.usersList.addEventListener('click', (ev) => {
                const btn = ev.target?.closest?.('#btn-reset-user-filters');
                if (btn) {
                    ev.preventDefault();
                    resetUserFilters();
                }
            });
        }

        const loadGroupUsersInline = async (groupId, container) => {
            try {
                const data = await authFetch(`gruppi/${groupId}`);
                const users = Array.isArray(data?.users) ? data.users : [];
                if (!users.length) {
                    container.innerHTML =
                        '<small class="form-hint">Nessun utente nel gruppo.</small>';
                    return;
                }
                container.innerHTML = users
                    .map((u) => `<span class="badge">${sanitize(buildUserLabel(u))}</span>`)
                    .join(' ');
            } catch (e) {
                container.innerHTML = '<small class="form-hint">Errore caricamento utenti.</small>';
            }
        };

        const openModal = (id) => {
            const modal = document.getElementById(id);
            if (modal) {
                if (id === 'modal-create-step') {
                    if (formCreateStep && formCreateStep.dataset.mode !== 'edit') {
                        resetStepForm();
                        populateActionSelect();
                    } else if (formCreateStep && formCreateStep.dataset.mode === 'edit') {
                        populateActionSelect();
                        const stepData = workflowState.editingStepData;
                        if (stepData && actionParamsContainer) {
                            let parsed = stepData.parametri_azione;
                            if (typeof parsed === 'string') {
                                try {
                                    parsed = JSON.parse(parsed);
                                } catch (err) {
                                    parsed = {};
                                }
                            }
                            if (parsed && typeof parsed === 'object') {
                                actionParamsContainer
                                    .querySelectorAll('[data-param-key]')
                                    .forEach((input) => {
                                        const key = input.dataset.paramKey;
                                        if (key && parsed[key] !== undefined) {
                                            input.value = parsed[key];
                                        }
                                    });
                            }
                        }
                    }
                } else if (id === 'modal-create-workflow' && formCreateWorkflow) {
                    formCreateWorkflow.reset();
                }
                modal.classList.add('is-open');
            }
        };

        const setupTabsUI = () => {
            /* tabs disabilitati: sezioni separate Modelli/Operatività */
        };

        const setupCollapsiblePanels = () => {
            // Istanze panel
            const instPanel = document.querySelector(
                'article.panel.panel--wide[data-resource="workflowistanze"]',
            );
            if (instPanel) {
                const head = instPanel.querySelector('.panel__header');
                const body = instPanel.querySelector('.instance-grid');
                if (head && body && !head.querySelector('.collapse-toggle')) {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'collapse-toggle';
                    btn.textContent = 'Comprimi';
                    btn.setAttribute('aria-expanded', 'true');
                    btn.addEventListener('click', () => {
                        const expanded = btn.getAttribute('aria-expanded') === 'true';
                        btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
                        btn.textContent = expanded ? 'Espandi' : 'Comprimi';
                        body.hidden = expanded;
                    });
                    head.appendChild(btn);
                }
            }

            // Operatività panel
            const opsPanel = dom.taskOpsPanel;
            if (opsPanel) {
                const head = opsPanel.querySelector('.panel__header');
                const body = opsPanel.querySelector('.panel__body');
                if (head && body && !head.querySelector('.collapse-toggle')) {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'collapse-toggle';
                    btn.textContent = 'Comprimi';
                    btn.setAttribute('aria-expanded', 'true');
                    btn.addEventListener('click', () => {
                        const expanded = btn.getAttribute('aria-expanded') === 'true';
                        btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
                        btn.textContent = expanded ? 'Espandi' : 'Comprimi';
                        body.hidden = expanded;
                    });
                    head.appendChild(btn);
                }
            }

            // Services panels
            ['panel-services-status', 'panel-services-test', 'panel-services-logs'].forEach((pid) => {
                const panel = document.getElementById(pid);
                if (!panel) return;
                const head = panel.querySelector('.panel__header');
                const body = panel.querySelector('.panel__body');
                if (head && body && !head.querySelector('.collapse-toggle')) {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'collapse-toggle';
                    btn.textContent = 'Comprimi';
                    btn.setAttribute('aria-expanded', 'true');
                    btn.addEventListener('click', () => {
                        const expanded = btn.getAttribute('aria-expanded') === 'true';
                        btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
                        btn.textContent = expanded ? 'Espandi' : 'Comprimi';
                        body.hidden = expanded;
                    });
                    head.appendChild(btn);
                }
            });

            // Kanban area (board + workflow grid) – costruisco un header sintetico
            const kanban = document.querySelector('#workflow .kanban-board');
            if (kanban && !kanban.previousElementSibling?.classList?.contains('board-controls')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'board-controls';
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'collapse-toggle';
                btn.textContent = 'Comprimi Kanban';
                btn.setAttribute('aria-expanded', 'true');
                btn.addEventListener('click', () => {
                    const expanded = btn.getAttribute('aria-expanded') === 'true';
                    btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
                    btn.textContent = expanded ? 'Espandi Kanban' : 'Comprimi Kanban';
                    kanban.hidden = expanded;
                });
                wrapper.appendChild(btn);
                kanban.parentElement?.insertBefore(wrapper, kanban);
            }
        };

        const setActiveView = (name) => {
            try {
                if (name === 'ops') {
                    document
                        .getElementById('operations')
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else if (name === 'instances') {
                    document
                        .querySelector('article.panel[data-resource="workflowistanze"]')
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else if (name === 'kanban') {
                    document
                        .querySelector('#operations .kanban-board')
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else if (name === 'models') {
                    document
                        .getElementById('workflow-models')
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            } catch (e) {
                /* ignore */
            }
        };

        const closeAllModals = () => {
            document
                .querySelectorAll('[data-modal]')
                .forEach((modal) => modal.classList.remove('is-open'));
            if (formCreateWorkflow) formCreateWorkflow.reset();
            const formEditWf = document.getElementById('form-edit-workflow');
            if (formEditWf) formEditWf.reset();
            resetStepForm();
            if (formStartInstance) formStartInstance.reset();
            workflowState.editingStepId = null;
            state.activeTask = null;
            state.activeTaskNotes = [];
            if (taskModalElements.subflowMessage) {
                taskModalElements.subflowMessage.textContent = '';
            }
        };

        const openEditWorkflow = async () => {
            try {
                const id = workflowState.selectedId;
                if (!id) {
                    alert('Seleziona un workflow.');
                    return;
                }
                let wf = workflowState.detailCache[id];
                if (!wf) {
                    await loadWorkflowDetail(id);
                    wf = workflowState.detailCache[id];
                }
                if (!wf) {
                    alert('Dettaglio workflow non disponibile.');
                    return;
                }
                const form = document.getElementById('form-edit-workflow');
                if (!form) return;
                form.querySelector('#edit-workflow-id').value = String(id);
                form.querySelector('#edit-workflow-name').value = wf.nome || wf.nome_workflow || '';
                form.querySelector('#edit-workflow-description').value = wf.descrizione || '';
                form.querySelector('#edit-workflow-active').checked = !!wf.attivo;
                openModal('modal-edit-workflow');
            } catch (e) {
                alert('Impossibile aprire la modifica del workflow.');
            }
        };

        const handleEditWorkflowSubmit = async (event) => {
            event.preventDefault();
            const form = event.target;
            const id = Number(form.querySelector('#edit-workflow-id').value);
            if (!id) {
                alert('ID workflow mancante.');
                return;
            }
            const data = serializeForm(form);
            data.attivo = data.attivo ? 1 : 0;
            try {
                await authFetch(`workflows/${id}`, { method: 'PUT', json: true, body: data });
                closeAllModals();
                workflowState.detailCache = {};
                await loadWorkflows();
                await loadWorkflowDetail(id);
                try {
                    showToast('Workflow aggiornato', { type: 'success' });
                } catch (e) {}
            } catch (error) {
                alert(error.message || "Errore durante l'aggiornamento del workflow.");
            }
        };

        const handleCreateWorkflow = async (event) => {
            event.preventDefault();
            const form = event.target;
            const data = serializeForm(form);
            data.attivo = data.attivo ? 1 : 0;

            try {
                await authFetch('workflows', { method: 'POST', json: true, body: data });
                closeAllModals();
                form.reset();
                workflowState.detailCache = {};
                workflowState.selectedId = null;
                await loadWorkflows();
            } catch (error) {
                alert(error.message || 'Errore durante la creazione del workflow.');
            }
        };

        const handleCreateStep = async (event) => {
            event.preventDefault();
            if (!workflowState.selectedId) {
                alert('Seleziona prima un workflow.');
                return;
            }

            const form = event.target;
            const data = serializeForm(form);
            data.workflow_modello_id = workflowState.selectedId;

            if (!data.tipo_azione_standard) {
                delete data.tipo_azione_standard;
            } else {
                data.tipo_azione_standard = Number(data.tipo_azione_standard);
            }

            const hasUser =
                data.responsabile_utente_id &&
                data.responsabile_utente_id !== '' &&
                data.responsabile_utente_id !== '0';
            const hasGroup =
                data.responsabile_gruppo_id &&
                data.responsabile_gruppo_id !== '' &&
                data.responsabile_gruppo_id !== '0';
            if (!hasUser && !hasGroup) {
                alert('Imposta almeno un responsabile (utente o gruppo).');
                return;
            }

            ['ordine', 'sottopasso', 'responsabile_gruppo_id', 'responsabile_utente_id'].forEach(
                (key) => {
                    if (data[key] === '' || data[key] === null || data[key] === undefined) {
                        delete data[key];
                    } else {
                        data[key] = Number(data[key]);
                    }
                },
            );

            if (
                data.scadenza_standard_valore === '' ||
                data.scadenza_standard_valore === undefined
            ) {
                delete data.scadenza_standard_valore;
                delete data.scadenza_standard_unita;
            } else {
                data.scadenza_standard_valore = Number(data.scadenza_standard_valore);
                if (!data.scadenza_standard_unita) {
                    delete data.scadenza_standard_unita;
                }
            }

            if (actionParamsContainer) {
                const inputs = actionParamsContainer.querySelectorAll('[data-param-key]');
                if (inputs.length) {
                    const params = {};
                    inputs.forEach((input) => {
                        const key = input.dataset.paramKey;
                        if (key && input.value !== '') {
                            params[key] = input.value;
                        }
                    });
                    if (Object.keys(params).length) {
                        data.parametri_azione = params;
                    }
                }
            }

            const mode = form.dataset.mode || 'create';
            const stepId = form.dataset.stepId;

            try {
                if (mode === 'edit' && stepId) {
                    await authFetch(`workflowsteps/${stepId}`, {
                        method: 'PUT',
                        json: true,
                        body: data,
                    });
                } else {
                    await authFetch('workflowsteps', { method: 'POST', json: true, body: data });
                }
                closeAllModals();
                resetStepForm();
                delete workflowState.detailCache[workflowState.selectedId];
                await loadWorkflowDetail(workflowState.selectedId);
            } catch (error) {
                alert(error.message || 'Errore durante la creazione del passo.');
            }
        };

        const handleStartInstance = async (event) => {
            event.preventDefault();
            if (!workflowState.selectedId) {
                alert('Seleziona un workflow.');
                return;
            }

            const form = event.target;
            const data = serializeForm(form);
            const payload = {
                entita_collegata_tipo: data.entita_collegata_tipo || null,
                entita_collegata_id: data.entita_collegata_id || null,
            };

            // Se selezionato un cliente, forza collegamento CLIENTE/{id}
            const startCustId = document.getElementById('start-customer-id')?.value || '';
            if (startCustId) {
                payload.entita_collegata_tipo = 'CLIENTE';
                payload.entita_collegata_id = startCustId;
            }

            if (state.currentUser && state.currentUser !== 'all') {
                payload.id_utente_avvio = Number(state.currentUser);
            }

            if (payload.entita_collegata_id === '') {
                payload.entita_collegata_id = null;
            }

            try {
                await authFetch(`workflows/${workflowState.selectedId}/start`, {
                    method: 'POST',
                    json: true,
                    body: payload,
                });
                closeAllModals();
                form.reset();
                instanceState.detailCache = {};
                instanceState.selectedId = null;
                await Promise.all([loadTasks(), loadInstances()]);
            } catch (error) {
                alert(error.message || "Errore durante l'avvio dell'istanza.");
            }
        };

        document.querySelectorAll('[data-modal-close]').forEach((btn) => {
            btn.addEventListener('click', closeAllModals);
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeAllModals();
            }
        });

        if (taskModalElements.noteForm) {
            taskModalElements.noteForm.addEventListener('submit', handleTaskNoteSubmit);
        }

        if (taskModalElements.subflowForm) {
            taskModalElements.subflowForm.addEventListener('submit', handleTaskSubflowSubmit);
        }

        if (taskModalElements.takeBtn) {
            taskModalElements.takeBtn.addEventListener('click', (event) => {
                event.preventDefault();
                if (taskModalElements.takeBtn.dataset.taskId) {
                    handleTaskTake(taskModalElements.takeBtn.dataset.taskId);
                }
            });
        }

        if (taskModalElements.completeBtn) {
            taskModalElements.completeBtn.addEventListener('click', (event) => {
                event.preventDefault();
                if (taskModalElements.completeBtn.dataset.taskId) {
                    handleTaskComplete(taskModalElements.completeBtn.dataset.taskId);
                }
            });
        }

        if (taskModalElements.openInstanceBtn) {
            taskModalElements.openInstanceBtn.addEventListener('click', (event) => {
                event.preventDefault();
                if (!state.activeTask) return;
                const instId = Number(state.activeTask.workflow_istanza_id);
                if (!Number.isNaN(instId)) {
                    setActiveView('instances');
                    instanceState.selectedId = instId;
                    renderInstanceList();
                    loadInstanceDetail(instId);
                    document
                        .getElementById('instance-detail')
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        }

        if (stepActionSelect) {
            stepActionSelect.addEventListener('change', (event) => {
                renderActionParameterInputs(event.target.value);
            });
        }

        if (formCreateWorkflow) {
            formCreateWorkflow.addEventListener('submit', handleCreateWorkflow);
        }

        if (formCreateStep) {
            formCreateStep.addEventListener('submit', handleCreateStep);
        }

        if (formStartInstance) {
            formStartInstance.addEventListener('submit', handleStartInstance);
        }

        // Combo dinamica clienti per start instance
        const clientOptions = document.getElementById('client-options');
        const startCustLabel = document.getElementById('start-customer-label');
        const startCustId = document.getElementById('start-customer-id');
        const debounce = (fn, ms = 300) => {
            let t;
            return (...args) => {
                clearTimeout(t);
                t = setTimeout(() => fn(...args), ms);
            };
        };
        const populateClientOptions = (items) => {
            if (!clientOptions) return;
            clientOptions.innerHTML = '';
            (items || []).forEach((cli) => {
                const opt = document.createElement('option');
                opt.value = `${cli.ragione_sociale} — ${cli.partita_iva || ''}`.trim();
                opt.dataset.id = cli.id;
                clientOptions.appendChild(opt);
            });
        };
        const findClientOption = (label) => {
            if (!clientOptions) return null;
            const opts = clientOptions.querySelectorAll('option');
            for (const o of opts) {
                if (o.value === label) return o;
            }
            return null;
        };
        const fetchClients = async (term) => {
            try {
                const qs = term ? `?search=${encodeURIComponent(term)}` : '';
                const list = await authFetch(`clienti${qs}`);
                return Array.isArray(list) ? list : [];
            } catch (e) {
                return [];
            }
        };
        if (startCustLabel) {
            startCustLabel.addEventListener(
                'input',
                debounce(async () => {
                    if (!startCustLabel.value || startCustLabel.value.length < 2) {
                        populateClientOptions([]);
                        return;
                    }
                    const list = await fetchClients(startCustLabel.value.trim());
                    populateClientOptions(list);
                }, 250),
            );
            startCustLabel.addEventListener('change', () => {
                const opt = findClientOption(startCustLabel.value);
                if (startCustId) startCustId.value = opt ? opt.dataset.id || '' : '';
            });
        }

        if (formManageGroup) {
            formManageGroup.addEventListener('submit', async (ev) => {
                ev.preventDefault();
                const mode = formManageGroup.dataset.mode || 'create';
                const id = formManageGroup.elements.id.value || '';
                const payload = {
                    nome_gruppo: formManageGroup.elements.nome_gruppo.value.trim(),
                    descrizione: formManageGroup.elements.descrizione.value.trim(),
                };
                try {
                    if (mode === 'edit' && id) {
                        await authFetch(`gruppi/${id}`, {
                            method: 'PUT',
                            json: true,
                            body: payload,
                        });
                    } else {
                        await authFetch('gruppi', { method: 'POST', json: true, body: payload });
                    }
                    closeAllModals();
                    await loadGroups();
                } catch (e) {
                    alert(e.message || 'Errore salvataggio gruppo.');
                }
            });
        }

        if (btnDeleteGroup) {
            btnDeleteGroup.addEventListener('click', async () => {
                const id = formManageGroup?.elements?.id?.value;
                if (!id) return;
                if (!confirm("Confermi l'eliminazione del gruppo?")) return;
                try {
                    await authFetch(`gruppi/${id}`, { method: 'DELETE' });
                    closeAllModals();
                    await loadGroups();
                } catch (e) {
                    alert(e.message || 'Errore eliminazione gruppo.');
                }
            });
        }

        const handleDeleteGroup = async (id) => {
            if (!confirm("Confermi l'eliminazione del gruppo?")) return;
            try {
                await authFetch(`gruppi/${id}`, { method: 'DELETE' });
                await loadGroups();
            } catch (e) {
                alert(e.message || 'Errore eliminazione gruppo.');
            }
        };

        const handleRestoreGroup = async (id) => {
            try {
                await authFetch(`gruppi/${id}`, { method: 'PUT', json: true, body: { attivo: 1 } });
                await loadGroups();
            } catch (e) {
                alert(e.message || 'Errore ripristino gruppo.');
            }
        };

        if (btnGroupAddUser) {
            btnGroupAddUser.addEventListener('click', async () => {
                const gid = formManageGroup?.elements?.id?.value;
                const uid = groupUserIdHidden?.value;
                if (!gid || !uid) return;
                try {
                    await authFetch(`gruppi/${gid}/add/${uid}`, { method: 'POST' });
                    const data = await authFetch(`gruppi/${gid}`);
                    const users = Array.isArray(data.users) ? data.users : [];
                    renderGroupMembers(gid, users);
                    groupUserLabel.value = '';
                    groupUserIdHidden.value = '';
                    // refresh counts and lists
                    await loadGroups();
                } catch (e) {
                    alert(e.message || 'Errore aggiunta utente al gruppo.');
                }
            });
        }

        if (groupMembersSection) {
            groupMembersSection.addEventListener('click', async (ev) => {
                const btn = ev.target.closest('[data-action="remove-user-from-group"]');
                if (!btn) return;
                const gid = btn.dataset.groupId;
                const uid = btn.dataset.userId;
                if (!gid || !uid) return;
                try {
                    await authFetch(`gruppi/${gid}/remove/${uid}`, { method: 'DELETE' });
                    const data = await authFetch(`gruppi/${gid}`);
                    const users = Array.isArray(data.users) ? data.users : [];
                    renderGroupMembers(gid, users);
                    await loadGroups();
                } catch (e) {
                    alert(e.message || 'Errore rimozione utente dal gruppo.');
                }
            });
        }

        if (formManageUser) {
            formManageUser.addEventListener('submit', async (ev) => {
                ev.preventDefault();
                const mode = formManageUser.dataset.mode || 'create';
                const id = formManageUser.elements.id.value || '';
                const validateStrength = (pwd) => {
                    if (!pwd || pwd.length < 8) return 'La password deve avere almeno 8 caratteri.';
                    if (!/[A-Za-z]/.test(pwd) || !/\d/.test(pwd))
                        return 'La password deve contenere almeno una lettera e un numero.';
                    return '';
                };
                const payload = {
                    nome: formManageUser.elements.nome.value.trim(),
                    cognome: formManageUser.elements.cognome.value.trim(),
                    email: formManageUser.elements.email.value.trim(),
                    ruolo: formManageUser.elements.ruolo.value || null,
                    stato: formManageUser.elements.stato.value || 'ATTIVO',
                };
                const pwd = formManageUser.elements.password?.value || '';
                const pwd2 = formManageUser.elements.password_confirm?.value || '';
                if (mode === 'create') {
                    if (!pwd || !pwd2 || pwd !== pwd2) {
                        alert('Le password non coincidono o sono vuote.');
                        return;
                    }
                    const strengthMsg = validateStrength(pwd);
                    if (strengthMsg) {
                        alert(strengthMsg);
                        return;
                    }
                    payload.password = pwd;
                } else if (pwd || pwd2) {
                    if (pwd !== pwd2) {
                        alert('Le password non coincidono.');
                        return;
                    }
                    const strengthMsg = validateStrength(pwd);
                    if (strengthMsg) {
                        alert(strengthMsg);
                        return;
                    }
                    if (pwd) payload.password = pwd;
                }
                try {
                    let userId = id;
                    if (mode === 'edit' && id) {
                        await authFetch(`utenti/${id}`, {
                            method: 'PUT',
                            json: true,
                            body: payload,
                        });
                    } else {
                        const res = await authFetch('utenti', {
                            method: 'POST',
                            json: true,
                            body: payload,
                        });
                        if (res && res.id) userId = String(res.id);
                    }
                    // Sincronizza gruppi selezionati in un unico submit
                    const selectedIds = getSelectedGroupIdsFromMulti();
                    if (userId) {
                        await syncUserGroups(Number(userId), selectedIds);
                        // Imposta supervisor
                        if (dom.userSupervisorSelect) {
                            const supId = dom.userSupervisorSelect.value || '';
                            await authFetch(`utenti/${userId}/set_supervisor/${supId || 0}`, {
                                method: 'POST',
                            });
                        }
                    }
                    closeAllModals();
                    // Aggiorna sia utenti che gruppi per avere badge e conteggi coerenti
                    await Promise.all([loadUsers(), loadGroups()]);
                    renderUsersList();
                } catch (e) {
                    alert(e.message || 'Errore salvataggio utente.');
                }
            });
        }

        if (btnUserAddGroup) {
            btnUserAddGroup.addEventListener('click', async () => {
                const uid = formManageUser?.elements?.id?.value;
                const gid = userGroupIdHidden?.value;
                if (!uid || !gid) return;
                try {
                    await authFetch(`gruppi/${gid}/add/${uid}`, { method: 'POST' });
                    await refreshUserGroups(uid);
                    userGroupLabel.value = '';
                    userGroupIdHidden.value = '';
                } catch (e) {
                    alert(e.message || "Errore aggiunta gruppo all'utente.");
                }
            });
        }

        if (userGroupsSection) {
            userGroupsSection.addEventListener('click', async (ev) => {
                const btn = ev.target.closest('[data-action="remove-group-from-user"]');
                if (!btn) return;
                const uid = btn.dataset.userId;
                const gid = btn.dataset.groupId;
                if (!uid || !gid) return;
                try {
                    await authFetch(`gruppi/${gid}/remove/${uid}`, { method: 'DELETE' });
                    await refreshUserGroups(uid);
                } catch (e) {
                    alert(e.message || "Errore rimozione gruppo dall'utente.");
                }
            });
        }

        if (btnDeleteUser) {
            btnDeleteUser.addEventListener('click', async () => {
                const id = formManageUser?.elements?.id?.value;
                if (!id) return;
                if (!confirm("Confermi l'eliminazione dell'utente?")) return;
                try {
                    await authFetch(`utenti/${id}`, { method: 'DELETE' });
                    closeAllModals();
                    await loadUsers();
                    renderUsersList();
                } catch (e) {
                    alert(e.message || 'Errore eliminazione utente.');
                }
            });
        }

        const handleDeleteUser = async (id) => {
            if (!confirm("Confermi l'eliminazione dell'utente?")) return;
            try {
                await authFetch(`utenti/${id}`, { method: 'DELETE' });
                await loadUsers();
                renderUsersList();
            } catch (e) {
                alert(e.message || 'Errore eliminazione utente.');
            }
        };

        const handleRestoreUser = async (id) => {
            try {
                await authFetch(`utenti/${id}`, {
                    method: 'PUT',
                    json: true,
                    body: { stato: 'ATTIVO' },
                });
                await loadUsers();
                renderUsersList();
            } catch (e) {
                alert(e.message || 'Errore ripristino utente.');
            }
        };

        // Supervisor helpers e audit ruoli
        const populateSupervisedMulti = () => {
            if (!dom.supervisedMulti) return;
            dom.supervisedMulti.innerHTML = '';
            const usersOnly = state.users.filter((u) => (u.ruolo || '').toUpperCase() === 'USER');
            usersOnly.forEach((u) => {
                const opt = document.createElement('option');
                opt.value = u.id;
                opt.textContent = buildUserLabel(u);
                dom.supervisedMulti.appendChild(opt);
            });
            // Bind esplicito al bottone logout nella topbar (fuori da #dashboard-main)
            try {
                const topLogout = document.querySelector('[data-action="logout"]');
                if (topLogout && !topLogout._boundLogout) {
                    topLogout.addEventListener('click', (e) => {
                        e.preventDefault();
                        performLogout();
                    });
                    topLogout._boundLogout = true;
                }
            } catch (e) {
                /* ignore */
            }
        };

        const preselectSupervised = async (supervisorId) => {
            if (!dom.supervisedMulti || !supervisorId) return;
            let list = [];
            try {
                list = await authFetch(`utenti/${supervisorId}/supervised`);
            } catch (e) {
                list = [];
            }
            list = Array.isArray(list) ? list : [];
            const ids = new Set(list.map((u) => Number(u.id)));
            [...dom.supervisedMulti.options].forEach((opt) => {
                opt.selected = ids.has(Number(opt.value));
            });
        };

        const saveSupervised = async () => {
            if (!state.permissions.manageRoles) {
                alert('Permesso negato.');
                return;
            }
            const supervisorId = dom.roleUserSelect?.value;
            if (!supervisorId) {
                alert('Seleziona un supervisor.');
                return;
            }
            const selected = [...(dom.supervisedMulti?.selectedOptions || [])].map((o) =>
                Number(o.value),
            );
            let current = [];
            try {
                current = await authFetch(`utenti/${supervisorId}/supervised`);
            } catch (e) {
                current = [];
            }
            const currentIds = new Set(
                (Array.isArray(current) ? current : []).map((u) => Number(u.id)),
            );
            const selectedSet = new Set(selected);
            const toAdd = [...selectedSet].filter((id) => !currentIds.has(id));
            const toRemove = [...currentIds].filter((id) => !selectedSet.has(id));
            for (const id of toAdd) {
                await authFetch(`utenti/${supervisorId}/add_supervised/${id}`, { method: 'POST' });
            }
            for (const id of toRemove) {
                await authFetch(`utenti/${supervisorId}/remove_supervised/${id}`, {
                    method: 'DELETE',
                });
            }
            alert('Associazioni aggiornate.');
        };

        dom.supervisedSaveBtn?.addEventListener('click', saveSupervised);

        async function loadRoleAudit() {
            const el = dom.auditRolesList;
            if (!el) return;
            el.innerHTML = '<p>Caricamento...</p>';
            try {
                const limit =
                    Number(state.config?.auditRoleLimit || AUDIT_ROLE_LIMIT) || AUDIT_ROLE_LIMIT;
                const rows = await authFetch(`audit_roles?limit=${encodeURIComponent(limit)}`);
                const list = Array.isArray(rows) ? rows : [];
                if (!list.length) {
                    el.innerHTML = '<p class="form-hint">Nessuna modifica recente.</p>';
                    return;
                }
                const mapUser = (id) => {
                    const u = state.users.find((x) => Number(x.id) === Number(id));
                    return u ? buildUserLabel(u) : `Utente #${id}`;
                };
                const html =
                    `<table class="table"><thead><tr><th>Data</th><th>Utente</th><th>Ruolo</th><th>Modificato da</th></tr></thead><tbody>` +
                    list
                        .map(
                            (r) =>
                                `<tr><td>${sanitize(r.changed_at || '')}</td><td>${mapUser(r.target_user_id)}<br><small>${sanitize(r.old_role || '')} → ${sanitize(r.new_role || '')}</small></td><td>${sanitize(r.new_role || '')}</td><td>${mapUser(r.changed_by_user_id)}</td></tr>`,
                        )
                        .join('') +
                    `</tbody></table>`;
                el.innerHTML = html;
            } catch (e) {
                el.innerHTML = '<p class="empty-state">Errore nel caricamento.</p>';
            }
        }

        function renderAuthAudit() {
            const wrap = dom.auditAuthResults || dom.auditAuthList;
            if (!wrap) return;
            const rows = Array.isArray(state.auditAuth) ? state.auditAuth : [];
            if (!rows.length) {
                wrap.innerHTML = '<p class="form-hint">Nessun evento recente.</p>';
                return;
            }
            const selUser = dom.filterAuthUser?.value || 'all';
            const selAction = (dom.filterAuthAction?.value || 'all').toUpperCase();
            const from = dom.filterAuthFrom?.value || '';
            const to = dom.filterAuthTo?.value || '';
            const parseDate = (s) => {
                if (!s) return null;
                const d = new Date(s.replace(' ', 'T'));
                return isNaN(d.getTime()) ? null : d;
            };
            let fromDate = parseDate(from ? `${from}T00:00:00` : '');
            let toDate = parseDate(to ? `${to}T23:59:59` : '');
            const filtered = rows.filter((r) => {
                if (selUser !== 'all' && String(r.user_id) !== String(selUser)) return false;
                if (selAction !== 'ALL' && String(r.action || '').toUpperCase() !== selAction)
                    return false;
                const dt = parseDate(r.created_at || '') || null;
                if (fromDate && dt && dt < fromDate) return false;
                if (toDate && dt && dt > toDate) return false;
                return true;
            });
            const mapUser = (id) => {
                const u = state.users.find((x) => Number(x.id) === Number(id));
                return u ? buildUserLabel(u) : `Utente #${id}`;
            };
            wrap.innerHTML =
                `<table class="table"><thead><tr><th>Data</th><th>Utente</th><th>Azione</th><th>IP</th><th>User Agent</th></tr></thead><tbody>` +
                filtered
                    .map(
                        (r) =>
                            `<tr><td>${sanitize(r.created_at || '')}</td><td>${mapUser(r.user_id)}</td><td>${sanitize(r.action || '')}</td><td>${sanitize(r.ip || '')}</td><td><small>${sanitize(r.user_agent || '')}</small></td></tr>`,
                    )
                    .join('') +
                `</tbody></table>`;
        }

        async function loadAuthAudit() {
            if (!dom.auditAuthList) return;
            dom.auditAuthResults
                ? (dom.auditAuthResults.innerHTML = '<p>Caricamento...</p>')
                : (dom.auditAuthList.innerHTML = '<p>Caricamento...</p>');
            try {
                const defaultLimit =
                    Number(state.config?.auditAuthDefaultLimit || AUDIT_AUTH_DEFAULT_LIMIT) ||
                    AUDIT_AUTH_DEFAULT_LIMIT;
                const limit =
                    parseInt(dom.filterAuthLimit?.value || String(defaultLimit), 10) ||
                    defaultLimit;
                const rows = await authFetch(`auth_audit?limit=${encodeURIComponent(limit)}`);
                state.auditAuth = Array.isArray(rows) ? rows : [];
                renderAuthAudit();
            } catch (e) {
                const el = dom.auditAuthResults || dom.auditAuthList;
                if (el) el.innerHTML = '<p class="empty-state">Errore nel caricamento.</p>';
            }
        }

        function populateAuthAuditUserFilter() {
            const sel = dom.filterAuthUser;
            if (!sel) return;
            const current = sel.value || 'all';
            sel.innerHTML = '<option value="all">Tutti</option>';
            (state.users || []).forEach((u) => {
                const opt = document.createElement('option');
                opt.value = u.id;
                opt.textContent = buildUserLabel(u);
                sel.appendChild(opt);
            });
            sel.value = current;
        }

        const applyRuntimeConfigFromData = () => {
            try {
                const el = dom.main || document.body;
                const role = Number(el?.dataset?.auditRoleLimit || NaN);
                const auth = Number(el?.dataset?.auditAuthDefaultLimit || NaN);
                if (!Number.isNaN(role) && role > 0) state.config.auditRoleLimit = role;
                if (!Number.isNaN(auth) && auth > 0) state.config.auditAuthDefaultLimit = auth;
            } catch (e) {
                /* ignore */
            }
        };

        const loadRuntimeConfig = async () => {
            try {
                const cfg = await authFetch('config');
                if (cfg && typeof cfg === 'object') {
                    const role = Number(cfg.audit_role_limit || NaN);
                    const auth = Number(cfg.audit_auth_default_limit || NaN);
                    if (!Number.isNaN(role) && role > 0) state.config.auditRoleLimit = role;
                    if (!Number.isNaN(auth) && auth > 0) state.config.auditAuthDefaultLimit = auth;
                }
            } catch (e) {
                /* ignore */
            }
        };

        const updateAuditBadges = () => {
            try {
                if (dom.badgeAuditRolesLimit) {
                    const v =
                        Number(state.config?.auditRoleLimit || AUDIT_ROLE_LIMIT) ||
                        AUDIT_ROLE_LIMIT;
                    dom.badgeAuditRolesLimit.textContent = `Limite: ${v}`;
                }
                if (dom.badgeAuditAuthLimit) {
                    const def =
                        Number(state.config?.auditAuthDefaultLimit || AUDIT_AUTH_DEFAULT_LIMIT) ||
                        AUDIT_AUTH_DEFAULT_LIMIT;
                    const sel = parseInt(dom.filterAuthLimit?.value || String(def), 10) || def;
                    dom.badgeAuditAuthLimit.textContent = `Limite: ${sel}`;
                }
            } catch (e) {
                /* ignore */
            }
        };

        const showToast = (message, { type = 'info', duration = 5000 } = {}) => {
            try {
                let container = dom.toastContainer || document.getElementById('toast-container');
                if (!container) {
                    container = document.createElement('div');
                    container.id = 'toast-container';
                    container.className = 'toast-container';
                    document.body.appendChild(container);
                    dom.toastContainer = container;
                }
                const t = document.createElement('div');
                t.className = `toast toast--${type}`;
                t.textContent = sanitize(message || '');
                t.addEventListener('click', () => {
                    t.remove();
                });
                container.appendChild(t);
                requestAnimationFrame(() => {
                    t.classList.add('is-visible');
                });
                setTimeout(
                    () => {
                        t.classList.remove('is-visible');
                        setTimeout(() => t.remove(), 180);
                    },
                    Math.max(2000, duration),
                );
            } catch (e) {
                /* ignore */
            }
        };

        const runDiagnostics = async () => {
            if (!dom.diagResults) return;
            const lines = [];
            const api = apiBase;
            const token = !!window.lpwfAuth?.getToken?.();
            lines.push(`<strong>API base:</strong> ${sanitize(api)}`);
            lines.push(`<strong>Token presente:</strong> ${token ? 'Sì' : 'No'}`);
            // Auth check via auth/me
            let authOk = false;
            let me = null;
            try {
                me = await authFetch('auth/me');
                authOk = !!me?.id;
            } catch (e) {
                authOk = false;
            }
            lines.push(`<strong>Auth OK:</strong> ${authOk ? 'Sì' : 'No'}`);
            if (authOk)
                lines.push(
                    `<strong>Utente:</strong> ${sanitize(buildUserLabel(me))} [#${sanitize(me.id)}]`,
                );
            // Config
            try {
                const cfg = await authFetch('config');
                lines.push(
                    `<strong>Audit Ruoli limit:</strong> ${sanitize(cfg?.audit_role_limit ?? '—')}`,
                );
                lines.push(
                    `<strong>Audit Auth default limit:</strong> ${sanitize(cfg?.audit_auth_default_limit ?? '—')}`,
                );
            } catch (e) {
                lines.push('<em>Config non disponibile</em>');
            }
            // Health (no auth required)
            try {
                const res = await fetch(`${api}/health`);
                const h = await res.json();
                const db = h?.db_ok ? 'OK' : 'KO';
                lines.push(`<strong>DB:</strong> ${db}`);
                const tables = h?.tables || {};
                const counts = h?.counts || {};
                const t1 = tables.auth_audit ? `presente (${counts.auth_audit ?? '?'})` : 'assente';
                const t2 = tables.user_role_audit
                    ? `presente (${counts.user_role_audit ?? '?'})`
                    : 'assente';
                lines.push(`<strong>auth_audit:</strong> ${t1}`);
                lines.push(`<strong>user_role_audit:</strong> ${t2}`);
            } catch (e) {
                lines.push('<em>Health API non raggiungibile</em>');
            }
            // Tenant health (no auth required)
            try {
                const resT = await fetch(`${api}/tenant_health`);
                const th = await resT.json();
                const db2 = th?.db_ok ? 'OK' : 'KO';
                lines.push(`<strong>Tenant DB:</strong> ${db2}`);
                const tablesT = th?.tables || {};
                const countsT = th?.counts || {};
                const show = (name, label) => {
                    const ok = !!tablesT[name];
                    const c = countsT[name];
                    lines.push(
                        `<strong>${sanitize(label)}:</strong> ${ok ? `presente (${c ?? '?'})` : 'assente'}`,
                    );
                };
                show('utenti', 'utenti');
                show('clienti', 'clienti');
                show('gruppi', 'gruppi');
                show('workflow_modelli', 'workflow_modelli');
                show('workflow_passi', 'workflow_passi');
                show('workflow_istanze', 'workflow_istanze');
                show('workflow_task', 'workflow_task');
                show('documenti', 'documenti');
                // Migrazione geocoding (lat/long) su clienti
                try {
                    const cols = th?.clienti_columns || {};
                    const latOk = !!cols.latitudine;
                    const lonOk = !!cols.longitudine;
                    const both = latOk && lonOk ? 'Sì' : 'No';
                    lines.push(
                        `<strong>Geocoding (lat/long) clienti:</strong> ${both} ${both === 'Sì' ? '' : '(eseguire tools/setup_tenant_db.php)'}`,
                    );
                } catch (e) {
                    /* ignore */
                }
            } catch (e) {
                lines.push('<em>Tenant health non raggiungibile</em>');
            }
            dom.diagResults.innerHTML = `<ul class="diag-list">${lines.map((l) => `<li>${l}</li>`).join('')}</ul>`;
        };

        const openAuditAuthPanel = (limit = null) => {
            try {
                // Solo Admin: rispettare permessi viewAudit
                if (!state.permissions || !state.permissions.viewAudit) {
                    try {
                        showToast('Permesso negato', { type: 'error' });
                    } catch (e) {}
                    return;
                }
                // Assicura che la sezione Config sia visibile
                const cfgSection = document.getElementById('config');
                if (cfgSection) cfgSection.hidden = false;
                // Imposta limite se passato
                if (limit && dom.filterAuthLimit) {
                    dom.filterAuthLimit.value = String(limit);
                }
                // Ricarica audit e badge
                loadAuthAudit();
                updateAuditBadges();
                // Scroll al pannello Audit Autenticazione
                const panel = document.querySelector('article[data-resource="audit-auth"]');
                panel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } catch (e) {
                /* ignore */
            }
        };

        const openAuditRolesPanel = () => {
            try {
                // Solo Admin: rispettare permessi viewAudit
                if (!state.permissions || !state.permissions.viewAudit) {
                    try {
                        showToast('Permesso negato', { type: 'error' });
                    } catch (e) {}
                    return;
                }
                const cfgSection = document.getElementById('config');
                if (cfgSection) cfgSection.hidden = false;
                loadRoleAudit();
                updateAuditBadges();
                const panel = document.querySelector('article[data-resource="audit-roles"]');
                panel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } catch (e) {
                /* ignore */
            }
        };

        const setRolesAuditLimit = (limit) => {
            try {
                const v = Number(limit);
                if (!Number.isNaN(v) && v > 0) {
                    state.config.auditRoleLimit = v;
                    loadRoleAudit();
                    updateAuditBadges();
                }
            } catch (e) {
                /* ignore */
            }
        };

        (async () => {
            try {
                await ensureUserContext();
                applyPermissions();
                renderStatusBar();
                loadSeenSubflows();
                applyRuntimeConfigFromData();
                await loadRuntimeConfig();
                await loadUsers();
                populateAuthAuditUserFilter();
                renderUsersList();
                if (state.permissions.manageRoles) {
                    loadRoleAudit();
                }
                if (state.permissions.viewConfig) {
                    loadAuthAudit();
                }
                initializeUserSelector();
                initializeSearch();
                initializeActionGuards();
                setupFilters();
                await loadActions();
                await Promise.all([
                    loadTasks(),
                    loadWorkflows(),
                    loadTicketMetrics(),
                    (async () => {
                        await loadInstances();
                        await updateInstanceAssignees();
                    })(),
                    loadGroups(),
                    loadClients(),
                    loadProductFilters(),
                    loadProducts(),
                ]);
                // Se Supervisor/Admin, mostra metriche team e caricale
                try {
                    const role = (state.currentUserInfo?.ruolo || '').toUpperCase();
                    if (role === 'ADMIN' || role === 'SUPERVISOR') {
                        const open = document.getElementById('metric-card-ticket-open-team');
                        const doing = document.getElementById('metric-card-ticket-doing-team');
                        const closed = document.getElementById('metric-card-ticket-closed30-team');
                        if (open) open.hidden = false;
                        if (doing) doing.hidden = false;
                        if (closed) closed.hidden = false;
                        await loadTeamTicketMetrics();
                    }
                } catch (e) { /* ignore */ }
                // Aggiorna i badge health in alto
                updateHealthBadges();
                setupMapControls();
                const formEditWf = document.getElementById('form-edit-workflow');
                if (formEditWf) formEditWf.addEventListener('submit', handleEditWorkflowSubmit);
                setupTabsUI();
                setupCollapsiblePanels();
                renderStatusBar();
            } catch (error) {
                alert(
                    (error && error.message) ||
                        "Errore durante l'inizializzazione della dashboard.",
                );
            }
        })();
    });
})(document);
        // Services panel DOM
        const svc = {
            status: document.getElementById('services-status'),
            btnRefresh: document.getElementById('btn-services-refresh'),
            waTo: document.getElementById('svc-wa-to'),
            waMsg: document.getElementById('svc-wa-msg'),
            btnWa: document.getElementById('btn-svc-wa'),
            btnWaWeb: document.getElementById('btn-svc-wa-web'),
            emTo: document.getElementById('svc-em-to'),
            emSubj: document.getElementById('svc-em-subj'),
            emBody: document.getElementById('svc-em-body'),
            btnEm: document.getElementById('btn-svc-em'),
            payGw: document.getElementById('svc-pay-gw'),
            payAmt: document.getElementById('svc-pay-amount'),
            btnPay: document.getElementById('btn-svc-pay'),
            ordCust: document.getElementById('svc-ord-customer'),
            ordSku: document.getElementById('svc-ord-sku'),
            ordQty: document.getElementById('svc-ord-qty'),
            btnOrder: document.getElementById('btn-svc-order'),
            docType: document.getElementById('svc-doc-type'),
            btnDoc: document.getElementById('btn-svc-doc'),
            tkTitle: document.getElementById('svc-tk-title'),
            tkPrio: document.getElementById('svc-tk-prio'),
            btnTicket: document.getElementById('btn-svc-ticket'),
            chChannel: document.getElementById('svc-ch-channel'),
            chMsg: document.getElementById('svc-ch-msg'),
            btnChat: document.getElementById('btn-svc-chat'),
            out: document.getElementById('services-test-output'),
            logs: document.getElementById('services-logs'),
            btnRetryFailed: document.getElementById('btn-services-retry-failed'),
            btnLoadLogs: document.getElementById('btn-services-load-logs'),
            filterService: document.getElementById('svc-log-service'),
            filterStatus: document.getElementById('svc-log-status'),
            btnApplyFilters: document.getElementById('btn-services-apply-filters'),
            filterSearch: document.getElementById('svc-log-search'),
            btnExportCsv: document.getElementById('btn-services-export-csv'),
            badgeOk: document.getElementById('svc-log-badge-ok'),
            badgeErr: document.getElementById('svc-log-badge-err'),
            autoToggle: document.getElementById('svc-autorefresh'),
            nextLogs: document.getElementById('svc-next-logs'),
            nextStatus: document.getElementById('svc-next-status'),
        };

        // Services panel preferences (localStorage)
        const SVC_PREFS_KEY = 'lpwf_svc_prefs';
        const loadSvcPrefs = () => {
            try {
                const raw = window.localStorage.getItem(SVC_PREFS_KEY);
                return raw ? JSON.parse(raw) : {};
            } catch (e) {
                return {};
            }
        };
        const saveSvcPrefs = (patch) => {
            try {
                const cur = loadSvcPrefs();
                const next = { ...cur, ...patch };
                window.localStorage.setItem(SVC_PREFS_KEY, JSON.stringify(next));
            } catch (e) {}
        };
        const applySvcPrefsToUI = () => {
            const prefs = loadSvcPrefs();
            if (svc.autoToggle && typeof prefs.auto === 'boolean') svc.autoToggle.checked = !!prefs.auto;
            if (svc.filterService && prefs.service) svc.filterService.value = prefs.service;
            if (svc.filterStatus && prefs.status) svc.filterStatus.value = prefs.status;
            if (svc.filterSearch && typeof prefs.q === 'string') svc.filterSearch.value = prefs.q;
        };
        // Apply early (before timers start)
        applySvcPrefsToUI();

        // Modal dettaglio log servizi
        const svcDet = {
            created: document.getElementById('svc-det-created'),
            service: document.getElementById('svc-det-service'),
            action: document.getElementById('svc-det-action'),
            provider: document.getElementById('svc-det-provider'),
            status: document.getElementById('svc-det-status'),
            http: document.getElementById('svc-det-http'),
            req: document.getElementById('svc-det-request'),
            res: document.getElementById('svc-det-response'),
            copyReq: document.getElementById('btn-svc-copy-request'),
            copyRes: document.getElementById('btn-svc-copy-response'),
        };

        const prettyJson = (txt) => {
            if (txt === null || txt === undefined) return '';
            const s = String(txt);
            try { const obj = JSON.parse(s); return JSON.stringify(obj, null, 2); } catch (e) { return s; }
        };

        function viewServiceLog(id) {
            const idNum = Number(id);
            if (!idNum || !Array.isArray(servicesLogsCache)) return;
            const row = servicesLogsCache.find((r) => Number(r.id) === idNum);
            if (!row) return;
            if (svcDet.created) svcDet.created.textContent = row.created_at || '';
            if (svcDet.service) svcDet.service.textContent = row.service || '';
            if (svcDet.action) svcDet.action.textContent = row.action || '';
            if (svcDet.provider) svcDet.provider.textContent = row.provider || '';
            if (svcDet.status) svcDet.status.textContent = row.status || '';
            if (svcDet.http) svcDet.http.textContent = String(row.http_code ?? '');
            if (svcDet.req) svcDet.req.textContent = prettyJson(row.request || '');
            if (svcDet.res) svcDet.res.textContent = prettyJson(row.response || '');
            openModal('modal-service-log');
        }

        // API fetch helper (global-friendly) for services section
        const apiFetch = async (endpoint, options = {}) => {
            const base = (
                window.lpwfAuth?.getApiBase?.() ||
                window.lpwfAuth?.ensureBaseForLocation?.() ||
                '/api'
            ).replace(/\/$/, '');
            const init = {
                method: options.method || 'GET',
                headers: window.lpwfAuth?.buildHeaders?.(options.headers || {}, options.json === true) || {},
            };
            if (options.body !== undefined) {
                init.body = options.json ? JSON.stringify(options.body) : options.body;
            }
            const url = `${base}/${String(endpoint || '').replace(/^\/+/, '')}`;
            let response;
            try { response = await fetch(url, init); } catch (e) { throw e; }
            const text = await response.text();
            let payload = null; if (text) { try { payload = JSON.parse(text); } catch (e) { /* ignore */ } }
            if (!response.ok) {
                if (response.status === 401) {
                    window.lpwfAuth?.clearToken?.();
                    alert((payload && payload.message) || 'Sessione scaduta. Effettua nuovamente il login.');
                    window.location.href = 'login.html';
                    throw new Error('Non autenticato');
                }
                throw new Error((payload && payload.message) || `Errore HTTP ${response.status}`);
            }
            return payload;
        };

        const callService = async (path, payload) => {
            const res = await apiFetch(`services/${path}`, { method: 'POST', json: true, body: payload });
            return res;
        };

        async function loadServiceStatus() {
            if (!svc.status) return;
            try {
                const s = await apiFetch('services/status');
                const st = s?.status || {};
                const yes = (v) => (v ? '<span class="badge">Sì</span>' : '<span class="badge">No</span>');
                svc.status.innerHTML = `
                    <div class="form-grid">
                      <div class="form-control"><span>WhatsApp provider</span><div>${sanitize(st.whatsapp?.provider || '—')}</div></div>
                      <div class="form-control"><span>WhatsApp configurato</span><div>${st.whatsapp?.configured ? yes(true) : yes(false)}</div></div>
                      <div class="form-control"><span>Email provider</span><div>${sanitize(st.email?.provider || 'smtp')}</div></div>
                      <div class="form-control"><span>Email configurato</span><div>${st.email?.configured ? yes(true) : yes(false)}</div></div>
                      <div class="form-control"><span>Email from</span><div>${sanitize(st.email?.from || '—')}</div></div>
                      <div class="form-control"><span>Stripe</span><div>${st.payment?.stripe ? yes(true) : yes(false)}</div></div>
                      <div class="form-control"><span>Valuta</span><div>${sanitize(st.payment?.currency || 'EUR')}</div></div>
                    </div>`;
            } catch (e) {
                svc.status.innerHTML = '<p class="empty-state">Errore stato servizi.</p>';
            }
        }

        let servicesLogsCache = [];
        function renderServiceLogs() {
            if (!svc.logs) return;
            const serviceSel = (svc.filterService?.value || 'all').toLowerCase();
            const statusSel = (svc.filterStatus?.value || 'all').toUpperCase();
            const q = (svc.filterSearch?.value || '').toLowerCase().trim();
            let rows = Array.isArray(servicesLogsCache) ? [...servicesLogsCache] : [];
            if (serviceSel !== 'all') rows = rows.filter(r => String(r.service || '').toLowerCase() === serviceSel);
            if (statusSel !== 'ALL') rows = rows.filter(r => String(r.status || '').toUpperCase() === statusSel);
            if (q) {
                rows = rows.filter(r => {
                    const hay = [
                        r.created_at, r.service, r.action, r.provider, r.status,
                        String(r.http_code ?? ''), r.user_id,
                        r.request, r.response,
                    ].map(x => (x === null || x === undefined) ? '' : String(x).toLowerCase());
                    return hay.some(s => s.includes(q));
                });
            }
            // Update badges counts
            try {
                const ok = rows.filter(r => String(r.status||'').toUpperCase()==='OK').length;
                const err = rows.filter(r => String(r.status||'').toUpperCase()==='ERR').length;
                if (svc.badgeOk) svc.badgeOk.textContent = `OK: ${ok}`;
                if (svc.badgeErr) svc.badgeErr.textContent = `ERR: ${err}`;
            } catch (e) {}
            if (!rows.length) { svc.logs.innerHTML = '<p class="form-hint">Nessun log.</p>'; return; }
            const html = `<table class="table"><thead><tr><th>Data</th><th>Servizio</th><th>Azione</th><th>Provider</th><th>Stato</th><th>HTTP</th><th></th></tr></thead><tbody>` +
                rows.map(r => {
                    const retryBtn = String(r.status||'').toUpperCase() === 'ERR' ? `<button type=\"button\" class=\"btn\" data-action=\"svc-retry\" data-id=\"${Number(r.id)}\">Retry</button>` : '';
                    const viewBtn = `<button type=\"button\" class=\"btn\" data-action=\"svc-view\" data-id=\"${Number(r.id)}\">Dettaglio</button>`;
                    return `<tr><td>${sanitize(r.created_at || '')}</td><td>${sanitize(r.service || '')}</td><td>${sanitize(r.action || '')}</td><td>${sanitize(r.provider || '')}</td><td>${sanitize(r.status || '')}</td><td>${sanitize(String(r.http_code ?? ''))}</td><td>${viewBtn} ${retryBtn}</td></tr>`;
                }).join('') +
                '</tbody></table>';
            svc.logs.innerHTML = `<div class="table-wrap">${html}</div>`;
        }

        async function loadServiceLogs() {
            if (!svc.logs) return;
            try {
                const rows = await apiFetch('service_logs?limit=200');
                servicesLogsCache = Array.isArray(rows) ? rows : [];
                renderServiceLogs();
            } catch (e) {
                svc.logs.innerHTML = '<p class="empty-state">Errore caricamento log.</p>';
            }
        }

        async function retryFailed(limit = 20, sinceHours = 24) {
            try {
                await apiFetch('services/retry_failed', { method: 'POST', json: true, body: { limit, since_hours: sinceHours } });
                await loadServiceLogs();
                try { showToast('Retry eseguito', { type: 'success' }); } catch (e) {}
            } catch (e) {
                alert(e.message || 'Errore retry falliti');
            }
        }

        // Hook UI services
        if (svc.btnRefresh) svc.btnRefresh.addEventListener('click', loadServiceStatus);
        // Carica stato provider all'avvio per evitare placeholder bloccato
        try { loadServiceStatus(); } catch (e) {}
        if (svc.btnWa) svc.btnWa.addEventListener('click', async () => {
            const to = (svc.waTo?.value || '').trim();
            const msg = svc.waMsg?.value || '';
            try {
                const r = await callService('whatsapp', { to, message: msg });
                svc.out.textContent = JSON.stringify(r, null, 2);
                const ok = !!(r?.result?.ok ?? r?.ok ?? true);
                const code = r?.result?.code ?? r?.code ?? '';
                try { showToast(`WhatsApp: ${ok ? 'inviato' : 'errore'}${code ? ' ('+code+')' : ''}`, { type: ok ? 'success' : 'danger' }); } catch (e) {}
            } catch (e) {
                svc.out.textContent = e.message || 'Errore';
                try { showToast('WhatsApp: errore', { type: 'danger' }); } catch (e2) {}
            }
        });
        if (svc.btnWaWeb) svc.btnWaWeb.addEventListener('click', async () => {
            const to = (svc.waTo?.value || '').trim();
            const msg = svc.waMsg?.value || '';
            if (!to) { try { showToast('Inserisci un numero', { type: 'warning' }); } catch (e) {} return; }
            const digits = String(to).replace(/[^\d]/g, '');
            if (!digits) { try { showToast('Numero non valido', { type: 'danger' }); } catch (e) {} return; }
            const base = `https://wa.me/${digits}`;
            const url = msg ? `${base}?text=${encodeURIComponent(msg)}` : base;
            try { window.open(url, '_blank', 'noopener'); } catch (e) { window.location.href = url; }
            // Log manuale (non bloccante)
            try { await apiFetch('services/whatsapp_log', { method: 'POST', json: true, body: { to, message: msg, link: url } }); } catch (e) {}
        });
        if (svc.btnEm) svc.btnEm.addEventListener('click', async () => {
            const to = (svc.emTo?.value || '').trim();
            const subject = (svc.emSubj?.value || '').trim();
            const isHtml = !!document.getElementById('svc-em-html')?.checked;
            const htmlEl = document.getElementById('svc-em-body-html');
            const body = isHtml ? (htmlEl?.value || '') : (svc.emBody?.value || '');
            try {
                const r = await callService('email', { to, subject, body });
                svc.out.textContent = JSON.stringify(r, null, 2);
                const ok = !!(r?.result?.ok ?? r?.ok ?? true);
                const code = r?.result?.code ?? r?.code ?? '';
                try { showToast(`Email: ${ok ? 'inviata' : 'errore'}${code ? ' ('+code+')' : ''}`, { type: ok ? 'success' : 'danger' }); } catch (e) {}
            } catch (e) {
                svc.out.textContent = e.message || 'Errore';
                try { showToast('Email: errore', { type: 'danger' }); } catch (e2) {}
            }
        });

        // Toggle textarea HTML visibility
        try {
            const wrap = document.getElementById('svc-em-body-html-wrap');
            const chk = document.getElementById('svc-em-html');
            if (chk && wrap) {
                const toggle = () => { wrap.hidden = !chk.checked; };
                toggle();
                chk.addEventListener('change', toggle);
            }
        } catch (e) {}
        if (svc.btnPay) svc.btnPay.addEventListener('click', async () => {
            const gateway = svc.payGw?.value || 'STRIPE';
            const amount = Number(svc.payAmt?.value || 0);
            try {
                const r = await callService('payment', { gateway, amount });
                svc.out.textContent = JSON.stringify(r, null, 2);
                const ok = !!(r?.result?.ok ?? r?.ok ?? true);
                const code = r?.result?.code ?? r?.code ?? '';
                try { showToast(`Pagamento: ${ok ? 'inviato' : 'errore'}${code ? ' ('+code+')' : ''}`, { type: ok ? 'success' : 'danger' }); } catch (e) {}
            } catch (e) {
                svc.out.textContent = e.message || 'Errore';
                try { showToast('Pagamento: errore', { type: 'danger' }); } catch (e2) {}
            }
        });
        if (svc.btnRetryFailed) svc.btnRetryFailed.addEventListener('click', () => retryFailed(20, 24));
        if (svc.btnLoadLogs) svc.btnLoadLogs.addEventListener('click', loadServiceLogs);
        if (svc.btnApplyFilters) svc.btnApplyFilters.addEventListener('click', () => {
            // Save filters
            saveSvcPrefs({
                service: svc.filterService?.value || 'all',
                status: svc.filterStatus?.value || 'all',
                q: svc.filterSearch?.value || '',
            });
            renderServiceLogs();
        });
        if (svc.filterService) svc.filterService.addEventListener('change', () => saveSvcPrefs({ service: svc.filterService.value || 'all' }));
        if (svc.filterStatus) svc.filterStatus.addEventListener('change', () => saveSvcPrefs({ status: svc.filterStatus.value || 'all' }));
        if (svc.filterSearch) {
            const onSearch = () => saveSvcPrefs({ q: svc.filterSearch.value || '' });
            try {
                // Debounce if available
                const _deb = (fn, ms = 300) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
                svc.filterSearch.addEventListener('input', _deb(onSearch, 400));
            } catch (e) {
                svc.filterSearch.addEventListener('input', onSearch);
            }
        }
        if (svc.btnOrder) svc.btnOrder.addEventListener('click', async () => {
            const customer_id = (svc.ordCust?.value || '').trim();
            const sku = (svc.ordSku?.value || '').trim();
            const qty = Number(svc.ordQty?.value || 1);
            try {
                const r = await callService('order', { customer_id, items: [{ sku, qty }] });
                svc.out.textContent = JSON.stringify(r, null, 2);
                const ok = !!(r?.result?.ok ?? r?.ok ?? true);
                const code = r?.result?.code ?? r?.code ?? '';
                try { showToast(`Ordine: ${ok ? 'inviato' : 'errore'}${code ? ' ('+code+')' : ''}`, { type: ok ? 'success' : 'danger' }); } catch (e) {}
            } catch (e) {
                svc.out.textContent = e.message || 'Errore';
                try { showToast('Ordine: errore', { type: 'danger' }); } catch (e2) {}
            }
        });
        if (svc.btnDoc) svc.btnDoc.addEventListener('click', async () => {
            const type = (svc.docType?.value || 'FATTURA');
            try {
                const r = await callService('document', { type });
                svc.out.textContent = JSON.stringify(r, null, 2);
                const ok = !!(r?.result?.ok ?? r?.ok ?? true);
                const code = r?.result?.code ?? r?.code ?? '';
                try { showToast(`Documento: ${ok ? 'inviato' : 'errore'}${code ? ' ('+code+')' : ''}`, { type: ok ? 'success' : 'danger' }); } catch (e) {}
            } catch (e) {
                svc.out.textContent = e.message || 'Errore';
                try { showToast('Documento: errore', { type: 'danger' }); } catch (e2) {}
            }
        });
        if (svc.btnTicket) svc.btnTicket.addEventListener('click', async () => {
            const title = (svc.tkTitle?.value || '').trim();
            const priority = (svc.tkPrio?.value || 'MEDIA');
            try {
                const r = await callService('ticket', { title, priority });
                svc.out.textContent = JSON.stringify(r, null, 2);
                const ok = !!(r?.result?.ok ?? r?.ok ?? true);
                const code = r?.result?.code ?? r?.code ?? '';
                try { showToast(`Ticket: ${ok ? 'inviato' : 'errore'}${code ? ' ('+code+')' : ''}`, { type: ok ? 'success' : 'danger' }); } catch (e) {}
            } catch (e) {
                svc.out.textContent = e.message || 'Errore';
                try { showToast('Ticket: errore', { type: 'danger' }); } catch (e2) {}
            }
        });
        if (svc.btnChat) svc.btnChat.addEventListener('click', async () => {
            const channel = (svc.chChannel?.value || 'general').trim();
            const message = (svc.chMsg?.value || '');
            try {
                const r = await callService('chat', { channel, message });
                svc.out.textContent = JSON.stringify(r, null, 2);
                const ok = !!(r?.result?.ok ?? r?.ok ?? true);
                const code = r?.result?.code ?? r?.code ?? '';
                try { showToast(`Chat: ${ok ? 'inviato' : 'errore'}${code ? ' ('+code+')' : ''}`, { type: ok ? 'success' : 'danger' }); } catch (e) {}
            } catch (e) {
                svc.out.textContent = e.message || 'Errore';
                try { showToast('Chat: errore', { type: 'danger' }); } catch (e2) {}
            }
        });
        if (svc.btnChat) svc.btnChat.addEventListener('click', async () => {
            const channel = (svc.chChannel?.value || 'general').trim();
            const message = (svc.chMsg?.value || '');
            try { const r = await callService('chat', { channel, message }); svc.out.textContent = JSON.stringify(r, null, 2); } catch (e) { svc.out.textContent = e.message || 'Errore'; }
        });
        if (svc.btnExportCsv) svc.btnExportCsv.addEventListener('click', () => {
            const serviceSel = (svc.filterService?.value || 'all').toLowerCase();
            const statusSel = (svc.filterStatus?.value || 'all').toUpperCase();
            const q = (svc.filterSearch?.value || '').toLowerCase().trim();
            let rows = Array.isArray(servicesLogsCache) ? [...servicesLogsCache] : [];
            if (serviceSel !== 'all') rows = rows.filter(r => String(r.service || '').toLowerCase() === serviceSel);
            if (statusSel !== 'ALL') rows = rows.filter(r => String(r.status || '').toUpperCase() === statusSel);
            if (q) {
                rows = rows.filter(r => {
                    const hay = [
                        r.created_at, r.service, r.action, r.provider, r.status,
                        String(r.http_code ?? ''), r.user_id,
                        r.request, r.response,
                    ].map(x => (x === null || x === undefined) ? '' : String(x).toLowerCase());
                    return hay.some(s => s.includes(q));
                });
            }
            if (!rows.length) { alert('Nessun dato da esportare.'); return; }
            const cols = ['created_at','service','action','provider','status','http_code','user_id','request','response'];
            const esc = (v) => {
                let s = v === null || v === undefined ? '' : String(v);
                if (s.length > 500) s = s.slice(0, 500) + '…';
                s = s.replace(/"/g,'""');
                return '"' + s + '"';
            };
            const lines = [];
            lines.push(cols.join(','));
            rows.forEach(r => {
                lines.push(cols.map(k => esc(r[k])).join(','));
            });
            const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'service_logs.csv';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 200);
        });
        if (svc.logs) {
            svc.logs.addEventListener('click', async (ev) => {
                const retryBtn = ev.target.closest('[data-action="svc-retry"]');
                const viewBtn = ev.target.closest('[data-action="svc-view"]');
                if (retryBtn) {
                    const id = Number(retryBtn.dataset.id || '');
                    if (!id) return;
                    try {
                        await authFetch('services/retry', { method: 'POST', json: true, body: { id } });
                        await loadServiceLogs();
                        try { showToast('Retry inviato', { type: 'success' }); } catch (e) {}
                    } catch (e) {
                        alert(e.message || 'Errore retry');
                    }
                    return;
                }
                if (viewBtn) {
                    const id = Number(viewBtn.dataset.id || '');
                    if (!id) return;
                    viewServiceLog(id);
                    return;
                }
            });
        }

        if (svcDet.copyReq) {
            svcDet.copyReq.addEventListener('click', async () => {
                try { await navigator.clipboard.writeText(svcDet.req?.textContent || ''); showToast('Request copiata', { type: 'success' }); } catch (e) {}
            });
        }
        if (svcDet.copyRes) {
            svcDet.copyRes.addEventListener('click', async () => {
                try { await navigator.clipboard.writeText(svcDet.res?.textContent || ''); showToast('Response copiata', { type: 'success' }); } catch (e) {}
            });
        }

        // Auto-refresh with visibility + toggle
        let autoEnabled = true;
        const LOGS_IVL = 30; // seconds
        const STATUS_IVL = 60; // seconds
        let logsNextAt = 0;
        let statusNextAt = 0;
        let logsTimer = null;
        let statusTimer = null;
        let tickTimer = null;

        const canRunAuto = () => autoEnabled && !document.hidden;

        const updateCountdown = () => {
            try {
                const now = Date.now();
                const secLogs = Math.max(0, Math.ceil((logsNextAt - now) / 1000));
                const secStatus = Math.max(0, Math.ceil((statusNextAt - now) / 1000));
                if (svc.nextLogs) svc.nextLogs.textContent = canRunAuto() ? `${secLogs}s` : 'pausa';
                if (svc.nextStatus) svc.nextStatus.textContent = canRunAuto() ? `${secStatus}s` : 'pausa';
            } catch (e) {}
        };

        const scheduleLogs = () => {
            if (logsTimer) clearTimeout(logsTimer);
            logsNextAt = Date.now() + LOGS_IVL * 1000;
            logsTimer = setTimeout(async () => {
                if (canRunAuto()) {
                    await loadServiceLogs();
                }
                scheduleLogs();
            }, LOGS_IVL * 1000);
        };
        const scheduleStatus = () => {
            if (statusTimer) clearTimeout(statusTimer);
            statusNextAt = Date.now() + STATUS_IVL * 1000;
            statusTimer = setTimeout(async () => {
                if (canRunAuto()) {
                    await loadServiceStatus();
                }
                scheduleStatus();
            }, STATUS_IVL * 1000);
        };
        const startTick = () => {
            if (tickTimer) clearInterval(tickTimer);
            tickTimer = setInterval(updateCountdown, 1000);
        };
        const stopAllAuto = () => {
            if (logsTimer) clearTimeout(logsTimer);
            if (statusTimer) clearTimeout(statusTimer);
            if (tickTimer) clearInterval(tickTimer);
            logsTimer = statusTimer = tickTimer = null;
        };
        const startAuto = () => {
            stopAllAuto();
            scheduleLogs();
            scheduleStatus();
            startTick();
            updateCountdown();
        };

        if (svc.autoToggle) {
            autoEnabled = !!svc.autoToggle.checked;
            svc.autoToggle.addEventListener('change', () => {
                autoEnabled = !!svc.autoToggle.checked;
                if (autoEnabled) startAuto(); else stopAllAuto();
                updateCountdown();
                saveSvcPrefs({ auto: autoEnabled });
            });
        }
        document.addEventListener('visibilitychange', () => {
            updateCountdown();
        });

        // Initialize autos
        startAuto();

        // Auto-refresh timers for Services panel
        try {
            setInterval(() => {
                loadServiceLogs();
            }, 30000);
            setInterval(() => {
                loadServiceStatus();
            }, 60000);
        } catch (e) {}

        async function loadTicketMetrics() {
            const setById = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = String(v); };
            try {
                const open = await authFetch('tickets?stato=APERTO&mine=1');
                setById('metric-ticket-open', Array.isArray(open) ? open.length : (open?.length || 0));
            } catch (e) { setById('metric-ticket-open', '—'); }
            try {
                const doing = await authFetch('tickets?stato=IN_LAVORAZIONE&mine=1');
                setById('metric-ticket-doing', Array.isArray(doing) ? doing.length : (doing?.length || 0));
            } catch (e) { setById('metric-ticket-doing', '—'); }
            try {
                const d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const since = `${y}-${m}-${day} 00:00:00`;
                const closed = await authFetch(`tickets?stato=CHIUSO&mine=1&chiuso_dal=${encodeURIComponent(since)}`);
                setById('metric-ticket-closed30', Array.isArray(closed) ? closed.length : (closed?.length || 0));
            } catch (e) { setById('metric-ticket-closed30', '—'); }
        }

        async function loadTeamTicketMetrics() {
            const setById = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = String(v); };
            try {
                const open = await authFetch('tickets?stato=APERTO&team=1');
                setById('metric-ticket-open-team', Array.isArray(open) ? open.length : (open?.length || 0));
            } catch (e) { setById('metric-ticket-open-team', '—'); }
            try {
                const doing = await authFetch('tickets?stato=IN_LAVORAZIONE&team=1');
                setById('metric-ticket-doing-team', Array.isArray(doing) ? doing.length : (doing?.length || 0));
            } catch (e) { setById('metric-ticket-doing-team', '—'); }
            try {
                const d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const since = `${y}-${m}-${day} 00:00:00`;
                const closed = await authFetch(`tickets?stato=CHIUSO&team=1&chiuso_dal=${encodeURIComponent(since)}`);
                setById('metric-ticket-closed30-team', Array.isArray(closed) ? closed.length : (closed?.length || 0));
            } catch (e) { setById('metric-ticket-closed30-team', '—'); }
        }

        // ==========================
        // Tickets panel – minimal UI
        // ==========================
        const tk = {
            list: document.getElementById('tickets-list'),
            myOnly: document.getElementById('ticket-my-only'),
            teamWrap: document.getElementById('ticket-team-wrap'),
            teamOnly: document.getElementById('ticket-team-only'),
            btnRefresh: document.getElementById('btn-tickets-refresh'),
            btnExport: document.getElementById('btn-tickets-export'),
            btnTeamView: document.getElementById('btn-tickets-team-view'),
            title: document.getElementById('ticket-title'),
            desc: document.getElementById('ticket-desc'),
            prio: document.getElementById('ticket-priority'),
            btnCreate: document.getElementById('btn-ticket-create'),
            stateSel: document.getElementById('ticket-state'),
            assigneeSel: document.getElementById('ticket-assignee'),
            assigneeLabel: document.getElementById('ticket-assignee-label'),
            userOptions: document.getElementById('user-options-tickets'),
            clientId: document.getElementById('ticket-client-id'),
            clientLabel: document.getElementById('ticket-client-label'),
            clientOptions: document.getElementById('client-options-tickets'),
            search: document.getElementById('ticket-search'),
            detTitle: document.getElementById('ticket-detail-title'),
            detSubtitle: document.getElementById('ticket-detail-subtitle'),
            detStatus: document.getElementById('ticket-detail-status'),
            detPriority: document.getElementById('ticket-detail-priority'),
            detAuthor: document.getElementById('ticket-detail-author'),
            detAssignee: document.getElementById('ticket-detail-assignee'),
            detClient: document.getElementById('ticket-detail-client'),
            comments: document.getElementById('ticket-comments'),
            commentText: document.getElementById('ticket-comment-text'),
            btnComment: document.getElementById('btn-ticket-comment'),
            file: document.getElementById('ticket-attach-file'),
            btnAttach: document.getElementById('btn-ticket-attach'),
            btnAssign: document.getElementById('btn-ticket-assign'),
            btnClose: document.getElementById('btn-ticket-close'),
            btnReopen: document.getElementById('btn-ticket-reopen'),
        };

        let selectedTicketId = null;

        let ticketsFilterState = null;
        let ticketsFilterClosedSince = null;

        function currentRole() {
            try { const me = window.lpwfAuth?.getCurrentUser?.() || {}; return String(me.ruolo || '').toUpperCase(); } catch (e) { return ''; }
        }

        function buildTicketsParams() {
            const params = [];
            if (tk.myOnly && tk.myOnly.checked) params.push('mine=1');
            if (ticketsFilterState) params.push('stato=' + encodeURIComponent(ticketsFilterState));
            if (ticketsFilterState === 'CHIUSO' && ticketsFilterClosedSince) {
                params.push('chiuso_dal=' + encodeURIComponent(ticketsFilterClosedSince));
            }
            const role = currentRole();
            if (tk.teamOnly && tk.teamOnly.checked && (role === 'ADMIN' || role === 'SUPERVISOR')) {
                params.push('team=1');
            }
            if (tk.stateSel && tk.stateSel.value) {
                const v = String(tk.stateSel.value || '').trim();
                if (v) {
                    ticketsFilterState = null;
                    ticketsFilterClosedSince = null;
                    params.push('stato=' + encodeURIComponent(v));
                }
            }
            if (tk.assigneeSel && tk.assigneeSel.value) {
                const v = String(tk.assigneeSel.value || '').trim();
                if (v) params.push('assegnato_a=' + encodeURIComponent(v));
            }
            if (tk.clientId && tk.clientId.value) {
                const v = String(tk.clientId.value || '').trim();
                if (v) params.push('cliente_id=' + encodeURIComponent(v));
            }
            if (tk.search && tk.search.value) {
                const q = tk.search.value.trim();
                if (q) params.push('search=' + encodeURIComponent(q));
            }
            // Assegnatario via datalist (se presente) ha precedenza
            if (tk.assigneeLabel && tk.assigneeLabel.value) {
                const val = tk.assigneeLabel.value || '';
                const m = val.match(/#(\d+)/);
                if (m) {
                    const id = m[1];
                    // se presente, sostituisci o aggiungi assegnato_a
                    const idx = params.findIndex(p => p.startsWith('assegnato_a='));
                    if (idx >= 0) params[idx] = 'assegnato_a=' + encodeURIComponent(id);
                    else params.push('assegnato_a=' + encodeURIComponent(id));
                }
            }
            return params;
        }

        async function loadTickets() {
            if (!tk.list) return;
            const params = buildTicketsParams();
            const qs = params.length ? ('?' + params.join('&')) : '';
            try {
                const rows = await authFetch('tickets' + qs);
                const list = Array.isArray(rows) ? rows : [];
                const cnt = document.getElementById('tickets-count');
                if (cnt) cnt.textContent = String(list.length || 0);
                renderTicketList(list);
            } catch (e) {
                tk.list.innerHTML = '<p class="empty-state">Errore caricamento ticket.</p>';
                const cnt = document.getElementById('tickets-count');
                if (cnt) cnt.textContent = '0';
            }
        }

        function renderTicketList(rows) {
            if (!rows.length) { tk.list.innerHTML = '<p class="form-hint">Nessun ticket.</p>'; return; }
            tk.list.innerHTML = rows.map(r => {
                const t = String(r.titolo || `Ticket #${r.id}`);
                const s = String(r.stato || '');
                const p = String(r.priorita || '');
                const a = String(r.assegnato_a_nome || '—');
                return `<div class="list-item" data-ticket-id="${Number(r.id)}"><strong>${sanitize(t)}</strong><br><small>Stato: ${sanitize(s)} • Prio: ${sanitize(p)} • Assegnato a: ${sanitize(a)}</small></div>`;
            }).join('');
        }

        async function loadTicketDetail(id) {
            selectedTicketId = id;
            try {
                const t = await authFetch(`tickets/${id}`);
                if (tk.detTitle) tk.detTitle.textContent = t.titolo || `Ticket #${id}`;
                if (tk.detSubtitle) tk.detSubtitle.textContent = t.descrizione || '';
                if (tk.detStatus) tk.detStatus.textContent = t.stato || '';
                if (tk.detPriority) tk.detPriority.textContent = t.priorita || '';
                if (tk.detAuthor) tk.detAuthor.textContent = t.creato_da_nome || t.creato_da || '';
                if (tk.detAssignee) tk.detAssignee.textContent = t.assegnato_a_nome || (t.assegnato_a ? ('#' + t.assegnato_a) : '—');
                if (tk.detClient) tk.detClient.textContent = t.cliente_nome || (t.cliente_id ? ('#' + t.cliente_id) : '—');
                if (tk.btnReopen) tk.btnReopen.hidden = String(t.stato||'') !== 'CHIUSO';
                await loadTicketComments(id);
            } catch (e) {
                if (tk.detTitle) tk.detTitle.textContent = 'Ticket non trovato';
            }
        }

        async function loadTicketComments(id) {
            if (!tk.comments) return;
            try {
                const [list, atts] = await Promise.all([
                    authFetch(`tickets/${id}/comment`),
                    authFetch(`tickets/${id}/attachments`).catch(() => []),
                ]);
                const attachments = Array.isArray(atts) ? atts : [];
                const byComment = attachments.reduce((acc, a) => { const k = Number(a.commento_id); (acc[k] = acc[k] || []).push(a); return acc; }, {});
                if (!Array.isArray(list) || !list.length) { tk.comments.innerHTML = '<p class="form-hint">Nessun commento.</p>'; return; }
                tk.comments.innerHTML = list.map(c => {
                    const group = byComment[Number(c.id)] || [];
                    const links = group.map(a => `<li><a href=\"${sanitize(a.percorso_file || '#')}\" target=\"_blank\" rel=\"noopener\">${sanitize(a.nome_file_originale || 'file')}</a></li>`).join('');
                    const attHtml = group.length ? `<ul class=\"attachments\">${links}</ul>` : '';
                    return `<div class=\"list-item\"><small>${sanitize(c.creato_il || '')} — ${sanitize(c.utente_nome || ('#'+c.utente_id))}</small><div>${sanitize(c.messaggio || '')}</div>${attHtml}</div>`;
                }).join('');
            } catch (e) {
                tk.comments.innerHTML = '<p class="empty-state">Errore caricamento commenti.</p>';
            }
        }

        async function createTicket() {
            const titolo = (tk.title?.value || '').trim();
            const descrizione = (tk.desc?.value || '').trim();
            const priorita = (tk.prio?.value || 'MEDIA');
            if (!titolo) { try { showToast('Inserisci un titolo', { type: 'warning' }); } catch (e) {} return; }
            try {
                await authFetch('tickets', { method: 'POST', json: true, body: { titolo, descrizione, priorita } });
                if (tk.title) tk.title.value = '';
                if (tk.desc) tk.desc.value = '';
                await loadTickets();
                try { showToast('Ticket creato', { type: 'success' }); } catch (e) {}
            } catch (e) {
                alert(e.message || 'Errore creazione ticket');
            }
        }

        async function addComment() {
            if (!selectedTicketId) return;
            const messaggio = (tk.commentText?.value || '').trim();
            if (!messaggio) return;
            try {
                await authFetch(`tickets/${selectedTicketId}/comment`, { method: 'POST', json: true, body: { messaggio } });
                if (tk.commentText) tk.commentText.value = '';
                await loadTicketComments(selectedTicketId);
            } catch (e) { alert(e.message || 'Errore invio commento'); }
        }

        async function attachFile() {
            if (!selectedTicketId) return;
            const f = tk.file?.files && tk.file.files[0];
            if (!f) return;
            const fd = new FormData();
            try {
                // crea un commento placeholder e allega il file
                const tmp = await authFetch(`tickets/${selectedTicketId}/comment`, { method: 'POST', json: true, body: { messaggio: `Allegato: ${f.name}` } });
                const commentId = Number(tmp?.id || 0);
                if (!commentId) throw new Error('Errore creazione commento');
                fd.append('comment_id', String(commentId));
                fd.append('file', f);
                await authFetch(`tickets/${selectedTicketId}/comment_attach`, { method: 'POST', body: fd });
                if (tk.file) tk.file.value = '';
                await loadTicketComments(selectedTicketId);
                try { showToast('Allegato caricato', { type: 'success' }); } catch (e) {}
            } catch (e) { alert(e.message || 'Errore upload allegato'); }
        }

        async function assignMe() {
            if (!selectedTicketId) return;
            try { await authFetch(`tickets/${selectedTicketId}/assign`, { method: 'PUT', json: true, body: {} }); await loadTicketDetail(selectedTicketId); await loadTickets(); } catch (e) { alert(e.message || 'Errore assegnazione'); }
        }

        async function closeTicket() {
            if (!selectedTicketId) return;
            try { await authFetch(`tickets/${selectedTicketId}/close`, { method: 'PUT', json: true, body: {} }); await loadTicketDetail(selectedTicketId); await loadTickets(); } catch (e) { alert(e.message || 'Errore chiusura'); }
        }
        async function reopenTicket() {
            if (!selectedTicketId) return;
            try { await authFetch(`tickets/${selectedTicketId}/reopen`, { method: 'PUT', json: true, body: {} }); await loadTicketDetail(selectedTicketId); await loadTickets(); } catch (e) { alert(e.message || 'Errore riapertura'); }
        }

        if (tk.btnCreate) tk.btnCreate.addEventListener('click', createTicket);
        if (tk.btnRefresh) tk.btnRefresh.addEventListener('click', loadTickets);
        if (tk.myOnly) tk.myOnly.addEventListener('change', loadTickets);
        if (tk.teamOnly) tk.teamOnly.addEventListener('change', loadTickets);
        if (tk.stateSel) tk.stateSel.addEventListener('change', loadTickets);
        if (tk.assigneeSel) tk.assigneeSel.addEventListener('change', loadTickets);
        if (tk.clientId) tk.clientId.addEventListener('change', loadTickets);
        if (tk.clientLabel) tk.clientLabel.addEventListener('change', () => {
            try {
                const val = tk.clientLabel.value || '';
                let id = '';
                if (val) {
                    // estrai id da formato "Ragione (#ID)"
                    const m = val.match(/#(\d+)/);
                    if (m) id = m[1];
                }
                if (tk.clientId) tk.clientId.value = id;
                loadTickets();
            } catch (e) { /* ignore */ }
        });
        if (tk.assigneeLabel) tk.assigneeLabel.addEventListener('change', () => {
            try {
                const val = tk.assigneeLabel.value || '';
                let id = '';
                if (val) {
                    const m = val.match(/#(\d+)/);
                    if (m) id = m[1];
                }
                if (tk.assigneeSel) tk.assigneeSel.value = id;
                loadTickets();
            } catch (e) { /* ignore */ }
        });
        if (tk.search) {
            const deb = (fn, ms = 400) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
            tk.search.addEventListener('input', deb(loadTickets, 400));
        }
        if (tk.list) tk.list.addEventListener('click', (ev) => {
            const el = ev.target.closest('[data-ticket-id]');
            if (!el) return;
            const id = Number(el.dataset.ticketId || '');
            if (!id) return;
            loadTicketDetail(id);
        });
        if (tk.btnComment) tk.btnComment.addEventListener('click', addComment);
        if (tk.btnAttach) tk.btnAttach.addEventListener('click', attachFile);
        if (tk.btnAssign) tk.btnAssign.addEventListener('click', assignMe);
        if (tk.btnClose) tk.btnClose.addEventListener('click', closeTicket);
        if (tk.btnReopen) tk.btnReopen.addEventListener('click', reopenTicket);

        // Initial load if section present
        if (tk.list) { try { 
            // mostra toggle "Mio team" a supervisor/admin
            const role = currentRole();
            if (tk.teamWrap) tk.teamWrap.hidden = !(role === 'ADMIN' || role === 'SUPERVISOR');
            if (tk.btnTeamView) tk.btnTeamView.hidden = !(role === 'ADMIN' || role === 'SUPERVISOR');
            // Applica preferenze salvate prima di popolare/select
            applyTicketPrefsToUI();
            populateTicketAssignee();
            populateTicketClient();
            loadTickets(); 
        } catch (e) {} }

        async function exportTicketsCsv() {
            try {
                const params = buildTicketsParams();
                const qs = params.length ? ('?' + params.join('&')) : '';
                const rows = await authFetch('tickets' + qs);
                const list = Array.isArray(rows) ? rows : [];
                if (!list.length) { alert('Nessun dato da esportare.'); return; }
                const cols = ['id','titolo','stato','priorita','creato_da_nome','assegnato_a_nome','cliente_nome','creato_il','chiuso_il'];
                const esc = (v) => {
                    let s = v === null || v === undefined ? '' : String(v);
                    s = s.replace(/"/g,'""');
                    return '"' + s + '"';
                };
                const lines = [];
                lines.push(cols.join(','));
                list.forEach(r => {
                    const row = cols.map(k => esc(r[k] ?? ''));
                    lines.push(row.join(','));
                });
                const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'tickets.csv';
                document.body.appendChild(a);
                a.click();
                setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 200);
            } catch (e) { alert(e.message || 'Errore export CSV'); }
        }

        if (tk.btnExport) tk.btnExport.addEventListener('click', exportTicketsCsv);
        if (tk.btnTeamView) tk.btnTeamView.addEventListener('click', () => {
            if (tk.teamOnly) tk.teamOnly.checked = true;
            if (tk.myOnly) tk.myOnly.checked = false;
            if (tk.stateSel) tk.stateSel.value = '';
            ticketsFilterState = null; ticketsFilterClosedSince = null;
            loadTickets();
        });

        // Docs dropdown
        try {
            const btnDocs = document.getElementById('btn-docs');
            const docsMenu = document.getElementById('docs-menu');
            if (btnDocs && docsMenu) {
                btnDocs.addEventListener('click', (e) => {
                    e.preventDefault();
                    const isOpen = !docsMenu.hidden;
                    docsMenu.hidden = isOpen; // toggle
                    btnDocs.setAttribute('aria-expanded', String(!isOpen));
                });
                document.addEventListener('click', (ev) => {
                    if (!docsMenu || docsMenu.hidden) return;
                    const inside = ev.target.closest('#docs-menu') || ev.target.closest('#btn-docs');
                    if (!inside) {
                        docsMenu.hidden = true;
                        btnDocs.setAttribute('aria-expanded', 'false');
                    }
                });
            }
        } catch (e) { /* ignore */ }

        // Ticket filters preferences (localStorage)
        const TKT_PREFS_KEY = 'lpwf_ticket_prefs';
        const loadTicketPrefs = () => {
            try { const raw = window.localStorage.getItem(TKT_PREFS_KEY); return raw ? JSON.parse(raw) : {}; } catch (e) { return {}; }
        };
        const saveTicketPrefs = (patch) => {
            try { const cur = loadTicketPrefs(); const next = { ...cur, ...patch }; window.localStorage.setItem(TKT_PREFS_KEY, JSON.stringify(next)); } catch (e) {}
        };
        const getTicketPrefsFromUI = () => ({
            mine: !!(tk.myOnly && tk.myOnly.checked),
            team: !!(tk.teamOnly && tk.teamOnly.checked),
            stato: tk.stateSel ? (tk.stateSel.value || '') : '',
            assignee: tk.assigneeSel ? (tk.assigneeSel.value || '') : '',
            assigneeLabel: tk.assigneeLabel ? (tk.assigneeLabel.value || '') : '',
            clientId: tk.clientId ? (tk.clientId.value || '') : '',
            clientLabel: tk.clientLabel ? (tk.clientLabel.value || '') : '',
            q: tk.search ? (tk.search.value || '') : '',
        });
        const applyTicketPrefsToUI = () => {
            const p = loadTicketPrefs();
            try {
                if (tk.myOnly && typeof p.mine === 'boolean') tk.myOnly.checked = !!p.mine;
                if (tk.teamOnly && typeof p.team === 'boolean') tk.teamOnly.checked = !!p.team;
                if (tk.stateSel && typeof p.stato === 'string') tk.stateSel.value = p.stato || '';
                if (tk.assigneeSel && typeof p.assignee === 'string') tk.assigneeSel.value = p.assignee || '';
                if (tk.assigneeLabel && typeof p.assigneeLabel === 'string') tk.assigneeLabel.value = p.assigneeLabel || '';
                if (tk.clientId && typeof p.clientId === 'string') tk.clientId.value = p.clientId || '';
                if (tk.clientLabel && typeof p.clientLabel === 'string') tk.clientLabel.value = p.clientLabel || '';
                if (tk.search && typeof p.q === 'string') tk.search.value = p.q || '';
            } catch (e) { /* ignore */ }
        };

        function persistTicketFilters() { try { saveTicketPrefs(getTicketPrefsFromUI()); } catch (e) {} }

        // Persist on changes
        if (tk.myOnly) tk.myOnly.addEventListener('change', persistTicketFilters);
        if (tk.teamOnly) tk.teamOnly.addEventListener('change', persistTicketFilters);
        if (tk.stateSel) tk.stateSel.addEventListener('change', persistTicketFilters);
        if (tk.assigneeSel) tk.assigneeSel.addEventListener('change', persistTicketFilters);
        if (tk.assigneeLabel) tk.assigneeLabel.addEventListener('change', persistTicketFilters);
        if (tk.clientId) tk.clientId.addEventListener('change', persistTicketFilters);
        if (tk.clientLabel) tk.clientLabel.addEventListener('change', persistTicketFilters);
        if (tk.search) tk.search.addEventListener('change', persistTicketFilters);

        // Clear filters
        if (document.getElementById('btn-tickets-clear')) {
            document.getElementById('btn-tickets-clear').addEventListener('click', () => {
                try {
                    if (tk.myOnly) tk.myOnly.checked = true;
                    if (tk.teamOnly) tk.teamOnly.checked = false;
                    if (tk.stateSel) tk.stateSel.value = '';
                    if (tk.assigneeSel) tk.assigneeSel.value = '';
                    if (tk.assigneeLabel) tk.assigneeLabel.value = '';
                    if (tk.clientId) tk.clientId.value = '';
                    if (tk.clientLabel) tk.clientLabel.value = '';
                    if (tk.search) tk.search.value = '';
                    ticketsFilterState = null; ticketsFilterClosedSince = null;
                    // wipe persisted prefs
                    try { window.localStorage.removeItem(TKT_PREFS_KEY); } catch (e) {}
                    loadTickets();
                } catch (e) { /* ignore */ }
            });
        }

        async function populateTicketAssignee() {
            const sel = tk.assigneeSel; const dl = tk.userOptions;
            if (dl) dl.innerHTML = '';
            if (!sel) return;
            const current = sel.value; sel.innerHTML = '<option value="">Tutti</option>';
            try {
                const usersRes = await authFetch('utenti');
                const users = Array.isArray(usersRes?.utenti) ? usersRes.utenti : (Array.isArray(usersRes) ? usersRes : []);
                users.forEach(u => {
                    const opt = document.createElement('option');
                    opt.value = String(u.id);
                    opt.textContent = `${(u.nome||'').trim()} ${(u.cognome||'').trim()} (#${u.id})`;
                    sel.appendChild(opt);
                    if (dl) {
                        const o2 = document.createElement('option');
                        o2.value = `${(u.nome||'').trim()} ${(u.cognome||'').trim()} (#${u.id})`;
                        dl.appendChild(o2);
                    }
                });
                if (current) sel.value = current;
            } catch (e) { /* ignore */ }
        }

        async function populateTicketClient() {
            const dl = tk.clientOptions; if (!dl) return;
            dl.innerHTML = '';
            try {
                const list = await authFetch('clienti');
                const rows = Array.isArray(list) ? list : [];
                rows.forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = `${(c.ragione_sociale||'').trim()} (#${c.id})`;
                    opt.dataset.id = String(c.id);
                    dl.appendChild(opt);
                });
            } catch (e) { /* ignore */ }
        }

        // Clickable ticket metrics: jump and filter
        function gotoTicketsWith(state, closedSince = null) {
            try { document.querySelector('a[href="#tickets"]').click(); } catch (e) { window.location.hash = '#tickets'; }
            ticketsFilterState = state;
            ticketsFilterClosedSince = closedSince;
            loadTickets();
        }
        const elOpen = document.getElementById('metric-ticket-open');
        const elDoing = document.getElementById('metric-ticket-doing');
        const elClosed30 = document.getElementById('metric-ticket-closed30');
        if (elOpen && elOpen.parentElement) elOpen.parentElement.addEventListener('click', () => gotoTicketsWith('APERTO'));
        if (elDoing && elDoing.parentElement) elDoing.parentElement.addEventListener('click', () => gotoTicketsWith('IN_LAVORAZIONE'));
        if (elClosed30 && elClosed30.parentElement) elClosed30.parentElement.addEventListener('click', () => {
            const d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const since = `${y}-${m}-${day} 00:00:00`;
            gotoTicketsWith('CHIUSO', since);
        });
        function gotoTeamTicketsWith(state, since = null) {
            try { document.querySelector('a[href="#tickets"]').click(); } catch (e) { window.location.hash = '#tickets'; }
            if (tk.teamOnly) tk.teamOnly.checked = true;
            ticketsFilterState = state;
            ticketsFilterClosedSince = since;
            loadTickets();
        }
        const elOpenTeam = document.getElementById('metric-ticket-open-team');
        const elDoingTeam = document.getElementById('metric-ticket-doing-team');
        const elClosed30Team = document.getElementById('metric-ticket-closed30-team');
        if (elOpenTeam && elOpenTeam.parentElement) elOpenTeam.parentElement.addEventListener('click', () => gotoTeamTicketsWith('APERTO'));
        if (elDoingTeam && elDoingTeam.parentElement) elDoingTeam.parentElement.addEventListener('click', () => gotoTeamTicketsWith('IN_LAVORAZIONE'));
        if (elClosed30Team && elClosed30Team.parentElement) elClosed30Team.parentElement.addEventListener('click', () => {
            const d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const since = `${y}-${m}-${day} 00:00:00`;
            gotoTeamTicketsWith('CHIUSO', since);
        });
