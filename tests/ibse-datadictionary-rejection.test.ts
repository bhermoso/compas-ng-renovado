import { describe, expect, it } from "vitest";
import { parseIBSECSV } from "../src/application/ibse/IBSECSVParser";
import { validateIBSESourceCSV } from "../src/application/ibse/validateIBSESourceCSV";

describe("protección de importaciones IBSE: diccionario vs respuestas", () => {
  it("rechaza DataDictionary REDCap aunque tenga 17 líneas", () => {
    const dictionary = [
      "field_name,form_name,section_header,field_type,field_label,choices",
      'record_id,monitor_ibse,,text,ID,',
      ...Array.from({length:16},(_,i)=>`ibse_item_${i},monitor_ibse,,radio,Ítem ${i},1 Sí`),
    ].join("\n");
    const parsed=parseIBSECSV(dictionary);
    expect(parsed.aggregates.n).toBe(17);
    expect(parsed.aggregates.nValid).toBe(0);
    expect(()=>validateIBSESourceCSV(dictionary,parsed.aggregates.nValid)).toThrow(/diccionario de variables REDCap/i);
  });

  it("rechaza una exportación con columnas correctas pero sin respuestas válidas",()=>{
    const csv="record_id,monitor_ibse_complete,ibse_total,ibse_factor_vinculo,ibse_factor_situacion,ibse_factor_control,ibse_factor_persona\n1,0,70,70,70,70,70";
    const result=parseIBSECSV(csv);
    expect(result.aggregates.nValid).toBe(0);
    expect(()=>validateIBSESourceCSV(csv,result.aggregates.nValid)).toThrow(/no contiene respuestas IBSE válidas/i);
  });

  it("admite registros REDCap con puntuaciones válidas sin exigir edad y sexo",()=>{
    const csv="record_id,monitor_ibse_complete,ibse_total,ibse_factor_vinculo,ibse_factor_situacion,ibse_factor_control,ibse_factor_persona\n1,2,70,70,70,70,70";
    const result=parseIBSECSV(csv);
    expect(result.aggregates.nValid).toBe(1);
    expect(()=>validateIBSESourceCSV(csv,result.aggregates.nValid)).not.toThrow();
  });
});