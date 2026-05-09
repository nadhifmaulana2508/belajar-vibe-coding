# Bug Fix: Error TypeScript (Garis Merah) pada Handler ElysiaJS

Dokumen ini berisi penjelasan mengenai *bug* yang sebelumnya muncul berupa pesan error TypeScript (garis merah di editor/VS Code) pada file `src/routes/users.routes.ts`, beserta tahapan bagaimana cara memperbaikinya. Isu ini ditujukan sebagai pembelajaran bagi Junior Programmer.

## Deskripsi Bug
Pada implementasi awal *Global Error Handling* menggunakan `.onError()` di ElysiaJS, editor kode (seperti VS Code) menampilkan garis merah bergerigi di bawah variabel `error` dan metode `getUserByToken()`. 

Pesan error yang biasanya muncul adalah:
- `Property 'message' does not exist on type...`
- `Property 'all' does not exist on type...`

## Akar Masalah (Root Cause)
1. **Union Type pada Elysia:** Parameter `error` di dalam *callback* `.onError()` milik Elysia memiliki banyak kemungkinan tipe data (Union Type) tergantung dari *error* apa yang dilemparkan.
2. Karena TypeScript tidak bisa menjamin 100% bahwa objek `error` saat itu memiliki properti `.message` atau `.all` (khusus untuk validasi TypeBox), TypeScript mengeluarkan peringatan.

## Tahapan Perbaikan

### 1. Perbaiki Inferensi Tipe di `onError`
Gunakan *type casting* ke `any` untuk variabel error agar TypeScript mengizinkan akses ke properti kustom:

```typescript
.onError(({ code, error, set }) => {
  const err = error as any;
  const message = err?.message || "";
  // ...
})
```

### 2. Gunakan Optional Chaining
Gunakan `?.` saat memetakan error validasi:
```typescript
errors: err?.all?.map((e: any) => ({ path: e.path, message: e.message })) || []
```

---
*Implementasi lengkap dapat dilihat pada src/routes/users.routes.ts*
