const $ = id => document.getElementById(id);
const optionIds = ["spaces", "paragraphs", "removeBlankLines", "lists", "quotes"];
let tabId, poll, draftTimer;
let ready = false, busy = false, starting = false;
function settings() {
  return Object.fromEntries(optionIds.map(id => [id, $(id).checked]));
}
function update() {
  $("result").value = PasteRapiText.tidy($("source").value, settings());
  const count = PasteRapiText.characters($("result").value).length;
  $("source-count").textContent = count.toLocaleString("id-ID") + " karakter";
  const instant = Number($("speed").value) === 0;
  $("speed-value").textContent = instant ? "Hampir instan" : $("speed").value + " ms / karakter";
  const seconds = Math.ceil(count * Number($("speed").value) / 1000);
  $("estimate").textContent = !count ? "—" : instant ? "Tanpa jeda antarhuruf" : "± " + (seconds < 60 ? seconds + " detik" : Math.ceil(seconds / 60) + " menit");
  $("start").disabled = !ready || busy || starting || !count;
  $("copy").disabled = !count;
}
async function saveDraft() {
  await chrome.storage.session.set({ draft: $("source").value });
  await chrome.storage.local.set({ preferences: { ...settings(), delay: Number($("speed").value), speedVersion: 1 } });
}
function changed() {
  update();
  clearTimeout(draftTimer);
  draftTimer = setTimeout(() => saveDraft().catch(() => {
    $("message").textContent = "Draf terlalu besar untuk disimpan sementara.";
  }), 250);
}
function send(type, extra = {}) {
  return chrome.tabs.sendMessage(tabId, { type, ...extra }, { frameId: 0 });
}
function showStatus(state) {
  if (!state?.ok) return;
  busy = state.running;
  ready = state.canType;
  $("target").textContent = state.targetLabel || "Klik kolom tujuan di halaman, lalu buka kembali ekstensi.";
  $("target").classList.toggle("error", !ready);
  $("stop").disabled = !busy;
  $("running").hidden = !busy;
  if (busy) {
    $("progress").value = state.total ? state.done / state.total * 100 : 0;
    $("progress-text").textContent = state.done + " / " + state.total + " karakter";
    $("message").textContent = "Pengetikan berjalan. Buka halaman untuk melihat hasilnya.";
  } else if (state.message) {
    $("message").textContent = state.message;
  }
  update();
}
async function initialize() {
  const [session, saved] = await Promise.all([
    chrome.storage.session.get("draft"), chrome.storage.local.get("preferences")
  ]);
  $("source").value = session.draft || "";
  optionIds.forEach(id => { $(id).checked = !!saved.preferences?.[id]; });
  // Enable the new default once on upgrade, then respect later user choices.
  $("speed").value = saved.preferences?.speedVersion === 1 ? saved.preferences.delay ?? 0 : 0;
  update();
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  tabId = tab?.id;
  if (!tabId) throw new Error("Tab aktif tidak ditemukan.");
  await chrome.scripting.executeScript({ target: { tabId }, files: ["format.js", "content.js"] });
  showStatus(await send("PR_STATUS"));
  poll = setInterval(async () => {
    try { showStatus(await send("PR_STATUS")); }
    catch {
      clearInterval(poll);
      ready = false; busy = false;
      $("stop").disabled = true;
      $("target").textContent = "Halaman berubah. Klik kolom tujuan, lalu buka ulang ekstensi.";
      $("target").classList.add("error");
      update();
    }
  }, 500);
}
$("source").addEventListener("input", changed);
$("speed").addEventListener("input", changed);
optionIds.forEach(id => $(id).addEventListener("change", changed));
$("clear").addEventListener("click", () => { $("source").value = ""; changed(); });
$("read-clipboard").addEventListener("click", async () => {
  try { $("source").value = await navigator.clipboard.readText(); changed(); }
  catch { $("message").textContent = "Clipboard tidak dapat dibaca. Tempel teks secara manual di kotak atas."; }
});
$("copy").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText($("result").value); $("message").textContent = "Teks pratinjau sudah disalin."; }
  catch { $("message").textContent = "Pilih dan salin teks pratinjau secara manual."; }
});
$("start").addEventListener("click", async () => {
  starting = true; update();
  try {
    clearTimeout(draftTimer);
    await saveDraft();
    const response = await send("PR_START", { text: $("result").value, delay: Number($("speed").value) });
    if (!response?.ok) throw new Error(response?.error || "Pengetikan tidak dapat dimulai.");
    window.close();
  } catch (error) { $("message").textContent = error.message; }
  finally { starting = false; update(); }
});
$("stop").addEventListener("click", async () => {
  try { showStatus(await send("PR_STOP")); }
  catch { $("message").textContent = "Halaman tidak lagi tersambung. Buka kembali ekstensi."; }
});
window.addEventListener("unload", () => { clearInterval(poll); clearTimeout(draftTimer); });
initialize().catch(() => {
  $("target").textContent = "Ekstensi tidak dapat mengakses halaman ini. Buka halaman web biasa dan pilih kolom teks.";
  $("target").classList.add("error");
});
