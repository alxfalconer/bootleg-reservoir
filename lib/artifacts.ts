export type ArtifactType =
  | "screenshot"
  | "photograph"
  | "film still"
  | "painting"
  | "drawing"
  | "collage"
  | "document"
  | "advertisement"
  | "vhs"
  | "video"
  | "audio"
  | "text"
  | "field recording"
  | "found text"
  | "unknown"

export const DEPOSIT_TYPES: ArtifactType[] = [
  "photograph",
  "film still",
  "screenshot",
  "vhs",
  "field recording",
  "found text",
  "document",
  "unknown",
]

export interface Artifact {
  id: string
  type: ArtifactType
  title: string
  dateRaw: string
  dateYear?: number
  source?: string
  notes?: string
  uploadedAt?: string
  description: string
  technical?: {
    dimensions?: string
    duration?: string
    format?: string
  }
  media: {
    type: "image" | "video" | "audio" | "none"
    url?: string
  }
  tags?: string[]
  status: "published" | "pending"
}

export const artifacts: Artifact[] = [
  {
    id: "rsv-0001",
    type: "film still",
    title: "Sex education scene",
    dateRaw: "c. 1998",
    uploadedAt: "March 12, 2026",
    dateYear: 1998,
    source: "VHS transfer, romantic comedy",
    notes: "Teacher at chalkboard. Film unidentified. Possibly promotional still.",
    description: "Classroom interior, chalkboard, instructor",
    technical: { dimensions: "720x480" },
    media: {
      type: "image",
      url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/13244599_1173829509302357_8144667420116279944_n-1Imnd38I7oqoPchxtaKIRuTQuDW3La.webp",
    },
    status: "published",
  },
  {
    id: "rsv-0002",
    type: "painting",
    title: "Crucifixion (folk)",
    dateRaw: "Unknown, possibly 1970s",
    uploadedAt: "January 28, 2026",
    source: "Estate sale, Phoenix AZ",
    notes:
      "Mixed media on board. INRI inscription. Nail holes visible at corners suggest previous display.",
    description: "Religious iconography, naive style, blue and red ground",
    technical: { dimensions: "18x24 in. approx" },
    media: {
      type: "image",
      url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-06-04%20at%2012.17.20%20PM-Dbrleck2hILFF2J7KP64xTQFzhAxez.png",
    },
    status: "published",
  },
  {
    id: "rsv-0003",
    type: "vhs",
    title: "Healing service broadcast",
    dateRaw: "1989–1992",
    uploadedAt: "February 7, 2026",
    dateYear: 1989,
    source: "VHS-C, labeled 'CHURCH TAPES VOL. 3'",
    notes: "Man slain in the spirit. Preacher continues speaking. Time code visible.",
    description: "Televangelism broadcast, indoor arena, congregation visible",
    technical: { duration: "00:47:22 (excerpt)", format: "VHS-C" },
    media: {
      type: "image",
      url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/19-vf0jbaW4nb4kPOUjp99MeqU8mA455t.jpg",
    },
    status: "published",
  },
  {
    id: "rsv-0004",
    type: "film still",
    title: "Desert, moonrise",
    dateRaw: "1973",
    uploadedAt: "April 3, 2026",
    dateYear: 1973,
    source: "Film frame capture, 35mm",
    notes: "Figure walking toward horizon. Malick? Unconfirmed.",
    description: "Prairie landscape, dusk, single figure, large moon",
    technical: { dimensions: "2.39:1 aspect", format: "35mm" },
    media: {
      type: "image",
      url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/filmgrab-aljdkafl-badlands-e1622836333196-DI12MPUx6bLFpzOQ0GPPOk3kfjHUid.jpg",
    },
    status: "published",
  },
  {
    id: "rsv-0005",
    type: "film still",
    title: "Metro escalator",
    dateRaw: "c. 2006",
    uploadedAt: "March 19, 2026",
    dateYear: 2006,
    source: "Digital capture, unknown film",
    notes: "Wide angle lens distortion. Station appears to be East Asian. Woman descending.",
    description: "Subway interior, fluorescent lighting, yellow walls",
    technical: { dimensions: "1920x800" },
    media: {
      type: "image",
      url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1_2yXRX4hNnGRoVWIjeAkfTg-pkOaprJepgWRxb1xjJhoOryCRUDHB0.jpg",
    },
    status: "published",
  },
  {
    id: "rsv-0006",
    type: "vhs",
    title: "Confession broadcast",
    dateRaw: "February 21, 1988",
    uploadedAt: "May 2, 2026",
    dateYear: 1988,
    source: "Off-air recording, Channel 9",
    notes: "Live television confession. Tracking lines visible. Someone was recording.",
    description: "Close-up, man weeping at microphone, studio audience",
    technical: { duration: "00:22:14 (full)", format: "VHS" },
    media: {
      type: "image",
      url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Jimmy-Swaggart-in-tears-during-1988-live-television-confession-of-his-transgressions-SAMqQTD4y5c2qa2e0bQN6vtEXigxmO.webp",
    },
    status: "published",
  },
  {
    id: "rsv-0007",
    type: "video",
    title: "Fragment, phone recording",
    dateRaw: "2024",
    uploadedAt: "January 15, 2026",
    dateYear: 2024,
    source: "Airdrop, unknown sender",
    notes: "Received at coffee shop. No context. Portrait orientation.",
    description: "Unidentified content",
    technical: { duration: "00:00:08", format: "iPhone video" },
    media: {
      type: "video",
      url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG_2657-u2bDQIVw3xIwPg1Lj97rulWS8UixfG.mov",
    },
    status: "published",
  },
  {
    id: "rsv-0008",
    type: "film still",
    title: "Radio studio, period",
    dateRaw: "1930s (depicted), film unknown",
    uploadedAt: "April 22, 2026",
    source: "Screenshot, streaming service",
    notes: "Actor with vintage microphone. Paisley robe. Golden age of radio recreation.",
    description: "Studio interior, dramatic lighting, male figure at microphone",
    technical: { dimensions: "1080p source" },
    media: {
      type: "image",
      url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-06-04%20at%2012.25.57%20PM-gurEOrvksDC0rNTlBQ6soyIlBFPiqO.png",
    },
    status: "published",
  },
  {
    id: "rsv-0009",
    type: "document",
    title: "Fotomosaico de Suelos, Plancha No. 2",
    dateRaw: "1977",
    uploadedAt: "February 14, 2026",
    dateYear: 1977,
    source: "Instituto Geografico Agustin Codazzi, Colombia",
    notes:
      "Soil survey photomosaic, El Aguila-Yotoco sector, Cordillera Occidental. Scale 1:60,000. ISM-Wageningen reference marks. Acquired from university library discard pile.",
    description: "Aerial photography composite, topographic annotations, institutional stamps",
    technical: { dimensions: "Approx. 80x60 cm, folded" },
    media: {
      type: "image",
      url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-06-04%20at%2012.33.56%20PM.png-UGKgL8qOt0z7CSZCNdhcy7P8CcNxtn.jpeg",
    },
    status: "published",
  },
  {
    id: "rsv-0010",
    type: "screenshot",
    title: "ETERNAL BECOMING",
    dateRaw: "Unknown, c. 2010s",
    uploadedAt: "May 30, 2026",
    dateYear: 2010,
    source: "Video still, source unidentified",
    notes: "Inverted triangle, luminous. New age or spiritual content. Found on dead hard drive.",
    description: "Geometric form, text overlay, black ground",
    technical: { dimensions: "1080x1080" },
    media: {
      type: "image",
      url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-06-04%20at%2011.08.49%20AM-4paUP6vxFqNMnPSCUWYKnTdcAclVyk.png",
    },
    status: "published",
  },
  {
    id: "rsv-0011",
    type: "collage",
    title: "Natural History (Fungi)",
    dateRaw: "c. 1980",
    uploadedAt: "March 5, 2026",
    dateYear: 1980,
    source: "Mixed media on paper, artist unknown",
    notes:
      "Botanical illustrations, forest photograph, color tests, handwritten notations. Numbers appear to be dates or catalog references. Cy Twombly influence evident.",
    description: "Mushroom studies, infrared forest image, gestural marks",
    technical: { dimensions: "22x30 in." },
    media: {
      type: "image",
      url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-06-04%20at%2012.35.54%20PM-UVF65r570nJdvBxp09xAjQFnz8k3vT.png",
    },
    status: "published",
  },
  {
    id: "rsv-0012",
    type: "drawing",
    title: "Landscape Analysis (thesis fragment)",
    dateRaw: "c. 1990s",
    uploadedAt: "April 11, 2026",
    dateYear: 1990,
    source: "Architecture school archive, institution unknown",
    notes:
      "Composite drawing. Coastal section, data visualization, photographic inserts. Possibly Mediterranean site analysis. Grid structure suggests systematic methodology.",
    description: "Analytical drawing, seascape photographs, charts, glitch patterns",
    technical: { dimensions: "36x36 in." },
    media: {
      type: "image",
      url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-06-04%20at%2012.34.25%20PM-0I0S5mEZPjG7it5Wynh1YZbbxWcBbU.png",
    },
    status: "published",
  },
  {
    id: "rsv-0013",
    type: "photograph",
    title: "Church sign, Nealy Hicks Rd",
    dateRaw: "2019",
    uploadedAt: "June 1, 2026",
    dateYear: 2019,
    source: "Personal photograph, passing car",
    notes:
      "Faith Baptist Church. 'GOSSIP IS THE DEVIL'S RADIO. ARE YOU HIS DJ?' Rural Florida, overcast. Sign text rotates weekly.",
    description: "Roadside signage, vernacular typography, rural landscape",
    technical: { dimensions: "4032x3024" },
    media: {
      type: "image",
      url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-06-04%20at%2011.07.57%20AM-y5jn4CLRadQmSD4orcxIDHOusQMHNL.png",
    },
    status: "published",
  },
  {
    id: "rsv-0014",
    type: "photograph",
    title: "Mailman, cigarette, mirror",
    dateRaw: "",
    uploadedAt: "June 4, 2026",
    description: "USPS truck side panel, hand with cigarette reflected in window",
    media: { type: "image", url: "/images/rsv-0014.jpg" },
    status: "published",
  },
  {
    id: "rsv-0015",
    type: "photograph",
    title: "Saint and soundboard",
    dateRaw: "",
    uploadedAt: "June 4, 2026",
    description: "Byzantine fresco of bishop saint, mixing desk in foreground",
    media: { type: "image", url: "/images/rsv-0015.jpg" },
    status: "published",
  },
  {
    id: "rsv-0016",
    type: "photograph",
    title: "Transfiguration, congregation",
    dateRaw: "",
    uploadedAt: "June 4, 2026",
    description: "Church dome fresco, silhouetted congregation, chandelier",
    media: { type: "image", url: "/images/rsv-0016.jpg" },
    status: "published",
  },
  {
    id: "rsv-0017",
    type: "photograph",
    title: "Cross-shaped power strip",
    dateRaw: "",
    uploadedAt: "June 4, 2026",
    description: "Cross-form European power strip on concrete floor, phone charging",
    media: { type: "image", url: "/images/rsv-0017.jpg" },
    status: "published",
  },
  {
    id: "rsv-0018",
    type: "photograph",
    title: "Party, squeeze bottle",
    dateRaw: "",
    uploadedAt: "June 4, 2026",
    description: "Black and white, two blurred figures, squeeze bottle in foreground",
    media: { type: "image", url: "/images/rsv-0018.png" },
    status: "published",
  },
  {
    id: "rsv-0019",
    type: "screenshot",
    title: "please come home white boy",
    dateRaw: "",
    uploadedAt: "June 4, 2026",
    description: "Two horses in morning fog, text overlay",
    media: { type: "image", url: "/images/rsv-0019.png" },
    status: "published",
  },
  {
    id: "rsv-0020",
    type: "photograph",
    title: "Couple, convex mirror",
    dateRaw: "",
    uploadedAt: "June 4, 2026",
    description: "Two figures embracing, reflected in curved mirror, blurred",
    media: { type: "image", url: "/images/rsv-0020.jpg" },
    status: "published",
  },
  {
    id: "rsv-0021",
    type: "photograph",
    title: "Three figures, temple columns",
    dateRaw: "",
    uploadedAt: "June 4, 2026",
    description: "Silhouetted figures, ancient carved columns, black and white",
    media: { type: "image", url: "/images/rsv-0021.jpg" },
    status: "published",
  },
  {
    id: "rsv-0022",
    type: "photograph",
    title: "Eaten cake, woman and cats",
    dateRaw: "",
    uploadedAt: "June 4, 2026",
    description: "Half-eaten birthday cake, photo of woman with cats printed on frosting",
    media: { type: "image", url: "/images/rsv-0022.jpg" },
    status: "published",
  },
  {
    id: "rsv-0023",
    type: "photograph",
    title: "Visions of Excess, breakfast table",
    dateRaw: "",
    uploadedAt: "June 5, 2026",
    description: "Bataille paperback propped against window, granola bowl, fried egg, toast, morning light",
    media: { type: "image", url: "/images/rsv-0023.jpg" },
    status: "published",
  },
  {
    id: "rsv-0024",
    type: "photograph",
    title: "Everything that makes sound",
    dateRaw: "",
    uploadedAt: "June 5, 2026",
    description: "Three guitars, melodica, cables, laptop, headphones piled on a surface, carved figure on wall above",
    media: { type: "image", url: "/images/rsv-0024.jpg" },
    status: "published",
  },
]
