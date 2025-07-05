import stockArticleImage from "~/assets/stock-article-image.jpg";

export function Article() {
  return (
    <article className="flex w-[500px] flex-col gap-4">
      <img
        src={stockArticleImage}
        alt="Stock article image"
        className="h-[300px] w-full object-cover"
      />
      <h1 className="text-3xl font-bold">Naslov članka</h1>
      <p className="text-gray-400">Avtor: Marko Novak</p>
      <p className="text-gray-300">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat.
      </p>
    </article>
  );
}
