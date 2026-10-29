import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, BookOpen, ChevronRight, Clock3, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HelpShell } from "@/components/help-shell";
import { HELP_ARTICLES, HELP_TOPICS, searchHelpArticles } from "@/lib/help-articles";
import { cn } from "@/lib/utils";
import lobbyImage from "@/assets/media-lobby.jpg";

export const Route = createFileRoute("/help/")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search["q"] === "string" ? search["q"] : "",
    topic: HELP_TOPICS.some((t) => t.id === search["topic"]) ? String(search["topic"]) : "all",
  }),
  head: () => ({
    meta: [
      { title: "Lumina Help — Platform articles & guides" },
      {
        name: "description",
        content:
          "Explore Lumina guides for layouts, screen publishing, playlists, room calendars, roles and licences.",
      },
      { property: "og:title", content: "Lumina Help — Platform articles & guides" },
      {
        property: "og:description",
        content: "Practical answers for your digital signage workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HelpPage,
});

function HelpPage() {
  const { q, topic } = Route.useSearch();
  const navigate = useNavigate();
  const articles = searchHelpArticles(q, topic);
  const currentTopic = HELP_TOPICS.find((t) => t.id === topic);
  const updateSearch = (value: string) => {
    void navigate({ to: "/help", search: { q: value, topic }, replace: true, resetScroll: false });
  };
  return (
    <HelpShell topic={topic}>
      <main>
        <section className="border-b border-border bg-card px-5 py-8 md:px-8">
          <div className="mx-auto max-w-[1120px]">
            <div className="flex items-center gap-2 font-mono text-[10px] text-accent">
              <span className="h-1.5 w-5 bg-accent" />
              LUMINA / HELP CENTRE
            </div>
            <h1 className="mt-4 font-display text-3xl font-semibold leading-tight">
              Good answers.
              <br className="sm:hidden" /> Better screen days.
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              The practical guide to your Lumina workspace.
            </p>
            <div className="relative mt-6 max-w-2xl">
              <Search className="pointer-events-none absolute left-4 top-4 size-4 text-accent" />
              <Input
                aria-label="Search help articles"
                placeholder="Search articles, topics or a question…"
                value={q}
                onChange={(e) => updateSearch(e.target.value)}
                className="h-12 bg-background pl-11 pr-11 text-sm"
              />
              {q && (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="absolute right-2 top-2"
                  title="Clear search"
                  aria-label="Clear search"
                  onClick={() => updateSearch("")}
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              <span>Often searched:</span>
              {["layouts", "publish", "calendar"].map((word) => (
                <Button
                  key={word}
                  variant="link"
                  size="sm"
                  className="h-6 px-1 text-xs text-foreground"
                  onClick={() => updateSearch(word)}
                >
                  {word}
                  <ArrowRight className="size-3" />
                </Button>
              ))}
            </div>
          </div>
        </section>
        <div className="mx-auto max-w-[1184px] px-5 py-7 md:px-8">
          {!q && topic === "all" && (
            <section className="mb-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-base font-semibold">Explore by topic</h2>
                <span className="label-caps">{HELP_TOPICS.length} COLLECTIONS</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {HELP_TOPICS.map((item) => (
                  <Button
                    key={item.id}
                    asChild
                    variant="outline"
                    className="h-auto min-h-28 justify-start whitespace-normal bg-card p-4 text-left hover:bg-secondary hover:text-foreground"
                  >
                    <Link
                      to="/help"
                      search={{ q: "", topic: item.id }}
                      className="flex flex-col items-start gap-3"
                    >
                      <div className="flex w-full items-center justify-between">
                        <span
                          className={cn("grid size-8 place-items-center rounded-md", item.tone)}
                        >
                          <item.icon className="size-4" />
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {HELP_ARTICLES.filter((a) => a.topic === item.id).length} articles
                        </span>
                      </div>
                      <span className="text-xs font-semibold">{item.name}</span>
                    </Link>
                  </Button>
                ))}
              </div>
            </section>
          )}
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_260px]">
            <section>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <h2 className="font-display text-base font-semibold">
                  {q ? "Search results" : (currentTopic?.name ?? "Start with these guides")}
                </h2>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {articles.length} {articles.length === 1 ? "ARTICLE" : "ARTICLES"}
                </span>
              </div>
              {(q || topic !== "all") && (
                <div className="my-4 flex flex-wrap gap-2">
                  <Button asChild size="sm" variant={topic === "all" ? "secondary" : "ghost"}>
                    <Link to="/help" search={{ q, topic: "all" }}>
                      All topics
                    </Link>
                  </Button>
                  {HELP_TOPICS.map((item) => (
                    <Button
                      key={item.id}
                      asChild
                      size="sm"
                      variant={topic === item.id ? "secondary" : "ghost"}
                      className="text-xs"
                    >
                      <Link to="/help" search={{ q, topic: item.id }}>
                        {item.name}
                      </Link>
                    </Button>
                  ))}
                </div>
              )}
              <div>
                {articles.map((article) => {
                  const item = HELP_TOPICS.find((t) => t.id === article.topic);
                  return (
                    <Link
                      key={article.slug}
                      to="/help/$slug"
                      params={{ slug: article.slug }}
                      className="group flex items-start gap-4 border-b border-border py-5 hover:bg-secondary/40"
                    >
                      <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-md border border-border bg-card text-muted-foreground">
                        <BookOpen className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>{item?.name}</span>
                          {article.featured && (
                            <span className="rounded-sm bg-primary/15 px-1.5 py-0.5 text-foreground">
                              ESSENTIAL
                            </span>
                          )}
                        </div>
                        <h3 className="font-display text-sm font-semibold group-hover:text-accent">
                          {article.title}
                        </h3>
                        <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                          {article.summary}
                        </p>
                        <span className="mt-2.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock3 className="size-3" />
                          {article.minutes} min read
                        </span>
                      </div>
                      <ChevronRight className="mt-5 size-4 shrink-0 text-muted-foreground group-hover:text-accent" />
                    </Link>
                  );
                })}
              </div>
              {!articles.length && (
                <div className="py-14 text-center">
                  <Search className="mx-auto size-6 text-muted-foreground" />
                  <h3 className="mt-4 text-sm font-semibold">No matching articles</h3>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Try a shorter phrase or browse all topics.
                  </p>
                  <Button asChild variant="outline" size="sm" className="mt-4">
                    <Link to="/help" search={{ q: "", topic: "all" }}>
                      Browse all articles
                    </Link>
                  </Button>
                </div>
              )}
            </section>
            <aside className="space-y-6">
              <article className="overflow-hidden rounded-md border border-border bg-card">
                <img
                  src={lobbyImage}
                  alt="Digital signage in a bright reception lobby"
                  width={520}
                  height={280}
                  loading="lazy"
                  className="aspect-[1.9] w-full object-cover"
                />
                <div className="p-4">
                  <p className="label-caps text-accent">NEW TO LUMINA?</p>
                  <h3 className="mt-3 font-display text-lg font-semibold">
                    A confident first step.
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    Get familiar with your workspace before building your first layout.
                  </p>
                  <Button asChild variant="ghost" className="mt-3 justify-start px-0 text-xs">
                    <Link to="/help/$slug" params={{ slug: "find-your-way" }}>
                      Take the workspace tour
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                </div>
              </article>
              <div className="border-t border-border pt-5">
                <p className="label-caps mb-3">QUICK ANSWERS</p>
                {["publish-targets", "connect-room-calendars", "roles-and-partners"].map((slug) => {
                  const article = HELP_ARTICLES.find((a) => a.slug === slug);
                  return (
                    article && (
                      <Link
                        key={slug}
                        to="/help/$slug"
                        params={{ slug }}
                        className="flex items-start justify-between gap-3 py-2 text-xs leading-5 hover:text-accent"
                      >
                        {article.title}
                        <ArrowRight className="mt-1 size-3 shrink-0" />
                      </Link>
                    )
                  );
                })}
              </div>
            </aside>
          </div>
          <footer className="mt-10 flex flex-wrap justify-between gap-3 border-t border-border pt-5 text-[10px] text-muted-foreground">
            <span>Lumina knowledge base</span>
            <span>{HELP_ARTICLES.length} practical guides · Platform edition</span>
          </footer>
        </div>
      </main>
    </HelpShell>
  );
}
