import iconManifest from './manifest.json';

export type IconMetadata = {
  symbol: string;
  name: string;
  file: string;
};

export const manifest = iconManifest as Record<string, IconMetadata>;

export function getIconUrlBySymbol(
  symbol: string,
  baseUrl = '/assets',
): string | undefined {
  const icon = manifest[symbol.trim().toLowerCase()];
  if (!icon) return undefined;

  return `${baseUrl.replace(/\/+$/, '')}/${encodeURIComponent(icon.file)}`;
}

export type ContractIconMap = Readonly<
  Record<number, Readonly<Record<string, string>>>
>;

export function getIconUrlByContract(
  address: string,
  chainId: number,
  contracts: ContractIconMap,
  baseUrl = '/assets',
): string | undefined {
  const symbol = contracts[chainId]?.[address.trim().toLowerCase()];
  return symbol ? getIconUrlBySymbol(symbol, baseUrl) : undefined;
}
