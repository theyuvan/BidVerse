import assert from "node:assert/strict";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as espree from "espree";
import postcss from "postcss";

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const self = fileURLToPath(import.meta.url);
const preserve = /@license|copyright|SPDX-License|eslint-|istanbul|prettier-|vite-ignore|@ts-|sourceMappingURL/i;
const options = { ecmaVersion: "latest", sourceType: "module", ecmaFeatures: { jsx: true }, comment: true, range: true };
const files = [];
async function collect(directory, extensions) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) await collect(file, extensions);
        else if (entry.isFile() && extensions.includes(path.extname(file)) && file !== self) files.push(file);
    }
}
await collect(path.join(workspace, "frontend/src"), [".js", ".jsx", ".css", ".svg"]);
await collect(path.join(workspace, "frontend/scripts"), [".mjs"]);
await collect(path.join(workspace, "bidverse/src/main/java"), [".java"]);
await collect(path.join(workspace, "bidverse/src/test/java"), [".java"]);
for (const file of ["frontend/index.html", "frontend/vite.config.js", "frontend/eslint.config.js",
    "frontend/.gitignore", "frontend/.env.example", "bidverse/.gitignore", "bidverse/pom.xml", "frontend/public/favicon.svg"])
    files.push(path.join(workspace, file));

function mask(source, ranges) {
    let result = source;
    for (const [start, end] of ranges.toSorted((a, b) => b[0] - a[0]))
        result = result.slice(0, start) + source.slice(start, end).replace(/[^\r\n]/g, " ") + result.slice(end);
    const originalLines = source.split("\n");
    return result.split("\n").map((line, index) =>
        line !== originalLines[index] ? line.replace(/[ \t]+(?=\r?$)/, "") : line).join("\n");
}
function normalized(value) {
    if (Array.isArray(value)) return value.map(normalized);
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value)
        .filter(([key]) => !["range", "loc", "start", "end", "comments", "tokens"].includes(key))
        .map(([key, item]) => [key, normalized(item)]));
    return value;
}
function javaRanges(source) {
    const ranges = [];
    for (let i = 0; i < source.length;) {
        if (source.startsWith('"""', i)) {
            i += 3;
            while (i < source.length) {
                if (source[i] === "\\") { i += 2; continue; }
                if (source.startsWith('"""', i)) { i += 3; break; }
                i++;
            }
        } else if (source[i] === '"' || source[i] === "'") {
            const quote = source[i++];
            while (i < source.length) {
                if (source[i] === "\\") { i += 2; continue; }
                if (source[i++] === quote) break;
            }
        } else if (source.startsWith("//", i) || source.startsWith("/*", i)) {
            const start = i;
            if (source.startsWith("//", i)) {
                i = source.indexOf("\n", i);
                if (i < 0) i = source.length;
            } else {
                const end = source.indexOf("*/", i + 2);
                assert.ok(end >= 0, "Unclosed Java comment");
                i = end + 2;
            }
            if (!preserve.test(source.slice(start, i))) ranges.push([start, i]);
        } else i++;
    }
    return ranges;
}
function cssModel(root) {
    const nodes = [];
    root.walk(node => { if (node.type !== "comment") nodes.push({
        type: node.type, selector: node.selector, prop: node.prop, value: node.value,
        name: node.name, params: node.params, important: node.important, depth: node.parent?.type
    }); });
    return nodes;
}
const changes = [];
let removed = 0;
for (const file of files) {
    const source = await readFile(file, "utf8");
    const extension = path.extname(file);
    let next = source, count = 0;
    if ([".js", ".jsx", ".mjs"].includes(extension)) {
        const before = espree.parse(source, options);
        const comments = before.comments.filter(comment => !preserve.test(comment.value));
        next = mask(source, comments.map(comment => comment.range));
        assert.deepEqual(normalized(espree.parse(next, options)), normalized(before), "JavaScript AST changed: " + file);
        count = comments.length;
    } else if (extension === ".java") {
        const ranges = javaRanges(source);
        next = mask(source, ranges);
        count = ranges.length;
    } else if (extension === ".css") {
        const root = postcss.parse(source, { from: file });
        const before = cssModel(root);
        root.walkComments(comment => { if (!preserve.test(comment.text)) { comment.remove(); count++; } });
        next = root.toString();
        assert.deepEqual(cssModel(postcss.parse(next)), before, "CSS declarations changed: " + file);
    } else if ([".xml", ".html", ".svg"].includes(extension)) {
        const ranges = [...source.matchAll(/<!--[\s\S]*?-->/g)].filter(match => !preserve.test(match[0]))
            .map(match => [match.index, match.index + match[0].length]);
        next = mask(source, ranges);
        count = ranges.length;
    } else {
        next = source.split(/(?<=\n)/).filter(line => {
            if (/^\s*#/.test(line) && !preserve.test(line)) { count++; return false; }
            return true;
        }).join("");
    }
    if (next !== source) { changes.push({ file, source, next, count }); removed += count; }
}
for (const change of changes) {
    assert.equal(await readFile(change.file, "utf8"), change.source, "File changed during scan; refusing overwrite");
    await writeFile(change.file, change.next, "utf8");
    console.log(path.relative(workspace, change.file) + ": " + change.count + " comments removed");
}
console.log("Removed " + removed + " comments from " + changes.length + " files; scanned " + files.length + " project files.");
