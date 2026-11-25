"use client";

import { useCallback, useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import type { ApiPost } from "@/lib/types";
import { getHeroCardOcclusionWidth, isPostVisibleOnHeroMap } from "@/lib/map-config";

interface HeroMapTourProps {
  posts: ApiPost[];
  cursorElRef: React.RefObject<HTMLDivElement | null>;
  mapSizeRef: React.RefObject<{ width: number; height: number }>;
  onCursorVisible: (visible: boolean) => void;
  onActivePost: (
    post: ApiPost | null,
    anchor: { x: number; y: number } | null,
  ) => void;
}

const MOVE_MS = 2400;
const HOLD_MS = 3600;

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function getVisiblePosts(
  map: L.Map,
  posts: ApiPost[],
  mapSizeRef: React.RefObject<{ width: number; height: number }>,
) {
  const size = map.getSize();
  mapSizeRef.current = { width: size.x, height: size.y };
  const toPoint = (coords: [number, number]) => map.latLngToContainerPoint(coords);

  return posts
    .filter(
      (post) =>
        post.pet.latitude != null &&
        post.pet.longitude != null &&
        isPostVisibleOnHeroMap(
          post.pet.latitude,
          post.pet.longitude,
          size.x,
          size.y,
          toPoint,
        ),
    )
    .slice(0, 5);
}

function setCursorPoint(
  el: HTMLDivElement | null,
  point: { x: number; y: number },
) {
  if (!el) return;
  el.style.transform = `translate3d(${Math.round(point.x)}px, ${Math.round(point.y)}px, 0)`;
}

function pulseCursor(el: HTMLDivElement | null) {
  if (!el) return;
  const icon = el.querySelector(".hero-map-cursor__icon");
  if (!icon) return;
  icon.classList.remove("hero-map-cursor--click");
  void (icon as HTMLElement).offsetWidth;
  icon.classList.add("hero-map-cursor--click");
}

export function HeroMapTour({
  posts,
  cursorElRef,
  mapSizeRef,
  onCursorVisible,
  onActivePost,
}: HeroMapTourProps) {
  const map = useMap();
  const indexRef = useRef(0);
  const cursorPointRef = useRef<{ x: number; y: number } | null>(null);
  const runningRef = useRef(true);
  const animatingRef = useRef(false);
  const visiblePostsRef = useRef<ApiPost[]>([]);
  const postsRef = useRef(posts);
  postsRef.current = posts;
  const postIds = posts.map((p) => p.id).join(",");

  const syncMapSize = useCallback(() => {
    const size = map.getSize();
    mapSizeRef.current = { width: size.x, height: size.y };
  }, [map, mapSizeRef]);

  useEffect(() => {
    if (postIds.length === 0) return;

    runningRef.current = true;
    let cancelled = false;
    let rafId = 0;
    let launched = false;
    const timers = new Set<ReturnType<typeof setTimeout>>();

    // Agenda um timer rastreado. O cleanup cancela todos de uma vez e cada
    // callback só roda se o efeito ainda estiver ativo. Sem isso, timers
    // sobrepostos (whenReady + moveend gravavam no mesmo handle) vazavam e
    // chamavam latLngToContainerPoint num mapa já destruído (_mapPane
    // undefined), estourando "_leaflet_pos".
    const schedule = (fn: () => void, ms: number) => {
      const id = setTimeout(() => {
        timers.delete(id);
        if (cancelled) return;
        fn();
      }, ms);
      timers.add(id);
      return id;
    };

    const pointForPost = (post: ApiPost) => {
      const point = map.latLngToContainerPoint([post.pet.latitude!, post.pet.longitude!]);
      return { x: point.x, y: point.y };
    };

    const animateCursor = (
      from: { x: number; y: number },
      to: { x: number; y: number },
      onDone: () => void,
    ) => {
      animatingRef.current = true;
      onActivePost(null, null);
      const start = performance.now();

      const tick = (now: number) => {
        if (!runningRef.current) return;
        const t = Math.min((now - start) / MOVE_MS, 1);
        const eased = easeInOutCubic(t);
        const point = {
          x: from.x + (to.x - from.x) * eased,
          y: from.y + (to.y - from.y) * eased,
        };
        cursorPointRef.current = point;
        setCursorPoint(cursorElRef.current, point);

        if (t < 1) {
          rafId = requestAnimationFrame(tick);
        } else {
          animatingRef.current = false;
          onDone();
        }
      };

      rafId = requestAnimationFrame(tick);
    };

    const runStep = () => {
      if (!runningRef.current) return;

      const tourPosts = visiblePostsRef.current;
      const post = tourPosts[indexRef.current];
      if (!post) return;

      const target = pointForPost(post);
      const size = map.getSize();
      const minX = getHeroCardOcclusionWidth(size.x) + 48;
      const from = cursorPointRef.current ?? {
        x: Math.max(minX, target.x - 90),
        y: Math.min(map.getSize().y - 80, target.y + 60),
      };

      animateCursor(from, target, () => {
        if (!runningRef.current) return;

        syncMapSize();
        pulseCursor(cursorElRef.current);
        onActivePost(post, target);

        schedule(() => {
          indexRef.current = (indexRef.current + 1) % tourPosts.length;
          runStep();
        }, HOLD_MS);
      });
    };

    const beginTour = () => {
      if (launched || !runningRef.current) return;

      syncMapSize();
      const visible = getVisiblePosts(map, postsRef.current, mapSizeRef);
      if (visible.length === 0) {
        visiblePostsRef.current = postsRef.current
          .filter((post) => post.pet.latitude != null && post.pet.longitude != null)
          .slice(0, 5);
      } else {
        visiblePostsRef.current = visible;
      }
      if (visiblePostsRef.current.length === 0) return;

      launched = true;
      indexRef.current = 0;
      const tourPosts = visiblePostsRef.current;

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reducedMotion) {
        onCursorVisible(false);
        onActivePost(tourPosts[0], pointForPost(tourPosts[0]));
        return;
      }

      const size = map.getSize();
      const start = {
        x: getHeroCardOcclusionWidth(size.x) + 80,
        y: size.y * 0.72,
      };
      cursorPointRef.current = start;
      onCursorVisible(true);
      requestAnimationFrame(() => {
        setCursorPoint(cursorElRef.current, start);
        runStep();
      });
    };

    const tryStartTour = () => {
      syncMapSize();
      const visible = getVisiblePosts(map, postsRef.current, mapSizeRef);
      visiblePostsRef.current =
        visible.length > 0
          ? visible
          : postsRef.current
              .filter((post) => post.pet.latitude != null && post.pet.longitude != null)
              .slice(0, 5);
      if (visiblePostsRef.current.length === 0) return;
      schedule(beginTour, 500);
    };

    const waitForMapReady = (attempt = 0) => {
      if (attempt >= 25) {
        tryStartTour();
        return;
      }
      schedule(() => {
        if (map.getSize().x > 0) {
          tryStartTour();
          return;
        }
        waitForMapReady(attempt + 1);
      }, 200);
    };

    const handleResize = () => {
      syncMapSize();
      if (!launched || animatingRef.current) return;
      const post = visiblePostsRef.current[indexRef.current];
      if (!post || !cursorPointRef.current) return;
      const point = pointForPost(post);
      cursorPointRef.current = point;
      setCursorPoint(cursorElRef.current, point);
      onActivePost(post, point);
    };

    map.whenReady(() => {
      if (cancelled) return;
      map.once("moveend", () => {
        if (cancelled) return;
        schedule(tryStartTour, 400);
      });
      schedule(waitForMapReady, 2200);
    });
    map.on("resize", handleResize);

    return () => {
      cancelled = true;
      runningRef.current = false;
      launched = false;
      animatingRef.current = false;
      timers.forEach(clearTimeout);
      timers.clear();
      cancelAnimationFrame(rafId);
      map.off("resize", handleResize);
      onCursorVisible(false);
      onActivePost(null, null);
    };
  }, [map, postIds, cursorElRef, mapSizeRef, onCursorVisible, onActivePost, syncMapSize]);

  return null;
}
