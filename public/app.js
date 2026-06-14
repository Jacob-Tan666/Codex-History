const state = {
  allItems: [],
  currentSource: "all",
  selectedId: "",
  visibleItems: [],
};

const els = {
  archiveButton: document.getElementById("archiveButton"),
  codexHome: document.getElementById("codexHome"),
  deleteButton: document.getElementById("deleteButton"),
  detailFile: document.getElementById("detailFile"),
  detailMeta: document.getElementById("detailMeta"),
  detailSource: document.getElementById("detailSource"),
  detailTitle: document.getElementById("detailTitle"),
  detailView: document.getElementById("detailView"),
  emptyState: document.getElementById("emptyState"),
  exportButton: document.getElementById("exportButton"),
  limitInput: document.getElementById("limitInput"),
  listSubtitle: document.getElementById("listSubtitle"),
  messageList: document.getElementById("messageList"),
  recoverButton: document.getElementById("recoverButton"),
  refreshButton: document.getElementById("refreshButton"),
  searchInput: document.getElementById("searchInput"),
  sessionList: document.getElementById("sessionList"),
  toast: document.getElementById("toast"),
  totalCount: document.getElementById("totalCount"),
  visibleCount: document.getElementById("visibleCount"),
};

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    els.toast.classList.remove("is-visible");
  }, 2800);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const message = payload && payload.error ? payload.error.message : "请求失败";
    throw new Error(message);
  }
  return payload;
}

function getSearchText(item) {
  return [item.title, item.sessionId, item.filePath, item.source]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function renderList() {
  const query = els.searchInput.value.trim().toLowerCase();
  state.visibleItems = query
    ? state.allItems.filter((item) => getSearchText(item).includes(query))
    : state.allItems.slice();

  els.visibleCount.textContent = String(state.visibleItems.length);
  els.listSubtitle.textContent =
    state.visibleItems.length === 0
      ? "没有匹配会话"
      : `显示 ${state.visibleItems.length} 条会话`;

  if (state.visibleItems.length === 0) {
    els.sessionList.innerHTML = '<div class="detail-file">没有找到匹配的会话。</div>';
    return;
  }

  els.sessionList.innerHTML = state.visibleItems
    .map((item) => {
      const isActive = item.sessionId === state.selectedId ? " is-active" : "";
      const badgeClass = item.source === "archived" ? " archived" : "";
      return `
        <button class="session-card${isActive}" type="button" data-session-id="${escapeHtml(item.sessionId)}">
          <div class="card-top">
            <div class="session-title">${escapeHtml(item.title || item.sessionId)}</div>
            <span class="badge${badgeClass}">${escapeHtml(item.source || "unknown")}</span>
          </div>
          <div class="session-meta">
            <span>${escapeHtml(item.timeText || "无时间")}</span>
            <span>${escapeHtml(item.sessionId)}</span>
          </div>
        </button>
      `;
    })
    .join("");
}

function setSource(source) {
  state.currentSource = source;
  document.querySelectorAll(".segmented button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.source === source);
  });
  loadSessions();
}

async function loadSessions() {
  const limit = encodeURIComponent(els.limitInput.value || "200");
  const source = encodeURIComponent(state.currentSource);
  els.listSubtitle.textContent = "正在加载";
  try {
    const payload = await api(`/api/sessions?source=${source}&limit=${limit}`);
    state.allItems = payload.items || [];
    els.totalCount.textContent = String(payload.total || 0);
    els.codexHome.textContent = payload.codexHome ? `CODEX_HOME: ${payload.codexHome}` : "";
    renderList();
    if (state.selectedId && !state.allItems.some((item) => item.sessionId === state.selectedId)) {
      clearDetail();
    }
  } catch (error) {
    showToast(error.message);
    els.listSubtitle.textContent = "加载失败";
  }
}

function clearDetail() {
  state.selectedId = "";
  els.detailView.classList.add("is-hidden");
  els.emptyState.classList.remove("is-hidden");
  renderList();
}

function renderMessages(messages) {
  if (!messages || messages.length === 0) {
    els.messageList.innerHTML = '<div class="detail-file">暂无可预览消息。</div>';
    return;
  }

  els.messageList.innerHTML = messages
    .map((message, index) => {
      const role = message.role === "user" ? "用户" : message.role === "assistant" ? "助手" : "系统";
      return `
        <section class="message">
          <div class="message-head">
            <span class="role">${index + 1}. ${escapeHtml(role)}</span>
            <span class="message-time">${escapeHtml(message.timestamp || "")}</span>
          </div>
          <pre class="message-body">${escapeHtml(message.text || "")}</pre>
        </section>
      `;
    })
    .join("");
}

async function selectSession(sessionId) {
  state.selectedId = sessionId;
  renderList();
  try {
    const payload = await api(`/api/session?sessionId=${encodeURIComponent(sessionId)}&source=all`);
    const isArchived = payload.source === "archived";
    els.emptyState.classList.add("is-hidden");
    els.detailView.classList.remove("is-hidden");
    els.detailTitle.textContent = payload.title || payload.sessionId;
    els.detailMeta.textContent = `${payload.timeText || "无时间"} · ${payload.sessionId}`;
    els.detailFile.textContent = payload.filePath || "";
    els.detailSource.textContent = payload.source || "unknown";
    els.detailSource.classList.toggle("archived", isArchived);
    els.archiveButton.disabled = isArchived;
    els.recoverButton.disabled = !isArchived;
    renderMessages(payload.messages || []);
  } catch (error) {
    showToast(error.message);
    clearDetail();
  }
}

async function postAction(path, body, successMessage) {
  try {
    await api(path, {
      body: JSON.stringify(body),
      method: "POST",
    });
    showToast(successMessage);
    await loadSessions();
    if (body.sessionId && path !== "/api/delete") {
      await selectSession(body.sessionId);
    } else {
      clearDetail();
    }
  } catch (error) {
    showToast(error.message);
  }
}

async function exportSelected() {
  if (!state.selectedId) {
    return;
  }
  const safeName = state.selectedId.replace(/[^a-z0-9._-]/gi, "_");
  const outputPath = window.prompt("导出到项目内相对路径", `exports/${safeName}.md`);
  if (!outputPath) {
    return;
  }
  await postAction("/api/export", { outputPath, sessionId: state.selectedId }, `已导出到 ${outputPath}`);
}

function archiveSelected() {
  if (!state.selectedId) {
    return;
  }
  postAction("/api/archive", { sessionId: state.selectedId }, "已归档");
}

function recoverSelected() {
  if (!state.selectedId) {
    return;
  }
  postAction("/api/recover", { sessionId: state.selectedId }, "已恢复");
}

function deleteSelected() {
  if (!state.selectedId) {
    return;
  }
  const confirmed = window.confirm("删除会物理移除会话文件且不可恢复。确定继续？");
  if (!confirmed) {
    return;
  }
  postAction("/api/delete", { force: true, sessionId: state.selectedId }, "已删除");
}

document.querySelectorAll(".segmented button").forEach((button) => {
  button.addEventListener("click", () => setSource(button.dataset.source));
});

els.sessionList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-session-id]");
  if (button) {
    selectSession(button.dataset.sessionId);
  }
});

els.searchInput.addEventListener("input", renderList);
els.limitInput.addEventListener("change", loadSessions);
els.refreshButton.addEventListener("click", loadSessions);
els.exportButton.addEventListener("click", exportSelected);
els.archiveButton.addEventListener("click", archiveSelected);
els.recoverButton.addEventListener("click", recoverSelected);
els.deleteButton.addEventListener("click", deleteSelected);

loadSessions();
