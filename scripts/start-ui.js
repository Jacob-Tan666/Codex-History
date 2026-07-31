#!/usr/bin/env node
const http = require("http");
const uiServer = require("./ui-server");

const DEFAULT_HOST = uiServer.DEFAULT_HOST;
const DEFAULT_PORT = uiServer.DEFAULT_PORT;
const DEFAULT_PORT_ATTEMPTS = 50;

class LauncherError extends Error {
  constructor(message) {
    super(message);
    this.name = "LauncherError";
  }
}

function requireValue(args, index, optionName) {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new LauncherError(`参数 ${optionName} 需要值`);
  }
  return value;
}

function parsePort(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 65535) {
    throw new LauncherError("参数 --port 必须是 1 到 65535 之间的整数");
  }
  return parsed;
}

function parseArgs(args) {
  const options = {
    host: DEFAULT_HOST,
    open: true,
    port: DEFAULT_PORT,
    portAttempts: DEFAULT_PORT_ATTEMPTS,
  };

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (token === "--no-open") {
      options.open = false;
      continue;
    }
    if (token === "--open") {
      options.open = true;
      continue;
    }
    if (token === "--host") {
      options.host = requireValue(args, index, token);
      index += 1;
      continue;
    }
    if (token === "--port") {
      options.port = parsePort(requireValue(args, index, token));
      index += 1;
      continue;
    }
    throw new LauncherError(`未知参数: ${token}`);
  }

  return options;
}

function formatUrl(host, port) {
  const urlHost = host.includes(":") && !host.startsWith("[") ? `[${host}]` : host;
  return `http://${urlHost}:${port}/`;
}

function isCodexHistoryUi(host, port, timeoutMs = 700) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const request = http.get(
      {
        host,
        path: "/",
        port,
        timeout: timeoutMs,
      },
      (response) => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          if (body.length < 64 * 1024) body += chunk;
        });
        response.on("end", () => {
          finish(
            response.statusCode === 200 &&
              (body.includes("<title>Codex History") || body.includes("Codex History UI"))
          );
        });
      }
    );

    request.on("error", () => finish(false));
    request.on("timeout", () => {
      request.destroy();
      finish(false);
    });
  });
}

async function launch(options = {}) {
  const host = options.host || DEFAULT_HOST;
  const open = options.open !== false;
  const startPort = options.port || DEFAULT_PORT;
  const portAttempts = options.portAttempts || DEFAULT_PORT_ATTEMPTS;

  for (let offset = 0; offset < portAttempts; offset += 1) {
    const port = startPort + offset;
    if (port > 65535) break;

    if (await isCodexHistoryUi(host, port)) {
      const targetUrl = formatUrl(host, port);
      console.log(`Codex History UI 已在运行: ${targetUrl}`);
      if (open) uiServer.openBrowser(targetUrl);
      return { reused: true, server: null, url: targetUrl };
    }

    try {
      const result = await uiServer.startServer({ host, port });
      console.log(`Codex History UI: ${result.url}`);
      if (offset > 0) {
        console.log(`默认端口 ${startPort} 被占用，已自动改用端口 ${port}。`);
      }
      console.log("按 Ctrl+C 停止服务。");
      if (open) uiServer.openBrowser(result.url);
      return { reused: false, server: result.server, url: result.url };
    } catch (error) {
      if (error && error.code === "EADDRINUSE") continue;
      throw error;
    }
  }

  throw new LauncherError(
    `无法在 ${startPort} 起的 ${portAttempts} 个端口内启动 Codex History UI`
  );
}

async function main(args = process.argv.slice(2)) {
  try {
    await launch(parseArgs(args));
  } catch (error) {
    console.error(error && error.message ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  DEFAULT_PORT_ATTEMPTS,
  LauncherError,
  formatUrl,
  isCodexHistoryUi,
  launch,
  main,
  parseArgs,
};
