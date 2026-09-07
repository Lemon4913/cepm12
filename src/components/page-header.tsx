export function PageHeader({
  title,
  subtitle,
  wide,
}: {
  title: string;
  subtitle?: string;
  /** Match a page whose <main> also opts into the wider md:max-w-5xl column
   *  (currently just /map and /admin) instead of the default reading width —
   *  keeps the header's title lined up with the content below it on desktop. */
  wide?: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className={`mx-auto w-full px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 md:px-6 md:pt-6 ${wide ? "md:max-w-5xl" : "md:max-w-2xl"}`}>
        <h1 className="text-xl font-semibold">{title}</h1>
        {subtitle ? (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
    </header>
  );
}
