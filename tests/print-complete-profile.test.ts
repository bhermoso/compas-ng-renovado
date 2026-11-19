import { afterEach, describe, expect, it, vi } from 'vitest';
import { printCompleteProfile, PRINT_FRAME_FALLBACK_MS } from '../src/ui/components/printCompleteProfile';

/** Documento mínimo: el entorno de pruebas no tiene DOM. */
function fakeDocument() {
  const attached = new Set<unknown>();
  const listeners: Record<string, (() => void)[]> = {};
  const win = {
    print: vi.fn(),
    focus: vi.fn(),
    addEventListener: (type: string, fn: () => void) => { (listeners[type] ??= []).push(fn); },
    dispatch: (type: string) => { const fns = listeners[type] ?? []; listeners[type] = []; fns.forEach(f => f()); },
  };
  let written = '';
  const frameDoc = { readyState: 'complete', open: vi.fn(), write: (html: string) => { written += html; }, close: vi.fn() };
  const frame = {
    title: '', style: { cssText: '' }, setAttribute: vi.fn(),
    contentDocument: frameDoc, contentWindow: win,
    addEventListener: vi.fn(),
    remove: () => { attached.delete(frame); },
  };
  const doc = {
    createElement: () => frame,
    body: { appendChild: (el: unknown) => { attached.add(el); } },
    querySelectorAll: () => [{ outerHTML: '<style>.epd{}</style>' }],
  } as unknown as Document;
  return { doc, frame, win, attached, html: () => written };
}

describe('Exportación del Perfil completo a PDF', () => {
  afterEach(() => { vi.useRealTimers(); });
  const node = { outerHTML: '<section><h1>Alfacar</h1><p>Perfil de Salud Local</p></section>' } as HTMLElement;

  it('maqueta el documento en un marco con ancho de página A4', () => {
    vi.useFakeTimers();
    const f = fakeDocument();
    printCompleteProfile(node, 'Perfil · Alfacar & <x>', f.doc);
    expect(f.frame.style.cssText).toContain('width:210mm');
    expect(f.frame.style.cssText).not.toMatch(/width:0/);
    expect(f.html()).toContain('Perfil de Salud Local');
    expect(f.html()).toContain('<title>Perfil · Alfacar &amp; &lt;x></title>');
    expect(f.html()).toContain('@page{size:A4');
  });

  it('lanza la impresión y conserva el marco mientras dura la vista previa', () => {
    vi.useFakeTimers();
    const f = fakeDocument();
    printCompleteProfile(node, 'Perfil', f.doc);
    vi.advanceTimersByTime(500);
    expect(f.win.print).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(60_000);
    expect(f.attached.has(f.frame)).toBe(true);
  });

  it('retira el marco cuando el navegador termina de imprimir', () => {
    vi.useFakeTimers();
    const f = fakeDocument();
    printCompleteProfile(node, 'Perfil', f.doc);
    vi.advanceTimersByTime(500);
    f.win.dispatch('afterprint');
    expect(f.attached.has(f.frame)).toBe(false);
  });

  it('retira el marco a los diez minutos si el navegador no avisa', () => {
    vi.useFakeTimers();
    const f = fakeDocument();
    printCompleteProfile(node, 'Perfil', f.doc);
    vi.advanceTimersByTime(PRINT_FRAME_FALLBACK_MS + 1);
    expect(f.attached.has(f.frame)).toBe(false);
  });

  it('no hace nada sin contenido que exportar', () => {
    const f = fakeDocument();
    expect(printCompleteProfile(null, 'Perfil', f.doc)).toBeUndefined();
    expect(f.attached.size).toBe(0);
  });
});
