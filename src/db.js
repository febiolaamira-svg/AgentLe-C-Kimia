// src/db.js
// Penyimpanan terpusat untuk jawaban siswa ke Firebase Firestore.
// Koleksi utama: answers
// Koleksi kompatibilitas dashboard lama: jawaban

const AppDB = {
  async saveAnswer({
    subBab,
    pageKey,
    pageTitle,
    answers,
    score = null,
    status = "tersimpan"
  }) {
    const user = auth.currentUser;

    if (!user) {
      throw new Error("User belum login.");
    }

    let profile = {};
    try {
      const profileDoc = await db.collection("users").doc(user.uid).get();
      profile = profileDoc.exists ? profileDoc.data() : {};
    } catch (error) {
      console.warn("Profil user tidak terbaca, lanjut simpan dengan data lokal:", error);
      profile = {};
    }

    const docId = `${user.uid}_${pageKey}`;
    const now = firebase.firestore.FieldValue.serverTimestamp();

    const answerRef = db.collection("answers").doc(docId);
    const legacyRef = db.collection("jawaban").doc(docId);
    const progressRef = db.collection("progress").doc(docId);

    const localUser = answers?._localUser || {};

    const finalNama =
      profile.nama ||
      profile.name ||
      localUser.nama ||
      localUser.name ||
      user.displayName ||
      "";

    const finalKelas =
      profile.kelas ||
      localUser.kelas ||
      "";

    const finalAbsen =
      profile.absen ||
      profile.noAbsen ||
      localUser.absen ||
      localUser.noAbsen ||
      "";

    const finalEmail =
      user.email ||
      profile.email ||
      localUser.email ||
      "";

    const payload = {
      uid: user.uid,
      email: finalEmail,
      nama: finalNama,
      name: finalNama,
      kelas: finalKelas,
      absen: finalAbsen,
      noAbsen: finalAbsen,
      role: profile.role || "siswa",

      subBab,
      pageKey,
      pageTitle,
      halaman: pageTitle,

      answers: answers || {},
      jawaban: answers || {},

      score,
      skor: score,
      status,

      updatedAt: now,
      createdAt: now
    };

    const progressPayload = {
      uid: user.uid,
      email: finalEmail,
      nama: finalNama,
      name: finalNama,
      kelas: finalKelas,
      absen: finalAbsen,
      noAbsen: finalAbsen,

      subBab,
      pageKey,
      pageTitle,
      halaman: pageTitle,

      done: true,
      status,
      score,
      skor: score,

      updatedAt: now,
      createdAt: now
    };

    const batch = db.batch();

    batch.set(answerRef, payload, { merge: true });

    // Ditulis juga ke koleksi "jawaban"
    // agar dashboard lama yang membaca koleksi ini tetap jalan.
    batch.set(legacyRef, payload, { merge: true });

    batch.set(progressRef, progressPayload, { merge: true });

    await batch.commit();
  },

  async getAnswersBySubBab(subBab) {
    const snapshot = await db
      .collection("answers")
      .where("subBab", "==", subBab)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  async getProgressBySubBab(subBab) {
    const snapshot = await db
      .collection("progress")
      .where("subBab", "==", subBab)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
};