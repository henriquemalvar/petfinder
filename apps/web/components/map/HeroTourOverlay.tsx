"use client";

import { createPortal } from "react-dom";
import type { ApiPost } from "@/lib/types";
import { POST_TYPE_LABEL, timeAgo } from "@/lib/utils";
import { PIN_CONFIG } from "@/lib/map-config";

interface HeroTourOverlayProps {
  activePost: ApiPost | null;
  tooltipPos: { x: number; y: number } | null;
  showCursor: boolean;
  cursorElRef: React.RefObject<HTMLDivElement | null>;
}

const OVERLAY_ID = "hero-tour-overlays";

export function HeroTourOverlay({
  activePost,
  tooltipPos,
  showCursor,
  cursorElRef,
}: HeroTourOverlayProps) {
  if (typeof document === "undefined") return null;

  const container = document.getElementById(OVERLAY_ID);
  if (!container) return null;

  const defaultImage =
    "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=240&fit=crop";

  return createPortal(
    <>
      {showCursor && (
        <div
          ref={cursorElRef}
          className="hero-map-cursor pointer-events-none absolute left-0 top-0"
          aria-hidden
        >
          <div className="hero-map-cursor__icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path
                d="M6 4L6 22L11 17L15 24L18 22L14 15L21 14L6 4Z"
                fill="white"
                stroke="#1a1c1e"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      )}
      {activePost && tooltipPos && (
        <div
          className="hero-tour-tooltip pointer-events-none absolute"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <div className="hero-tour-tooltip__content">
            <div
              className="hero-tour-tooltip__image"
              style={{
                backgroundImage: `url(${activePost.pet.image || defaultImage})`,
              }}
            />
            <div className="hero-tour-tooltip__body">
              <span
                className="hero-tour-tooltip__badge"
                style={{
                  backgroundColor: `${PIN_CONFIG[activePost.type].color}22`,
                  color: PIN_CONFIG[activePost.type].color,
                }}
              >
                {POST_TYPE_LABEL[activePost.type]}
              </span>
              <p className="hero-tour-tooltip__name">{activePost.pet.name}</p>
              <p className="hero-tour-tooltip__meta">
                {activePost.pet.breed} · {activePost.pet.age}
              </p>
              {activePost.pet.location && (
                <p className="hero-tour-tooltip__location">{activePost.pet.location}</p>
              )}
              <p className="hero-tour-tooltip__time">{timeAgo(activePost.createdAt)}</p>
            </div>
          </div>
        </div>
      )}
    </>,
    container,
  );
}

export { OVERLAY_ID };
