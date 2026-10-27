(() => {
  // Reopening the popup must not install duplicate listeners or jobs.
  if (globalThis.__pasteRapiV2) return;
  const state = { running: false, done: 0, total: 0, message: "", job: 0 };
  let chosen, selection, timer, panel, panelText, panelProgress, panelButton, dismissTimer;
  function activeElement() {
    let element = document.activeElement;
    while (element?.shadowRoot?.activeElement) element = element.shadowRoot.activeElement;
    return element;
  }
  function editable(element) {
    if (!element?.isConnected || element.disabled || element.readOnly || element.closest("[inert]")) return false;
    return element instanceof HTMLTextAreaElement ||
      (element instanceof HTMLInputElement && ["text", "search", "url", "email", "tel"].includes(element.type)) ||
      element.isContentEditable;
  }
  function capture() {
    const element = activeElement();
    if (!editable(element)) { chosen = null; selection = null; return; }
    chosen = element;
    if (element.isContentEditable) {
      const current = element.getRootNode().getSelection?.() || window.getSelection();
      selection = current?.rangeCount && element.contains(current.getRangeAt(0).commonAncestorContainer)
        ? current.getRangeAt(0).cloneRange() : null;
    } else {
      selection = { start: element.selectionStart, end: element.selectionEnd };
    }
  }
  function label() {
    if (!editable(chosen)) return "";
    const name = chosen.getAttribute("aria-label") || chosen.getAttribute("placeholder") || chosen.labels?.[0]?.textContent?.trim() || chosen.tagName.toLowerCase();
    return "Tujuan: " + name.slice(0, 90);
  }
  function status() {
    if (!state.running) capture();
    return { ok: true, ...state, canType: !!editable(chosen), targetLabel: label() };
  }
  function removePanel() { panel?.remove(); panel = null; }
  function drawPanel() {
    clearTimeout(dismissTimer); removePanel();
    panel = document.createElement("div");
    panel.setAttribute("data-paste-rapi", "status");
    panel.style.cssText = "all:initial!important;position:fixed!important;bottom:20px!important;right:20px!important;z-index:2147483647!important;";
    const root = panel.attachShadow({ mode: "closed" });
    const style = document.createElement("style");
    style.textContent = ":host{color-scheme:light}.card{font:12px/1.5 'Segoe UI',sans-serif;background:#fff;color:#263447;border:1px solid #dde4f0;border-radius:13px;padding:13px 15px;width:240px;box-shadow:0 8px 35px #142f5c25}.top{display:flex;align-items:center;justify-content:space-between;gap:12px}strong{font-size:12px}button{font:11px 'Segoe UI',sans-serif;border:1px solid #dde4f0;background:#f4f7fc;color:#365b93;border-radius:6px;padding:5px 8px;cursor:pointer}p{margin:8px 0;color:#718096;font-size:11px}progress{display:block;accent-color:#2861c7;width:100%;height:5px}";
    const card = document.createElement("div"); card.className = "card";
    const top = document.createElement("div"); top.className = "top";
    const title = document.createElement("strong"); title.textContent = "Paste Rapi";
    panelButton = document.createElement("button"); panelButton.textContent = "Berhenti · Esc";
    panelButton.addEventListener("click", () => { if (state.running) stop("Dihentikan oleh Anda."); else removePanel(); });
    top.append(title, panelButton);
    panelText = document.createElement("p");
    panelProgress = document.createElement("progress"); panelProgress.max = 100;
    card.append(top, panelText, panelProgress); root.append(style, card);
    // Stop can be clicked without moving the editor caret.
    panel.addEventListener("pointerdown", event => event.preventDefault());
    document.documentElement.append(panel); paint();
  }
  function paint() {
    if (!panel) return;
    panelText.textContent = state.running ? state.done + " / " + state.total + " karakter · Esc untuk berhenti" : state.message;
    panelProgress.value = state.total ? state.done / state.total * 100 : 0;
    panelButton.textContent = state.running ? "Berhenti · Esc" : "Tutup";
  }
  function stop(message) {
    if (!state.running) return;
    state.running = false; state.job++; clearTimeout(timer);
    state.message = message; paint();
    dismissTimer = setTimeout(removePanel, 8000);
  }
  function restoreSelection() {
    chosen.focus({ preventScroll: true });
    if (chosen.isContentEditable) {
      const current = chosen.getRootNode().getSelection?.() || window.getSelection();
      if (selection && chosen.contains(selection.commonAncestorContainer)) {
        current.removeAllRanges(); current.addRange(selection);
      } else {
        const range = document.createRange(); range.selectNodeContents(chosen); range.collapse(false);
        current.removeAllRanges(); current.addRange(range);
      }
    } else if (selection?.start !== null && selection?.start !== undefined) {
      chosen.setSelectionRange(selection.start, selection.end);
    }
  }
  function insert(character) {
    if (chosen.isContentEditable) {
      // Browser editor commands preserve selection and undo in standard editors.
      if (!document.execCommand("insertText", false, character)) throw new Error("Editor ini tidak mendukung pengetikan ekstensi.");
      return;
    }
    const start = chosen.selectionStart ?? chosen.value.length;
    const end = chosen.selectionEnd ?? start;
    const next = chosen.value.slice(0, start) + character + chosen.value.slice(end);
    if (chosen.maxLength >= 0 && next.length > chosen.maxLength) throw new Error("Batas panjang kolom tercapai.");
    const allowed = chosen.dispatchEvent(new InputEvent("beforeinput", { data: character, inputType: "insertText", bubbles: true, composed: true, cancelable: true }));
    if (!allowed) throw new Error("Kolom menolak input. Pengetikan dihentikan.");
    const prototype = chosen instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, "value").set.call(chosen, next);
    // Some input types do not expose a caret API.
    if (chosen.selectionStart !== null) chosen.setSelectionRange(start + character.length, start + character.length);
    chosen.dispatchEvent(new InputEvent("input", { data: character, inputType: "insertText", bubbles: true, composed: true }));
    if (chosen.value !== next) throw new Error("Aplikasi mengubah atau menolak teks. Pengetikan dihentikan.");
  }
  function start(text, delay) {
    if (state.running) return { ok: false, error: "Pengetikan masih berjalan. Hentikan terlebih dahulu." };
    capture();
    if (!editable(chosen)) return { ok: false, error: "Klik kolom tujuan di halaman, lalu buka ulang ekstensi." };
    if (typeof text !== "string" || !text.length) return { ok: false, error: "Masukkan teks terlebih dahulu." };
    if (chosen instanceof HTMLInputElement && /[\r\n]/.test(text)) return { ok: false, error: "Teks memiliki beberapa baris. Pilih kolom yang mendukung paragraf." };
    const characters = PasteRapiText.characters(text.replace(/\r\n?/g, "\n"));
    const interval = Math.max(0, Math.min(200, Number(delay) || 0));
    Object.assign(state, { running: true, done: 0, total: characters.length, message: "" });
    const job = ++state.job;
    drawPanel();
    function tick() {
      if (!state.running || job !== state.job) return;
      const batchStart = state.done;
      const startedAt = performance.now();
      // Fast mode still inserts each grapheme separately. Yield regularly so
      // the page can render and Escape / Stop can interrupt long text.
      do {
        if (!state.running || job !== state.job) return;
        if (!editable(chosen) || activeElement() !== chosen || document.hidden) { stop("Kolom atau tab berubah. Pengetikan dihentikan."); return; }
        try { insert(characters[state.done]); }
        catch (error) { stop(error.message); return; }
        state.done++;
      } while (interval === 0 && state.done < characters.length && state.done - batchStart < 64 && performance.now() - startedAt < 8);
      paint();
      if (state.done >= characters.length) { stop("Selesai. Semua teks sudah diketik."); return; }
      timer = setTimeout(tick, interval);
    }
    timer = setTimeout(() => {
      if (!state.running || job !== state.job) return;
      try { restoreSelection(); tick(); }
      catch { stop("Kolom tujuan tidak lagi tersedia."); }
    }, interval === 0 ? 80 : 350);
    return { ok: true };
  }
  document.addEventListener("keydown", event => {
    if (!state.running || !event.isTrusted) return;
    if (["Shift", "Control", "Alt", "Meta"].includes(event.key)) return;
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); }
    stop("Dihentikan karena Anda menekan tombol.");
  }, true);
  document.addEventListener("pointerdown", event => {
    if (state.running && !event.composedPath().includes(panel)) stop("Dihentikan karena Anda mengeklik halaman.");
  }, true);
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop("Tab berubah. Pengetikan dihentikan."); });
  chrome.runtime.onMessage.addListener((message, sender, reply) => {
    if (sender.id !== chrome.runtime.id) return;
    if (message.type === "PR_STATUS") reply(status());
    else if (message.type === "PR_START") reply(start(message.text, message.delay));
    else if (message.type === "PR_STOP") { stop("Dihentikan oleh Anda."); reply(status()); }
  });
  globalThis.__pasteRapiV2 = true;
  capture();
})();
