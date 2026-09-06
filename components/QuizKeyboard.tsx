"use client";

import { useState } from "react";
import { ChevronDown, Delete, Keyboard, Languages, Space } from "lucide-react";

const layouts = {
  en: {
    label: "English",
    dir: "ltr",
    rows: [
      ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
      ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
      ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
      ["z", "x", "c", "v", "b", "n", "m"],
    ],
  },
  ar: {
    label: "Arabic",
    dir: "rtl",
    rows: [
      ["١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩", "٠"],
      ["ض", "ص", "ث", "ق", "ف", "غ", "ع", "ه", "خ", "ح", "ج", "د"],
      ["ش", "س", "ي", "ب", "ل", "ا", "ت", "ن", "م", "ك", "ط"],
      ["ئ", "ء", "ؤ", "ر", "لا", "ى", "ة", "و", "ز", "ظ", "ذ"],
    ],
  },
  ml: {
    label: "Malayalam",
    dir: "ltr",
    rows: [
      ["൧", "൨", "൩", "൪", "൫", "൬", "൭", "൮", "൯", "൦"],
      ["അ", "ആ", "ഇ", "ഈ", "ഉ", "ഊ", "എ", "ഏ", "ഐ", "ഒ", "ഓ", "ഔ"],
      ["ക", "ഖ", "ഗ", "ഘ", "ങ", "ച", "ജ", "ഞ", "ട", "ഡ", "ണ"],
      ["ത", "ദ", "ന", "പ", "ഫ", "ബ", "മ", "യ", "ര", "ല", "വ"],
      ["ശ", "ഷ", "സ", "ഹ", "ള", "ഴ", "റ", "ൺ", "ൻ", "ർ", "ൽ", "ൾ"],
      ["ാ", "ി", "ീ", "ു", "ൂ", "ൃ", "െ", "േ", "ൈ", "ൊ", "ോ", "ൗ", "്", "ം"],
    ],
  },
};

type Lang = keyof typeof layouts;

export function QuizKeyboard({ inputId }: { inputId: string }) {
  const [lang, setLang] = useState<Lang>("en");
  const [open, setOpen] = useState(false);
  const layout = layouts[lang];

  function input() {
    return document.getElementById(inputId) as HTMLInputElement | null;
  }

  function insert(value: string) {
    const field = input();
    if (!field) return;
    const start = field.selectionStart ?? field.value.length;
    const end = field.selectionEnd ?? field.value.length;
    field.value = field.value.slice(0, start) + value + field.value.slice(end);
    field.dir = layout.dir;
    field.focus();
    field.setSelectionRange(start + value.length, start + value.length);
  }

  function backspace() {
    const field = input();
    if (!field) return;
    const start = field.selectionStart ?? field.value.length;
    const end = field.selectionEnd ?? field.value.length;
    if (start !== end) {
      field.value = field.value.slice(0, start) + field.value.slice(end);
      field.setSelectionRange(start, start);
    } else if (start > 0) {
      field.value = field.value.slice(0, start - 1) + field.value.slice(end);
      field.setSelectionRange(start - 1, start - 1);
    }
    field.focus();
  }

  return (
    <div className={`kbd ${open ? "open" : ""}`}>
      <div className="kbd-top">
        <button type="button" className="kbd-toggle" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
          <Keyboard size={16} />
          Virtual keyboard
          <ChevronDown size={15} />
        </button>
        <div className="kbd-langs">
          {(Object.keys(layouts) as Lang[]).map((key) => (
            <button type="button" className={lang === key ? "primary" : ""} key={key} onClick={() => setLang(key)}>
              <Languages size={15} />
              {layouts[key].label}
            </button>
          ))}
        </div>
      </div>

      {open ? (
        <div className="kbd-board" dir={layout.dir}>
          {layout.rows.map((row, index) => (
            <div className="kbd-row" key={index}>
              {row.map((key) => (
                <button type="button" key={key} onClick={() => insert(key)}>
                  {key}
                </button>
              ))}
            </div>
          ))}
          <div className="kbd-row">
            <button type="button" onClick={backspace}><Delete size={15} /> Back</button>
            <button type="button" onClick={() => insert(" ")}><Space size={15} /> Space</button>
            <button type="button" onClick={() => { const field = input(); if (field) field.value = ""; }}>Clear</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
