"use client";

export default function GlobalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="mac-site-shell">{children}</div>;
}
