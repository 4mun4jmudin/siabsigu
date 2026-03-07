import React, { useEffect } from "react";
import { usePage } from "@inertiajs/react";
import { toast } from "@/utils/toast";

export default function FlashToast() {
  const { flash } = usePage().props;

  useEffect(() => {
    const msg = flash?.success || flash?.error || flash?.message;
    if (msg) toast(msg);
  }, [flash]);

  return null;
}
