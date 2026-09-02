import { Button, Brand } from "@/types/blocks/base";

export interface NavItem {
  title: string;
  url: string;
  icon?: string;
  description?: string;
  target?: string;
  style?: string;
  disabled?: boolean;
  disabledText?: string;
  children?: NavItem[];
  models?: {
    title: string;
    items: { name: string; hot?: boolean }[];
  };
}

export interface Nav {
  name?: string;
  title?: string;
  icon?: string;
  image?: any;
  className?: string;
  items?: NavItem[];
}

export interface Header {
  disabled?: boolean;
  name?: string;
  brand?: Brand;
  nav?: Nav;
  buttons?: Button[];
  className?: string;
  show_sign?: boolean;
  show_locale?: boolean;
  show_theme?: boolean;
}
