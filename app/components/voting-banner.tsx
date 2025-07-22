import { useState } from "react";

export default function VotingBanner() {
  const [value, setValue] = useState(50);

  const getBorderColor = () => {
    if (value < 33) return "var(--leftred)";
    if (value >= 33 && value <= 66) return "var(--centerwhite)";
    return "var(--rightblue)";
  };

  return (
    <div className="bg-secondary col-span-full flex h-[200px] flex-col items-center justify-center rounded-md">
      <p className="p-xl">Glasuj! Kam spadajo te novice</p>
      <div className="relative w-[90%]">
        <div className="relative h-6 w-full overflow-hidden rounded-full">
          <div className="bg-gradient-leftred absolute inset-y-0 left-0 w-[33%]" />
          <div className="bg-centerwhite absolute inset-y-0 left-[33%] w-[33%]" />
          <div className="bg-gradient-rightblue absolute inset-y-0 left-[66%] w-[34%]" />
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={0.1}
          value={value}
          onChange={(e) => setValue(parseFloat(e.target.value))}
          className="pointer-events-auto absolute top-0 left-0 h-6 w-full appearance-none bg-transparent"
          style={{
            WebkitAppearance: "none",
          }}
        />
        <style>{`
          input[type='range']::-webkit-slider-thumb {
            -webkit-appearance: none;
            height: 48px;
            width: 48px;
            border-radius: 9999px;
            background-image: url('app/assets/provider_dummy.png');
            background-repeat: no-repeat;
            background-position: center;
            background-size: cover;
            border: 3px solid ${getBorderColor()};
            cursor: pointer;
            margin-top: -11px;
            transition: border-color 0.2s ease;
          }

          input[type='range']::-moz-range-thumb {
            height: 48px;
            width: 48px;
            border-radius: 9999px;
            background-image: url('app/assets/provider_dummy.png');
            background-repeat: no-repeat;
            background-position: center;
            background-size: cover;
            border: 3px solid ${getBorderColor()};
            cursor: pointer;
            transition: border-color 0.2s ease;
          }

          input[type='range']::-ms-thumb {
            height: 48px;
            width: 48px;
            border-radius: 9999px;
            background-image: url('app/assets/provider_dummy.png');
            background-repeat: no-repeat;
            background-position: center;
            background-size: cover;
            border: 3px solid ${getBorderColor()};
            cursor: pointer;
            transition: border-color 0.2s ease;
          }

          input[type='range']::-webkit-slider-runnable-track {
            background: transparent;
          }

          input[type='range']::-moz-range-track {
            background: transparent;
          }

          input[type='range']::-ms-track {
            background: transparent;
            border-color: transparent;
            color: transparent;
          }
        `}</style>
      </div>
    </div>
  );
}
