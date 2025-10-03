// Dashboard minimale - gestione workflow/task
// Versione semplificata per ripartire da un setup pulito

(document => {
    document.addEventListener('DOMContentLoaded', () => {
        // Usa la base API salvata dall'accesso; fallback al path locale /api
        const apiBase = (window.lpwfAuth?.getApiBase?.() || window.lpwfAuth?.ensureBaseForLocation?.() || '/api').replace(/\/$/, '');
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
        };

        const stepActionSelect = document.getElementById('select-step-action');
        const actionParamsSection = document.getElementById('action-params-section');
        const actionParamsContainer = document.getElementById('action-params-container');
        const formCreateWorkflow = document.getElementById('form-create-workflow');
        const formCreateStep = document.getElementById('form-create-step');
        const formStartInstance = document.getElementById('form-start-instance');
        const modalStepTitle = document.getElementById('modal-create-step-title');
        const stepSubmitBtn = formCreateStep ? formCreateStep.querySelector('button[type="submit"]') : null;
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
        const modalTaskWork = document.getElementById('modal-task-work');
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
        const groupLabelInput = formCreateStep ? formCreateStep.querySelector('[data-role="group-picker"]') : null;
        const userLabelInput = formCreateStep ? formCreateStep.querySelector('[data-role="user-picker"]') : null;
        const groupHiddenInput = formCreateStep ? formCreateStep.querySelector('input[name="responsabile_gruppo_id"]') : null;
        const userHiddenInput = formCreateStep ? formCreateStep.querySelector('input[name="responsabile_utente_id"]') : null;

        attachPickerListeners(groupLabelInput, groupHiddenInput, groupOptions);
        attachPickerListeners(userLabelInput, userHiddenInput, userOptions);

        // Modals: group/user management
        const modalGroup = document.getElementById('modal-manage-group');
        const modalUser = document.getElementById('modal-manage-user');
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
                dom.main.innerHTML = '<p>Autenticazione richiesta. Effettua il login da <a href="login.html">login.html</a>.</p>';
            }
            return;
        }

        const state = {
            currentUser: 'all',
            search: '',
            users: [],
            groups: [],
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
                instancesClientId: ''
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
        };

        const NOTIF_STORAGE_KEY = 'lpwf_notif_seen_subflows';
        const TAB_STORAGE_KEY = 'lpwf_active_tab';

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
                window.localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(state.notifications.seenSubflows || {}));
            } catch (e) {
                /* ignore */
            }
        };

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
            items.forEach(item => {
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
                if (keys.length && keys.every(key => /^\d+$/.test(key))) {
                    return keys.map(key => payload[key]).filter(item => item && typeof item === 'object');
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
            return normalized.replace(/(^|\s)\w/g, char => char.toUpperCase());
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
                throw new Error('Impossibile recuperare le informazioni dell\'utente corrente.');
            }

            state.currentUserId = Number(state.currentUserInfo.id);
            const role = (state.currentUserInfo.ruolo || '').toUpperCase();
            state.isAdmin = (role === 'ADMIN');
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
            } catch (e) { /* ignore */ }
            // Nascondi/mostra voci sidebar per Admin
            try {
                const linkModels = document.querySelector('a.sidebar__link[href="#workflow-models"]');
                if (linkModels) linkModels.hidden = !p.viewConfig;
                const linkConfig = document.querySelector('a.sidebar__link[href="#config"]');
                if (linkConfig) linkConfig.hidden = !p.viewConfig;
            } catch (e) { /* ignore */ }
            const usersPanel = document.querySelector('article[data-resource="utenti"]');
            const groupsPanel = document.querySelector('article[data-resource="gruppi"]');
            if (usersPanel) usersPanel.hidden = true; // pannello utenti rimosso
            if (groupsPanel) groupsPanel.hidden = !(p.viewConfig && p.viewGroups);
            document.querySelectorAll('[data-action="open-create-user"]').forEach(b => b.hidden = !p.manageUsers);
            document.querySelectorAll('[data-action="open-create-group"]').forEach(b => b.hidden = !p.manageGroups);
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
            const fullname = [me.nome, me.cognome].filter(Boolean).join(' ') || (me.email || `#${me.id || ''}`) || '—';
            const role = (me.ruolo || '').toUpperCase() || '—';
            const apiBase = (window.lpwfAuth?.ensureBaseForLocation?.() || window.lpwfAuth?.getApiBase?.() || '') || '—';
            const tokenOk = !!window.lpwfAuth?.getToken?.();
            if (elUser) elUser.textContent = fullname;
            if (elRole) elRole.textContent = role;
            if (elApi) elApi.textContent = apiBase;
            if (elTok) elTok.textContent = tokenOk ? 'OK' : 'MANCANTE';
        };

        const renderSupervisorBadge = async () => {
            const role = (state.currentUserInfo?.ruolo || '').toUpperCase();
            const badge = document.getElementById('supervisor-users-badge');
            const listEl = document.getElementById('supervisor-users-list');
            if (!badge || !listEl) return;
            if (role !== 'SUPERVISOR') { badge.hidden = true; return; }
            try {
                let supervised = await authFetch(`utenti/${state.currentUserId}/supervised`);
                supervised = Array.isArray(supervised) ? supervised : [];
                if (!supervised.length) { badge.hidden = true; return; }
                listEl.innerHTML = supervised.map(u => `<span class="badge">${sanitize(buildUserLabel(u))}</span>`).join(' ');
                badge.hidden = false;
            } catch (e) { badge.hidden = true; }
        };

        const sanitize = value => {
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

            form.querySelectorAll('input[type="checkbox"]').forEach(input => {
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
                if (lastEl) lastEl.textContent = `${init.method} ${endpoint} → NETWORK ERR (${Math.round(t1 - t0)}ms)`;
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
                    alert((payload && payload.message) || 'Sessione scaduta. Effettua nuovamente il login.');
                    window.location.href = 'login.html';
                    const t1 = performance.now();
                    const lastEl = document.getElementById('status-api-last');
                    if (lastEl) lastEl.textContent = `${init.method} ${endpoint} → 401 (scaduta) (${Math.round(t1 - t0)}ms)`;
                    return Promise.reject(new Error('Non autenticato'));
                }
                const message = payload && payload.message ? payload.message : `Errore HTTP ${response.status}`;
                const t1 = performance.now();
                const lastEl = document.getElementById('status-api-last');
                if (lastEl) lastEl.textContent = `${init.method} ${endpoint} → ${response.status} (${Math.round(t1 - t0)}ms)`;
                return Promise.reject(new Error(message));
            }
            const t1 = performance.now();
            const lastEl = document.getElementById('status-api-last');
            if (lastEl) lastEl.textContent = `${init.method} ${endpoint} → ${response.status} OK (${Math.round(t1 - t0)}ms)`;
            return payload;
        };

        const renderMessage = (container, text) => {
            if (!container) return;
            container.innerHTML = `<p>${sanitize(text)}</p>`;
        };

        const renderTaskColumn = (container, tasks, emptyMsg) => {
            if (!container) return;
            const list = Array.isArray(tasks) ? tasks : normalizeListResponse(tasks, ['tasks', 'records', 'items']);
            if (!Array.isArray(list) || list.length === 0) {
                renderMessage(container, emptyMsg);
                return;
            }

            container.innerHTML = '';
            list.forEach(task => {
                const card = document.createElement('div');
                card.className = 'task-card';

                const title = sanitize(task.nome || `Task #${task.id}`);
                const description = sanitize(task.descrizione || 'Nessuna descrizione.');
                const assignee = sanitize(task.nome_utente_completo || 'Non assegnato');
                const stato = sanitize(task.stato_nome || task.stato || '—');
                const instId = Number(task.workflow_istanza_id);
                const instAlerts = (instanceState.alerts && instanceState.alerts[String(instId)]) || 0;

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

        const renderSimpleList = (container, items, formatter) => {
            if (!container) return;
            if (!Array.isArray(items) || items.length === 0) {
                renderMessage(container, 'Nessun elemento.');
                return;
            }

            container.innerHTML = '';
            items.forEach(item => {
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
                list = list.filter(u => String(u.stato || 'ATTIVO').toUpperCase() === 'ATTIVO');
            }
            // Ricerca testuale su nome/cognome/email/username
            const q = (state.filters.usersSearch || '').toLowerCase().trim();
            if (q) {
                list = list.filter(u => {
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
                list = list.filter(u => Array.isArray(u.gruppi) && u.gruppi.some(g => Number(g.id) === gid));
            }
            const roleFilter = (state.filters.usersRole || 'all').toUpperCase();
            if (roleFilter && roleFilter !== 'all') {
                list = list.filter(u => (String(u.ruolo || '').toUpperCase() === roleFilter));
            }
            const supervisorId = state.filters.usersSupervisorId;
            if (supervisorId && supervisorId !== 'all') {
                const sid = Number(supervisorId);
                list = list.filter(u => Array.isArray(u.supervisors) && u.supervisors.some(s => Number(s.id) === sid));
            }
            // Aggiorna il titolo con il conteggio corrente
            try {
                const titleEl = document.getElementById('users-panel-title');
                if (titleEl) titleEl.textContent = `Utenti (${list.length || 0})`;
            } catch (e) { /* no-op */ }
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
            list.forEach(u => {
                const div = document.createElement('div');
                const inactive = (String(u.stato || '').toUpperCase() !== 'ATTIVO');
                div.className = 'list-item' + (inactive ? ' is-inactive' : '');
                const label = buildUserLabel(u);
                const badge = inactive ? ' <span class="badge badge-error">Inattivo</span>' : ' <span class="badge badge-success">Attivo</span>';
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
                        groupsContainer.innerHTML = u.gruppi.map(g => {
                            const label = sanitize(buildGroupLabel(g) || g.nome || ('Gruppo #'+ g.id));
                            const m = state.groups?.find(x => Number(x.id) === Number(g.id));
                            const cnt = m && (m.users_count !== undefined) ? ` (${Number(m.users_count)||0})` : '';
                            return `<span class=\"badge\">${label}${cnt}</span>`;
                        }).join(' ');
                    } else {
                        groupsContainer.innerHTML = '<small class=\"form-hint\">Nessun gruppo assegnato.</small>';
                    }
                } else {
                    groupsContainer.innerHTML = '<small class=\"form-hint\">Caricamento gruppi…</small>';
                }
            div.appendChild(groupsContainer);
            // Supervisors (se presenti)
            if (Array.isArray(u.supervisors) && u.supervisors.length) {
                const supEl = document.createElement('div');
                supEl.className = 'item-details';
                supEl.id = `user-sup-${u.id}`;
                supEl.innerHTML = '<small class="form-hint">Supervisor:</small> ' + u.supervisors.map(s => `<span class="badge">${sanitize(buildUserLabel(s))}</span>`).join(' ');
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
                const groups = Array.isArray(data) ? data : normalizeListResponse(data, ['gruppi','groups']);
                if (!groups || groups.length === 0) {
                    target.innerHTML = '<small class="form-hint">Nessun gruppo assegnato.</small>';
                    return;
                }
                target.innerHTML = groups.map(g => {
                    const label = sanitize(buildGroupLabel(g) || g.nome || ('Gruppo #' + g.id));
                    const m = state.groups?.find(x => Number(x.id) === Number(g.id));
                    const cnt = m && (m.users_count !== undefined) ? ` (${Number(m.users_count)||0})` : '';
                    return `<span class=\"badge\">${label}${cnt}</span>`;
                }).join(' ');
            } catch (e) {
                target.innerHTML = '<small class="form-hint">Errore caricamento gruppi.</small>';
            }
        };

        const populateActionSelect = () => {
            if (!stepActionSelect) return;
            const current = stepActionSelect.value;
            stepActionSelect.innerHTML = '<option value="">Nessuna</option>';
            workflowState.actions.forEach(action => {
                const option = document.createElement('option');
                option.value = action.id;
                option.textContent = sanitize(action.nome_azione || `Azione #${action.id}`);
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
                return raw.map(item => {
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
                }).filter(def => def && def.name);
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

            const action = workflowState.actions.find(a => a.id == actionId);
            const params = parseActionParameters(action);
            if (!params.length) {
                return;
            }

            params.forEach(param => {
                const wrapper = document.createElement('label');
                wrapper.className = 'form-control';
                wrapper.innerHTML = `<span>${sanitize(param.label || param.name)}</span>`;

                let input;
                if (param.type === 'select' && Array.isArray(param.options) && param.options.length) {
                    input = document.createElement('select');
                    input.dataset.paramKey = param.name;
                    input.innerHTML = '<option value="">Seleziona...</option>' + param.options.map(opt => {
                        if (typeof opt === 'string') {
                            return `<option value="${sanitize(opt)}">${sanitize(opt)}</option>`;
                        }
                        return `<option value="${sanitize(opt.value)}">${sanitize(opt.label || opt.value)}</option>`;
                    }).join('');
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
            if (formCreateStep.elements.ordine) formCreateStep.elements.ordine.value = step.ordine || 1;
            if (formCreateStep.elements.sottopasso) formCreateStep.elements.sottopasso.value = step.sottopasso || 1;
            if (formCreateStep.elements.scadenza_standard_valore) {
                formCreateStep.elements.scadenza_standard_valore.value = step.scadenza_standard_valore ?? '';
            }
            if (formCreateStep.elements.scadenza_standard_unita) {
                formCreateStep.elements.scadenza_standard_unita.value = step.scadenza_standard_unita ?? '';
            }
            if (groupHiddenInput) {
                const groupId = step.responsabile_gruppo_id ?? '';
                groupHiddenInput.value = groupId;
                if (groupLabelInput) {
                    const groupObj = state.groups.find(g => Number(g.id) === Number(groupId));
                    const label = groupObj ? buildGroupLabel(groupObj) : (groupId ? `Gruppo #${groupId}` : '');
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
                    const userObj = state.users.find(u => Number(u.id) === Number(userId));
                    const label = userObj ? buildUserLabel(userObj) : (userId ? `Utente #${userId}` : '');
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
                        try { paramsData = JSON.parse(paramsData); } catch (err) { paramsData = {}; }
                    }
                    if (paramsData && typeof paramsData === 'object') {
                        actionParamsContainer.querySelectorAll('[data-param-key]').forEach(input => {
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
            workflowState.list.forEach(wf => {
                const card = document.createElement('article');
                card.className = 'workflow-card';
                if (wf.id === workflowState.selectedId) {
                    card.classList.add('is-active');
                }
                card.dataset.action = 'select-workflow';
                card.dataset.id = wf.id;

                const name = sanitize(wf.nome_workflow || wf.nome || `Workflow #${wf.id}`);
                const descr = sanitize(wf.descrizione || '—');
                const attivo = wf.attivo === undefined || wf.attivo === null ? 'Sconosciuto' : (wf.attivo ? 'Attivo' : 'Disattivo');

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
                if (descEl) descEl.textContent = 'Scegli un elemento dall\'elenco per vedere passi, assegnazioni e impostazioni.';
                if (infoEl) infoEl.innerHTML = '';
                if (stepsEl) stepsEl.innerHTML = '';
                if (btnAddStep) btnAddStep.disabled = true;
                if (btnStartInstance) btnStartInstance.disabled = true;
                return;
            }

            const name = sanitize(workflow.nome || workflow.nome_workflow || `Workflow #${workflow.id}`);
            const descr = sanitize(workflow.descrizione || '—');
            const attivo = workflow.attivo ? 'Attivo' : 'Disattivo';
            const steps = Array.isArray(workflow.steps) ? workflow.steps : [];
            // Salva snapshot ordine iniziale se non presente
            try {
                if (workflow && workflow.id && !workflowState.orderBackup[workflow.id]) {
                    workflowState.orderBackup[workflow.id] = (steps || []).map(s => ({ id: Number(s.id), ordine: Number(s.ordine), sottopasso: Number(s.sottopasso) }));
                }
            } catch (e) { /* ignore */ }

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
                    const rows = steps.map(step => {
                        const scadenza = step.scadenza_standard_valore
                            ? `${step.scadenza_standard_valore} ${step.scadenza_standard_unita === 'ORE' ? 'ore' : 'giorni'}`
                            : '—';
                        const action = workflowState.actions.find(a => a.id == step.tipo_azione_standard);
                        const actionName = action ? sanitize(action.nome_azione) : (step.tipo_azione_standard ? `Azione #${step.tipo_azione_standard}` : '—');
                        const groupObj = step.responsabile_gruppo_id ? state.groups.find(g => Number(g.id) === Number(step.responsabile_gruppo_id)) : null;
                        const userObj = step.responsabile_utente_id ? state.users.find(u => Number(u.id) === Number(step.responsabile_utente_id)) : null;
                        const groupLabel = step.responsabile_gruppo_id
                            ? sanitize(groupObj ? buildGroupLabel(groupObj) : `Gruppo #${step.responsabile_gruppo_id}`)
                            : '—';
                        const userLabel = step.responsabile_utente_id
                            ? sanitize(userObj ? buildUserLabel(userObj) : `Utente #${step.responsabile_utente_id}`)
                            : '—';
                        let actionParams = '';
                        if (step.parametri_azione) {
                            try {
                                const parsed = typeof step.parametri_azione === 'string'
                                    ? JSON.parse(step.parametri_azione)
                                    : step.parametri_azione;
                                const entries = Object.entries(parsed || {});
                                if (entries.length) {
                                    actionParams = entries
                                        .map(([key, value]) => `${sanitize(key)}: ${sanitize(value)}`)
                                        .join(', ');
                                }
                            } catch (err) {
                                actionParams = sanitize(step.parametri_azione);
                            }
                        }
                        const hasActive = (step.attivo !== undefined && step.attivo !== null);
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
                    }).join('');

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
                    try { updateStepsOrderStatus(); } catch (e) { /* ignore */ }
                    // Abilita drag&drop per riordinare sottopassi e cambiare ordine
                    try { setupStepsDragAndDrop(steps); } catch (e) { /* ignore */ }
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
                [...table.querySelectorAll('tr')].forEach(r => r.classList.remove('drop-before','drop-after'));
                dragging = null;
            };
            const onDragOver = (e) => {
                if (!dragging) return;
                const tgt = e.currentTarget;
                if (tgt === dragging) return;
                e.preventDefault();
                const rect = tgt.getBoundingClientRect();
                const before = (e.clientY - rect.top) < rect.height / 2;
                [...table.querySelectorAll('tr')].forEach(r => r.classList.remove('drop-before','drop-after'));
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
                        const ok = confirm('Ci sono modifiche all\'ordine non ripristinate. Procedere con lo spostamento tra ordini?');
                        if (!ok) {
                            tgt.classList.remove('drop-before','drop-after');
                            return;
                        }
                    }
                }
                tgt.classList.remove('drop-before','drop-after');
                // muovi DOM
                if (before) table.insertBefore(dragging, tgt); else table.insertBefore(dragging, tgt.nextSibling);
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
                        await authFetch(`workflowsteps/${u.id}`, { method: 'PUT', json: true, body: { ordine: u.ordine, sottopasso: u.sottopasso } });
                    } catch (err) {
                        try { showToast(err.message || 'Errore salvataggio ordine passo', { type: 'error' }); } catch (e) {}
                    }
                }
                // ricarica dettaglio per allineare stato
                try {
                    if (workflowState.selectedId) {
                        await loadWorkflowDetail(workflowState.selectedId);
                        const wfId = workflowState.selectedId;
                        const order = getStepsOrderList((workflowState.detailCache[wfId] || {}).steps || []);
                        pushOrderHistory(wfId, order);
                    }
                } catch (e) {}
            };

            [...table.querySelectorAll('tr')].forEach(tr => {
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
            const dirty = (curr !== base);
            el.textContent = dirty ? 'Ordine modificato' : 'Ordine allineato';
            el.classList.toggle('badge-error', dirty);
            el.classList.toggle('badge-success', !dirty);
            // Rendilo cliccabile come "Annulla modifiche" quando dirty
            el.dataset.dirty = dirty ? '1' : '0';
            el.title = dirty ? 'Clicca per annullare le modifiche all\'ordine' : 'Ordine allineato alla base';
            el.style.cursor = dirty ? 'pointer' : 'default';
        };

        // Helpers snapshot ordine passi
        const getStepsOrderList = (steps) => (steps || []).map(s => ({ id: Number(s.id), ordine: Number(s.ordine), sottopasso: Number(s.sottopasso) }))
            .sort((a,b) => a.ordine === b.ordine ? a.sottopasso - b.sottopasso : a.ordine - b.ordine);

        const restoreStepsOrder = async () => {
            const wfId = workflowState.selectedId;
            if (!wfId) return;
            const backup = workflowState.orderBackup[wfId];
            const current = getStepsOrderList((workflowState.detailCache[wfId] || {}).steps || []);
            if (!backup || !backup.length) { alert('Nessun ordine di riferimento salvato.'); return; }
            await applyStepsOrder(wfId, backup);
            try { showToast('Ordine ripristinato', { type: 'success' }); } catch (e) {}
        };

        const snapshotCurrentStepsOrder = () => {
            const wfId = workflowState.selectedId;
            if (!wfId) return;
            const steps = (workflowState.detailCache[wfId] || {}).steps || [];
            workflowState.orderBackup[wfId] = (steps || []).map(s => ({ id: Number(s.id), ordine: Number(s.ordine), sottopasso: Number(s.sottopasso) }));
            try { showToast('Snapshot ordine aggiornato', { type: 'success' }); } catch (e) {}
            updateStepsOrderStatus();
        };

        const snapshotCurrentStepsOrderAndResetHistory = () => {
            const wfId = workflowState.selectedId;
            if (!wfId) return;
            const steps = (workflowState.detailCache[wfId] || {}).steps || [];
            const order = (steps || []).map(s => ({ id: Number(s.id), ordine: Number(s.ordine), sottopasso: Number(s.sottopasso) }));
            workflowState.orderBackup[wfId] = order;
            workflowState.orderHistory[wfId] = { stack: [order], index: 0 };
            try { showToast('Base impostata e history azzerata', { type: 'success' }); } catch (e) {}
            updateStepsOrderStatus();
            updateStepsHistoryUI();
        };

        const updateStepsHistoryUI = () => {
            const wfId = workflowState.selectedId;
            const hist = wfId ? workflowState.orderHistory[wfId] : null;
            const canUndo = !!hist && hist.index > 0;
            const canRedo = !!hist && hist.index < (hist.stack.length - 1);
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
                let steps = (workflowState.detailCache[wfId]?.steps) || [];
                const step = steps.find(s => Number(s.id) === Number(stepId));
                if (!step) return;
                const currentOrder = Number(step.ordine) || 1;
                const targetOrder = currentOrder + (delta > 0 ? 1 : -1);
                if (targetOrder < 1) return;
                // Re-numera source: chiude il buco del sottopasso
                const src = steps.filter(s => Number(s.ordine) === currentOrder && Number(s.id) !== Number(stepId))
                                  .sort((a,b) => Number(a.sottopasso) - Number(b.sottopasso));
                const tgt = steps.filter(s => Number(s.ordine) === targetOrder)
                                  .sort((a,b) => Number(a.sottopasso) - Number(b.sottopasso));
                const updates = [];
                // Aggiorna il passo spostato: nuovo ordine e sottopasso in coda
                updates.push({ id: Number(stepId), ordine: targetOrder, sottopasso: tgt.length + 1 });
                // Rinumera i sottopassi della sorgente
                src.forEach((s, idx) => {
                    const newSub = idx + 1;
                    if (Number(s.sottopasso) !== newSub) {
                        updates.push({ id: Number(s.id), sottopasso: newSub, ordine: currentOrder });
                    }
                });

                for (const u of updates) {
                    await authFetch(`workflowsteps/${u.id}`, { method: 'PUT', json: true, body: { ordine: u.ordine, sottopasso: u.sottopasso } });
                }
                await loadWorkflowDetail(wfId);
                try { showToast('Ordine passi aggiornato', { type: 'success' }); } catch (e) {}
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
            return list.filter(item => item && typeof item === 'object' && item.id !== undefined);
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
                try { populateRoleUserSupervisorSelect(); } catch (e) {}
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

                        state.users.forEach(user => {
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
                        try { supervised = await authFetch(`utenti/${state.currentUserId}/supervised`); } catch (e) { supervised = []; }
                        supervised = Array.isArray(supervised) ? supervised : [];
                        if (supervised.length === 0) {
                            dom.userSelector.innerHTML = '<option value="all" disabled>Nessun utente associato</option>';
                        } else {
                            supervised.forEach(user => {
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
                        const currentUser = state.users.find(u => Number(u.id) === Number(state.currentUserId))
                            || {
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
            const supervisors = (state.users || []).filter(u => (u.ruolo || '').toUpperCase() === 'SUPERVISOR');
            const counts = new Map();
            (state.users || []).forEach(u => {
                (u.supervisors || []).forEach(s => {
                    const id = Number(s.id);
                    counts.set(id, (counts.get(id) || 0) + 1);
                });
            });
            supervisors.forEach(s => {
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
            state.users.forEach(u => {
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
                if (selected && selected.dataset.role) dom.roleRoleSelect.value = selected.dataset.role;
            }
        };

        const renderUsersByRole = () => {
            if (!dom.usersByRole) return;
            const byRole = { ADMIN: [], SUPERVISOR: [], USER: [] };
            const q = (dom.filterUsersByRole?.value || '').toLowerCase();
            const onlyActive = !!dom.toggleUsersByRoleActive?.checked;
            const supSel = dom.filterUsersByRoleSupervisor;
            const supFilter = supSel ? supSel.value : 'all';
            (state.users || []).forEach(u => {
                const r = (u.ruolo || 'USER').toUpperCase();
                if (!byRole[r]) byRole[r] = [];
                const label = (buildUserLabel(u) || '').toLowerCase();
                const isActive = String(u.stato || 'ATTIVO').toUpperCase() === 'ATTIVO';
                if (q && !label.includes(q)) return;
                if (onlyActive && !isActive) return;
                if (supFilter && supFilter !== 'all') {
                    const sid = Number(supFilter);
                    if (!(Array.isArray(u.supervisors) && u.supervisors.some(s => Number(s.id) === sid))) return;
                }
                byRole[r].push(u);
            });
            const renderList = (container, list) => {
                if (!container) return;
                if (!list || list.length === 0) { container.innerHTML = '<p class="form-hint">Nessun utente.</p>'; return; }
                container.innerHTML = list
                    .map(u => `<div class="list-item"><div class="item-header"><strong>${sanitize(buildUserLabel(u))}</strong><span class="badge">${sanitize(u.ruolo || '')}</span></div></div>`)
                    .join('');
            };
            renderList(dom.listRoleAdmin, byRole.ADMIN);
            renderList(dom.listRoleSupervisor, byRole.SUPERVISOR);
            renderList(dom.listRoleUser, byRole.USER);
            if (dom.countRoleAdmin) dom.countRoleAdmin.textContent = String(byRole.ADMIN.length || 0);
            if (dom.countRoleSupervisor) dom.countRoleSupervisor.textContent = String(byRole.SUPERVISOR.length || 0);
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
            const supervisors = (state.users || []).filter(u => (u.ruolo || '').toUpperCase() === 'SUPERVISOR');
            supervisors.forEach(s => {
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
                    dom.roleRoleSelect.value = (opt.dataset.role || 'USER');
                }
                const userId = dom.roleUserSelect.value;
                const role = (dom.roleRoleSelect.value || '').toUpperCase();
                if (dom.supervisedSection) dom.supervisedSection.hidden = (role !== 'SUPERVISOR');
                if (role === 'SUPERVISOR') {
                    populateSupervisedMulti();
                    preselectSupervised(userId);
                }
                // Supervisione per USER
                const userSupField = document.getElementById('user-supervisor-field');
                if (userSupField) userSupField.hidden = (role !== 'USER');
                if (role === 'USER') {
                    populateRoleUserSupervisorSelect();
                    preselectRoleUserSupervisor(userId);
                }
            });
        }

        if (dom.roleSaveBtn) {
            dom.roleSaveBtn.addEventListener('click', async () => {
                if (!state.permissions.manageRoles) { alert('Permesso negato.'); return; }
                const uid = dom.roleUserSelect?.value;
                const role = dom.roleRoleSelect?.value;
                if (!uid || !role) { alert('Seleziona utente e ruolo.'); return; }
                try {
                    if (dom.roleSaveStatus) dom.roleSaveStatus.textContent = 'Salvataggio ruolo…';
                    await authFetch(`utenti/${uid}`, { method: 'PUT', json: true, body: { ruolo: role } });
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
                        } catch (e) { /* ignore */ }
                    }
                    await loadUsers();
                    renderUsersList();
                    if (state.permissions.manageRoles) { try { await loadRoleAudit(); } catch(e){} }
                    if (dom.roleSaveStatus) dom.roleSaveStatus.textContent = 'Ruolo aggiornato e registrato in audit.';
                    try { showToast('Ruolo aggiornato', { type: 'success' }); } catch (e) {}
                } catch (e) {
                    const msg = e.message || 'Errore aggiornamento ruolo.';
                    if (dom.roleSaveStatus) dom.roleSaveStatus.textContent = msg;
                    try { showToast(msg, { type: 'error' }); } catch (err) {}
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
            const supervisors = (state.users || []).filter(u => (u.ruolo || '').toUpperCase() === 'SUPERVISOR');
            if (supervisors.length === 0) {
                const opt = document.createElement('option');
                opt.value = '';
                opt.disabled = true;
                opt.textContent = 'Nessun supervisor disponibile';
                roleUserSupervisorSelect.appendChild(opt);
            } else {
                supervisors.forEach(s => {
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
            } catch (e) { /* ignore */ }
        };

        // Aggiorna campo supervisor quando cambia il ruolo selezionato
        if (dom.roleRoleSelect) {
            dom.roleRoleSelect.addEventListener('change', () => {
                const role = (dom.roleRoleSelect.value || '').toUpperCase();
                const userSupField = document.getElementById('user-supervisor-field');
                if (userSupField) userSupField.hidden = (role !== 'USER');
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
                if (!uid) { showToast('Seleziona un utente', { type: 'warn' }); return; }
                const role = (dom.roleRoleSelect?.value || '').toUpperCase();
                if (role !== 'USER') { showToast('Supervisor disponibile solo per utenti USER', { type: 'warn' }); return; }
                const supId = roleUserSupervisorSelect?.value || '';
                try {
                    await authFetch(`utenti/${uid}/set_supervisor/${supId || 0}`, { method: 'POST' });
                    if (roleUserSupervisorStatus) roleUserSupervisorStatus.textContent = 'Supervisor impostato.';
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
                } catch (e) { /* ignore */ }
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
            const u = (state.users || []).find(x => String(x.id) === String(uid));
            if (btnRoleEditUser) btnRoleEditUser.disabled = false;
            const isActive = String(u?.stato || 'ATTIVO').toUpperCase() === 'ATTIVO';
            if (btnRoleDeactivateUser) btnRoleDeactivateUser.disabled = !isActive;
            if (btnRoleRestoreUser) btnRoleRestoreUser.hidden = isActive;
        };

        dom.roleUserSelect?.addEventListener('change', refreshRoleUserButtons);

        if (btnRoleEditUser) {
            btnRoleEditUser.addEventListener('click', () => {
                const uid = dom.roleUserSelect?.value;
                if (!uid) { alert('Seleziona un utente.'); return; }
                openUserModal('edit', Number(uid));
            });
        }
        if (btnRoleDeactivateUser) {
            btnRoleDeactivateUser.addEventListener('click', async () => {
                const uid = dom.roleUserSelect?.value;
                if (!uid) { alert('Seleziona un utente.'); return; }
                await handleDeleteUser(Number(uid));
                await loadUsers();
                populateRoleUserSelect();
                refreshRoleUserButtons();
            });
        }
        if (btnRoleRestoreUser) {
            btnRoleRestoreUser.addEventListener('click', async () => {
                const uid = dom.roleUserSelect?.value;
                if (!uid) { alert('Seleziona un utente.'); return; }
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
                { container: dom.todoCol, endpoint: buildTaskEndpoint(1, 'unassigned=true'), empty: 'Nessun task da fare.' },
                { container: dom.doingCol, endpoint: buildTaskEndpoint(2), empty: 'Nessun task in gestione.' },
                { container: dom.doneCol, endpoint: buildTaskEndpoint(3), empty: 'Nessun task completato.' },
            ];

            const results = await Promise.all(tasksContainers.map(async ({ container, endpoint, empty }) => {
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
            }));

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
                'metric-alerts': flatTasks.filter(task => task.stato === 'ANNULLATO').length,
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
                if (workflowState.search && workflowState.search.trim()) params.set('search', workflowState.search.trim());
                const qs = params.toString();
                const workflows = await authFetch('workflows' + (qs ? `?${qs}` : ''));
                workflowState.list = Array.isArray(workflows) ? workflows : [];
                renderWorkflowList();
                if (!workflowState.list.length) {
                    renderWorkflowDetail(null);
                    return;
                }
                if (workflowState.selectedId && !workflowState.list.some(wf => wf.id === workflowState.selectedId)) {
                    workflowState.selectedId = workflowState.list[0].id;
                }
                if (!workflowState.selectedId) {
                    await loadWorkflowDetail(workflowState.list[0].id);
                } else {
                    delete workflowState.detailCache[workflowState.selectedId];
                    await loadWorkflowDetail(workflowState.selectedId);
                }
            } catch (error) {
                renderMessage(dom.workflowsList, error.message || 'Errore nel caricamento dei workflow.');
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
                return (tipo === 'CLIENTE' && eid === clientFilterId);
            };

            instanceState.list.forEach(istanza => {
                const childrenList = instanceState.childrenCache[String(istanza.id)] || [];
                const childMatches = Array.isArray(childrenList) && childrenList.some(c => matchesClient(c));
                if (clientFilterId && !(matchesClient(istanza) || childMatches)) {
                    return;
                }
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'instance-card' + (Number(istanza.id) === Number(instanceState.selectedId) ? ' is-active' : '');
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
                const who = instanceState.assignees[key] || '';
                const full = instanceState.assigneesFull[key] || [];
                const count = full.length || 0;
                const expanded = !!instanceState.assigneesExpanded[key];
                const assEl = document.createElement('small');
                assEl.className = 'instance-assignees has-tip';
                assEl.dataset.tip = full.length ? `Tutti: ${full.join(', ')}` : 'Nessuno in carico';
                const shownNames = expanded ? (full) : (full.slice(0, 3));
                const map = instanceState.assigneeMap[key] || [];
                const toId = (nm) => {
                    const m = map.find(x => x.name === nm);
                    return m ? m.id : null;
                };
                const htmlNames = shownNames.map(nm => {
                    const uid = toId(nm);
                    return uid ? `<a class="assignee-link" data-user-id="${uid}">${sanitize(nm)}</a>` : sanitize(nm);
                }).join(', ');
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
                } catch (e) { /* ignore */ }

                dom.instancesList.appendChild(button);

                // Mostra anche istanze correlate (figlie) con evidenza
                if (Array.isArray(childrenList) && childrenList.length) {
                    const showChildren = clientFilterId ? childrenList.filter(c => matchesClient(c)) : childrenList;
                    showChildren.forEach(child => {
                        const cbtn = document.createElement('button');
                        cbtn.type = 'button';
                        cbtn.className = 'instance-card instance-card--child' + (Number(child.id) === Number(instanceState.selectedId) ? ' is-active' : '');
                        cbtn.dataset.id = child.id;
                        const chTitle = document.createElement('h4');
                        const chName = child.nome_workflow || 'Workflow';
                        chTitle.textContent = `#${child.id} · ${chName}`;
                        const chMeta = document.createElement('small');
                        const chStatus = humanizeStatus(child.stato_istanza || child.stato);
                        const chStarted = child.avviato_il ? formatDateTime(child.avviato_il) : '--';
                        chMeta.textContent = `${chStatus} • ${chStarted} • Sub di #${istanza.id}`;
                        cbtn.appendChild(chTitle);
                        cbtn.appendChild(chMeta);
                        dom.instancesList.appendChild(cbtn);
                    });
                }
            });
        };

        const renderInstanceDetail = (detail) => {
            if (!instanceDetailEls.name) return;

            if (!detail) {
                instanceDetailEls.name.textContent = 'Nessuna istanza selezionata';
                if (instanceDetailEls.description) instanceDetailEls.description.textContent = 'Seleziona una istanza per visualizzare workflow, progressi e task.';
                if (instanceDetailEls.workflow) instanceDetailEls.workflow.textContent = '--';
                if (instanceDetailEls.status) instanceDetailEls.status.textContent = '--';
                if (instanceDetailEls.started) instanceDetailEls.started.textContent = '--';
                if (instanceDetailEls.startedBy) instanceDetailEls.startedBy.textContent = '--';
                if (instanceDetailEls.updated) instanceDetailEls.updated.textContent = '--';
                if (instanceDetailEls.tasks) {
                    instanceDetailEls.tasks.innerHTML = '<p>Seleziona una istanza per visualizzare i task.</p>';
                }
                return;
            }

            const info = instanceState.list.find(item => Number(item.id) === Number(detail.id)) || detail;
            const workflowName = info.nome_workflow || detail.nome_workflow || `Workflow #${detail.workflow_modello_id}`;
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
                tasksForTs.forEach(t => {
                    if (t.completato_il) candidateTs.push(t.completato_il);
                    if (t.assegnato_il) candidateTs.push(t.assegnato_il);
                    if (t.data_aggiornamento) candidateTs.push(t.data_aggiornamento);
                    if (t.avviato_il) candidateTs.push(t.avviato_il);
                });
            } catch (e) { /* ignore */ }
            const updatedAt = candidateTs.length
                ? candidateTs.reduce((max, ts) => {
                    const d = new Date(ts);
                    return (isNaN(d.getTime()) ? max : Math.max(max, d.getTime()));
                }, 0)
                : null;
            const description = detail.entita_collegata_tipo
                ? `Collegata a ${detail.entita_collegata_tipo}${detail.entita_collegata_id ? ` #${detail.entita_collegata_id}` : ''}`
                : 'Dettaglio workflow in corso.';

            instanceDetailEls.name.textContent = workflowName;
            if (instanceDetailEls.description) instanceDetailEls.description.textContent = description;
            if (instanceDetailEls.workflow) instanceDetailEls.workflow.textContent = workflowName;
            if (instanceDetailEls.status) instanceDetailEls.status.textContent = humanizeStatus(stato);
            if (instanceDetailEls.started) instanceDetailEls.started.textContent = formatDateTime(startedAt);
            if (instanceDetailEls.startedBy) instanceDetailEls.startedBy.textContent = startedBy || '--';
            if (instanceDetailEls.updated) instanceDetailEls.updated.textContent = updatedAt ? formatDateTime(new Date(updatedAt)) : '--';

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
                        } catch (e) { /* ignore */ }
                    })();
                }
            } catch (e) { /* ignore */ }

            if (instanceDetailEls.tasks) {
                const tasks = Array.isArray(detail.tasks) ? detail.tasks : normalizeListResponse(detail.tasks, ['tasks', 'records', 'items']);
                if (!tasks.length) {
                    instanceDetailEls.tasks.innerHTML = '<p>Nessun task generato per questa istanza.</p>';
                } else {
                    const rows = tasks.map(task => {
                        const stepParts = [];
                        if (task.step_ordine !== undefined && task.step_ordine !== null) {
                            stepParts.push(task.step_ordine);
                        }
                        if (task.step_sottopasso !== undefined && task.step_sottopasso !== null) {
                            stepParts.push(task.step_sottopasso);
                        }
                        const stepLabel = stepParts.length ? stepParts.join('.') : '—';
                        const name = task.nome || `Task #${task.id}`;
                        const status = humanizeStatus(task.stato || task.stato_nome);
                        const assignee = task.nome_utente_completo || task.assegnato_a_nome || (task.assegnato_a_utente_id ? `Utente #${task.assegnato_a_utente_id}` : 'Non assegnato');
                        const updated = task.completato_il || task.assegnato_il || task.data_aggiornamento || '';

                        return `
                            <tr>
                                <td>${sanitize(stepLabel)}</td>
                                <td>${sanitize(name)}</td>
                                <td>${sanitize(status)}</td>
                                <td>${sanitize(assignee)}</td>
                                <td>${sanitize(updated ? formatDateTime(updated) : '--')}</td>
                            </tr>
                        `;
                    }).join('');

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
                const setLabel = (text) => { instanceDetailEls.assignees.textContent = text && text.trim() ? text : '—'; };
                if (label) {
                    setLabel(label);
                } else {
                    // Fallback: carica in tempo reale
                    (async () => {
                        try {
                            const data = await authFetch(`tasks?workflow_istanza_id=${detail.id}&id_stato=2`);
                            const list = normalizeListResponse(data, ['tasks', 'records', 'items']);
                            const names = [];
                            (list || []).forEach(t => {
                                const n = (t.nome_utente_completo && String(t.nome_utente_completo).trim()) || (t.assegnato_a_utente_id ? `Utente #${t.assegnato_a_utente_id}` : '');
                                if (n && !names.includes(n)) names.push(n);
                            });
                            label = names.join(', ');
                            if (names.length > 3) label = names.slice(0, 3).join(', ') + ` +${names.length - 3}`;
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
                    const children = await authFetch(`workflowistanze?id_istanza_padre=${detail.id}`);
                    const list = normalizeListResponse(children, ['istanze', 'records', 'items']);
                    // Banner di stato sottoworkflow
                    try {
                        const total = list.length;
                        const open = list.filter(inst => String(inst.stato || inst.stato_istanza) !== 'COMPLETATO').length;
                        const header = instanceDetailEls.container?.querySelector('.instance-detail__header');
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
                    } catch (e) { /* ignore */ }
                    const myCompleted = list.filter(inst => String(inst.stato || inst.stato_istanza) === 'COMPLETATO' && Number(inst.avviato_da) === Number(state.currentUserId));
                    if (myCompleted.length) {
                        loadSeenSubflows();
                        let newOnes = 0;
                        myCompleted.forEach(inst => {
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
                ? state.taskBuckets.doing.filter(task => Number(task.assegnato_a_utente_id) === userId)
                : [];
            const pending = Array.isArray(state.taskBuckets.todo)
                ? state.taskBuckets.todo.filter(task => !task.assegnato_a_utente_id)
                : [];

            const statusClass = (raw) => {
                if (raw === 'APERTO') return 'status--open';
                if (raw === 'IN_LAVORAZIONE') return 'status--doing';
                if (raw === 'COMPLETATO') return 'status--done';
                return '';
            };

            const renderCards = (rows, type) => rows.map(task => {
                const workflow = sanitize(task.nome_workflow || `Workflow #${task.workflow_modello_id}`);
                const name = sanitize(task.nome || `Task #${task.id}`);
                const assignee = sanitize(task.nome_utente_completo || '—');
                const status = sanitize(humanizeStatus(task.stato || task.stato_nome));
                const step = (task.step_ordine !== undefined && task.step_sottopasso !== undefined)
                    ? `${task.step_ordine}.${task.step_sottopasso}` : '—';
                const id = sanitize(task.id);
                const instId = sanitize(task.workflow_istanza_id);
                const rawStatus = String(task.stato || task.stato_nome);
                const sclass = statusClass(rawStatus);

                const actions = type === 'assigned'
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
            }).join('');

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
                    if (openBtn) { ev.preventDefault(); loadTaskDetail(openBtn.dataset.taskId); return; }
                    if (takeBtn) { ev.preventDefault(); handleTaskTake(takeBtn.dataset.taskId); return; }
                    if (completeBtn) { ev.preventDefault(); handleTaskComplete(completeBtn.dataset.taskId); return; }
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
                toolbar.querySelectorAll('.segmented__btn').forEach(b => {
                    b.classList.toggle('is-active', b === btn);
                    b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
                });
                applyFilter(btn.dataset.opsFilter);
            });

            applyFilter('all');
            // Esporta funzione globale per uso esterno
            window.__lpwfSetOpsFilter = (mode) => {
                const btn = toolbar.querySelector(`.segmented__btn[data-ops-filter="${mode}"]`) || toolbar.querySelector('.segmented__btn');
                if (!btn) return;
                toolbar.querySelectorAll('.segmented__btn').forEach(b => {
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
            try { window.__lpwfSetOpsFilter && window.__lpwfSetOpsFilter('mine'); } catch (e) {}
            loadTasks();
        };

        const populateSubflowSelectors = () => {
            if (!taskModalElements.subflowWorkflow) return;

            const selectWorkflow = taskModalElements.subflowWorkflow;
            selectWorkflow.innerHTML = '<option value="">Seleziona workflow...</option>';
            workflowState.list.forEach(wf => {
                const opt = document.createElement('option');
                opt.value = wf.id;
                opt.textContent = sanitize(wf.nome_workflow || wf.nome || `Workflow #${wf.id}`);
                selectWorkflow.appendChild(opt);
            });

            const selectUser = taskModalElements.subflowUser;
            if (selectUser) {
                selectUser.innerHTML = '<option value="">Seleziona operatore...</option>';
                state.users.forEach(user => {
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
            const workflowLabel = sanitize(task.nome_workflow || `Workflow #${task.workflow_modello_id}`);
            const statusLabel = sanitize(humanizeStatus(task.stato || task.stato_nome));
            const assigneeLabel = task.nome_utente_completo
                ? sanitize(task.nome_utente_completo)
                : (task.assegnato_a_utente_id ? `Utente #${task.assegnato_a_utente_id}` : 'Nessuno');
            const updatedLabel = task.completato_il || task.assegnato_il || task.data_aggiornamento || task.avviato_il;
            const isMine = Number(task.assegnato_a_utente_id) === Number(state.currentUserId);
            const isOpen = (task.stato || task.stato_nome) === 'APERTO';
            const isInProgress = (task.stato || task.stato_nome) === 'IN_LAVORAZIONE';
            const hasNotes = Array.isArray(state.activeTaskNotes) && state.activeTaskNotes.length > 0;
            const subflows = Array.isArray(state.activeTaskSubflows) ? state.activeTaskSubflows : [];
            const openSubflows = subflows.filter(s => String(s.stato || s.stato_istanza) !== 'COMPLETATO');

            taskModalElements.title.textContent = sanitize(task.nome || `Task #${task.id}`);
            if (taskModalElements.workflow) taskModalElements.workflow.textContent = workflowLabel;
            if (taskModalElements.status) taskModalElements.status.textContent = statusLabel;
            if (taskModalElements.assignee) taskModalElements.assignee.textContent = assigneeLabel;
            if (taskModalElements.updated) taskModalElements.updated.textContent = updatedLabel ? formatDateTime(updatedLabel) : '--';

            if (taskModalElements.takeBtn) {
                taskModalElements.takeBtn.dataset.taskId = task.id;
                taskModalElements.takeBtn.hidden = !(isOpen || (!task.assegnato_a_utente_id && !isMine));
            }

            if (taskModalElements.completeBtn) {
                taskModalElements.completeBtn.dataset.taskId = task.id;
                taskModalElements.completeBtn.hidden = !isMine || !isInProgress;
                // Disabilita se mancano note o ci sono sottoworkflow aperti
                taskModalElements.completeBtn.disabled = (!hasNotes || openSubflows.length > 0);
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
                    taskModalElements.notesList.innerHTML = '<p class="empty-state">Nessuna nota presente.</p>';
                } else {
                    const items = state.activeTaskNotes.map(note => {
                        const author = [note.utente_nome, note.utente_cognome].filter(Boolean).join(' ').trim();
                        const timestamp = note.data_creazione ? formatDateTime(note.data_creazione) : '';
                        const body = sanitize(note.nota || '');
                        const atts = Array.isArray(note.allegati) && note.allegati.length
                          ? ('<div class="task-note__attachments">' + note.allegati.map(a => `<a href="${sanitize(a.percorso)}" target="_blank" rel="noopener">${sanitize(a.nome_file)}</a>`).join(' ') + '</div>')
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
                    }).join('');
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
                        sec.innerHTML = '<h4>Sottoworkflow correlati</h4><p class="form-hint">Nessun sottoworkflow avviato da questo task.</p>';
                    } else {
                        const items = subflows.map(inst => {
                            const sid = sanitize(inst.id);
                            const st = sanitize(String(inst.stato || inst.stato_istanza));
                            const name = sanitize(inst.nome_workflow || `Workflow #${inst.workflow_modello_id || ''}`);
                            return `<li><a href="#" class="btn-link" data-action="open-instance" data-inst-id="${sid}">#${sid}</a> · ${name} · <strong>${st}</strong></li>`;
                        }).join('');
                        const warn = openSubflows.length ? `<p class="form-hint" style="color:#b91c1c;">Attenzione: ${openSubflows.length} sottoworkflow non completato/i. Completa prima i sottoworkflow per poter chiudere il task.</p>` : '';
                        sec.innerHTML = `<h4>Sottoworkflow correlati</h4><ul>${items}</ul>${warn}`;
                    }
                }
            } catch (e) { /* ignore */ }
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
                    const list = normalizeListResponse(children, ['istanze','records','items']);
                    state.activeTaskSubflows = (list || []).filter(x => String(x.entita_collegata_tipo) === 'SOTTOPROCESSO' && String(x.entita_collegata_id) === String(detail.id));
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
                try { showToast(`Task #${taskId} preso in carico`, { type: 'success' }); } catch (e) {}
            } catch (error) {
                try { showToast(error.message || 'Impossibile prendere in carico il task.', { type: 'error' }); } catch (e) {}
            }
        };

        const preCheckTaskComplete = async (taskId) => {
            try {
                const task = await authFetch(`tasks/${taskId}`);
                // Note
                let notes = [];
                try { notes = await authFetch(`tasks/${taskId}/note`); } catch (e) { notes = []; }
                const hasNotes = Array.isArray(notes) && notes.length > 0;
                if (!hasNotes) {
                    return { ok: false, reason: 'Inserisci almeno una nota prima di completare il task.' };
                }
                // Subflows
                let children = [];
                try {
                    const resp = await authFetch(`workflowistanze?id_istanza_padre=${task.workflow_istanza_id}`);
                    children = normalizeListResponse(resp, ['istanze','records','items']);
                } catch (e) { children = []; }
                const subs = (children || []).filter(x => String(x.entita_collegata_tipo) === 'SOTTOPROCESSO' && String(x.entita_collegata_id) === String(taskId));
                const openSubs = subs.filter(s => String(s.stato || s.stato_istanza) !== 'COMPLETATO');
                if (openSubs.length > 0) {
                    return { ok: false, reason: `Esiste un sottoworkflow correlato non completato (ID: ${openSubs.map(s=>s.id).join(', ')}). Completa prima il flusso correlato.` };
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
                    try { showToast(check.reason, { type: 'error' }); } catch (e) {}
                    // se il task aperto non è in modale, aprilo per maggiori info
                    if (!state.activeTask || Number(state.activeTask.id) !== Number(taskId)) {
                        try { await loadTaskDetail(taskId); } catch (e) {}
                    } else {
                        // aggiorna UI del bottone disabilitandolo
                        renderTaskModal();
                    }
                    return;
                }
                await authFetch(`tasks/${taskId}/complete`, { method: 'PUT', json: true, body: {} });
                closeAllModals();
                await Promise.all([loadTasks(), loadInstances()]);
                try { showToast(`Task #${taskId} completato`, { type: 'success' }); } catch (e) {}
            } catch (error) {
                try { showToast(error.message || 'Impossibile completare il task.', { type: 'error' }); } catch (e) {}
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
                const noteId = (res && typeof res === 'object') ? res.id : null;
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
                    if (oks.length) showToast(`Caricati: ${oks.join(', ')}`, { type: 'success', duration: 6000 });
                    if (errs.length) showToast(`Scartati: ${errs.join(' | ')}`, { type: 'warn', duration: 8000 });
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
                } catch (e) { /* ignore */ }
                try { showToast('Nota salvata', { type: 'success' }); } catch (e) {}
            } catch (error) {
                try { showToast(error.message || 'Errore durante il salvataggio della nota.', { type: 'error' }); } catch (e) {}
            }
        };

        const handleTaskSubflowSubmit = async (event) => {
            event.preventDefault();
            if (!state.activeTask || !taskModalElements.subflowWorkflow) return;

            const workflowId = Number(taskModalElements.subflowWorkflow.value);
            const userId = taskModalElements.subflowUser ? Number(taskModalElements.subflowUser.value) || null : null;

            if (!workflowId) {
                if (taskModalElements.subflowMessage) {
                    taskModalElements.subflowMessage.textContent = 'Seleziona un workflow da avviare.';
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
                    taskModalElements.subflowMessage.textContent = 'Sottoworkflow avviato con successo.';
                }
                await Promise.all([loadTaskDetail(state.activeTask.id), loadInstances()]);
                try { showToast('Sottoworkflow avviato', { type: 'success' }); } catch (e) {}
            } catch (error) {
                if (taskModalElements.subflowMessage) {
                    taskModalElements.subflowMessage.textContent = error.message || 'Errore durante l\'avvio del sottoworkflow.';
                } else {
                    try { showToast(error.message || 'Errore durante l\'avvio del sottoworkflow.', { type: 'error' }); } catch (e) {}
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
                    detail.tasks = normalizeListResponse(detail.tasks, ['tasks', 'records', 'items']);
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
                    ? list.map(item => ({
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

                if (!instanceState.selectedId || !instanceState.list.some(item => Number(item.id) === Number(instanceState.selectedId))) {
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
            const promises = instanceState.list.map(async inst => {
                try {
                    const children = await authFetch(`workflowistanze?id_istanza_padre=${inst.id}`);
                    const list = normalizeListResponse(children, ['istanze', 'records', 'items']);
                    instanceState.childrenCache[String(inst.id)] = list;
                    const mine = list.filter(child => Number(child.avviato_da) === Number(state.currentUserId));
                    const done = mine.filter(child => String(child.stato || child.stato_istanza) === 'COMPLETATO').length;
                    const doing = mine.filter(child => String(child.stato || child.stato_istanza) !== 'COMPLETATO').length;
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
                        const data = await authFetch(`tasks?workflow_istanza_id=${inst.id}&id_stato=2`);
                        const list = normalizeListResponse(data, ['tasks', 'records', 'items']);
                        return { id: inst.id, tasks: list };
                    } catch (e) {
                        return { id: inst.id, tasks: [] };
                    }
                })
            );
            tasksPerInstance.forEach(({ id, tasks }) => {
                const names = [];
                const pairs = [];
                (tasks || []).forEach(t => {
                    const n = (t.nome_utente_completo && String(t.nome_utente_completo).trim()) || (t.assegnato_a_utente_id ? `Utente #${t.assegnato_a_utente_id}` : '');
                    if (n && !names.includes(n)) names.push(n);
                    if (n && t.assegnato_a_utente_id && !pairs.find(x => x.id === t.assegnato_a_utente_id)) {
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
            const comp = children.filter(c => String(c.stato || c.stato_istanza) === 'COMPLETATO');
            const prog = children.filter(c => String(c.stato || c.stato_istanza) !== 'COMPLETATO');
            const fmt = (arr) => arr.map(c => {
                const id = c.id;
                const stato = humanizeStatus(c.stato || c.stato_istanza);
                const who = c.nome_utente_avvio || '';
                return `#${id} ${stato}${who ? ' • ' + who : ''}`;
            });
            const compLines = fmt(comp).slice(0, 4);
            const progLines = fmt(prog).slice(0, 4);
            const moreC = comp.length > compLines.length ? ` (+${comp.length - compLines.length})` : '';
            const moreP = prog.length > progLines.length ? ` (+${prog.length - progLines.length})` : '';
            let tip = '';
            if (progLines.length) tip += 'In corso:\n' + progLines.join('\n') + moreP + '\n';
            if (compLines.length) tip += (progLines.length ? '\n' : '') + 'Completati:\n' + compLines.join('\n') + moreC;
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
                    list = list.filter(g => {
                        const name = (g.nome_gruppo || g.nome || '').toLowerCase();
                        const descr = (g.descrizione || '').toLowerCase();
                        return name.includes(q) || descr.includes(q);
                    });
                }
                if (!state.filters.groupsIncludeInactive) {
                    list = list.filter(g => (g.attivo === undefined || g.attivo === null) ? true : (Number(g.attivo) === 1 || g.attivo === true));
                }
                // Filtro per contenuto utenti
                const hasUsers = state.filters.groupsHasUsers;
                if (hasUsers === 'with') {
                    list = list.filter(g => Number(g.users_count || 0) > 0);
                } else if (hasUsers === 'without') {
                    list = list.filter(g => Number(g.users_count || 0) === 0);
                }
                // Aggiorna titolo con conteggio
                try {
                    const ttl = document.getElementById('groups-panel-title');
                    if (ttl) ttl.textContent = `Gruppi di lavoro (${list.length || 0})`;
                } catch (e) { /* no-op */ }
                state.groups = list;
                dom.groupsList.innerHTML = '';
                state.groups.forEach(group => {
                    const count = Number(group.users_count || 0);
                    const baseName = sanitize(group.nome_gruppo || group.nome || `Gruppo #${group.id}`);
                    const name = `${baseName} (${count})`;
                    const descr = sanitize(group.descrizione || 'Nessuna descrizione');
                    const div = document.createElement('div');
                    const isInactive = !(Number(group.attivo) === 1 || group.attivo === true);
                    div.className = 'list-item' + (isInactive ? ' is-inactive' : '');
                    const badge = isInactive ? ' <span class="badge badge-error">Disattivato</span>' : ' <span class="badge badge-success">Attivo</span>';
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
                    (state.groups || []).forEach(g => {
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
                renderMessage(dom.groupsList, error.message || 'Errore nel caricamento dei gruppi.');
                state.groups = [];
                if (groupOptions) {
                    groupOptions.innerHTML = '';
                }
            }
        };

        const setupFilters = () => {
            const debounce = (fn, ms=300) => {
                let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
            };
            if (dom.filterUsers) {
                dom.filterUsers.addEventListener('input', debounce(() => {
                    state.filters.usersSearch = dom.filterUsers.value.trim();
                    renderUsersList();
                }));
            }
            if (dom.filterUsersGroup) {
                dom.filterUsersGroup.addEventListener('change', () => {
                    state.filters.usersGroupId = dom.filterUsersGroup.value || 'all';
                    // Filtra solo client-side
                    renderUsersList();
                });
            }
            if (dom.filterGroups) {
                dom.filterGroups.addEventListener('input', debounce(() => {
                    state.filters.groupsSearch = dom.filterGroups.value.trim();
                    loadGroups();
                }));
            }
            // Ricerca modelli workflow
            const wfSearch = document.getElementById('filter-workflows-search');
            if (wfSearch) {
                wfSearch.addEventListener('input', debounce(() => {
                    workflowState.search = wfSearch.value || '';
                    loadWorkflows();
                }, 300));
            }
            if (dom.filterGroupsHasUsers) {
                dom.filterGroupsHasUsers.addEventListener('change', () => {
                    state.filters.groupsHasUsers = dom.filterGroupsHasUsers.value || 'all';
                    loadGroups();
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
                } catch (e) { return []; }
            };
            const populateClientOptions2 = (items) => {
                if (!instClientOptions) return;
                instClientOptions.innerHTML = '';
                (items || []).forEach(cli => {
                    const opt = document.createElement('option');
                    opt.value = `${cli.ragione_sociale} — ${cli.partita_iva || ''}`.trim();
                    opt.dataset.id = cli.id;
                    instClientOptions.appendChild(opt);
                });
            };
            const findClientOption2 = (label) => {
                if (!instClientOptions) return null;
                const opts = instClientOptions.querySelectorAll('option');
                for (const o of opts) { if (o.value === label) return o; }
                return null;
            };
            if (instClientLabel) {
                instClientLabel.addEventListener('input', debounce(async () => {
                    if (!instClientLabel.value || instClientLabel.value.length < 2) { populateClientOptions2([]); return; }
                    const list = await fetchClients2(instClientLabel.value.trim());
                    populateClientOptions2(list);
                }, 250));
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
            if (dom.filterAuthUser) dom.filterAuthUser.addEventListener('change', () => renderAuthAudit());
            if (dom.filterAuthAction) dom.filterAuthAction.addEventListener('change', () => renderAuthAudit());
            if (dom.filterAuthFrom) dom.filterAuthFrom.addEventListener('change', () => renderAuthAudit());
            if (dom.filterAuthTo) dom.filterAuthTo.addEventListener('change', () => renderAuthAudit());
            if (dom.btnAuthAuditReset) dom.btnAuthAuditReset.addEventListener('click', () => {
                if (dom.filterAuthUser) dom.filterAuthUser.value = 'all';
                if (dom.filterAuthAction) dom.filterAuthAction.value = 'all';
                if (dom.filterAuthFrom) dom.filterAuthFrom.value = '';
                if (dom.filterAuthTo) dom.filterAuthTo.value = '';
                if (dom.filterAuthLimit) {
                    const dflt = String(Number(state.config?.auditAuthDefaultLimit || AUDIT_AUTH_DEFAULT_LIMIT) || AUDIT_AUTH_DEFAULT_LIMIT);
                    dom.filterAuthLimit.value = dflt;
                }
                // Ricarica lista con il limite predefinito
                loadAuthAudit();
            });
            if (dom.filterAuthLimit) dom.filterAuthLimit.addEventListener('change', () => { loadAuthAudit(); updateAuditBadges(); });
            if (dom.btnAuthAuditRefresh) dom.btnAuthAuditRefresh.addEventListener('click', () => { loadAuthAudit(); updateAuditBadges(); });
            if (dom.btnRunDiagnostics) dom.btnRunDiagnostics.addEventListener('click', () => runDiagnostics());
            if (dom.btnTestLogout) dom.btnTestLogout.addEventListener('click', (e) => { e.preventDefault(); performLogout(); });
            if (dom.btnOpenAuditAuth) dom.btnOpenAuditAuth.addEventListener('click', () => {
                // Apri audit con il limite di default configurato
                const def = Number(state.config?.auditAuthDefaultLimit || AUDIT_AUTH_DEFAULT_LIMIT) || AUDIT_AUTH_DEFAULT_LIMIT;
                openAuditAuthPanel(def);
            });
            if (dom.btnAuthLimit500) dom.btnAuthLimit500.addEventListener('click', () => {
                openAuditAuthPanel(500);
            });
            if (dom.btnOpenAuditRoles) dom.btnOpenAuditRoles.addEventListener('click', () => {
                openAuditRolesPanel();
            });
            if (dom.btnRolesLimit500) dom.btnRolesLimit500.addEventListener('click', () => {
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
            if (btnDeleteGroup) btnDeleteGroup.hidden = (mode !== 'edit');
            if (groupMembersSection) groupMembersSection.hidden = true;
            if (groupMembersList) groupMembersList.innerHTML = '';

            if (adminUserOptions) populateDatalist(adminUserOptions, state.users || [], buildUserLabel);

            if (mode === 'edit' && id) {
                try {
                    const data = await authFetch(`gruppi/${id}`);
                    if (data) {
                        formManageGroup.elements.nome_gruppo.value = data.nome_gruppo || data.nome || '';
                        formManageGroup.elements.descrizione.value = data.descrizione || '';
                        if (formManageGroup.elements.attivo) {
                            formManageGroup.elements.attivo.checked = String(data.attivo) === '1' || data.attivo === 1 || data.attivo === true;
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
            users.forEach(u => {
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
            if (btnDeleteUser) btnDeleteUser.hidden = (mode !== 'edit');

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
                [...userGroupsMulti.options].forEach(opt => opt.selected = false);
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
                        if (formManageUser.elements.ruolo) formManageUser.elements.ruolo.value = data.ruolo || '';
                        if (formManageUser.elements.stato) formManageUser.elements.stato.value = data.stato || 'ATTIVO';
                    }
                    // Popola gruppi dell'utente
                    if (userGroupsMulti) {
                        // pre-seleziona gruppi correnti
                        const current = await fetchUserGroupIds(id);
                        [...userGroupsMulti.options].forEach(opt => {
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
            const supers = state.users.filter(u => (u.ruolo || '').toUpperCase() === 'SUPERVISOR');
            supers.forEach(u => {
                const opt = document.createElement('option');
                opt.value = u.id;
                opt.textContent = buildUserLabel(u);
                dom.userSupervisorSelect.appendChild(opt);
            });
        };

        const populateGroupsMulti = () => {
            if (!userGroupsMulti) return;
            userGroupsMulti.innerHTML = '';
            (state.groups || []).forEach(g => {
                const opt = document.createElement('option');
                opt.value = g.id;
                opt.textContent = buildGroupLabel(g) || `Gruppo #${g.id}`;
                userGroupsMulti.appendChild(opt);
            });
        };

        const fetchUserGroupIds = async (userId) => {
            try {
                const groups = await authFetch(`utenti/${userId}/groups`);
                const list = Array.isArray(groups) ? groups : normalizeListResponse(groups, ['gruppi','groups']);
                return list.map(g => Number(g.id)).filter(id => !Number.isNaN(id));
            } catch (e) {
                return [];
            }
        };

        const getSelectedGroupIdsFromMulti = () => {
            if (!userGroupsMulti) return [];
            return [...userGroupsMulti.selectedOptions].map(opt => Number(opt.value)).filter(v => !Number.isNaN(v));
        };

        const syncUserGroups = async (userId, selectedIds) => {
            const currentIds = await fetchUserGroupIds(userId);
            const selectedSet = new Set(selectedIds);
            const currentSet = new Set(currentIds);
            const toAdd = [...selectedSet].filter(id => !currentSet.has(id));
            const toRemove = [...currentSet].filter(id => !selectedSet.has(id));
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
                const list = Array.isArray(groups) ? groups : normalizeListResponse(groups, ['gruppi', 'groups']);
                renderUserGroups(userId, list);
            } catch (e) {
                userGroupsList.innerHTML = '<p class="empty-state">Errore nel caricamento dei gruppi.</p>';
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
            list.forEach(g => {
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
            try { await authFetch('auth/logout', { method: 'POST' }); } catch (e) { /* ignore */ }
            try {
                window.lpwfAuth?.clearToken?.();
                window.lpwfAuth?.clearCurrentUser?.();
            } catch (e) { /* ignore */ }
            window.location.href = 'login.html';
        };

        // Delegated global handler di massima priorità per assicurare il logout
        document.addEventListener('click', (ev) => {
            const target = ev.target;
            if (!target) return;
            const btn = target.closest?.('[data-action="logout"]');
            if (btn) { ev.preventDefault(); performLogout(); }
        }, true);

        // Delegated handler globale per bottone "Nuovo utente" anche fuori da dom.main
        document.addEventListener('click', (ev) => {
            const target = ev.target;
            if (!target) return;
            const btn = target.closest?.('[data-action="open-create-user"]');
            if (!btn) return;
            ev.preventDefault();
            if (!state.permissions.manageUsers) { alert('Permesso negato.'); return; }
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
            } catch (e) { /* ignore */ }
            document.getElementById('instance-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
                const container = instanceDetailEls.container || document.getElementById('instance-detail');
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
                try { showToast('Impossibile caricare dettagli cliente', { type: 'error' }); } catch (err) {}
            }
        });

        const initializeActionGuards = () => {
            if (!dom.main) return;
            dom.main.addEventListener('click', (event) => {
                const target = event.target;
                if (!target) return;

                if (target.closest('[data-action="open-create-workflow"]')) {
                    event.preventDefault();
                    if (!state.permissions.manageWorkflows) { alert('Permesso negato.'); return; }
                    openModal('modal-create-workflow');
                }

                if (target.closest('[data-action="open-create-step"]')) {
                    event.preventDefault();
                    if (!state.permissions.manageWorkflows) { alert('Permesso negato.'); return; }
                    if (!workflowState.selectedId) {
                        alert('Seleziona un workflow prima di aggiungere un passo.');
                        return;
                    }
                    resetStepForm();
                    openModal('modal-create-step');
                }

                if (target.closest('[data-action="open-edit-workflow"]')) {
                    event.preventDefault();
                    if (!state.permissions.manageWorkflows) { alert('Permesso negato.'); return; }
                    openEditWorkflow();
                }

                if (target.closest('[data-action="toggle-workflow-active"]')) {
                    event.preventDefault();
                    if (!state.permissions.manageWorkflows) { alert('Permesso negato.'); return; }
                    const id = workflowState.selectedId;
                    if (!id) { alert('Seleziona un workflow.'); return; }
                    const wf = workflowState.detailCache[id];
                    const next = wf && wf.attivo ? 0 : 1;
                    const label = next ? 'attivare' : 'disattivare';
                    if (!confirm(`Confermi di ${label} il workflow?`)) return;
                    (async () => {
                        try {
                            await authFetch(`workflows/${id}`, { method: 'PUT', json: true, body: { attivo: next } });
                            workflowState.detailCache = {};
                            await loadWorkflows();
                            await loadWorkflowDetail(id);
                            try { showToast(next ? 'Workflow attivato' : 'Workflow disattivato', { type: 'success' }); } catch (e) {}
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
                        document.getElementById('instance-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }

                // Groups/Users management
                if (target.closest('[data-action="open-create-group"]')) {
                    event.preventDefault();
                    if (!state.permissions.manageGroups) { alert('Permesso negato.'); return; }
                    openGroupModal('create');
                }
                if (target.closest('[data-action="edit-group"]')) {
                    event.preventDefault();
                    if (!state.permissions.manageGroups) { alert('Permesso negato.'); return; }
                    const id = Number(target.closest('[data-action="edit-group"]').dataset.id);
                    if (!Number.isNaN(id)) openGroupModal('edit', id);
                }
                if (target.closest('[data-action="delete-group"]')) {
                    event.preventDefault();
                    if (!state.permissions.manageGroups) { alert('Permesso negato.'); return; }
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
                    if (!state.permissions.manageUsers) { alert('Permesso negato.'); return; }
                    openUserModal('create');
                }
                if (target.closest('[data-action="delete-step"]')) {
                    event.preventDefault();
                    if (!state.permissions.manageWorkflows) { alert('Permesso negato.'); return; }
                    const btn = target.closest('[data-action="delete-step"]');
                    const stepId = Number(btn?.dataset.stepId);
                    if (Number.isNaN(stepId)) return;
                    if (!confirm('Confermi la cancellazione del passo?')) return;
                    (async () => {
                        try {
                            await authFetch(`workflowsteps/${stepId}`, { method: 'DELETE' });
                            if (workflowState.selectedId) await loadWorkflowDetail(workflowState.selectedId);
                            try { showToast('Passo eliminato', { type: 'success' }); } catch (e) {}
                        } catch (e) {
                            alert(e.message || 'Errore durante l\'eliminazione del passo.');
                        }
                    })();
                }
                if (target.closest('[data-action="toggle-step"]')) {
                    event.preventDefault();
                    if (!state.permissions.manageWorkflows) { alert('Permesso negato.'); return; }
                    const btn = target.closest('[data-action="toggle-step"]');
                    const stepId = Number(btn?.dataset.stepId);
                    const next = Number(btn?.dataset.next) === 1 ? 1 : 0;
                    if (Number.isNaN(stepId)) return;
                    (async () => {
                        try {
                            await authFetch(`workflowsteps/${stepId}`, { method: 'PUT', json: true, body: { attivo: next } });
                            if (workflowState.selectedId) await loadWorkflowDetail(workflowState.selectedId);
                            try { showToast(next ? 'Passo attivato' : 'Passo disattivato', { type: 'success' }); } catch (e) {}
                        } catch (e) {
                            alert(e.message || 'Errore durante l\'aggiornamento stato del passo.');
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
                if (target.closest('[data-action="logout"]')) { event.preventDefault(); performLogout(); }
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
                        container.innerHTML = '<small class="form-hint">Caricamento utenti…</small>';
                        loadGroupUsersInline(id, container);
                    }
                }
                if (target.closest('[data-action="restore-steps-order"]')) {
                    event.preventDefault();
                    if (!state.permissions.manageWorkflows) { alert('Permesso negato.'); return; }
                    if (confirm('Sei sicuro di voler annullare le modifiche all\'ordine dei passi e ripristinare la base?')) {
                        restoreStepsOrder();
                    }
                }
                if (target.closest('[data-action="snapshot-steps-order"]')) {
                    event.preventDefault();
                    if (!state.permissions.manageWorkflows) { alert('Permesso negato.'); return; }
                    snapshotCurrentStepsOrder();
                }
                if (target.closest('[data-action="snapshot-steps-order-reset"]')) {
                    event.preventDefault();
                    if (!state.permissions.manageWorkflows) { alert('Permesso negato.'); return; }
                    if (confirm('Impostare l\'ordine attuale come base e azzerare la history?')) {
                        snapshotCurrentStepsOrderAndResetHistory();
                    }
                }
                // Badge stato ordine: clic come annulla quando "dirty"
                const statusBadge = target.closest && target.closest('#steps-order-status');
                if (statusBadge) {
                    const isDirty = statusBadge.dataset.dirty === '1';
                    if (isDirty) {
                        event.preventDefault();
                        if (!state.permissions.manageWorkflows) { alert('Permesso negato.'); return; }
                        if (confirm('Sei sicuro di voler annullare le modifiche all\'ordine dei passi e ripristinare la base?')) {
                            restoreStepsOrder();
                        }
                    }
                }
                if (target.closest('[data-action="promote-step"]')) {
                    event.preventDefault();
                    if (!state.permissions.manageWorkflows) { alert('Permesso negato.'); return; }
                    const btn = target.closest('[data-action="promote-step"]');
                    const stepId = Number(btn?.dataset.stepId);
                    if (!workflowState.selectedId || Number.isNaN(stepId)) return;
                    // Se l'ordine è già modificato (dirty), chiedi conferma prima di proseguire
                    const badge = document.getElementById('steps-order-status');
                    if (badge && badge.dataset.dirty === '1') {
                        const ok = confirm('Ci sono modifiche all\'ordine non ripristinate. Procedere con la promozione del passo?');
                        if (!ok) return;
                    }
                    moveStepAcrossOrders(stepId, -1);
                }
                if (target.closest('[data-action="demote-step"]')) {
                    event.preventDefault();
                    if (!state.permissions.manageWorkflows) { alert('Permesso negato.'); return; }
                    const btn = target.closest('[data-action="demote-step"]');
                    const stepId = Number(btn?.dataset.stepId);
                    if (!workflowState.selectedId || Number.isNaN(stepId)) return;
                    // Se l'ordine è già modificato (dirty), chiedi conferma prima di proseguire
                    const badge2 = document.getElementById('steps-order-status');
                    if (badge2 && badge2.dataset.dirty === '1') {
                        const ok = confirm('Ci sono modifiche all\'ordine non ripristinate. Procedere con la demozione del passo?');
                        if (!ok) return;
                    }
                    moveStepAcrossOrders(stepId, +1);
                }
                if (target.closest('[data-action="edit-user"]')) {
                    event.preventDefault();
                    if (!state.permissions.manageUsers) { alert('Permesso negato.'); return; }
                    const id = Number(target.closest('[data-action="edit-user"]').dataset.id);
                    if (!Number.isNaN(id)) openUserModal('edit', id);
                }
                if (target.closest('[data-action="delete-user"]')) {
                    event.preventDefault();
                    if (!state.permissions.manageUsers) { alert('Permesso negato.'); return; }
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
                            instanceState.assigneesExpanded[instId] = !instanceState.assigneesExpanded[instId];
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
            const supers = (state.users || []).filter(u => (u.ruolo || '').toUpperCase() === 'SUPERVISOR');
            supers.forEach(u => {
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
            } catch (e) { /* ignore */ }
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
                try { showToast('Supervisor aggiornato', { type: 'success' }); } catch (e) {}
            } catch (e) {
                try { showToast(e.message || 'Errore impostazione supervisor.', { type: 'error' }); } catch (err) {}
            }
        };

        document.getElementById('form-set-supervisor')?.addEventListener('submit', handleSetSupervisorSubmit);
        dom.btnResetUserFiltersTop?.addEventListener('click', (e) => { e.preventDefault(); resetUserFilters(); });
        // Delegated handler per il bottone di reset inline nel placeholder della lista utenti
        if (dom.usersList) {
            dom.usersList.addEventListener('click', (ev) => {
                const btn = ev.target?.closest?.('#btn-reset-user-filters');
                if (btn) { ev.preventDefault(); resetUserFilters(); }
            });
        }

        const loadGroupUsersInline = async (groupId, container) => {
            try {
                const data = await authFetch(`gruppi/${groupId}`);
                const users = Array.isArray(data?.users) ? data.users : [];
                if (!users.length) {
                    container.innerHTML = '<small class="form-hint">Nessun utente nel gruppo.</small>';
                    return;
                }
                container.innerHTML = users.map(u => `<span class="badge">${sanitize(buildUserLabel(u))}</span>`).join(' ');
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
                                try { parsed = JSON.parse(parsed); } catch (err) { parsed = {}; }
                            }
                            if (parsed && typeof parsed === 'object') {
                                actionParamsContainer.querySelectorAll('[data-param-key]').forEach(input => {
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

        const setupTabsUI = () => { /* tabs disabilitati: sezioni separate Modelli/Operatività */ };

        const setupCollapsiblePanels = () => {
            // Istanze panel
            const instPanel = document.querySelector('article.panel.panel--wide[data-resource="workflowistanze"]');
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
                    document.getElementById('operations')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else if (name === 'instances') {
                    document.querySelector('article.panel[data-resource="workflowistanze"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else if (name === 'kanban') {
                    document.querySelector('#operations .kanban-board')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else if (name === 'models') {
                    document.getElementById('workflow-models')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            } catch (e) { /* ignore */ }
        };

        const closeAllModals = () => {
            document.querySelectorAll('[data-modal]').forEach(modal => modal.classList.remove('is-open'));
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
                if (!id) { alert('Seleziona un workflow.'); return; }
                let wf = workflowState.detailCache[id];
                if (!wf) { await loadWorkflowDetail(id); wf = workflowState.detailCache[id]; }
                if (!wf) { alert('Dettaglio workflow non disponibile.'); return; }
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
            if (!id) { alert('ID workflow mancante.'); return; }
            const data = serializeForm(form);
            data.attivo = data.attivo ? 1 : 0;
            try {
                await authFetch(`workflows/${id}`, { method: 'PUT', json: true, body: data });
                closeAllModals();
                workflowState.detailCache = {};
                await loadWorkflows();
                await loadWorkflowDetail(id);
                try { showToast('Workflow aggiornato', { type: 'success' }); } catch (e) {}
            } catch (error) {
                alert(error.message || 'Errore durante l\'aggiornamento del workflow.');
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

            const hasUser = data.responsabile_utente_id && data.responsabile_utente_id !== '' && data.responsabile_utente_id !== '0';
            const hasGroup = data.responsabile_gruppo_id && data.responsabile_gruppo_id !== '' && data.responsabile_gruppo_id !== '0';
            if (!hasUser && !hasGroup) {
                alert('Imposta almeno un responsabile (utente o gruppo).');
                return;
            }

            ['ordine', 'sottopasso', 'responsabile_gruppo_id', 'responsabile_utente_id'].forEach(key => {
                if (data[key] === '' || data[key] === null || data[key] === undefined) {
                    delete data[key];
                } else {
                    data[key] = Number(data[key]);
                }
            });

            if (data.scadenza_standard_valore === '' || data.scadenza_standard_valore === undefined) {
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
                    inputs.forEach(input => {
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
                    await authFetch(`workflowsteps/${stepId}`, { method: 'PUT', json: true, body: data });
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
                await authFetch(`workflows/${workflowState.selectedId}/start`, { method: 'POST', json: true, body: payload });
                closeAllModals();
                form.reset();
                instanceState.detailCache = {};
                instanceState.selectedId = null;
                await Promise.all([loadTasks(), loadInstances()]);
            } catch (error) {
                alert(error.message || 'Errore durante l\'avvio dell\'istanza.');
            }
        };

        document.querySelectorAll('[data-modal-close]').forEach(btn => {
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
                    document.getElementById('instance-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        const debounce = (fn, ms=300) => { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); }; };
        const populateClientOptions = (items) => {
            if (!clientOptions) return;
            clientOptions.innerHTML = '';
            (items || []).forEach(cli => {
                const opt = document.createElement('option');
                opt.value = `${cli.ragione_sociale} — ${cli.partita_iva || ''}`.trim();
                opt.dataset.id = cli.id;
                clientOptions.appendChild(opt);
            });
        };
        const findClientOption = (label) => {
            if (!clientOptions) return null;
            const opts = clientOptions.querySelectorAll('option');
            for (const o of opts) { if (o.value === label) return o; }
            return null;
        };
        const fetchClients = async (term) => {
            try {
                const qs = term ? `?search=${encodeURIComponent(term)}` : '';
                const list = await authFetch(`clienti${qs}`);
                return Array.isArray(list) ? list : [];
            } catch (e) { return []; }
        };
        if (startCustLabel) {
            startCustLabel.addEventListener('input', debounce(async () => {
                if (!startCustLabel.value || startCustLabel.value.length < 2) { populateClientOptions([]); return; }
                const list = await fetchClients(startCustLabel.value.trim());
                populateClientOptions(list);
            }, 250));
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
                        await authFetch(`gruppi/${id}`, { method: 'PUT', json: true, body: payload });
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
                if (!confirm('Confermi l\'eliminazione del gruppo?')) return;
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
            if (!confirm('Confermi l\'eliminazione del gruppo?')) return;
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
                    if (!/[A-Za-z]/.test(pwd) || !/\d/.test(pwd)) return 'La password deve contenere almeno una lettera e un numero.';
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
                    if (strengthMsg) { alert(strengthMsg); return; }
                    payload.password = pwd;
                } else if (pwd || pwd2) {
                    if (pwd !== pwd2) {
                        alert('Le password non coincidono.');
                        return;
                    }
                    const strengthMsg = validateStrength(pwd);
                    if (strengthMsg) { alert(strengthMsg); return; }
                    if (pwd) payload.password = pwd;
                }
                try {
                    let userId = id;
                    if (mode === 'edit' && id) {
                        await authFetch(`utenti/${id}`, { method: 'PUT', json: true, body: payload });
                    } else {
                        const res = await authFetch('utenti', { method: 'POST', json: true, body: payload });
                        if (res && res.id) userId = String(res.id);
                    }
                    // Sincronizza gruppi selezionati in un unico submit
                    const selectedIds = getSelectedGroupIdsFromMulti();
                    if (userId) {
                        await syncUserGroups(Number(userId), selectedIds);
                        // Imposta supervisor
                        if (dom.userSupervisorSelect) {
                            const supId = dom.userSupervisorSelect.value || '';
                            await authFetch(`utenti/${userId}/set_supervisor/${supId || 0}`, { method: 'POST' });
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
                    alert(e.message || 'Errore aggiunta gruppo all\'utente.');
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
                    alert(e.message || 'Errore rimozione gruppo dall\'utente.');
                }
            });
        }

        if (btnDeleteUser) {
            btnDeleteUser.addEventListener('click', async () => {
                const id = formManageUser?.elements?.id?.value;
                if (!id) return;
                if (!confirm('Confermi l\'eliminazione dell\'utente?')) return;
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
            if (!confirm('Confermi l\'eliminazione dell\'utente?')) return;
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
                await authFetch(`utenti/${id}`, { method: 'PUT', json: true, body: { stato: 'ATTIVO' } });
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
            const usersOnly = state.users.filter(u => (u.ruolo || '').toUpperCase() === 'USER');
            usersOnly.forEach(u => {
                const opt = document.createElement('option');
                opt.value = u.id;
                opt.textContent = buildUserLabel(u);
                dom.supervisedMulti.appendChild(opt);
            });
            // Bind esplicito al bottone logout nella topbar (fuori da #dashboard-main)
            try {
                const topLogout = document.querySelector('[data-action="logout"]');
                if (topLogout && !topLogout._boundLogout) {
                    topLogout.addEventListener('click', (e) => { e.preventDefault(); performLogout(); });
                    topLogout._boundLogout = true;
                }
            } catch (e) { /* ignore */ }
        };

        const preselectSupervised = async (supervisorId) => {
            if (!dom.supervisedMulti || !supervisorId) return;
            let list = [];
            try { list = await authFetch(`utenti/${supervisorId}/supervised`); } catch (e) { list = []; }
            list = Array.isArray(list) ? list : [];
            const ids = new Set(list.map(u => Number(u.id)));
            [...dom.supervisedMulti.options].forEach(opt => {
                opt.selected = ids.has(Number(opt.value));
            });
        };

        const saveSupervised = async () => {
            if (!state.permissions.manageRoles) { alert('Permesso negato.'); return; }
            const supervisorId = dom.roleUserSelect?.value;
            if (!supervisorId) { alert('Seleziona un supervisor.'); return; }
            const selected = [...(dom.supervisedMulti?.selectedOptions || [])].map(o => Number(o.value));
            let current = [];
            try { current = await authFetch(`utenti/${supervisorId}/supervised`); } catch (e) { current = []; }
            const currentIds = new Set((Array.isArray(current) ? current : []).map(u => Number(u.id)));
            const selectedSet = new Set(selected);
            const toAdd = [...selectedSet].filter(id => !currentIds.has(id));
            const toRemove = [...currentIds].filter(id => !selectedSet.has(id));
            for (const id of toAdd) {
                await authFetch(`utenti/${supervisorId}/add_supervised/${id}`, { method: 'POST' });
            }
            for (const id of toRemove) {
                await authFetch(`utenti/${supervisorId}/remove_supervised/${id}`, { method: 'DELETE' });
            }
            alert('Associazioni aggiornate.');
        };

        dom.supervisedSaveBtn?.addEventListener('click', saveSupervised);

        async function loadRoleAudit() {
            const el = dom.auditRolesList;
            if (!el) return;
            el.innerHTML = '<p>Caricamento...</p>';
            try {
                const limit = Number(state.config?.auditRoleLimit || AUDIT_ROLE_LIMIT) || AUDIT_ROLE_LIMIT;
                const rows = await authFetch(`audit_roles?limit=${encodeURIComponent(limit)}`);
                const list = Array.isArray(rows) ? rows : [];
                if (!list.length) { el.innerHTML = '<p class="form-hint">Nessuna modifica recente.</p>'; return; }
                const mapUser = (id) => {
                    const u = state.users.find(x => Number(x.id) === Number(id));
                    return u ? buildUserLabel(u) : `Utente #${id}`;
                };
                const html = `<table class="table"><thead><tr><th>Data</th><th>Utente</th><th>Ruolo</th><th>Modificato da</th></tr></thead><tbody>` +
                  list.map(r => `<tr><td>${sanitize(r.changed_at || '')}</td><td>${mapUser(r.target_user_id)}<br><small>${sanitize(r.old_role || '')} → ${sanitize(r.new_role || '')}</small></td><td>${sanitize(r.new_role || '')}</td><td>${mapUser(r.changed_by_user_id)}</td></tr>`).join('') +
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
            if (!rows.length) { wrap.innerHTML = '<p class="form-hint">Nessun evento recente.</p>'; return; }
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
            const filtered = rows.filter(r => {
                if (selUser !== 'all' && String(r.user_id) !== String(selUser)) return false;
                if (selAction !== 'ALL' && String(r.action || '').toUpperCase() !== selAction) return false;
                const dt = parseDate(r.created_at || '') || null;
                if (fromDate && dt && dt < fromDate) return false;
                if (toDate && dt && dt > toDate) return false;
                return true;
            });
            const mapUser = (id) => {
                const u = state.users.find(x => Number(x.id) === Number(id));
                return u ? buildUserLabel(u) : `Utente #${id}`;
            };
            wrap.innerHTML = `<table class="table"><thead><tr><th>Data</th><th>Utente</th><th>Azione</th><th>IP</th><th>User Agent</th></tr></thead><tbody>` +
                filtered.map(r => `<tr><td>${sanitize(r.created_at || '')}</td><td>${mapUser(r.user_id)}</td><td>${sanitize(r.action || '')}</td><td>${sanitize(r.ip || '')}</td><td><small>${sanitize(r.user_agent || '')}</small></td></tr>`).join('') +
                `</tbody></table>`;
        }

        async function loadAuthAudit() {
            if (!dom.auditAuthList) return;
            dom.auditAuthResults ? dom.auditAuthResults.innerHTML = '<p>Caricamento...</p>' : (dom.auditAuthList.innerHTML = '<p>Caricamento...</p>');
            try {
                const defaultLimit = Number(state.config?.auditAuthDefaultLimit || AUDIT_AUTH_DEFAULT_LIMIT) || AUDIT_AUTH_DEFAULT_LIMIT;
                const limit = parseInt(dom.filterAuthLimit?.value || String(defaultLimit), 10) || defaultLimit;
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
            (state.users || []).forEach(u => {
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
            } catch (e) { /* ignore */ }
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
            } catch (e) { /* ignore */ }
        };

        const updateAuditBadges = () => {
            try {
                if (dom.badgeAuditRolesLimit) {
                    const v = Number(state.config?.auditRoleLimit || AUDIT_ROLE_LIMIT) || AUDIT_ROLE_LIMIT;
                    dom.badgeAuditRolesLimit.textContent = `Limite: ${v}`;
                }
                if (dom.badgeAuditAuthLimit) {
                    const def = Number(state.config?.auditAuthDefaultLimit || AUDIT_AUTH_DEFAULT_LIMIT) || AUDIT_AUTH_DEFAULT_LIMIT;
                    const sel = parseInt(dom.filterAuthLimit?.value || String(def), 10) || def;
                    dom.badgeAuditAuthLimit.textContent = `Limite: ${sel}`;
                }
            } catch (e) { /* ignore */ }
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
                t.addEventListener('click', () => { t.remove(); });
                container.appendChild(t);
                requestAnimationFrame(() => { t.classList.add('is-visible'); });
                setTimeout(() => {
                    t.classList.remove('is-visible');
                    setTimeout(() => t.remove(), 180);
                }, Math.max(2000, duration));
            } catch (e) { /* ignore */ }
        };

        const runDiagnostics = async () => {
            if (!dom.diagResults) return;
            const lines = [];
            const api = apiBase;
            const token = !!window.lpwfAuth?.getToken?.();
            lines.push(`<strong>API base:</strong> ${sanitize(api)}`);
            lines.push(`<strong>Token presente:</strong> ${token ? 'Sì' : 'No'}`);
            // Auth check via auth/me
            let authOk = false; let me = null;
            try { me = await authFetch('auth/me'); authOk = !!me?.id; } catch (e) { authOk = false; }
            lines.push(`<strong>Auth OK:</strong> ${authOk ? 'Sì' : 'No'}`);
            if (authOk) lines.push(`<strong>Utente:</strong> ${sanitize(buildUserLabel(me))} [#${sanitize(me.id)}]`);
            // Config
            try {
                const cfg = await authFetch('config');
                lines.push(`<strong>Audit Ruoli limit:</strong> ${sanitize(cfg?.audit_role_limit ?? '—')}`);
                lines.push(`<strong>Audit Auth default limit:</strong> ${sanitize(cfg?.audit_auth_default_limit ?? '—')}`);
            } catch (e) { lines.push('<em>Config non disponibile</em>'); }
            // Health (no auth required)
            try {
                const res = await fetch(`${api}/health`);
                const h = await res.json();
                const db = h?.db_ok ? 'OK' : 'KO';
                lines.push(`<strong>DB:</strong> ${db}`);
                const tables = h?.tables || {};
                const counts = h?.counts || {};
                const t1 = tables.auth_audit ? `presente (${counts.auth_audit ?? '?'})` : 'assente';
                const t2 = tables.user_role_audit ? `presente (${counts.user_role_audit ?? '?'})` : 'assente';
                lines.push(`<strong>auth_audit:</strong> ${t1}`);
                lines.push(`<strong>user_role_audit:</strong> ${t2}`);
            } catch (e) {
                lines.push('<em>Health API non raggiungibile</em>');
            }
            dom.diagResults.innerHTML = `<ul class="diag-list">${lines.map(l => `<li>${l}</li>`).join('')}</ul>`;
        };

        const openAuditAuthPanel = (limit = null) => {
            try {
                // Solo Admin: rispettare permessi viewAudit
                if (!state.permissions || !state.permissions.viewAudit) {
                    try { showToast('Permesso negato', { type: 'error' }); } catch (e) {}
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
            } catch (e) { /* ignore */ }
        };

        const openAuditRolesPanel = () => {
            try {
                // Solo Admin: rispettare permessi viewAudit
                if (!state.permissions || !state.permissions.viewAudit) {
                    try { showToast('Permesso negato', { type: 'error' }); } catch (e) {}
                    return;
                }
                const cfgSection = document.getElementById('config');
                if (cfgSection) cfgSection.hidden = false;
                loadRoleAudit();
                updateAuditBadges();
                const panel = document.querySelector('article[data-resource="audit-roles"]');
                panel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } catch (e) { /* ignore */ }
        };

        const setRolesAuditLimit = (limit) => {
            try {
                const v = Number(limit);
                if (!Number.isNaN(v) && v > 0) {
                    state.config.auditRoleLimit = v;
                    loadRoleAudit();
                    updateAuditBadges();
                }
            } catch (e) { /* ignore */ }
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
                    (async () => { await loadInstances(); await updateInstanceAssignees(); })(),
                    loadGroups(),
                ]);
                const formEditWf = document.getElementById('form-edit-workflow');
                if (formEditWf) formEditWf.addEventListener('submit', handleEditWorkflowSubmit);
                setupTabsUI();
                setupCollapsiblePanels();
                renderStatusBar();
            } catch (error) {
                alert((error && error.message) || 'Errore durante l\'inizializzazione della dashboard.');
            }
        })();
    });
})(document);
