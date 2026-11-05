#!/usr/bin/env python3
"""Auditoría de solo lectura de los tres perfiles municipales en Firestore.
No imprime documentos, autores, textos, adjuntos ni identificadores de usuario.
"""
import hashlib
import json
import re
from google.cloud import firestore

PROJECT="compas-98dd7"
SCOPES=("alfacar","loja","zagra")

def fingerprint(id_):
    return hashlib.sha256(str(id_).encode("utf-8")).hexdigest()[:10]

def version_label(title):
    # No publicar títulos arbitrarios del expediente en logs públicos.
    m=re.search(r"\bv(?:ersi[oó]n)?[\s._-]*(\d+(?:[._-]\d+){0,2})\b",str(title or ""),re.I)
    return ("v"+m.group(1).replace("_",".").replace("-",".")) if m else "sin_etiqueta"

def summarize(scope,workspace,manifest):
    lib=workspace.get("externalProfileLibrary") or {}
    versions=lib.get("profiles") or []
    active=lib.get("activeId")
    ids={p.get("id") for p in versions if isinstance(p,dict)}
    results=[]
    for p in versions:
        if not isinstance(p,dict): continue
        par=p.get("revisionOf")
        results.append({
            "id_huella":fingerprint(p.get("id")),
            "version":version_label(p.get("title")),
            "fecha_creacion":str(p.get("createdAt") or "")[:10],
            "vigente":p.get("id")==active,
            "archivada":bool(p.get("archivedAt")),
            "estado":p.get("status"),
            "tiene_antecesora":bool(par),
            "antecesora_presente":not par or par in ids,
            "adjuntos":len(p.get("attachmentIds") or []),
            "puede_eliminarse_en_version_actual":True,
        })
    return {
        "municipio":scope,
        "revision_remota":str(manifest.get("workspaceUpdatedAt") or "")[:25],
        "versiones_externas":len(results),
        "versiones_archivadas":sum(v["archivada"] for v in results),
        "referencias_vigentes":sum(v["vigente"] for v in results),
        "vigente_valida":not active or active in ids,
        "perfiles_compas_legado":len(workspace.get("compiledProfiles") or []),
        "perfil_compilado_con_texto":bool((workspace.get("validatedPSL") or {}).get("conclusiones",{}).get("content")),
        "versiones":results,
    }

def read_scope(db,scope):
    base=db.collection("relas_scopes").document(scope)
    manifest=(base.collection("workspace").document("current").get())
    if not manifest.exists:
        return {"municipio":scope,"error":"sin_expediente_remoto"}
    m=manifest.to_dict()
    sid=m.get("snapshotId")
    chunkcount=m.get("chunkCount")
    if not isinstance(sid,str) or not isinstance(chunkcount,int) or not 0<chunkcount<=400:
        return {"municipio":scope,"error":"manifiesto_incompatible"}
    docs=base.collection("workspace_versions").document(sid).collection("chunks").stream()
    rows=sorted((x.to_dict() for x in docs),key=lambda x:x.get("index",-1))
    if len(rows)!=chunkcount or any(x.get("index")!=i or not isinstance(x.get("content"),str) for i,x in enumerate(rows)):
        return {"municipio":scope,"error":"fragmentos_incompletos"}
    workspace=json.loads("".join(x["content"] for x in rows))
    if workspace.get("municipality",{}).get("identity",{}).get("id")!=scope:
        return {"municipio":scope,"error":"ambito_incorrecto"}
    return summarize(scope,workspace,m)

def main():
    db=firestore.Client(project=PROJECT)
    res=[]
    for scope in SCOPES:
        try:res.append(read_scope(db,scope))
        except Exception as e:
            res.append({"municipio":scope,"error":"lectura_fallida","tipo":type(e).__name__})
    print("VERSION_AUDIT="+json.dumps({"tipo":"solo_metadatos","scopes":res},ensure_ascii=False,separators=(",",":")))
    if all(s.get("error") for s in res):raise SystemExit("No se pudo leer ninguno de los tres expedientes")

if __name__=="__main__":main()
