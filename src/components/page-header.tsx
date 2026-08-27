export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <h1 className="text-xl font-semibold">{title}</h1>
      {subtitle ? (
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      ) : null}
    </header>
  );
}
