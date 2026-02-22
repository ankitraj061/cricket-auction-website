"use client";
import {
  useScroll,
  useTransform,
  motion,
} from "motion/react";
import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface TimelineEntry {
  title: string;
  content: React.ReactNode;
}

export const Timeline = ({ data }: { data: TimelineEntry[] }) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setHeight(rect.height);
    }
  }, [ref]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div
      className="theme-page-bg relative w-full font-sans md:px-10 overflow-hidden"
      ref={containerRef}
    >
      <div className={cn("absolute inset-0 theme-grid-overlay")} />

      <div className="relative max-w-7xl mx-auto py-20 px-4 md:px-8 lg:px-10 z-10">
        <h2 className="text-lg md:text-4xl mb-4 text-foreground max-w-4xl">
          Tournament Timeline
        </h2>
        <p className="text-muted-foreground text-sm md:text-base max-w-sm">
          The timeline below outlines the key events and milestones that will
          occur during the tournament.
        </p>
      </div>

      <div ref={ref} className="relative max-w-7xl mx-auto pb-20 z-20">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex justify-start pt-10 md:pt-40 md:gap-10"
          >
            <div className="sticky flex flex-col md:flex-row z-40 items-center top-40 self-start max-w-xs lg:max-w-sm md:w-full">
              <div className="h-10 absolute left-3 md:left-3 w-10 rounded-full bg-card flex items-center justify-center border border-border">
                <div className="h-4 w-4 rounded-full bg-muted border border-border p-2" />
              </div>
              <h3 className="hidden md:block text-xl md:pl-20 md:text-5xl font-bold text-muted-foreground">
                {item.title}
              </h3>
            </div>

            <div className="relative pl-20 pr-4 md:pl-4 w-full max-w-4xl">
              <h3 className="md:hidden block text-3xl mb-6 font-bold text-foreground">
                {item.title}
              </h3>
              <div className="theme-card backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-border hover:-translate-x-2 transition-all duration-500 group-hover:shadow-3xl">
                {item.content}
              </div>
            </div>
          </div>
        ))}
        <div
          style={{
            height: height + "px",
          }}
          className="absolute md:left-8 left-8 top-0 overflow-hidden w-[2px] bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-[0%] via-border to-transparent to-[99%] [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]"
        >
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
            className="absolute inset-x-0 top-0  w-[2px] bg-primary rounded-full"
          />
        </div>
      </div>
    </div>
  );
};
