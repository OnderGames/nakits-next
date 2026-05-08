"use client";

type Props = {
  slug: string;
  className?: string;
};

const base = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  "aria-hidden": true as const
};

/** Ana kategori — evrensel çizgi ikonlar (emoji yerine) */
export default function CategoryGroupIcon({ slug, className }: Props) {
  const cn = ["category-group-icon", className].filter(Boolean).join(" ");

  switch (slug) {
    case "tasitlar":
      return (
        <svg {...base} className={cn}>
          <path
            d="M4 14h16l-1.2-3.5h-13.6L4 14z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path
            d="M6 14v2.5M18 14v2.5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <circle cx="8" cy="17.5" r="1.75" stroke="currentColor" strokeWidth="1.75" />
          <circle cx="16" cy="17.5" r="1.75" stroke="currentColor" strokeWidth="1.75" />
          <path
            d="M7 10.5h10"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      );
    case "gayrimenkul":
      return (
        <svg {...base} className={cn}>
          <path
            d="M5 20h14V9.5l-7-5.5-7 5.5V20z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path
            d="M9 20v-6h6v6"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path
            d="M11 10h2"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      );
    case "elektronik":
      return (
        <svg {...base} className={cn}>
          <rect
            x="7"
            y="4"
            width="10"
            height="16"
            rx="2.5"
            stroke="currentColor"
            strokeWidth="1.75"
          />
          <path
            d="M10 18h4"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      );
    case "ev-yasam":
      return (
        <svg {...base} className={cn}>
          <path
            d="M5 11l7-5 7 5v10a1 1 0 01-1 1H6a1 1 0 01-1-1V11z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path
            d="M10 21v-7h4v7"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "moda-kisisel":
      return (
        <svg {...base} className={cn}>
          <path
            d="M9 4l-2 4v11h10V8l-2-4h-6z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path
            d="M9 8h6"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      );
    case "hobi-eglence":
      return (
        <svg {...base} className={cn}>
          <path
            d="M6 11h12a3 3 0 013 3v1a3 3 0 01-3 3H6a3 3 0 01-3-3v-1a3 3 0 013-3z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path
            d="M9 14v2M8 15h2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="16" cy="15" r="1.15" fill="currentColor" />
          <circle cx="18.5" cy="15" r="1.15" fill="currentColor" />
        </svg>
      );
    case "hayvanlar":
      return (
        <svg {...base} className={cn}>
          <ellipse
            cx="12"
            cy="14"
            rx="6"
            ry="4.5"
            stroke="currentColor"
            strokeWidth="1.75"
          />
          <circle cx="8.5" cy="9" r="2" stroke="currentColor" strokeWidth="1.75" />
          <circle cx="15.5" cy="9" r="2" stroke="currentColor" strokeWidth="1.75" />
          <path
            d="M9 9l-2-3M15 9l2-3"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      );
    case "is-sanayi":
      return (
        <svg {...base} className={cn}>
          <path
            d="M14.5 4.5L19 9l-6 6-4-4 6-6z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path
            d="M5 19l4-4"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <circle cx="8" cy="17" r="2.25" stroke="currentColor" strokeWidth="1.75" />
        </svg>
      );
    default:
      return (
        <svg {...base} className={cn}>
          <path
            d="M4 4h7v7H4V4zM13 4h7v7h-7V4zM4 13h7v7H4v-7zM13 13h7v7h-7v-7z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}
