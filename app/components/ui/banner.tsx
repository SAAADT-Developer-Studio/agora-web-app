export type BannerProps = {
  title: string;
  description: string;
  button: React.ReactNode;
  iconComponent: (props: { className: string }) => React.ReactNode;
};

export default function Banner(props: Readonly<BannerProps>) {
  return (
    <div className="bg-foreground border-vidikdarkgray/10 flex items-end justify-between rounded-lg border-1 p-4 sm:col-span-full dark:border-0">
      <div className="flex h-full w-full flex-col">
        <div className="flex w-full items-start justify-between">
          <p className="p-lg">{props.title}</p>
        </div>
        <p className="p-sm-regular w-[40%] pt-2">{props.description}</p>
      </div>
      <div className="flex h-full flex-1 flex-col items-end justify-between gap-4">
        <props.iconComponent className="h-6 w-6" />
        {props.button}
      </div>
    </div>
  );
}
