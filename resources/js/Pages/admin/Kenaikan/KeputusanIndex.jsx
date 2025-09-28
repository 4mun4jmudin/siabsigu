import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";

export default function KeputusanIndex({ items, options }) {
  const [f,setF]=useState({ id_siswa:"", id_tahun_ajaran:"", semester:"Ganjil", dari_kelas:"", ke_kelas:"", status:"Naik", alasan:"" });
  const submit=(e)=>{e.preventDefault(); router.post(route("admin.kenaikan.keputusan.store"), f, {preserveScroll:true});};

  const update=(id,row)=>router.put(route("admin.kenaikan.keputusan.update",id),row,{preserveScroll:true});
  const del=(id)=>{ if(confirm("Hapus keputusan?")) router.delete(route("admin.kenaikan.keputusan.destroy",id),{preserveScroll:true}); };

  return (
    <div className="p-6">
      <Head title="Keputusan Kenaikan" />
      <h1 className="text-2xl font-semibold mb-4">Keputusan Kenaikan</h1>

      <div className="bg-white p-4 rounded-xl shadow mb-6 grid md:grid-cols-3 gap-3">
        <Input label="ID Siswa" value={f.id_siswa} onChange={v=>setF(s=>({...s,id_siswa:v}))}/>
        <Select label="TA" value={f.id_tahun_ajaran} onChange={v=>setF(s=>({...s,id_tahun_ajaran:v}))} options={options.tahunAjaran.map(t=>({value:t.id_tahun_ajaran,label:t.tahun_ajaran}))}/>
        <Select label="Semester" value={f.semester} onChange={v=>setF(s=>({...s,semester:v}))} options={options.status.filter(()=>true).map(()=>({value:"Ganjil",label:"Ganjil"})).concat([{value:"Genap",label:"Genap"}])}/>
        <Select label="Dari Kelas" value={f.dari_kelas} onChange={v=>setF(s=>({...s,dari_kelas:v}))} options={options.kelas.map(k=>({value:k.id_kelas,label:k.id_kelas}))}/>
        <Select label="Ke Kelas (ops)" value={f.ke_kelas} onChange={v=>setF(s=>({...s,ke_kelas:v}))} options={[{value:"",label:"—"}].concat(options.kelas.map(k=>({value:k.id_kelas,label:k.id_kelas})))} />
        <Select label="Status" value={f.status} onChange={v=>setF(s=>({...s,status:v}))} options={options.status}/>
        <Input label="Alasan (ops)" value={f.alasan} onChange={v=>setF(s=>({...s,alasan:v}))}/>
        <div className="md:col-span-3"><button onClick={submit} className="px-4 py-2 bg-blue-600 text-white rounded">Simpan Keputusan</button></div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50"><tr>
            <Th text="Siswa"/><Th text="TA/Sem"/><Th text="Dari → Ke"/><Th text="Status"/><Th text="Tgl Tetap"/><Th text="Aksi"/>
          </tr></thead>
          <tbody>
            {items.data.map(r=><Row key={r.id_keputusan} r={r} onUpdate={update} onDelete={del}/>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function Row({r,onUpdate,onDelete}){
  const [e,setE]=useState(false);
  const [v,setV]=useState({ ke_kelas:r.ke_kelas, status:r.status, alasan:r.alasan });
  return(<tr className="border-t">
    <Td text={r.siswa?.nama_lengkap || r.id_siswa}/>
    <Td text={`${r.tahun_ajaran?.tahun_ajaran || r.id_tahun_ajaran} / ${r.semester}`}/>
    <Td text={`${r.dari_kelas} → ${r.ke_kelas || "-"}`}/>
    <Td text={r.status}/>
    <Td text={r.ditetapkan_pada || "-"}/>
    <td className="p-2">
      {!e? (<div className="flex gap-2">
        <button onClick={()=>setE(true)} className="px-2 py-1 text-xs bg-yellow-500 text-white rounded">Edit</button>
        <button onClick={()=>onDelete(r.id_keputusan)} className="px-2 py-1 text-xs bg-red-600 text-white rounded">Hapus</button>
      </div>):(<div className="flex flex-col gap-2">
        <select className="border rounded px-2 py-1" value={v.status} onChange={ev=>setV(s=>({...s,status:ev.target.value}))}>
          {["Naik","Tinggal","Tunda"].map(x=><option key={x} value={x}>{x}</option>)}
        </select>
        <input className="border rounded px-2 py-1" placeholder="Ke Kelas (ops)" value={v.ke_kelas||""} onChange={ev=>setV(s=>({...s,ke_kelas:ev.target.value||null}))}/>
        <input className="border rounded px-2 py-1" placeholder="Alasan (ops)" value={v.alasan||""} onChange={ev=>setV(s=>({...s,alasan:ev.target.value||null}))}/>
        <div className="flex gap-2">
          <button onClick={()=>onUpdate(r.id_keputusan, v)} className="px-2 py-1 text-xs bg-blue-600 text-white rounded">Simpan</button>
          <button onClick={()=>{setE(false);setV({ ke_kelas:r.ke_kelas, status:r.status, alasan:r.alasan });}} className="px-2 py-1 text-xs bg-gray-500 text-white rounded">Batal</button>
        </div>
      </div>)}
    </td>
  </tr>);
}
function Input({label,value,onChange}){return(<div><label className="block text-sm mb-1">{label}</label><input className="w-full border rounded px-3 py-2" value={value||""} onChange={e=>onChange(e.target.value)}/></div>);}
function Select({label,value,onChange,options}){return(<div><label className="block text-sm mb-1">{label}</label><select className="w-full border rounded px-3 py-2" value={value||""} onChange={e=>onChange(e.target.value)}><option value="">— Pilih —</option>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></div>);}
function Th({text}){return <th className="p-2 text-left">{text}</th>;}
function Td({text}){return <td className="p-2">{text}</td>;}
