import React, { useEffect, useState, useMemo } from "react";
import { Head } from "@inertiajs/react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell } from "recharts";

export default function Analitik({ routes, options }) {
  const [f,setF]=useState({ id_tahun_ajaran:"", semester:"", id_kelas:"", id_mapel:"" });
  const [data,setData]=useState({ summary:null, distribution:[], trend:[], mapel:[], kelas:[], breakdown:{ predikat:{}, tuntas:{ya:0,tidak:0} } });

  const q = (u) => u + "?" + new URLSearchParams(Object.fromEntries(Object.entries(f).filter(([_,v])=>v))).toString();

  const load=async()=>{
    if(!f.id_tahun_ajaran || !f.semester) return;
    const [s,d,t,m,k,b] = await Promise.all([
      fetch(q(routes.summary)).then(r=>r.json()),
      fetch(q(routes.distribution)).then(r=>r.json()),
      fetch(q(routes.trend)).then(r=>r.json()),
      fetch(q(routes.mapelLeaderboard)).then(r=>r.json()),
      fetch(q(routes.kelasLeaderboard)).then(r=>r.json()),
      fetch(q(routes.tuntasBreakdown)).then(r=>r.json()),
    ]);
    setData({ summary:s, distribution:d, trend:t, mapel:m, kelas:k, breakdown:b });
  };

  useEffect(()=>{ /* auto-load if desired */ },[]);

  const pieData = useMemo(()=>[
    { name:"Tuntas", value:data.breakdown?.tuntas?.ya||0 },
    { name:"Tidak", value:data.breakdown?.tuntas?.tidak||0 },
  ],[data.breakdown]);

  return (
    <div className="p-6">
      <Head title="Analitik Nilai" />
      <h1 className="text-2xl font-semibold mb-4">Analitik Nilai</h1>

      <div className="bg-white p-4 rounded-xl shadow mb-5 grid md:grid-cols-5 gap-3">
        <Select label="TA" value={f.id_tahun_ajaran} onChange={v=>setF(s=>({...s,id_tahun_ajaran:v}))} options={options.tahunAjaran}/>
        <Select label="Semester" value={f.semester} onChange={v=>setF(s=>({...s,semester:v}))} options={options.semester}/>
        <Select label="Kelas (ops)" value={f.id_kelas} onChange={v=>setF(s=>({...s,id_kelas:v}))} options={options.kelas}/>
        <Select label="Mapel (ops)" value={f.id_mapel} onChange={v=>setF(s=>({...s,id_mapel:v}))} options={options.mapel}/>
        <div className="flex items-end"><button onClick={load} className="w-full py-2 bg-blue-600 text-white rounded">Terapkan</button></div>
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-5 gap-3 mb-5">
        <Card label="Total Siswa" val={num(data.summary?.total_siswa)}/>
        <Card label="Header Nilai" val={num(data.summary?.total_header)}/>
        <Card label="Progress Input" val={pct(data.summary?.completion_pct)}/>
        <Card label="Rata-rata" val={fix2(data.summary?.avg_nilai)}/>
        <Card label="Pass Rate" val={pct(data.summary?.pass_rate_pct)}/>
      </div>

      {/* Charts */}
      <div className="grid xl:grid-cols-3 gap-4 mb-5">
        <Block title="Distribusi Nilai">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={data.distribution}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="range"/><YAxis/><Tooltip/><Bar dataKey="count"/></BarChart>
            </ResponsiveContainer>
          </div>
        </Block>
        <Block title="Tren Bulanan">
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={data.trend}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="period"/><YAxis/><Tooltip/><Legend/><Line type="monotone" dataKey="avg_nilai"/><Line type="monotone" dataKey="pass_rate_pct"/></LineChart>
            </ResponsiveContainer>
          </div>
        </Block>
        <Block title="Tuntas vs Tidak">
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart><Pie data={pieData} dataKey="value" label>{pieData.map((_,i)=><Cell key={i} />)}</Pie><Tooltip/><Legend/></PieChart>
            </ResponsiveContainer>
          </div>
        </Block>
      </div>

      <div className="grid xl:grid-cols-2 gap-4">
        <Block title="Leaderboard Mapel">
          <div className="h-80">
            <ResponsiveContainer>
              <BarChart data={data.mapel}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="nama_mapel" interval={0} angle={-20} textAnchor="end" height={60}/><YAxis/><Tooltip/><Legend/><Bar dataKey="avg_nilai"/><Bar dataKey="pass_rate_pct"/></BarChart>
            </ResponsiveContainer>
          </div>
        </Block>
        <Block title="Leaderboard Kelas">
          <div className="h-80">
            <ResponsiveContainer>
              <BarChart data={data.kelas}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="nama_kelas" interval={0} angle={-20} textAnchor="end" height={60}/><YAxis/><Tooltip/><Legend/><Bar dataKey="avg_nilai"/><Bar dataKey="pass_rate_pct"/></BarChart>
            </ResponsiveContainer>
          </div>
        </Block>
      </div>
    </div>
  );
}
function Select({label,value,onChange,options}){return(<div><label className="block text-sm mb-1">{label}</label><select className="w-full border rounded px-3 py-2" value={value||""} onChange={e=>onChange(e.target.value)}><option value="">— Pilih —</option>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></div>);}
function Card({label,val}){return(<div className="bg-white rounded-xl shadow p-4"><div className="text-sm text-gray-500">{label}</div><div className="text-2xl font-semibold">{val??"—"}</div></div>);}
function Block({title,children}){return(<div className="bg-white rounded-xl shadow p-4"><div className="font-semibold mb-2">{title}</div>{children}</div>);}
function num(n){return n==null?"—":Number(n).toLocaleString();}
function pct(n){return n==null?"—":`${Number(n).toFixed(2)}%`;}
function fix2(n){return n==null?"—":Number(n).toFixed(2);}
