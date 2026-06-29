"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import { useTheme } from "next-themes";
import type { ApiPost } from "@/lib/types";
import { POST_TYPE_LABEL, timeAgo } from "@/lib/utils";
import {
  createPinHtml,
  DEFAULT_MAP_CENTER,
  getHeroCardOcclusionWidth,
  computeHeroTourTooltipPosition,
  MAP_TILES,
  PIN_CONFIG,
} from "@/lib/map-config";
import { HeroMapTour } from "./HeroMapTour";
import { HeroTourOverlay } from "./HeroTourOverlay";
import "leaflet/dist/leaflet.css";

function createPinIcon(type: ApiPost["type"], selected: boolean) {
  return L.divIcon({
    html: createPinHtml(type, selected),
    className: "pet-map-marker-wrap",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -22],
  });
}

function ThemeTileLayer() {
  const { resolvedTheme } = useTheme();
  const tiles = resolvedTheme === "dark" ? MAP_TILES.dark : MAP_TILES.light;

  return (
    <TileLayer
      key={tiles.url}
      attribution={tiles.attribution}
      url={tiles.url}
    />
  );
}

function FitBounds({
  posts,
  variant = "default",
}: {
  posts: ApiPost[];
  variant?: "default" | "hero";
}) {
  const map = useMap();
  const points = useMemo(
    () => posts.filter((p) => p.pet.latitude != null && p.pet.longitude != null),
    [posts],
  );

  useEffect(() => {
    if (points.length === 0) return;

    const applyBounds = () => {
      if (points.length > 1) {
        const bounds = L.latLngBounds(
          points.map((p) => [p.pet.latitude!, p.pet.longitude!] as [number, number]),
        );

        if (variant === "hero") {
          const size = map.getSize();
          const leftPad = getHeroCardOcclusionWidth(size.x);
          map.fitBounds(bounds, {
            paddingTopLeft: L.point(leftPad, 72),
            paddingBottomRight: L.point(56, 72),
            maxZoom: 12,
            animate: false,
          });
          return;
        }

        map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
        return;
      }

      const [lat, lng] = [points[0].pet.latitude!, points[0].pet.longitude!];

      if (variant === "hero") {
        map.setView([lat, lng], 11, { animate: false });
        const leftPad = getHeroCardOcclusionWidth(map.getSize().x);
        map.panBy(L.point(Math.round(leftPad * 0.35), 0), { animate: false });
        return;
      }

      map.setView([lat, lng], 13);
    };

    map.whenReady(applyBounds);

    if (variant === "hero") {
      let resizeTimer: ReturnType<typeof setTimeout> | undefined;
      const onResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(applyBounds, 200);
      };
      map.on("resize", onResize);
      return () => {
        clearTimeout(resizeTimer);
        map.off("resize", onResize);
      };
    }
  }, [map, points, variant]);

  return null;
}

function FlyToSelected({
  post,
  zoom = 15,
}: {
  post: ApiPost | null;
  zoom?: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (post?.pet.latitude != null && post?.pet.longitude != null) {
      map.flyTo([post.pet.latitude, post.pet.longitude], zoom, { duration: 0.7 });
    }
  }, [map, post, zoom]);

  return null;
}

function OpenSelectedPopup({
  selectedPostId,
  markerRefs,
}: {
  selectedPostId: string | null;
  markerRefs: React.MutableRefObject<Record<string, L.Marker>>;
}) {
  useEffect(() => {
    if (!selectedPostId) return;
    const marker = markerRefs.current[selectedPostId];
    marker?.openPopup();
  }, [selectedPostId, markerRefs]);

  return null;
}

interface MapClientProps {
  posts: ApiPost[];
  className?: string;
  interactive?: boolean;
  variant?: "default" | "hero";
  selectedPostId?: string | null;
  onSelectPost?: (post: ApiPost | null) => void;
  showLegend?: boolean;
}

export default function MapClient({
  posts,
  className,
  interactive = true,
  variant = "default",
  selectedPostId = null,
  onSelectPost,
}: MapClientProps) {
  const markerRefs = useRef<Record<string, L.Marker>>({});
  const cursorElRef = useRef<HTMLDivElement>(null);
  const mapSizeRef = useRef({ width: 0, height: 0 });
  const [tourPost, setTourPost] = useState<ApiPost | null>(null);
  const [tourAnchor, setTourAnchor] = useState<{ x: number; y: number } | null>(null);
  const [tourMapSize, setTourMapSize] = useState({ width: 0, height: 0 });
  const [showTourCursor, setShowTourCursor] = useState(false);
  const withCoords = posts.filter((p) => p.pet.latitude != null && p.pet.longitude != null);
  const heroTour = variant === "hero" && !interactive && withCoords.length > 0;
  const effectiveSelectedId = heroTour ? tourPost?.id ?? null : selectedPostId;
  const selectedPost = withCoords.find((p) => p.id === effectiveSelectedId) ?? null;

  const center: [number, number] = withCoords.length > 0
    ? [withCoords[0].pet.latitude!, withCoords[0].pet.longitude!]
    : DEFAULT_MAP_CENTER;

  const defaultImage =
    "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=240&fit=crop";

  const tourTooltipPos =
    tourAnchor && tourMapSize.width > 0
      ? computeHeroTourTooltipPosition(
          tourAnchor.x,
          tourAnchor.y,
          tourMapSize.width,
          tourMapSize.height,
        )
      : null;

  const handleTourActive = useCallback((
    post: ApiPost | null,
    anchor: { x: number; y: number } | null,
  ) => {
    setTourPost(post);
    setTourAnchor(anchor);
    setTourMapSize({ ...mapSizeRef.current });
  }, []);

  return (
    <div
      className={`relative h-full w-full ${variant === "hero" ? "map-hero-tiles" : ""}`}
    >
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        className={className ?? "rounded-2xl z-0"}
        scrollWheelZoom={interactive}
        dragging={interactive}
        zoomControl={interactive}
      >
        <ThemeTileLayer />
        {withCoords.length > 0 && <FitBounds posts={withCoords} variant={variant} />}
        {heroTour && (
          <HeroMapTour
            posts={withCoords}
            cursorElRef={cursorElRef}
            mapSizeRef={mapSizeRef}
            onCursorVisible={setShowTourCursor}
            onActivePost={handleTourActive}
          />
        )}
        {selectedPost && interactive && (
          <>
            <FlyToSelected post={selectedPost} />
            <OpenSelectedPopup selectedPostId={selectedPostId} markerRefs={markerRefs} />
          </>
        )}
        {withCoords.map((post) => {
          const isSelected = post.id === effectiveSelectedId;
          const pinColor = PIN_CONFIG[post.type].color;

          return (
            <Marker
              key={post.id}
              position={[post.pet.latitude!, post.pet.longitude!]}
              icon={createPinIcon(post.type, isSelected)}
              ref={(ref: L.Marker | null) => {
                if (ref) markerRefs.current[post.id] = ref;
              }}
              eventHandlers={{
                click: () => onSelectPost?.(post),
              }}
            >
              {!heroTour && (
                <Popup
                  className="pet-map-popup"
                  closeButton={interactive}
                  autoPan={interactive}
                  closeOnClick={interactive}
                >
                  <div className="pet-map-popup__content">
                    <div
                      className="pet-map-popup__image"
                      style={{
                        backgroundImage: `url(${post.pet.image || defaultImage})`,
                      }}
                    />
                    <div className="pet-map-popup__body">
                      <span
                        className="pet-map-popup__badge"
                        style={{ backgroundColor: `${pinColor}22`, color: pinColor }}
                      >
                        {POST_TYPE_LABEL[post.type]}
                      </span>
                      <p className="pet-map-popup__name">{post.pet.name}</p>
                      <p className="pet-map-popup__meta">
                        {post.pet.breed} · {post.pet.age}
                      </p>
                      {post.pet.location && (
                        <p className="pet-map-popup__location">{post.pet.location}</p>
                      )}
                      <p className="pet-map-popup__time">{timeAgo(post.createdAt)}</p>
                      {interactive && (
                        <Link href={`/pets/${post.id}`} className="pet-map-popup__link">
                          Ver detalhes →
                        </Link>
                      )}
                    </div>
                  </div>
                </Popup>
              )}
            </Marker>
          );
        })}
      </MapContainer>
      {heroTour && (
        <HeroTourOverlay
          activePost={tourPost}
          tooltipPos={tourTooltipPos}
          showCursor={showTourCursor}
          cursorElRef={cursorElRef}
        />
      )}
      {variant === "hero" && <div className="map-hero-vignette pointer-events-none" />}
      {withCoords.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-[500] flex items-center justify-center bg-background/40">
          <p className="rounded-xl bg-card/90 px-4 py-2 text-sm text-muted-foreground shadow-sm">
            Nenhum alerta com localização no mapa
          </p>
        </div>
      )}
    </div>
  );
}
