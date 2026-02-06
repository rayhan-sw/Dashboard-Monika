"use client";

import Image from "next/image";
import Link from "next/link";
import { Icon } from "@iconify/react";

export default function SimpleHeader() {
  return (
    <header className="h-20 bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="h-full px-6 flex items-center justify-between max-w-[1920px] mx-auto">
        {/* Left: Back Button - Navigate to Home */}
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2.5 text-bpk-orange border-2 border-bpk-orange hover:bg-bpk-orange hover:text-white rounded-lg-bpk transition-all duration-200 group"
        >
          <Icon
            icon="mdi:chevron-left"
            className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform"
          />
          <span className="font-medium text-sm">Kembali</span>
        </Link>

        {/* Center: Logo */}
        <div className="flex items-center">
          <Image
            src="/images/logo-mosearch.svg"
            alt="MO-SEARCH"
            width={200}
            height={48}
            className="h-12 w-auto"
          />
        </div>

        {/* Right: Empty space for balance */}
        <div className="w-32"></div>
      </div>
    </header>
  );
}
