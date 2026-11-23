import Link from "next/link";
import { signOutAction } from "../app/account-actions";

export default function Header({
  currentUser,
}: {
  currentUser: { id: string; email: string } | null;
}) {
  return (
    <header className="px-header">
      <div className="px-header-in">
        <Link href="/" className="px-logo">
          <span className="px-logo-mark" aria-hidden="true" />
          GitTix
        </Link>
        <nav className="px-nav" aria-label="Main">
          <Link href="/">Browse</Link>
          {currentUser && <Link href="/orders">My orders</Link>}
          {currentUser && <Link href="/sell/listings">Sell</Link>}
        </nav>
        <form className="px-hsearch" action="/">
          <input
            name="q"
            placeholder="Search assets"
            aria-label="Search assets"
          />
        </form>
        <div className="px-hright">
          {currentUser ? (
            <>
              <Link href={`/creators/${currentUser.id}`} className="px-muted">
                {currentUser.email}
              </Link>
              <form action={signOutAction}>
                <button className="px-btn px-btn-ghost px-btn-sm" type="submit">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/signin" className="px-btn px-btn-ghost px-btn-sm">
                Sign in
              </Link>
              <Link href="/signup" className="px-btn px-btn-sm">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
