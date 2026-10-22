"use strict";
(() => {
  const $ = (id) => document.getElementById(id);
  const kinds = ["areas", "competencies", "routines", "goals", "tasks"];
  const emptyData = () => Object.fromEntries(kinds.map((key) => [key, []]));
  const clearFilters = () => ({ search: "", status: "all", area: "", routine: "", goal: "" });
  const state = { user: null, data: emptyData(), view: "overview", register: false, csrf: null, editing: null, epoch: 0, busy: false, filters: clearFilters() };
  let toastTimer;
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const dateLabel = (date, year = false) => date ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", ...(year ? { year: "numeric" } : {}) }).format(new Date(`${date}T12:00:00`)) : "";
  const record = (kind, id) => state.data[kind].find((item) => item.id === id);
  const nameOf = (kind, id) => { const item = record(kind, id); return item?.name ?? item?.title ?? ""; };
  function message(id, value) { $(id).textContent = value || ""; $(id).hidden = !value; }
  function toast(value) { clearTimeout(toastTimer); message("toast", value); toastTimer = setTimeout(() => message("toast", ""), 4500); }
  async function csrf() {
    const response = await fetch("/api/auth/csrf", { credentials: "same-origin", cache: "no-store" });
    if (!response.ok) throw new Error("Não foi possível conectar. Tente atualizar a página.");
    state.csrf = await response.json();
  }
  async function api(path, { method = "GET", body, form = false } = {}) {
    const headers = { Accept: "application/json" };
    if (method !== "GET") { if (!state.csrf) await csrf(); headers[state.csrf.headerName] = state.csrf.token; }
    if (body !== undefined) headers["Content-Type"] = form ? "application/x-www-form-urlencoded" : "application/json";
    let response;
    try {
      response = await fetch(`/api${path}`, { method, headers, credentials: "same-origin", cache: "no-store", body: body === undefined ? undefined : form ? new URLSearchParams(body).toString() : JSON.stringify(body) });
    } catch { throw new Error("Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente."); }
    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      if (response.status === 401 && state.user) showAuth();
      if (response.status === 403) state.csrf = null;
      const error = new Error(detail.error || "Não foi possível concluir a solicitação."); error.status = response.status; throw error;
    }
    return response.status === 204 ? null : response.json();
  }
  function setAuthMode(register) {
    state.register = register;
    $("login-tab").classList.toggle("selected", !register); $("register-tab").classList.toggle("selected", register);
    $("name-field").hidden = $("confirmation-field").hidden = $("password-help").hidden = !register;
    const form = $("auth-form"); form.elements.name.required = form.elements.confirmation.required = register;
    form.elements.password.minLength = register ? 8 : 1; form.elements.password.autocomplete = register ? "new-password" : "current-password";
    $("auth-title").textContent = register ? "Seu espaço começa aqui." : "Vamos continuar?";
    $("auth-subtitle").textContent = register ? "Crie sua conta para organizar o próximo passo." : "Entre para organizar o seu dia.";
    $("auth-submit").textContent = register ? "Criar minha conta →" : "Entrar na minha central →"; message("auth-error", "");
  }
  function showAuth() {
    state.epoch++; state.user = null; state.csrf = null; state.data = emptyData(); state.editing = null;
    $("editor").close(); $("editor-form").reset(); $("editor-fields").replaceChildren(); $("content").replaceChildren();
    $("account-name").textContent = $("account-email").textContent = ""; message("toast", "");
    $("workspace").hidden = $("boot").hidden = true; $("auth").hidden = false; setAuthMode(false);
  }
  function showWorkspace(user) {
    state.user = user; $("account-name").textContent = user.name; $("account-email").textContent = user.email;
    $("avatar").textContent = user.name.trim().slice(0, 1).toUpperCase();
    $("today-label").textContent = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "numeric", month: "long" }).format(new Date());
    $("auth").hidden = $("boot").hidden = true; $("workspace").hidden = false; state.view = "overview"; state.filters = clearFilters(); render();
  }
  async function loadData() {
    const epoch = state.epoch; $("loading").hidden = false; $("refresh").disabled = true;
    try {
      const values = await Promise.all(kinds.map((kind) => api(`/${kind}`)));
      if (epoch !== state.epoch || !state.user) return;
      state.data = Object.fromEntries(kinds.map((key, index) => [key, values[index]])); render();
    } finally { $("loading").hidden = true; $("refresh").disabled = false; }
  }
  function pageError(error) { message(state.user ? "page-error" : "auth-error", error.message); }
  function navigate(view) { state.view = view; message("page-error", ""); render(); $("main").focus(); }
  function empty(title, description, kind) {
    return `<div class="empty"><div class="empty-symbol" aria-hidden="true">◇</div><h3>${esc(title)}</h3><p>${esc(description)}</p>${kind ? `<button class="button secondary" data-new="${kind}">+ Criar agora</button>` : ""}</div>`;
  }
  function taskRows(items) {
    if (!items.length) return empty("Tudo tranquilo por aqui", "Nenhuma tarefa nesta seleção. Você pode criar uma tarefa ou ajustar os filtros.", "tasks");
    return items.map((task) => `<article class="task-row"><button class="task-toggle ${task.completed ? "completed" : ""}" data-complete="${esc(task.id)}" aria-label="${task.completed ? "Reabrir" : "Concluir"} tarefa: ${esc(task.title)}" aria-pressed="${task.completed}">${task.completed ? "✓" : ""}</button>
      <div class="task-main ${task.completed ? "completed" : ""}"><h3>${esc(task.title)}</h3><div class="task-meta"><span>${esc(dateLabel(task.taskDate))}${task.taskTime ? ` · ${esc(task.taskTime.slice(0, 5))}` : ""}</span><span class="tag">${esc(nameOf("areas", task.areaId))}</span><span class="tag purple">${esc(task.priority)}</span>
      ${task.competencyIds.map((id) => `<span class="tag">${esc(nameOf("competencies", id))}</span>`).join("")}${task.routineId ? `<span>↻ ${esc(nameOf("routines", task.routineId))}</span>` : ""}${task.goalId ? `<span>◎ ${esc(nameOf("goals", task.goalId))}</span>` : ""}</div></div>
      <div class="task-actions"><button class="icon-button" data-edit="tasks" data-id="${esc(task.id)}" aria-label="Editar ${esc(task.title)}">Editar</button><button class="icon-button danger" data-delete="tasks" data-id="${esc(task.id)}" aria-label="Excluir ${esc(task.title)}">×</button></div></article>`).join("");
  }
  const orderedTasks = (items) => [...items].sort((a, b) => Number(a.completed) - Number(b.completed) || a.taskDate.localeCompare(b.taskDate) || (a.taskTime || "23:59:59").localeCompare(b.taskTime || "23:59:59"));
  function overview() {
    const today = localDate(); const tasks = state.data.tasks; const todayTasks = orderedTasks(tasks.filter((task) => task.taskDate === today));
    const completedToday = tasks.filter((task) => task.completedAt && localDate(new Date(task.completedAt)) === today).length;
    const stats = [["Pendentes hoje", todayTasks.filter((task) => !task.completed).length, "Tarefas com data de hoje", "☑"], ["Concluídas hoje", completedToday, "Pela data da conclusão", "✓"], ["Suas áreas", state.data.areas.length, "Espaços que você personalizou", "◇"], ["Metas cadastradas", state.data.goals.length, "Resultados que quer alcançar", "◎"]];
    return `<div class="stats-grid">${stats.map(([label, value, note, icon]) => `<article class="stat"><div class="stat-top"><span>${label}</span><span class="stat-icon" aria-hidden="true">${icon}</span></div><strong>${value}</strong><small>${note}</small></article>`).join("")}</div>
      <div class="dashboard-grid"><section class="panel"><div class="panel-heading"><div><h2>Seu dia em movimento</h2><p>As tarefas que você planejou para hoje</p></div><button class="text-button" data-nav="tasks">Ver todas →</button></div><div class="task-list">${taskRows(todayTasks)}</div></section>
      <div class="stack"><section class="panel focus-panel"><p class="eyebrow">UM PASSO POSSÍVEL</p><h2>O que merece sua atenção hoje?</h2><p class="muted">Uma tarefa conecta sua intenção a uma ação. Escolha uma área e as competências que você quer desenvolver.</p><button class="button secondary" data-new="tasks">+ Planejar uma tarefa</button></section>
      <section class="panel"><div class="panel-heading"><div><h2>Seu espaço, do seu jeito</h2><p>Comece pelas áreas e competências</p></div></div><div class="panel-body"><p class="muted">${state.data.competencies.length} competências · ${state.data.routines.length} rotinas</p><button class="text-button" data-nav="categories">Organizar meu espaço →</button></div></section></div></div>`;
  }
  function taskPage() {
    return `<div class="filters"><input id="task-search" type="search" aria-label="Buscar tarefas" placeholder="Buscar uma tarefa…" value="${esc(state.filters.search)}"><select id="task-status" aria-label="Filtrar por conclusão">${[["all", "Todas as tarefas"], ["pending", "Pendentes"], ["completed", "Concluídas"]].map(([v, label]) => `<option value="${v}" ${state.filters.status === v ? "selected" : ""}>${label}</option>`).join("")}</select><select id="task-area" aria-label="Filtrar por área"><option value="">Todas as áreas</option>${state.data.areas.map((area) => `<option value="${esc(area.id)}" ${state.filters.area === area.id ? "selected" : ""}>${esc(area.name)}</option>`).join("")}</select></div>
      ${state.filters.routine || state.filters.goal ? `<div class="notice">${state.filters.routine ? `Rotina: ${esc(nameOf("routines", state.filters.routine))}` : `Meta: ${esc(nameOf("goals", state.filters.goal))}`} <button class="text-button" data-clear-link>Limpar filtro</button></div>` : ""}<section class="panel"><div id="task-results" class="task-list"></div></section>`;
  }
  function renderTaskResults() {
    if (!$("task-results")) return; const f = state.filters; const query = f.search.toLocaleLowerCase("pt-BR");
    const items = state.data.tasks.filter((task) => (!query || `${task.title} ${task.description || ""}`.toLocaleLowerCase("pt-BR").includes(query)) && (f.status === "all" || task.completed === (f.status === "completed")) && (!f.area || task.areaId === f.area) && (!f.routine || task.routineId === f.routine) && (!f.goal || task.goalId === f.goal));
    $("task-results").innerHTML = taskRows(orderedTasks(items));
  }
  function entityCards(kind) {
    const isGoal = kind === "goals"; const items = state.data[kind];
    const notice = isGoal ? "Defina o resultado desejado e seu período. O cálculo de progresso das metas aguarda definição." : "Agrupe atividades recorrentes e organize suas tarefas por data e horário. A geração automática de novas ocorrências aguarda definição.";
    return `<div class="notice">${notice}</div>${items.length ? `<div class="cards">${items.map((item) => {
      const count = state.data.tasks.filter((task) => task[isGoal ? "goalId" : "routineId"] === item.id).length;
      return `<article class="panel entity-card"><span class="eyebrow">${isGoal ? `${esc(dateLabel(item.startDate, true))} — ${esc(dateLabel(item.endDate, true))}` : "ROTINA"}</span><h3>${esc(item.title || item.name)}</h3><p class="muted">${esc(item.description || "Adicione uma descrição para dar contexto às suas tarefas.")}</p><button class="text-button" data-linked="${kind}" data-id="${esc(item.id)}">Ver ${count} tarefas →</button><div class="card-actions"><small>${count} tarefas vinculadas</small><div><button class="button secondary" data-edit="${kind}" data-id="${esc(item.id)}">Editar</button> <button class="button secondary danger" data-delete="${kind}" data-id="${esc(item.id)}">Excluir</button></div></div></article>`;
    }).join("")}</div>` : `<section class="panel">${empty(isGoal ? "Dê um destino aos seus planos" : "Crie espaço para a constância", isGoal ? "Uma meta representa um resultado que você deseja alcançar dentro de um período." : "Uma rotina reúne atividades recorrentes que fazem parte da sua vida.", kind)}</section>`}`;
  }
  function categories() {
    return `<div class="category-grid">${[["areas", "Áreas", "Crie áreas que façam sentido para sua vida."], ["competencies", "Competências", "Uma tarefa pode desenvolver várias competências."]].map(([kind, label, note]) => `<section class="panel"><div class="panel-heading"><div><h2>${label}</h2><p>${note}</p></div><button class="text-button" data-new="${kind}">+ Criar</button></div><div class="panel-body">${state.data[kind].length ? state.data[kind].map((item) => `<div class="category-row"><b class="category-mark" aria-hidden="true">◇</b><span>${esc(item.name)}</span><button class="text-button" data-edit="${kind}" data-id="${esc(item.id)}" aria-label="Editar ${esc(item.name)}">Editar</button><button class="icon-button danger" data-delete="${kind}" data-id="${esc(item.id)}" aria-label="Excluir ${esc(item.name)}">×</button></div>`).join("") : empty(`Suas ${label.toLowerCase()}`, note, kind)}</div></section>`).join("")}</div>`;
  }
  function evolution() {
    return `<div class="cards">${[["Métricas de evolução", "As fórmulas de produtividade, disciplina e consistência ainda aguardam aprovação. A visão geral mostra apenas contagens dos seus registros."], ["Gamificação", "As mecânicas de pontos, níveis e conquistas ainda aguardam definição. Nenhuma pontuação é atribuída às suas atividades."], ["Assistência com IA", "A integração com inteligência artificial está prevista para uma etapa posterior ao funcionamento do núcleo."]].map(([title, text]) => `<section class="panel coming-card"><span class="coming-label">ETAPA FUTURA</span><h2>${title}</h2><p class="muted">${text}</p></section>`).join("")}</div>`;
  }
  function render() {
    if (!state.user) return;
    const pages = {
      overview: [`Olá, ${state.user.name.trim().split(/\s+/)[0]}.`, "Um espaço para organizar seu dia e construir o próximo passo.", "Nova tarefa", "tasks", overview],
      tasks: ["Minhas tarefas", "Dê clareza ao que precisa acontecer e às competências que quer desenvolver.", "Nova tarefa", "tasks", taskPage],
      routines: ["Rotinas", "Organize as atividades que fazem parte da sua vida.", "Nova rotina", "routines", () => entityCards("routines")],
      goals: ["Metas", "Transforme o que você deseja em um resultado com período definido.", "Nova meta", "goals", () => entityCards("goals")],
      categories: ["Áreas e competências", "Personalize seu espaço e conecte cada tarefa ao que importa.", "Nova área", "areas", categories],
      evolution: ["Evolução", "O que está previsto para os próximos capítulos do J.A.R.V.I.S.", "", "", evolution]
    };
    const [title, description, action, kind, renderer] = pages[state.view];
    $("page-title").textContent = title; $("page-description").textContent = description; $("primary-action").hidden = !action;
    $("primary-action").textContent = `+ ${action}`; $("primary-action").dataset.new = kind;
    $("task-nav-count").textContent = state.data.tasks.filter((task) => !task.completed).length;
    document.querySelectorAll("[data-view]").forEach((button) => { button.classList.toggle("active", button.dataset.view === state.view); if (button.dataset.view === state.view) button.setAttribute("aria-current", "page"); else button.removeAttribute("aria-current"); });
    $("content").innerHTML = renderer(); if (state.view === "tasks") renderTaskResults();
  }
  function field(label, name, value, { type = "text", max = 150, required = true } = {}) {
    return `<label>${label}${!required ? ' <span class="optional">opcional</span>' : ""}<input name="${name}" type="${type}" value="${esc(value)}" ${required ? "required" : ""} ${type === "text" ? `maxlength="${max}"` : ""}></label>`;
  }
  function select(label, name, kind, value, required = false) {
    return `<label>${label}${!required ? ' <span class="optional">opcional</span>' : ""}<select name="${name}" ${required ? "required" : ""}><option value="">${required ? "Selecione" : "Sem vínculo"}</option>${state.data[kind].map((item) => `<option value="${esc(item.id)}" ${item.id === value ? "selected" : ""}>${esc(item.name || item.title)}</option>`).join("")}</select></label>`;
  }
  function openEditor(kind, id) {
    if (state.busy) return;
    if (kind === "tasks" && (!state.data.areas.length || !state.data.competencies.length)) { navigate("categories"); message("page-error", "Crie pelo menos uma área e uma competência antes de cadastrar sua primeira tarefa."); return; }
    const item = id ? record(kind, id) : {}; if (!item) return;
    state.editing = { kind, id, version: item.version };
    $("editor-title").textContent = `${id ? "Editar" : "Criar"} ${{ tasks: "tarefa", areas: "área", competencies: "competência", routines: "rotina", goals: "meta" }[kind]}`;
    let fields = "";
    if (kind === "areas" || kind === "competencies") fields = field("Nome", "name", item.name, { max: 100 });
    else {
      fields = field(kind === "routines" ? "Nome" : "Título", kind === "routines" ? "name" : "title", item.name || item.title, { max: kind === "tasks" ? 200 : 150 });
      fields += `<label>Descrição <span class="optional">opcional</span><textarea name="description" maxlength="10000">${esc(item.description)}</textarea></label>`;
      if (kind === "goals") fields += `<div class="form-row">${field("Início do período", "startDate", item.startDate || localDate(), { type: "date" })}${field("Fim do período", "endDate", item.endDate || localDate(), { type: "date" })}</div>`;
      if (kind === "tasks") {
        fields += `<div class="form-row">${field("Data", "taskDate", item.taskDate || localDate(), { type: "date" })}${field("Horário", "taskTime", item.taskTime?.slice(0, 5), { type: "time", required: false })}</div><div class="form-row">${field("Prioridade", "priority", item.priority, { max: 30 })}${select("Área", "areaId", "areas", item.areaId, true)}</div>`;
        fields += `<fieldset class="competencies-picker"><legend>Competências · selecione uma ou mais</legend>${state.data.competencies.map((competency) => `<label><input type="checkbox" name="competencyIds" value="${esc(competency.id)}" ${item.competencyIds?.includes(competency.id) ? "checked" : ""}>${esc(competency.name)}</label>`).join("")}</fieldset><div class="form-row">${select("Rotina", "routineId", "routines", item.routineId)}${select("Meta", "goalId", "goals", item.goalId)}</div>`;
      }
    }
    $("editor-fields").innerHTML = fields; message("editor-error", ""); $("editor").showModal();
  }
  async function saveEditor(event) {
    event.preventDefault(); if (state.busy || !state.editing) return;
    const { kind, id, version } = state.editing; const data = new FormData(event.currentTarget); const body = Object.fromEntries(data);
    if ("description" in body) body.description = body.description.trim() || null;
    if (kind === "tasks") {
      body.competencyIds = data.getAll("competencyIds"); if (!body.competencyIds.length) { message("editor-error", "Selecione pelo menos uma competência."); return; }
      for (const key of ["taskTime", "routineId", "goalId"]) body[key] = body[key] || null;
    }
    if (kind === "goals" && body.endDate < body.startDate) { message("editor-error", "O fim do período deve ser igual ou posterior ao início."); return; }
    if (id) body.version = version; state.busy = true; $("save-editor").disabled = true;
    try { await api(`/${kind}${id ? `/${id}` : ""}`, { method: id ? "PUT" : "POST", body }); $("editor").close(); state.editing = null; toast("Registro salvo."); await loadData(); message("page-error", ""); }
    catch (error) { if ($("editor").open) message("editor-error", error.message + (error.status === 409 ? " Feche esta janela e atualize os registros antes de tentar novamente." : "")); else pageError(error); }
    finally { state.busy = false; $("save-editor").disabled = false; }
  }
  async function taskCompletion(id) {
    const task = record("tasks", id); if (!task || state.busy) return; state.busy = true;
    try { await api(`/tasks/${id}/completion`, { method: "PATCH", body: { completed: !task.completed, version: task.version } }); await loadData(); toast(task.completed ? "Tarefa reaberta." : "Tarefa concluída."); message("page-error", ""); }
    catch (error) { pageError(error); if (error.status === 409) await loadData().catch(pageError); }
    finally { state.busy = false; }
  }
  async function remove(kind, id) {
    const item = record(kind, id); if (!item || state.busy) return;
    if (!window.confirm(`Excluir “${item.name || item.title}”? Esta ação não pode ser desfeita.`)) return;
    state.busy = true;
    try { await api(`/${kind}/${id}?version=${encodeURIComponent(item.version)}`, { method: "DELETE" }); await loadData(); toast("Registro excluído."); message("page-error", ""); }
    catch (error) { pageError(error); } finally { state.busy = false; }
  }
  document.addEventListener("click", (event) => {
    const button = event.target.closest("button"); if (!button) return;
    if (button.dataset.view) navigate(button.dataset.view); if (button.dataset.nav) navigate(button.dataset.nav);
    if (button.dataset.new) openEditor(button.dataset.new); if (button.dataset.edit) openEditor(button.dataset.edit, button.dataset.id);
    if (button.dataset.delete) void remove(button.dataset.delete, button.dataset.id); if (button.dataset.complete) void taskCompletion(button.dataset.complete);
    if (button.dataset.linked) { state.filters = clearFilters(); state.filters[button.dataset.linked === "goals" ? "goal" : "routine"] = button.dataset.id; navigate("tasks"); }
    if (button.hasAttribute("data-clear-link")) { state.filters.routine = state.filters.goal = ""; render(); }
  });
  $("content").addEventListener("input", (event) => { const key = { "task-search": "search", "task-status": "status", "task-area": "area" }[event.target.id]; if (key) { state.filters[key] = event.target.value; renderTaskResults(); } });
  $("login-tab").addEventListener("click", () => setAuthMode(false)); $("register-tab").addEventListener("click", () => setAuthMode(true));
  $("auth-form").addEventListener("submit", async (event) => {
    event.preventDefault(); if (state.busy) return; const values = Object.fromEntries(new FormData(event.currentTarget));
    if (state.register && values.password !== values.confirmation) { message("auth-error", "A confirmação deve ser igual à senha."); return; }
    if (state.register && new TextEncoder().encode(values.password).length > 72) { message("auth-error", "A senha ultrapassa o limite de 72 bytes. Use uma senha um pouco mais curta."); return; }
    state.busy = true; $("auth-submit").disabled = true; message("auth-error", "");
    try {
      if (state.register) { await api("/auth/register", { method: "POST", body: values }); setAuthMode(false); }
      await api("/auth/login", { method: "POST", body: { email: values.email, password: values.password }, form: true });
      event.target.reset(); state.csrf = null; await csrf(); showWorkspace(await api("/auth/me")); await loadData();
    } catch (error) { pageError(error); } finally { state.busy = false; $("auth-submit").disabled = false; }
  });
  $("logout").addEventListener("click", async () => {
    if (state.busy) return; state.busy = true;
    try { await api("/auth/logout", { method: "POST" }); showAuth(); await csrf(); } catch (error) { pageError(error); } finally { state.busy = false; }
  });
  $("refresh").addEventListener("click", () => { message("page-error", ""); void loadData().catch(pageError); });
  $("editor-form").addEventListener("submit", saveEditor);
  for (const id of ["close-editor", "cancel-editor"]) $(id).addEventListener("click", () => { if (!state.busy) $("editor").close(); });
  $("editor").addEventListener("cancel", (event) => { if (state.busy) event.preventDefault(); });
  async function start() {
    try { await csrf(); showWorkspace(await api("/auth/me")); await loadData(); }
    catch (error) { if (!state.user) showAuth(); if (error.status !== 401) pageError(error); }
  }
  void start();
})();
