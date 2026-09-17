export const overallRating = 4.4;
export const totalReviews = 469;

export type SuppliedReview = {
  name: string;
  metadata: string;
  isLocalGuide?: boolean;
  rating: 5;
  date: string;
  text: string;
};

/** Authentic excerpts and metadata supplied for publication by Coffeemistry. */
export const suppliedReviews: readonly SuppliedReview[] = [
  {
    name: "Ahmed Sajjad Zaidi",
    metadata: "4 reviews · 11 photos",
    rating: 5,
    date: "3 weeks ago",
    text: "Really loved everything here. In a peaceful corner of Islamabad, with a calm environment, and helpful staff.",
  },
  {
    name: "Faisal Jan Allawala",
    metadata: "58 reviews · 334 photos",
    isLocalGuide: true,
    rating: 5,
    date: "5 months ago",
    text: "Coffeemistry I absolutely love this coffee spot for one major reason — they truly respect...",
  },
  {
    name: "Mir Shai Mazar Baloch",
    metadata: "63 reviews · 345 photos",
    isLocalGuide: true,
    rating: 5,
    date: "8 months ago",
    text: "Coffeemistry in F-8 is one of those rare spots in Islamabad where good coffee, comfort, and creativity come together perfectly...",
  },
  {
    name: "aziz kakar",
    metadata: "82 reviews · 95 photos",
    isLocalGuide: true,
    rating: 5,
    date: "1 month ago",
    text: "Coffeemistry is one of those places where you can have a peaceful environment with your friends and family. Staff is very polite and their coffee tastes like straight from heaven...",
  },
  {
    name: "Noor Tareen",
    metadata: "19 reviews · 15 photos",
    isLocalGuide: true,
    rating: 5,
    date: "4 months ago",
    text: "Spanish latte was not spanish latte. Cappuccino had was okayish. Tiramisu was basically a 3 milk cake. Service was bad cuz the music was loud no one could hear if you are asking for a waiter. Vibe is nice",
  },
];

/** Aggregate topic counts only. They are not assigned to individual reviews. */
export const reviewTopics = [
  { label: "Spanish Latte", count: 23 },
  { label: "Speciality Coffee", count: 5 },
  { label: "Outdoor Seating", count: 10 },
  { label: "Banana Bread", count: 3 },
  { label: "Tiramisu", count: 2 },
  { label: "Hot Chocolate", count: 6 },
  { label: "Matcha", count: 3 },
  { label: "Brownie", count: 2 },
  { label: "Cheesecake", count: 2 },
  { label: "Cosy Place", count: 4 },
] as const;
