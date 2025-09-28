import React, { useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import AdminPenilaianLayout from "@/Components/layout/AdminPenilaianLayout";

function PageBobotIndex({ items = { data: [] }, options = { mapel: [], tahunAjaran: [], semester: [] } }) {
  const { props } = usePage();
  const flash = props?.flash || {};

  const [form, setForm] = useState({
    id_mapel: "",
    id_tahun_ajaran: "",
    semester: "",
    bobot_tugas: null,
    bobot_uh: null,
    bobot_pts: null,
    bobot_pas: null,
    bobot_praktik: null,
    bobot_proyek: null,
  });

  const submit = (e) => {
    e.preventDefault();
    router.post(route("admin.penilaian.bobot.store"), form, { preserveScroll: true });
  };

  const onUpdate = (id, row) => {
    router.put(route("admin.penilaian.bobot.update", id), row, { preserveScroll: true });
  };

  const onDelete = (id) => {
    if (!confirm("Hapus bobot ini?")) return;
    router.delete(route("admin.penilaian.bobot.destroy", id), { preserveScroll: true });
  };

  return (
    <div className="space-y-4">
      <Head title="Pengaturan Bobot Nilai" />

      {flash.success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">{flash.success}</div>
      )}

      {/* Form Tambah / Update */}
      <div className="bg-white p-4 rounded-xl shadow border">
        <div className="grid md:grid-cols-3 gap-3">
          <Select
            label="Mapel"
            value={form.id_mapel}
            onChange={(v) => setForm((s) => ({ ...s, id_mapel: v }))}
            options={(options.mapel || []).map((m) => ({ value: m.id_mapel, label: m.nama_mapel }))}
          />
          <Select
            label="Tahun Ajaran"
            value={form.id_tahun_ajaran}
            onChange={(v) => setForm((s) => ({ ...s, id_tahun_ajaran: v }))}
            options={(options.tahunAjaran || []).map((t) => ({
              value: t.id_tahun_ajaran,
              label: t.tahun_ajaran,
            }))}
          />
          <Select
            label="Semester"
            value={form.semester}
            onChange={(v) => setForm((s) => ({ ...s, semester: v }))}
            options={options.semester || []}
          />
        </div>

        <div className="grid md:grid-cols-6 gap-3 mt-3">
          <Number
            label="BOBOT TUGAS"
            value={form.bobot_tugas}
            onChange={(v) => setForm((s) => ({ ...s, bobot_tugas: v }))}
          />
          <Number
            label="BOBOT UH"
            value={form.bobot_uh}
            onChange={(v) => setForm((s) => ({ ...s, bobot_uh: v }))}
          />
          <Number
            label="BOBOT PTS"
            value={form.bobot_pts}
            onChange={(v) => setForm((s) => ({ ...s, bobot_pts: v }))}
          />
          <Number
            label="BOBOT PAS"
            value={form.bobot_pas}
            onChange={(v) => setForm((s) => ({ ...s, bobot_pas: v }))}
          />
          <Number
            label="BOBOT PRAKTIK"
            value={form.bobot_praktik}
            onChange={(v) => setForm((s) => ({ ...s, bobot_praktik: v }))}
          />
          <Number
            label="BOBOT PROYEK"
            value={form.bobot_proyek}
            onChange={(v) => setForm((s) => ({ ...s, bobot_proyek: v }))}
          />
        </div>

        <div className="mt-3">
          <button onClick={submit} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            Simpan / Update
          </button>
        </div>
      </div>

      {/* Tabel Data */}
      <div className="bg-white p-4 rounded-xl shadow border overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <Th text="Mapel" />
              <Th text="Tahun Ajaran" />
              <Th text="Semester" />
              <Th text="TGS" center />
              <Th text="UH" center />
              <Th text="PTS" center />
              <Th text="PAS" center />
              <Th text="PRKT" center />
              <Th text="PRYK" center />
              <Th text="Aksi" />
            </tr>
          </thead>
          <tbody>
            {items?.data?.length ? (
              items.data.map((row) => (
                <Row key={row.id} row={row} onUpdate={onUpdate} onDelete={onDelete} />
              ))
            ) : (
              <tr>
                <td className="p-4 text-gray-500" colSpan={10}>
                  Belum ada data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

PageBobotIndex.layout = (page) => (
  <AdminPenilaianLayout title="Pengaturan Bobot Nilai">{page}</AdminPenilaianLayout>
);

export default PageBobotIndex;

/* ================= helper components ================= */

function Row({ row, onUpdate, onDelete }) {
  const [edit, setEdit] = useState(false);
  const [v, setV] = useState({ ...row });

  const numberCell = (k) =>
    edit ? (
      <input
        type="number"
        inputMode="decimal"
        step="0.01"
        className="w-20 border rounded px-1 py-0.5 text-right"
        value={v[k] === null || v[k] === undefined ? "" : String(v[k])}
        onChange={(e) => {
          const raw = e.target.value;
          setV((s) => ({
            ...s,
            [k]: raw === "" ? null : isNaN(parseFloat(raw)) ? null : parseFloat(raw),
          }));
        }}
      />
    ) : (
      (v[k] ?? 0)
    );

  return (
    <tr className="border-t">
      <Td text={row.mapel?.nama_mapel || row.id_mapel} />
      <Td text={row.tahun_ajaran?.tahun_ajaran || row.id_tahun_ajaran} />
      <Td text={row.semester} />
      <td className="p-2 text-center">{numberCell("bobot_tugas")}</td>
      <td className="p-2 text-center">{numberCell("bobot_uh")}</td>
      <td className="p-2 text-center">{numberCell("bobot_pts")}</td>
      <td className="p-2 text-center">{numberCell("bobot_pas")}</td>
      <td className="p-2 text-center">{numberCell("bobot_praktik")}</td>
      <td className="p-2 text-center">{numberCell("bobot_proyek")}</td>
      <td className="p-2">
        {!edit ? (
          <div className="flex gap-2">
            <button onClick={() => setEdit(true)} className="px-2 py-1 text-xs bg-yellow-500 text-white rounded">
              Edit
            </button>
            <button onClick={() => onDelete(row.id)} className="px-2 py-1 text-xs bg-red-600 text-white rounded">
              Hapus
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => onUpdate(row.id, v)} className="px-2 py-1 text-xs bg-blue-600 text-white rounded">
              Simpan
            </button>
            <button
              onClick={() => {
                setEdit(false);
                setV(row);
              }}
              className="px-2 py-1 text-xs bg-gray-500 text-white rounded"
            >
              Batal
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1">{label}</label>
      <select
        className="w-full border rounded px-3 py-2"
        value={value || ""}
        onChange={(e) => onChange(e.target.value || "")}
      >
        <option value="">— Pilih —</option>
        {(options || []).map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Number({ label, value, onChange, min = 0, max = 100, step = 0.01 }) {
  const val = value === null || value === undefined ? "" : String(value);

  const handle = (e) => {
    const raw = e.target.value;
    if (raw === "") {
      onChange(null);
      return;
    }
    const num = parseFloat(raw);
    if (isNaN(num)) {
      onChange(null);
      return;
    }
    const clamped = Math.max(min, Math.min(max, num));
    onChange(clamped);
  };

  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1">{label}</label>
      <input
        type="number"
        inputMode="decimal"
        step={step}
        min={min}
        max={max}
        className="w-full border rounded px-3 py-2"
        value={val}
        onChange={handle}
      />
    </div>
  );
}

function Th({ text, center }) {
  return <th className={`p-2 ${center ? "text-center" : "text-left"}`}>{text}</th>;
}
function Td({ text, center }) {
  return <td className={`p-2 ${center ? "text-center" : "text-left"}`}>{text}</td>;
}
