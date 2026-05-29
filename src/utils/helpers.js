export const DIFFICULTIES = ["Easy", "Medium", "Hard"];

export const TOPICS = [
  "Array", "String", "Linked List", "Tree", "Graph",
  "Dynamic Programming", "Binary Search", "Stack", "Queue",
  "Heap", "Trie", "Backtracking", "Greedy", "Math",
  "Two Pointers", "Sliding Window", "Hashing", "Recursion",
  "Bit Manipulation", "Sorting"
];

export const STATUSES = ["Not Started", "Attempted", "Solved", "Review"];

export function extractSlug(url) {
  const m = url.match(/leetcode\.com\/problems\/([\w-]+)/);
  return m ? m[1] : null;
}

export function slugToTitle(slug) {
  return slug
    .split("-")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function daysUntil(dateStr) {
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}