"use client";

import BaseBanner, { defaultSlides } from "./banners/BaseBanner";

export default function BannerHeader() {
  return <BaseBanner slides={defaultSlides} />;
}
