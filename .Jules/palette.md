## 2024-07-10 - Adding micro-UX improvements
**Learning:** Adding empty states and loading feedback dramatically improves the perception of quality and accessibility in simple react apps. Using `window.confirm` is a cheap but effective way to prevent destructive actions like clearing a cart.
**Action:** Always check for missing empty states on lists/carts and loading states on async actions (like forms/buttons) in future React components. Ensure destructive actions are guarded.
