const EXT_MAP: Record<string, "image" | "video" | "audio" | "text"> = {
  jpg: "image", jpeg: "image", png: "image", webp: "image",
  heic: "image", tif: "image", tiff: "image",
  mp4: "video", mov: "video", m4v: "video", webm: "video",
  mp3: "audio", wav: "audio", aiff: "audio", aif: "audio",
  m4a: "audio", flac: "audio", ogg: "audio",
  txt: "text", md: "text", rtf: "text", pdf: "text",
}

export function getMediaTypeForFile(filename: string): "image" | "video" | "audio" | "text" | null {
  const ext = filename.split(".").pop()?.toLowerCase() ?? ""
  return EXT_MAP[ext] ?? null
}

export function isValidFile(filename: string): boolean {
  return getMediaTypeForFile(filename) !== null
}

export const ACCEPTED_EXTENSIONS = Object.keys(EXT_MAP)
export const ACCEPT_ATTR = [
  "image/jpeg,image/png,image/webp,image/heic,image/tiff",
  ".jpg,.jpeg,.png,.webp,.heic,.tif,.tiff",
  "video/mp4,video/quicktime,video/x-m4v,video/webm",
  ".mp4,.mov,.m4v,.webm",
  "audio/mpeg,audio/wav,audio/aiff,audio/mp4,audio/x-m4a,audio/flac,audio/ogg",
  ".mp3,.wav,.aiff,.aif,.m4a,.flac,.ogg",
  "text/plain,text/markdown,application/rtf,application/pdf",
  ".txt,.md,.rtf,.pdf",
].join(",")
