"use client";

import * as React from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import {
  IconArrowUpRight,
  IconCheck,
  IconHeart,
  IconMessageCircle,
  IconRotateClockwise,
} from "@tabler/icons-react";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig = {
  sessions: {
    label: "Sessions",
    color: "var(--primary)",
  },
  albums: {
    label: "Alben",
    color: "var(--primary)",
  },
  photos: {
    label: "Einzelfotos",
    color: "var(--primary)",
  },
  articles: {
    label: "Artikel",
    color: "var(--primary)",
  },
  frames: {
    label: "Aufnahmen",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

export function ChartAreaView() {
  const trpc = useTRPC();
  const [metric, setMetric] = React.useState<"posts" | "frames">("posts");

  const { data } = useSuspenseQuery(
    trpc.dashboard.getJournalActivity.queryOptions(),
  );

  const chartData = React.useMemo(() => {
    return data.monthlyData.map((item) => ({
      ...item,
      date: `${item.month}-01`,
    }));
  }, [data.monthlyData]);

  const totals = React.useMemo(() => {
    return data.monthlyData.reduce(
      (acc, item) => {
        acc.sessions += item.sessions;
        acc.albums += item.albums;
        acc.photos += item.photos;
        acc.articles += item.articles;
        acc.totalPosts += item.totalPosts;
        acc.frames += item.frames;
        if (item.totalPosts > 0 || item.frames > 0) {
          acc.activeMonths += 1;
        }
        return acc;
      },
      {
        sessions: 0,
        albums: 0,
        photos: 0,
        articles: 0,
        totalPosts: 0,
        frames: 0,
        activeMonths: 0,
      },
    );
  }, [data.monthlyData]);

  const { curation, resonance } = data;

  const getPublicPostHref = (type: string, slug: string) => {
    if (type === "ARTICLE") return `/article/${slug}`;
    if (type === "PHOTO") return `/photo/${slug}`;
    if (type === "SESSION") return `/session/${slug}`;
    return `/album/${slug}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 items-start">
      {/* 1. LEFT: 12-MONTH JOURNAL CADENCE BAR CHART */}
      <Card className="@container/card lg:col-span-7 border-border/70 shadow-2xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg">
            Journal-Rhythmus (12 Monate)
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {metric === "posts" ? (
              <>
                <span className="font-medium text-foreground tabular-nums">
                  {totals.totalPosts}
                </span>{" "}
                {totals.totalPosts === 1 ? "Beitrag" : "Beiträge"} veröffentlicht
                {" · "}
                <span className="tabular-nums">{totals.activeMonths}/12</span>{" "}
                aktive Monate
              </>
            ) : (
              <>
                <span className="font-medium text-foreground tabular-nums">
                  {totals.frames.toLocaleString("de-DE")}
                </span>{" "}
                Aufnahmen in den letzten 12 Monaten
              </>
            )}
          </CardDescription>
          <CardAction>
            <ToggleGroup
              type="single"
              value={metric}
              onValueChange={(val) => {
                if (val === "posts" || val === "frames") setMetric(val);
              }}
              variant="outline"
              size="sm"
              className="*:data-[slot=toggle-group-item]:px-2.5 *:data-[slot=toggle-group-item]:text-xs"
            >
              <ToggleGroupItem value="posts">Beiträge</ToggleGroupItem>
              <ToggleGroupItem value="frames">Aufnahmen</ToggleGroupItem>
            </ToggleGroup>
          </CardAction>
        </CardHeader>

        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-4 space-y-4">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[230px] w-full"
          >
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 4, left: -20, bottom: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={16}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("de-DE", {
                    month: "short",
                  });
                }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={36}
                tick={{ fontSize: 11 }}
              />
              <ChartTooltip
                cursor={{ fill: "var(--muted)", opacity: 0.35 }}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString("de-DE", {
                        month: "long",
                        year: "numeric",
                      })
                    }
                    indicator="dot"
                  />
                }
              />
              {metric === "posts" && (
                <Bar
                  dataKey="sessions"
                  stackId="posts"
                  fill="var(--primary)"
                  fillOpacity={1}
                />
              )}
              {metric === "posts" && (
                <Bar
                  dataKey="albums"
                  stackId="posts"
                  fill="var(--primary)"
                  fillOpacity={0.75}
                />
              )}
              {metric === "posts" && (
                <Bar
                  dataKey="photos"
                  stackId="posts"
                  fill="var(--primary)"
                  fillOpacity={0.48}
                />
              )}
              {metric === "posts" && (
                <Bar
                  dataKey="articles"
                  stackId="posts"
                  fill="var(--primary)"
                  fillOpacity={0.25}
                />
              )}
              {metric === "frames" && (
                <Bar
                  dataKey="frames"
                  fill="var(--primary)"
                  radius={[4, 4, 0, 0]}
                />
              )}
            </BarChart>
          </ChartContainer>

          {/* Breakdown Legend & Totals Footer */}
          <div className="pt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-[2px] bg-primary" />
                <span>Sessions:</span>
                <strong className="font-mono text-foreground tabular-nums">
                  {totals.sessions}
                </strong>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-[2px] bg-primary/75" />
                <span>Alben:</span>
                <strong className="font-mono text-foreground tabular-nums">
                  {totals.albums}
                </strong>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-[2px] bg-primary/50" />
                <span>Fotos:</span>
                <strong className="font-mono text-foreground tabular-nums">
                  {totals.photos}
                </strong>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-[2px] bg-primary/25" />
                <span>Artikel:</span>
                <strong className="font-mono text-foreground tabular-nums">
                  {totals.articles}
                </strong>
              </span>
            </div>

            {curation.privateDraftsCount > 0 && (
              <Link
                href="/dashboard/posts"
                className="font-mono text-[11px] text-muted-foreground hover:text-foreground underline decoration-dotted underline-offset-4"
              >
                {curation.privateDraftsCount} privat
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. RIGHT: OPEN SESSION CURATION & READER RESONANCE */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        {/* Card A: Offene Finale Wahl */}
        <Card className="border-border/70 shadow-2xs p-4 sm:p-5 space-y-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                <IconRotateClockwise className="size-3.5 text-primary" />
                <span>Session-Kuration</span>
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-foreground">
                Offene Finale Wahl
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-muted text-[11px] font-mono tabular-nums text-muted-foreground">
              {curation.revisitedSessionsCount}/{curation.totalSessions} finalisiert
            </span>
          </div>

          {curation.pendingRevisitSessions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 p-3.5 flex items-center gap-2.5 text-xs text-muted-foreground">
              <div className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <IconCheck className="size-3.5" />
              </div>
              <span>
                {curation.totalSessions === 0
                  ? "Noch keine Sessions veröffentlicht."
                  : "Alle Sessions haben bereits ihre Finale Wahl erhalten."}
              </span>
            </div>
          ) : (
            <div className="divide-y divide-border/50 border-t border-border/50 -mx-1">
              {curation.pendingRevisitSessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/dashboard/posts/${session.slug}/revisit`}
                  className="group flex items-center justify-between gap-3 py-2.5 px-1 hover:bg-muted/30 rounded-md transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                      {session.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      Erstwahl ({session.initialPicks}/{session.totalFrames} Aufnahmen) ·{" "}
                      {formatDistanceToNow(new Date(session.createdAt), {
                        addSuffix: true,
                        locale: de,
                      })}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-mono text-primary shrink-0">
                    <span>Kurieren</span>
                    <IconArrowUpRight className="size-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Card B: Leser-Resonanz */}
        <Card className="border-border/70 shadow-2xs p-4 sm:p-5 space-y-3.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground block">
                Leser-Resonanz
              </span>
              {resonance.likedPostsCount > 0 && (
                <span className="text-[11px] text-muted-foreground">
                  Über {resonance.likedPostsCount} Beiträge ({resonance.uniqueLikers} Besucher)
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
              <span className="inline-flex items-center gap-1 text-foreground">
                <IconHeart className="size-3.5 text-primary" />
                {resonance.totalLikes} Likes
              </span>
              <span className="inline-flex items-center gap-1 text-foreground">
                <IconMessageCircle className="size-3.5 text-primary" />
                {resonance.totalComments} Kommentare
              </span>
            </div>
          </div>

          {resonance.recentComments.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Noch keine Kommentare vorhanden.
            </p>
          ) : (
            <div className="divide-y divide-border/50 border-t border-border/50">
              {resonance.recentComments.map((comment) => (
                <Link
                  key={comment.id}
                  href={getPublicPostHref(comment.postType, comment.postSlug)}
                  className="block py-2.5 group"
                >
                  <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-muted-foreground">
                    <span className="text-foreground font-medium truncate">
                      {comment.username}{" "}
                      <span className="text-muted-foreground font-normal">
                        zu „{comment.postTitle}“
                      </span>
                    </span>
                    <span className="shrink-0">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                        locale: de,
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors line-clamp-1 mt-0.5">
                    {comment.content}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export const ChartAreaLoading = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
      <Card className="lg:col-span-7 border-border/70 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3.5 w-64" />
          </div>
          <Skeleton className="h-8 w-36 rounded-md" />
        </div>
        <Skeleton className="w-full h-[230px] rounded-lg" />
      </Card>
      <div className="lg:col-span-5 flex flex-col gap-4">
        <Card className="border-border/70 p-5 space-y-3">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-12 w-full rounded-md" />
          <Skeleton className="h-12 w-full rounded-md" />
        </Card>
        <Card className="border-border/70 p-5 space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full rounded-md" />
        </Card>
      </div>
    </div>
  );
};
