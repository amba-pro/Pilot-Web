// Portable zero-dependency ZIP writer for frontend/ directory.
const fs = require("node:fs");
const path = require("node:path");
const dir = path.resolve(__dirname, "../dist/frontend");
const names = fs.readdirSync(dir).filter((name) => fs.statSync(path.join(dir, name)).isFile()).sort();
if (!names.includes("balloon-pop.js") || !names.includes("extensions.config.json")) throw new Error("Missing Pilot-Web extension files");
function crc32(bytes) {
  let crc = -1;
  for (const value of bytes) {
    crc ^= value;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ -1) >>> 0;
}
const body = [];
const directory = [];
let offset = 0;
for (const name of names) {
  const filename = Buffer.from("frontend/" + name, "utf8");
  const data = fs.readFileSync(path.join(dir, name));
  const crc = crc32(data);
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0x800, 6);
  header.writeUInt32LE(crc, 14);
  header.writeUInt32LE(data.length, 18);
  header.writeUInt32LE(data.length, 22);
  header.writeUInt16LE(filename.length, 26);
  body.push(header, filename, data);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(0x800, 8);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(data.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(filename.length, 28);
  central.writeUInt32LE(offset, 42);
  directory.push(central, filename);
  offset += header.length + filename.length + data.length;
}
const centralBytes = Buffer.concat(directory);
const footer = Buffer.alloc(22);
footer.writeUInt32LE(0x06054b50, 0);
footer.writeUInt16LE(names.length, 8);
footer.writeUInt16LE(names.length, 10);
footer.writeUInt32LE(centralBytes.length, 12);
footer.writeUInt32LE(offset, 16);
const target = path.resolve(__dirname, "../dist/balloon-pop-pilot-web.zip");
fs.writeFileSync(target, Buffer.concat([...body, centralBytes, footer]));
console.log("Created " + target);
