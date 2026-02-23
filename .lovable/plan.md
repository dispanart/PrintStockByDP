

# PrintStock by Dispanart — Inventory Management App

Aplikasi manajemen inventaris gudang percetakan dengan desain mengikuti mockup referensi (warna ungu, oranye, cream) dan data disimpan di localStorage.

---

## 1. Layout & Navigasi
- **Sidebar** dengan menu: Dashboard, Stock In, Stock Out, Master Data, Reports
- Ikon dan highlight aktif sesuai mockup (warna ungu untuk item aktif)
- **Header** dengan greeting "Halo, Admin! 👋", search bar, notifikasi bell, dan tombol "Quick Stock In"
- Info user di bagian bawah sidebar (nama & role)

## 2. Dashboard
- **3 kartu ringkasan** di atas: Total Items (ungu), Low Stock (merah/warning), Pending (hijau/biru)
- **Tabel Stock Status** dengan kolom: Item Name, Category, Qty, Status (Safe/Low/Mid badge berwarna), Action
- **Recent Activity** panel di kanan — daftar transaksi terbaru dengan timestamp
- **Daily Report** card dengan tombol Export PDF
- Link "See All Items" di bawah tabel

## 3. Master Data (CRUD Barang)
- Form tambah barang: nama, SKU, kategori, satuan (Rim/Lembar/Box/Roll/Meter), stok awal, batas minimum
- **Live Preview Card** yang menampilkan simulasi tampilan kartu barang saat mengisi form (berubah warna jika stok kritis)
- Tabel daftar semua barang dengan opsi edit & hapus
- Data tersimpan di localStorage

## 4. Stock In (Barang Masuk)
- Pilih barang dari daftar, input jumlah dan satuan
- **Live Calculation** — menampilkan konversi real-time (contoh: "2 Rim = 1000 Lembar")
- **Smart Unit Default** — mengingat satuan terakhir yang digunakan per barang (localStorage)
- Catatan/referensi PO opsional
- Stok otomatis bertambah setelah submit

## 5. Stock Out (Barang Keluar)
- Fitur serupa dengan Stock In tapi untuk pengurangan stok
- Validasi agar stok tidak minus
- Referensi Job/PO opsional
- Smart Unit Default juga berlaku

## 6. Desain & Warna (Mengikuti Mockup)
- Background cream/warm (#FFF8F0)
- Sidebar putih dengan aksen ungu untuk item aktif
- Kartu Total Items berwarna ungu gradient
- Badge status: hijau (Safe), merah (Low), kuning (Mid)
- Tombol utama: oranye dan ungu
- Card dengan rounded corners dan shadow lembut
- Font modern dan clean

## 7. Fitur Pendukung
- **Filter & Search** di dashboard (by nama, kategori, status)
- **Audit Trail** sederhana — log semua transaksi di localStorage, ditampilkan di Recent Activity
- **Notifikasi visual** untuk item low stock (badge merah di dashboard)
- Semua data persist di localStorage browser

