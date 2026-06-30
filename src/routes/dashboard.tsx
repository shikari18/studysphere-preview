import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Image as ImgIcon, Type, Pen, Eraser, Trash2, Download } from "lucide-react";
import { MobileShell, PageHeader, Section } from "@/components/mobile/Shell";
import { GlassCard, Pill } from "@/components/mobile/ui";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — StudySphere AI" }] }),
  component: Dashboard,
});

type Block =
  | { id: string; type: "text"; value: string }
  | { id: string; type: "image"; src: string };

function Dashboard() {
  const [blocks, setBlocks] = useState<Block[]>([
    { id: "1", type: "text", value: "✦ Free board — jot anything. Ideas, sketches, screenshots." },
  ]);
  const fileRef = useRef<HTMLInputElement>(null);

  const addText = () =>
    setBlocks((b) => [...b, { id: crypto.randomUUID(), type: "text", value: "" }]);

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setBlocks((b) => [...b, { id: crypto.randomUUID(), type: "image", src: url }]);
  };

  const remove = (id: string) => setBlocks((b) => b.filter((x) => x.id !== id));

  return (
    <MobileShell>
      <PageHeader
        title="Dashboard"
        subtitle="Your free jotting space"
        right={<Pill tone="primary">Auto-saved</Pill>}
      />

      <Section>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={addText} className="tap glass-strong rounded-full px-3.5 py-2 text-[12px] font-medium flex items-center gap-1.5">
            <Type size={13} /> Text
          </button>
          <button onClick={() => fileRef.current?.click()} className="tap glass-strong rounded-full px-3.5 py-2 text-[12px] font-medium flex items-center gap-1.5">
            <ImgIcon size={13} /> Image
          </button>
          <button className="tap glass-strong rounded-full px-3.5 py-2 text-[12px] font-medium flex items-center gap-1.5">
            <Pen size={13} /> Draw
          </button>
          <button className="tap glass-strong rounded-full px-3.5 py-2 text-[12px] font-medium flex items-center gap-1.5">
            <Eraser size={13} /> Clear
          </button>
          <button className="tap glass-strong rounded-full px-3.5 py-2 text-[12px] font-medium flex items-center gap-1.5">
            <Download size={13} /> Export
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onUpload} />
        </div>
      </Section>

      <Section>
        <div className="space-y-3">
          {blocks.map((b) => (
            <GlassCard key={b.id} className="!p-3 group relative">
              <button
                onClick={() => remove(b.id)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full glass-strong flex items-center justify-center opacity-60 hover:opacity-100"
                aria-label="Delete"
              >
                <Trash2 size={12} />
              </button>
              {b.type === "text" ? (
                <textarea
                  defaultValue={b.value}
                  placeholder="Start writing…"
                  className="w-full bg-transparent outline-none resize-none text-[14px] leading-relaxed min-h-[80px] pr-8"
                />
              ) : (
                <img src={b.src} alt="" className="w-full rounded-[14px]" />
              )}
            </GlassCard>
          ))}

          <button
            onClick={addText}
            className="w-full tap glass rounded-[18px] py-4 text-[13px] text-muted-foreground border border-dashed border-hairline"
          >
            + Add a block
          </button>
        </div>
      </Section>
    </MobileShell>
  );
}
