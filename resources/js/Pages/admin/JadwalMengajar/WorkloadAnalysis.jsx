import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export default function WorkloadAnalysis({ analysis, tahunAjaranAktif }) {
    return (
        <div className="p-4">
            <h1 className="text-xl font-bold mb-4">
                Analisis Beban Kerja Guru ({tahunAjaranAktif?.nama ?? "Tahun Ajaran"})
            </h1>

            <Card>
                <CardContent>
                    <table className="w-full border">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-2 text-left">Guru</th>
                                <th className="p-2 text-center">Total Jam</th>
                                <th className="p-2 text-center">Beban</th>
                            </tr>
                        </thead>
                        <tbody>
                            {analysis.map((row) => {
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
                            })}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}
