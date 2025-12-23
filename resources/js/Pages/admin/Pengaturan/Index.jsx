import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import Tab from '@/Components/Tab';
import GeneralSettingsForm from './Partials/GeneralSettingsForm';
import AbsensiSettingsForm from './Partials/AbsensiSettingsForm';
import UserSettingsForm from './Partials/UserSettingsForm';
import BackupSettingsForm from './Partials/BackupSettingsForm';
import SystemSettingsForm from './Partials/SystemSettingsForm';
import { Home, Clock, Users, Server, Database, ChevronLeft, ChevronRight } from 'lucide-react';
import CenterPopupNotice from "@/Components/CenterPopupNotice";


// export default function Pengaturan({ auth, pengaturan = {}, tahun_ajaran = [], stats = {} }) {
export default function Pengaturan({ auth, pengaturan = {}, tahun_ajaran = [], stats = {}, status = null, error = null }) {

  const STORAGE_KEY = 'pengaturan.activeTab.v1';
  const defaultTab = 'umum';
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved || defaultTab;
    } catch (e) {
      return defaultTab;
    }
  });

  // For responsive: show compact tabs on small screens
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const onResize = () => setCompact(window.innerWidth < 640);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, activeTab);
    } catch (e) { }
  }, [activeTab]);

  // Keyboard navigation: left / right to switch tabs
  useEffect(() => {
    const keys = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const order = ['umum', 'absensi', 'pengguna', 'sistem', 'backup'];
        const idx = order.indexOf(activeTab);
        if (idx === -1) return;
        const next = e.key === 'ArrowLeft' ? order[(idx - 1 + order.length) % order.length] : order[(idx + 1) % order.length];
        setActiveTab(next);
      }
    };
    window.addEventListener('keydown', keys);
    return () => window.removeEventListener('keydown', keys);
  }, [activeTab]);

  const tabs = useMemo(() => ([
    { id: 'umum', label: 'Umum', icon: Home },
    { id: 'absensi', label: 'Absensi', icon: Clock },
    { id: 'pengguna', label: 'Pengguna', icon: Users },
    { id: 'sistem', label: 'Sistem', icon: Server },
    { id: 'backup', label: 'Backup', icon: Database },
  ]), []);

  const renderContent = () => {
    switch (activeTab) {
      case 'umum':
        return <GeneralSettingsForm pengaturan={pengaturan} tahun_ajaran={tahun_ajaran} className="" />;
      case 'absensi':
        return <AbsensiSettingsForm pengaturan={pengaturan} className="" />;
      case 'pengguna':
        return <UserSettingsForm pengaturan={pengaturan} stats={stats} className="" />;
      case 'sistem':
        return <SystemSettingsForm pengaturan={pengaturan} className="" />;
      case 'backup':
        return <BackupSettingsForm pengaturan={pengaturan} className="" />;
      default:
        return null;
    }
  };

  return (
    <AdminLayout user={auth.user}>
      <Head title="Pengaturan Sistem" />
      <CenterPopupNotice
        message={status || error}
        type={error ? "error" : "success"}
      />

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Pengaturan Sistem</h1>
            <p className="text-sm text-gray-500 mt-1">Atur konfigurasi aplikasi, keamanan, backup, dan fitur lain.</p>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="hidden sm:flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">Fokus: <span className="font-medium ml-1">{tabs.find(t => t.id === activeTab)?.label}</span></span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="p-2 rounded-md hover:bg-gray-100"
                onClick={() => {
                  const order = tabs.map(t => t.id);
                  const idx = order.indexOf(activeTab);
                  setActiveTab(order[(idx - 1 + order.length) % order.length]);
                }}
                aria-label="Previous tab"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                className="p-2 rounded-md hover:bg-gray-100"
                onClick={() => {
                  const order = tabs.map(t => t.id);
                  const idx = order.indexOf(activeTab);
                  setActiveTab(order[(idx + 1) % order.length]);
                }}
                aria-label="Next tab"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-4">
          {/* Tabs Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex flex-wrap gap-2 sm:gap-6" aria-label="Tabs">
              {tabs.map((t) => (
                <Tab
                  key={t.id}
                  name={t.id}
                  label={t.label}
                  active={activeTab === t.id}
                  onClick={() => setActiveTab(t.id)}
                  icon={t.icon}
                  compact={compact}
                />
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="mt-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
