"""Objetos visuales unificados: empaques, fotos de platos e ilustraciones (iconos).
spec: int (empaque 1-5) | str (icono) | ('foto', 'pasta'|'pizza'|'espiral') | ('img', RGBA) | ('disco', key)"""
from estilos import *
import estilos as E
import iconos as I

BLANCO = (255, 255, 255)


def _foto(key):
    if key == "pasta":
        return img(f"{FOT}/pasta.png")
    if key == "pizza":
        return img(f"{FOT}/pizza_recorte.png")
    if key == "espiral":
        return img(f"{FOT}/espiral_recorte.png")
    p = plato(key)
    if p is None:
        raise FileNotFoundError(key)
    return p


def obj(spec, alto=400, g=11, col=BLANCO, suave=True, sombra_icono=True):
    if isinstance(spec, str):
        alto = int(alto * 0.74)
    if not isinstance(spec, (int, str)) and spec[0] == "cluster":
        C = Image.new("RGBA", (int(alto * 1.0), int(alto * 1.0)), (0, 0, 0, 0))
        for sp, dx, dy, hf, ang in spec[1]:
            o = obj(sp, int(alto * hf / (0.74 if isinstance(sp, str) else 1)), g, col, suave, sombra_icono)
            pegar(C, o, int(alto * (0.5 + dx)), int(alto * (0.5 + dy)), ang)
        return C
    if isinstance(spec, int):
        o = escalar(recortar(prod(spec)), alto=alto)
        return pegatina(o, g, col, suave) if g else o
    if isinstance(spec, str):
        return I.icono(spec, alto, sombra=sombra_icono)
    kind, val = spec
    if kind == "img":
        o = escalar(recortar(val), alto=alto)
        return pegatina(o, g, col, suave) if g else o
    if kind == "foto":
        f = _foto(val)
        if val == "pasta":
            d = int(alto)
            c = cubrir(f.convert("RGB"), d, d, (0.5, 0.56))
            o = con_mascara(c, mascara_circ(d))
            o = contorno(o, max(g, 8), col)
            return sombra_suave(o, 14, 100, 10) if suave else o
        o = escalar(recortar(f), alto=alto) if val == "espiral" else escalar(recortar(f), ancho=alto)
        return pegatina(o, g, col, suave) if g else o
    if kind == "disco":  # foto recortada en círculo (cualquier key)
        f = _foto(val)
        d = int(alto)
        c = cubrir(f.convert("RGB"), d, d)
        o = con_mascara(c, mascara_circ(d))
        o = contorno(o, max(g, 8), col)
        return sombra_suave(o, 14, 100, 10) if suave else o
    raise ValueError(spec)


def poner_obj(im, spec, cx, cy, alto, ang=0, g=11, col=BLANCO, suave=True, maxw=None):
    o = obj(spec, alto, g, col, suave)
    if maxw and o.width > maxw:
        o = o.resize((int(maxw), int(o.height * maxw / o.width)), Image.LANCZOS)
    return pegar(im, o, int(cx), int(cy), ang)


def racimo(im, items, g=11):
    """items: lista de (spec, cx, cy, alto, ang). Coordenadas absolutas."""
    for spec, cx, cy, alto, ang in items:
        poner_obj(im, spec, cx, cy, alto, ang, g)
