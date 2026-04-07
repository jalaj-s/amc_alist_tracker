"use client";

import { useEffect, useRef } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  useEffect(() => {
    if (open) { document.body.style.overflow = "hidden"; }
    else { document.body.style.overflow = ""; }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-[#1e1e2e] rounded-t-2xl max-h-[85vh] overflow-y-auto border-t border-gray-700" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-9 h-1 bg-gray-600 rounded-full" />
        </div>
        <div className="px-5 pb-8">{children}</div>
      </div>
    </div>
  );
}
