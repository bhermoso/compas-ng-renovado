import { LOGO_REGISTRY, type LogoEntry } from "../../domain/branding/logoRegistry";

interface Props {
  ids: string[];
  showPending?: boolean;
}

export function InstitutionalLogoBand({ ids, showPending = false }: Props) {
  const registry = new Map(LOGO_REGISTRY.map((e) => [e.id, e]));

  const logos = ids
    .map((id) => registry.get(id))
    .filter((e): e is LogoEntry => {
      if (!e) return false;
      if (e.authorization === "CONFIRMADA") return true;
      return showPending === true;
    });

  if (logos.length === 0) return null;

  return (
    <div className="ilogo-band">
      {logos.map((logo) => (
        <img
          key={logo.id}
          src={`${import.meta.env.BASE_URL}branding/${logo.file}`}
          alt={logo.label}
          className="ilogo-band__img"
        />
      ))}
    </div>
  );
}
