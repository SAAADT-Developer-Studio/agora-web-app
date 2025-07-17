export default function Footer() {
  return (
    <div className="bg-secondary mt-10 flex h-30 w-full flex-col items-center justify-between p-6">
      <div className="p-sm flex w-full max-w-[1200px] items-center justify-between">
        <a>UVOD V POLITIKO</a>
        <a>SWIPER</a>
        <a>DONIRAJ</a>
        <a>KONTAKT</a>
        <a>PRIVACY POLICY</a>
      </div>
      <p className="text-primary text-sm">
        @vidik.si - {new Date().getFullYear()}
      </p>
    </div>
  );
}
