# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Slovenian news readers who want to see how the same event is covered across the national media landscape, and who are skeptical of any single outlet's framing. They skim the home page several times a day on phone and desktop, open a story, and compare sources. (Inferred from AGENTS.md and the product copy; not separately interviewed.)

## Product Purpose

Vidik (vidik.si) aggregates articles from Slovenian outlets, groups them into stories, and shows each story's coverage split by the political lean of its sources. Success means a reader understands what happened, who reported it, and which side of the spectrum is (or is not) covering it.

## Positioning

A Slovenian-first "Ground News": every story carries a left/center/right coverage distribution derived from per-outlet bias ratings that readers can vote on. Blindspots, stories covered almost only by one side, are a first-class lens.

## Capabilities and Constraints

- Stories are `cluster_v2` (public `/`, `/:category`, links to clanek) or `story` (hidden `/novo`, links to `/zgodba/:storyId`). Both feed the same home layout.
- Bias ratings: `left`, `center-left`, `center`, `center-right`, `right`, collapsed to left/center/right for distributions.
- Readers can vote on an outlet's bias rating on `/medij/:providerKey`.
- UI copy is Slovenian; `/dev/*` is English.

## Brand Commitments

- Name is always **Vidik**. Logo and outlet logos come from `images.vidik.si`.
- Bias colours are fixed: left `#FA2D36`, center-left `#FF6166`, center `#FEFFFF`, center-right `#52A1FF`, right `#2D7EFF`. Accent `electricblue`.
- The story page (`/zgodba/:storyId`, `app/components/story-page.tsx`) is the newest design reference; other surfaces should roughly match it.

## Evidence on Hand

Real articles, outlet logos, story summaries, and social mentions from the production database. No testimonials or usage numbers; none may be invented.

## Product Principles

1. Show coverage, don't editorialise: distributions and sources speak, Vidik doesn't take sides.
2. Every widget must help the reader understand the news; decoration and trivia (macro charts, raw article counts) do not earn space.
3. Scan first: a reader should grasp the top stories and their coverage balance within one screen.
