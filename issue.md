# Perencanaan Fitur: Dapatkan Data User Saat Ini (Get Current User) & Middleware Autentikasi

Dokumen ini berisi panduan teknis langkah demi langkah untuk mengimplementasikan fitur pengambilan data user yang sedang login menggunakan **ElysiaJS** dan **Drizzle ORM**. Fitur ini juga mencakup pembuatan *middleware* autentikasi berbasis Bearer Token. Panduan ini dirancang untuk diikuti secara sistematis oleh Junior Developer atau AI model.

## 1. Pembuatan Middleware Autentikasi
Kita memerlukan mekanisme untuk mencegat (intercept) request dan memvalidasi token sebelum masuk ke *route handler* utama. Di ElysiaJS, ini dapat dilakukan menggunakan fitur `.derive()` atau custom middleware.

**Implementasi Logika (Bisa di Route atau File Middleware Khusus):**
1. Ambil header `Authorization` dari request (biasanya diakses melalui `headers.authorization`).
2. Pastikan formatnya adalah `Bearer <token>`. Ekstrak string `<token>`-nya.
3. Jika token kosong atau format salah, langsung kembalikan respons error `401 Unauthorized`.
4. Lakukan operasi *query* menggunakan Drizzle ke tabel `session` berdasarkan `token` tersebut. Lakukan juga operasi `JOIN` dengan tabel `users` (atau query manual 2 kali) untuk mendapatkan data profil user terkait.
5. Jika data session tidak ditemukan di database (berarti token invalid), kembalikan respons error `401 Unauthorized`.
6. Jika valid, simpan atau teruskan objek `user` tersebut ke *context* Elysia agar bisa langsung digunakan oleh *route handler* endpoint.

## 2. Implementasi Business Logic (Service)
**File Target**: `src/services/users.service.ts`

**Tahapan:**
1. Tambahkan fungsi baru (misal: `getUserByToken(token: string)`) yang bertugas berinteraksi dengan database untuk memvalidasi token.
2. Fungsi ini harus mencari `token` di tabel `session`, dan jika ada, mengembalikan relasi data dari tabel `users` (hanya ambil `id`, `name`, `email`, dan `created_at`).
3. Jika token tidak ditemukan, fungsi ini harus memicu pelemparan error (throw error) atau mengembalikan nilai `null` yang nantinya akan ditangkap oleh middleware untuk menghasilkan error 401.

## 3. Implementasi API Endpoint (Route)
**File Target**: `src/routes/users.routes.ts`

**Tahapan:**
1. Tambahkan endpoint baru pada instance router yang sudah ada:
   - **Method**: `POST` *(Sesuai dengan requirement dari instruksi, meskipun endpoint info user umumnya memakai GET)*
   - **Endpoint**: `/current` (Sehingga menjadi `/api/users/current`)
2. Terapkan validasi middleware autentikasi yang memeriksa token pada endpoint ini.
3. Kembalikan data user yang didapat dari database ke dalam body respons.

**Spesifikasi Request & Response API:**

**Headers:**
- `Authorization: Bearer <token>`

**Response Sukses (200 OK):**
```json
{
  "message": "Successfully",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "johndoe@example.com",
    "created_at": "2024-05-09T00:00:00.000Z"
  } 
}
```

**Response Error (401 Unauthorized):** *(Jika token salah, format Bearer salah, atau tidak ada Header)*
```json
{
    "message": "Unauthorized"
}
```

## 4. Tahapan Testing dan Verifikasi

Setelah implementasi kode selesai, pelaksana (Junior Developer / AI Model) **WAJIB** melakukan verifikasi manual dengan langkah-langkah berikut:

### Skenario 1: Token Valid (Harus Sukses)
1. Kirim request ke `POST /api/users/login` dengan kredensial yang benar untuk mendapatkan `token` asli.
2. Kirim request ke `POST /api/users/current`.
3. Set Header: `Authorization` dengan format `Bearer <token_asli>`.
4. **Verifikasi**: Pastikan HTTP Status Code yang diterima adalah `200` dan body respons menampilkan data user yang sesuai (tanpa field password).

### Skenario 2: Token Tidak Valid (Harus Gagal)
1. Kirim request ke `POST /api/users/current`.
2. Set Header: `Authorization` dengan format `Bearer token_asal_asalan`.
3. **Verifikasi**: Pastikan HTTP Status Code adalah `401 Unauthorized` dan pesan error sesuai spek.

### Skenario 3: Tanpa Header Authorization (Harus Gagal)
1. Kirim request ke `POST /api/users/current` tanpa menyertakan header `Authorization` sama sekali.
2. **Verifikasi**: Pastikan HTTP Status Code adalah `401 Unauthorized` dan sistem tidak mengalami *crash/internal server error*.

---
**Catatan Penting:** 
Fokus utama tugas ini adalah keamanan. Pastikan tidak ada data sensitif (seperti password) yang terbawa keluar di respons endpoint `/current`.
