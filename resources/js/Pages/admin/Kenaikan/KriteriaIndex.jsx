import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";

export default function KriteriaIndex({ items }) {
  const [f,setF]=useState({
    tingkat:"", nilai_min_akhir:70, maks_tidak_tuntas:0,
    min_rata_rata:"", min_kehadiran_persen:"", remedial_diperbolehkan:1,
    berlaku_mulai_ta:"", catatan:""
  });
  const submit=(e)=>{e.preventDefault(); router.post(route("admin.kenaikan.kriteria.store"), f,{preserveScroll:true});};

  const update=(id,row)=>router.put(route("admin.kenaikan.kriteria.update",id),row,{preserveScroll:true});
  const del=(id)=>{ if(confirm("Hapus kriteria ini?")) router.delete(route("admin.kenaikan.kriteria.destroy",id),{preserveScroll:true}); };

  return(
    <div className="p-6">
      <Head title="Kriteria Kenaikan" />
      <h1 className="text-2xl font-semibold mb-4">Kriteria Kenaikan</h1>

      <div className="bg-white p-4 rounded-xl shadow mb-6 grid md:grid-cols-4 gap-3">
        <Input label="Tingkat" value={f.tingkat} onChange={v=>setF(s=>({...s,tingkat:v}))}/>
        <Num label="Min Nilai Akhir" value={f.nilai_min_akhir} onChange={v=>setF(s=>({...s,nilai_min_akhir:v}))}/>
        <Num label="Maks Tidak Tuntas" value={f.maks_tidak_tuntas} onChange={v=>setF(s=>({...s,maks_tidak_tuntas:v}))}/>
        <Num label="Min Rata-rata (ops)" value={f.min_rata_rata} onChange={v=>setF(s=>({...s,min_rata_rata:v}))}/>
        <Num label="Min Kehadiran % (ops)" value={f.min_kehadiran_persen} onChange={v=>setF(s=>({...s,min_kehadiran_persen:v}))}/>
        <Select label="Remedial?" value={f.remedial_diperbolehkan} onChange={v=>setF(s=>({...s,remedial_diperbolehkan:Number(v)}))} options={[{value:1,label:"Ya"},{value:0,label:"Tidak"}]}/>
        <Input label="Berlaku mulai TA (ops)" value={f.berlaku_mulai_ta} onChange={v=>setF(s=>({...s,berlaku_mulai_ta:v}))}/>
        <Input label="Catatan (ops)" value={f.catatan} onChange={v=>setF(s=>({...s,catatan:v}))}/>
        <div className="md:col-span-4"><button onClick={submit} className="px-4 py-2 bg-blue-600 text-white rounded">Simpan</button></div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50"><tr>
            <Th text="Tingkat"/><Th text="Min Akhir" center/><Th text="Maks Tidak Tuntas" center/><Th text="Min RR" center/><Th text="Min Hadir %" center/><Th text="Remedial" center/><Th text="Berlaku"/><Th text="Catatan"/><Th text="Aksi"/>
          </tr></thead>
          <tbody>
            {items.data.map(r=><Row key={r.id_kriteria} r={r} onUpdate={update} onDelete={del}/>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function Row({r,onUpdate,onDelete}){
  const [e,setE]=useState(false);
  const [v,setV]=useState({...r});
  return(<tr className="border-t">
    <Td text={v.tingkat||"-"}/>
    {["nilai_min_akhir","maks_tidak_tuntas","min_rata_rata","min_kehadiran_persen"].map(k=><td key={k} className="p-2 text-center">{e?<input className="w-20 border rounded px-1" value={v[k]??""} onChange={ev=>setV(s=>({...s,[k]:ev.target.value===""?null:Number(ev.target.value)}))}/>: (v[k]??"-")}</td>)}
    <td className="p-2 text-center">{e?
      <select className="border rounded px-1" value={v.remedial_diperbolehkan?1:0} onChange={ev=>setV(s=>({...s,remedial_diperbolehkan:Number(ev.target.value)}))}><option value={1}>Ya</option><option value={0}>Tidak</option></select>
      : (v.remedial_diperbolehkan? "Ya":"Tidak")}</td>
    <Td text={v.berlaku_mulai_ta||"-"}/><Td text={v.catatan||"-"}/>
    <td className="p-2">
      {!e? (<div className="flex gap-2"><button onClick={()=>setE(true)} className="px-2 py-1 text-xs bg-yellow-500 text-white rounded">Edit</button><button onClick={()=>onDelete(r.id_kriteria)} className="px-2 py-1 text-xs bg-red-600 text-white rounded">Hapus</button></div>)
      : (<div className="flex gap-2"><button onClick={()=>onUpdate(r.id_kriteria,v)} className="px-2 py-1 text-xs bg-blue-600 text-white rounded">Simpan</button><button onClick={()=>{setE(false);setV(r);}} className="px-2 py-1 text-xs bg-gray-500 text-white rounded">Batal</button></div>)}
    </td>
  </tr>);
}
function Input({label,value,onChange}){return(<div><label className="block text-sm mb-1">{label}</label><input className="w-full border rounded px-3 py-2" value={value||""} onChange={e=>onChange(e.target.value)}/></div>);}
function Num({label,value,onChange}){return(<div><label className="block text-sm mb-1">{label}</label><input type="number" className="w-full border rounded px-3 py-2" value={value??""} onChange={e=>onChange(e.target.value===""?null:Number(e.target.value))}/></div>);}
function Select({label,value,onChange,options}){return(<div><label className="block text-sm mb-1">{label}</label><select className="w-full border rounded px-3 py-2" value={value??""} onChange={e=>onChange(e.target.value)}>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></div>);}
function Th({text,center}){return <th className={`p-2 ${center?"text-center":"text-left"}`}>{text}</th>;}
function Td({text}){return <td className="p-2">{text}</td>;}
