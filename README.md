# Vidik Web App

News article aggregation and bias rating platform.

## This project is built with React Router

- 📖 [React Router docs](https://reactrouter.com/)

### Installation

Install the dependencies:

```bash
pnpm install
```

### Development

Start the development server with HMR:

```bash
pnpm run dev
```

Your application will be available at `http://localhost:5173`.

## Previewing the Production Build

Preview the production build locally:

```bash
pnpm run preview
```

## Building for Production

Create a production build:

```bash
pnpm run build
```

## Styling

- [Tailwind CSS](https://tailwindcss.com/)
- [ShadcnUI](https://ui.shadcn.com/)

## Icons

Use [Lucide Icons](https://lucide.dev/icons/) via lucide-react for generic icons.

Use the [Icon](/app/components/icon.tsx) if you want to display a custom svg. The svg component need and id="icon" property to work.
Use [svg optimizer](https://jakearchibald.github.io/svgomg/) to optimize svgs.

## Components

Use the shadcn cli to add a component to the repo in the **/app/components/ui** directory.

```bash
pnpm dlx shadcn@latest add [component_name]
```

## Database setup

The source of the database schema is in the scraper repository, and the schema in this repo should be kept read only.
Sync the production database schema with /app/drizzle/schema.ts with this command:

```bash
pnpm run db:pull
```

### Local development

Set `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` in `.env` to your database URL with `?sslmode=require`. See the [Hyperdrive local development docs](https://developers.cloudflare.com/hyperdrive/configuration/local-development/).
