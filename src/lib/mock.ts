import type {
  Account,
  Article,
  Category,
  Feature,
  Game,
  Review,
  Stat,
} from "@/types";

const sampleAccount = (id: string): Account => ({
  id,
  game: "Valorant",
  gameSubtitle: "Game Account",
  title: "20M 🏁 FORZA HORIZON 5 PS5 READY ACCOUNT 🚗",
  region: "ASIA PACIFIC",
  level: "Level 10",
  rank: "GOLD III",
  price: 40.2,
  oldPrice: 80.4,
  discount: 50,
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
  name: g.name,
  cover: g.slug,
}));

export const newGames: Game[] = newGameSlugs.map((g, i) => ({
  id: `new-game-${i + 1}`,
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
  game: "Valorant",
  gameSubtitle: "Game Account",
  title: "20M 🏁 FORZA HORIZON 5 PS5 READY ACCOUNT 🚗",
  region: "ASIA PACIFIC",
  level: "Level 10",
  rank: "GOLD III",
  price: 40.2,
  oldPrice: 80.4,
  discount: 50,
};
