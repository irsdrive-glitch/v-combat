// V-Combat prototipe v0.2: dengan fitur perbandingan atlet ala Football Manager
const VC = (() => {
  const $ = (s, r = document) => r.querySelector(s);
  const store = { get(k, d){ try{ const v = localStorage.getItem("vc_" + k); return v ? JSON.parse(v) : d; }catch(e){ return d; } }, set(k, v){ try{ localStorage.setItem("vc_" + k, JSON.stringify(v)); }catch(e){} } };
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const LV = ["Kurang", "Cukup", "Baik", "Sangat baik"];
  
  const TES = [
    { id:"sprint", nama:"Sprint 20 m", sat:"detik", arah:"kecil", kel:"Kecepatan", thr:[4.6, 4.2, 3.9] },
    { id:"lompat", nama:"Lompat tegak", sat:"cm", arah:"besar", kel:"Daya ledak", thr:[18, 24, 30] },
    { id:"lari", nama:"Lari 12 menit", sat:"m", arah:"besar", kel:"Daya tahan", thr:[1300, 1600, 1900] },
    { id:"situp", nama:"Sit-up 1 menit", sat:"kali", arah:"besar", kel:"Kekuatan", thr:[15, 22, 28] },
    { id:"shuttle", nama:"Shuttle run 4x5 m", sat:"detik", arah:"kecil", kel:"Kelincahan", thr:[10.5, 9.8, 9.2] },
    { id:"reach", nama:"Sit and reach", sat:"cm", arah:"besar", kel:"Lentur", thr:[5, 10, 15] },
    { id:"tendang", nama:"Tendangan 10 detik (aplikasi 1)", sat:"kali", arah:"besar", kel:"Teknik", thr:[8, 11, 14] }
  ];
  const KAT = ["Tanding", "Tunggal", "Regu", "Ganda"];
  
  const ATLET = Array.from({ length:12 }, (_, i) => {
    const tinggi = 125 + Math.round(rnd() * 25);
    const idStr = "A" + String(i + 1).padStart(2, "0");
    return { 
      id: idStr, 
      nama:"Atlet " + String(i + 1).padStart(2, "0"), 
      jk:i % 2 ? "L" : "P", 
      usia:8 + Math.floor(rnd() * 5),
      kat:[KAT[i % 4]].concat(i % 5 === 0 ? ["Regu"] : []), 
      izin:i % 4 !== 3, 
      tinggi, 
      berat:24 + Math.round(rnd() * 14),
      ukur:i % 6 === 5 ? "Agu 2026" : "Nov 2026", 
      riw:[0, 1, 2, 3, 4].map(k => +(tinggi - (4 - k) * 0.8).toFixed(1)),
      foto: i === 0 ? "aset/foto/atlet01.jpg" : "" 
    };
  });

  const HASIL0 = {};
  ATLET.forEach(a => { HASIL0[a.id] = {}; TES.forEach(t => {
    if(a.id === "A05" && t.id === "lompat") return;
    const [a1, , a3] = t.thr, lo = t.arah === "besar" ? a1 * 0.8 : a3 * 0.9, hi = t.arah === "besar" ? a3 * 1.15 : a1 * 1.1;
    const v = lo + rnd() * (hi - lo); HASIL0[a.id][t.id] = t.sat === "detik" ? +v.toFixed(1) : Math.round(v);
  }); });
  
  let bench = store.get("bench", null) || Object.fromEntries(TES.map(t => [t.id, { arah:t.arah, sat:t.sat, thr:t.thr.slice() }]));
  let hasil = store.get("hasil", null) || HASIL0;
  const level = (v, b) => {
    const [t1, t2, t3] = b.thr;
    if(b.arah === "besar") return v >= t3 ? 3 : v >= t2 ? 2 : v >= t1 ? 1 : 0;
    return v <= t3 ? 3 : v <= t2 ? 2 : v <= t1 ? 1 : 0;
  };
  const pill = (v, t) => v == null ? '<span class="muted">-</span>' : v + ' <span class="pill L' + level(v, bench[t.id]) + '">' + LV[level(v, bench[t.id])] + '</span>';
  const skor = (id, t) => { const v = hasil[id] && hasil[id][t.id]; return v == null ? 0 : (level(v, bench[t.id]) + 1) / 4; };

  // ---------- grafik SVG ----------
  function radar(vals, tgt, labels, S = 300){
    const c = S / 2, R = S * 0.28, n = vals.length, ang = i => -Math.PI / 2 + i * 2 * Math.PI / n;
    const pt = (i, f) => [c + Math.cos(ang(i)) * R * f, c + Math.sin(ang(i)) * R * f].map(x => x.toFixed(1)).join(",");
    const poly = a => a.map((f, i) => pt(i, f)).join(" ");
    const ring = f => poly(Array(n).fill(f));
    const axes = vals.map((_, i) => { const [x, y] = pt(i, 1).split(","); return '<line x1="' + c + '" y1="' + c + '" x2="' + x + '" y2="' + y + '"/>'; }).join("");
    const lab = labels.map((t, i) => { const x = c + Math.cos(ang(i)) * (R + 14), y = c + Math.sin(ang(i)) * (R + 14); return '<text x="' + x.toFixed(1) + '" y="' + (y + 4).toFixed(1) + '" font-size="11" fill="#8fa0c0" text-anchor="' + (Math.abs(x - c) < 4 ? "middle" : x > c ? "start" : "end") + '">' + t + '</text>'; }).join("");
    return '<svg viewBox="0 0 ' + S + ' ' + S + '" class="radar" role="img" aria-label="Radar tes fisik"><g fill="none" stroke="#22345a">' + [1, 0.67, 0.33].map(f => '<polygon points="' + ring(f) + '"/>').join("") + axes + '</g><polygon points="' + poly(tgt) + '" fill="none" stroke="#d4ee3a" stroke-dasharray="5 4"/><polygon points="' + poly(vals) + '" fill="rgba(47,196,178,.3)" stroke="#2fc4b2" stroke-width="2"/>' + lab + '</svg>';
  }

  // Radar Perbandingan 2 Atlet (ala Football Manager)
  function radarCompare(vals1, vals2, labels, S = 320){
    const c = S / 2, R = S * 0.28, n = vals1.length, ang = i => -Math.PI / 2 + i * 2 * Math.PI / n;
    const pt = (i, f) => [c + Math.cos(ang(i)) * R * f, c + Math.sin(ang(i)) * R * f].map(x => x.toFixed(1)).join(",");
    const poly = a => a.map((f, i) => pt(i, f)).join(" ");
    const ring = f => poly(Array(n).fill(f));
    const axes = vals1.map((_, i) => { const [x, y] = pt(i, 1).split(","); return '<line x1="' + c + '" y1="' + c + '" x2="' + x + '" y2="' + y + '"/>'; }).join("");
    const lab = labels.map((t, i) => { const x = c + Math.cos(ang(i)) * (R + 16), y = c + Math.sin(ang(i)) * (R + 16); return '<text x="' + x.toFixed(1) + '" y="' + (y + 4).toFixed(1) + '" font-size="11" fill="#8fa0c0" text-anchor="' + (Math.abs(x - c) < 4 ? "middle" : x > c ? "start" : "end") + '">' + t + '</text>'; }).join("");
    return '<svg viewBox="0 0 ' + S + ' ' + S + '" class="radar" style="max-width:360px;margin:0 auto;display:block" role="img" aria-label="Radar perbandingan atlet">' +
      '<g fill="none" stroke="#22345a">' + [1, 0.75, 0.5, 0.25].map(f => '<polygon points="' + ring(f) + '"/>').join("") + axes + '</g>' +
      '<polygon points="' + poly(vals1) + '" fill="rgba(47,196,178,.28)" stroke="#2fc4b2" stroke-width="2.5"/>' +
      '<polygon points="' + poly(vals2) + '" fill="rgba(255,122,61,.28)" stroke="#ff7a3d" stroke-width="2.5"/>' +
      lab + '</svg>';
  }

  function line(vals, labels, tgt, w = 320, h = 130){
    const lo = Math.min(...vals, tgt ?? Infinity) - 0.2 * (Math.max(...vals) - Math.min(...vals) || 1), hi = Math.max(...vals, tgt ?? -Infinity) + 0.2 * (Math.max(...vals) - Math.min(...vals) || 1);
    const X = i => 24 + i * (w - 40) / Math.max(1, vals.length - 1), Y = v => 10 + (h - 34) * (1 - (v - lo) / (hi - lo || 1));
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" style="width:100%;max-width:460px" role="img" aria-label="Grafik tren">' +
      (tgt != null ? '<line x1="24" x2="' + (w - 16) + '" y1="' + Y(tgt) + '" y2="' + Y(tgt) + '" stroke="#d4ee3a" stroke-dasharray="6 4"/>' : '') +
      '<polyline fill="none" stroke="#2fc4b2" stroke-width="2.5" points="' + vals.map((v, i) => X(i) + "," + Y(v)).join(" ") + '"/>' +
      vals.map((v, i) => '<circle cx="' + X(i) + '" cy="' + Y(v) + '" r="3.5" fill="#2fc4b2"/><text x="' + X(i) + '" y="' + (h - 6) + '" font-size="11" fill="#8fa0c0" text-anchor="middle">' + (labels[i] || "") + '</text>').join("") + '</svg>';
  }

  // ---------- kerangka halaman ----------
  const NAV = [
    ["beranda", "Beranda", "pelatih analis atlet"], 
    ["atlet", "Atlet", "pelatih analis"], 
    ["perbandingan", "Perbandingan", "pelatih analis"],
    ["profil.html?id=A07", "Profil saya", "atlet"], 
    ["tes-fisik", "Tes fisik", "pelatih analis atlet"], 
    ["latihan", "Latihan", "pelatih analis"], 
    ["pertandingan", "Pertandingan", "pelatih analis"], 
    ["laporan", "Laporan", "pelatih analis atlet"], 
    ["pengaturan", "Pengaturan", "pelatih"]
  ];

  function page(active, title, key){
    const role = store.get("role", "pelatih");
    document.title = title + " | V-Combat";
    const nav = NAV.filter(n => n[2].includes(role)).map(n => '<a href="' + (n[0].includes(".html") ? n[0] : n[0] + ".html") + '"' + (n[0] === active ? ' class="on"' : '') + '>' + n[1] + '</a>').join("");
    document.body.innerHTML = '<div class="app"><nav class="side"><div class="logo"><b>V</b>-Combat</div><div class="org">Perguruan Contoh</div>' + nav +
      '<div class="me"><span class="muted">Masuk sebagai</span><select id="vcRole"><option value="pelatih">Pelatih</option><option value="analis">Analis</option><option value="atlet">Atlet / wali</option></select><a href="masuk.html" class="sm">Keluar</a></div></nav>' +
      '<main><div class="top"><h1>' + title + '</h1></div><div class="banner noprint">Prototipe: semua data dan angka benchmark hanya contoh, bukan norma resmi. Perubahan hanya tersimpan di browser ini.</div><div id="view" style="display:grid;gap:14px"></div></main></div>';
    $("#vcRole").value = role;
    $("#vcRole").onchange = e => { store.set("role", e.target.value); location.href = e.target.value === "atlet" ? "beranda.html" : location.pathname.split("/").pop(); };
    PAGES[key || active.split(".")[0]]($("#view"));
  }
  const kpi = (l, v, s = "") => '<div class="card kpi"><small>' + l + '</small><b>' + v + '</b> <span class="muted sm">' + s + '</span></div>';
  const atletById = id => ATLET.find(a => a.id === id) || ATLET[0];

  function renderAvatar(a, borderColor = "") {
    const borderStyle = borderColor ? 'border: 2px solid ' + borderColor + ';' : '';
    if (a.foto) {
      return '<div class="avatar" style="overflow:hidden; padding:0; ' + borderStyle + '"><img src="' + a.foto + '" alt="' + a.nama + '" style="width:100%; height:100%; object-fit:cover;"></div>';
    }
    return '<div class="avatar" style="' + borderStyle + '">' + a.id + '</div>';
  }

  // ---------- halaman ----------
  const PAGES = {};
  PAGES.beranda = el => {
    let kat = "Semua";
    const draw = () => {
      const A = ATLET.filter(a => kat === "Semua" || a.kat.includes(kat));
      const perlu = [[A.filter(a => a.ukur !== "Nov 2026").length, "atlet: antropometri belum diperbarui"], [A.filter(a => !a.izin).length, "atlet: persetujuan wali belum lengkap"], [A.filter(a => hasil[a.id].lompat == null).length, "atlet: lompat tegak belum diinput"]];
      el.innerHTML = '<div class="row">' + ["Semua", ...KAT].map(k => '<button class="chip' + (k === kat ? ' on' : '') + '" data-k="' + k + '">' + k + '</button>').join("") + '</div>' +
        '<div class="kpis">' + kpi("Atlet aktif", A.length) + kpi("Tes bulan ini", A.length * 3) + kpi("Sesi latihan", 22, "minggu ini") + kpi("Pertandingan", 4, "dianalisis") + '</div>' +
        '<div class="g2"><div class="card"><h2>Skor tes rata-rata tim</h2>' + line([2.1, 2.3, 2.6, 2.9, 3.2], ["Jul", "Agu", "Sep", "Okt", "Nov"], 3) + '<div class="muted sm">garis putus-putus = target benchmark</div></div>' +
        '<div class="card"><h2>Perlu perhatian</h2><ul class="list">' + perlu.map(p => '<li><span class="dot" style="background:' + (p[0] ? "#ff7a3d" : "#2fc4b2") + '"></span>' + p[0] + " " + p[1] + '</li>').join("") + '</ul></div></div>' +
        '<div class="g2"><div class="card"><h2>Akses cepat</h2><div class="row"><a class="btn pri" href="latihan.html">Latihan kamera</a><a class="btn" href="perbandingan.html">Bandingkan atlet</a><a class="btn" href="tes-fisik.html">Input tes fisik</a><a class="btn" href="pertandingan.html">Analisis pertandingan</a></div></div>' +
        '<div class="card"><h2>Aktivitas terbaru</h2><ul class="list"><li><span class="dot" style="background:#d4ee3a"></span>Latihan tendangan, Atlet 07 <span class="muted">2 jam lalu</span></li><li><span class="dot" style="background:#2fc4b2"></span>Tes sprint 20 m, Kelompok A <span class="muted">kemarin</span></li><li><span class="dot" style="background:#ff5a4d"></span>Analisis pertandingan, ronde 2 <span class="muted">2 hari lalu</span></li></ul></div></div>';
      el.querySelectorAll("[data-k]").forEach(b => b.onclick = () => { kat = b.dataset.k; draw(); });
    };
    draw();
  };

  PAGES.atlet = el => {
    el.innerHTML = '<div class="card"><div class="row" style="margin-bottom:10px"><input id="q" placeholder="Cari nama atau ID"><select id="fk"><option value="">Semua kategori</option>' + KAT.map(k => '<option>' + k + '</option>').join("") + '</select><a class="btn" href="perbandingan.html">Bandingkan Atlet</a><button class="pri" id="add" title="Belum aktif di prototipe">+ Atlet</button></div><div class="scroll"><table id="t"></table></div></div>';
    const draw = () => {
      const q = $("#q").value.toLowerCase(), k = $("#fk").value;
      $("#t").innerHTML = '<tr><th>Foto</th><th>ID</th><th>Nama</th><th>Usia</th><th>JK</th><th>Kategori</th><th>Tinggi</th><th>Berat</th><th>Izin wali</th></tr>' +
        ATLET.filter(a => (!q || (a.nama + a.id).toLowerCase().includes(q)) && (!k || a.kat.includes(k))).map(a => {
          const thumbHtml = a.foto ? '<img src="' + a.foto + '" style="width:32px; height:32px; border-radius:50%; object-fit:cover;">' : '<span class="muted">-</span>';
          return '<tr><td>' + thumbHtml + '</td><td>' + a.id + '</td><td><a href="profil.html?id=' + a.id + '">' + a.nama + '</a></td><td>' + a.usia + '</td><td>' + a.jk + '</td><td>' + a.kat.join(", ") + '</td><td>' + a.tinggi + ' cm</td><td>' + a.berat + ' kg</td><td>' + (a.izin ? "lengkap" : '<span style="color:#ff7a3d">belum</span>') + '</td></tr>';
        }).join("");
    };
    $("#q").oninput = $("#fk").onchange = draw; $("#add").onclick = () => alert("Tambah atlet belum aktif di prototipe."); draw();
  };

  // Halaman Perbandingan Atlet (Football Manager Style)
  PAGES.perbandingan = el => {
    let id1 = "A01", id2 = "A02";
    const T6 = TES.slice(0, 6);

    const draw = () => {
      const a1 = atletById(id1), a2 = atletById(id2);
      const vals1 = T6.map(t => skor(a1.id, t));
      const vals2 = T6.map(t => skor(a2.id, t));
      const imt1 = (a1.berat / Math.pow(a1.tinggi / 100, 2)).toFixed(1);
      const imt2 = (a2.berat / Math.pow(a2.tinggi / 100, 2)).toFixed(1);

      const pilihAtlet = (selId, currentId) => '<select id="' + selId + '" style="flex:1">' + 
        ATLET.map(a => '<option value="' + a.id + '"' + (a.id === currentId ? ' selected' : '') + '>' + a.id + ' - ' + a.nama + ' (' + a.jk + ', ' + a.usia + ' th)</option>').join("") + '</select>';

      // Helper penentu keunggulan angka pada tabel
      const compareRow = (label, v1, v2, sat = "", arah = "besar") => {
        let c1 = "", c2 = "";
        if (v1 != null && v2 != null && v1 !== v2) {
          const a1Wins = arah === "besar" ? v1 > v2 : v1 < v2;
          if (a1Wins) c1 = 'color:#2fc4b2; font-weight:800;';
          else c2 = 'color:#ff7a3d; font-weight:800;';
        }
        return '<tr>' +
          '<td style="text-align:right; ' + c1 + '">' + (v1 ?? "-") + (v1 != null ? " " + sat : "") + '</td>' +
          '<td class="muted" style="text-align:center; font-size:12px;">' + label + '</td>' +
          '<td style="text-align:left; ' + c2 + '">' + (v2 ?? "-") + (v2 != null ? " " + sat : "") + '</td>' +
        '</tr>';
      };

      el.innerHTML = 
        // Header Pemilih 2 Atlet
        '<div class="g2">' +
          '<div class="card" style="border-top: 3px solid #2fc4b2;">' +
            '<div class="row" style="margin-bottom:12px"><span class="dot" style="background:#2fc4b2"></span>' + pilihAtlet("selA1", id1) + '</div>' +
            '<div class="row" style="gap:12px">' + renderAvatar(a1, "#2fc4b2") + 
              '<div><b style="font-size:18px">' + a1.nama + '</b><div class="muted sm">' + (a1.jk === "P" ? "Putri" : "Putra") + ' · ' + a1.usia + ' tahun · ' + a1.kat.join(", ") + '</div></div>' +
            '</div>' +
          '</div>' +
          '<div class="card" style="border-top: 3px solid #ff7a3d;">' +
            '<div class="row" style="margin-bottom:12px"><span class="dot" style="background:#ff7a3d"></span>' + pilihAtlet("selA2", id2) + '</div>' +
            '<div class="row" style="gap:12px">' + renderAvatar(a2, "#ff7a3d") + 
              '<div><b style="font-size:18px">' + a2.nama + '</b><div class="muted sm">' + (a2.jk === "P" ? "Putri" : "Putra") + ' · ' + a2.usia + ' tahun · ' + a2.kat.join(", ") + '</div></div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        // Radar Overlay & Tabel Antropometri
        '<div class="g2">' +
          '<div class="card">' +
            '<h2>Radar Perbandingan Atribut Fisik</h2>' +
            radarCompare(vals1, vals2, T6.map(t => t.kel)) +
            '<div class="row" style="justify-content:center; gap:20px; margin-top:8px; font-size:13px;">' +
              '<span><span class="dot" style="background:#2fc4b2"></span> <b>' + a1.nama + '</b></span>' +
              '<span><span class="dot" style="background:#ff7a3d"></span> <b>' + a2.nama + '</b></span>' +
            '</div>' +
          '</div>' +

          '<div class="card">' +
            '<h2>Perbandingan Head-to-Head</h2>' +
            '<table>' +
              '<tr><th style="text-align:right; color:#2fc4b2">' + a1.nama + '</th><th style="text-align:center">Parameter</th><th style="text-align:left; color:#ff7a3d">' + a2.nama + '</th></tr>' +
              compareRow("Tinggi Badan", a1.tinggi, a2.tinggi, "cm", "besar") +
              compareRow("Berat Badan", a1.berat, a2.berat, "kg", "besar") +
              compareRow("IMT", +imt1, +imt2, "", "netral") +
              TES.map(t => compareRow(t.nama, hasil[a1.id][t.id], hasil[a2.id][t.id], t.sat, t.arah)).join("") +
            '</table>' +
            '<div class="muted sm" style="margin-top:8px; text-align:center;">Angka berwarna menandakan catatan tes lebih unggul.</div>' +
          '</div>' +
        '</div>';

      $("#selA1").onchange = e => { id1 = e.target.value; draw(); };
      $("#selA2").onchange = e => { id2 = e.target.value; draw(); };
    };
    draw();
  };

  function ringkasan(a){
    const T6 = TES.slice(0, 6), vals = T6.map(t => skor(a.id, t));
    const imt = (a.berat / Math.pow(a.tinggi / 100, 2)).toFixed(1), seed2 = a.usia + a.tinggi;
    return '<div class="g2"><div class="card"><h2>Antropometri <span class="muted sm">diukur ' + a.ukur + '</span></h2><table><tr><td class="muted">Tinggi</td><td>' + a.tinggi + ' cm</td></tr><tr><td class="muted">Berat</td><td>' + a.berat + ' kg</td></tr><tr><td class="muted">IMT</td><td>' + imt + '</td></tr><tr><td class="muted">Panjang tungkai</td><td>' + Math.round(a.tinggi * 0.52) + ' cm</td></tr><tr><td class="muted">Rentang lengan</td><td>' + (a.tinggi - 2) + ' cm</td></tr></table>' + line(a.riw, ["Jul", "Agu", "Sep", "Okt", "Nov"]) + '</div>' +
      '<div class="card"><h2>Tes fisik dibanding benchmark</h2>' + radar(vals, T6.map(() => 0.75), T6.map(t => t.kel)) + '<div class="muted sm" style="text-align:center">hijau = atlet, putus-putus = target (tingkat Baik)</div></div>' +
      '<div class="card"><h2>Latihan tendangan <span class="muted sm">aplikasi 1</span></h2><table><tr><td class="muted">Jumlah</td><td>' + (30 + seed2 % 15) + '</td></tr><tr><td class="muted">Kec. tercepat</td><td>' + (36 + seed2 % 10) + ' km/j</td></tr><tr><td class="muted">Tinggi tertinggi</td><td>+' + (15 + seed2 % 12) + ' cm</td></tr><tr><td class="muted">Kiri / kanan</td><td>' + (16 + seed2 % 5) + ' / ' + (17 + seed2 % 6) + '</td></tr></table></div>' +
      '<div class="card"><h2>Izin dan catatan</h2><ul class="list"><li>' + (a.izin ? "Persetujuan wali: lengkap" : '<span style="color:#ff7a3d">Persetujuan wali: belum lengkap</span>') + '</li><li>Data antropometri: ' + a.ukur + '</li><li class="muted">Catatan pelatih: (contoh) fokus tendangan kiri</li></ul></div></div>';
  }

  PAGES.profil = el => {
    const a = atletById(new URLSearchParams(location.search).get("id")), role = store.get("role", "pelatih");
    let tab = "Ringkasan", riw = a.riw.slice();
    const tabs = ["Ringkasan", "Antropometri", "Tes fisik", "Latihan teknik", "Pertandingan"];
    const body = {
      "Ringkasan": () => ringkasan(a),
      "Antropometri": () => '<div class="card"><h2>Riwayat tinggi (cm)</h2>' + line(riw, riw.map((_, i) => "P" + (i + 1))) + (role === "pelatih" ? '<div class="row" style="margin-top:10px"><input id="nv" type="number" placeholder="Tinggi baru (cm)"><button class="pri" id="nb">Tambah pengukuran</button></div>' : '') + '</div>',
      "Tes fisik": () => '<div class="card scroll"><table><tr><th>Tes</th><th>Kelompok</th><th>Hasil</th></tr>' + TES.map(t => '<tr><td>' + t.nama + '</td><td>' + t.kel + '</td><td>' + pill(hasil[a.id][t.id], t) + ' <span class="muted sm">' + t.sat + '</span></td></tr>').join("") + '</table></div>',
      "Latihan teknik": () => '<div class="card"><h2>Tren jumlah tendangan per sesi</h2>' + line([28, 31, 34, 33, 38], ["S1", "S2", "S3", "S4", "S5"]) + '<p class="muted sm">Data contoh. Nanti terisi otomatis dari aplikasi 1.</p></div>',
      "Pertandingan": () => '<div class="card"><h2>Riwayat pertandingan</h2><p class="muted">Data contoh. Nanti terisi dari aplikasi 2: 12 Nov 2026, Tanding, ronde 2 dari 3, tendangan 18, pukulan 22, jatuhan 1.</p></div>'
    };
    const draw = () => {
      el.innerHTML = '<div class="card row" style="gap:14px">' + renderAvatar(a) + '<div style="flex:1;min-width:200px"><b style="font-size:19px">' + a.nama + '</b><div class="muted">' + (a.jk === "P" ? "Putri" : "Putra") + ' · ' + a.usia + ' tahun · ' + a.kat.join(", ") + ' · Usia dini</div></div><div class="row noprint"><a class="btn" href="perbandingan.html">Bandingkan</a><a class="btn pri" href="latihan.html">Latihan kamera</a></div></div>' +
        '<div class="tabs noprint">' + tabs.map(t => '<button class="' + (t === tab ? "on" : "") + '" data-t="' + t + '">' + t + '</button>').join("") + '</div>' + body[tab]();
      el.querySelectorAll("[data-t]").forEach(b => b.onclick = () => { tab = b.dataset.t; draw(); });
      const nb = $("#nb"); if(nb) nb.onclick = () => { const v = parseFloat($("#nv").value); if(v > 50){ riw.push(v); draw(); } };
    };
    draw();
  };

  PAGES["tes-fisik"] = el => {
    let tab = "Input tes", tesId = "sprint";
    const draw = () => {
      const tabs = '<div class="tabs">' + ["Input tes", "Hasil", "Benchmark"].map(t => '<button class="' + (t === tab ? "on" : "") + '" data-t="' + t + '">' + t + '</button>').join("") + '</div>';
      let body = "";
      if(tab === "Input tes"){
        const t = TES.find(x => x.id === tesId);
        body = '<div class="card"><div class="row" style="margin-bottom:10px"><select id="st">' + TES.map(x => '<option value="' + x.id + '"' + (x.id === tesId ? " selected" : "") + '>' + x.nama + '</option>').join("") + '</select><input type="date" value="2026-11-22"><button class="pri" id="sv">Simpan</button><span id="ok" class="muted sm"></span></div><div class="scroll"><table><tr><th>Atlet</th><th>Hasil (' + t.sat + ')</th><th>Tingkat</th></tr>' + ATLET.map(a => '<tr><td>' + a.nama + '</td><td><input type="number" step="any" data-a="' + a.id + '" value="' + (hasil[a.id][t.id] ?? "") + '"></td><td>' + pill(hasil[a.id][t.id], t) + '</td></tr>').join("") + '</table></div></div>';
      }else if(tab === "Hasil"){
        body = '<div class="card scroll"><table><tr><th>Atlet</th>' + TES.map(t => '<th>' + t.nama + '</th>').join("") + '</tr>' + ATLET.map(a => '<tr><td><a href="profil.html?id=' + a.id + '">' + a.nama + '</a></td>' + TES.map(t => '<td>' + pill(hasil[a.id][t.id], t) + '</td>').join("") + '</tr>').join("") + '</table></div>';
      }else{
        const t = TES.find(x => x.id === tesId), b = bench[t.id];
        body = '<div class="card"><div class="banner" style="margin-bottom:10px">Angka batas di bawah hanya contoh. Isi dengan acuan resmi atau norma tim Anda sendiri.</div><div class="row" style="margin-bottom:10px"><select id="st">' + TES.map(x => '<option value="' + x.id + '"' + (x.id === tesId ? " selected" : "") + '>' + x.nama + '</option>').join("") + '</select><select id="ar"><option value="besar"' + (b.arah === "besar" ? " selected" : "") + '>Makin besar makin baik</option><option value="kecil"' + (b.arah === "kecil" ? " selected" : "") + '>Makin kecil makin baik</option></select></div><div class="row"><label class="muted sm">Batas Cukup<br><input id="b1" type="number" step="any" value="' + b.thr[0] + '"></label><label class="muted sm">Batas Baik<br><input id="b2" type="number" step="any" value="' + b.thr[1] + '"></label><label class="muted sm">Batas Sangat baik<br><input id="b3" type="number" step="any" value="' + b.thr[2] + '"></label></div><p class="muted sm">Satuan: ' + t.sat + '. Kelompok: usia dini (contoh). Versi benchmark tersimpan di browser ini.</p><div class="row"><button class="pri" id="sb">Simpan benchmark</button><button id="rb">Kembalikan contoh</button><span id="ok" class="muted sm"></span></div></div>';
      }
      el.innerHTML = tabs + body;
      el.querySelectorAll("[data-t]").forEach(b => b.onclick = () => { tab = b.dataset.t; draw(); });
      const st = $("#st"); if(st) st.onchange = () => { tesId = st.value; draw(); };
      const sv = $("#sv"); if(sv) sv.onclick = () => { el.querySelectorAll("[data-a]").forEach(i => { if(i.value !== "") hasil[i.dataset.a][tesId] = parseFloat(i.value); }); store.set("hasil", hasil); draw(); $("#ok").textContent = "Tersimpan."; };
      const sb = $("#sb"); if(sb) sb.onclick = () => { bench[tesId] = { arah:$("#ar").value, sat:bench[tesId].sat, thr:[+$("#b1").value, +$("#b2").value, +$("#b3").value] }; store.set("bench", bench); $("#ok").textContent = "Tersimpan."; };
      const rb = $("#rb"); if(rb) rb.onclick = () => { const t = TES.find(x => x.id === tesId); bench[tesId] = { arah:t.arah, sat:t.sat, thr:t.thr.slice() }; store.set("bench", bench); draw(); };
    };
    draw();
  };

  const note = (t, links) => '<div class="card"><p>' + t + '</p><div class="row">' + links + '</div></div>';
  PAGES.latihan = el => { el.innerHTML = note("Halaman ini nanti membuka aplikasi 1 untuk atlet yang dipilih: nama dan tinggi badan terisi otomatis, hasil tersimpan ke profil. Di prototipe, tombol membuka aplikasi 1 yang sudah ada, tanpa terhubung ke data atlet.", '<a class="btn pri" href="../index.html">Latihan kamera</a><a class="btn" href="../index.html">Analisis dari video</a>'); };
  PAGES.pertandingan = el => { el.innerHTML = note("Halaman ini nanti menyimpan pertandingan, memilih atlet merah dan biru dari database atau atlet tamu, dan menyimpan hasil per ronde. Di prototipe, tombol membuka aplikasi 2 yang sudah ada.", '<a class="btn pri" href="../analisis.html">Buka analisis pertandingan</a>'); };
  
  PAGES.laporan = el => {
    el.innerHTML = '<div class="card noprint row"><select id="la">' + ATLET.map(a => '<option value="' + a.id + '">' + a.nama + '</option>').join("") + '</select><button class="pri" onclick="print()">Cetak</button></div><div id="rp"></div>';
    const draw = () => { const a = atletById($("#la").value); $("#rp").innerHTML = '<div class="card"><b style="font-size:18px">Laporan ' + a.nama + '</b><div class="muted">' + a.usia + ' tahun · ' + a.kat.join(", ") + '</div></div>' + ringkasan(a); };
    $("#la").onchange = draw; draw();
  };

  PAGES.pengaturan = el => {
    el.innerHTML = '<div class="g2"><div class="card"><h2>Pengguna dan peran</h2><table><tr><th>Nama</th><th>Peran</th><th>Status</th></tr><tr><td>Pelatih A</td><td>Pelatih</td><td>aktif</td></tr><tr><td>Analis B</td><td>Analis</td><td>aktif</td></tr><tr><td>Wali Atlet 07</td><td>Atlet / wali</td><td>diundang</td></tr></table><button style="margin-top:10px" onclick="alert(\'Undangan belum aktif di prototipe.\')">+ Undang pengguna</button></div><div class="card"><h2>Kategori</h2><ul class="list">' + KAT.map(k => '<li>' + k + '</li>').join("") + '</ul><p class="muted sm">Atlet bisa berada di lebih dari satu kategori.</p></div></div>';
  };

  return { page, level, radar, store, TES, ATLET };
})();

if(typeof module !== "undefined") module.exports = VC;
