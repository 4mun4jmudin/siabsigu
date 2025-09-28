import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";

export default function RemedialIndex({ items }) {
  const [f,setF]=useState({ id_penilaian:"", komponen:"", nilai_awal:"", nilai_remedial:"", tanggal:"", metode:"", catatan:"" });

  const submit=(e)=>{e.preventDefault(); router.post(route("admin.remedial.store"), f, { preserveScroll:true });};

  const update=(id,row)=>router.put(route("admin.remedial.update",id),row,{preserveScroll:true});
  const del=(id)=>{ if(confirm("Hapus remedial?")) router.delete(route("admin.remedial.destroy",id),{preserveScroll:true}); };

  return (
    <div className="p-6">
      <Head title="Remedial Nilai" />
      <h1 className="text-2xl font-semibold mb-4">Remedial Nilai</h1>

      <div className="bg-white p-4 rounded-xl shadow mb-6 grid md:grid-cols-6 gap-3">
        <Input label="ID Penilaian" value={f.id_penilaian} onChange={v=>setF(s=>({...s,id_penilaian:v}))}/>
        <Select label="Komponen (ops)" value={f.komponen} onChange={v=>setF(s=>({...s,komponen:v}))} options={[{value:"",label:"—"}].concat(["Tugas","UH","PTS","PAS","Praktik","Proyek"].map(x=>({value:x,label:x})))}/>
        <Num label="Nilai Awal" value={f.nilai_awal} onChange={v=>setF(s=>({...s,nilai_awal:v}))}/>
        <Num label="Nilai Remedial" value={f.nilai_remedial} onChange={v=>setF(s=>({...s,nilai_remedial:v}))}/>
        <Input label="Tanggal (ops)" value={f.tanggal} onChange={v=>setF(s=>({...s,tanggal:v}))} type="date"/>
        <Input label="Metode (ops)" value={f.metode} onChange={v=>setF(s=>({...s,metode:v}))}/>
        <div className="md:col-span-5"><Input label="Catatan (ops)" value={f.catatan} onChange={v=>setF(s=>({...s,catatan:v}))}/></div>
        <div className="md:col-span-6"><button onClick={submit} className="px-4 py-2 bg-blue-600 text-white rounded">Simpan Remedial</button></div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50"><tr>
            <Th text="Siswa"/><Th text="Mapel"/><Th text="Komponen"/><Th text="Nilai Awal" center/><Th text="Nilai Remedial" center/><Th text="Tanggal"/><Th text="Metode"/><Th text="Catatan"/><Th text="Aksi"/>
          </tr></thead>
          <tbody>
            {items.data.map(r=><Row key={r.id_remedial} r={r} onUpdate={update} onDelete={del}/>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function Row({r,onUpdate,onDelete}){
  const [e,setE]=useState(false);
  const [v,setV]=useState({ komponen:r.komponen||"", nilai_awal:r.nilai_awal, nilai_remedial:r.nilai_remedial, tanggal:r.tanggal||"", metode:r.metode||"", catatan:r.catatan||"" });
  return(<tr className="border-t">
    <Td text={r.penilaian?.siswa?.nama_lengkap || r.penilaian?.id_siswa || "-"} />
    <Td text={r.penilaian?.mapel?.nama_mapel || r.penilaian?.id_mapel || "-"} />
    <Td text={e? <select className="border rounded px-2 py-1" value={v.komponen} onChange={ev=>setV(s=>({...s,komponen:ev.target.value}))}>{["","Tugas","UH","PTS","PAS","Praktik","Proyek"].map(x=><option key={x} value={x}>{x||"—"}</option>)}</select> : (r.komponen||"—")} />
    <Td text={e? <input className="w-20 border rounded px-2 py-1 text-right" value={v.nilai_awal} onChange={ev=>setV(s=>({...s,nilai_awal:ev.target.value}))}/> : r.nilai_awal} center />
    <Td text={e? <input className="w-20 border rounded px-2 py-1 text-right" value={v.nilai_remedial} onChange={ev=>setV(s=>({...s,nilai_remedial:ev.target.value}))}/> : r.nilai_remedial} center />
    <Td text={e? <input className="border rounded px-2 py-1" value={v.tanggal||""} onChange={ev=>setV(s=>({...s,tanggal:ev.target.value}))}/> : (r.tanggal||"—")} />
    <Td text={e? <input className="border rounded px-2 py-1" value={v.metode||""} onChange={ev=>setV(s=>({...s,metode:ev.target.value}))}/> : (r.metode||"—")} />
    <Td text={e? <input className="border rounded px-2 py-1" value={v.catatan||""} onChange={ev=>setV(s=>({...s,catatan:ev.target.value}))}/> : (r.catatan||"—")} />
    <td className="p-2">
      {!e? (<div className="flex gap-2"><button onClick={()=>setE(true)} className="px-2 py-1 text-xs bg-yellow-500 text-white rounded">Edit</button><button onClick={()=>onDelete(r.id_remedial)} className="px-2 py-1 text-xs bg-red-600 text-white rounded">Hapus</button></div>)
      : (<div className="flex gap-2"><button onClick={()=>onUpdate(r.id_remedial,v)} className="px-2 py-1 text-xs bg-blue-600 text-white rounded">Simpan</button><button onClick={()=>{setE(false);setV({ komponen:r.komponen||"", nilai_awal:r.nilai_awal, nilai_remedial:r.nilai_remedial, tanggal:r.tanggal||"", metode:r.metode||"", catatan:r.catatan||"" });}} className="px-2 py-1 text-xs bg-gray-500 text-white rounded">Batal</button></div>)}
    </td>
  </tr>);
}
function Input({label,value,onChange,type="text"}){return(<div><label className="block text-sm mb-1">{label}</label><input type={type} className="w-full border rounded px-3 py-2" value={value||""} onChange={e=>onChange(e.target.value)}/></div>);}
function Num({label,value,onChange}){return(<div><label className="block text-sm mb-1">{label}</label><input type="number" className="w-full border rounded px-3 py-2" value={value||""} onChange={e=>onChange(e.target.value)}/></div>);}
function Select({label,value,onChange,options}){return(<div><label className="block text-sm mb-1">{label}</label><select className="w-full border rounded px-3 py-2" value={value??""} onChange={e=>onChange(e.target.value)}>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></div>);}
function Th({text}){return <th className="p-2 text-left">{text}</th>;}
function Td({text,center}){return <td className={`p-2 ${center?"text-center":"text-left"}`}>{text}</td>;}
