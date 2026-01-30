import React, { useState } from 'react';
import Modal from '../../../Components/Modal.jsx';
import { 
    CloudArrowUpIcon, 
    DocumentTextIcon, 
    ArrowRightIcon, 
    CheckCircleIcon, 
    ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

export default function ImportModal({ show, onClose, onSuccess }) {
    const [step, setStep] = useState(1); // 1: Upload, 2: Mapping, 3: Processing
    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [mappings, setMappings] = useState({});
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});
    const [importStats, setImportStats] = useState(null);

    // Kolom Database yang dibutuhkan
    const dbColumns = [
        { key: 'nis', label: 'NIS', required: true },
        { key: 'nisn', label: 'NISN', required: true },
        { key: 'nama_lengkap', label: 'Nama Lengkap', required: true },
        { key: 'kelas', label: 'Kelas (Mis: X RPL 1)', required: true },
        { key: 'jenis_kelamin', label: 'Jenis Kelamin (L/P)', required: true },
        { key: 'tempat_lahir', label: 'Tempat Lahir', required: false },
        { key: 'tanggal_lahir', label: 'Tanggal Lahir (YYYY-MM-DD)', required: false },
        { key: 'nik', label: 'NIK', required: false },
    ];

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setErrors({});
    };

    const uploadAndPreview = async () => {
        if (!file) {
            setErrors({ file: 'Silakan pilih file terlebih dahulu.' });
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setProcessing(true);
        try {
            // Kita pakai axios langsung biar ga full page reload, karena ini proses interaktif
            const response = await axios.post(route('admin.siswa.import.preview'), formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            setPreviewData(response.data);
            setMappings(response.data.guesses); // "AI" Smart Mapping result
            setStep(2);
        } catch (error) {
            setErrors({ file: error.response?.data?.message || 'Gagal membaca file.' });
        } finally {
            setProcessing(false);
        }
    };

    const handleMappingChange = (dbKey, fileHeaderIndex) => {
        setMappings(prev => ({
            ...prev,
            [dbKey]: fileHeaderIndex
        }));
    };

    const executeImport = async () => {
        setProcessing(true);
        try {
            const payload = {
                file_path: previewData.temp_path, // Path file sementara di server
                mappings: mappings
            };

            const response = await axios.post(route('admin.siswa.import.store'), payload);
            setImportStats(response.data);
            setStep(3);
            if (onSuccess) onSuccess();
        } catch (error) {
            setErrors({ general: error.response?.data?.message || 'Terjadi kesalahan saat import.' });
        } finally {
            setProcessing(false);
        }
    };

    const resetModal = () => {
        setStep(1);
        setFile(null);
        setPreviewData(null);
        setImportStats(null);
        setErrors({});
        onClose();
    };

    return (
        <Modal show={show} onClose={resetModal} maxWidth="2xl">
            <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Import Data Siswa (Excel/CSV)
                </h2>

                {/* STEP 1: UPLOAD */}
                {step === 1 && (
                    <div className="space-y-4">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition">
                            <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-sm text-gray-600 mb-2">Drag & drop file Excel/CSV di sini, atau klik untuk memilih.</p>
                            <input 
                                type="file" 
                                accept=".csv,.xlsx,.xls" 
                                onChange={handleFileChange}
                                className="block w-full text-sm text-slate-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100 mx-auto w-max"
                            />
                            {errors.file && <p className="text-red-500 text-xs mt-2">{errors.file}</p>}
                        </div>
                        
                        <div className="bg-blue-50 p-4 rounded-md flex items-start">
                            <DocumentTextIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                            <div className="text-sm text-blue-700">
                                <p className="font-semibold">Tips Template:</p>
                                <p>Pastikan baris pertama adalah Header. Sistem akan mencoba mendeteksi kolom secara otomatis (Smart Detection).</p>
                                <a href={route('admin.siswa.import.template')} className="underline hover:text-blue-900 mt-1 inline-block">Download Template Contoh</a>
                            </div>
                        </div>

                        <div className="flex justify-end mt-4">
                            <button onClick={resetModal} className="px-4 py-2 text-gray-600 hover:text-gray-800 mr-2">Batal</button>
                            <button 
                                onClick={uploadAndPreview} 
                                disabled={processing || !file}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                            >
                                {processing ? 'Menganalisa...' : 'Lanjut ke Mapping'} <ArrowRightIcon className="h-4 w-4 ml-2" />
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 2: MAPPING */}
                {step === 2 && previewData && (
                    <div className="space-y-4">
                        <div className="bg-green-50 p-3 rounded-md mb-4 flex items-center">
                            <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                            <p className="text-sm text-green-700">File berhasil dibaca. Silakan verifikasi kolom di bawah ini.</p>
                        </div>

                        <div className="max-h-96 overflow-y-auto pr-2">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-100 sticky top-0">
                                    <tr>
                                        <th className="px-3 py-2 text-left w-1/3">Kolom Database</th>
                                        <th className="px-3 py-2 text-left w-1/3">Kolom di File Excel</th>
                                        <th className="px-3 py-2 text-left w-1/3">Contoh Data (Baris 1)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {dbColumns.map((col) => {
                                        const selectedIndex = mappings[col.key];
                                        const exampleValue = selectedIndex !== '' && selectedIndex !== undefined 
                                            ? previewData.rows[0][selectedIndex] 
                                            : '-';

                                        return (
                                            <tr key={col.key}>
                                                <td className="px-3 py-3 font-medium text-gray-700">
                                                    {col.label} {col.required && <span className="text-red-500">*</span>}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <select 
                                                        value={mappings[col.key] ?? ''}
                                                        onChange={(e) => handleMappingChange(col.key, e.target.value)}
                                                        className={`w-full text-sm rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${mappings[col.key] !== undefined ? 'bg-blue-50 border-blue-300' : ''}`}
                                                    >
                                                        <option value="">-- Abaikan --</option>
                                                        {previewData.headers.map((header, idx) => (
                                                            <option key={idx} value={idx}>{header}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-3 py-3 text-gray-500 italic truncate max-w-xs">
                                                    {exampleValue}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {errors.general && (
                            <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm flex items-center">
                                <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                                {errors.general}
                            </div>
                        )}

                        <div className="flex justify-end mt-4 pt-4 border-t">
                            <button onClick={() => setStep(1)} className="px-4 py-2 text-gray-600 hover:text-gray-800 mr-2">Kembali</button>
                            <button 
                                onClick={executeImport} 
                                disabled={processing}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
                            >
                                {processing ? 'Sedang Mengimport...' : 'Mulai Import'} <CloudArrowUpIcon className="h-4 w-4 ml-2" />
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3: SUCCESS */}
                {step === 3 && importStats && (
                    <div className="text-center py-8">
                        <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Import Selesai!</h3>
                        <div className="bg-gray-50 rounded-lg p-4 max-w-sm mx-auto mb-6 text-sm">
                            <div className="flex justify-between mb-2">
                                <span>Total Data:</span>
                                <span className="font-bold">{importStats.total}</span>
                            </div>
                            <div className="flex justify-between mb-2 text-green-600">
                                <span>Berhasil:</span>
                                <span className="font-bold">{importStats.success}</span>
                            </div>
                            <div className="flex justify-between text-red-600">
                                <span>Gagal/Skip:</span>
                                <span className="font-bold">{importStats.failed}</span>
                            </div>
                        </div>
                        {importStats.errors && importStats.errors.length > 0 && (
                            <div className="mb-6 text-left max-h-40 overflow-y-auto bg-red-50 p-3 rounded border border-red-100 text-xs">
                                <p className="font-bold text-red-700 mb-1">Log Error:</p>
                                <ul className="list-disc list-inside text-red-600">
                                    {importStats.errors.slice(0, 10).map((err, i) => (
                                        <li key={i}>{err}</li>
                                    ))}
                                    {importStats.errors.length > 10 && <li>...dan {importStats.errors.length - 10} lainnya</li>}
                                </ul>
                            </div>
                        )}
                        <button 
                            onClick={resetModal}
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Tutup
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
}