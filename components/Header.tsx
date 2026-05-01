import Link from "next/link";

export default function Header() {
  return (
    <header className="topbar">
      <div className="container nav">
        <Link className="brand" href="/">
          naki<span>ts</span>
        </Link>
        <nav className="menu">
          <Link href="/listings">İlanlar</Link>
          <Link href="/add-listing">İlan Ver</Link>
          <Link href="/profile">Profil</Link>
        </nav>
      </div>
    </header>
  );
}
