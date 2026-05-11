async function loadDashboardSubBab(subBab, targetTableBodyId) {
  const tbody = document.getElementById(targetTableBodyId);

  if (!tbody) {
    console.error("Target table body tidak ditemukan:", targetTableBodyId);
    return;
  }

  tbody.innerHTML = `
    <tr>
      <td colspan="7">Memuat data...</td>
    </tr>
  `;

  try {
    const snapshot = await db
      .collection("answers")
      .where("subBab", "==", subBab)
      .get();

    const rows = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    if (rows.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7">Belum ada data jawaban untuk ${subBab}.</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = rows.map((row) => {
      const jawabanText = JSON.stringify(row.jawaban || row.answers || {}, null, 2);

      return `
        <tr>
          <td>${row.nama || "-"}</td>
          <td>${row.kelas || "-"}</td>
          <td>${row.absen || row["no absen"] || "-"}</td>
          <td>${row.email || row["e-mail"] || "-"}</td>
          <td>${row.halaman || row.pageTitle || row.pageKey || "-"}</td>
          <td>${row.skor ?? row.score ?? "-"}</td>
          <td>
            <pre style="white-space:pre-wrap; max-width:420px; max-height:220px; overflow:auto;">${jawabanText}</pre>
          </td>
        </tr>
      `;
    }).join("");

  } catch (error) {
    console.error("ERROR FIREBASE:", error);

    tbody.innerHTML = `
      <tr>
        <td colspan="7">Gagal memuat data dari Firebase.</td>
      </tr>
    `;
  }
}