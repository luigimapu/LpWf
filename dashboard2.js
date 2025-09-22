document.addEventListener('DOMContentLoaded', () => {

    const API_BASE_URL = '/LpWF/api';
    let currentUserId = null;

    // Riferimenti agli elementi DOM principali
    const userSelectorEl = document.getElementById('user-selector');
    const dashboardMainEl = document.getElementById('dashboard-main');

    // Riferimenti alle colonne Kanban
    const tasksTodoEl = document.getElementById('tasks-todo');
    const tasksDoingEl = document.getElementById('tasks-doing');
    const tasksDoneEl = document.getElementById('tasks-done');
    const taskSearchEl = document.getElementById('task-search');

    // Riferimenti per la sezione report
    const workflowsListEl = document.getElementById('workflows-list');
    const instancesListEl = document.getElementById('instances-list');

    // --- FUNZIONI DI RENDERING PER LE CARD DEI TASK (KANBAN) ---

    const createTaskCard = (task) => {
        const card = document.createElement('div');
        card.className = 'task-card';

        let statusBadge = '';
        if (task.id_stato === 1) statusBadge = '<span class="status-badge status-aperto">Aperto</span>';
        if (task.id_stato === 2) statusBadge = '<span class="status-badge status-lavorazione">In Lavorazione</span>';
        if (task.id_stato === 3) statusBadge = '<span class="status-badge status-chiuso">Chiuso</span>';

        let footerButtons = '';
        if (task.id_stato === 1 && !task.id_utente_assegnato) {
            footerButtons = `<button class="btn-assign" data-task-id="${task.id}">Prendi in carico</button>`;
        }
        if (task.id_stato === 2 && task.id_utente_assegnato == currentUserId) {
            footerButtons = `<button class="btn-complete" data-task-id="${task.id}">Completa Task</button>`;
        }

        card.innerHTML = `
            <div class="task-card-header"><h3>${task.nome}</h3></div>
            <div class="task-card-body">
                <p><strong>Workflow:</strong> ${task.nome_workflow || 'N/D'}</p>
                <p><strong>Stato:</strong> ${statusBadge}</p>
                <p><small>Task ID: ${task.id} | Istanza ID: ${task.id_istanza_workflow}</small></p>
            </div>
            <div class="task-card-footer">${footerButtons}</div>`;
        return card;
    };

    // In dashboard.js

    // --- FUNZIONI DI RENDERING ---

    // Modifica createClickableListItem per includere i pulsanti
    const createClickableListItem = (item, primaryText, secondaryText, resourceType) => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.dataset.id = item.id;
        div.dataset.resource = resourceType;
        div.innerHTML = `
            <div class="item-header">
                <span class="item-header-title">${primaryText} <small style="color:#6c757d; font-weight:400;">(ID: ${item.id})</small></span>
                <div class="item-actions">
                    <button class="btn-edit" title="Modifica">&#9998;</button> <!-- Simbolo matita -->
                    <button class="btn-delete" title="Elimina">&#128465;</button> <!-- Simbolo cestino -->
                </div>
            </div>
            <div class="item-details"><p>Clicca per espandere i dettagli...</p></div>`;
        return div;
    };

    // --- LOGICA PER IL MODAL DI MODIFICA ---
    const modalEl = document.getElementById('edit-modal');
    const modalTitleEl = document.getElementById('modal-title');
    const editFormEl = document.getElementById('edit-form');
    let currentEditData = { resource: '', id: null };

    const openEditModal = (resource, id, data) => {
        currentEditData = { resource, id };
        modalTitleEl.textContent = `Modifica ${resource} (ID: ${id})`;
        editFormEl.innerHTML = ''; // Pulisci il form precedente

        // Campi da non mostrare nel form di modifica
        const excludedFields = ['id', 'data_creazione', 'data_aggiornamento', 'steps', 'tasks'];

        for (const key in data) {
            if (!excludedFields.includes(key) && data.hasOwnProperty(key)) {
                const value = data[key];
                editFormEl.innerHTML += `
                    <label for="edit-${key}">${key.replace(/_/g, ' ')}:</label>
                    <input type="text" id="edit-${key}" name="${key}" value="${value || ''}">
                `;
            }
        }
        modalEl.style.display = 'flex';
    };

    const closeEditModal = () => {
        modalEl.style.display = 'none';
    };

    document.getElementById('modal-close').addEventListener('click', closeEditModal);
    document.getElementById('modal-save').addEventListener('click', async () => {
        const formData = new FormData(editFormEl);
        const data = Object.fromEntries(formData.entries());
        const { resource, id } = currentEditData;

        try {
            const response = await fetch(`${API_BASE_URL}/${resource}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            alert('Successo: ' + result.message);
            closeEditModal();
            loadReportData(); // Ricarica i dati per vedere le modifiche
        } catch (error) {
            alert('Errore: ' + error.message);
        }
    });

    // --- GESTIONE EVENTI GLOBALE ---

    dashboardMainEl.addEventListener('click', async (e) => {
        const target = e.target;

        // ... (la logica per i pulsanti .btn-assign e .btn-complete rimane invariata) ...

        // Logica per i pulsanti di modifica ed eliminazione
        const listItem = target.closest('.list-item');
        if (!listItem) return;

        const resource = listItem.dataset.resource;
        const id = listItem.dataset.id;

        // Click sul pulsante ELIMINA
        if (target.matches('.btn-delete')) {
            e.stopPropagation(); // Impedisce l'apertura/chiusura dei dettagli
            if (confirm(`Sei sicuro di voler eliminare ${resource} con ID ${id}?`)) {
                try {
                    const response = await fetch(`${API_BASE_URL}/${resource}/${id}`, { method: 'DELETE' });
                    const result = await response.json();
                    if (!response.ok) throw new Error(result.message);
                    alert('Successo: ' + result.message);
                    loadReportData(); // Ricarica le liste
                } catch (error) {
                    alert('Errore: ' + error.message);
                }
            }
        }
        // Click sul pulsante MODIFICA
        else if (target.matches('.btn-edit')) {
            e.stopPropagation();
            // Recuperiamo i dati completi dell'entità prima di aprire il modal
            const response = await fetch(`${API_BASE_URL}/${resource}/${id}`);
            const data = await response.json();
            openEditModal(resource, id, data);
        }
        // Click sull'elemento della lista per espandere i dettagli
        else {
            handleItemClick(e);
        }
    });

// --- NUOVA FUNZIONE PER IL FILTRO DEI TASK ---
 /*   const filterTasks = () => {
        const searchTerm = taskSearchEl.value.toLowerCase();

        // Seleziona tutte le card delle tre colonne
        const allCards = document.querySelectorAll('.kanban-board .task-card');

        allCards.forEach(card => {
            // Trova il titolo all'interno della card
            const taskTitle = card.querySelector('h3').textContent.toLowerCase();

            // Mostra o nascondi la card in base alla corrispondenza
            if (taskTitle.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    };*/

    const fetchAndRenderTasks = async () => {
        if (!currentUserId) {
            [tasksTodoEl, tasksDoingEl, tasksDoneEl].forEach(el => el.innerHTML = '<p>Seleziona un utente.</p>');
            return;
        }
        [tasksTodoEl, tasksDoingEl, tasksDoneEl].forEach(el => el.innerHTML = '<p>Caricamento...</p>');

        try {
            // Prendiamo il valore attuale della barra di ricerca
            const searchTerm = taskSearchEl.value;
            const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';

            // Aggiungiamo il parametro di ricerca alle chiamate API
            const [todoRes, doingRes, doneRes] = await Promise.all([
                fetch(`${API_BASE_URL}/tasks?id_stato=1${searchParam}`),
                fetch(`${API_BASE_URL}/tasks?id_utente_assegnato=${currentUserId}&id_stato=2${searchParam}`),
                fetch(`${API_BASE_URL}/tasks?id_utente_assegnato=${currentUserId}&id_stato=3${searchParam}`)
            ]);



            if (!todoRes.ok || !doingRes.ok || !doneRes.ok) throw new Error('Errore di rete nel caricare i task.');

            const todoTasks = (await todoRes.json()).filter(task => !task.id_utente_assegnato);
            const doingTasks = await doingRes.json();
            const doneTasks = await doneRes.json();

            tasksTodoEl.innerHTML = '';
            if (todoTasks.length === 0) tasksTodoEl.innerHTML = '<p>Nessun task disponibile.</p>';
            else todoTasks.forEach(task => tasksTodoEl.appendChild(createTaskCard(task)));

            tasksDoingEl.innerHTML = '';
            if (doingTasks.length === 0) tasksDoingEl.innerHTML = '<p>Nessun task in gestione.</p>';
            else doingTasks.forEach(task => tasksDoingEl.appendChild(createTaskCard(task)));

            tasksDoneEl.innerHTML = '';
            if (doneTasks.length === 0) tasksDoneEl.innerHTML = '<p>Nessun task completato.</p>';
            else doneTasks.forEach(task => tasksDoneEl.appendChild(createTaskCard(task)));

        } catch (error) {
            [tasksTodoEl, tasksDoingEl, tasksDoneEl].forEach(el => el.innerHTML = `<p style="color:red;">${error.message}</p>`);
        }
    };

    // --- FUNZIONI PER LA SEZIONE DI REPORTISTICA ---

  /*  const createClickableListItem = (item, primaryText, secondaryText, resourceType) => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.dataset.id = item.id;
        div.dataset.resource = resourceType;
        div.innerHTML = `
            <div class="item-header">
                ${primaryText} <small style="color:#6c757d; font-weight:400;">(ID: ${item.id})</small>
                <div style="float:right; font-size:0.9em; color:#555;">${secondaryText || ''}</div>
            </div>
            <div class="item-details"><p>Caricamento dettagli...</p></div>`;
        return div;
    };*/

    const renderWorkflowSteps = (steps) => {
        if (!steps || steps.length === 0) return '<p>Nessun passo definito per questo workflow.</p>';
        let table = '<table><thead><tr><th>Ordine</th><th>Nome Passo</th><th>Avanz. Auto</th></tr></thead><tbody>';
        steps.forEach(s => {
            table += `<tr><td>${s.ordine}.${s.sottopasso}</td><td>${s.nome_passo}</td><td>${s.avanzamento_automatico ? 'Sì' : 'No'}</td></tr>`;
        });
        return table + '</tbody></table>';
    };

    const renderInstanceTasks = (tasks) => {
        if (!tasks || tasks.length === 0) return '<p>Nessun task trovato per questa istanza.</p>';
        let table = '<table><thead><tr><th>ID</th><th>Livello</th><th>Nome Task</th><th>Stato</th><th>Assegnato a</th></tr></thead><tbody>';
        tasks.forEach(t => {
            table += `<tr><td>${t.id}</td><td>${t.step_ordine || '?'}.${t.step_sottopasso || '?'}</td><td>${t.nome}</td><td>${t.stato_nome || 'N/D'}</td><td>${t.nome_utente_assegnato || '-'}</td></tr>`;
        });
        return table + '</tbody></table>';
    };

    const handleItemClick = async (e) => {
        const item = e.target.closest('.list-item');
        if (!item) return;

        document.querySelectorAll('.report-section .list-item.active').forEach(activeItem => {
            if (activeItem !== item) activeItem.classList.remove('active');
        });
        item.classList.toggle('active');

        if (!item.classList.contains('active')) return;

        const resourceId = item.dataset.id;
        const resourceType = item.dataset.resource;
        const detailsContainer = item.querySelector('.item-details');

        try {
            const url = `${API_BASE_URL}/${resourceType}/${resourceId}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Risposta non valida dal server');
            const data = await response.json();

            if (resourceType === 'workflows') detailsContainer.innerHTML = renderWorkflowSteps(data.steps);
            else if (resourceType === 'workflowistanze') detailsContainer.innerHTML = renderInstanceTasks(data.tasks);
        } catch (error) {
            detailsContainer.innerHTML = `<p style="color:red;">Errore nel caricamento dei dettagli.</p>`;
        }
    };

    const loadReportData = async () => {
        try {
            const [workflowsRes, instancesRes] = await Promise.all([
                fetch(`${API_BASE_URL}/workflows`),
                fetch(`${API_BASE_URL}/workflowistanze`)
            ]);
            const workflows = await workflowsRes.json();
            const instances = await instancesRes.json();

            workflowsListEl.innerHTML = '';
            workflows.forEach(wf => workflowsListEl.appendChild(createClickableListItem(wf, wf.nome_workflow, wf.attivo ? 'Attivo' : 'Non Attivo', 'workflows')));

            instancesListEl.innerHTML = '';
            instances.forEach(inst => instancesListEl.appendChild(createClickableListItem(inst, `Istanza del WF #${inst.workflow_id}`, inst.stato_istanza, 'workflowistanze')));
        } catch (error) {
            workflowsListEl.innerHTML = '<p style="color:red;">Errore caricamento workflows.</p>';
            instancesListEl.innerHTML = '<p style="color:red;">Errore caricamento istanze.</p>';
        }
    };

    // --- GESTIONE EVENTI GLOBALE E INIZIALIZZAZIONE ---

    dashboardMainEl.addEventListener('click', async (e) => {
        const target = e.target;
        if (target.matches('.btn-assign, .btn-complete')) {
            const taskId = target.dataset.taskId;
            if (!taskId) return;
            let url, options = { method: 'PUT', headers: { 'Content-Type': 'application/json' } };
            if (target.classList.contains('btn-assign')) {
                url = `${API_BASE_URL}/tasks/${taskId}/assign`;
                options.body = JSON.stringify({ user_id: currentUserId });
            } else {
                url = `${API_BASE_URL}/tasks/${taskId}/complete`;
            }
            target.disabled = true;
            try {
                const response = await fetch(url, options);
                const result = await response.json();
                if (!response.ok) throw new Error(result.message);
                alert(result.message);
                fetchAndRenderTasks();
                loadReportData();
            } catch (error) {
                alert(`Errore: ${error.message}`);
                target.disabled = false;
            }
        }
        if (e.target.closest('.report-section .list-item')) {
            handleItemClick(e);
        }
    });
    // MODIFICHIAMO il listener per la ricerca
    // Invece di filtrare lato client, ora riesegue la chiamata API
    taskSearchEl.addEventListener('input', () => {
        // Aggiungiamo un piccolo ritardo (debounce) per non fare troppe chiamate API mentre l'utente digita
        // Cancella il timer precedente se esiste
        clearTimeout(taskSearchEl.searchTimeout);

        // Imposta un nuovo timer
        taskSearchEl.searchTimeout = setTimeout(() => {
            fetchAndRenderTasks();
        }, 300); // Esegui la ricerca 300ms dopo che l'utente ha smesso di digitare
    });

    new TomSelect(userSelectorEl, {
        valueField: 'id',
        labelField: 'nome_completo',
        searchField: 'nome_completo',
        load: (query, callback) => {
            fetch(`${API_BASE_URL}/utenti?search=${encodeURIComponent(query)}`).then(res => res.json()).then(callback).catch(() => callback());
        },
        onChange: (value) => {
            currentUserId = value;
            fetchAndRenderTasks();
        }
    });

    loadReportData();
});