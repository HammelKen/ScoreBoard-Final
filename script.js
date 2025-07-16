// Konstanten
const STORAGE_PREFIX = 'scoreboard_';
const TEMPLATE_PREFIX = 'scoreboard_template_';
const MAX_TEAMS = 16;
const MIN_TEAMS = 2;

// Vordefinierte Teamfarben
const TEAM_COLORS = [
  '#ff0000', '#0000ff', '#00ff00', '#ffff00',
  '#ff00ff', '#00ffff', '#00ffff', '#ff8000', '#8000ff',
  '#00ff80', '#ff0080', '#808000', '#0080ff',
  '#800000', '#008000', '#000080', '#ffa500'
];

// App-Zustand
const appState = {
  teams: [],
  previousRankings: [], // Für Ranking-Animationen
  timerInterval: null,
  totalSeconds: 0,
  lastSaveKey: null,
  isTimerRunning: false,
  colorPickerTarget: null,
  autoSaveTimeout: null,
  confirmCallback: null,
  initialTeams: [
    { name: "Team 1", score: 0, color: TEAM_COLORS[0] },
    { name: "Team 2", score: 0, color: TEAM_COLORS[1] }
  ],
  soundEnabled: false, // Sound ist standardmäßig aus, wird beim ersten Klick aktiviert
  synth: null // Tone.js synth
};

// DOM-Elemente initialisieren
const elements = {
  scoreboard: document.getElementById('scoreboard'),
  timer: document.getElementById('timer'),
  timerBtn: document.getElementById('timerBtn'),
  lastSavedModal: document.getElementById('lastSavedModal'),
  colorPickerDialog: document.getElementById('colorPickerDialog'),
  colorPreview: document.getElementById('colorPreview'),
  colorPalette: document.getElementById('colorPalette'),
  customColor: document.getElementById('customColor'),
  autoSaveFeedback: document.getElementById('autoSaveFeedback'),
  rankingsTableBody: document.querySelector('#rankingsTable tbody'),
  rankingContainer: document.getElementById('rankingContainer'),
  toggleTimerBtn: document.getElementById('toggleTimerBtn'),
  timerContainer: document.getElementById('timerContainer'),
  bulkScoreAmount: document.getElementById('bulkScoreAmount'),
  addBulkScoreBtn: document.getElementById('addBulkScoreBtn'),
  subtractBulkScoreBtn: document.getElementById('subtractBulkScoreBtn'),
  bulkAdjustmentContainer: document.getElementById('bulkAdjustmentContainer'),

  // MODAL-ELEMENTE
  saveLoadModal: document.getElementById('saveLoadModal'),
  openSaveLoadModalBtn: document.getElementById('openSaveLoadModalBtn'),
  closeSaveLoadModal: document.getElementById('closeSaveLoadModal'),
  saveNameModal: document.getElementById('saveNameModal'),
  gameNoteModal: document.getElementById('gameNoteModal'),
  saveGameModalBtn: document.getElementById('saveGameModalBtn'),
  savedGamesModal: document.getElementById('savedGamesModal'),
  deleteGameModalBtn: document.getElementById('deleteGameModalBtn'),
  loadGameModalBtn: document.getElementById('loadGameModalBtn'),
  resetAllDataBtn: document.getElementById('resetAllDataBtn'),
  resetCurrentGameBtn: document.getElementById('resetCurrentGameBtn'),

  // Ranking Modal Elemente
  rankingsModal: document.getElementById('rankingsModal'),
  closeRankingsModal: document.getElementById('closeRankingsModal'),
  toggleRankingsBtn: document.getElementById('toggleRankingsBtn'),

  // Bulk Adjustment Modal Elemente
  bulkAdjustmentModal: document.getElementById('bulkAdjustmentModal'),
  closeBulkAdjustmentModal: document.getElementById('closeBulkAdjustmentModal'),
  toggleBulkAdjustmentBtn: document.getElementById('toggleBulkAdjustmentBtn'),

  // Custom Alert/Confirm Modals
  customAlertModal: document.getElementById('customAlertModal'),
  customAlertMessage: document.getElementById('customAlertMessage'),
  customAlertTitle: document.getElementById('customAlertTitle'),
  customAlertOkBtn: document.getElementById('customAlertOkBtn'),
  customConfirmModal: document.getElementById('customConfirmModal'),
  customConfirmMessage: document.getElementById('customConfirmMessage'),
  customConfirmTitle: document.getElementById('customConfirmTitle'),
  customConfirmYesBtn: document.getElementById('customConfirmYesBtn'),
  customConfirmNoBtn: document.getElementById('customConfirmNoBtn'),

  // NEU: Team-Vorlagen Elemente
  templateNameInput: document.getElementById('templateNameInput'),
  saveTemplateBtn: document.getElementById('saveTemplateBtn'),
  savedTemplatesSelect: document.getElementById('savedTemplatesSelect'),
  loadTemplateBtn: document.getElementById('loadTemplateBtn'),
  deleteTemplateBtn: document.getElementById('deleteTemplateBtn'),

  // NEU: Export/Import Elemente
  exportGameBtn: document.getElementById('exportGameBtn'),
  importGameBtn: document.getElementById('importGameBtn'),
  importFileInput: document.getElementById('importFileInput'),
};

// --- Sound Engine ---
function initSound() {
    if (appState.soundEnabled) return;
    // Initialisiert Tone.js nach einer Benutzerinteraktion, um die Browser-Richtlinien zu erfüllen
    Tone.start();
    appState.synth = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 }
    }).toDestination();
    appState.soundEnabled = true;
    console.log("Sound Initialized");
}

function playSound(note, duration = '8n') {
    if (!appState.soundEnabled || !appState.synth) return;
    try {
        appState.synth.triggerAttackRelease(note, duration);
    } catch (e) {
        console.error("Sound Error:", e);
    }
}

// Event-Listener, um den Sound bei der ersten Interaktion zu initialisieren
document.body.addEventListener('click', initSound, { once: true });


// Event-Listener
document.addEventListener('DOMContentLoaded', initApp);
document.getElementById('addTeamBtn').addEventListener('click', addTeam);
elements.timerBtn.addEventListener('click', toggleTimer);
elements.resetCurrentGameBtn.addEventListener('click', resetCurrentGame);
elements.resetAllDataBtn.addEventListener('click', resetTeamScores);
elements.toggleTimerBtn.addEventListener('click', toggleTimerDisplay);

// Modals öffnen/schließen
elements.toggleRankingsBtn.addEventListener('click', openRankingsModal);
elements.toggleBulkAdjustmentBtn.addEventListener('click', openBulkAdjustmentModal);
elements.closeRankingsModal.addEventListener('click', closeRankingsModal);
elements.closeBulkAdjustmentModal.addEventListener('click', closeBulkAdjustmentModal);
elements.openSaveLoadModalBtn.addEventListener('click', openSaveLoadModal);
elements.closeSaveLoadModal.addEventListener('click', closeSaveLoadModal);

// Speichern/Laden
elements.saveGameModalBtn.addEventListener('click', saveGame);
elements.loadGameModalBtn.addEventListener('click', loadGame);
elements.deleteGameModalBtn.addEventListener('click', deleteGame);

// Color Picker
document.getElementById('applyColorBtn').addEventListener('click', applyTeamColor);
document.getElementById('cancelColorBtn').addEventListener('click', closeColorPicker);
elements.customColor.addEventListener('input', updateColorPreview);

// Custom Alert/Confirm
elements.customAlertOkBtn.addEventListener('click', () => elements.customAlertModal.style.display = 'none');
elements.customConfirmYesBtn.addEventListener('click', () => {
  elements.customConfirmModal.style.display = 'none';
  if (appState.confirmCallback) {
    playSound('C5');
    appState.confirmCallback(true);
    appState.confirmCallback = null;
  }
});
elements.customConfirmNoBtn.addEventListener('click', () => {
  elements.customConfirmModal.style.display = 'none';
  if (appState.confirmCallback) {
    playSound('A4');
    appState.confirmCallback(false);
    appState.confirmCallback = null;
  }
});
document.querySelectorAll('.close-button[data-close-modal]').forEach(button => {
  button.addEventListener('click', (event) => {
    const modalType = event.target.dataset.closeModal;
    if (modalType === 'alert') elements.customAlertModal.style.display = 'none';
    else if (modalType === 'confirm') elements.customConfirmModal.style.display = 'none';
  });
});

// Bulk Score
elements.addBulkScoreBtn.addEventListener('click', () => addBulkScore(true));
elements.subtractBulkScoreBtn.addEventListener('click', () => addBulkScore(false));

// NEU: Event-Listener für Vorlagen
elements.saveTemplateBtn.addEventListener('click', saveTemplate);
elements.loadTemplateBtn.addEventListener('click', loadTemplate);
elements.deleteTemplateBtn.addEventListener('click', deleteTemplate);

// NEU: Event-Listener für Export/Import
elements.exportGameBtn.addEventListener('click', exportGame);
elements.importGameBtn.addEventListener('click', () => elements.importFileInput.click());
elements.importFileInput.addEventListener('change', importGame);

// Generische Event-Listener zum Schließen von Modals
window.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
});
window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        document.querySelectorAll('.modal.active, .color-picker-dialog.active').forEach(modal => {
            modal.classList.remove('active');
            modal.style.display = 'none';
        });
    }
});


/**
 * Initialisiert die App
 */
function initApp() {
  loadSavedGames();
  loadTemplates(); // Vorlagen laden
  initColorPalette();

  let loadedSuccessfully = false;
  const lastSaveData = localStorage.getItem(STORAGE_PREFIX + 'lastSaveKey');
  if (lastSaveData) {
      appState.lastSaveKey = lastSaveData;
      try {
        const data = JSON.parse(localStorage.getItem(STORAGE_PREFIX + appState.lastSaveKey));
        if (data) {
          appState.teams = data.teams || [];
          appState.totalSeconds = data.totalSeconds || 0;
          elements.saveNameModal.value = appState.lastSaveKey;
          elements.gameNoteModal.value = data.notes || '';
          showLastSaved(appState.lastSaveKey);
          loadedSuccessfully = true;
        }
      } catch (e) {
        console.warn("Konnte letzten Spielstand nicht laden:", e);
        appState.lastSaveKey = null;
      }
  }

  if (!loadedSuccessfully || appState.teams.length === 0) {
    appState.teams = [];
    createTeam(appState.initialTeams[0].name, appState.initialTeams[0].score, appState.initialTeams[0].color);
    createTeam(appState.initialTeams[1].name, appState.initialTeams[1].score, appState.initialTeams[1].color);
  }

  renderTeams();
  updatePreviousRankings(); // Initiales Ranking speichern
  renderRankingsTable();
  updateTimer();
  elements.timerContainer.style.display = 'none';
}

/**
 * Speichert das aktuelle Ranking, um Änderungen zu verfolgen.
 */
function updatePreviousRankings() {
    const sortedTeams = [...appState.teams].sort((a, b) => b.score - a.score);
    appState.previousRankings = sortedTeams.map(t => t.id);
}

/**
 * Initialisiert die Farbpalette für den Color Picker
 */
function initColorPalette() {
  elements.colorPalette.innerHTML = '';
  TEAM_COLORS.forEach(color => {
    const colorOption = document.createElement('div');
    colorOption.className = 'color-option';
    colorOption.style.backgroundColor = color;
    colorOption.dataset.color = color;
    colorOption.addEventListener('click', function() {
      playSound('C5', '16n');
      selectColorOption(this);
      elements.customColor.value = color;
      updateColorPreview();
    });
    elements.colorPalette.appendChild(colorOption);
  });
}

/**
 * Erstellt ein neues Team
 */
function createTeam(name = "Team", score = 0, color = null) {
  if (appState.teams.length >= MAX_TEAMS) return;
  const id = Date.now() + Math.random();
  if (!color) {
    const usedColors = appState.teams.map(team => team.color);
    color = TEAM_COLORS.find(c => !usedColors.includes(c)) ||
            TEAM_COLORS[Math.floor(Math.random() * TEAM_COLORS.length)];
  }
  appState.teams.push({ id, name, score, color });
  renderTeams();
  renderRankingsTable();
  autoSave();
}

/**
 * Rendert alle Teams im Scoreboard
 */
function renderTeams() {
  elements.scoreboard.innerHTML = "";
  appState.teams.forEach(team => {
    const teamElement = document.createElement("div");
    teamElement.className = "team";
    teamElement.style.borderTopColor = team.color;
    teamElement.dataset.teamId = team.id; // ID für Animationen

    const removeButton = appState.teams.length > MIN_TEAMS
      ? `<button class="remove" data-id="${team.id}">❌</button>`
      : "";

    teamElement.innerHTML = `
      <div class="team-color-indicator" style="background-color: ${team.color}" data-id="${team.id}"></div>
      ${removeButton}
      <input class="team-name" value="${team.name}" data-id="${team.id}">
      <div class="score-container">
        <input type="number" class="score" value="${team.score}" data-id="${team.id}">
      </div>
      <button class="btn-plus" data-id="${team.id}" data-action="increment">➕</button>
      <button class="btn-minus" data-id="${team.id}" data-action="decrement">➖</button>
    `;

    // Event-Listener
    teamElement.querySelector('.team-name').addEventListener('change', (e) => renameTeam(team.id, e.target.value));
    teamElement.querySelector('.team-color-indicator').addEventListener('click', () => openColorPicker(team.id, team.color));
    if (removeButton) {
      teamElement.querySelector('.remove').addEventListener('click', () => removeTeam(team.id));
    }
    teamElement.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        const delta = action === 'increment' ? 1 : -1;
        changeScore(team.id, delta);
      });
    });
    teamElement.querySelector('input.score').addEventListener('change', (e) => {
      const newScore = parseInt(e.target.value) || 0;
      updateManualScore(team.id, newScore);
      e.target.value = newScore;
    });

    elements.scoreboard.appendChild(teamElement);
  });
}

/**
 * Rendert die Ranglistentabelle mit Animationen.
 */
function renderRankingsTable() {
    const sortedTeams = [...appState.teams].sort((a, b) => b.score - a.score);
    elements.rankingsTableBody.innerHTML = '';

    if (sortedTeams.length === 0) {
        const row = elements.rankingsTableBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 3;
        cell.textContent = "Keine Teams vorhanden.";
        cell.style.textAlign = "center";
        return;
    }

    const newRankings = sortedTeams.map(t => t.id);

    sortedTeams.forEach((team, index) => {
        const row = elements.rankingsTableBody.insertRow();
        row.innerHTML = `<td>${index + 1}</td><td>${team.name}</td><td>${team.score}</td>`;

        const oldIndex = appState.previousRankings.indexOf(team.id);
        if (oldIndex !== -1) {
            if (index < oldIndex) {
                row.classList.add('rank-up');
            } else if (index > oldIndex) {
                row.classList.add('rank-down');
            }
        }
        // Animation nach Abschluss entfernen, um Re-Trigger zu vermeiden
        row.addEventListener('animationend', () => {
            row.classList.remove('rank-up', 'rank-down');
        });
    });

    // Update previous rankings for the next render
    appState.previousRankings = newRankings;
}

/**
 * Zeigt eine fließende Animation für Punkteänderungen.
 */
function showScoreChangeAnimation(teamId, delta) {
    const teamElement = document.querySelector(`.team[data-team-id='${teamId}']`);
    if (!teamElement) return;

    const scoreContainer = teamElement.querySelector('.score-container');
    const animationElement = document.createElement('div');
    animationElement.className = `score-change-indicator ${delta > 0 ? 'plus' : 'minus'}`;
    animationElement.textContent = `${delta > 0 ? '+' : ''}${delta}`;
    
    scoreContainer.appendChild(animationElement);
    
    // Element nach der Animation entfernen
    setTimeout(() => {
        animationElement.remove();
    }, 1000);
}


/**
 * Ändert den Punktestand eines Teams.
 */
function changeScore(id, delta) {
  const team = appState.teams.find(t => t.id === id);
  if (!team) return;
  
  updatePreviousRankings(); // Ranking *vor* der Änderung speichern
  
  team.score += delta;
  
  playSound(delta > 0 ? 'C5' : 'C4', '16n');
  showScoreChangeAnimation(id, delta);

  const scoreInput = document.querySelector(`.team input.score[data-id="${id}"]`);
  if (scoreInput) scoreInput.value = team.score;
  
  renderRankingsTable();
  autoSave();
}

/**
 * Aktualisiert den Punktestand manuell.
 */
function updateManualScore(id, newScore) {
  const team = appState.teams.find(t => t.id === id);
  if (team) {
    updatePreviousRankings(); // Ranking *vor* der Änderung speichern
    team.score = newScore;
    renderRankingsTable();
    autoSave();
    playSound('E4', '8n');
  }
}

/**
 * Benennt ein Team um.
 */
function renameTeam(id, newName) {
  const team = appState.teams.find(t => t.id === id);
  if (team) {
    team.name = newName;
    renderRankingsTable(); // Name ändert nicht den Rang, aber die Anzeige
    autoSave();
  }
}

/**
 * Entfernt ein Team.
 */
function removeTeam(id) {
  if (appState.teams.length <= MIN_TEAMS) return;
  showCustomConfirm("Team wirklich entfernen?", (confirmed) => {
    if (confirmed) {
        updatePreviousRankings();
        appState.teams = appState.teams.filter(t => t.id !== id);
        renderTeams();
        renderRankingsTable();
        autoSave();
    }
  });
}

/**
 * Fügt ein neues Team hinzu.
 */
function addTeam() {
  if (appState.teams.length >= MAX_TEAMS) {
    showCustomAlert("Maximal 16 Teams erlaubt!");
    return;
  }
  playSound('G4', '8n');
  updatePreviousRankings();
  createTeam(`Team ${appState.teams.length + 1}`);
}

// --- Farbwähler Funktionen ---
function openColorPicker(teamId, currentColor) {
  appState.colorPickerTarget = teamId;
  elements.customColor.value = currentColor;
  updateColorPreview();
  const colorOptions = elements.colorPalette.querySelectorAll('.color-option');
  colorOptions.forEach(option => {
    option.classList.remove('selected');
    if (option.dataset.color === currentColor) option.classList.add('selected');
  });
  elements.colorPickerDialog.style.display = 'flex';
  elements.colorPickerDialog.classList.add('active');
}
function selectColorOption(selectedOption) {
  elements.colorPalette.querySelectorAll('.color-option').forEach(option => option.classList.remove('selected'));
  selectedOption.classList.add('selected');
}
function updateColorPreview() {
  elements.colorPreview.style.backgroundColor = elements.customColor.value;
}
function applyTeamColor() {
  if (!appState.colorPickerTarget) return;
  const team = appState.teams.find(t => t.id === appState.colorPickerTarget);
  if (team) {
    team.color = elements.customColor.value;
    renderTeams();
    renderRankingsTable();
    autoSave();
    playSound('C5', '8n');
  }
  closeColorPicker();
}
function closeColorPicker() {
  appState.colorPickerTarget = null;
  elements.colorPickerDialog.style.display = 'none';
  elements.colorPickerDialog.classList.remove('active');
}

// --- Timer Funktionen ---
function toggleTimer() {
  playSound('E5', '16n');
  if (appState.isTimerRunning) {
    clearInterval(appState.timerInterval);
    appState.isTimerRunning = false;
    elements.timerBtn.textContent = "Start";
  } else {
    appState.isTimerRunning = true;
    elements.timerBtn.textContent = "Stop";
    appState.timerInterval = setInterval(() => {
      appState.totalSeconds++;
      updateTimer();
    }, 1000);
  }
}
function updateTimer() {
  const minutes = String(Math.floor(appState.totalSeconds / 60)).padStart(2, '0');
  const seconds = String(appState.totalSeconds % 60).padStart(2, '0');
  elements.timer.textContent = `${minutes}:${seconds}`;
}
function toggleTimerDisplay() {
  playSound('A4', '16n');
  elements.timerContainer.style.display = (elements.timerContainer.style.display === 'none') ? 'flex' : 'none';
}
function resetCurrentGame() {
  showCustomConfirm("Timer wirklich zurücksetzen?", (result) => {
    if (!result) return;
    appState.totalSeconds = 0;
    if (appState.timerInterval) {
      clearInterval(appState.timerInterval);
      appState.timerInterval = null;
      appState.isTimerRunning = false;
      elements.timerBtn.textContent = "Start";
    }
    updateTimer();
  });
}

// --- Punkte-Funktionen ---
function resetTeamScores() {
  showCustomConfirm("Punkte aller Teams auf 0 zurücksetzen?", (result) => {
    if (result) {
      updatePreviousRankings();
      appState.teams.forEach(t => t.score = 0);
      renderTeams();
      renderRankingsTable();
      autoSave();
      showCustomAlert("Alle Teampunkte wurden zurückgesetzt.");
    }
  });
}
function addBulkScore(isAddition) {
  const amount = parseInt(elements.bulkScoreAmount.value);
  if (isNaN(amount) || amount <= 0) {
    showCustomAlert("Bitte eine positive Zahl eingeben.");
    return;
  }
  const actionText = isAddition ? "hinzufügen" : "abziehen";
  showCustomConfirm(`Wirklich ${amount} Punkte bei allen Teams ${actionText}?`, (result) => {
    if (result) {
      updatePreviousRankings();
      appState.teams.forEach(team => {
        team.score = isAddition ? team.score + amount : team.score - amount;
      });
      renderTeams();
      renderRankingsTable();
      autoSave();
      showCustomAlert(`${amount} Punkte wurden bei allen Teams ${actionText}.`);
    }
  });
}

// --- Modal Öffnen/Schließen ---
function openRankingsModal() { playSound('B4'); elements.rankingsModal.style.display = 'flex'; }
function closeRankingsModal() { elements.rankingsModal.style.display = 'none'; }
function openBulkAdjustmentModal() { playSound('B4'); elements.bulkAdjustmentModal.style.display = 'flex'; }
function closeBulkAdjustmentModal() { elements.bulkAdjustmentModal.style.display = 'none'; }
function openSaveLoadModal() {
  playSound('B4');
  elements.saveLoadModal.style.display = 'flex';
  loadSavedGames();
  loadTemplates();
  if (appState.lastSaveKey) {
    elements.saveNameModal.value = appState.lastSaveKey;
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_PREFIX + appState.lastSaveKey));
      elements.gameNoteModal.value = data.notes || '';
    } catch (e) {
      elements.gameNoteModal.value = '';
    }
  } else {
    elements.saveNameModal.value = '';
    elements.gameNoteModal.value = '';
  }
  elements.savedGamesModal.value = 'default';
  showLastSaved(appState.lastSaveKey);
}
function closeSaveLoadModal() { elements.saveLoadModal.style.display = 'none'; }

// --- Speichern, Laden, Löschen ---
function saveGame() {
  const nameInput = elements.saveNameModal.value.trim();
  if (!nameInput && !appState.lastSaveKey) {
    showCustomAlert("Bitte einen Namen für den Spielstand eingeben!");
    return;
  }
  appState.lastSaveKey = nameInput || appState.lastSaveKey;
  elements.saveNameModal.value = appState.lastSaveKey;
  const key = `${STORAGE_PREFIX}${appState.lastSaveKey}`;
  const data = { teams: appState.teams, totalSeconds: appState.totalSeconds, notes: elements.gameNoteModal.value.trim(), savedAt: new Date().toISOString() };
  try {
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem(STORAGE_PREFIX + 'lastSaveKey', appState.lastSaveKey);
    loadSavedGames();
    showLastSaved(appState.lastSaveKey);
    showCustomAlert(`Spiel "${appState.lastSaveKey}" gespeichert!`);
  } catch (error) {
    showCustomAlert("Fehler beim Speichern!");
  }
}
function autoSave() {
  if (appState.lastSaveKey) {
    const key = `${STORAGE_PREFIX}${appState.lastSaveKey}`;
    const data = { teams: appState.teams, totalSeconds: appState.totalSeconds, notes: elements.gameNoteModal.value.trim(), savedAt: new Date().toISOString() };
    try {
      localStorage.setItem(key, JSON.stringify(data));
      showAutoSaveFeedback("Automatisch gespeichert!");
    } catch (error) { console.error("Auto-Save Fehler:", error); }
  }
}
function loadGame() {
  const selected = elements.savedGamesModal.value;
  if (!selected || selected === "default") {
    showCustomAlert("Bitte Spielstand zum Laden auswählen!");
    return;
  }
  try {
    const data = JSON.parse(localStorage.getItem(selected));
    if (!data) { showCustomAlert("Fehler: Spielstand nicht gefunden."); return; }
    showCustomConfirm("Aktuelles Spiel wird überschrieben. Wirklich laden?", (result) => {
        if (!result) { elements.savedGamesModal.value = "default"; return; }
        appState.teams = data.teams || [];
        appState.teams.forEach((team, index) => { if (!team.color) team.color = TEAM_COLORS[index % TEAM_COLORS.length]; });
        appState.totalSeconds = data.totalSeconds || 0;
        
        updatePreviousRankings(); // KORREKTUR
        renderTeams();
        renderRankingsTable();
        updateTimer();

        elements.gameNoteModal.value = data.notes || "";
        appState.lastSaveKey = selected.replace(STORAGE_PREFIX, "");
        elements.saveNameModal.value = appState.lastSaveKey;
        localStorage.setItem(STORAGE_PREFIX + 'lastSaveKey', appState.lastSaveKey);
        showLastSaved(appState.lastSaveKey);
        closeSaveLoadModal();
        showCustomAlert(`Spiel "${appState.lastSaveKey}" geladen!`);
    }, "Spiel laden");
  } catch (error) { showCustomAlert("Fehler beim Laden des Spiels!"); }
}
function deleteGame() {
  const selected = elements.savedGamesModal.value;
  if (!selected || selected === "default") { showCustomAlert("Bitte Spielstand zum Löschen auswählen!"); return; }
  const nameToDelete = selected.replace(STORAGE_PREFIX, "");
  showCustomConfirm(`Spielstand "${nameToDelete}" wirklich löschen?`, (result) => {
    if (result) {
      localStorage.removeItem(selected);
      if (appState.lastSaveKey === nameToDelete) {
        appState.lastSaveKey = null;
        localStorage.removeItem(STORAGE_PREFIX + 'lastSaveKey');
        elements.saveNameModal.value = '';
        elements.gameNoteModal.value = '';
      }
      loadSavedGames();
      showLastSaved(appState.lastSaveKey || '');
      showCustomAlert(`Spiel "${nameToDelete}" gelöscht.`);
    }
  });
}

// --- Vorlagen-Funktionen ---
function saveTemplate() {
    const name = elements.templateNameInput.value.trim();
    if (!name) {
        showCustomAlert("Bitte einen Namen für die Vorlage eingeben.");
        return;
    }
    const templateData = {
        teams: appState.teams.map(t => ({ name: t.name, color: t.color }))
    };
    localStorage.setItem(TEMPLATE_PREFIX + name, JSON.stringify(templateData));
    loadTemplates();
    elements.templateNameInput.value = '';
    showCustomAlert(`Vorlage "${name}" gespeichert!`);
}
function loadTemplates() {
    elements.savedTemplatesSelect.innerHTML = '<option disabled selected value="default">📜 Vorlage auswählen</option>';
    Object.keys(localStorage).filter(key => key.startsWith(TEMPLATE_PREFIX)).forEach(key => {
        const name = key.replace(TEMPLATE_PREFIX, "");
        const option = document.createElement("option");
        option.value = key;
        option.textContent = name;
        elements.savedTemplatesSelect.appendChild(option);
    });
}
function loadTemplate() {
    const selected = elements.savedTemplatesSelect.value;
    if (!selected || selected === "default") {
        showCustomAlert("Bitte eine Vorlage zum Laden auswählen.");
        return;
    }
    showCustomConfirm("Aktuelle Teams werden durch die Vorlage ersetzt. Fortfahren?", (confirmed) => {
        if (confirmed) {
            const templateData = JSON.parse(localStorage.getItem(selected));
            appState.teams = templateData.teams.map((team, index) => ({
                id: Date.now() + index,
                name: team.name,
                color: team.color,
                score: 0
            }));
            updatePreviousRankings(); // KORREKTUR
            renderTeams();
            renderRankingsTable();
            autoSave();
            closeSaveLoadModal();
            showCustomAlert("Vorlage geladen!");
        }
    });
}
function deleteTemplate() {
    const selected = elements.savedTemplatesSelect.value;
    if (!selected || selected === "default") {
        showCustomAlert("Bitte eine Vorlage zum Löschen auswählen.");
        return;
    }
    const name = selected.replace(TEMPLATE_PREFIX, "");
    showCustomConfirm(`Vorlage "${name}" wirklich löschen?`, (confirmed) => {
        if (confirmed) {
            localStorage.removeItem(selected);
            loadTemplates();
            showCustomAlert(`Vorlage "${name}" gelöscht.`);
        }
    });
}

// --- Export/Import Funktionen ---
function exportGame() {
    if (!appState.lastSaveKey) {
        showCustomAlert("Bitte speichern Sie das Spiel zuerst, um es zu exportieren.");
        return;
    }
    const dataToExport = {
        version: 1,
        savedAt: new Date().toISOString(),
        gameState: {
            teams: appState.teams,
            totalSeconds: appState.totalSeconds,
            notes: elements.gameNoteModal.value.trim()
        }
    };
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], {type: "application/json"});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().slice(0, 10);
    link.download = `scoreboard_${appState.lastSaveKey || 'spiel'}_${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showCustomAlert("Spiel exportiert!");
}
function importGame(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.gameState || !data.gameState.teams) {
                throw new Error("Ungültige Speicherdatei.");
            }
            showCustomConfirm("Aktuelles Spiel wird durch Import überschrieben. Fortfahren?", (confirmed) => {
                if (confirmed) {
                    const gameState = data.gameState;
                    appState.teams = gameState.teams || [];
                    appState.totalSeconds = gameState.totalSeconds || 0;
                    elements.gameNoteModal.value = gameState.notes || "";
                    updatePreviousRankings(); // KORREKTUR
                    renderTeams();
                    renderRankingsTable();
                    updateTimer();
                    autoSave();
                    closeSaveLoadModal();
                    showCustomAlert("Spiel erfolgreich importiert!");
                }
            });
        } catch (error) {
            showCustomAlert("Fehler beim Importieren der Datei: " + error.message);
        } finally {
            elements.importFileInput.value = "";
        }
    };
    reader.readAsText(file);
}

// --- Hilfsfunktionen ---
function showAutoSaveFeedback(message) {
  elements.autoSaveFeedback.textContent = message;
  elements.autoSaveFeedback.classList.add('show');
  if (appState.autoSaveTimeout) clearTimeout(appState.autoSaveTimeout);
  appState.autoSaveTimeout = setTimeout(() => {
    elements.autoSaveFeedback.classList.remove('show');
  }, 3000);
}
function showLastSaved(name) {
  elements.lastSavedModal.textContent = name ? `Zuletzt bearbeitet: ${name}` : `Kein Spielstand aktiv`;
}
function loadSavedGames() {
  elements.savedGamesModal.innerHTML = '<option disabled selected value="default">📂 Spielstand auswählen</option>';
  Object.keys(localStorage).filter(key => key.startsWith(STORAGE_PREFIX) && key !== STORAGE_PREFIX + 'lastSaveKey').sort().forEach(key => {
      const name = key.replace(STORAGE_PREFIX, "");
      const option = document.createElement("option");
      option.value = key;
      option.textContent = name;
      elements.savedGamesModal.appendChild(option);
    });
}
function showCustomAlert(message, title = "Info") {
  playSound('A5', '8n');
  elements.customAlertTitle.textContent = title;
  elements.customAlertMessage.textContent = message;
  elements.customAlertModal.style.display = 'flex';
}
function showCustomConfirm(message, callback, title = "Bestätigung") {
  playSound('G4', '4n');
  elements.customConfirmTitle.textContent = title;
  elements.customConfirmMessage.textContent = message;
  appState.confirmCallback = callback;
  elements.customConfirmModal.style.display = 'flex';
}
