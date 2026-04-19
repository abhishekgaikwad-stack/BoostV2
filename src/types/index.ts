export type Account = {
  id: string;
  game: string;
  gameThumb?: string;
  gameSubtitle: string;
  title: string;
  region: string;
  level: string;
  rank: string;
  price: number;
  oldPrice?: number;
  discount?: number;
  sellerName?: string;
  rating?: number;
};

export type Game = {
  id: string;
  name: string;
  cover?: string;
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
