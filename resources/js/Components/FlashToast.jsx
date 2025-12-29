import React, { useEffect, useState } from "react";
import { usePage } from "@inertiajs/react";
import ToastNotification from "@/Components/ToastNotification";

export default function FlashToast() {
  const { flash } = usePage().props;
  const [toast, setToast] = useState({ show: false, message: "" });

  useEffect(() => {
    const msg = flash?.success || flash?.error || flash?.message;
    if (msg) setToast({ show: true, message: msg });
  }, [flash]);

  return (
    <ToastNotification
      show={toast.show}
      message={toast.message}
      onClose={() => setToast((p) => ({ ...p, show: false }))}
    />
  );
}
