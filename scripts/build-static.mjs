import fs from "node:fs/promises";

const root = new URL("../", import.meta.url);
const dist = new URL("../dist/", import.meta.url);
const files = [
  "index.html",
  "icon.png",
  "styles.css",
  "from-the-boyz/index.html",
  "from-the-boyz/app.js",
  "from-the-boyz/posts.js",
  "from-the-boyz/content.js",
  "from-the-boyz/blog.css",
  "the-boyz-album/index.html",
  "the-boyz-album/app.js",
  "the-boyz-album/data.js",
];

await fs.rm(dist, { recursive: true, force: true });
await fs.mkdir(dist, { recursive: true });
await fs.writeFile(new URL(".nojekyll", dist), "", "utf8");

for (const file of files) {
  const target = new URL(file, dist);
  await fs.mkdir(new URL("./", target), { recursive: true });
  await fs.copyFile(new URL(file, root), target);
}

console.log(`Built ${files.length} static files in dist.`);
