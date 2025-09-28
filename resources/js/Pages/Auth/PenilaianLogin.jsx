import React, { useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";

export default function PenilaianLogin({ title = "Login Admin Penilaian" }) {
  const { props } = usePage();
  const errors = props?.errors || {};
  const flash = props?.flash || {};
  const [form, setForm] = useState({ username: "", password: "", remember: false });
  const [loading, setLoading] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    setLoading(true);
    router.post(route("login.penilaian.store"), form, {
      onFinish: () => setLoading(false),
      preserveScroll: true,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Head title={title} />
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-6">
        <h1 className="text-2xl font-semibold mb-1">{title}</h1>
        <p className="text-sm text-gray-600 mb-6">Silakan masuk menggunakan akun Admin.</p>

        {flash?.status && (
          <div className="mb-4 text-sm p-3 rounded-lg bg-green-50 border border-green-200">
            {flash.status}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Username</label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              autoFocus
            />
            {errors.username && <div className="text-red-600 text-xs mt-1">{errors.username}</div>}
          </div>

          <div>
            <label className="block text-sm mb-1">Password</label>
            <input
              type="password"
              className="w-full border rounded-lg px-3 py-2"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            {errors.password && <div className="text-red-600 text-xs mt-1">{errors.password}</div>}
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.remember}
                onChange={(e) => setForm({ ...form, remember: e.target.checked })}
              />
              Ingat saya
            </label>
            <a href="/" className="text-sm text-blue-600 hover:underline">Kembali ke beranda</a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg bg-blue-600 text-white font-medium disabled:opacity-60"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>

          <div className="text-[11px] text-gray-500 text-center mt-2">
            Setelah berhasil, Anda akan diarahkan ke Dashboard Penilaian.
          </div>
        </form>
      </div>
    </div>
  );
}
