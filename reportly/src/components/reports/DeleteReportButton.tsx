"use client";

import { Trash2 } from "lucide-react";

type DeleteReportButtonProps = {
  reportId: string;
  deleteAction: (formData: FormData) => void;
};

export default function DeleteReportButton({ reportId, deleteAction }: DeleteReportButtonProps) {
  const handleSubmit = (e: React.FormEvent) => {
    if (!confirm("Are you sure you want to delete this report? This cannot be undone.")) {
      e.preventDefault();
    }
  };

  return (
    <form action={deleteAction} onSubmit={handleSubmit}>
      <input type="hidden" name="reportId" value={reportId} />
      <button
        type="submit"
        className="p-1.5 rounded-lg border border-red-950/40 bg-red-950/20 text-red-400 hover:bg-red-950/40 hover:border-red-900/60 transition cursor-pointer"
        title="Delete report"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </form>
  );
}
