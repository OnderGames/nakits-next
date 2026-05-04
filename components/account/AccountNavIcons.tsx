import type { AccountNavIconName } from "@/lib/account-nav";

/** Üst menü + üye kabuğu ortak SVG ikonlar */
export function AccountNavIcon({ name }: { name: AccountNavIconName }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    "aria-hidden": true as const
  };
  switch (name) {
    case "moderation":
      return (
        <svg {...common}>
          <path
            d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 12l2 2 4-4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "listings":
      return (
        <svg {...common}>
          <path d="M8 6h13M8 12h13M8 18h13M4 6h.01M4 12h.01M4 18h.01" />
        </svg>
      );
    case "heart":
      return (
        <svg {...common}>
          <path
            d="M12 21s-6.716-4.432-9-8.5C.89 9.732 2.14 6 6 6c2.352 0 3.638 1.352 4 2 .362-.648 1.648-2 4-2 3.86 0 5.11 3.732 3 6.5C16.716 16.568 12 21 12 21z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "messages":
      return (
        <svg {...common}>
          <path
            d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "user":
      return (
        <svg {...common}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    default:
      return null;
  }
}
