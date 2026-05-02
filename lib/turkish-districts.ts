import raw from "./data/turkey-districts.json";

type TurkeyDistrictsMap = Record<string, string[]>;

const BY_PROVINCE = raw as TurkeyDistrictsMap;

export function getDistrictsForProvince(cityName: string): string[] {
  const list = BY_PROVINCE[cityName];
  return list ? [...list] : [];
}

export function hasDistrictData(cityName: string): boolean {
  return (BY_PROVINCE[cityName]?.length ?? 0) > 0;
}
