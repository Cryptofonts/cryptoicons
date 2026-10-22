import {
  lazy,
  Suspense,
  type ComponentType,
  type LazyExoticComponent,
  type ReactNode,
  type SVGProps,
} from 'react';
import { iconLoaders } from '../generated/registry';
import type { IconProps } from '../generated/IconBtc';

export type CryptoIconProps = Omit<SVGProps<SVGSVGElement>, 'name'> & {
  name: string;
  size?: number;
  fallback?: ReactNode;
};

const lazyIcons = new Map<string, LazyExoticComponent<ComponentType<IconProps>>>();

function getLazyIcon(name: string) {
  const key = name.trim().toLowerCase();
  const loader = iconLoaders[key];
  if (!loader) return undefined;

  let icon = lazyIcons.get(key);
  if (!icon) {
    icon = lazy(loader);
    lazyIcons.set(key, icon);
  }
  return icon;
}

export function CryptoIcon({
  name,
  size = 24,
  fallback = null,
  ...props
}: CryptoIconProps) {
  const Icon = getLazyIcon(name);
  if (!Icon) return fallback;

  return (
    <Suspense fallback={fallback}>
      <Icon size={size} {...props} />
    </Suspense>
  );
}
