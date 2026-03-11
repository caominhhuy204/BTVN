const API_AUTH = "http://localhost:8080/api/auth";
const API_FILES = "http://localhost:8080/api/files";
const TOKEN_KEY = "btvn.authToken";
const USERNAME_KEY = "btvn.username";

const authSection = document.getElementById("authSection");
const dashboardSection = document.getElementById("dashboardSection");
const currentUserText = document.getElementById("currentUserText");

const showLoginBtn = document.getElementById("showLoginBtn");
const showRegisterBtn = document.getElementById("showRegisterBtn");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const authMessage = document.getElementById("authMessage");

const uploadForm = document.getElementById("uploadForm");
const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");
const selectedFile = document.getElementById("selectedFile");
const uploadMessage = document.getElementById("uploadMessage");
const refreshBtn = document.getElementById("refreshBtn");
const logoutBtn = document.getElementById("logoutBtn");
const searchInput = document.getElementById("searchInput");
const totalFiles = document.getElementById("totalFiles");
const shownFiles = document.getElementById("shownFiles");
const fileTableBody = document.getElementById("fileTableBody");

const state = {
  files: [],
  query: "",
  authLoading: false,
  listLoading: false,
  uploading: false
};

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

function setSession(token, username) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USERNAME_KEY, username || "");
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
}

function authHeaders(extra = {}) {
  return {
    ...extra,
    Authorization: `Bearer ${getToken()}`
  };
}

function setAuthMessage(text, type = "") {
  authMessage.textContent = text;
  authMessage.className = `message ${type}`.trim();
}

function setMessage(text, type = "") {
  uploadMessage.textContent = text;
  uploadMessage.className = `message ${type}`.trim();
}

function showLoginMode() {
  loginForm.classList.remove("hidden");
  registerForm.classList.add("hidden");
  showLoginBtn.classList.add("is-active");
  showRegisterBtn.classList.remove("is-active");
  setAuthMessage("");
}

function showRegisterMode() {
  registerForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
  showRegisterBtn.classList.add("is-active");
  showLoginBtn.classList.remove("is-active");
  setAuthMessage("");
}

function showDashboard(username) {
  authSection.classList.add("hidden");
  dashboardSection.classList.remove("hidden");
  currentUserText.textContent = `Xin chao, ${username}`;
}

function showAuthScreen() {
  dashboardSection.classList.add("hidden");
  authSection.classList.remove("hidden");
  state.files = [];
  renderTable();
  totalFiles.textContent = "0";
  shownFiles.textContent = "0";
  setMessage("");
}

function formatBytes(bytes) {
  if (bytes == null || Number.isNaN(bytes)) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("vi-VN");
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#039;");
}

function getFileExtension(filename) {
  if (!filename) return "";
  const parts = String(filename).split(".");
  if (parts.length < 2) return "";
  return parts.pop().toLowerCase();
}

function getDisplayType(file) {
  const ext = getFileExtension(file.originalName);
  const mime = String(file.fileType || "").toLowerCase();
  const videoExt = ["mp4", "mov", "avi", "mkv", "wmv", "flv", "webm"];
  const imageExt = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"];
  const audioExt = ["mp3", "wav", "aac", "flac", "ogg", "m4a"];
  const archiveExt = ["zip", "rar", "7z", "tar", "gz"];

  if (mime.startsWith("video/") || videoExt.includes(ext)) return "Video";
  if (mime.startsWith("image/") || imageExt.includes(ext)) return "Image";
  if (mime.startsWith("audio/") || audioExt.includes(ext)) return "Audio";
  if (archiveExt.includes(ext) || mime.includes("zip") || mime.includes("compressed")) return "Archive";
  if (ext === "pdf" || mime.includes("pdf")) return "PDF";
  if (ext === "docx") return "DOCX";
  if (ext === "doc") return "DOC";
  if (ext === "xlsx") return "XLSX";
  if (ext === "xls") return "XLS";
  if (ext === "pptx") return "PPTX";
  if (ext === "ppt") return "PPT";
  if (ext === "txt" || mime.startsWith("text/")) return "TXT";
  if (ext) return ext.toUpperCase();
  if (mime) return mime;
  return "Khac";
}

function updateStats(filteredFiles) {
  totalFiles.textContent = String(state.files.length);
  shownFiles.textContent = String(filteredFiles.length);
}

function getFilteredFiles() {
  const q = state.query.trim().toLowerCase();
  if (!q) return state.files;
  return state.files.filter((file) => {
    const name = String(file.originalName || "").toLowerCase();
    const type = getDisplayType(file).toLowerCase();
    return name.includes(q) || type.includes(q);
  });
}

function renderTable() {
  const filteredFiles = getFilteredFiles();
  updateStats(filteredFiles);

  if (state.listLoading) {
    fileTableBody.innerHTML = `<tr><td colspan="6" class="empty">Dang tai du lieu...</td></tr>`;
    return;
  }
  if (filteredFiles.length === 0) {
    const text = state.files.length === 0 ? "Chua co du lieu" : "Khong tim thay ket qua phu hop";
    fileTableBody.innerHTML = `<tr><td colspan="6" class="empty">${text}</td></tr>`;
    return;
  }

  fileTableBody.innerHTML = filteredFiles
    .map(
      (file, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(file.originalName ?? "-")}</td>
          <td>${escapeHtml(getDisplayType(file))}</td>
          <td>${formatBytes(Number(file.fileSize) || 0)}</td>
          <td>${formatDateTime(file.uploadTime)}</td>
          <td>
            <div class="row-actions">
              <button class="btn-download" data-action="download" data-id="${file.id}">Tai</button>
              <button class="btn-delete" data-action="delete" data-id="${file.id}">Xoa</button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");
}

function setBusyState() {
  refreshBtn.disabled = state.listLoading;
  uploadBtn.disabled = state.uploading;
  logoutBtn.disabled = state.authLoading;
  loginBtn.disabled = state.authLoading;
  registerBtn.disabled = state.authLoading;
}

async function parseError(response) {
  const json = await response.json().catch(() => null);
  if (json && typeof json.message === "string" && json.message.trim() !== "") {
    return json.message;
  }
  const text = await response.text().catch(() => "");
  if (text) return text;
  return `HTTP ${response.status}`;
}

async function fetchAuthed(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: authHeaders(options.headers || {})
  });

  if (response.status === 401) {
    clearSession();
    showAuthScreen();
    throw new Error("Phien dang nhap da het han. Vui long dang nhap lai.");
  }
  return response;
}

async function handleLogin(event) {
  event.preventDefault();
  state.authLoading = true;
  setBusyState();
  setAuthMessage("Dang dang nhap...");

  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;

  try {
    const response = await fetch(`${API_AUTH}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    if (!response.ok) throw new Error(await parseError(response));

    const payload = await response.json();
    setSession(payload.token, payload.username);
    showDashboard(payload.username);
    setAuthMessage("");
    setMessage("");
    await loadFiles();
  } catch (error) {
    setAuthMessage(`Dang nhap that bai: ${error.message}`, "error");
  } finally {
    state.authLoading = false;
    setBusyState();
  }
}

async function handleRegister(event) {
  event.preventDefault();
  state.authLoading = true;
  setBusyState();
  setAuthMessage("Dang tao tai khoan...");

  const username = document.getElementById("registerUsername").value.trim();
  const password = document.getElementById("registerPassword").value;

  try {
    const response = await fetch(`${API_AUTH}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    if (!response.ok) throw new Error(await parseError(response));

    const payload = await response.json();
    setSession(payload.token, payload.username);
    showDashboard(payload.username);
    setAuthMessage("");
    setMessage(payload.message || "Dang ky thanh cong", "ok");
    await loadFiles();
  } catch (error) {
    setAuthMessage(`Dang ky that bai: ${error.message}`, "error");
  } finally {
    state.authLoading = false;
    setBusyState();
  }
}

async function loadCurrentUser() {
  const token = getToken();
  if (!token) {
    showAuthScreen();
    return false;
  }
  try {
    const response = await fetchAuthed(`${API_AUTH}/me`);
    if (!response.ok) throw new Error(await parseError(response));
    const user = await response.json();
    localStorage.setItem(USERNAME_KEY, user.username);
    showDashboard(user.username);
    return true;
  } catch (error) {
    setAuthMessage(error.message, "error");
    return false;
  }
}

async function logout() {
  try {
    await fetchAuthed(`${API_AUTH}/logout`, { method: "POST" });
  } catch (error) {
    setAuthMessage(error.message, "error");
  } finally {
    clearSession();
    showAuthScreen();
  }
}

async function loadFiles() {
  state.listLoading = true;
  setBusyState();
  renderTable();

  try {
    const response = await fetchAuthed(API_FILES);
    if (!response.ok) throw new Error(await parseError(response));
    const files = await response.json();
    state.files = Array.isArray(files) ? files : [];
  } catch (error) {
    setMessage(`Khong tai duoc danh sach file: ${error.message}`, "error");
    state.files = [];
  } finally {
    state.listLoading = false;
    setBusyState();
    renderTable();
  }
}

async function uploadFile(event) {
  event.preventDefault();
  const files = Array.from(fileInput.files || []);
  if (files.length === 0) {
    setMessage("Ban chua chon file.", "error");
    return;
  }

  state.uploading = true;
  setBusyState();
  setMessage(`Dang upload ${files.length} file...`);

  try {
    const tasks = files.map(async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetchAuthed(`${API_FILES}/upload`, {
        method: "POST",
        body: formData
      });
      if (!response.ok) {
        throw new Error(await parseError(response));
      }
      return response.json().catch(() => ({}));
    });

    const results = await Promise.allSettled(tasks);
    const successCount = results.filter((result) => result.status === "fulfilled").length;
    const failedResults = results.filter((result) => result.status === "rejected");

    if (failedResults.length === 0) {
      setMessage(`Upload thanh cong ${successCount}/${files.length} file`, "ok");
    } else if (successCount === 0) {
      setMessage(`Upload that bai ${failedResults.length}/${files.length} file`, "error");
    } else {
      setMessage(
        `Upload xong: thanh cong ${successCount}/${files.length}, that bai ${failedResults.length}/${files.length}`,
        "ok"
      );
    }

    uploadForm.reset();
    selectedFile.textContent = "Chua chon file";
    void loadFiles();
  } catch (error) {
    setMessage(`Upload that bai: ${error.message}`, "error");
  } finally {
    state.uploading = false;
    setBusyState();
  }
}

async function deleteFile(id) {
  const ok = window.confirm(`Ban chac chan muon xoa file ID ${id}?`);
  if (!ok) return;

  try {
    const response = await fetchAuthed(`${API_FILES}/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error(await parseError(response));
    const payload = await response.json().catch(() => ({}));
    setMessage(payload.message || "Xoa file thanh cong", "ok");
    await loadFiles();
  } catch (error) {
    setMessage(`Xoa that bai: ${error.message}`, "error");
  }
}

async function downloadFile(id) {
  try {
    const response = await fetchAuthed(`${API_FILES}/download/${id}`);
    if (!response.ok) throw new Error(await parseError(response));

    const contentDisposition = response.headers.get("Content-Disposition") || "";
    const match = contentDisposition.match(/filename="([^"]+)"/);
    const fileName = match ? match[1] : `file-${id}`;
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    setMessage(`Tai file that bai: ${error.message}`, "error");
  }
}

function handleTableActions(event) {
  const button = event.target.closest("button");
  if (!button) return;

  const action = button.dataset.action;
  const id = button.dataset.id;
  if (!action || !id) return;

  if (action === "download") {
    void downloadFile(id);
    return;
  }

  if (action === "delete") {
    void deleteFile(id);
  }
}

function handleFileSelection() {
  const files = Array.from(fileInput.files || []);
  if (files.length === 0) {
    selectedFile.textContent = "Chua chon file";
    return;
  }

  if (files.length === 1) {
    const file = files[0];
    selectedFile.textContent = `Da chon: ${file.name} (${formatBytes(file.size)})`;
    return;
  }

  const totalSize = files.reduce((sum, file) => sum + (Number(file.size) || 0), 0);
  selectedFile.textContent = `Da chon ${files.length} file (${formatBytes(totalSize)})`;
}

async function init() {
  showLoginBtn.addEventListener("click", showLoginMode);
  showRegisterBtn.addEventListener("click", showRegisterMode);
  loginForm.addEventListener("submit", (event) => void handleLogin(event));
  registerForm.addEventListener("submit", (event) => void handleRegister(event));
  logoutBtn.addEventListener("click", () => void logout());

  uploadForm.addEventListener("submit", (event) => void uploadFile(event));
  fileInput.addEventListener("change", handleFileSelection);
  refreshBtn.addEventListener("click", () => void loadFiles());
  searchInput.addEventListener("input", (event) => {
    state.query = event.target.value || "";
    renderTable();
  });
  fileTableBody.addEventListener("click", handleTableActions);

  renderTable();
  showLoginMode();

  const hasSession = await loadCurrentUser();
  if (hasSession) {
    await loadFiles();
  }
}

void init();
