# Utrinki titles and image swipe

## Title case

Story titles on `/utrinki` are capitalized with Tailwind `first-letter:uppercase`, the same class as the story-page `h1` in `app/components/story-page.tsx` (and the home cards in `article.tsx` / `article-big.tsx`).

`capitalize` was the other option. It title-cases every word. Utrinki titles are full headlines (`summaryTitle` or the story title), the same sentences the story page shows, so title case would turn "Brezovec brez maske" into "Brezovec Brez Maske". `first-letter:uppercase` only lifts the first letter and leaves the rest of the sentence alone. The underlying string is unchanged; share text and saved records still store the original title.

The class sits on the card `h2` and on the saved-sheet title. Article titles inside the sources sheet are not story titles and stay as they are.

## Image swipe

Each story's `imageCandidates` are already the hero photos in carousel order (`getCarouselArticleIds`, capped at four). The reel used to probe those URLs and keep only the largest. It now shows them as slides.

The swipe uses the existing `embla-carousel-react` dependency and the same pattern as `HeroImageCarousel` on the story page: `useEmblaCarousel({ loop: true })`, a flex track with `touch-pan-y`, `draggable={false}` images, and the same dot buttons (`Slika 1` …). A tap on a photo still opens the story. Embla cancels that click after a drag. No new carousel library.

The story-page carousel is not limited to a breakpoint: mouse drag works on desktop as well as touch swipe on a phone. The reel carousel is therefore active at every width. A story with one photo (or none) stays a single image or the logo placeholder.

Autoplay from the story page is not copied. That hero advances on its own because it sits in a long article. On the reel the photo fills the card the reader is already on, and the taught gesture is a vertical swipe to the next story. Changing the photo without a horizontal swipe would fight that. Dots stay, including on desktop, because the story page also shows them and the reel has no caption bar to park them in.

Vertical swipes on the photo still move the reel: `touch-action: pan-y` is what the story page uses so the browser, not Embla, owns the vertical axis.
