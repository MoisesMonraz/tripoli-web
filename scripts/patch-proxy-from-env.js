const fs = require("fs");
const path = require("path");

const target = path.join(
  __dirname,
  "..",
  "node_modules",
  "proxy-from-env",
  "index.js"
);

const patchMarker = "/* patched: use WHATWG URL */";

const patch = (source) => {
  if (source.includes(patchMarker)) return source;
  const needle = "var parseUrl = require('url').parse;";
  if (!source.includes(needle)) return source;

  const replacement = [
    patchMarker,
    "var URL = require('url').URL;",
    "var parseUrl = function (input) {",
    "  try {",
    "    var u = new URL(input);",
    "    return { protocol: u.protocol, host: u.host, port: u.port };",
    "  } catch (err) {",
    "    return {};",
    "  }",
    "};",
  ].join("\n");

  return source.replace(needle, replacement);
};

try {
  if (!fs.existsSync(target)) {
    console.warn("proxy-from-env not found, skipping patch.");
    process.exit(0);
  }
  const source = fs.readFileSync(target, "utf8");
  const next = patch(source);
  if (next === source) {
    console.warn("proxy-from-env already patched or pattern not found.");
    process.exit(0);
  }
  fs.writeFileSync(target, next, "utf8");
  console.log("Patched proxy-from-env to avoid url.parse deprecation.");
} catch (error) {
  console.error("Failed to patch proxy-from-env:", error);
  process.exit(1);
}
