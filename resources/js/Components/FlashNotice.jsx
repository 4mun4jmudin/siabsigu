import { useEffect, useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import { usePage } from "@inertiajs/react";

export default function FlashNotice({ duration = 2200 }) {
  const { flash } = usePage().props;
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState(null);

  useEffect(() => {
    if (flash?.success) {
      setPayload({ type: "success", message: flash.success });
      setOpen(true);
    } else if (flash?.error) {
      setPayload({ type: "error", message: flash.error });
      setOpen(true);
    }
  }, [flash]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => setOpen(false), duration);
    return () => clearTimeout(t);
  }, [open, duration]);

  if (!payload) return null;

  const isError = payload.type === "error";
  const Icon = isError ? XCircleIcon : CheckCircleIcon;

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-[9999] grid place-items-center px-4">
        <Dialog.Panel className="w-full max-w-sm rounded-xl bg-white shadow-xl p-4">
          <div className="flex gap-3">
            <Icon className={`w-6 h-6 ${isError ? "text-rose-600" : "text-sky-600"}`} />
            <div>
              <h4 className="font-semibold text-sm">
                {isError ? "Gagal" : "Berhasil"}
              </h4>
              <p className="text-sm text-gray-600">{payload.message}</p>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    </Transition.Root>
  );
}
