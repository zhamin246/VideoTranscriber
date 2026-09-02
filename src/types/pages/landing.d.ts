import { Header } from "@/types/blocks/header";
import { Hero } from "@/types/blocks/hero";
import { Section } from "@/types/blocks/section";
import { Footer } from "@/types/blocks/footer";
import { Pricing } from "@/types/blocks/pricing";

export interface LandingPage {
  title?: string;
  description?: string;
  header?: Header;
  hero?: Hero;
  trust_bar?: Section;
  branding?: Section;
  introduce?: Section;
  benefit?: Section;
  usage?: Section;
  feature?: Section;
  feature_grid?: Section;
  feature_highlights?: Section;
  use_cases?: Section;
  scenarios?: Section;
  stats?: Section;
  pricing?: Pricing;
  testimonial?: Section;
  memory_cards?: Section;
  faq?: Section;
  related_tools?: Section;
  cta?: Section;
  footer?: Footer;
}

export interface PricingPage {
  title?: string;
  description?: string;
  pricing?: Pricing;
}

export interface FeaturesPage {
  title?: string;
  description?: string;
  howToUse?: Section;
  featureHighlights?: Section;
  useCases?: Section;
  feature?: Section;
  faq?: Section;
  imagePathPrefix?: string;
}
