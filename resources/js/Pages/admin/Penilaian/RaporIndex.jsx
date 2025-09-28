import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";

export default function RaporIndex({ options, filters, rekap = [] }) {
  const [f,setF]=useState({ id_tahun_ajaran: filters?.id_tahun_ajaran || "", semester: filters?.semester || "", id_kelas: filters?.id_kelas || "" });

  const apply=()=>router.get(route("admin.rapor.index"), f, { preserveState:true, preserveScroll:true, replace:true });
  const recompute=()=>router.post(route("admin.rapor.recompute"), f, { preserveScroll:true });

  return (
    <div className="p-6">
      <Head title="Rapor & Rekapitulasi" />
      <h1 className="text-2xl font-semibold mb-4">Rapor & Rekapitulasi</h1>

      <div className="bg-white p-4 rounded-xl shadow mb-4 grid md:grid-cols-4 gap-3">
        <Select label="TA" value={f.id_tahun_ajaran} onChange={v=>setF(s=>({...s,id_tahun_ajaran:v}))} options={options.tahunAjaran.map(t=>({value:t.id_tahun_ajaran,label:t.tahun_ajaran}))}/>
        <Select label="Semester" value={f.semester} onChange={v=>setF(s=>({...s,semester:v}))} options={options.semester}/>
        <Select label="Kelas" value={f.id_kelas} onChange={v=>setF(s=>({...s,id_kelas:v}))} options={options.kelas.map(k=>({value:k.id_kelas,label:k.id_kelas}))}/>
        <div className="flex items-end gap-2">
          <button onClick={apply} className="px-4 py-2 bg-blue-600 text-white rounded">Terapkan</button>
          <button onClick={recompute} className="px-4 py-2 bg-indigo-600 text-white rounded">Hitung Ulang</button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <div className="flex justify-between mb-3">
          <div className="font-semibold">Peringkat Kelas</div>
          <div className="flex gap-2">
            <a href={route("admin.rapor.export.excel")} className="px-3 py-1 text-sm bg-green-600 text-white rounded">Export Excel</a>
            <a href={route("admin.rapor.export.pdf")} className="px-3 py-1 text-sm bg-red-600 text-white rounded">Export PDF</a>
          </div>
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50"><tr><Th text="Peringkat"/><Th text="ID Siswa"/><Th text="Rata-rata" center/></tr></thead>
          <tbody>
            {rekap.map(r=>(
              <tr key={r.id_siswa} className="border-t">
                <Td text={r.peringkat}/><Td text={r.id_siswa}/><Td text={fix2(r.rata)} center/>
              </tr>
            ))}
            {!rekap.length && <tr><td className="p-3 text-gray-500" colSpan="3">Belum ada data.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function Select({label,value,onChange,options}){return(<div><label className="block text-sm mb-1">{label}</label><select className="w-full border rounded px-3 py-2" value={value||""} onChange={e=>onChange(e.target.value)}><option value="">— Pilih —</option>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></div>);}
function Th({text,center}){return <th className={`p-2 ${center?"text-center":"text-left"}`}>{text}</th>;}
function Td({text,center}){return <td className={`p-2 ${center?"text-center":"text-left"}`}>{text}</td>;}
function fix2(n){return n==null?"—":Number(n).toFixed(2);}
