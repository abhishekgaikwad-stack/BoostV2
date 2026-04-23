export type Game = {
  id: string;
  slug: string;
  name: string;
  subtitle?: string;
  cover?: string;
};

// Mirrors a joined `Account { game: Game, seller: User }` relation — never
// duplicate slug/name/sellerName on Account; always access through nested refs.
export type Account = {
  id: string;
  game: Game;
  seller: {
    id: string;
    name: string;
    rating?: number;
  };
  title: string;
  price: number;
  oldPrice?: number;
  images?: string[];
};

export type Seller = {
  id: string;
  name: string;
  avatarUrl?: string;
  isOnline: boolean;
  rating: number;
  reviewCount: number;
  storeId?: number;
};

export type OfferReview = {
  id: string;
  rating: number;
  body: string;
  date: string;
  user: string;
  userSubtitle: string;
};

export type Offer = Account & {
  description: string;
  images: string[];
  seller: Seller;
  reviews: OfferReview[];
  /** ISO-8601 timestamp when the offer expires. Client formats for display. */
  offerEndsAt?: string;
};

export type Review = {
  id: string;
  rating: number;
  date: string;
  body: string;
  user: string;
  userSubtitle: string;
};

export type Article = {
  id: string;
  title: string;
  tag: string;
  duration: string;
  date: string;
  image?: string;
};

export type Category = {
  id: string;
  name: string;
};

export type Stat = {
  value: string;
  label: string;
};

export type Feature = {
  title: string;
  subtitle: string;
};
