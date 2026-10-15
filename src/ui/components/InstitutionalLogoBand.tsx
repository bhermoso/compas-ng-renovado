import { LOGO_REGISTRY, type LogoEntry } from "../../domain/branding/logoRegistry";

interface Props {
  ids: string[];
}

export function InstitutionalLogoBand({ ids }: Props) {
  const registry = new Map(LOGO_REGISTRY.map((e) => [e.id, e]));

  const entries = ids
    .map((id) => registry.get(id))
    .filter((e): e is LogoEntry => e !== undefined);

  if (entries.length === 0) return null;

  return (
    <div className="ilogo-band">
      {entries.map((logo) =>
        logo.authorization === "CONFIRMADA" ? (
          <img
            key={logo.id}
            src={`${import.meta.env.BASE_URL}branding/${logo.file}`}
            alt={logo.label}
            className="ilogo-band__img"
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
