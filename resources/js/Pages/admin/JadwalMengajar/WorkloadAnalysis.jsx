import React from "react";
import { Card, CardContent } from "@/Components/ui/card";
import { Progress } from "@/Components/ui/progress";
import { Button } from "@/Components/ui/button";

export default function WorkloadAnalysis({ analysis = [], tahunAjaranAktif = {} }) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Analisis Beban Kerja Guru ({tahunAjaranAktif?.tahun_ajaran ?? "Tahun Ajaran"})
        </h1>
        <Button onClick={() => window.location.reload()}>Refresh</Button>
      </div>

      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Guru</th>
                  <th className="p-2 text-center">Total Jam</th>
                  <th className="p-2 text-center">Beban</th>
                </tr>
              </thead>
              <tbody>
                {analysis.length > 0 ? (
                  analysis.map((row) => {
                    let color = "bg-green-500";
                    if (row.status === "warning") color = "bg-yellow-500";
                    if (row.status === "overload") color = "bg-red-500";

                    const percentage = Math.min((row.total_jam / 24) * 100, 100);

                    return (
                      <tr key={row.id_guru} className="border-b">
                        <td className="p-2">{row.nama}</td>
                        <td className="p-2 text-center">{row.total_jam} jam</td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <Progress value={percentage} className={`h-3 ${color}`} />
                            <span>{percentage.toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="3" className="text-center text-gray-500 p-4">
                      Belum ada data analisis
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
