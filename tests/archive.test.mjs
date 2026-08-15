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

test("folder picker matches the archive style and member filters use the requested order", async () => {
  const home = await read("index.html");
  const postsPage = await read("from-the-boyz/index.html");
  const app = await read("from-the-boyz/app.js");
  assert.match(home, /member-picker fancafe-picker/);
  assert.match(home, /member-grid folder-grid/);
  assert.doesNotMatch(postsPage, /data-i18n="members">MEMBERS|09 MEMBERS/);
  const labels = [...app.matchAll(/\{ value: "[^"]+", label: "([^"]+)" \}/g)].map((match) => match[1]);
  assert.deepEqual(labels, [
    "SANGYEON", "JACOB", "YOUNGHOON", "HYUNJAE", "JUYEON", "KEVIN", "Q",
    "SUNWOO", "ERIC", "HWALL (2017 - 2019)", "HAKNYEON (2017 - 2025)", "NEW (2017 - 2026)",
  ]);
});

test("every page has the archive favicon and the static build copies it", async () => {
  const pages = await Promise.all([read("index.html"), read("from-the-boyz/index.html"), read("the-boyz-album/index.html")]);
  pages.forEach((page) => assert.match(page, /<link rel="icon" type="image\/png" href="(?:\.\.\/)?icon\.png">/));
  assert.match(await read("scripts/build-static.mjs"), /"icon\.png"/);
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
