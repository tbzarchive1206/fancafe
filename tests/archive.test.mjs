import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const read = (file) => fs.readFile(new URL(file, root), "utf8");

test("English-only interface has no language switcher", async () => {
  const files = await Promise.all([
    read("index.html"),
    read("from-the-boyz/index.html"),
    read("from-the-boyz/app.js"),
    read("the-boyz-album/index.html"),
    read("the-boyz-album/app.js"),
  ]);
  const source = files.join("\n");
  assert.doesNotMatch(source, /langToggle|tbzFancafeLang|\bko\s*:/u);
});

test("folder picker matches the archive style and excluded members are not filters", async () => {
  const home = await read("index.html");
  const postsPage = await read("from-the-boyz/index.html");
  const app = await read("from-the-boyz/app.js");
  assert.match(home, /member-picker fancafe-picker/);
  assert.match(home, /member-grid folder-grid/);
  assert.match(postsPage, /<strong>09<\/strong>\s*<span data-i18n="members">MEMBERS<\/span>/);
  assert.doesNotMatch(app, /NEW \/ CHANHEE|HAKNYEON/);
});

test("blog content is embedded and sanitized", async () => {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(await read("from-the-boyz/posts.js"), context);
  vm.runInContext(await read("from-the-boyz/content.js"), context);
  const posts = context.window.FANCAFE_POSTS;
  const content = context.window.FANCAFE_CONTENT;
  assert.equal(posts.length, 1443);
  assert.ok(Object.keys(content).length >= 1400);
  const combined = Object.values(content).join("");
  assert.doesNotMatch(combined, /<script|<style|\son[a-z]+=/iu);
  assert.match(combined, /<p|<img|<ul|<ol|<table/iu);
});

test("album data and static Pages build are complete", async () => {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(await read("the-boyz-album/data.js"), context);
  assert.equal(context.window.FANCAFE_ALBUM_DATA.galleries.length, 137);
  assert.equal(context.window.FANCAFE_ALBUM_DATA.galleries.reduce((sum, gallery) => sum + gallery.images.length, 0), 2733);
});
