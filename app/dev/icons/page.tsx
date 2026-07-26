"use client";

import React, { useState } from "react";
import { ThemeToggle } from "@/app/components/theme-toggle";
import {
  PrismMarkIcon,
  DashboardIcon,
  MasteryMapIcon,
  TextbookChatIcon,
  StudyRoomsIcon,
  FlashcardsIcon,
  QuizIcon,
  FlameIcon,
  SettingsIcon,
  NotificationIcon,
  UploadIcon,
  MasteryPercentageIcon,
  TeacherIcon,
  AchievementIcon,
  ExportIcon,
  SearchIcon,
} from "@/components/icons";

const iconsList = [
  { name: "PrismMarkIcon", component: PrismMarkIcon },
  { name: "DashboardIcon", component: DashboardIcon },
  { name: "MasteryMapIcon", component: MasteryMapIcon },
  { name: "TextbookChatIcon", component: TextbookChatIcon },
  { name: "StudyRoomsIcon", component: StudyRoomsIcon },
  { name: "FlashcardsIcon", component: FlashcardsIcon },
  { name: "QuizIcon", component: QuizIcon },
  { name: "FlameIcon", component: FlameIcon },
  { name: "SettingsIcon", component: SettingsIcon },
  { name: "NotificationIcon", component: NotificationIcon },
  { name: "UploadIcon", component: UploadIcon },
  { name: "MasteryPercentageIcon", component: MasteryPercentageIcon },
  { name: "TeacherIcon", component: TeacherIcon },
  { name: "AchievementIcon", component: AchievementIcon },
  { name: "ExportIcon", component: ExportIcon },
  { name: "SearchIcon", component: SearchIcon },
];

export default function IconPreviewPage() {
  const [active, setActive] = useState(false);
  const [size, setSize] = useState(24);
  const [color, setColor] = useState("prism-text");

  return (
    <div className="min-h-screen bg-prism-base text-prism-text p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex justify-between items-end border-b border-prism-border pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Prism Icon System</h1>
            <p className="text-prism-muted mt-2 text-sm max-w-xl">
              1.5px stroke weight, round linecaps, geometric vectors tailored for EduMethod AI. Use these to replace generic utility icons where semantic meaning is required.
            </p>
          </div>
          <ThemeToggle />
        </header>

        <section className="flex flex-wrap items-center gap-6 p-6 bg-prism-surface border border-prism-border rounded-2xl shadow-sm backdrop-blur-md">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-prism-muted uppercase tracking-wider">State</span>
            <button
              onClick={() => setActive(!active)}
              className="px-4 py-2 bg-prism-surface border border-prism-border rounded-xl text-sm font-semibold active:scale-95 transition hover:bg-prism-surface/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-prism-accent"
            >
              {active ? "Active (Filled)" : "Default (Outline)"}
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-prism-muted uppercase tracking-wider">Size</span>
            <div className="flex items-center gap-2">
              {[16, 24, 32, 48].map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl border text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-prism-accent ${
                    size === s
                      ? "border-prism-accent bg-prism-accent/10 text-prism-accent"
                      : "border-prism-border bg-prism-surface hover:bg-prism-surface/70"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-prism-muted uppercase tracking-wider">Color Context</span>
            <div className="flex items-center gap-2">
              {[
                { id: "prism-text", label: "Neutral" },
                { id: "prism-accent", label: "Accent" },
                { id: "red-500", label: "Destructive" },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setColor(c.id)}
                  className={`px-4 py-2 rounded-xl border text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-prism-accent ${
                    color === c.id
                      ? "border-prism-accent bg-prism-accent/10 text-prism-accent"
                      : "border-prism-border bg-prism-surface hover:bg-prism-surface/70"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {iconsList.map((icon) => {
            const IconComponent = icon.component;
            return (
              <div
                key={icon.name}
                className="flex flex-col items-center justify-center p-6 gap-4 bg-prism-surface border border-prism-border rounded-2xl hover:border-prism-accent/40 transition group"
              >
                <div className={`flex items-center justify-center h-16 w-16 text-${color}`}>
                  <IconComponent size={size} active={active} />
                </div>
                <span className="text-[10px] font-mono font-medium text-prism-muted text-center break-all px-2">
                  {icon.name}
                </span>
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}
