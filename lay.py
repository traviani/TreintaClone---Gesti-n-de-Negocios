"""Motor de composiciones compartido. Cada estilo (collage, brutal, revista, italiano, riso, cuaderno)
hereda de Lay y redefine solo las piezas visuales (fondo, título, tarjeta, número, bloque, botón)."""
import random
from estilos import *
import estilos as E
import visual as V


class Lay:
    INK = (32, 24, 20)
    PAPEL = (250, 244, 230)     # fondo de tarjetas
    BG = (203, 168, 124)
    C1 = (214, 57, 36)
    C2 = (238, 178, 36)
    C3 = (72, 112, 70)
    FOOT = None
    FUENTE_T = "anton"          # fuente de títulos
    FUENTE_C = "montm"          # fuente de cuerpo
    FUENTE_S = "caveat"         # fuente de subtítulos
    PIE = "flecha"
    TXT = None                  # color de texto sobre el fondo
    G = 11                      # grosor del borde de pegatina
    ESC_T = 1.0                 # multiplicador real del tamaño de título
    PADW = 88                   # relleno horizontal del contenedor de título

    def __init__(self, **pal):
        for k, v in pal.items():
            setattr(self, k, v)
        self.foot = self.FOOT or self.INK
        self.txt = self.TXT or self.INK

    # ---------- piezas a redefinir ----------
    def base(self, seed=1):
        return lienzo(self.BG)

    def tira(self, im, txt, cx, cy, size, fondo=None, tinta_c=None, ang=0, maxw=900, seed=0, align="center", fuente=None):
        raise NotImplementedError

    def bloque(self, im, cx, cy, w, h, col, ang=0, seed=0):
        raise NotImplementedError

    def tarjeta(self, im, txt, cx, y, w, size=46, ang=0, seed=0, maxh=None):
        raise NotImplementedError

    def numero(self, im, n, cx, cy, r=78, fondo=None, tinta_c=None, ang=-8):
        raise NotImplementedError

    def deco(self, im, seed=0, n=4):
        pass

    def boton(self, im, txt, cx, cy, w):
        raise NotImplementedError

    def lista_card(self, im, items, cx, y, w, seed, size):
        raise NotImplementedError

    def sub(self, im, txt, x, y, maxw, size=62):
        bb = T(im, txt, self.FUENTE_S, size, self.INK, x, y, "lt", maxw=maxw, align="left")
        return bb

    # ---------- utilidades ----------
    def cols_titulo(self):
        return [(self.PAPEL, self.INK), (self.C1, self.PAPEL), (self.PAPEL, self.INK), (self.C2, self.INK)]

    def titulo_tiras(self, im, lineas, x0, y0, size, colores=None, angs=None, maxw=900, centro=False):
        colores = colores or self.cols_titulo()
        y = y0
        bb = None
        for i, l in enumerate(lineas):
            fondo, tinta_c = colores[i % len(colores)]
            ang = (angs[i] if angs else (-2 if i % 2 == 0 else 1.6))
            f = F(self.FUENTE_T, int(size * self.ESC_T))
            w = int(f.getlength(l)) + self.PADW
            cx = mx(0.5) if centro else x0 + w // 2 + (i % 2) * 26
            h = int(size * 1.06) + 44
            bb = self.tira(im, l, cx, y + h // 2, size, fondo, tinta_c, ang, maxw, i + 3)
            y = bb[3] - 8
        return bb[3]

    def _alto_tira(self, txt, size, maxw, seed):
        sc = Image.new("RGB", (W, 1400), (0, 0, 0))
        bb = self.tira(sc, txt, W // 2, 700, size, self.C1, self.PAPEL, 0, maxw, seed)
        return bb[3] - bb[1]

    def _hero(self, im, spec, cx, cy, alto, ang, maxw=None):
        V.poner_obj(im, spec, cx, cy, alto, ang, self.G, maxw=maxw)

    def _extras(self, im, extras, slots, ftop, fh):
        x0, y0, w, h = marco()
        for spec, (fx, fy, fa, ang) in zip(extras or [], slots):
            V.poner_obj(im, spec, x0 + fx * w, ftop + fy * fh, int(fa * h), ang, max(self.G - 2, 0))

    def _pie(self, im, n, total):
        pie_marca(im, self.foot, n, total, self.PIE)

    # ---------- composiciones ----------
    def portada(self, lineas, sub, hero, extras, sello_txt, total, seed=1, bloque_col=None, hero_alto=0.56, cols=None):
        im = self.base(seed)
        x0, y0, w, h = marco()
        size = 124 if not tt() else 116
        hy = my(0.66)
        self.bloque(im, mx(0.58), hy, w * 0.86, h * 0.52, bloque_col or self.C2, 3, seed + 5)
        self._hero(im, hero, mx(0.64), hy, int(h * hero_alto), 5, int(w * 0.66))
        for spec, (fx, fy, fa, ang) in zip(extras or [], [(0.14, 0.86, 0.17, -12), (0.30, 0.66, 0.15, 10), (0.9, 0.93, 0.13, 8)]):
            V.poner_obj(im, spec, mx(fx), my(fy), int(fa * h), ang, max(self.G - 2, 0))
        bt = self.titulo_tiras(im, lineas, x0 - 6, y0 + 6, size, cols)
        bb = self.sub(im, sub, x0 + 6, bt + 22, int(w * 0.66))
        if sello_txt:
            sello(im, sello_txt, x0 + w - 92, bt + 54, 92, self.C1 if (bloque_col or self.C2) == self.C2 else self.C2,
                  self.PAPEL if (bloque_col or self.C2) == self.C2 else self.INK, -12)
        self.deco(im, seed)
        self._pie(im, 1, total)
        return im

    def paso(self, num, titulo, cuerpo, n, total, hero, extras=None, v=0, seed=2, size=80, nota=None, bloque_col=None):
        im = self.base(seed)
        x0, y0, w, h = marco()
        bc_col = bloque_col or self.C2
        tcol = (self.PAPEL, self.INK)
        if v == 0:
            if num not in (None, ""):
                self.numero(im, num, x0 + 82, y0 + 92)
                bb = self.tira(im, titulo, x0 + 200 + (w - 200) // 2, y0 + 92, size, tcol[0], tcol[1], -1.6, w - 200, n)
            else:
                bb = self.tira(im, titulo, x0 + w // 2, y0 + 92, size, tcol[0], tcol[1], -1.6, w, n)
            bc = self.tarjeta(im, cuerpo, mx(0.5), bb[3] + 44, int(w * 0.94), 46, 0, n + 4)
            ftop = bc[3] + 10; fh = y0 + h - 50 - ftop
            self.bloque(im, mx(0.62), ftop + fh * 0.5, w * 0.8, fh * 0.92, bc_col, -3, seed + 7)
            self._hero(im, hero, mx(0.66), ftop + fh * 0.5, int(min(fh * 1.0, h * 0.58)), 6, int(w * 0.68))
            self._extras(im, extras, [(0.13, 0.36, 0.17, -10), (0.22, 0.78, 0.15, 12)], ftop, fh)
            if nota:
                T(im, nota, self.FUENTE_S, 58, self.txt, x0 + 8, ftop + fh * 0.98, "lb", maxw=int(w * 0.34), ang=6)
        elif v == 1:
            ch = int(h * 0.46)
            self.bloque(im, mx(0.42), y0 + ch * 0.52, w * 0.78, ch * 0.98, bc_col, 2, seed + 7)
            self._hero(im, hero, mx(0.42), y0 + ch * 0.52, int(ch * 1.0), -6, int(w * 0.72))
            if num not in (None, ""):
                self.numero(im, num, x0 + w - 88, y0 + 96, 90, self.C1, self.PAPEL, 8)
            ty = y0 + ch + 34
            hb = self._alto_tira(titulo, size, w, n)
            bb = self.tira(im, titulo, mx(0.5), ty + hb // 2, size, self.C1, self.PAPEL, 1.4, w, n)
            self.tarjeta(im, cuerpo, mx(0.5), bb[3] + 40, int(w * 0.96), 46, -0.6, n + 4)
            if extras:
                for spec, (fx, fy, fa, ang) in zip(extras, [(0.88, 0.30, 0.15, 10), (0.90, 0.56, 0.12, -8)]):
                    V.poner_obj(im, spec, mx(fx), y0 + fy * ch * 1.6, int(fa * h), ang, max(self.G - 2, 0))
        else:
            if num not in (None, ""):
                self.numero(im, num, x0 + 82, y0 + 88)
            tx = x0 + 190 + (w - 190) // 2 if num not in (None, "") else x0 + w // 2
            bb = self.tira(im, titulo, tx, y0 + 88, size, tcol[0], tcol[1], 1.2, w - 190 if num not in (None, "") else w, n)
            cw = int(w * 0.52)
            bc = self.tarjeta(im, cuerpo, x0 + cw // 2, bb[3] + 56, cw, 42, -1.2, n + 5)
            ftop = bb[3] + 30; fh = y0 + h - 50 - ftop
            self.bloque(im, x0 + w * 0.79, ftop + fh * 0.56, w * 0.44, fh * 0.96, bc_col, 3, seed + 8)
            self._hero(im, hero, x0 + w * 0.79, ftop + fh * 0.52, int(min(fh * 0.92, h * 0.6)), 7, int(w * 0.40))
            self._extras(im, extras, [(0.13, 0.84, 0.17, -8), (0.34, 0.92, 0.14, 10)], bc[3], y0 + h - 50 - bc[3])
        self.deco(im, n + seed)
        self._pie(im, n, total)
        return im

    def lista(self, titulo, items, n, total, hero=None, extras=None, seed=3, bloque_col=None, size=64):
        im = self.base(seed)
        x0, y0, w, h = marco()
        bb = self.tira(im, titulo, mx(0.5), y0 + 88, 92, self.C1, self.PAPEL, -1.5, w, n)
        bc = self.lista_card(im, items, mx(0.5), bb[3] + 44, int(w * 0.95), seed + n, size)
        ftop = bc[3] + 14
        fh = y0 + h - 50 - ftop
        if hero is not None and fh > 200:
            self.bloque(im, mx(0.64), ftop + fh * 0.5, w * 0.76, fh * 0.94, bloque_col or self.C2, -3, seed + 9)
            self._hero(im, hero, mx(0.66), ftop + fh * 0.5, int(min(fh * 1.0, h * 0.44)), 6, int(w * 0.62))
            self._extras(im, extras, [(0.13, 0.40, 0.16, -10), (0.24, 0.80, 0.14, 12)], ftop, fh)
        self.deco(im, n + seed)
        self._pie(im, n, total)
        return im

    def frase(self, lineas, sub, n, total, hero=None, extras=None, seed=5, cols=None, size=132, bloque_col=None):
        im = self.base(seed)
        x0, y0, w, h = marco()
        cols = cols or [(self.C1, self.PAPEL), (self.PAPEL, self.INK), (self.PAPEL, self.INK)]
        bt = self.titulo_tiras(im, lineas, x0, y0 + 10, size, cols)
        bb = self.sub(im, sub, x0 + 8, bt + 26, int(w * 0.94), 64)
        ftop = bb[3] + 16
        fh = y0 + h - 50 - ftop
        if hero is not None and fh > 180:
            self.bloque(im, mx(0.6), ftop + fh * 0.5, w * 0.78, fh * 0.94, bloque_col or self.C2, 3, seed + 6)
            self._hero(im, hero, mx(0.62), ftop + fh * 0.5, int(min(fh * 1.0, h * 0.5)), -5, int(w * 0.7))
            self._extras(im, extras, [(0.13, 0.36, 0.17, -10), (0.22, 0.80, 0.15, 12)], ftop, fh)
        self.deco(im, n + seed)
        self._pie(im, n, total)
        return im

    def vs(self, titulo, izq, der, n, total, seed=6, hero=None):
        """izq/der = (etiqueta, [items]). Dos tarjetas enfrentadas con ✗ y ✓."""
        im = self.base(seed)
        x0, y0, w, h = marco()
        bb = self.tira(im, titulo, mx(0.5), y0 + 88, 92, self.C1, self.PAPEL, -1.5, w, n)
        cw = int(w * 0.485)
        top = bb[3] + 60
        alto_max = y0 + h - 60 - top - (320 if hero is not None else 0)
        for k, (lab, its, col, ic) in enumerate(((izq[0], izq[1], self.C1, "cruz"), (der[0], der[1], self.C3, "check"))):
            cx = x0 + cw // 2 + k * (w - cw)
            V.poner_obj(im, ic, cx, top + 10, 120, 0, 0)
            lab_bb = self.tira(im, lab, cx, top + 110, 54, col, self.PAPEL, -2 + 4 * k, cw + 20, seed + k + 1, fuente=self.FUENTE_T)
            txt = "\n".join("• " + i for i in its)
            self.tarjeta(im, txt, cx, lab_bb[3] + 26, cw, 46, (-1 + 2 * k) * 0.8, n + k, maxh=alto_max)
        if hero is not None:
            self._hero(im, hero, mx(0.5), y0 + h - 190, 380, 0, int(w * 0.95))
        self.deco(im, n + seed)
        self._pie(im, n, total)
        return im

    def sabor(self, nombre, n_sabor, desc, ideal, n, total, seed=7, color=None):
        """Lámina de un sabor: empaque grande + nombre + descripción + 'ideal para'."""
        col = color or self.C1
        im = self.base(seed)
        x0, y0, w, h = marco()
        self.bloque(im, mx(0.5), my(0.36), w * 0.92, h * 0.50, col, -2, seed + 4)
        self._hero(im, n_sabor, mx(0.5), my(0.36), int(h * 0.52), 4, int(w * 0.8))
        bb = self.tira(im, nombre, mx(0.5), my(0.68), 128, self.PAPEL, self.INK, -2, w, n)
        bc = self.tarjeta(im, desc, mx(0.5), bb[3] + 30, int(w * 0.92), 46, 0.6, n + 3)
        chip = self.tira(im, "IDEAL PARA: " + ideal.upper(), mx(0.5), bc[3] + 70, 50, col, self.PAPEL, 1.5, w, n + 9)
        self.deco(im, n + seed)
        self._pie(im, n, total)
        return im

    def cierre(self, titulo, lineas, boton, objs, total, seed=4, n=None, tcols=None):
        im = self.base(seed)
        x0, y0, w, h = marco()
        n = n or total
        tl = titulo.split("\n")
        size = 106
        btn_cy = y0 + h - 106
        lines_h = 62 * len(lineas)
        lines_top = btn_cy - 48 - 20 - lines_h
        tit_h = len(tl) * (int(size * 1.06) + 44 - 8) + 8
        tit_top = lines_top - 18 - tit_h
        avail = tit_top - y0 - 6
        k = len(objs)
        fan_h = int(min(avail * 0.98, h * 0.40))
        cyf = y0 + avail // 2 + 10
        self.bloque(im, mx(0.5), cyf, w * 0.98, avail * 0.96, self.C2, -1.5, seed + 3)
        for i, o in enumerate(objs):
            px = mx(0.5) + int((i - (k - 1) / 2) * w * (0.34 if k <= 3 else 0.22))
            ang = (i - (k - 1) / 2) * 10
            V.poner_obj(im, o, px, cyf + abs(i - (k - 1) / 2) * 22, int(fan_h * (0.94 if i % 2 == 0 else 0.86)), ang, self.G)
        self.titulo_tiras(im, tl, x0, tit_top, size, tcols or [(self.C1, self.PAPEL), (self.PAPEL, self.INK)], [-2, 1.4], maxw=w, centro=True)
        yy = lines_top
        for l in lineas:
            T(im, l, self.FUENTE_S, 54, self.txt, mx(0.5), yy, "ct", maxw=w, maxh=62)
            yy += 62
        self.boton(im, boton, mx(0.5), btn_cy, int(w * 0.94))
        self.deco(im, seed)
        self._pie(im, n, total)
        return im
