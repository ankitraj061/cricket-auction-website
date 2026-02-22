'use client';
import { Users, Shield, Gavel, ArrowRight, Sparkles } from "lucide-react";
import heroImage from "@/public/hero-cricket-auction.jpg";
import { uiTokens } from "@/lib/uiTokens";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroImage.src}
          alt="Cricket Auction Stadium"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-background/75" />
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-8 animate-fade-in">
          <Sparkles className="w-4 h-4 text-accent" />
          <span className="text-accent text-sm font-medium">
            Season 2025 Auction Live
          </span>
        </div>

        {/* Main Headline */}
        <h1
          className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-foreground mb-6 animate-fade-in-up leading-tight"
          style={{ animationDelay: "0.1s" }}
        >
          BUILD YOUR DREAM
          <br />
          <span className="text-shine">CRICKET TEAM</span>
        </h1>

        {/* Subheadline */}
        <p
          className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 animate-fade-in-up"
          style={{ animationDelay: "0.2s" }}
        >
          Bid live for the best players and create history on the auction table.
          Experience the thrill of building a championship-winning squad.
        </p>

        {/* CTA Buttons */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 animate-fade-in-up"
          style={{ animationDelay: "0.3s" }}
        >
          <button className={`${uiTokens.adminPrimaryButton} group flex items-center gap-3 rounded-xl px-5 py-3`}>
            <Users className="w-5 h-5" />
            View All Players
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <button className={`${uiTokens.adminSecondaryButton} flex items-center gap-3 rounded-xl px-5 py-3`}>
            <Shield className="w-5 h-5" />
            View All Teams
          </button>

          <button className={`${uiTokens.adminPrimaryButton} group flex items-center gap-3 rounded-xl px-5 py-3`}>
            <Gavel className="w-5 h-5" />
            Start Auction
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Live indicator */}
        <div
          className="mt-16 animate-fade-in-up"
          style={{ animationDelay: "0.5s" }}
        >
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-muted/50 backdrop-blur-sm border border-border">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
            </span>
            <span className="text-muted-foreground text-sm">
              <strong className="text-foreground">2,458</strong> managers online
              now
            </span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-8 h-12 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
          <div className="w-1.5 h-3 bg-accent rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
