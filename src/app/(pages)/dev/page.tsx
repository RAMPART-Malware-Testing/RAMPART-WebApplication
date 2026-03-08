"use client";

import { useToast } from "@/components/ui/ToastProvider";

export default function DevPage() {
  const notify = useToast();

  return (
    <div className="p-10 space-x-4">
      <button
        onClick={() => notify.success("Login successful")}
        className="bg-green-500 px-4 py-2 rounded"
      >
        Test Success
      </button>

      <button
        onClick={() => notify.error("Invalid password")}
        className="bg-red-500 px-4 py-2 rounded"
      >
        Test Error
      </button>
      <button
        onClick={() => notify.warning("ertyuiop;lkjhgfddfgjmklkjhgfdfguiuytr")}
        className="bg-amber-500 px-4 py-2 rounded"
      >
        Test Warning
      </button>
      <button
        onClick={() => notify.info("info message")}
        className="bg-blue-500 px-4 py-2 rounded"
      >
        Test Info
      </button>
    </div>
  );
}