import React, { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { CheckCircleIcon, XCircleIcon, XMarkIcon } from "@heroicons/react/24/solid";

export default function CenterPopupNotice({
  message,
  type = "success", // success | error
  title,
  duration = 2200,
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!message) return;

    setOpen(true);
    const t = setTimeout(() => setOpen(false), duration);
    return () => clearTimeout(t);
  }, [message, duration]);

  if (!message) return null;

  const isError = type === "error";
  const Icon = isError ? XCircleIcon : CheckCircleIcon;

  const computedTitle =
    title ?? (isError ? "Gagal menyimpan" : "Berhasil disimpan");

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[9999]" onClose={setOpen}>
        {/* Backdrop */}
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

        {/* Centered panel */}
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
            <Dialog.Panel className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-sky-200">
              {/* Top accent */}
              <div className="h-1.5 bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-500" />

              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl ${
                      isError
                        ? "bg-rose-50 ring-1 ring-rose-200"
                        : "bg-sky-50 ring-1 ring-sky-200"
                    }`}
                  >
                    <Icon
                      className={`h-6 w-6 ${
                        isError ? "text-rose-600" : "text-sky-600"
                      }`}
                    />
                  </div>

                  <div className="flex-1">
                    <Dialog.Title className="text-sm font-semibold text-slate-900">
                      {computedTitle}
                    </Dialog.Title>
                    <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                      {message}
                    </p>

                    {/* little hint bar */}
                    <div className="mt-3 h-1 w-24 rounded-full bg-sky-100" />
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
                    className="inline-flex items-center rounded-xl bg-sky-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
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
