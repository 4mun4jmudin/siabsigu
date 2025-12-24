import React, { Fragment, useEffect, useMemo, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { CheckCircleIcon, XCircleIcon, XMarkIcon } from "@heroicons/react/24/solid";

export default function AppCenterNotice({
  notice, // { id, message, type, title }
  duration = 2200,
  onClose,
}) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);

  const id = notice?.id;
  const message = notice?.message;
  const type = notice?.type || "success";
  const title = notice?.title;

  const isError = type === "error";
  const Icon = isError ? XCircleIcon : CheckCircleIcon;

  const computedTitle = useMemo(() => {
    if (title) return title;
    return isError ? "Gagal" : "Berhasil";
  }, [title, isError]);

  // buka popup setiap kali notice.id berubah
  useEffect(() => {
    if (!message) return;
    setData({ id, message, type, title: computedTitle });
    setOpen(true);
  }, [id]); // ✅ id jadi trigger

  // auto close
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      setOpen(false);
      onClose?.();
    }, duration);
    return () => clearTimeout(t);
  }, [open, duration, onClose]);

  if (!data) return null;

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[9999]" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/35 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 grid place-items-center px-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-250"
            enterFrom="opacity-0 scale-95 translate-y-2"
            enterTo="opacity-100 scale-100 translate-y-0"
            leave="ease-in duration-180"
            leaveFrom="opacity-100 scale-100 translate-y-0"
            leaveTo="opacity-0 scale-95 translate-y-2"
          >
            <Dialog.Panel className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
              <div className={`h-1.5 ${isError ? "bg-rose-500" : "bg-sky-500"}`} />

              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl ${
                      isError ? "bg-rose-50 ring-1 ring-rose-200" : "bg-sky-50 ring-1 ring-sky-200"
                    }`}
                  >
                    <Icon className={`h-6 w-6 ${isError ? "text-rose-600" : "text-sky-600"}`} />
                  </div>

                  <div className="flex-1">
                    <Dialog.Title className="text-sm font-semibold text-slate-900">
                      {data.title}
                    </Dialog.Title>
                    <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                      {data.message}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                    aria-label="Tutup"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className={`inline-flex items-center rounded-xl px-3.5 py-2 text-sm font-semibold text-white shadow-sm ${
                      isError ? "bg-rose-600 hover:bg-rose-700" : "bg-sky-600 hover:bg-sky-700"
                    }`}
                  >
                    Oke
                  </button>
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
