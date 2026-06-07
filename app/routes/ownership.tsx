import type { Route } from "./+types/ownership";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { biasKeyToColor } from "~/utils/biasKeyToColor";
import { biasKeyToLabel } from "~/utils/biasKeyToLabel";
import type { BiasRating } from "~/enums/biasRatingKey";
import {
  getProviderImageUrl,
  ProviderImage,
} from "~/components/provider-image";
import { getBiasHexColor } from "~/utils/biasKeyToHexColor";
import igorVovk from "~/assets/ownership/igor-vovk.jpg";
import zavodIskreni from "~/assets/ownership/zavod-iskreni.jpg";
import mirkoMayer from "~/assets/ownership/mirko-mayer.webp";
import rokCaks from "~/assets/ownership/rok-caks.webp";
import drugiSvet from "~/assets/ownership/drugi-svet.png";
import vidaStilec from "~/assets/ownership/vida-stilec.jpeg";
import alesStrancar from "~/assets/ownership/ales-strancar.jpg";
import genericCompany from "~/assets/ownership/generic-company.png";
import genericPerson from "~/assets/ownership/generic-person.png";
import wodakPartner from "~/assets/ownership/wodak-partner.png";
import mediaInvest from "~/assets/ownership/media-invest.png";

import { cn } from "~/lib/utils";
import { Globe } from "lucide-react";
import { removeUrlProtocol } from "~/utils/removeUrlProtocol";
import { BiasInfoTooltip } from "~/components/bias-info-tooltip";
import { ShareButtons } from "./article";

type OwnershipNodeData = {
  image?: string;
  title: string;
  description?: string[];
  biasRating?: BiasRating;
};

function OwnershipNode({ data }: NodeProps<Node<OwnershipNodeData>>) {
  return (
    <div className="relative flex min-w-[180px] flex-col items-center rounded-lg">
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!border-none !bg-transparent"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!border-none !bg-transparent"
      />

      {data.image && (
        <div className="relative mb-1 size-[120px] rounded-lg">
          {data.biasRating && (
            <div
              className={`shadow-vidik text-surface-text absolute -top-2 right-2 rounded px-2 py-1 text-xs font-semibold ${biasKeyToColor(data.biasRating)}`}
            >
              {biasKeyToLabel(data.biasRating)}
            </div>
          )}
          <img
            src={data.image}
            alt={data.title}
            className="shadow-vidik size-full rounded-md object-cover"
          />
        </div>
      )}

      <h3 className="text-surface-text mb-1 text-center text-sm font-bold">
        {data.title}
      </h3>

      {data.description?.length &&
        data.description.map((desc, index) => (
          <p
            key={"p" + index}
            className="text-surface-text/50 text-center text-xs"
          >
            {desc}
          </p>
        ))}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!border-none !bg-transparent"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!border-none !bg-transparent"
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        className="!border-none !bg-transparent"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        className="!border-none !bg-transparent"
      />
    </div>
  );
}

const nodeTypes = {
  ownership: OwnershipNode,
};

type OwnershipGraph = {
  nodes: Node<OwnershipNodeData>[];
  edges: Edge[];
};

const ownershipData: Record<string, OwnershipGraph> = {
  zanimame: {
    nodes: [
      {
        id: "zanimame",
        type: "ownership",
        position: { x: 400, y: 0 },
        data: {
          image: getProviderImageUrl("zanimame", 160),
          title: "Zanime Me",
          description: ["Zanima.me, izdajanje medijev in založništvo, d.o.o."],
          biasRating: "right",
        },
      },
      {
        id: "igor-vovk",
        type: "ownership",
        position: { x: 0, y: 250 },
        data: {
          image: igorVovk,
          title: "Igor Vovk",
          description: [
            "Je 25% lastnik Zanima.me",
            "Je 100% lastnik Zavod Iskreni",
          ],
        },
      },
      {
        id: "zavod-iskreni",
        type: "ownership",
        position: { x: 250, y: 250 },
        data: {
          image: zavodIskreni,
          title: "Zavod Iskreni",
          description: ["Je 25% lastnik Zanima.me"],
        },
      },
      {
        id: "drugi-svet",
        type: "ownership",
        position: { x: 500, y: 250 },
        data: {
          image: drugiSvet,
          title: "Drugi Svet",
          description: ["Je 25% lastnik Zanima.me"],
        },
      },
      {
        id: "mirko-mayer",
        type: "ownership",
        position: { x: 750, y: 250 },
        data: {
          image: mirkoMayer,
          title: "Mirko Mayer",
          description: ["Je 25% lastnik Zanima.me"],
        },
      },
      {
        id: "rok-caks",
        type: "ownership",
        position: { x: 500, y: 450 },
        data: {
          image: rokCaks,
          title: "Rok Čakš",
          description: ["Je 100% lastnik Drugi Svet"],
        },
      },
    ],
    edges: [
      {
        id: "e-zanimame-igor",
        source: "zanimame",
        target: "igor-vovk",
        style: { stroke: getBiasHexColor("right"), strokeWidth: 2 },
      },
      {
        id: "e-zanimame-zavod",
        source: "zanimame",
        target: "zavod-iskreni",
        style: { stroke: getBiasHexColor("right"), strokeWidth: 2 },
      },
      {
        id: "e-zanimame-drugi",
        source: "zanimame",
        target: "drugi-svet",
        style: { stroke: getBiasHexColor("right"), strokeWidth: 2 },
      },
      {
        id: "e-zanimame-mirko",
        source: "zanimame",
        target: "mirko-mayer",
        style: { stroke: getBiasHexColor("right"), strokeWidth: 2 },
      },
      {
        id: "e-igor-zavod",
        source: "igor-vovk",
        sourceHandle: "right",
        target: "zavod-iskreni",
        targetHandle: "left",
        style: { stroke: getBiasHexColor("right"), strokeWidth: 2 },
      },
      {
        id: "e-drugi-rok",
        source: "drugi-svet",
        target: "rok-caks",
        style: { stroke: getBiasHexColor("right"), strokeWidth: 2 },
      },
    ],
  },
  domovina: {
    nodes: [
      {
        id: "domovina",
        type: "ownership",
        position: { x: 1100, y: 300 },
        data: {
          image: getProviderImageUrl("domovina", 160),
          title: "Domovina.je",
          description: ["Domovina, izdajanje medijev", "in založništvo, d.o.o"],
          biasRating: "right",
        },
      },
      {
        id: "media-invest",
        type: "ownership",
        position: { x: 850, y: 300 },
        data: {
          title: "Media Invest",
          image: mediaInvest,
          description: ["Je 100% lastnik Domovina"],
        },
      },
      {
        id: "panta-rhei",
        type: "ownership",
        position: { x: 500, y: 300 },
        data: {
          title: "Panta Rhei GMBH",
          image: genericCompany,
          description: ["Je 48,65% lastnik Media Invest"],
        },
      },
      {
        id: "wodak-partner",
        type: "ownership",
        position: { x: 350, y: 0 },
        data: {
          title: "Wodak & Partner",
          image: wodakPartner,
          description: ["Je 10% lastnik Panta Rhei GMBH"],
        },
      },
      {
        id: "abphage",
        type: "ownership",
        position: { x: 250, y: 300 },
        data: {
          title: "AbPhage",
          image: genericCompany,
          description: ["Je 90% lastnik Panta Rhei GMBH"],
        },
      },
      {
        id: "marjeta-strancar",
        type: "ownership",
        position: { x: 0, y: 300 },
        data: {
          title: "Marjeta Štrancar",
          image: genericPerson,
          description: ["Je 55% lastnica AbPhage"],
        },
      },
      {
        id: "vida-stilec",
        type: "ownership",
        position: { x: 0, y: 500 },
        data: {
          title: "Vida Štilec",
          image: vidaStilec,
          description: ["Včasih Vida Štrancar", "Je 45% lastnica AbPhage"],
        },
      },
      {
        id: "ales-strancar",
        type: "ownership",
        position: { x: 550, y: 500 },
        data: {
          title: "Aleš Štrancar",
          image: alesStrancar,
          description: ["Je 51,35% lastnik Media Invest"],
        },
      },
    ],
    edges: [
      {
        id: "e-media-domovina",
        source: "media-invest",
        sourceHandle: "right",
        target: "domovina",
        targetHandle: "left",
        style: { stroke: getBiasHexColor("right"), strokeWidth: 2 },
      },
      {
        id: "e-panta-media",
        source: "panta-rhei",
        sourceHandle: "right",
        target: "media-invest",
        targetHandle: "left",
        style: { stroke: getBiasHexColor("right"), strokeWidth: 2 },
      },
      {
        id: "e-wodak-panta",
        source: "wodak-partner",
        sourceHandle: "bottom",
        target: "panta-rhei",
        targetHandle: "top",
        style: { stroke: getBiasHexColor("right"), strokeWidth: 2 },
      },
      {
        id: "e-abphage-panta",
        source: "abphage",
        sourceHandle: "right",
        target: "panta-rhei",
        targetHandle: "left",
        style: { stroke: getBiasHexColor("right"), strokeWidth: 2 },
      },
      {
        id: "e-marjeta-abphage",
        source: "marjeta-strancar",
        sourceHandle: "right",
        target: "abphage",
        targetHandle: "left",
        style: { stroke: getBiasHexColor("right"), strokeWidth: 2 },
      },
      {
        id: "e-vida-abphage",
        source: "abphage",
        sourceHandle: "bottom",
        target: "vida-stilec",
        targetHandle: "right-target",
        style: { stroke: getBiasHexColor("right"), strokeWidth: 2 },
      },
      {
        id: "e-ales-media",
        source: "media-invest",
        sourceHandle: "bottom",
        target: "ales-strancar",
        targetHandle: "right-target",
        style: { stroke: getBiasHexColor("right"), strokeWidth: 2 },
      },
    ],
  },
  info360: {
    nodes: [
      {
        id: "info360",
        type: "ownership",
        position: { x: 1300, y: 200 },
        data: {
          image: getProviderImageUrl("info360", 160),
          title: "Info 360",
          description: ["Info 360, spletni medij"],
          biasRating: "center-right",
        },
      },
      {
        id: "media-x",
        type: "ownership",
        position: { x: 1050, y: 200 },
        data: {
          title: "Media X",
          image: genericCompany,
          description: ["Je 100% lastnik Info 360"],
        },
      },
      {
        id: "media-invest",
        type: "ownership",
        position: { x: 800, y: 200 },
        data: {
          title: "Media Invest",
          image: mediaInvest,
          description: ["Je 100% lastnik Media X"],
        },
      },
      {
        id: "panta-rhei",
        type: "ownership",
        position: { x: 500, y: 200 },
        data: {
          title: "Panta Rhei GMBH",
          image: genericCompany,
          description: ["Je 48,65% lastnik Media Invest"],
        },
      },
      {
        id: "wodak-partner",
        type: "ownership",
        position: { x: 350, y: 0 },
        data: {
          title: "Wodak & Partner",
          image: wodakPartner,
          description: ["Je 10% lastnik Panta Rhei GMBH"],
        },
      },
      {
        id: "abphage",
        type: "ownership",
        position: { x: 250, y: 200 },
        data: {
          title: "AbPhage",
          image: genericCompany,
          description: ["Je 90% lastnik Panta Rhei GMBH"],
        },
      },
      {
        id: "marjeta-strancar",
        type: "ownership",
        position: { x: 0, y: 200 },
        data: {
          title: "Marjeta Štrancar",
          image: genericPerson,
          description: ["Je 55% lastnica AbPhage"],
        },
      },
      {
        id: "vida-stilec",
        type: "ownership",
        position: { x: 0, y: 400 },
        data: {
          title: "Vida Štilec",
          image: vidaStilec,
          description: ["Včasih Vida Štrancar", "Je 45% lastnica AbPhage"],
        },
      },
      {
        id: "ales-strancar",
        type: "ownership",
        position: { x: 550, y: 500 },
        data: {
          title: "Aleš Štrancar",
          image: alesStrancar,
          description: ["Je 51,35% lastnik Media Invest"],
        },
      },
    ],
    edges: [
      {
        id: "e-mediax-info360",
        source: "media-x",
        sourceHandle: "right",
        target: "info360",
        targetHandle: "left",
        style: { stroke: getBiasHexColor("center-right"), strokeWidth: 2 },
      },
      {
        id: "e-media-mediax",
        source: "media-invest",
        sourceHandle: "right",
        target: "media-x",
        targetHandle: "left",
        style: { stroke: getBiasHexColor("center-right"), strokeWidth: 2 },
      },
      {
        id: "e-panta-media",
        source: "panta-rhei",
        sourceHandle: "right",
        target: "media-invest",
        targetHandle: "left",
        style: { stroke: getBiasHexColor("center-right"), strokeWidth: 2 },
      },
      {
        id: "e-wodak-panta",
        source: "wodak-partner",
        sourceHandle: "bottom",
        target: "panta-rhei",
        targetHandle: "top",
        style: { stroke: getBiasHexColor("center-right"), strokeWidth: 2 },
      },
      {
        id: "e-abphage-panta",
        source: "abphage",
        sourceHandle: "right",
        target: "panta-rhei",
        targetHandle: "left",
        style: { stroke: getBiasHexColor("center-right"), strokeWidth: 2 },
      },
      {
        id: "e-marjeta-abphage",
        source: "marjeta-strancar",
        sourceHandle: "right",
        target: "abphage",
        targetHandle: "left",
        style: { stroke: getBiasHexColor("center-right"), strokeWidth: 2 },
      },
      {
        id: "e-vida-abphage",
        source: "abphage",
        sourceHandle: "bottom",
        target: "vida-stilec",
        targetHandle: "right-target",
        style: { stroke: getBiasHexColor("center-right"), strokeWidth: 2 },
      },
      {
        id: "e-ales-media",
        source: "media-invest",
        sourceHandle: "bottom",
        target: "ales-strancar",
        targetHandle: "right-target",
        style: { stroke: getBiasHexColor("center-right"), strokeWidth: 2 },
      },
    ],
  },
  "24ur": {
    nodes: [
      {
        id: "1",
        type: "ownership",
        position: { x: 250, y: 0 },
        data: {
          title: "Pro Plus d.o.o.",
          description: ["Lastnik"],
        },
      },
      {
        id: "2",
        type: "ownership",
        position: { x: 250, y: 150 },
        data: {
          image: "/providers/24ur.png",
          title: "24ur",
          description: ["Novičarski portal"],
          biasRating: "center",
        },
      },
    ],
    edges: [
      {
        id: "e1-2",
        source: "1",
        target: "2",
        style: { stroke: getBiasHexColor("center"), strokeWidth: 2 },
      },
    ],
  },
  rtvslo: {
    nodes: [
      {
        id: "1",
        type: "ownership",
        position: { x: 250, y: 0 },
        data: {
          title: "Republika Slovenija",
          description: ["Javni zavod"],
        },
      },
      {
        id: "2",
        type: "ownership",
        position: { x: 250, y: 150 },
        data: {
          image: getProviderImageUrl("rtv", 160),
          title: "RTV Slovenija",
          description: ["Javni medij"],
          biasRating: "center-left",
        },
      },
    ],
    edges: [
      {
        id: "e1-2",
        source: "1",
        target: "2",
        style: { stroke: getBiasHexColor("center-left"), strokeWidth: 2 },
      },
    ],
  },
};

const defaultGraph: OwnershipGraph = {
  nodes: [
    {
      id: "1",
      type: "ownership",
      position: { x: 250, y: 50 },
      data: { title: "Ni podatkov" },
    },
  ],
  edges: [],
};

export async function loader({ context, params }: Route.LoaderArgs) {
  const { providerKey } = params;
  const { db } = context;

  if (!providerKey) {
    throw new Response("Not Found", { status: 404 });
  }

  const provider = await db.query.newsProvider.findFirst({
    where: (provider: { key: any }, { eq }: any) =>
      eq(provider.key, params.providerKey),
  });

  if (!provider) {
    throw new Response("Provider not found", { status: 404 });
  }

  return { provider };
}

export default function Ownership({ loaderData }: Route.ComponentProps) {
  const { provider } = loaderData;
  const graph = ownershipData[provider.key] ?? defaultGraph;

  return (
    <section>
      <div className="flex items-start justify-between">
        <div className="flex">
          <ProviderImage
            size={160}
            provider={provider}
            className={cn("shadow-vidik h-[120px] min-w-[120px] rounded-lg")}
          />
          <div className="ml-3 flex flex-col justify-between md:ml-4">
            <div className="flex flex-wrap gap-2">
              <a
                href={provider.url}
                target="_blank"
                className="bg-surface-light/70 shadow-vidik hover:bg-surface-light text-surface-light-text flex items-center justify-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold"
              >
                <Globe className="size-3" />
                {removeUrlProtocol(provider.url)}
              </a>
              <div
                className={cn(
                  "bg-surface-light/70 hover:bg-surface-light text-surface-light-text shadow-vidik flex items-center justify-center gap-1 rounded-md px-2 py-1 text-xs font-semibold",
                  biasKeyToColor(provider.biasRating ?? ""),
                )}
              >
                <BiasInfoTooltip iconClassName="size-3" />
                {biasKeyToLabel(provider.biasRating ?? "")}
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-[35px] leading-none font-bold">
                {provider.name}
              </h1>
              <p className="text-primary/50 text-[15px] font-light sm:text-[20px]">
                {ownershipData[provider.key].nodes[0].data.description?.[0] ??
                  "Podatki o lastništvu niso na voljo."}
              </p>
            </div>
          </div>
        </div>
        <ShareButtons />
      </div>
      <div className="mt-8 h-[600px] w-full">
        <div className="shadow-vidik h-[500px] w-full rounded-lg border">
          <ReactFlow
            nodes={graph.nodes}
            edges={graph.edges}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background />
          </ReactFlow>
        </div>
      </div>
    </section>
  );
}
