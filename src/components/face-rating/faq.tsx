"use client";

import { content } from "./data";
import { LandingFaqSection } from "./landing-faq-section";

export default function FaceRatingFaq() {
  const { faq } = content;
  return <LandingFaqSection title={faq.title} items={faq.items} />;
}
