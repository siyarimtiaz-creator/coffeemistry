import { describe, expect, it } from "vitest";
import { overallRating, reviewTopics, suppliedReviews, totalReviews } from "./reviews";

describe("supplied Coffeemistry reviews", () => {
  it("preserves the supplied aggregate rating and review count", () => {
    expect(overallRating).toBe(4.4);
    expect(totalReviews).toBe(469);
  });

  it("contains only the five supplied reviewer records and their supplied five-star ratings", () => {
    expect(suppliedReviews.map(review => review.name)).toEqual([
      "Ahmed Sajjad Zaidi",
      "Faisal Jan Allawala",
      "Mir Shai Mazar Baloch",
      "aziz kakar",
      "Noor Tareen",
    ]);
    expect(suppliedReviews.every(review => review.rating === 5)).toBe(true);
    expect(suppliedReviews[0]?.text).toBe("Really loved everything here. In a peaceful corner of Islamabad, with a calm environment, and helpful staff.");
  });

  it("keeps topic counts aggregate-only without assigning topics to reviewers", () => {
    expect(reviewTopics).toEqual([
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
    ]);
    expect(suppliedReviews.every(review => !("topics" in review))).toBe(true);
  });
});
