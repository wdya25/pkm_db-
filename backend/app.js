const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");
const db = require("./config/db"); // koneksi MySQL

const app = express();
const PORT = 3000;

// ================= MIDDLEWARE =================
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // UNTUK API
app.use(session({
  secret: "secret-key",
  resave: false,
  saveUninitialized: true
}));

// folder public untuk CSS/JS/img
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname))); // UNTUK FILE DI ROOT

// view engine EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ================= LOGIN =================

// Form login
app.get("/", (req, res) => {
  res.render("login", { message: "" });
});

// Proses login
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render("login", { message: "⚠️ Username dan Password wajib diisi!" });
  }

  const query = "SELECT * FROM users WHERE username=? AND password=?";
  db.query(query, [username, password], (err, results) => {
    if (err) throw err;

    if (results.length > 0) {
      req.session.user = results[0]; // simpan user ke session
      res.redirect("/menu");
    } else {
      res.render("login", { message: "❌ Login gagal! Username atau Password salah." });
    }
  });
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

// ================= MENU UTAMA =================

app.get("/menu", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }

  const user = req.session.user;

  // default menu untuk semua role
  let menuList = [
    { name: "ℹ️ Informasi Akun Pribadi", url: "/account" },
    { name: "🚪 Keluar", url: "/logout" }
  ];

  // menu berdasarkan role
  if (user.role === "admin") {
    menuList.unshift(
      { name: "📋 Daftar Matkul & Dosen", url: "/mahasiswa" },
      { name: "📅 Deadline Tugas", url: "/deadline" },
      { name: "👥 Kelola Pengguna", url: "/users" }
    );
  } else if (user.role === "dosen") {
    menuList.unshift(
      { name: "📘 Daftar Matkul & Dosen", url: "/matkul" },
      { name: "📅 Deadline Tugas", url: "/deadline" },
      { name: "📚 Jadwal Mengajar", url: "/jadwal_mengajar" }
    );
  } else if (user.role === "mahasiswa") {
    menuList.unshift(
      { name: "📚 Daftar Matkul", url: "/matkul" },
      { name: "📅 Deadline Tugas", url: "/deadline" },
      { name: "🗓️ Jadwal Kelas", url: "/jadwal" }
    );
  }

  // ✅ kirim user + menus ke EJS (harus sesuai dengan menu.ejs)
  res.render("menu", { user: user, menus: menuList });
});

// ================= MASTER MAHASISWA =================

// Tampilkan daftar mahasiswa
app.get("/mahasiswa", (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.redirect("/menu");
  }

  const query = "SELECT * FROM mahasiswa";
  db.query(query, (err, results) => {
    if (err) throw err;
    res.render("mahasiswa/index", { data: results });
  });
});

// Form tambah mahasiswa
app.get("/mahasiswa/add", (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.redirect("/menu");
  }
  res.render("mahasiswa/add");
});

// Simpan data mahasiswa
app.post("/mahasiswa/add", (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.redirect("/menu");
  }

  const { nama, nim, jurusan } = req.body;
  const query = "INSERT INTO mahasiswa (nama, nim, jurusan) VALUES (?, ?, ?)";
  db.query(query, [nama, nim, jurusan], (err) => {
    if (err) throw err;
    res.redirect("/mahasiswa");
  });
});

// Form edit mahasiswa
app.get("/mahasiswa/edit/:id", (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.redirect("/menu");
  }

  const query = "SELECT * FROM mahasiswa WHERE id=?";
  db.query(query, [req.params.id], (err, result) => {
    if (err) throw err;
    res.render("mahasiswa/edit", { mahasiswa: result[0] });
  });
});

// Update mahasiswa
app.post("/mahasiswa/edit/:id", (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.redirect("/menu");
  }

  const { nama, nim, jurusan } = req.body;
  const query = "UPDATE mahasiswa SET nama=?, nim=?, jurusan=? WHERE id=?";
  db.query(query, [nama, nim, jurusan, req.params.id], (err) => {
    if (err) throw err;
    res.redirect("/mahasiswa");
  });
});

// Hapus mahasiswa
app.get("/mahasiswa/delete/:id", (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.redirect("/menu");
  }

  const query = "DELETE FROM mahasiswa WHERE id=?";
  db.query(query, [req.params.id], (err) => {
    if (err) throw err;
    res.redirect("/mahasiswa");
  });
});

// ================= DEADLINE TUGAS =================

// Halaman deadline
app.get("/deadline", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }
  res.render("deadline");
});

// API: Get all tasks
app.get("/api/tasks", (req, res) => {
  console.log("🔍 Fetching tasks from database...");
  const query = "SELECT * FROM tasks ORDER BY due_date ASC";
  db.query(query, (err, results) => {
    if (err) {
      console.error("❌ Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    console.log("✅ Tasks found:", results.length);

    // Format data untuk frontend
    const tasks = results.map(task => ({
      id: task.id,
      name: task.name,
      course: task.course,
      dueDate: task.due_date,
      priority: task.priority,
      description: task.description,
      completed: task.completed === 1
    }));

    res.json(tasks);
  });
});

// API: Create new task
app.post("/api/tasks", (req, res) => {
  console.log("📝 Creating new task:", req.body);
  const { name, course, dueDate, priority, description } = req.body;

  if (!name || !course || !dueDate) {
    return res.status(400).json({ error: "Nama, mata kuliah, dan deadline wajib diisi" });
  }

  const query = "INSERT INTO tasks (name, course, due_date, priority, description, completed) VALUES (?, ?, ?, ?, ?, 0)";
  db.query(query, [name, course, dueDate, priority, description], (err, result) => {
    if (err) {
      console.error("❌ Create task error:", err);
      return res.status(500).json({ error: "Gagal membuat tugas" });
    }

    console.log("✅ Task created, ID:", result.insertId);
    res.json({
      id: result.insertId,
      message: "Task created successfully"
    });
  });
});

// API: Update task
app.put("/api/tasks/:id", (req, res) => {
  console.log("🔄 Updating task:", req.params.id, req.body);
  const taskId = req.params.id;
  const { name, course, dueDate, priority, description, completed } = req.body;

  const query = "UPDATE tasks SET name=?, course=?, due_date=?, priority=?, description=?, completed=? WHERE id=?";
  db.query(query, [name, course, dueDate, priority, description, completed ? 1 : 0, taskId], (err, result) => {
    if (err) {
      console.error("❌ Update task error:", err);
      return res.status(500).json({ error: "Gagal update tugas" });
    }

    console.log("✅ Task updated, affected rows:", result.affectedRows);
    res.json({ message: "Task updated successfully" });
  });
});

// API: Delete task
app.delete("/api/tasks/:id", (req, res) => {
  console.log("🗑️ Deleting task:", req.params.id);
  const taskId = req.params.id;

  const query = "DELETE FROM tasks WHERE id=?";
  db.query(query, [taskId], (err, result) => {
    if (err) {
      console.error("❌ Delete task error:", err);
      return res.status(500).json({ error: "Gagal menghapus tugas" });
    }

    console.log("✅ Task deleted, affected rows:", result.affectedRows);
    res.json({ message: "Task deleted successfully" });
  });
});

// ================= MATA KULIAH =================
app.get('/matkul', (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }

  const jadwal = [
    { hari: "Rabu", matkul: "MSC 3401 - F", jenis: "Lecture", waktu: "08:00 - 11:00", ruang: "D1205", dosen: "Dr. Andi" },
    { hari: "Kamis", matkul: "IF 451 - F", jenis: "Lecture", waktu: "08:00 - 10:00", ruang: "B0313", dosen: "Bapak Budi" },
    { hari: "Kamis", matkul: "IF 451 - FL", jenis: "Laboratory", waktu: "10:00 - 12:00", ruang: "B0506", dosen: "Bapak Budi" },
    { hari: "Rabu", matkul: "IF 350 - F", jenis: "Lecture", waktu: "13:00 - 16:00", ruang: "C0908", dosen: "Ibu Sari" },
    { hari: "Kamis", matkul: "IF 440 - F", jenis: "Lecture", waktu: "13:00 - 16:00", ruang: "C0802", dosen: "Dr. Rizal" },
    { hari: "Jumat", matkul: "CE 319 - F", jenis: "Lecture", waktu: "13:00 - 16:00", ruang: "C0812", dosen: "Dr. Putra" },
    { hari: "Sabtu", matkul: "IF 351 - F", jenis: "Lecture", waktu: "08:00 - 10:00", ruang: "C0301", dosen: "Bapak Hendra" },
    { hari: "Sabtu", matkul: "IF 351 - FL", jenis: "Laboratory", waktu: "10:00 - 12:00", ruang: "B0504", dosen: "Bapak Hendra" },
    { hari: "Sabtu", matkul: "IF 333 - F", jenis: "Lecture", waktu: "13:00 - 16:00", ruang: "B0311", dosen: "Ibu Lina" },
    { hari: "Selasa", matkul: "UM 142 - K", jenis: "Lecture", waktu: "15:00 - 17:00", ruang: "D0901", dosen: "Ibu Maya" },
  ];

  res.render("matkul", { jadwal: jadwal });
});

// ================= JADWAL KELAS =================
app.get("/jadwal", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }

  // Data dummy untuk jadwal kelas mahasiswa
  const jadwal = [
    { hari: "Senin", matkul: "Algoritma", waktu: "08:00 - 10:00", ruang: "Lab 1", dosen: "Dr. Andi" },
    { hari: "Rabu", matkul: "Struktur Data", waktu: "13:00 - 15:00", ruang: "C0908", dosen: "Bapak Budi" },
    { hari: "Jumat", matkul: "Basis Data", waktu: "10:00 - 12:00", ruang: "B0506", dosen: "Ibu Sari" },
    { hari: "Selasa", matkul: "Pemrograman Web", waktu: "09:00 - 11:00", ruang: "R305", dosen: "Dr. Rizal" },
    { hari: "Kamis", matkul: "Jaringan Komputer", waktu: "14:00 - 16:00", ruang: "Lab 2", dosen: "Bapak Hendra" }
  ];

  res.render("jadwal", { user: req.session.user, jadwal: jadwal });
});

// ================= JADWAL MENGAJAR (DOSEN) =================
app.get('/jadwal_mengajar', (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }

  // Data dummy untuk jadwal mengajar dosen
  const jadwal = [
    { hari: 'Senin', jam: '08:00 - 10:00', matkul: 'Algoritma dan Pemrograman', kelas: 'IF-1', ruang: 'R101' },
    { hari: 'Rabu', jam: '10:00 - 12:00', matkul: 'Struktur Data', kelas: 'IF-2', ruang: 'R202' },
    { hari: 'Kamis', jam: '13:00 - 15:00', matkul: 'Basis Data', kelas: 'IF-3', ruang: 'Lab Komputer' },
    { hari: 'Jumat', jam: '09:00 - 11:00', matkul: 'Pemrograman Web', kelas: 'IF-4', ruang: 'R305' }
  ];

  res.render('jadwal_mengajar', { jadwal: jadwal });
});

// ================= REKAP KEHADIRAN =================

// Tampilkan rekap
app.get("/rekap", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }

  const query = "SELECT * FROM rekap_kehadiran ORDER BY tanggal DESC";
  db.query(query, (err, results) => {
    if (err) {
      console.error("❌ Query error:", err);
      return res.status(500).send("Gagal mengambil data");
    }

    res.render("rekap", { user: req.session.user, rekap: results });
  });
});

// Form tambah rekap
app.get("/rekap/add", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }
  res.render("rekap_add");
});

// Proses tambah rekap
app.post("/rekap/add", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }

  const { nim, nama, matkul, pertemuan, status, tanggal } = req.body;

  // Validasi input
  if (!nim || !nama || !matkul || !pertemuan || !status || !tanggal) {
    return res.status(400).send("Semua field wajib diisi");
  }

  const query = "INSERT INTO rekap_kehadiran (nim, nama, matkul, pertemuan, status, tanggal) VALUES (?, ?, ?, ?, ?, ?)";
  
  db.query(query, [nim, nama, matkul, pertemuan, status, tanggal], (err, result) => {
    if (err) {
      console.error("❌ Error menyimpan rekap:", err);
      return res.status(500).send("Gagal menyimpan data rekap");
    }

    console.log("✅ Rekap berhasil disimpan, ID:", result.insertId);
    res.redirect("/rekap");
  });
});

// ================= INFORMASI AKUN =================
app.get("/account", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }
  res.render("account", { user: req.session.user });
});

// ================= KELOLA PENGGUNA (ADMIN) =================
app.get("/users", (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.redirect("/menu");
  }

  const query = "SELECT * FROM users";
  db.query(query, (err, results) => {
    if (err) throw err;
    res.render("users/index", { users: results });
  });
});

// ================= START SERVER =================
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});