# Perencanaan Fitur: Logout User (Hapus Session)

Dokumen ini berisi panduan teknis langkah demi langkah untuk mengimplementasikan fitur logout user menggunakan **ElysiaJS** dan **Drizzle ORM**. Tujuan utama dari fitur ini adalah membatalkan (menghapus) session token dari database sehingga token tersebut tidak dapat digunakan lagi. Panduan ini dirancang untuk diikuti secara sistematis oleh Junior Developer atau AI model.

## 1. Implementasi Business Logic (Service)
**File Target**: `src/services/users.service.ts`

**Tahapan:**
1. Tambahkan fungsi baru bernama `logoutUser(token: string)`.
2. Di dalam fungsi ini, jalankan perintah operasi `delete` menggunakan Drizzle ORM yang menargetkan tabel `session`.
3. Gunakan filter `.where(eq(session.token, token))` agar hanya token spesifik tersebut yang dihapus dari database.

## 2. Implementasi API Endpoint (Route)
**File Target**: `src/routes/users.routes.ts`

**Tahapan:**
1. Tambahkan endpoint baru pada *instance* router `usersRoutes`:
   - **Method**: `DELETE`
   - **Endpoint**: `/logout` (Akan tergabung dengan prefix menjadi `/api/users/logout`)
2. Karena endpoint ini mewajibkan pengguna untuk sedang dalam kondisi login, endpoint ini **harus** dilindungi oleh middleware autentikasi (hasil dari `.derive()` yang sudah memeriksa header `Authorization`).
3. Di dalam *route handler*:
   - Jika data `user` dari middleware bernilai kosong/null, kembalikan status `401 Unauthorized`.
   - Lakukan ekstraksi ulang string `token` dari header `Authorization` (karena kita membutuhkan string tokennya untuk dihapus).
   - Panggil method `usersService.logoutUser(token)`.
   - Kembalikan json respons sukses.

**Spesifikasi Request & Response API:**

**Headers:**
- `Authorization: Bearer <token>`

**Response Sukses (200 OK):**
```json
{
  "message": "Successfully",
  "data": "ok"
}
```

**Response Error (401 Unauthorized):**
*(Jika token tidak disematkan di header, format salah, atau token sudah tidak ada di database)*
```json
{
    "message": "Unauthorized"
}
```

## 3. Ketentuan Struktur Folder dan File
Gunakan dan sesuaikan struktur eksisting berikut:
- **`src/routes/users.routes.ts`**: Gunakan untuk menangani deklarasi rute Elysia, injeksi tipe, validasi header (jika diperlukan), dan pembentukan JSON respons.
- **`src/services/users.service.ts`**: Gunakan untuk tempat eksekusi *business logic* ke database (query Drizzle).

## 4. Tahapan Testing dan Verifikasi

Setelah implementasi selesai, jalankan urutan tes berikut untuk memvalidasi fitur:

### Skenario 1: Logout Berhasil & Session Terhapus
1. **Dapatkan Token**: Lakukan request `POST /api/users/login` dengan kredensial valid untuk mendapatkan sebuah `<token>` asli.
2. **Lakukan Logout**: Kirim request ke `DELETE /api/users/logout` dengan menyertakan header `Authorization: Bearer <token>`.
3. **Verifikasi Respons**: Pastikan HTTP Status `200` dan body respons berupa `"data": "ok"`.
4. **Validasi Efek (Penting)**: Coba kirim request ke `POST /api/users/current` menggunakan token yang *sama* tadi. Anda **wajib** mendapatkan respons `401 Unauthorized`, yang membuktikan bahwa token di database benar-benar telah terhapus dan tidak bisa di-reuse.

### Skenario 2: Logout dengan Token Tidak Valid
1. Kirim request ke `DELETE /api/users/logout` dengan header `Authorization: Bearer token_asal_asalan`.
2. **Verifikasi**: Pastikan sistem langsung menolak dengan `401 Unauthorized`.

### Skenario 3: Logout Tanpa Header
1. Kirim request ke `DELETE /api/users/logout` tanpa menyertakan `Authorization`.
2. **Verifikasi**: Pastikan sistem mengembalikan `401 Unauthorized`.

---
**Instruksi Eksekusi untuk Pelaksana:**
Pastikan penulisan *query delete* pada Drizzle sangat presisi menggunakan parameter `where` yang spesifik agar tidak terhapus seluruh isi tabel `session`. Jangan lupa manfaatkan block `.derive()` yang sudah mengurus filter dasar autentikasi.
