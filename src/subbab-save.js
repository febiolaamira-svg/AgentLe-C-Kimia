// src/subbab-save.js
// Autosave seluruh input halaman ke Firebase.
// Dipakai di hlm1-2.html sampai hlm8.html.

function readText(selector) {
  const el = document.querySelector(selector);
  return el ? el.textContent.trim() : "";
}

function parseScoreFromText(text) {
  if (!text) return null;
  const match = String(text).match(/-?\d+(?:[.,]\d+)?/);
  return match ? Number(match[0].replace(",", ".")) : null;
}

function getPageScore() {
  const scoreFromHud = parseScoreFromText(readText("#scoreTxt"));
  if (scoreFromHud !== null && !Number.isNaN(scoreFromHud)) return scoreFromHud;

  const scoreFromFinal = parseScoreFromText(readText("#finalTitle"));
  if (scoreFromFinal !== null && !Number.isNaN(scoreFromFinal)) return scoreFromFinal;

  return null;
}

function getSafeLocalStorage(key) {
  try {
    const value = localStorage.getItem(key);
    if (!value) return null;
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
}

function collectPageAnswers() {
  const data = {};
  const checkboxGroups = {};

  document.querySelectorAll("input, textarea, select").forEach((el) => {
    const key = el.name || el.id;
    if (!key) return;

    if (el.type === "password") return;

    if (el.type === "radio") {
      if (el.checked) data[key] = el.value;
      return;
    }

    if (el.type === "checkbox") {
      if (el.name && document.querySelectorAll(`input[type=\"checkbox\"][name=\"${CSS.escape(el.name)}\"]`).length > 1) {
        checkboxGroups[key] = checkboxGroups[key] || [];
        if (el.checked) checkboxGroups[key].push(el.value || true);
      } else {
        data[key] = el.checked;
      }
      return;
    }

    data[key] = el.value;
  });

  Object.assign(data, checkboxGroups);

  // Tambahan khusus halaman drill/rekap agar skor dan hasil akhir juga ikut tersimpan.
  const page7Result = getSafeLocalStorage("KI_Page7_LastResult");
  if (page7Result) data.KI_Page7_LastResult = page7Result;

  const currentUser = getSafeLocalStorage("KI_CURRENT_USER");
  if (currentUser) {
    data._localUser = {
      nama: currentUser.nama || currentUser.name || "",
      kelas: currentUser.kelas || "",
      absen: currentUser.absen || currentUser.noAbsen || "",
      email: currentUser.email || ""
    };
  }

  data._meta = {
    url: location.pathname.split("/").pop() || location.pathname,
    title: document.title,
    savedClientAt: new Date().toISOString(),
    scoreText: readText("#scoreTxt") || readText("#finalTitle") || ""
  };

  return data;
}

function activateAutoSave({ subBab, pageKey, pageTitle }) {
  let timer = null;
  let saving = false;

  async function saveNow(status = "autosave") {
    const user = auth.currentUser;

    if (!user) {
      console.warn("Belum login, data belum disimpan ke Firebase.");
      return;
    }

    if (saving) return;
    saving = true;

    const answers = collectPageAnswers();
    const score = getPageScore();

    try {
      await AppDB.saveAnswer({
        subBab,
        pageKey,
        pageTitle,
        answers,
        score,
        status
      });

      console.log(`Tersimpan ke Firebase: ${pageKey} (${status})`);
    } catch (error) {
      console.error("Gagal menyimpan ke Firebase:", error);
    } finally {
      saving = false;
    }
  }

  function scheduleSave(status = "autosave", delay = 800) {
    clearTimeout(timer);
    timer = setTimeout(() => saveNow(status), delay);
  }

  document.addEventListener("input", () => scheduleSave("autosave"));
  document.addEventListener("change", () => scheduleSave("autosave"));

  document.addEventListener("click", (e) => {
    if (e.target.closest("button") || e.target.closest("a")) {
      scheduleSave("tersimpan dari aksi siswa", 250);
    }
  });

  window.addEventListener("beforeunload", () => {
    // Firestore async tidak selalu selesai ketika beforeunload, tapi tetap dicoba.
    saveNow("tersimpan saat keluar halaman");
  });

  window.saveCurrentPageToFirebase = saveNow;

  // Simpan jejak halaman saat halaman berhasil dibuka oleh user login.
  setTimeout(() => saveNow("halaman dibuka"), 900);
}
