// Types and pure helpers for buyer reviews. Kept separate from
// `src/lib/reviews.ts` so client components can import them without
// pulling in the server-only Supabase client.

export type MyReview = {
  id: string;
  rating: number;
  body: string | null;
  createdAt: string;
  updatedAt: string;
};

const EDIT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

/** True while the review is still within the 30-day edit window. */
export function isWithinEditWindow(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < EDIT_WINDOW_MS;
}
