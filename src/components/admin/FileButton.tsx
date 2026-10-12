import { ImagePlus } from "lucide-react";

export function FileButton({ label, multiple, disabled, onFiles }: { label: string; multiple?: boolean; disabled?: boolean; onFiles: (f: FileList | null) => void }) {
  return (
    <label className={`inline-flex cursor-pointer items-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-semibold hover:bg-secondary ${disabled ? "pointer-events-none opacity-50" : ""}`}>
      <ImagePlus className="size-4" /> {label}
      <input type="file" accept="image/*" multiple={multiple} className="sr-only" onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
    </label>
  );
}
