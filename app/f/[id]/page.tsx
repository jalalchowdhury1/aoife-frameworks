"use client";

import { use } from "react";
import Link from "next/link";
import { byId } from "@/lib/frameworks";
import { StageEngine } from "@/lib/engine/StageEngine";

export default function FrameworkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const framework = byId(id);

  if (!framework) {
    return (
      <div className="p-8 text-center">
        <p className="text-xl text-purple-700 mb-4">Hmm, I can&apos;t find that puzzle.</p>
        <Link href="/" className="text-pink-500 font-bold underline">
          Back home 🏠
        </Link>
      </div>
    );
  }

  return <StageEngine framework={framework} />;
}
