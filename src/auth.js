// src/auth.js

const AuthApp = {
  async registerSiswa({ nama, email, password, kelas, absen }) {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    await db.collection("users").doc(user.uid).set({
      uid: user.uid,
      nama,
      email,
      kelas,
      absen,
      role: "siswa",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    return user;
  },

  async login(email, password) {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    return userCredential.user;
  },

  async logout() {
    await auth.signOut();
    window.location.href = "h1.html";
  },

  getCurrentUser() {
    return auth.currentUser;
  },

  async getUserProfile(uid) {
    const doc = await db.collection("users").doc(uid).get();
    return doc.exists ? doc.data() : null;
  },

  requireLogin(callback) {
    auth.onAuthStateChanged(async (user) => {
      if (!user) {
        alert("Silakan login terlebih dahulu.");
        window.location.href = "h1.html";
        return;
      }

      const profile = await AuthApp.getUserProfile(user.uid);
      callback(user, profile);
    });
  }
};