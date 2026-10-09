import Image from "next/image";
import type { CSSProperties } from "react";
import { BrandMark } from "@/components/brand";
import type { PartnerItem } from "@/content/partners";
import { HEX_HEIGHT, sideCluster, splitForDesktop, stackedCluster, type Cluster } from "@/lib/honeycomb";

/*
 * "Our Partners": the firm's mark in a large navy hexagon, with the partner
 * logos in white hexagons around it. Every length is a multiple of --hex
 * (one hexagon's width), so the figure scales as a whole per breakpoint.
 *
 * Desktop: half the logos either side of the mark, mirrored; an odd one out
 * sits under the mark. Below lg: the mark, then one honeycomb of all logos.
 */

const HEX_CLIP = "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)";
const unit = (value: number) => `calc(var(--hex) * ${value.toFixed(4)})`;

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((word) => /^[\p{L}\p{N}]/u.test(word))
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("");
}

function PartnerHex({ partner, style }: { partner: PartnerItem; style?: CSSProperties }) {
  const body = (
    <>
      {/* A border cannot follow a clip-path, so the outline is a hexagon of
          line colour with the white face inset 1.5px inside it. */}
      <span aria-hidden="true" className="absolute inset-0 bg-line-strong transition group-hover:bg-gold" style={{ clipPath: HEX_CLIP }} />
      <span className="absolute inset-[1.5px] flex items-center justify-center bg-white" style={{ clipPath: HEX_CLIP }}>
        {partner.logoUrl ? (
          <span className="relative block h-[56%] w-[66%]">
            <Image src={partner.logoUrl} alt={partner.name} fill unoptimized sizes="120px" className="object-contain" />
          </span>
        ) : (
          <span className="flex w-[70%] flex-col items-center text-center">
            <span aria-hidden="true" className="font-serif text-[calc(var(--hex)*0.22)] font-semibold leading-none text-gold-deep">
              {initials(partner.name)}
            </span>
            <span className="mt-1 line-clamp-2 text-[calc(var(--hex)*0.085)] font-semibold leading-tight text-ink-soft">{partner.name}</span>
          </span>
        )}
      </span>
    </>
  );

  const className = "group absolute block drop-shadow-[0_6px_10px_rgb(11_24_52/0.08)]";
  const size: CSSProperties = { width: unit(1), height: unit(HEX_HEIGHT), ...style };

  return partner.website ? (
    <a href={partner.website} target="_blank" rel="noopener noreferrer nofollow" className={className} style={size} title={partner.name}>
      {body}
    </a>
  ) : (
    <div className={className} style={size} title={partner.name}>
      {body}
    </div>
  );
}

function ClusterView({ cluster, partners }: { cluster: Cluster; partners: PartnerItem[] }) {
  if (partners.length === 0) return null;
  return (
    <div className="relative shrink-0" style={{ width: unit(cluster.width), height: unit(cluster.height) }}>
      {partners.map((partner, index) => (
        <PartnerHex
          key={partner.id}
          partner={partner}
          style={{ left: unit(cluster.slots[index]!.x), top: unit(cluster.slots[index]!.y) }}
        />
      ))}
    </div>
  );
}

function CentreHex({ size }: { size: number }) {
  return (
    <div
      className="relative shrink-0 drop-shadow-[0_14px_24px_rgb(11_24_52/0.28)]"
      style={{ width: unit(size), height: unit(size * HEX_HEIGHT) }}
    >
      <span aria-hidden="true" className="absolute inset-0 bg-gold" style={{ clipPath: HEX_CLIP }} />
      <span className="absolute inset-[3px] flex items-center justify-center bg-[linear-gradient(160deg,var(--color-ink-mid),var(--color-ink-deep))]" style={{ clipPath: HEX_CLIP }}>
        <BrandMark className="h-auto w-[52%]" />
      </span>
    </div>
  );
}

export function PartnersHoneycomb({ partners }: { partners: PartnerItem[] }) {
  const { left, right, below } = splitForDesktop(partners);
  const leftCluster = sideCluster(left.length, "left");
  const rightCluster = sideCluster(right.length, "right");
  const stacked = stackedCluster(partners.length);

  return (
    <>
      {/* Phones and tablets */}
      <div className="flex flex-col items-center gap-6 [--hex:5.25rem] sm:[--hex:6.5rem] lg:hidden">
        <CentreHex size={1.5} />
        <ClusterView cluster={stacked} partners={partners} />
      </div>

      {/* Desktop */}
      <div className="hidden items-center justify-center gap-[calc(var(--hex)*0.35)] [--hex:5.25rem] lg:flex xl:[--hex:6rem]">
        <ClusterView cluster={leftCluster} partners={left} />
        <div className="flex shrink-0 flex-col items-center gap-[calc(var(--hex)*0.25)]">
          <CentreHex size={2} />
          {below && <ClusterView cluster={stackedCluster(1)} partners={[below]} />}
        </div>
        <ClusterView cluster={rightCluster} partners={right} />
      </div>
    </>
  );
}
