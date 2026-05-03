/** İlan görselleri: uzun kenar üst sınırı (px). Daha büyük yüklemler orantılı küçültülür. */
export const LISTING_IMAGE_MAX_EDGE_PX = 1200;

const JPEG_QUALITY = 0.85;

function baseNameFromFileName(name: string): string {
  const i = name.lastIndexOf(".");
  if (i <= 0) return "ilan";
  return name.slice(0, i).replace(/[^\w.-]/g, "_") || "ilan";
}

/**
 * Tarayıcıda ilan fotoğrafını standart boyuta indirir (uzun kenar en fazla
 * {@link LISTING_IMAGE_MAX_EDGE_PX}), çıktıyı JPEG yapar.
 * Açılamayan veya işlenemeyen dosyada orijinal `file` döner.
 */
export async function resizeListingImageForUpload(file: File): Promise<File> {
  if (typeof createImageBitmap !== "function") {
    return file;
  }
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }
  try {
    const w = bitmap.width;
    const h = bitmap.height;
    const maxEdge = LISTING_IMAGE_MAX_EDGE_PX;
    let tw = w;
    let th = h;
    if (w > maxEdge || h > maxEdge) {
      if (w >= h) {
        tw = maxEdge;
        th = Math.max(1, Math.round((h * maxEdge) / w));
      } else {
        th = maxEdge;
        tw = Math.max(1, Math.round((w * maxEdge) / h));
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return file;
    }
    if (tw !== w || th !== h) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
    }
    ctx.drawImage(bitmap, 0, 0, tw, th);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/jpeg", JPEG_QUALITY);
    });
    if (!blob || blob.size === 0) {
      return file;
    }

    const outName = `${baseNameFromFileName(file.name)}.jpg`;
    return new File([blob], outName, {
      type: "image/jpeg",
      lastModified: Date.now()
    });
  } catch {
    return file;
  } finally {
    bitmap.close();
  }
}
