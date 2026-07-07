"use client";

import { useState } from "react";
import DraftForm from "@/components/DraftForm";
import ChatForm from "@/components/ChatForm";

type Mode = "form" | "chat";

export default function CreationWorkspace() {
  const [mode, setMode] = useState<Mode>("form");

  return (
    <div>
      <div className="mb-6 inline-flex rounded-xl border border-anb-line bg-anb-white p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setMode("form")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            mode === "form"
              ? "bg-anb-navy text-anb-white shadow"
              : "text-anb-navy/70 hover:text-anb-navy"
          }`}
        >
          نموذج منظم
        </button>
        <button
          type="button"
          onClick={() => setMode("chat")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            mode === "chat"
              ? "bg-anb-navy text-anb-white shadow"
              : "text-anb-navy/70 hover:text-anb-navy"
          }`}
        >
          محادثة حرة
        </button>
      </div>

      {mode === "form" ? <DraftForm /> : <ChatForm />}
    </div>
  );
}
