// O'zbek kirill → lotin transliteratsiyasi (Muhammad Sodiq tarjimasi kirillda keladi)
const MAP = {
  а: "a", б: "b", в: "v", г: "g", ғ: "gʻ", д: "d", ё: "yo", ж: "j", з: "z", и: "i", й: "y",
  к: "k", қ: "q", л: "l", м: "m", н: "n", о: "o", ў: "oʻ", п: "p", р: "r", с: "s", т: "t",
  у: "u", ф: "f", х: "x", ҳ: "h", ч: "ch", ш: "sh", щ: "sh", ъ: "ʼ", ь: "", ы: "i", э: "e",
  ю: "yu", я: "ya", ц: "s",
};
const VOWELS = "аеёиоуўэюяaeiou";
const isUpper = (c) => c !== c.toLowerCase();
const isLetter = (c) => !!c && c.toLowerCase() !== c.toUpperCase();

export function cyrToLat(text) {
  if (!text) return "";
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const low = ch.toLowerCase();
    let rep;
    if (low === "е") {
      const prev = (text[i - 1] || "").toLowerCase();
      rep = !isLetter(prev) || VOWELS.includes(prev) || prev === "ъ" || prev === "ь" ? "ye" : "e";
    } else if (low === "ц") {
      const prev = (text[i - 1] || "").toLowerCase();
      rep = VOWELS.includes(prev) ? "ts" : "s";
    } else if (low in MAP) {
      rep = MAP[low];
    } else {
      out += ch;
      continue;
    }
    if (isUpper(ch) && rep) {
      const next = text[i + 1];
      const wordUpper = next && isLetter(next) && isUpper(next);
      rep = wordUpper ? rep.toUpperCase() : rep[0].toUpperCase() + rep.slice(1);
    }
    out += rep;
  }
  return out;
}
