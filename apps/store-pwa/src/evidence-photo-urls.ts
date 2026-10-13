import { useEffect, useState } from "react";

import type { DemoPhoto } from "./demo-records";

// Photo bytes belong to the record; temporary URLs belong to its mounted gallery.
export function useEvidencePhotoUrls(photos: readonly DemoPhoto[]) {
  const [resolved, setResolved] = useState<{ input: readonly DemoPhoto[]; photos: readonly DemoPhoto[] } | null>(null);
  useEffect(() => {
    if (!photos.some((photo) => photo.blob)) return;
    const ownedUrls: string[] = [];
    const next = photos.map((photo) => {
      if (!photo.blob) return photo;
      const src = URL.createObjectURL(photo.blob);
      ownedUrls.push(src);
      return { ...photo, src };
    });
    setResolved({ input: photos, photos: next });
    return () => { ownedUrls.forEach((url) => URL.revokeObjectURL(url)); };
  }, [photos]);
  return resolved?.input === photos ? resolved.photos : photos;
}
