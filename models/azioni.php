<?php
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../models/WorkflowStep.php';
require_once __DIR__ . '/../models/Task.php';
// Includeremmo qui anche le classi per inviare email, etc.

class azioni
{
    private $db;
    private $step_model;

    public function __construct()
    {
        $this->db = new Database();
        $this->step_model = new WorkflowStep($this->db);
    }

    public function execute(int $workflow_step_id)
    {
        // 1. Trova il passo del workflow
        if (!$this->step_model->find($workflow_step_id)) {
            throw new Exception("Passo del workflow non trovato.");
        }

        // 2. Determina quale azione eseguire
        $azione_info = $this->db->selectOne("SELECT codice_azione FROM azioni_standard WHERE id = ?", [$this->step_model->azione_id]);
        if (!$azione_info) {
            throw new Exception("Azione standard non trovata.");
        }
        
        $codice_azione = $azione_info['codice_azione'];
        $parametri = $this->step_model->getParametriAsArray();

        // 3. Esegui l'azione usando uno switch
        switch ($codice_azione) {
            case 'SEND_EMAIL':
                $this->handleSendEmail($parametri);
                break;
            case 'SEND_WHATSAPP':
                //LOGICA PER INVIARE WHATSAPP
                break;
            case 'CREATE_TASK':
                $this->handleCreateTask($parametri);
                break;

            case 'COMPLETE_STEP':
                // Logica per marcare il passo come completo...
                echo "Azione 'Completa Passo' eseguita.";
                break;

            default:
                throw new Exception("Azione '{$codice_azione}' non gestita.");
        }
    }

    private function handleSendEmail(array $params)
    {
        echo "Invio email a: " . $params['to_email'] . " con oggetto: " . $params['subject'];
        // Qui andrebbe la vera logica di invio email con una libreria come PHPMailer
    }

    private function handleCreateTask(array $params)
    {
        echo "Creazione task: " . $params['nome_task'];
        $task = new Task($this->db);
        $task->nome = $params['nome_task'];
        $task->descrizione = $params['descrizione_task'];
        $task->id_utente_assegnato = $params['id_utente_assegnato'];
        // Altri campi necessari...
        $task->create();
    }
}