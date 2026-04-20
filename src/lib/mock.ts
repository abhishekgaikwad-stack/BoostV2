import type {
  Account,
  Article,
  Category,
  Feature,
  Game,
  Offer,
  OfferReview,
  Review,
  Seller,
  Stat,
} from "@/types";

const sampleAccount = (id: string): Account => ({
  id,
  gameSlug: "valorant",
  game: "Valorant",
  gameSubtitle: "Game Account",
  title: "20M 🏁 FORZA HORIZON 5 PS5 READY ACCOUNT 🚗",
  region: "ASIA PACIFIC",
  level: "Level 10",
  rank: "GOLD III",
  price: 40.2,
  oldPrice: 80.4,
  discount: 50,
  sellerName: "seller_name",
  rating: 4.87,
});

export const newAccounts: Account[] = Array.from({ length: 10 }, (_, i) =>
  sampleAccount(`acc-${i + 1}`),
);

const popularGameSlugs: Array<{ slug: string; name: string }> = [
  { slug: "valorant", name: "Valorant" },
  { slug: "cold-war", name: "Cold War" },
  { slug: "fortnite", name: "Fortnite" },
  { slug: "cs-go", name: "CS:GO" },
  { slug: "gta-v", name: "GTA V" },
  { slug: "minecraft", name: "Minecraft" },
  { slug: "roblox", name: "Roblox" },
  { slug: "rocket-league", name: "Rocket League" },
  { slug: "overwatch-2", name: "Overwatch II" },
  { slug: "rainbow-six-siege", name: "Rainbow Six" },
  { slug: "clash-royale", name: "Clash Royale" },
  { slug: "osrs", name: "OSRS" },
  { slug: "call-of-duty", name: "Call of Duty" },
  { slug: "league-of-legends", name: "LoL" },
];

const newGameSlugs: Array<{ slug: string; name: string }> = [
  { slug: "valorant", name: "Valorant" },
  { slug: "fortnite", name: "Fortnite" },
  { slug: "cold-war", name: "Cold War" },
  { slug: "cs-go", name: "CS:GO" },
  { slug: "gta-v", name: "GTA V" },
  { slug: "roblox", name: "Roblox" },
];

export const popularGames: Game[] = popularGameSlugs.map((g, i) => ({
  id: `game-${i + 1}`,
  slug: g.slug,
  name: g.name,
  cover: g.slug,
}));

export const newGames: Game[] = newGameSlugs.map((g, i) => ({
  id: `new-game-${i + 1}`,
  slug: g.slug,
  name: g.name,
  cover: g.slug,
}));

export const reviews: Review[] = Array.from({ length: 4 }, (_, i) => ({
  id: `rev-${i + 1}`,
  rating: 5,
  date: "16 April 2026",
  body: "really good communication and got what i wanted! will 100% buy again.",
  user: "User-1234",
  userSubtitle: "Valorant Account",
}));

export const articles: Article[] = Array.from({ length: 3 }, (_, i) => ({
  id: `art-${i + 1}`,
  title: "Top 10 roblox games to play",
  tag: "Valorant",
  duration: "8 min",
  date: "16 April 2026",
}));

export const stats: Stat[] = [
  { value: "4.8M+", label: "Orders Delivered" },
  { value: "< 90s", label: "Order Delivery time" },
  { value: "99.7%", label: "Refund Success" },
  { value: "1,240", label: "Verified Accounts" },
];

export const features: Feature[] = [
  { title: "SSL Secured", subtitle: "256-BIT ENCRYPTION" },
  { title: "Instant Delivery", subtitle: "AVG. UNDER 90 SECONDS" },
  { title: "24/7 Human Support", subtitle: "LIVE CHAT, ANY TIME ZONE" },
  { title: "Buyer Protection", subtitle: "14-DAY MONEY-BACK" },
  { title: "Authenticated Sellers", subtitle: "EVERY SELLER KYC-VERIFIED" },
];

export const categories: Category[] = [
  { id: "valorant", name: "Valorant" },
  { id: "osrs", name: "Old School Runescape" },
  { id: "cs-go", name: "Counter Strike : GO" },
  { id: "clash-royale", name: "Clash Royale" },
  { id: "overwatch-2", name: "Overwatch II" },
  { id: "gta-v", name: "GTA V" },
  { id: "cod", name: "Call of Duty" },
  { id: "minecraft", name: "Minecraft" },
  { id: "fortnite", name: "Fortnite" },
  { id: "rocket-league", name: "Rocket League" },
  { id: "roblox", name: "Roblox" },
  { id: "r6", name: "Rainbow six siege" },
];

export const flashSaleAccount: Account = {
  id: "flash-1",
  gameSlug: "valorant",
  game: "Valorant",
  gameSubtitle: "Game Account",
  title: "20M 🏁 FORZA HORIZON 5 PS5 READY ACCOUNT 🚗",
  region: "ASIA PACIFIC",
  level: "Level 10",
  rank: "GOLD III",
  price: 40.2,
  oldPrice: 80.4,
  discount: 50,
  sellerName: "seller_name",
  rating: 4.87,
};

const sampleSeller: Seller = {
  id: "seller-empire",
  name: "Empire Gaming",
  isOnline: true,
  rating: 4.5,
  reviewCount: 4049,
};

const sampleOfferReview = (id: string, suffix: string): OfferReview => ({
  id,
  rating: 5,
  body: "really good communication and got what i wanted! will 100% buy again.",
  date: "16 April 2026",
  user: `User-${suffix}`,
  userSubtitle: "Valorant Account",
});

export const sampleOffer: Offer = {
  ...sampleAccount("offer-1"),
  description: `Account information:
• League and Class are not selected on the account (Level is the very first)
• Hours are wound up (without playing in matches)
• Native mail
• No Steam Guard
• Completely empty account

List of games on the account:
Counter-Strike 2 / Dota 2 / Team Fortress 2 / Albion Online / Apex Legends™ / Crossout / EVE Online / THE FINALS / KUBOOM / Paladins® / Path of Exile / The First Descendant / PUBG: BATTLEGROUNDS / Russian Fishing 4 / STALCRAFT: X / Marvel Rivals / World of Tanks / War Thunder / Warframe / Allods Online / Caliber / Destiny 2 / Pixel Gun 3D: PC Edition / Farlight 84 / Lost Light / NARAKA: BLADEPOINT / World of Warships / The Sims™ 4 / Delta Force / Delta Force / Karos / World of Tanks Blitz / Call of Duty®: Warzone™

How to log in to your account?
• After ordering, you will receive the following account data: Login: Password: Email: Email password`,
  images: [],
  seller: sampleSeller,
  reviews: [
    sampleOfferReview("rev-1", "1234"),
    sampleOfferReview("rev-2", "5678"),
    sampleOfferReview("rev-3", "9101"),
  ],
  offerEndsLabel: "OFFER ENDS IN 42HRS 32MIN",
};

export function findOffer(gameSlug: string, offerId: string): Offer | null {
  // Everything currently routes to the same sample offer, tagged with the
  // requested slug/id so the UI shows the right values. Swap for a Prisma
  // query (prisma.account.findUnique) once migrations are run.
  if (gameSlug !== "valorant") return null;
  return { ...sampleOffer, id: offerId, gameSlug };
}

export function similarOffers(gameSlug: string, excludeId: string): Account[] {
  return newAccounts
    .filter((account) => account.gameSlug === gameSlug && account.id !== excludeId)
    .slice(0, 5);
}

const knownGames: Record<string, string> = {
  valorant: "Valorant",
  "cold-war": "Cold War",
  fortnite: "Fortnite",
  "cs-go": "CS:GO",
  "gta-v": "GTA V",
  minecraft: "Minecraft",
  roblox: "Roblox",
  "rocket-league": "Rocket League",
  "overwatch-2": "Overwatch II",
  "rainbow-six-siege": "Rainbow Six",
  "clash-royale": "Clash Royale",
  osrs: "Old School RuneScape",
  "call-of-duty": "Call of Duty",
  "league-of-legends": "League of Legends",
};

export function findGameBySlug(slug: string): Game | null {
  const name = knownGames[slug];
  if (!name) return null;
  return { id: slug, name, cover: slug };
}

export function offersForGame(gameSlug: string): Account[] {
  // Currently all mock accounts are valorant. When real data flows through
  // Prisma this becomes `prisma.account.findMany({ where: { game: { slug } } })`.
  if (gameSlug !== "valorant") return [];
  return newAccounts.filter((account) => account.gameSlug === gameSlug);
}

export type Faq = { question: string; answer: string };

export const genericFaqs: Faq[] = [
  {
    question: "How does account delivery work?",
    answer:
      "Once payment clears, the seller's credentials are unlocked in your orders page within seconds. You can also check your email for a copy.",
  },
  {
    question: "Is buying a game account safe?",
    answer:
      "Every seller is KYC-verified and every order is protected by our 14-day warranty. If access is ever revoked within that window you get a full refund.",
  },
  {
    question: "What happens if the account gets banned?",
    answer:
      "Open a dispute from your order page within 14 days. We hold the seller's funds until the issue is resolved, so refunds are fast.",
  },
  {
    question: "Can I change the email and password after purchase?",
    answer:
      "Yes — we strongly recommend it. The delivery email includes step-by-step instructions to secure the account under your own details.",
  },
  {
    question: "How do I contact support?",
    answer:
      "24/7 human support via chat on every page, or reply directly to any order confirmation email.",
  },
  {
    question: "What is your refund policy?",
    answer:
      "Full refund within 14 days if the account is inaccessible, falsely described, or banned for reasons predating the sale.",
  },
];

// Keep the old export name available for any existing imports.
export const accountFaqs = genericFaqs;

const faqsByGame: Record<string, Faq[]> = {
  valorant: [
    {
      question: "Will my Valorant account keep its current rank?",
      answer:
        "Yes. Ranks stay exactly as listed. However Riot may periodically decay inactive competitive ratings, so jump into a match soon after delivery.",
    },
    {
      question: "Which regions are Valorant accounts available for?",
      answer:
        "We list NA, EU, KR, AP (Asia Pacific) and BR on every listing — the region is shown on the card. You can only play on the region the account was created in.",
    },
    {
      question: "Do the unlocked agents and skins transfer with the account?",
      answer:
        "Everything tied to the Riot account stays — agents, weapon skins, buddies, sprays, player cards, and cosmetic trackers.",
    },
    {
      question: "Can I ranked queue on the day I buy?",
      answer:
        "If the account already cleared the placement matches (most of ours have), yes. Listings will say 'unranked' if placements still need to be played.",
    },
    {
      question: "What happens if Riot bans the account later?",
      answer:
        "Our 14-day warranty covers pre-existing violations. Bans caused by cheating or violations after purchase are the buyer's responsibility.",
    },
    {
      question: "Can I change the email on a Valorant account?",
      answer:
        "Yes — the delivery email includes step-by-step instructions for the Riot email and password swap. We recommend doing this within 24 hours of purchase.",
    },
  ],
  fortnite: [
    {
      question: "Will all skins and V-Bucks transfer?",
      answer:
        "Yes — everything on the Epic Games account moves with it: skins, pickaxes, gliders, emotes, back blings, and any remaining V-Bucks.",
    },
    {
      question: "Does the account work on all platforms?",
      answer:
        "Fortnite accounts are cross-platform by default. Some console-locked cosmetics may only display on their original platform.",
    },
    {
      question: "What if the account has 2FA enabled?",
      answer:
        "The seller disables 2FA before delivery and includes the current email password. Re-enable 2FA on your own device after transfer.",
    },
  ],
  "cs-go": [
    {
      question: "Do accounts come with Prime Status?",
      answer:
        "Each listing states whether Prime is active. Prime-only accounts are clearly labelled with a Prime badge.",
    },
    {
      question: "Will I keep the current rank?",
      answer:
        "The competitive rank transfers intact. Note that Valve's matchmaking can adjust ratings downward after periods of inactivity.",
    },
    {
      question: "Are items in the inventory tradeable?",
      answer:
        "Trade holds reset when the account changes hands. Items will be tradeable again after the standard 7-day Steam cooldown.",
    },
  ],
};

export function faqsForGame(slug: string): Faq[] {
  return faqsByGame[slug] ?? genericFaqs;
}
