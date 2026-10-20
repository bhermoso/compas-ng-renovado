import { LOGO_REGISTRY, type LogoEntry } from "../../domain/branding/logoRegistry";

interface Props {
  ids: string[];
  /** "cover": caja de logos de portada (tamaño grande). */
  variant?: "default" | "cover";
}

export function InstitutionalLogoBand({ ids, variant = "default" }: Props) {
  const registry = new Map(LOGO_REGISTRY.map((e) => [e.id, e]));

  const entries = ids
    .map((id) => registry.get(id))
    .filter((e): e is LogoEntry => e !== undefined);

  if (entries.length === 0) return null;

  return (
    <div className={variant === "cover" ? "ilogo-band ilogo-band--cover" : "ilogo-band"}>
      {entries.map((logo) =>
        logo.authorization === "CONFIRMADA" ? (
          <img
            key={logo.id}
            src={`${import.meta.env.BASE_URL}branding/${logo.file}`}
            alt={logo.label}
            className={`ilogo-band__img ilogo-band__img--${logo.id}`}
          />
        ) : (
          <span key={logo.id} className="ilogo-band__label">
            {logo.label}
          </span>
        )
      )}
    </div>
  );
}
