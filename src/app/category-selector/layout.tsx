export default function CategorySelectorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="grow w-full overflow-auto">{children}</main>;
}
