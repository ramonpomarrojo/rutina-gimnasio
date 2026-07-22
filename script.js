const DAYS = [
  { key: "push", label: "Push" },
  { key: "pull", label: "Pull" },
  { key: "legs", label: "Legs" },
  { key: "extra", label: "Extra" },
];

const DEFAULTS = {
  push: ["Press banca inclinado con mancuernas","Chest fly en máquina","Skull crusher en banco con barra","Rope pulldown (tríceps)","Elevaciones laterales de hombro con mancuernas"],
  pull: ["Dominadas / Lat pulldown","Stiff arm rows","Curl de pie","Preacher curl","Suspensiones para antebrazos (tipo escalada)"],
  legs: ["Hack squat","RDL (peso muerto rumano)","Farmer walk","Explosividad (saltos / pliometría)"],
  extra: []
};

function uid() { return Math.random().toString(36).slice(2, 10); }
function emptySets(n=3) { return Array.from({length:n}, () => ({reps:"", weight:""})); }
function makeExercise(name) { return { id: uid(), name, sets: emptySets(), prevSets: [] }; }
function makeDefaultDay(key) { return { weekStamp: null, exercises: DEFAULTS[key].map(makeExercise) }; }

function loadDay(key) {
  try {
    const raw = localStorage.getItem("rutina-" + key);
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return makeDefaultDay(key);
}
function saveDay(key, data) {
  try { localStorage.setItem("rutina-" + key, JSON.stringify(data)); } catch(e) {}
}

let state = {};
DAYS.forEach(d => state[d.key] = loadDay(d.key));
let activeDay = "push";

function weekLabel(iso) {
  if (!iso) return "Sin registrar aún";
  const d = new Date(iso);
  return "Semana del " + d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

function delta(cur, prev) {
  const cw = parseFloat(cur.weight), pw = parseFloat(prev && prev.weight);
  if (isNaN(cw) || isNaN(pw)) return null;
  if (cw > pw) return "up";
  if (cw < pw) return "down";
  return "same";
}

const ICONS = {
  up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 15l-6-6-6 6"/></svg>',
  down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 9l6 6 6-6"/></svg>',
  same: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12h14"/></svg>',
  trash: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>',
  minus: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12h14"/></svg>',
  plus: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 5v14M5 12h14"/></svg>',
  plusBig: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 5v14M5 12h14"/></svg>',
};

function render() {
  const tabsEl = document.getElementById("tabs");
  tabsEl.innerHTML = DAYS.map(d =>
    `<button class="tab ${d.key===activeDay?'active':''}" data-day="${d.key}">${d.label}</button>`
  ).join("");
  tabsEl.querySelectorAll(".tab").forEach(btn => {
    btn.onclick = () => { activeDay = btn.dataset.day; render(); };
  });

  const day = state[activeDay];
  document.getElementById("weekLabel").textContent = weekLabel(day.weekStamp);

  const content = document.getElementById("content");
  content.innerHTML = "";

  if (day.exercises.length === 0) {
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = "Sin ejercicios todavía. Añade el primero abajo.";
    content.appendChild(p);
  }

  day.exercises.forEach(ex => {
    const card = document.createElement("div");
    card.className = "card";

    const head = document.createElement("div");
    head.className = "card-head";
    head.innerHTML = `<h2>${ex.name}</h2>`;
    const delBtn = document.createElement("button");
    delBtn.className = "icon-btn";
    delBtn.innerHTML = ICONS.trash;
    delBtn.onclick = () => {
      if (confirm(`¿Quitar "${ex.name}" de este día?`)) {
        day.exercises = day.exercises.filter(e => e.id !== ex.id);
        saveDay(activeDay, day);
        render();
      }
    };
    head.appendChild(delBtn);
    card.appendChild(head);

    ex.sets.forEach((set, i) => {
      const prev = ex.prevSets[i];
      const d = delta(set, prev);
      const row = document.createElement("div");
      row.className = "set-row";

      const label = document.createElement("span");
      label.className = "set-label mono";
      label.textContent = "S" + (i+1);
      row.appendChild(label);

      const repsInput = document.createElement("input");
      repsInput.type = "number"; repsInput.inputMode = "numeric";
      repsInput.className = "inp-reps mono"; repsInput.placeholder = "reps";
      repsInput.value = set.reps;
      repsInput.oninput = (e) => { set.reps = e.target.value; saveDay(activeDay, day); };
      row.appendChild(repsInput);

      const xEl = document.createElement("span"); xEl.className = "x"; xEl.textContent = "x";
      row.appendChild(xEl);

      const weightInput = document.createElement("input");
      weightInput.type = "number"; weightInput.inputMode = "decimal";
      weightInput.className = "inp-weight mono"; weightInput.placeholder = "kg";
      weightInput.value = set.weight;
      weightInput.oninput = (e) => { set.weight = e.target.value; saveDay(activeDay, day); render(); };
      row.appendChild(weightInput);

      const unit = document.createElement("span"); unit.className = "unit"; unit.textContent = "kg";
      row.appendChild(unit);

      const deltaEl = document.createElement("span");
      deltaEl.className = "delta " + (d || "");
      if (d) deltaEl.innerHTML = ICONS[d];
      row.appendChild(deltaEl);

      const spacer = document.createElement("div"); spacer.className = "spacer";
      row.appendChild(spacer);

      if (prev) {
        const prevText = document.createElement("span");
        prevText.className = "prev-text mono";
        prevText.textContent = `ant. ${prev.reps || "–"}x${prev.weight || "–"}`;
        row.appendChild(prevText);
      }

      const rmBtn = document.createElement("button");
      rmBtn.className = "icon-btn";
      rmBtn.innerHTML = ICONS.minus;
      rmBtn.onclick = () => {
        ex.sets = ex.sets.filter((_, idx) => idx !== i);
        saveDay(activeDay, day);
        render();
      };
      row.appendChild(rmBtn);

      card.appendChild(row);
    });

    const addSetBtn = document.createElement("button");
    addSetBtn.className = "add-set";
    addSetBtn.innerHTML = ICONS.plus + " Serie";
    addSetBtn.onclick = () => {
      ex.sets.push({ reps: "", weight: "" });
      saveDay(activeDay, day);
      render();
    };
    card.appendChild(addSetBtn);

    content.appendChild(card);
  });

  const addExWrap = document.createElement("div");
  addExWrap.className = "add-ex";
  const addExInput = document.createElement("input");
  addExInput.type = "text";
  addExInput.placeholder = "Nuevo ejercicio...";
  addExWrap.appendChild(addExInput);
  const addExBtn = document.createElement("button");
  addExBtn.innerHTML = ICONS.plusBig;
  const doAdd = () => {
    const name = addExInput.value.trim();
    if (!name) return;
    day.exercises.push(makeExercise(name));
    saveDay(activeDay, day);
    render();
  };
  addExBtn.onclick = doAdd;
  addExInput.onkeydown = (e) => { if (e.key === "Enter") doAdd(); };
  addExWrap.appendChild(addExBtn);
  content.appendChild(addExWrap);
}

document.getElementById("newWeekBtn").onclick = () => {
  const day = state[activeDay];
  day.weekStamp = new Date().toISOString();
  day.exercises.forEach(ex => {
    ex.prevSets = ex.sets.map(s => ({ ...s }));
  });
  saveDay(activeDay, day);
  render();
  const toast = document.getElementById("toast");
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2000);
};

render();