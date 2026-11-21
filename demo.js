"use strict";

const scenes = [
  { id: "fireworks-01", name: "Golden canopy", group: "Fireworks", detail: "Two golden bursts over a fan of red and gold fireworks.", height: 810 },
  { id: "traffic-01", name: "Fountain plaza", group: "Traffic", detail: "Light trails curve around a fountain and a red-lit monument.", height: 810 },
  { id: "fireworks-02", name: "Crossing sparks", group: "Fireworks", detail: "Two bursts above intersecting pale violet trails.", height: 810 },
  { id: "traffic-02", name: "City boulevard", group: "Handheld traffic", detail: "Red and white trails run along a tree-lined boulevard.", height: 1080 }
];
const methods = new Map([
  ["reference", "Reference frame (S)"], ["max-stack", "Raw max-stack"],
  ["google-style", "Google-style"], ["ultrafusion", "UltraFusion"],
  ["flux", "FLUX.2 klein"], ["gpt", "GPT Image 2"], ["ours", "HLTFusion (Ours)"]
]);
const byId = id => document.getElementById(id);
const sceneStrip = byId("scenes");
const pictures = byId("pictures");
const leftSelect = byId("left");
const rightSelect = byId("right");
const range = byId("wipe-range");
let scene = scenes[0];
let version = 0;

function applyPublication() {
  const publication = window.PUBLICATION;
  if (publication?.mode !== "public") return;
  byId("authors").textContent = publication.authors || "";
  byId("authors").hidden = !publication.authors;
  byId("affiliations").textContent = publication.affiliations || "";
  byId("affiliations").hidden = !publication.affiliations;
  for (const entry of publication.links || []) {
    if (!entry?.label || !/^https?:\/\//i.test(entry.url)) continue;
    const link = document.createElement("a");
    link.className = "resource";
    link.textContent = entry.label;
    link.href = entry.url;
    byId("hero-actions").append(link);
  }
}

function pathFor(item, method) {
  return "./assets/comparisons/" + item.id + "/" + method + ".webp";
}

function createSceneCard(item) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "scene-card";
  card.setAttribute("aria-pressed", String(item === scene));
  const thumb = new Image();
  thumb.src = pathFor(item, "thumb");
  thumb.alt = "";
  const caption = document.createElement("span");
  const group = document.createElement("small");
  group.textContent = item.group;
  const name = document.createElement("strong");
  name.textContent = item.name;
  caption.append(group, name);
  card.append(thumb, caption);
  card.addEventListener("click", () => {
    scene = item;
    for (const sibling of sceneStrip.children) {
      sibling.setAttribute("aria-pressed", String(sibling === card));
    }
    loadPair();
  });
  return card;
}

function loadImage(item, id, side) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.id = side + "-image";
    img.alt = methods.get(id) + " · " + item.name + ". " + item.detail;
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = pathFor(item, id);
  });
}

async function loadPair() {
  const requested = ++version;
  const item = scene;
  const left = leftSelect.value;
  const right = rightSelect.value;
  byId("scene-title").textContent = item.name;
  byId("load-error").hidden = true;
  byId("frame-size").textContent = "";
  pictures.style.setProperty("--ratio", "1440 / " + item.height);
  pictures.setAttribute("aria-busy", "true");
  byId("left-image").hidden = true;
  byId("right-image").hidden = true;
  try {
    const [a, b] = await Promise.all([loadImage(item, left, "left"), loadImage(item, right, "right")]);
    if (requested !== version) return;
    byId("left-image").replaceWith(a);
    byId("right-image").replaceWith(b);
    byId("frame-size").textContent = a.naturalWidth + " × " + a.naturalHeight;
    byId("status").textContent = item.name + ". Left: " + methods.get(left) + ". Right: " + methods.get(right) + ".";
  } catch {
    if (requested === version) {
      byId("load-error").hidden = false;
      byId("status").textContent = "";
    }
  } finally {
    if (requested === version) pictures.setAttribute("aria-busy", "false");
  }
}

function setWipe(enabled) {
  pictures.classList.toggle("wipe", enabled);
  byId("split-mode").setAttribute("aria-pressed", String(!enabled));
  byId("wipe-mode").setAttribute("aria-pressed", String(enabled));
  range.hidden = !enabled;
  byId("view-note").textContent = enabled
    ? "Drag the divider or use the arrow keys to move it."
    : "Select Wipe to move the divider.";
}

applyPublication();
sceneStrip.append(...scenes.map(createSceneCard));
for (const [key, label] of methods) {
  leftSelect.add(new Option(label, key));
  rightSelect.add(new Option(label, key));
}
leftSelect.value = "max-stack";
rightSelect.value = "ours";
leftSelect.addEventListener("change", loadPair);
rightSelect.addEventListener("change", loadPair);
byId("split-mode").addEventListener("click", () => setWipe(false));
byId("wipe-mode").addEventListener("click", () => setWipe(true));
range.addEventListener("input", () => pictures.style.setProperty("--wipe-position", range.value + "%"));
byId("retry").addEventListener("click", loadPair);
loadPair();
