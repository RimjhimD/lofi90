/** Re-mounts on every navigation, so each page "tunes in" behind a lime scan line. */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      <span aria-hidden="true" className="page-scan" />
      <div className="page-tune">{children}</div>
    </>
  );
}
