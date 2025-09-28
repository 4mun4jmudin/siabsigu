import React, { useMemo } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import AdminPenilaianLayout from "@/Components/layout/AdminPenilaianLayout";
import { Card, CardContent } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";

/* =================== helpers angka AMAN =================== */
// Jangan menimpa global Number!
const toNumber = (v) => {
  if (typeof v === "number") return v;
  if (v === null || v === undefined) return NaN;
  const s = String(v).trim().replace(",", "."); // dukung koma desimal
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
};
const fix2 = (v) => {
  const n = toNumber(v);
  return Number.isFinite(n) ? n.toFixed(2) : "—";
};

/* =================== Komponen Utama =================== */
function NilaiDetail({ header, details = [] }) {
  // Ringkas data
  const komponenOptions = [
    "Tugas",
    "UH",
    "PTS",
    "PAS",
    "Praktik",
    "Proyek",
  ];

  // Rekap komponen (avg per komponen)
  const rekap = useMemo(() => {
    const by = {};
    for (const d of details) {
      const k = d.komponen || "-";
      if (!by[k]) by[k] = { total: 0, count: 0 };
      const n = toNumber(d.nilai);
      if (Number.isFinite(n)) {
        by[k].total += n;
        by[k].count += 1;
      }
    }
    const rows = komponenOptions.map((k) => {
      const item = by[k];
      const avg = item && item.count ? item.total / item.count : null;
      return { komponen: k, rata: avg, jumlah: item?.count ?? 0 };
    });
    return rows;
  }, [details]);

  // Form tambah detail
  const { data, setData, post, processing, reset, errors } = useForm({
    komponen: "",
    deskripsi: "",
    tanggal: "",
    nilai: "",
    bobot: "",
  });

  const submit = (e) => {
    e.preventDefault();
    post(route("admin.penilaian.nilai.detail.store", header.id_penilaian), {
      preserveScroll: true,
      onSuccess: () => reset("deskripsi", "tanggal", "nilai", "bobot"),
    });
  };

  return (
    <div className="space-y-4">
      <Head title="Detail Nilai" />

      {/* Header info */}
      <Card>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-3 text-sm">
            <Info label="Siswa" value={header?.nama_siswa ?? header?.id_siswa} />
            <Info label="Mapel" value={header?.nama_mapel ?? header?.id_mapel} />
            <Info label="Semester" value={header?.semester} />
            <Info label="Nilai Akhir" value={fix2(header?.nilai_akhir)} />
            <Info label="Predikat" value={header?.predikat ?? "—"} />
            <Info label="Tuntas" value={header?.tuntas == null ? "—" : header?.tuntas ? "Ya" : "Tidak"} />
          </div>
        </CardContent>
      </Card>

      {/* Rekap komponen */}
      <Card>
        <CardContent>
          <h2 className="font-semibold mb-3">Rekap Komponen</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <Th text="Komponen" />
                  <Th text="Jumlah Entri" center />
                  <Th text="Rata-rata" center />
                </tr>
              </thead>
              <tbody>
                {rekap.map((r) => (
                  <tr className="border-t" key={r.komponen}>
                    <Td text={r.komponen} />
                    <Td text={r.jumlah} center />
                    <Td text={fix2(r.rata)} center />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Daftar detail */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Detail Nilai</h2>
            <Link
              href={route("admin.penilaian.nilai.index")}
              className="text-sm text-indigo-600 hover:underline"
            >
              ← Kembali ke Daftar Nilai
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <Th text="Tanggal" />
                  <Th text="Komponen" />
                  <Th text="Deskripsi" />
                  <Th text="Nilai" center />
                  <Th text="Bobot Detail" center />
                </tr>
              </thead>
              <tbody>
                {details.length ? (
                  details.map((d) => (
                    <tr className="border-t" key={d.id_detail}>
                      <Td text={d.tanggal ?? "—"} />
                      <Td text={d.komponen} />
                      <Td text={d.deskripsi ?? "—"} />
                      <Td text={fix2(d.nilai)} center />
                      <Td text={d.bobot == null || d.bobot === "" ? "—" : fix2(d.bobot)} center />
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-4 text-gray-500" colSpan={5}>
                      Belum ada detail nilai.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Form tambah detail */}
      <Card>
        <CardContent>
          <h2 className="font-semibold mb-3">Tambah Detail Nilai</h2>
          <form onSubmit={submit} className="grid md:grid-cols-6 gap-3">
            <Select
              label="Komponen"
              value={data.komponen}
              onChange={(v) => setData("komponen", v)}
              options={komponenOptions.map((k) => ({ value: k, label: k }))}
              error={errors.komponen}
            />
            <Input
              type="date"
              label="Tanggal"
              value={data.tanggal || ""}
              onChange={(v) => setData("tanggal", v)}
              error={errors.tanggal}
            />
            <Input
              type="text"
              label="Deskripsi"
              placeholder="Mis: Tugas Bab 2"
              value={data.deskripsi}
              onChange={(v) => setData("deskripsi", v)}
              error={errors.deskripsi}
            />
            <Input
              type="number"
              step="0.01"
              label="Nilai"
              placeholder="0 - 100"
              value={data.nilai}
              onChange={(v) => setData("nilai", v)}
              error={errors.nilai}
            />
            <Input
              type="number"
              step="0.01"
              label="Bobot Detail (opsional)"
              placeholder="Kosongkan jika pakai bobot default"
              value={data.bobot}
              onChange={(v) => setData("bobot", v)}
              error={errors.bobot}
            />
            <div className="flex items-end">
              <Button type="submit" disabled={processing} className="w-full">
                {processing ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

/* layout */
NilaiDetail.layout = (page) => (
  <AdminPenilaianLayout title="Detail Nilai">{page}</AdminPenilaianLayout>
);

export default NilaiDetail;

/* =================== sub components =================== */
function Info({ label, value }) {
  return (
    <div>
      <div className="text-gray-500 text-xs">{label}</div>
      <div className="font-medium">{value ?? "—"}</div>
    </div>
  );
}
function Th({ text, center }) {
  return <th className={`p-2 ${center ? "text-center" : "text-left"}`}>{text}</th>;
}
function Td({ text, center }) {
  return <td className={`p-2 ${center ? "text-center" : "text-left"}`}>{text}</td>;
}

function Input({ label, type = "text", value, onChange, placeholder, step, error }) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        step={step}
        className={`w-full border rounded px-3 py-2 ${error ? "border-red-500" : ""}`}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {error ? <div className="text-xs text-red-600 mt-1">{error}</div> : null}
    </div>
  );
}
function Select({ label, value, onChange, options = [], error }) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1">{label}</label>
      <select
        className={`w-full border rounded px-3 py-2 ${error ? "border-red-500" : ""}`}
        value={value || ""}
        onChange={(e) => onChange(e.target.value || "")}
      >
        <option value="">— Pilih —</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error ? <div className="text-xs text-red-600 mt-1">{error}</div> : null}
    </div>
  );
}
