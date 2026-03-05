export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="grow w-full overflow-auto">{children}</main>;
}
