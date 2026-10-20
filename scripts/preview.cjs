const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const port = Number(process.env.PORT) || 4173;
http.createServer((req, res) => {
  let requested;
  try { requested = decodeURIComponent(new URL(req.url, "http://localhost").pathname); }
  catch { res.writeHead(400).end(); return; }
  const file = path.resolve(root, "." + requested);
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (err, buffer) => {
    if (err) { res.writeHead(404).end("Not found"); return; }
    const type = file.endsWith(".js") ? "text/javascript" : "text/html";
    res.writeHead(200, { "Content-Type": type + "; charset=utf-8", "Cache-Control": "no-store" });
    res.end(buffer);
  });
}).listen(port, "127.0.0.1", () => console.log("http://127.0.0.1:" + port + "/preview/index.html"));
