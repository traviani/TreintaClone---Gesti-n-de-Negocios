"""Estilos visuales (heredan de Lay): Collage, Brutal, Revista, Italiano, Riso, Cuaderno."""
import random
from estilos import *
import estilos as E
import visual as V
from lay import Lay


def _fantasma(im, col, txt="TRAVIANI", fuente="anton", tam=330):
    if tt():
        cap = capa_texto([txt], F(fuente, tam), col)
        im.paste(cap, ((W - cap.width) // 2, H() - cap.height - 40), cap)


def _oscuro(col, k=26):
    return tuple(max(c - k, 0) for c in col)


def _claro(col, k=26):
    return tuple(min(c + k, 255) for c in col)


def _caja(w, h, fill, outline, ow, off, r=0, ang=0, sombra_col=None, extra_pad=4):
    """Caja con borde y sombra dura (neobrutalismo). Devuelve RGBA."""
    pad = ow + off + extra_pad
    S = Image.new("RGBA", (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
    with AA(S) as aa:
        aa.rect((pad + off, pad + off, pad + off + w, pad + off + h), fill=(sombra_col or outline) + (255,), r=r)
        aa.rect((pad, pad, pad + w, pad + h), fill=fill + (255,), outline=outline + (255,), w=ow, r=r)
    return S, pad


# =====================================================================  COLLAGE
class Collage(Lay):
    INK = (32, 24, 20); PAPEL = (250, 244, 230); BG = (203, 168, 124)
    C1 = (214, 57, 36); C2 = (238, 178, 36); C3 = (72, 112, 70)

    def base(self, seed=1):
        im = grano(papel(self.BG, seed), 12, 0.35)
        _fantasma(im, _oscuro(self.BG))
        return im

    def tira(self, im, txt, cx, cy, size, fondo=None, tinta_c=None, ang=0, maxw=900, seed=0, align="center", fuente=None):
        fondo = fondo or self.PAPEL; tinta_c = tinta_c or self.INK
        padx, pady = 44, 22
        f, ls, s = ajustar(txt, fuente or self.FUENTE_T, maxw - 2 * padx, 700, size, 26, 1.04)
        capa = capa_texto(ls, f, tinta_c, align, int(s * 1.04))
        w, h = capa.width + padx * 2, capa.height + pady * 2
        st = rasgado(w, h, fondo, seed, amp=8)
        st.paste(capa, (14 + padx, 14 + pady), capa)
        st = sombra_suave(st, 9, 85, 7)
        pegar(im, st, cx, cy, ang)
        return (cx - w // 2, cy - h // 2, cx + w // 2, cy + h // 2)

    def bloque(self, im, cx, cy, w, h, col, ang=0, seed=0):
        b = rasgado(int(w), int(h), col, seed, amp=16, lados="tblr", gb=9)
        pegar(im, sombra_suave(b, 12, 80, 9), cx, cy, ang)

    def tarjeta(self, im, txt, cx, y, w, size=46, ang=0, seed=0, maxh=None, pad=40, inter=1.3):
        f, ls, s = ajustar(txt, self.FUENTE_C, w - 2 * pad, (maxh or 2000) - 2 * pad, size, 26, inter)
        capa = capa_texto(ls, f, self.INK, "left", int(s * inter))
        h = capa.height + 2 * pad
        card = rasgado(w, h, self.PAPEL, seed, amp=6, lados="tb")
        card.paste(capa, (14 + pad, 14 + pad), capa)
        pegar(im, sombra_suave(card, 12, 90, 9), cx, y + h // 2, ang)
        for sx in (-1, 1):
            pegar(im, cinta(150, 44, (250, 224, 130), 28 * sx + ang), cx + sx * (w // 2 - 34), y + 6, 0)
        return (cx - w // 2, y, cx + w // 2, y + h)

    def numero(self, im, n, cx, cy, r=78, fondo=None, tinta_c=None, ang=-8):
        S = Image.new("RGBA", (r * 2 + 30, r * 2 + 30), (0, 0, 0, 0))
        with AA(S) as aa:
            estrella(aa, r + 15, r + 15, r, r * 0.9, 14, fill=fondo or self.C1)
        capa = capa_texto([str(n)], F("marker", int(r * 1.15)), tinta_c or self.PAPEL)
        S.paste(capa, ((S.width - capa.width) // 2, (S.height - capa.height) // 2), capa)
        pegar(im, sombra_suave(S, 8, 90, 7), cx, cy, ang)

    def deco(self, im, seed=0, n=4):
        r = random.Random(seed)
        x0, y0, w, h = marco()
        for _ in range(n):
            x = r.randint(x0 + 20, x0 + w - 20); y = r.randint(y0 + 20, y0 + h - 60)
            with AA(im, (x - 30, y - 30, x + 30, y + 30)) as aa:
                chispa(aa, x, y, r.randint(10, 17), self.INK + (170,))

    def boton(self, im, txt, cx, cy, w):
        bh = 96
        btn = Image.new("RGBA", (w + 14, bh + 14), (0, 0, 0, 0))
        with AA(btn) as aa:
            aa.rect((14, 14, w + 14, bh + 14), fill=self.INK + (255,), r=22)
            aa.rect((0, 0, w, bh), fill=self.C1 + (255,), outline=self.INK + (255,), w=5, r=22)
        T(btn, txt, "anton", 42, self.PAPEL, w // 2, bh // 2 + 2, "cm", maxw=w - 40)
        pegar(im, btn, cx, cy, -1)

    def lista_card(self, im, items, cx, y, w, seed, size):
        x0, y0, fw, fh = marco()
        f, ls, s = ajuste_items(items, "caveat", w - 210, int(fh * 0.46), size, 34, 1.06)
        ai = int(s * 1.45)
        ph = ai * len(items) + 80
        card = rasgado(w, ph, (252, 249, 238), seed, amp=7, lados="tb")
        d = ImageDraw.Draw(card)
        for i in range(len(items)):
            yy = 14 + 54 + i * ai + int(s * 1.08)
            d.line((14 + 40, yy, 14 + w - 40, yy), fill=(170, 200, 225), width=2)
        pegar(im, sombra_suave(card, 12, 90, 9), cx, y + ph // 2, -0.8)
        for i, it in enumerate(items):
            yy = y + 14 + 40 + i * ai
            cx0 = cx - w // 2 + 14 + 40
            with AA(im, (cx0 - 6, yy - 6, cx0 + 64, yy + 70)) as aa:
                aa.rect((cx0, yy + 6, cx0 + 46, yy + 52), outline=self.INK + (255,), w=5, r=6)
                aa.line([(cx0 + 8, yy + 28), (cx0 + 20, yy + 44), (cx0 + 56, yy - 4)], self.C1 + (255,), 8)
            T(im, it, "caveat", s, self.INK, cx0 + 78, yy + 2, "lt", maxw=w - 210)
        for sx in (-1, 1):
            pegar(im, cinta(150, 44, (250, 224, 130), 26 * sx), cx + sx * (w // 2 - 34), y + 12)
        return (cx - w // 2, y, cx + w // 2, y + ph)

    def sub(self, im, txt, x, y, maxw, size=62):
        bb = T(im, txt, "caveat", size, self.INK, x, y, "lt", maxw=maxw, align="left")
        marcador(im, (bb[0], bb[1] + 8, bb[2], bb[3] - 4), (255, 225, 90), 2, 12, 150)
        return T(im, txt, "caveat", size, self.INK, x, y, "lt", maxw=maxw, align="left")


# =====================================================================  BRUTAL
class Brutal(Lay):
    INK = (16, 16, 16); PAPEL = (255, 255, 255); BG = (255, 222, 50)
    C1 = (255, 84, 48); C2 = (70, 110, 255); C3 = (255, 130, 204)
    FUENTE_C = "mont"; FUENTE_S = "montx"; G = 9; PIE = "num"; BAND = None

    def base(self, seed=1):
        im = puntos(self.BG, _oscuro(self.BG, 34), 38, 3)
        im = grano(im, 10, 0.25)
        # banda marquee inferior
        d = ImageDraw.Draw(im)
        y = H() - 52
        bf, bt_ = self.BAND or (self.INK, self.BG)
        d.rectangle((0, y, W, H()), fill=bf)
        txt = "  ✱ SALCHICHA SICILIANA  ✱ TRAVIANI  ✱ HECHA A MANO EN CARACAS"
        f = F("mont", 26)
        x = -30
        while x < W:
            d.text((x, y + 10), "SALCHICHA SICILIANA  •  TRAVIANI  •  HECHA A MANO EN CARACAS  •  ", font=f, fill=bt_)
            x += int(f.getlength("SALCHICHA SICILIANA  •  TRAVIANI  •  HECHA A MANO EN CARACAS  •  "))
        return im

    def tira(self, im, txt, cx, cy, size, fondo=None, tinta_c=None, ang=0, maxw=900, seed=0, align="center", fuente=None):
        fondo = fondo or self.PAPEL; tinta_c = tinta_c or self.INK
        padx, pady = 34, 16
        f, ls, s = ajustar(txt, fuente or self.FUENTE_T, maxw - 2 * padx - 14, 700, size, 26, 1.04)
        capa = capa_texto(ls, f, tinta_c, align, int(s * 1.04))
        w, h = capa.width + padx * 2, capa.height + pady * 2
        S, pad = _caja(w, h, fondo, self.INK, 7, 11)
        S.paste(capa, (pad + padx, pad + pady), capa)
        pegar(im, S, cx, cy, ang)
        return (cx - w // 2, cy - h // 2, cx + w // 2, cy + h // 2)

    def bloque(self, im, cx, cy, w, h, col, ang=0, seed=0):
        S, pad = _caja(int(w), int(h), col, self.INK, 7, 14, 0)
        # trama de puntos claros dentro
        d = ImageDraw.Draw(S)
        c2 = _claro(col, 40)
        for yy in range(pad + 20, pad + int(h) - 10, 34):
            for xx in range(pad + 20 + (17 if (yy // 34) % 2 else 0), pad + int(w) - 10, 34):
                d.ellipse((xx - 3, yy - 3, xx + 3, yy + 3), fill=c2)
        pegar(im, S, cx, cy, ang)

    def tarjeta(self, im, txt, cx, y, w, size=46, ang=0, seed=0, maxh=None, pad=34, inter=1.26):
        f, ls, s = ajustar(txt, self.FUENTE_C, w - 2 * pad - 14, (maxh or 2000) - 2 * pad, size, 26, inter)
        capa = capa_texto(ls, f, self.INK, "left", int(s * inter))
        h = capa.height + 2 * pad
        S, p = _caja(w, h, self.PAPEL, self.INK, 6, 10)
        S.paste(capa, (p + pad, p + pad), capa)
        pegar(im, S, cx, y + h // 2, ang)
        return (cx - w // 2, y, cx + w // 2, y + h)

    def numero(self, im, n, cx, cy, r=78, fondo=None, tinta_c=None, ang=-8):
        d = r * 2
        S, p = _caja(d, d, fondo or self.C3, self.INK, 7, 10, r=r)
        capa = capa_texto([str(n)], F("anton", int(r * 1.3)), tinta_c or self.INK)
        S.paste(capa, (p + (d - capa.width) // 2, p + (d - capa.height) // 2), capa)
        pegar(im, S, cx, cy, ang)

    def deco(self, im, seed=0, n=3):
        pass

    def boton(self, im, txt, cx, cy, w):
        bh = 100
        S, p = _caja(w, bh, self.C1, self.INK, 7, 12, r=0)
        T(S, txt, "anton", 44, self.PAPEL, p + w // 2, p + bh // 2 + 2, "cm", maxw=w - 40)
        pegar(im, S, cx, cy, -1)

    def lista_card(self, im, items, cx, y, w, seed, size):
        x0, y0, fw, fh = marco()
        pad = 30
        f, ls, s = ajuste_items(items, "mont", w - 2 * pad - 120, int(fh * 0.46), 48, 28, 1.3)
        ai = int(s * 1.55)
        ph = ai * len(items) + pad * 2
        S, p = _caja(w, ph, self.PAPEL, self.INK, 7, 12)
        for i, it in enumerate(items):
            yy = p + pad + i * ai
            with AA(S, (p + pad - 4, yy - 4, p + pad + 70, yy + 66)) as aa:
                aa.rect((p + pad, yy + 4, p + pad + 50, yy + 54), fill=(self.C3 if i % 2 else self.C2) + (255,), outline=self.INK + (255,), w=5)
                aa.line([(p + pad + 10, yy + 30), (p + pad + 22, yy + 44), (p + pad + 58, yy - 2)], self.INK + (255,), 8)
            T(S, it, "mont", s, self.INK, p + pad + 86, yy + 2, "lt", maxw=w - 2 * pad - 100)
        pegar(im, S, cx, y + ph // 2, -0.6)
        return (cx - w // 2, y, cx + w // 2, y + ph)

    def sub(self, im, txt, x, y, maxw, size=50):
        f, ls, s = ajustar(txt, "montx", maxw - 60, 300, size, 26, 1.2)
        capa = capa_texto(ls, f, self.INK, "left", int(s * 1.2))
        w, h = capa.width + 50, capa.height + 28
        S, p = _caja(w, h, self.PAPEL, self.INK, 5, 8)
        S.paste(capa, (p + 25, p + 14), capa)
        pegar(im, S, x + w // 2 + 4, y + h // 2, 0)
        return (x, y, x + w, y + h)


# =====================================================================  REVISTA
class Revista(Lay):
    INK = (34, 24, 22); PAPEL = (246, 240, 228); BG = (242, 235, 221)
    C1 = (122, 30, 42); C2 = (200, 168, 120); C3 = (96, 120, 84)
    FUENTE_T = "play"; FUENTE_C = "montr"; FUENTE_S = "playi"; PIE = "num"; G = 0
    NUM_REVISTA = "Nº 01"; ESC_T = 1.02; PADW = 12

    def base(self, seed=1):
        im = grano(papel(self.BG, seed, fibras=False, fuerza=6), 8, 0.3)
        d = ImageDraw.Draw(im)
        x0, y0, w, h = marco()
        # cabecera y filete
        T(im, "IL SICILIANO GOURMET", "montx", 22, self.INK, x0, y0 - 28 if not tt() else y0 - 34, "lb", track=6)
        T(im, self.NUM_REVISTA + "  ·  OCT 2026", "montx", 22, self.INK, x0 + w, y0 - 28 if not tt() else y0 - 34, "rb", track=4)
        d.line((x0, y0 - 14, x0 + w, y0 - 14), fill=self.INK, width=3)
        d.line((x0, y0 - 8, x0 + w, y0 - 8), fill=self.INK, width=1)
        _fantasma(im, _oscuro(self.BG, 10), "ITALIA", "play", 330)
        return im

    def tira(self, im, txt, cx, cy, size, fondo=None, tinta_c=None, ang=0, maxw=900, seed=0, align="center", fuente=None):
        italica = (fondo == self.C1)
        fuente = fuente or (self.FUENTE_S if italica else self.FUENTE_T)
        f, ls, s = ajustar(txt, fuente, maxw - 10, 800, int(size * 1.02), 26, 1.0)
        col = self.C1 if italica else self.INK
        if tinta_c == self.PAPEL and not italica:
            col = self.INK
        capa = capa_texto(ls, f, col, align, int(s * 1.0))
        bb = poner(im, capa, cx, cy, "cm", ang)
        return bb

    def titulo_tiras(self, im, lineas, x0, y0, size, colores=None, angs=None, maxw=900, centro=False):
        y = y0
        bb = None
        for i, l in enumerate(lineas):
            fondo = self.C1 if i % 2 == 1 else None
            f = F(self.FUENTE_S if fondo else self.FUENTE_T, size)
            h = int(size * 1.0)
            cx = mx(0.5) if centro else x0 + int(f.getlength(l)) // 2 + 6
            bb = self.tira(im, l, cx, y + h // 2, size, fondo, None, 0, maxw, i)
            y = bb[3] - 4
        return bb[3]

    def bloque(self, im, cx, cy, w, h, col, ang=0, seed=0):
        w, h = int(w), int(h)
        if seed % 2 == 0:
            m = mascara_arco(min(w, int(h * 0.8)), h)
            S = Image.new("RGBA", m.size, col + (255,)); S.putalpha(m)
            ww = m.width
        else:
            d = min(w, h)
            m = mascara_circ(d)
            S = Image.new("RGBA", (d, d), col + (255,)); S.putalpha(m)
        S = grano_rgba(S)
        pegar(im, S, cx, cy, 0)

    def tarjeta(self, im, txt, cx, y, w, size=46, ang=0, seed=0, maxh=None, pad=24, inter=1.38):
        size = int(size * 0.92)
        f, ls, s = ajustar(txt, self.FUENTE_C, w - 2 * pad - 26, (maxh or 2000) - 2 * pad, size, 26, inter)
        capa = capa_texto(ls, f, self.INK, "left", int(s * inter))
        h = capa.height + 2 * pad
        x = cx - w // 2
        with AA(im, (x - 4, y - 4, x + 14, y + h + 4)) as aa:
            aa.rect((x, y, x + 8, y + h), fill=self.C1 + (255,))
        im.paste(capa, (x + 30, y + pad), capa)
        return (x, y, x + w, y + h)

    def numero(self, im, n, cx, cy, r=78, fondo=None, tinta_c=None, ang=-8):
        d = r * 2
        with AA(im, (cx - r - 8, cy - r - 8, cx + r + 8, cy + r + 8)) as aa:
            aa.ellipse((cx - r, cy - r, cx + r, cy + r), outline=self.C1 + (255,), w=5)
        T(im, f"{int(n):02d}" if str(n).isdigit() else str(n), "playi", int(r * 1.05), self.C1, cx, cy + 2, "cm")

    def deco(self, im, seed=0, n=3):
        x0, y0, w, h = marco()
        for (x, y) in ((x0 + w - 22, y0 + 40), (x0 + 22, y0 + h - 56)):
            with AA(im, (x - 26, y - 26, x + 26, y + 26)) as aa:
                chispa(aa, x, y, 14, self.C1 + (255,))

    def boton(self, im, txt, cx, cy, w):
        bh = 92
        with AA(im, (cx - w // 2 - 4, cy - bh // 2 - 4, cx + w // 2 + 4, cy + bh // 2 + 4)) as aa:
            aa.rect((cx - w // 2, cy - bh // 2, cx + w // 2, cy + bh // 2), fill=self.C1 + (255,), r=46)
        T(im, txt, "montx", 30, self.PAPEL, cx, cy + 2, "cm", maxw=w - 60, track=3)

    def lista_card(self, im, items, cx, y, w, seed, size):
        x0, y0, fw, fh = marco()
        f, ls, s = ajuste_items(items, "montr", w - 190, int(fh * 0.5), 46, 28, 1.3)
        ai = int(s * 1.9)
        d = ImageDraw.Draw(im)
        xl = cx - w // 2
        for i, it in enumerate(items):
            yy = y + i * ai
            d.line((xl, yy, xl + w, yy), fill=self.INK, width=2)
            T(im, f"{i + 1:02d}", "playi", int(s * 1.5), self.C1, xl + 4, yy + ai // 2, "lm")
            T(im, it, "montr", s, self.INK, xl + 140, yy + ai // 2, "lm", maxw=w - 160)
        d.line((xl, y + ai * len(items), xl + w, y + ai * len(items)), fill=self.INK, width=2)
        return (xl, y, xl + w, y + ai * len(items))

    def sub(self, im, txt, x, y, maxw, size=50):
        return T(im, txt, "playi", size, self.INK, x, y, "lt", maxw=maxw, align="left")

    def cols_titulo(self):
        return [(None, None), (self.C1, None)]

    def vs(self, titulo, izq, der, n, total, seed=6, hero=None):
        im = self.base(seed)
        x0, y0, w, h = marco()
        bb = self.tira(im, titulo, mx(0.5), y0 + 88, 92, None, None, 0, w, n)
        cw = int(w * 0.47)
        top = bb[3] + 40
        d = ImageDraw.Draw(im)
        d.line((mx(0.5), top, mx(0.5), y0 + h - 70), fill=self.INK, width=2)
        for k, (lab, its, col, ic) in enumerate(((izq[0], izq[1], self.C1, "cruz"), (der[0], der[1], self.C3, "check"))):
            xl = x0 + k * (w - cw)
            V.poner_obj(im, ic, xl + 60, top + 40, 90, 0, 0)
            T(im, lab, "montx", 26, col, xl + 130, top + 40, "lm", maxw=cw - 130, track=3)
            d.line((xl, top + 100, xl + cw, top + 100), fill=self.INK, width=2)
            txt = "\n".join(its)
            yy = top + 130
            for it in its:
                bb2 = T(im, it, "play", 40, self.INK, xl, yy, "lt", maxw=cw)
                yy = bb2[3] + 30
        if hero is not None:
            self._hero(im, hero, mx(0.5), y0 + h - 230, 470, 0, int(w * 0.95))
        self.deco(im, n + seed)
        self._pie(im, n, total)
        return im


def grano_rgba(S):
    a = S.split()[3]
    rgb = grano(S.convert("RGB"), 8, 0.35)
    o = rgb.convert("RGBA"); o.putalpha(a)
    return o


# =====================================================================  ITALIANO
class Italiano(Lay):
    INK = (40, 28, 24); PAPEL = (250, 240, 218); BG = (250, 240, 218)
    C1 = (196, 58, 40); C2 = (238, 190, 60); C3 = (70, 104, 62)
    FUENTE_T = "dm"; FUENTE_C = "fredm"; FUENTE_S = "dmi"; PIE = "punto"; G = 10
    FONDO = "cuadros"

    def base(self, seed=1):
        if self.FONDO == "cuadros":
            im = cuadros((250, 242, 222), self.C1, 100, 0.5)
        else:
            im = papel(self.BG, seed, fibras=False)
        im = grano(im, 10, 0.3)
        d = ImageDraw.Draw(im)
        # toldo a rayas arriba
        n = 12
        ww = W / n
        for i in range(n):
            col = self.C1 if i % 2 == 0 else (252, 248, 236)
            d.rectangle((i * ww, 0, (i + 1) * ww, 40), fill=col)
            d.pieslice((i * ww, 12, (i + 1) * ww, 70), 0, 180, fill=col)
        d.line((0, 41, W, 41), fill=self.INK, width=1)
        _fantasma(im, _oscuro(self.PAPEL, 14), "SICILIA", "dm", 300)
        return im

    def tira(self, im, txt, cx, cy, size, fondo=None, tinta_c=None, ang=0, maxw=900, seed=0, align="center", fuente=None):
        fondo = fondo or self.PAPEL; tinta_c = tinta_c or self.INK
        padx, pady = 60, 22
        f, ls, s = ajustar(txt, fuente or self.FUENTE_T, maxw - 2 * padx, 700, size, 26, 1.05)
        capa = capa_texto(ls, f, tinta_c, align, int(s * 1.05))
        w, h = capa.width + padx * 2, capa.height + pady * 2
        S = Image.new("RGBA", (w + 80, h + 20), (0, 0, 0, 0))
        with AA(S) as aa:
            ox = 40
            aa.poly([(0, 10 + h * 0.15), (ox + 10, 10 + h * 0.15), (ox + 10, 10 + h), (0, 10 + h), (ox * 0.45, 10 + h * 0.575)], fill=_oscuro(fondo, 40) + (255,), outline=self.INK + (255,), w=4)
            aa.poly([(w + 80, 10 + h * 0.15), (w + 80 - ox - 10, 10 + h * 0.15), (w + 80 - ox - 10, 10 + h), (w + 80, 10 + h), (w + 80 - ox * 0.45, 10 + h * 0.575)], fill=_oscuro(fondo, 40) + (255,), outline=self.INK + (255,), w=4)
            aa.rect((ox, 0, w + 40, h), fill=fondo + (255,), outline=self.INK + (255,), w=5)
            aa.rect((ox + 10, 10, w + 30, h - 10), outline=tinta_c + (120,), w=2)
        S.paste(capa, (40 + padx, 10 + pady - 10 + 4 if False else pady), capa)
        S = sombra_suave(S, 8, 70, 8)
        pegar(im, S, cx, cy, ang)
        return (cx - w // 2 - 40, cy - h // 2, cx + w // 2 + 40, cy + h // 2)

    def bloque(self, im, cx, cy, w, h, col, ang=0, seed=0):
        w, h = int(w), int(h)
        aw = min(w, int(h * 0.92))
        S = Image.new("RGBA", (aw + 60, h + 60), (0, 0, 0, 0))
        m = mascara_arco(aw, h)
        base_c = Image.new("RGBA", (aw, h), col + (255,)); base_c.putalpha(m)
        ring = contorno(base_c, 12, self.PAPEL)
        ring2 = contorno(ring, 6, self.INK)
        S2 = sombra_suave(ring2, 10, 80, 10)
        pegar(im, S2, cx, cy, 0)

    def tarjeta(self, im, txt, cx, y, w, size=46, ang=0, seed=0, maxh=None, pad=38, inter=1.28):
        f, ls, s = ajustar(txt, self.FUENTE_C, w - 2 * pad, (maxh or 2000) - 2 * pad, size, 26, inter)
        capa = capa_texto(ls, f, self.INK, "left", int(s * inter))
        h = capa.height + 2 * pad
        S = Image.new("RGBA", (w + 20, h + 20), (0, 0, 0, 0))
        with AA(S) as aa:
            aa.rect((10, 10, w + 10, h + 10), fill=self.PAPEL + (255,), outline=self.INK + (255,), w=5, r=14)
            aa.rect((24, 24, w - 4, h - 4), outline=self.C1 + (255,), w=3, r=8)
        S.paste(capa, (10 + pad, 10 + pad), capa)
        pegar(im, sombra_suave(S, 10, 80, 8), cx, y + h // 2, ang)
        return (cx - w // 2, y, cx + w // 2, y + h)

    def numero(self, im, n, cx, cy, r=78, fondo=None, tinta_c=None, ang=-8):
        with AA(im, (cx - r - 12, cy - r - 12, cx + r + 12, cy + r + 12)) as aa:
            aa.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(fondo or self.C1) + (255,), outline=self.INK + (255,), w=6)
            aa.ellipse((cx - r + 12, cy - r + 12, cx + r - 12, cy + r - 12), outline=self.PAPEL + (255,), w=3)
        T(im, str(n), "dm", int(r * 1.1), tinta_c or self.PAPEL, cx, cy + 2, "cm")

    def deco(self, im, seed=0, n=3):
        x0, y0, w, h = marco()
        for (x, y) in ((x0 + w - 18, y0 + h * 0.52), (x0 + 14, y0 + h * 0.6)):
            with AA(im, (x - 26, y - 26, x + 26, y + 26)) as aa:
                chispa(aa, x, y, 14, self.INK + (200,))

    def boton(self, im, txt, cx, cy, w):
        bh = 98
        S = Image.new("RGBA", (w + 20, bh + 20), (0, 0, 0, 0))
        with AA(S) as aa:
            aa.rect((10, 10, w + 10, bh + 10), fill=self.C1 + (255,), outline=self.INK + (255,), w=6, r=49)
            aa.rect((22, 22, w - 2, bh - 2), outline=self.PAPEL + (255,), w=3, r=38)
        T(S, txt, "dm", 40, self.PAPEL, 10 + w // 2, 10 + bh // 2 + 2, "cm", maxw=w - 70)
        pegar(im, sombra_suave(S, 8, 80, 8), cx, cy, 0)

    def lista_card(self, im, items, cx, y, w, seed, size):
        x0, y0, fw, fh = marco()
        pad = 40
        f, ls, s = ajuste_items(items, "fredm", w - 2 * pad - 70, int(fh * 0.46), 50, 28, 1.3)
        ai = int(s * 1.6)
        ph = ai * len(items) + pad * 2 + 70
        S = Image.new("RGBA", (w + 20, ph + 20), (0, 0, 0, 0))
        with AA(S) as aa:
            aa.rect((10, 10, w + 10, ph + 10), fill=self.PAPEL + (255,), outline=self.INK + (255,), w=5, r=14)
            aa.rect((24, 24, w - 4, ph - 4), outline=self.C1 + (255,), w=3, r=8)
        T(S, "—  MENÚ  —", "dm", 40, self.C1, 10 + w // 2, 10 + pad + 14, "ct")
        for i, it in enumerate(items):
            yy = 10 + pad + 70 + i * ai
            with AA(S, (10 + pad, yy, 10 + pad + 50, yy + 50)) as aa:
                chispa(aa, 10 + pad + 20, yy + 28, 18, self.C1 + (255,))
            T(S, it, "fredm", s, self.INK, 10 + pad + 56, yy + 4, "lt", maxw=w - 2 * pad - 70)
        pegar(im, sombra_suave(S, 10, 80, 8), cx, y + ph // 2, -0.6)
        return (cx - w // 2, y, cx + w // 2, y + ph)

    def sub(self, im, txt, x, y, maxw, size=56):
        return T(im, txt, "dmi", size, self.INK, x, y, "lt", maxw=maxw, align="left")


# =====================================================================  RISO / POP
class Riso(Lay):
    INK = (22, 20, 70); PAPEL = (255, 247, 232); BG = (255, 98, 150)
    C1 = (30, 70, 235); C2 = (255, 226, 60); C3 = (255, 98, 150)
    FUENTE_T = "bebas"; FUENTE_C = "fredm"; FUENTE_S = "fred"; PIE = "num"; G = 10; ESC_T = 1.5; PADW = 16

    def base(self, seed=1):
        im = Image.new("RGB", (W, H()), self.BG)
        # gradiente de puntos tipo trama
        S = 2
        m = Image.new("L", (W * S, H() * S), 0)
        d = ImageDraw.Draw(m)
        paso = 36
        hh = H()
        for y in range(0, hh + paso, paso):
            for x in range(-paso, W + paso, paso):
                xo = x + (paso // 2 if (y // paso) % 2 else 0)
                t = y / hh
                r = 1 + 11 * (t ** 1.3)
                d.ellipse(((xo - r) * S, (y - r) * S, (xo + r) * S, (y + r) * S), fill=255)
        m = m.resize((W, hh), Image.LANCZOS)
        im.paste(Image.new("RGB", (W, hh), _oscuro(self.BG, 46)), (0, 0), m.point(lambda v: int(v * 0.55)))
        return grano(im, 12, 0.35)

    def tira(self, im, txt, cx, cy, size, fondo=None, tinta_c=None, ang=0, maxw=900, seed=0, align="center", fuente=None):
        fondo = fondo or self.PAPEL; tinta_c = tinta_c or self.INK
        size = int(size * 1.5) if (fuente or self.FUENTE_T) == "bebas" else size
        f, ls, s = ajustar(txt, fuente or self.FUENTE_T, maxw - 20, 800, size, 26, 0.98)
        col = tinta_c if fondo in (self.PAPEL,) else self.INK
        txt_col = self.PAPEL if fondo in (self.C1, self.C3) and tinta_c == self.PAPEL else self.INK
        capa = capa_texto(ls, f, txt_col, align, int(s * 0.98), stroke=0, sombra=(9, 9, fondo if fondo not in (self.PAPEL,) else self.C2))
        if fondo == self.PAPEL:
            capa = capa_texto(ls, f, self.INK, align, int(s * 0.98), sombra=(9, 9, self.C2 if self.BG != self.C2 else self.C3))
        bb = poner(im, capa, cx, cy, "cm", ang)
        return bb

    def bloque(self, im, cx, cy, w, h, col, ang=0, seed=0):
        d = int(min(w, h) * 1.02)
        S = Image.new("RGBA", (d + 60, d + 60), (0, 0, 0, 0))
        with AA(S) as aa:
            aa.ellipse((44, 44, d + 44, d + 44), outline=self.INK + (255,), w=5)
            aa.ellipse((30, 30, d + 30, d + 30), fill=col + (255,))
        # puntos claros en la mitad inferior
        dd = ImageDraw.Draw(S)
        for yy in range(30 + d // 2, 30 + d, 26):
            for xx in range(30, 30 + d, 26):
                rr = 2 + 7 * ((yy - 30 - d // 2) / (d / 2))
                cxx = xx + (13 if ((yy - 30) // 26) % 2 else 0)
                if (cxx - 30 - d / 2) ** 2 + (yy - 30 - d / 2) ** 2 < (d / 2 - 14) ** 2:
                    dd.ellipse((cxx - rr, yy - rr, cxx + rr, yy + rr), fill=_oscuro(col, 38))
        pegar(im, S, cx, cy, 0)

    def tarjeta(self, im, txt, cx, y, w, size=46, ang=0, seed=0, maxh=None, pad=34, inter=1.3):
        f, ls, s = ajustar(txt, self.FUENTE_C, w - 2 * pad - 14, (maxh or 2000) - 2 * pad, size, 26, inter)
        capa = capa_texto(ls, f, self.INK, "left", int(s * inter))
        h = capa.height + 2 * pad
        S, p = _caja(w, h, self.PAPEL, self.INK, 4, 12, r=6, sombra_col=self.C1 if self.BG != self.C1 else self.C2)
        S.paste(capa, (p + pad, p + pad), capa)
        pegar(im, S, cx, y + h // 2, ang)
        return (cx - w // 2, y, cx + w // 2, y + h)

    def numero(self, im, n, cx, cy, r=78, fondo=None, tinta_c=None, ang=-8):
        d = r * 2
        S = Image.new("RGBA", (d + 40, d + 40), (0, 0, 0, 0))
        with AA(S) as aa:
            aa.ellipse((26, 26, d + 26, d + 26), fill=self.INK + (255,))
            aa.ellipse((14, 14, d + 14, d + 14), fill=(fondo or self.C2) + (255,), outline=self.INK + (255,), w=4)
        T(S, str(n), "bebas", int(r * 1.5), tinta_c or self.INK, 14 + r, 14 + r + 6, "cm")
        pegar(im, S, cx, cy, ang)

    def deco(self, im, seed=0, n=3):
        r = random.Random(seed)
        x0, y0, w, h = marco()
        for _ in range(n):
            x = r.randint(x0 + 30, x0 + w - 30); y = r.randint(y0 + 30, y0 + h - 70)
            with AA(im, (x - 30, y - 30, x + 30, y + 30)) as aa:
                aa.line([(x - 16, y), (x + 16, y)], self.INK + (255,), 6)
                aa.line([(x, y - 16), (x, y + 16)], self.INK + (255,), 6)

    def boton(self, im, txt, cx, cy, w):
        bh = 98
        S, p = _caja(w, bh, self.INK, self.INK, 4, 12, r=49, sombra_col=self.C2)
        T(S, txt, "fred", 40, self.PAPEL, p + w // 2, p + bh // 2 + 2, "cm", maxw=w - 70)
        pegar(im, S, cx, cy, -1)

    def lista_card(self, im, items, cx, y, w, seed, size):
        x0, y0, fw, fh = marco()
        pad = 30
        f, ls, s = ajuste_items(items, "fredm", w - 2 * pad - 110, int(fh * 0.46), 50, 28, 1.3)
        ai = int(s * 1.6)
        ph = ai * len(items) + pad * 2
        S, p = _caja(w, ph, self.PAPEL, self.INK, 4, 12, r=6, sombra_col=self.C1 if self.BG != self.C1 else self.C2)
        for i, it in enumerate(items):
            yy = p + pad + i * ai
            T(S, str(i + 1), "bebas", int(s * 1.5), self.C1 if self.BG != self.C1 else self.C2, p + pad, yy + ai // 2 - 4, "lm")
            T(S, it, "fredm", s, self.INK, p + pad + 74, yy + ai // 2, "lm", maxw=w - 2 * pad - 100)
        pegar(im, S, cx, y + ph // 2, -0.6)
        return (cx - w // 2, y, cx + w // 2, y + ph)

    def sub(self, im, txt, x, y, maxw, size=50):
        return T(im, txt, "fred", size, self.INK, x, y, "lt", maxw=maxw, align="left")


# =====================================================================  CUADERNO
class Cuaderno(Lay):
    INK = (30, 40, 90); PAPEL = (255, 250, 150); BG = (252, 249, 240)
    C1 = (220, 50, 40); C2 = (255, 214, 90); C3 = (110, 190, 130)
    FUENTE_T = "marker"; FUENTE_C = "caveat"; FUENTE_S = "caveat"; PIE = "flecha"; G = 9
    NOTAS = [(255, 236, 120), (255, 178, 196), (170, 224, 170), (170, 210, 250)]

    def base(self, seed=1):
        im = cuadricula(self.BG, (196, 218, 238), 54, 2, (13, 7))
        im = grano(im, 8, 0.25)
        d = ImageDraw.Draw(im)
        d.line((92, 0, 92, H()), fill=(240, 150, 150), width=3)
        for y in range(120, H() - 100, 420):
            d.ellipse((30, y, 62, y + 32), fill=(150, 150, 150))
            d.ellipse((34, y + 3, 58, y + 27), fill=(120, 120, 120))
        _fantasma(im, (228, 238, 248), "RECETA", "marker", 300)
        return im

    def tira(self, im, txt, cx, cy, size, fondo=None, tinta_c=None, ang=0, maxw=900, seed=0, align="center", fuente=None):
        size = int(size * 0.92)
        f, ls, s = ajustar(txt, fuente or self.FUENTE_T, maxw - 30, 700, size, 26, 1.08)
        col = self.C1 if fondo == self.C1 else self.INK
        capa = capa_texto(ls, f, col, align, int(s * 1.08))
        bb = poner(im, capa, cx, cy, "cm", ang)
        marcador(im, (bb[0] + 6, bb[1] + int((bb[3] - bb[1]) * 0.42), bb[2] - 6, bb[3] - 6), (255, 240, 100) if fondo != self.C1 else (255, 214, 210), seed, 6, 255)
        capa = capa_texto(ls, f, col, align, int(s * 1.08))
        bb = poner(im, capa, cx, cy, "cm", ang)
        subrayado(im, bb[0] + 10, bb[2] - 10, bb[3] + 2, self.C1, 6, seed)
        return (bb[0], bb[1], bb[2], bb[3] + 12)

    def bloque(self, im, cx, cy, w, h, col, ang=0, seed=0):
        nota = self.NOTAS[seed % 4]
        n = nota_adhesiva(int(w), int(h), nota, ang, seed)
        pegar(im, n, cx, cy, 0)
        pegar(im, cinta(140, 44, (250, 224, 130), 6), cx, cy - h / 2 + 4)

    def tarjeta(self, im, txt, cx, y, w, size=46, ang=0, seed=0, maxh=None, pad=34, inter=1.18):
        size = int(size * 1.22)
        f, ls, s = ajustar(txt, "caveat", w - 2 * pad, (maxh or 2000) - 2 * pad, size, 30, inter)
        capa = capa_texto(ls, f, self.INK, "left", int(s * inter))
        h = capa.height + 2 * pad
        nota = nota_adhesiva(w, h, self.NOTAS[seed % 4], ang, seed)
        pegar(im, nota, cx, y + h // 2, 0)
        im.paste(capa, (cx - w // 2 + pad, y + pad), capa)
        pegar(im, cinta(130, 40, (250, 224, 130), -8), cx, y + 4)
        return (cx - w // 2, y, cx + w // 2, y + h)

    def numero(self, im, n, cx, cy, r=78, fondo=None, tinta_c=None, ang=-8):
        bb = T(im, str(n), "marker", int(r * 1.5), self.INK, cx, cy, "cm")
        circulo_mano(im, (cx - r, cy - r, cx + r, cy + r), self.C1, 8, int(cx))

    def deco(self, im, seed=0, n=3):
        r = random.Random(seed)
        x0, y0, w, h = marco()
        for _ in range(n):
            x = r.randint(x0 + 30, x0 + w - 30); y = r.randint(y0 + 30, y0 + h - 70)
            with AA(im, (x - 30, y - 30, x + 30, y + 30)) as aa:
                chispa(aa, x, y, r.randint(11, 16), self.C1 + (190,))

    def boton(self, im, txt, cx, cy, w):
        bh = 96
        bb = T(im, txt, "marker", 40, self.INK, cx, cy, "cm", maxw=w - 60)
        marcador(im, (bb[0], bb[1] + 10, bb[2], bb[3] - 6), (255, 236, 120), 3, 18, 255)
        bb = T(im, txt, "marker", 40, self.INK, cx, cy, "cm", maxw=w - 60)
        circulo_mano(im, (bb[0] - 40, bb[1] - 26, bb[2] + 40, bb[3] + 26), self.C1, 7, 5, 1.04)

    def lista_card(self, im, items, cx, y, w, seed, size):
        x0, y0, fw, fh = marco()
        f, ls, s = ajuste_items(items, "caveat", w - 210, int(fh * 0.46), size + 6, 34, 1.06)
        ai = int(s * 1.42)
        ph = ai * len(items) + 70
        pg = Image.new("RGBA", (w, ph), (255, 255, 255, 255))
        pg = rasgado(w, ph, (255, 255, 255), seed, amp=5, lados="tb")
        pegar(im, sombra_suave(pg, 12, 90, 9), cx, y + ph // 2, 0.6)
        for i, it in enumerate(items):
            yy = y + 36 + i * ai
            cx0 = cx - w // 2 + 40
            with AA(im, (cx0 - 6, yy - 6, cx0 + 64, yy + 66)) as aa:
                aa.rect((cx0, yy + 6, cx0 + 44, yy + 50), outline=self.INK + (255,), w=5, r=8)
                aa.line([(cx0 + 8, yy + 26), (cx0 + 20, yy + 42), (cx0 + 54, yy - 4)], self.C1 + (255,), 8)
            T(im, it, "caveat", s, self.INK, cx0 + 76, yy + 2, "lt", maxw=w - 210)
        return (cx - w // 2, y, cx + w // 2, y + ph)

    def sub(self, im, txt, x, y, maxw, size=62):
        bb = T(im, txt, "caveat", size, self.INK, x, y, "lt", maxw=maxw, align="left")
        subrayado(im, bb[0], bb[2], bb[3] + 2, self.C1, 5, 2)
        return bb
