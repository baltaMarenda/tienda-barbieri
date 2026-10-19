import { useCallback, useEffect, useRef, useState } from "react";

export interface PendingImage {
  file: File;
  /** Object URL para la vista previa; se libera al descartar o desmontar. */
  preview: string;
}

/** Imágenes elegidas del disco que todavía no se subieron. */
export function usePendingImages() {
  const [pending, setPending] = useState<PendingImage[]>([]);

  const latest = useRef(pending);
  useEffect(() => {
    latest.current = pending;
  }, [pending]);

  useEffect(() => {
    return () => {
      for (const item of latest.current) URL.revokeObjectURL(item.preview);
    };
  }, []);

  const add = useCallback((files: File[]) => {
    const added = files.map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setPending((current) => [...current, ...added]);
  }, []);

  const remove = useCallback((index: number) => {
    setPending((current) => {
      URL.revokeObjectURL(current[index].preview);
      return current.filter((_, i) => i !== index);
    });
  }, []);

  return { pending, add, remove };
}
