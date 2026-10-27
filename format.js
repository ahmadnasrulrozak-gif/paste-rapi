(() => {
  function tidy(text, options = {}) {
    let value = text.replace(/\r\n?/g, "\n");
    if (options.spaces) value = value.replace(/[\t ]+$/gm, "");
    if (options.paragraphs) value = value.replace(/\n(?:[\t ]*\n){2,}/g, "\n\n");
    if (options.removeBlankLines) value = value.replace(/\n(?:[^\S\n]*\n)+/g, "\n");
    if (options.lists) value = value.replace(/^([\t ]*)[•●▪◦–—-][\t ]+(?=\S)/gm, "$1• ");
    if (options.quotes) {
      value = value.replace(/(^|[\s([{])"([^"\n]+)"(?=$|[\s.,!?;:)\]}])/g, "$1“$2”");
      value = value.replace(/(^|[\s([{])'([^'\n]+)'(?=$|[\s.,!?;:)\]}])/g, "$1‘$2’");
    }
    return value;
  }
  function characters(text) {
    if (typeof Intl.Segmenter === "function") {
      return Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text), part => part.segment);
    }
    return Array.from(text);
  }
  globalThis.PasteRapiText = { tidy, characters };
})();
