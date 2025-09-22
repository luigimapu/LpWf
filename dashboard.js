document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = '/LpWF/api';
    let currentUserId = null;
    let standardActions = [];

    // --- RIFERIMENTI DOM ---
    const dom = {
        userSelector: document.getElementById('user-selector'),
        taskSearch: document.getElementById('task-search'),
        main: document.getElementById('dashboard-main'),
        todoCol: document.getElementById('tasks-todo'),
        doingCol: document.getElementById('tasks-doing'),
        doneCol: document.getElementById('tasks-done'),
        workflowsList: document.getElementById('workflows-list'),
        instancesList: document.getElementById('instances-list'),
        gruppiList: document.getElementById('gruppi-list'),
        createModal: document.getElementById('create-modal'),
        createModalTitle: document.getElementById('create-modal-title'),
        createForm: document.getElementById('create-form'),
        editModal: document.getElementById('edit-modal'),
        editModalTitle: document.getElementById('edit-modal-title'),
        editForm: document.getElementById('edit-form'),
        startInstanceModal: document.getElementById('start-instance-modal'),
        startInstanceForm: document.getElementById('start-instance-form'),
        startInstanceModalTitle: document.getElementById('start-instance-modal-title'),
        addUserModal: document.getElementById('add-user-modal'),
        addUserForm: document.getElementById('add-user-form'),
        subflowModal: document.getElementById('subflow-modal'),
        startSubflowForm: document.getElementById('start-subflow-form'),
        viewSubflowsModal: document.getElementById('view-subflows-modal'),
        viewSubflowsModalTitle: document.getElementById('view-subflows-modal-title'),
        subflowsList: document.getElementById('subflows-list'),
        notesModal: document.getElementById('notes-modal'),
        notesModalTitle: document.getElementById('notes-modal-title'),
        notesList: document.getElementById('notes-list'),
        addNoteForm: document.getElementById('add-note-form'),
    };

    // --- VARIABILI DI STATO E TOMSELECT ---
    let currentCreateData = {};
    let currentEditData = {};
    let workflowToStartId = null;
    let currentGroupId = null;
    let currentParentTaskId = null;
    let tomSelectUsers, tomSelectAddUser, tsSubflowWf, tsSubflowUser;

    // --- CONFIGURAZIONE FORM ---
    const formFieldsConfig = {
        workflows: [{ name: 'nome_workflow', label: 'Nome', required: true }, { name: 'descrizione', type: 'textarea' }, { name: 'attivo', type: 'checkbox', checked: true }],
        workflowsteps: [{ name: 'nome_passo', label: 'Nome', required: true }, { name: 'descrizione_passo', label: 'Descrizione', type: 'textarea' }, { name: 'ordine', type: 'number', value: 10, required: true }, { name: 'avanzamento_automatico', type: 'checkbox' }, { name: 'id_gruppo_responsabile', label: 'Gruppo ID', type: 'number' }, { name: 'azione_id', label: 'Azione', type: 'action-select' }],
        gruppi: [{ name: 'nome_gruppo', label: 'Nome', required: true }, { name: 'descrizione', type: 'textarea' }],
        utenti: [{ name: 'nome', label: 'Nome', required: true }, { name: 'cognome', label: 'Cognome', required: true }, { name: 'email', label: 'Email', type: 'email', required: true }],
        workflowistanze: [{ name: 'stato_istanza', label: 'Stato', required: true }],
    };

    // --- FUNZIONI API ---
    const api = {
        get: (endpoint) => fetch(`${API_BASE_URL}/${endpoint}`).then(handleResponse),
        post: (endpoint, body) => fetch(`${API_BASE_URL}/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(handleResponse),
        put: (endpoint, body) => fetch(`${API_BASE_URL}/${endpoint}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(handleResponse),
        delete: (endpoint) => fetch(`${API_BASE_URL}/${endpoint}`, { method: 'DELETE' }).then(handleResponse)
    };
    async function handleResponse(response) {
        const text = await response.text();
        try {
            const data = JSON.parse(text);
            if (!response.ok) throw new Error(data.message || `Errore HTTP ${response.status}`);
            return data;
        } catch (e) {
            console.error("Risposta non JSON o JSON non valido:", text);
            throw new Error('Il server ha restituito una risposta non valida.');
        }
    }

    // --- FUNZIONI DI RENDERING ---
    const render = {
        taskColumn: (container, tasks, emptyMsg) => {
            container.innerHTML = '';
            if (!tasks || tasks.length === 0) { container.innerHTML = `<p>${emptyMsg}</p>`; return; }
            tasks.forEach(task => container.appendChild(render.taskCard(task)));
        },
        taskCard: (task) => {
            const card = document.createElement('div');
            card.className = 'task-card';
            let footer = '';
            if (task.id_stato === 1 && currentUserId && currentUserId !== 'all') footer = `<button class="btn-assign" data-task-id="${task.id}">Prendi in carico</button>`;
            if (task.id_stato === 2 && task.id_utente_assegnato == currentUserId) footer = `<button class="btn-complete" data-task-id="${task.id}">Completa</button>`;

            let cardActions = `<button class="btn-notes" data-task-id="${task.id}" title="Note">&#128196;</button>`;
            if (task.id_stato === 2 && task.id_utente_assegnato == currentUserId) cardActions += `<button class="btn-subflow" data-task-id="${task.id}" title="Avvia Sottoprocesso">&#10162;</button>`;

            let subflowIndicator = '';
            if (task.subflow_count > 0) subflowIndicator = `<div style="font-size: 0.8em; margin-top: 5px;">Sottoprocessi: ${task.subflow_count} <button class="btn-view-subflows" data-instance-id="${task.id_istanza_workflow}">&#128279;</button></div>`;

            card.innerHTML = `<div class="task-card-header"><h3>${task.nome}</h3><div class="item-actions">${cardActions}</div></div><div class="task-card-body"><p>${task.descrizione || ''}</p><small>Utente: ${task.nome_utente_completo || 'Non Assegnato'}</small>${subflowIndicator}</div><div class="task-card-footer">${footer}</div>`;
            return card;
        },
        reportList: (container, items, renderer) => {
            container.innerHTML = '';
            items.forEach(item => container.appendChild(renderer(item)));
        },
        clickableItem: (item, text, resource, canStart = false) => {
            const div = document.createElement('div');
            div.className = 'list-item';
            div.dataset.id = item.id;
            div.dataset.resource = resource;
            const startBtn = canStart ? `<button class="btn-start-instance" title="Avvia Istanza">&#9654;</button>` : '';
            div.innerHTML = `<div class="item-header"><span>${text}</span><div class="item-actions">${startBtn}<button class="btn-edit" title="Modifica">&#9998;</button><button class="btn-delete" title="Elimina">&#128465;</button></div></div><div class="item-details"></div>`;
            return div;
        },
        dynamicForm: (formEl, resource, data = {}) => {
            formEl.innerHTML = '';
            formFieldsConfig[resource]?.forEach(field => {
                const value = data[field.name] ?? (field.value !== undefined ? field.value : '');
                const isChecked = field.type === 'checkbox' ? (data[field.name] !== undefined ? data[field.name] : field.checked) : false;
                let inputHtml;
                if (field.type === 'action-select') {
                    let options = '<option value="">-- Nessuna --</option>' + standardActions.map(a => `<option value="${a.id}" data-params='${a.parametri_richiesti || "[]"}' ${a.id == value ? 'selected' : ''}>${a.nome_azione}</option>`).join('');
                    inputHtml = `<select name="azione_id">${options}</select><div class="action-params-container" style="margin-top: 15px; grid-column: 1 / -1;"></div>`;
                } else if (field.type === 'textarea') {
                    inputHtml = `<textarea name="${field.name}">${value}</textarea>`;
                } else if (field.type === 'checkbox') {
                    inputHtml = `<div style="display:flex;"><input name="${field.name}" type="checkbox" ${isChecked ? 'checked' : ''}></div>`;
                } else {
                    inputHtml = `<input name="${field.name}" type="${field.type || 'text'}" value="${value}" ${field.required ? 'required' : ''}>`;
                }
                formEl.innerHTML += `<div class="form-row"><label>${field.label}:</label>${inputHtml}</div>`;
            });
        },
        workflowSteps: (container, steps, workflowId) => {
            if (!steps || steps.length === 0) { container.innerHTML = '<p>Nessun passo definito.</p>'; }
            else {
                let table = '<table><thead><tr><th>Ordine</th><th>Nome</th><th>Azione</th><th>Azioni</th></tr></thead><tbody>';
                steps.forEach(s => {
                    const azione = standardActions.find(a => a.id == s.azione_id);
                    table += `<tr data-id="${s.id}" data-resource="workflowsteps"><td>${s.ordine}.${s.sottopasso}</td><td>${s.nome_passo}</td><td>${azione ? azione.nome_azione : '-'}</td><td class="item-actions"><button class="btn-edit" title="Modifica">&#9998;</button><button class="btn-delete" title="Elimina">&#128465;</button></td></tr>`;
                });
                container.innerHTML = table + '</tbody></table>';
            }
            container.innerHTML += `<br><button class="btn-create" data-resource="workflowsteps" data-parent-id="${workflowId}">+ Nuovo Passo</button>`;
        },
        groupUsers: (container, users, groupId) => {
            if (!users || users.length === 0) { container.innerHTML = '<p>Nessun utente nel gruppo.</p>'; }
            else {
                let table = '<table><thead><tr><th>Nome</th><th>Email</th><th>Rimuovi</th></tr></thead><tbody>';
                users.forEach(u => table += `<tr data-user-id="${u.id}"><td>${u.nome} ${u.cognome}</td><td>${u.email}</td><td class="item-actions"><button class="btn-remove-user">&#128465;</button></td></tr>`);
                container.innerHTML = table + '</tbody></table>';
            }
            container.innerHTML += `<br><button class="btn-add-user" data-group-id="${groupId}">+ Aggiungi Utente</button>`;
        },
        instanceTasks: (container, tasks) => {
            if(!tasks || tasks.length === 0) { container.innerHTML = '<p>Nessun task per questa istanza.</p>'; return; }
            let table = '<table><thead><tr><th>ID</th><th>Nome</th><th>Stato</th><th>Utente</th></tr></thead><tbody>';
            tasks.forEach(t => table += `<tr><td>${t.id}</td><td>${t.nome}</td><td>${t.stato_nome}</td><td>${t.nome_utente_completo || 'N/A'}</td></tr>`);
            container.innerHTML = table + '</tbody></table>';
        }
    };

    // --- AZIONI E GESTIONE MODAL ---
    const actions = {
        loadInitialData: async () => {
            try {
                const [workflows, instances, gruppi, azioni] = await Promise.all([api.get('workflows'), api.get('workflowistanze'), api.get('gruppi'), api.get('azioni')]);
                standardActions = azioni;
                render.reportList(dom.workflowsList, workflows, wf => render.clickableItem(wf, wf.nome_workflow, 'workflows', true));
                render.reportList(dom.instancesList, instances, inst => render.clickableItem(inst, `Istanza #${inst.id}`, 'workflowistanze'));
                render.reportList(dom.gruppiList, gruppi, g => render.clickableItem(g, g.nome_gruppo, 'gruppi'));
            } catch (error) { console.error("Errore caricamento dati:", error); }
        },
        fetchAndRenderTasks: async () => {
            if (currentUserId === null) { [dom.todoCol, dom.doingCol, dom.doneCol].forEach(el => el.innerHTML = '<p>Seleziona un utente.</p>'); return; }
            [dom.todoCol, dom.doingCol, dom.doneCol].forEach(el => el.innerHTML = '<p>...</p>');
            try {
                const search = dom.taskSearch.value ? `&search=${encodeURIComponent(dom.taskSearch.value)}` : '';
                let userParam = (currentUserId !== 'all') ? `&id_utente_assegnato=${currentUserId}` : '';
                const [todo, doing, done] = await Promise.all([
                    api.get(`tasks?id_stato=1&unassigned=true${search}`),
                    api.get(`tasks?id_stato=2${userParam}${search}`),
                    api.get(`tasks?id_stato=3${userParam}${search}`)
                ]);
                render.taskColumn(dom.todoCol, todo, 'Nessun task da fare.');
                render.taskColumn(dom.doingCol, doing, 'Nessun task in gestione.');
                render.taskColumn(dom.doneCol, done, 'Nessun task completato.');
            } catch (error) { console.error("Errore caricamento tasks:", error); }
        },
        openCreateModal: (resource, parentId = null) => {
            currentCreateData = { resource, parentId };
            dom.createModalTitle.textContent = `Crea Nuovo: ${resource}`;
            render.dynamicForm(dom.createForm, resource);
            dom.createModal.style.display = 'flex';
        },
        openEditModal: async (resource, id) => {
            try {
                const data = await api.get(`${resource}/${id}`);
                dom.editModalTitle.textContent = `Modifica: ${resource} #${id}`;
                render.dynamicForm(dom.editForm, resource, data);
                currentEditData = { resource, id };
                dom.editModal.style.display = 'flex';
            } catch (error) { alert(`Errore: ${error.message}`); }
        },
        openStartInstanceModal: (id) => {
            workflowToStartId = id;
            dom.startInstanceForm.reset();
            dom.startInstanceModalTitle.textContent = `Avvia Workflow (ID: ${id})`;
            dom.startInstanceModal.style.display = 'flex';
        },
        openAddUserModal: (groupId) => {
            currentGroupId = groupId;
            dom.addUserModal.style.display = 'flex';
            if (!tomSelectAddUser) {
                tomSelectAddUser = new TomSelect('#select-user-to-add', {
                    valueField: 'id', labelField: 'nome_completo', searchField: 'nome_completo',
                    load: (query, callback) => api.get(`utenti?search=${encodeURIComponent(query)}`).then(callback).catch(() => callback())
                });
            }
            tomSelectAddUser.clear();
        },
        openSubflowModal: (taskId) => {
            currentParentTaskId = taskId;
            dom.subflowModal.style.display = 'flex';
            if (!tsSubflowWf) tsSubflowWf = new TomSelect('#select-subflow-workflow', { valueField: 'id', labelField: 'nome_workflow', searchField: 'nome_workflow', load: (q, cb) => api.get(`workflows?search=${q}`).then(cb).catch(()=>cb()) });
            if (!tsSubflowUser) tsSubflowUser = new TomSelect('#select-subflow-user', { valueField: 'id', labelField: 'nome_completo', searchField: 'nome_completo', load: (q, cb) => api.get(`utenti?search=${q}`).then(cb).catch(()=>cb()) });
            tsSubflowWf.clear(); tsSubflowUser.clear();
        },
        openViewSubflowsModal: async (instanceId) => {
            dom.viewSubflowsModalTitle.textContent = `Sottoprocessi per Istanza #${instanceId}`;
            dom.subflowsList.innerHTML = '<p>Caricamento...</p>';
            dom.viewSubflowsModal.style.display = 'flex';
            try {
                const subInstances = await api.get(`workflowistanze?id_istanza_padre=${instanceId}`);
                render.reportList(dom.subflowsList, subInstances, inst => render.clickableItem(inst, `Istanza #${inst.id}`, 'workflowistanze'));
            } catch(e) { dom.subflowsList.innerHTML = `<p style="color:red">${e.message}</p>`; }
        },
        openNotesModal: async (taskId) => {
            dom.notesModalTitle.textContent = `Note per Task #${taskId}`;
            dom.notesList.innerHTML = '<p>Caricamento...</p>';
            dom.addNoteForm.dataset.taskId = taskId;
            dom.notesModal.style.display = 'flex';
            try {
                const notes = await api.get(`tasks/${taskId}/note`);
                dom.notesList.innerHTML = notes.length === 0 ? '<p>Nessuna nota.</p>' : notes.map(note => `<div><strong>${note.nome_utente || 'Utente'}</strong> (${new Date(note.data_creazione).toLocaleString()}):<p>${note.nota}</p></div>`).join('<hr>');
            } catch (e) { dom.notesList.innerHTML = `<p style="color:red">${e.message}</p>`; }
        },
        closeModal: (modalEl) => { if(modalEl) modalEl.style.display = 'none'; },
    };

    // --- EVENT LISTENERS ---
    dom.main.addEventListener('click', async (e) => {
        const target = e.target;
        const listItem = target.closest('.list-item');
        const resourceItem = target.closest('[data-resource]');

        if (target.matches('.btn-create')) { e.stopPropagation(); actions.openCreateModal(target.dataset.resource, target.dataset.parentId); }
        else if (target.matches('.btn-start-instance')) { e.stopPropagation(); actions.openStartInstanceModal(listItem.dataset.id); }
        else if (target.matches('.btn-edit')) { e.stopPropagation(); actions.openEditModal(resourceItem.dataset.resource, resourceItem.dataset.id); }
        else if (target.matches('.btn-delete')) {
            e.stopPropagation();
            if (confirm(`Sei sicuro di voler eliminare ${resourceItem.dataset.resource} #${resourceItem.dataset.id}?`)) {
                await api.delete(`${resourceItem.dataset.resource}/${resourceItem.dataset.id}`);
                actions.loadInitialData();
            }
        }
        else if (target.matches('.btn-assign')) {
            if (currentUserId && currentUserId !== 'all') { await api.put(`tasks/${target.dataset.taskId}/assign`, { user_id: currentUserId }); actions.fetchAndRenderTasks(); }
            else { alert("Seleziona un utente specifico."); }
        }
        else if (target.matches('.btn-complete')) { await api.put(`tasks/${target.dataset.taskId}/complete`); actions.fetchAndRenderTasks(); }
        else if (target.matches('.btn-add-user')) { e.stopPropagation(); actions.openAddUserModal(target.dataset.groupId); }
        else if (target.matches('.btn-remove-user')) {
            e.stopPropagation();
            const userRow = target.closest('tr');
            if(confirm('Rimuovere questo utente?')) {
                await api.delete(`gruppi/${listItem.dataset.id}/remove/${userRow.dataset.userId}`);
                listItem.classList.remove('active'); listItem.querySelector('.item-header').click();
            }
        }
        else if (target.matches('.btn-subflow')) { e.stopPropagation(); actions.openSubflowModal(target.dataset.taskId); }
        else if (target.matches('.btn-view-subflows')) { e.stopPropagation(); actions.openViewSubflowsModal(target.dataset.instanceId); }
        else if (target.matches('.btn-notes')) { e.stopPropagation(); actions.openNotesModal(target.dataset.taskId); }
        else if (listItem && target.closest('.item-header')) {
            const resource = listItem.dataset.resource;
            const id = listItem.dataset.id;
            const detailsContainer = listItem.querySelector('.item-details');
            const isActive = listItem.classList.toggle('active');
            document.querySelectorAll('.list-item.active').forEach(item => { if(item !== listItem) { item.classList.remove('active'); item.querySelector('.item-details').innerHTML = ''; } });
            detailsContainer.innerHTML = isActive ? '<p>...</p>' : '';
            if (isActive) {
                try {
                    const data = await api.get(`${resource}/${id}`);
                    if (resource === 'workflows') render.workflowSteps(detailsContainer, data.steps, id);
                    else if (resource === 'gruppi') render.groupUsers(detailsContainer, data.users, id);
                    else if (resource === 'workflowistanze') render.instanceTasks(detailsContainer, data.tasks);
                } catch (error) { detailsContainer.innerHTML = `<p style="color:red;">${error.message}</p>`; }
            }
        }
    });

    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => { if (e.target === modal || e.target.matches('.modal-close-btn, .close-modal-btn')) actions.closeModal(modal); });
    });

    dom.createForm.addEventListener('change', (e) => { /* Gestione parametri dinamici */ });

    document.getElementById('create-modal-save').addEventListener('click', async () => {
        const { resource, parentId } = currentCreateData;
        const data = Object.fromEntries(new FormData(dom.createForm));
        const checkbox = dom.createForm.querySelector('input[type="checkbox"]');
        if(checkbox) data[checkbox.name] = checkbox.checked ? 1 : 0;
        if (parentId) data.workflow_id = parentId;
        await api.post(resource, data);
        actions.closeModal(dom.createModal);
        actions.loadInitialData();
    });

    document.getElementById('modal-save').addEventListener('click', async () => {
        const { resource, id } = currentEditData;
        const data = Object.fromEntries(new FormData(dom.editForm));
        const checkbox = dom.editForm.querySelector('input[type="checkbox"]');
        if(checkbox) data[checkbox.name] = checkbox.checked ? 1 : 0;
        await api.put(`${resource}/${id}`, data);
        actions.closeModal(dom.editModal);
        actions.loadInitialData();
    });

    dom.startInstanceForm.addEventListener('submit', async(e) => {
        e.preventDefault();
        if (!workflowToStartId || !currentUserId || currentUserId === 'all') return alert("Seleziona un utente specifico.");
        const data = { id_utente_avvio: currentUserId, ...Object.fromEntries(new FormData(dom.startInstanceForm)) };
        await api.post(`workflows/${workflowToStartId}/start`, data);
        actions.closeModal(dom.startInstanceModal);
        await actions.loadInitialData(); await actions.fetchAndRenderTasks();
    });

    dom.startSubflowForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const workflowId = tsSubflowWf.getValue();
        const userId = tsSubflowUser.getValue();
        if (!workflowId || !currentParentTaskId) { alert('Workflow e task genitore sono obbligatori.'); return; }
        const payload = { id_utente_avvio: currentUserId, assegna_a_utente_id: userId || null };
        await api.post(`tasks/${currentParentTaskId}/start_subflow/${workflowId}`, payload);
        actions.closeModal(dom.subflowModal);
        actions.fetchAndRenderTasks();
    });

    dom.addUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userId = tomSelectAddUser.getValue();
        if(!userId || !currentGroupId) return;
        await api.post(`gruppi/${currentGroupId}/add/${userId}`);
        actions.closeModal(dom.addUserModal);
        const groupItem = document.querySelector(`.list-item[data-resource="gruppi"][data-id="${currentGroupId}"]`);
        if(groupItem) { groupItem.classList.remove('active'); groupItem.querySelector('.item-header').click(); }
    });

    dom.addNoteForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const taskId = e.target.dataset.taskId;
        const nota = dom.addNoteForm.querySelector('textarea').value;
        if(!nota || !currentUserId || currentUserId === 'all') { alert("Nota vuota o utente non valido."); return; }
        await api.post(`tasks/${taskId}/note`, {nota: nota, id_utente: currentUserId});
        actions.openNotesModal(taskId);
        dom.addNoteForm.reset();
    });

    dom.taskSearch.addEventListener('input', () => {
        clearTimeout(dom.taskSearch.searchTimeout);
        dom.taskSearch.searchTimeout = setTimeout(actions.fetchAndRenderTasks, 300);
    });

    tomSelectUsers = new TomSelect(dom.userSelector, {
        valueField: 'id', labelField: 'nome_completo', searchField: 'nome_completo',
        load: (query, callback) => {
            api.get(`utenti?search=${encodeURIComponent(query)}`)
                .then(users => callback(query === '' ? [{ id: 'all', nome_completo: 'Tutti gli Utenti' }, ...users] : users))
                .catch(() => callback());
        },
        onChange: (value) => { currentUserId = value; actions.fetchAndRenderTasks(); },
    });

    tomSelectUsers.load('');
    actions.loadInitialData();
});