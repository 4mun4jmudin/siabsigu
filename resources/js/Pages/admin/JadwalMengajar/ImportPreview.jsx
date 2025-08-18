import React from "react";
import { useForm, router } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ImportPreview({ preview, errors }) {
    const { post } = useForm();

    const handleConfirm = () => {
        post(route("admin.jadwal-mengajar.confirmImport"), {
            data: preview, // preview sekarang sudah ada id_kelas, id_guru, id_mapel
        });
    };


    return (
        <div className="p-4">
            <h1 className="text-xl font-bold mb-4">Preview Import Jadwal</h1>

            {errors.length > 0 && (
                <div className="bg-red-100 text-red-600 p-3 rounded mb-4">
                    <ul>
                        {errors.map((err, i) => (
                            <li key={i}>{err}</li>
                        ))}
                    </ul>
                </div>
            )}

            <Card>
                <CardContent>
                    <table className="w-full border">
                        <thead className="bg-gray-100">
                            <tr>
                                <th>Hari</th>
                                <th>Jam Mulai</th>
                                <th>Jam Selesai</th>
                                <th>Kelas</th>
                                <th>Guru</th>
                                <th>Mapel</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {preview.map((row, i) => (
                                <tr key={i} className="border-b">
                                    <td>{row.hari}</td>
                                    <td>{row.jam_mulai}</td>
                                    <td>{row.jam_selesai}</td>
                                    <td>{row.kelas}</td>
                                    <td>{row.guru}</td>
                                    <td>{row.mapel}</td>
                                    <td
                                        className={
                                            row.status === "OK"
                                                ? "text-green-600"
                                                : "text-red-600"
                                        }
                                    >
                                        {row.status}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            <div className="mt-4 flex gap-2">
                <Button variant="secondary" onClick={() => history.back()}>
                    Kembali
                </Button>
                <Button onClick={handleConfirm}>Konfirmasi Import</Button>
            </div>
        </div>
    );
}
