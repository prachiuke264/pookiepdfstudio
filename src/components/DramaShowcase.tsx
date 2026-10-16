import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Clapperboard, Play } from "lucide-react";
import modernSpotlight from "@/assets/cdrama-modern-spotlight.jpg";
import hiddenGem from "@/assets/cdrama-hidden-gem.jpg";
import fanFavorite from "@/assets/cdrama-fan-favorite.jpg";

const DRAMAS = [
  {
    rank: 1,
    badge: "On-Air Blockbuster",
    title: "Hidden Love",
    genre: "Modern romance · sample spotlight",
    image: modernSpotlight,
    search: "Hidden Love Chinese drama official trailer",
  },
  {
    rank: 2,
    badge: "Hidden Gem",
    title: "Love Between Fairy and Devil",
    genre: "Fantasy romance · sample spotlight",
    image: hiddenGem,
    search: "Love Between Fairy and Devil official trailer",
  },
  {
    rank: 3,
    badge: "Fan-Dubbed Masterpiece",
    title: "When I Fly Towards You",
    genre: "Campus romance · sample spotlight",
    image: fanFavorite,
    search: "When I Fly Towards You official trailer",
  },
] as const;

export function DramaShowcase() {
  const reduceMotion = useReducedMotion();

  return (
    <section aria-labelledby="drama-showcase-title" className="mt-20">
      <div className="mb-7 text-center">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-drama-accent/70 bg-drama-accent/30 px-4 py-2 text-xs font-bold text-foreground">
          <motion.span
            aria-hidden="true"
            className="h-2 w-2 rounded-full bg-primary"
            animate={reduceMotion ? undefined : { opacity: [1, 0.35, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
          C-drama spotlight · illustrative picks, not a live chart
        </p>
        <h2 id="drama-showcase-title" className="text-2xl font-bold tracking-tight sm:text-3xl">
          Your next C-drama watch
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Three editor-curated examples. Choose a title to find its trailer on YouTube; episodes are not embedded here.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {DRAMAS.map((drama, index) => (
          <motion.article
            key={drama.rank}
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.35, delay: index * 0.08 }}
            whileHover={reduceMotion ? undefined : { y: -4, scale: 1.015 }}
            className="overflow-hidden rounded-2xl border border-drama-accent/70 bg-card shadow-[0_12px_36px_-18px_var(--drama-glow)]"
          >
            <a
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(drama.search)}`}
              target="_blank"
              rel="noreferrer"
              aria-label={`Search YouTube for the official ${drama.title} trailer`}
              className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
                <img
                  src={drama.image}
                  alt={`Illustrative C-drama scene for ${drama.title}`}
                  width={1280}
                  height={960}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/5 to-transparent opacity-90" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 text-card">
                  <div className="min-w-0">
                    <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-card/50 bg-card/20 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-card backdrop-blur-sm">
                      <motion.span
                        animate={reduceMotion ? undefined : { scale: [1, 1.06, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        Rank {drama.rank}
                      </motion.span>
                      <span aria-hidden="true">·</span>
                      {drama.badge}
                    </span>
                    <h3 className="text-lg font-bold leading-tight">{drama.title}</h3>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card text-foreground shadow-lg transition-transform group-hover:scale-110">
                    <Play className="ml-0.5 h-4 w-4 fill-current" aria-hidden="true" />
                  </span>
                </div>
                <span className="absolute inset-0 flex items-center justify-center bg-foreground/35 text-sm font-extrabold uppercase tracking-wide text-card opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                  <span className="inline-flex items-center gap-2 rounded-full border border-card/70 bg-foreground/50 px-4 py-2 backdrop-blur-sm">
                    <Clapperboard className="h-4 w-4" aria-hidden="true" /> Find trailer
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 px-4 py-3.5">
                <span className="text-xs font-medium text-muted-foreground">{drama.genre}</span>
                <span className="shrink-0 text-xs font-semibold text-foreground">YouTube search</span>
              </div>
            </a>
          </motion.article>
        ))}
      </div>
    </section>
  );
}