const fs = require("fs");
const http = require("http");
const path = require("path");
const url = require("url");
const history = require("./history-core");
const { formatSessionMarkdown } = require("./formatters");

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 17876;
const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

class UiServerError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = "UiServerError";
    this.statusCode = statusCode || 500;
  }
}

function parseUiArgs(args) {
  const options = {
    host: DEFAULT_HOST,
    open: false,
    port: DEFAULT_PORT,
  };

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (token === "--open") {
      options.open = true;
      continue;
    }
    if (token === "--host") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        throw new UiServerError("参数 --host 需要值", 400);
      }
      options.host = value;
      index += 1;
      continue;
    }
    if (token === "--port") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        throw new UiServerError("参数 --port 需要值", 400);
      }
      const parsed = Number.parseInt(value, 10);
      if (!Number.isFinite(parsed) || parsed < 1 || parsed > 65535) {
        throw new UiServerError("参数 --port 必须是 1 到 65535 之间的整数", 400);
      }
      options.port = parsed;
      index += 1;
      continue;
    }
    throw new UiServerError(`未知参数: ${token}`, 400);
  }

  return options;
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
  });
  res.end(JSON.stringify(payload, null, 2));
}

function sendNoContent(res) {
  res.writeHead(204, { "Cache-Control": "no-store" });
  res.end();
}

function sendError(res, error) {
  const statusCode = error && error.statusCode ? error.statusCode : 500;
  const message = error && error.message ? error.message : "未知错误";
  sendJson(res, statusCode, { error: { message, statusCode } });
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new UiServerError("请求体过大", 413));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new UiServerError("请求体必须是合法 JSON", 400));
      }
    });
    req.on("error", reject);
  });
}

function normalizeSource(value) {
  if (value === "all" || value === "sessions" || value === "archived") {
    return value;
  }
  return "all";
}

function normalizeLimit(value) {
  if (value === undefined || value === null || value === "") {
    return 200;
  }
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 200;
  }
  return Math.min(parsed, 1000);
}

function getSessionEntries(query) {
  const codexHome = history.getCodexHome();
  const source = normalizeSource(query.source);
  const limit = normalizeLimit(query.limit);
  let items = history.loadSessionIndex(codexHome);
  const total = items.length;

  if (source !== "all") {
    items = items.filter((item) => item.source === source);
  }

  const filteredTotal = items.length;
  items = items.slice(0, limit);

  return {
    codexHome,
    filteredTotal,
    items: items.map((item) => ({
      filePath: item.filePath,
      sessionId: item.sessionId,
      source: item.source,
      timeText: item.timeText,
      title: item.title,
    })),
    limit,
    source,
    total,
  };
}

function findSession(sessionId, source) {
  const codexHome = history.getCodexHome();
  let entries = history.loadSessionIndex(codexHome);
  if (source && source !== "all") {
    entries = entries.filter((entry) => entry.source === source);
  }
  const target = entries.find((entry) => entry.sessionId === sessionId);
  if (!target) {
    throw new UiServerError(`未找到会话: ${sessionId}`, 404);
  }
  return { codexHome, target };
}

function requireSessionId(value) {
  const sessionId = typeof value === "string" ? value.trim() : "";
  if (!sessionId) {
    throw new UiServerError("缺少 sessionId", 400);
  }
  return sessionId;
}

function normalizeSessionIds(body) {
  const rawIds = Array.isArray(body.sessionIds) ? body.sessionIds : [body.sessionId];
  const sessionIds = rawIds
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
  const uniqueIds = Array.from(new Set(sessionIds));
  if (uniqueIds.length === 0) {
    throw new UiServerError("缺少 sessionId", 400);
  }
  return uniqueIds;
}

function ensureRelativeProjectOutput(outputPath) {
  const displayPath = typeof outputPath === "string" ? outputPath.trim() : "";
  if (!displayPath) {
    throw new UiServerError("缺少 outputPath", 400);
  }
  if (path.isAbsolute(displayPath)) {
    throw new UiServerError("导出路径必须是当前项目内的相对路径", 400);
  }

  const projectRoot = process.cwd();
  const resolvedPath = path.resolve(projectRoot, displayPath);
  const relativePath = path.relative(projectRoot, resolvedPath);
  if (
    relativePath === "" ||
    relativePath === "." ||
    relativePath.startsWith("..") ||
    path.isAbsolute(relativePath)
  ) {
    throw new UiServerError("导出路径必须位于当前项目目录内", 400);
  }
  return { displayPath, resolvedPath };
}

function previewSession(query) {
  const sessionId = requireSessionId(query.sessionId);
  const { target } = findSession(sessionId, query.source);
  const messages = history.readSessionMessages(target.filePath);
  return {
    filePath: target.filePath,
    messages,
    sessionId: target.sessionId,
    source: target.source,
    timeText: target.timeText,
    title: target.title || target.sessionId,
  };
}

function exportSession(body) {
  const sessionId = requireSessionId(body.sessionId);
  const { displayPath, resolvedPath } = ensureRelativeProjectOutput(body.outputPath);
  const { target } = findSession(sessionId, "all");
  const exportData = history.readSessionExportData(target.filePath);
  const payload = {
    format: "md",
    messages: exportData.messages,
    outputPath: resolvedPath,
    sessionId: target.sessionId,
    source: target.source,
    timeText: target.timeText,
    title: target.title || target.sessionId,
  };

  fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
  if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
    throw new UiServerError(`导出失败: 输出路径是目录 ${displayPath}`, 400);
  }
  fs.writeFileSync(resolvedPath, formatSessionMarkdown(payload), "utf8");

  return {
    format: "md",
    messageCount: payload.messages.length,
    outputPath: displayPath,
    sessionId,
  };
}

function archiveSession(body) {
  const sessionId = requireSessionId(body.sessionId);
  const force = Boolean(body.force);
  const { codexHome, target } = findSession(sessionId, "sessions");
  return history.archiveSessions({
    codexHome,
    entries: [target],
    force,
  });
}

function recoverSession(body) {
  const sessionId = requireSessionId(body.sessionId);
  const force = Boolean(body.force);
  const { codexHome, target } = findSession(sessionId, "archived");
  return history.recoverSessions({
    codexHome,
    entries: [target],
    force,
  });
}

function deleteSession(body) {
  if (!body.force) {
    throw new UiServerError("删除会话必须显式传入 force", 400);
  }

  const sessionIds = normalizeSessionIds(body);
  const codexHome = history.getCodexHome();
  const entries = history.loadSessionIndex(codexHome);
  const entryMap = new Map(entries.map((entry) => [entry.sessionId, entry]));
  const missingSessionIds = sessionIds.filter((sessionId) => !entryMap.has(sessionId));
  if (missingSessionIds.length > 0) {
    throw new UiServerError(`未找到会话: ${missingSessionIds.join(", ")}`, 404);
  }

  const sessionFiles = sessionIds.map((sessionId) => entryMap.get(sessionId).filePath);
  const result = history.deleteSessions({
    clearHistory: false,
    codexHome,
    sessionFiles,
    sessionIds,
  });

  return {
    all: false,
    deletedFiles: result.deletedFiles,
    failedFileCount: result.failedFileCount,
    failedFiles: result.failedFiles,
    removedHistoryLines: result.removedHistoryLines,
    sessionCount: sessionIds.length,
    sessionFileCount: sessionFiles.length,
    sessionIds,
  };
}

function sanitizeStaticPath(pathname) {
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const decodedPath = decodeURIComponent(requestedPath);
  if (decodedPath.includes("\0")) {
    throw new UiServerError("非法路径", 400);
  }
  return decodedPath;
}

function serveStatic(req, res, publicDir, pathname) {
  const decodedPath = sanitizeStaticPath(pathname);
  const relativePath = decodedPath.replace(/^\/+/, "");
  const filePath = path.resolve(publicDir, relativePath);
  const relativeToPublic = path.relative(publicDir, filePath);
  if (
    relativeToPublic === "" ||
    relativeToPublic.startsWith("..") ||
    path.isAbsolute(relativeToPublic)
  ) {
    throw new UiServerError("非法路径", 400);
  }
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    throw new UiServerError("资源不存在", 404);
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  res.writeHead(200, {
    "Cache-Control": "no-store",
    "Content-Type": contentType,
  });
  fs.createReadStream(filePath).pipe(res);
}

async function handleApi(req, res, pathname, query) {
  if (req.method === "GET" && pathname === "/api/sessions") {
    sendJson(res, 200, getSessionEntries(query));
    return;
  }

  if (req.method === "GET" && pathname === "/api/session") {
    sendJson(res, 200, previewSession(query));
    return;
  }

  if (req.method === "POST" && pathname === "/api/export") {
    const body = await readRequestBody(req);
    sendJson(res, 200, exportSession(body));
    return;
  }

  if (req.method === "POST" && pathname === "/api/archive") {
    const body = await readRequestBody(req);
    sendJson(res, 200, archiveSession(body));
    return;
  }

  if (req.method === "POST" && pathname === "/api/recover") {
    const body = await readRequestBody(req);
    sendJson(res, 200, recoverSession(body));
    return;
  }

  if (req.method === "POST" && pathname === "/api/delete") {
    const body = await readRequestBody(req);
    sendJson(res, 200, deleteSession(body));
    return;
  }

  if (req.method === "POST" && pathname === "/api/shutdown") {
    sendNoContent(res);
    setTimeout(() => process.exit(0), 60);
    return;
  }

  throw new UiServerError("接口不存在", 404);
}

function openBrowser(targetUrl) {
  const { execFile } = require("child_process");
  if (process.platform === "win32") {
    execFile("cmd", ["/c", "start", "", targetUrl], { windowsHide: true });
    return;
  }
  if (process.platform === "darwin") {
    execFile("open", [targetUrl]);
    return;
  }
  execFile("xdg-open", [targetUrl]);
}

function startServer(options = {}) {
  const host = options.host || DEFAULT_HOST;
  const port = options.port || DEFAULT_PORT;
  const publicDir = path.join(__dirname, "..", "public");

  const server = http.createServer(async (req, res) => {
    try {
      const parsedUrl = url.parse(req.url, true);
      const pathname = parsedUrl.pathname || "/";
      if (pathname.startsWith("/api/")) {
        await handleApi(req, res, pathname, parsedUrl.query || {});
        return;
      }
      if (req.method !== "GET" && req.method !== "HEAD") {
        throw new UiServerError("方法不支持", 405);
      }
      serveStatic(req, res, publicDir, pathname);
    } catch (error) {
      sendError(res, error);
    }
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      server.removeListener("error", reject);
      const address = server.address();
      const actualPort = address && address.port ? address.port : port;
      const targetUrl = `http://${host}:${actualPort}/`;
      resolve({ server, url: targetUrl });
    });
  });
}

async function runUi(args) {
  const options = parseUiArgs(args || []);
  const { url: targetUrl } = await startServer(options);
  console.log(`Codex History UI: ${targetUrl}`);
  console.log("按 Ctrl+C 停止服务。");
  if (options.open) {
    openBrowser(targetUrl);
  }
}

module.exports = {
  DEFAULT_HOST,
  DEFAULT_PORT,
  UiServerError,
  parseUiArgs,
  runUi,
  startServer,
};
