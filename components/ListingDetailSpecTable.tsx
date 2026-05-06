import {
  getOtomobilBrandModelFromCategoryKey,
  isTasitlarListingCategoryKey,
  tryExtractYearFromListingTitle
} from "@/lib/listing-detail-spec";
import { formatKmForDisplay } from "@/lib/vehicle-fields";

type Props = {
  city: string;
  district?: string | null;
  listingCode?: string;
  categoryKey: string;
  title: string;
  /** DB’den; yoksa başlıktan yıl tahmini (yedek) */
  modelYear?: number;
  vehicleKm?: number;
};

export default function ListingDetailSpecTable({
  city,
  district,
  listingCode,
  categoryKey,
  title,
  modelYear,
  vehicleKm
}: Props) {
  const districtTrim = district?.trim() ?? "";
  const konum =
    districtTrim.length > 0 ? `${city} / ${districtTrim}` : city;

  const vasita = isTasitlarListingCategoryKey(categoryKey);
  const otomobil = vasita
    ? getOtomobilBrandModelFromCategoryKey(categoryKey)
    : null;
  const yearGuess = vasita ? tryExtractYearFromListingTitle(title) : null;

  const marka = otomobil?.brand ?? "—";
  const model = otomobil?.model ?? "—";
  const yilFromDb =
    modelYear != null && Number.isFinite(modelYear)
      ? String(Math.round(modelYear))
      : null;
  const yil = yilFromDb ?? yearGuess ?? "—";

  const kmDisplay =
    vehicleKm != null &&
    Number.isFinite(vehicleKm) &&
    vehicleKm >= 0
      ? formatKmForDisplay(Math.round(vehicleKm))
      : "—";

  const rows: { label: string; value: string }[] = [
    { label: "Konum", value: konum },
    { label: "İlan no", value: listingCode?.trim() || "—" },
    ...(vasita
      ? [
          { label: "Marka", value: marka },
          { label: "Model", value: model },
          { label: "Yıl", value: yil },
          { label: "Kilometre", value: kmDisplay }
        ]
      : [])
  ];

  return (
    <dl className="listing-detail-spec">
      {rows.map((row) => (
        <div key={row.label} className="listing-detail-spec__row">
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
