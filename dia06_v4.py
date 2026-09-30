"""Día 6 v4: 5 formas de comerla — empaques grandes en cada lámina."""
import os
from PIL import Image
import generador as g
import disenos as D
from comunes import portada_packs, pegar_empaque_en
from contenido import WA, ENTREGA

ROJO = (196, 44, 26)


def dia(*a, post=None, **k):
    def f():
        im = D.lamina_dia(*a, **k)
        if post:
            im = pegar_empaque_en(im, *post[0], **post[1])
        return im
    return f


def plato_grande(dia_txt, forma, texto, foto, n, total, cy=0.5, cx=0.5, col=(238, 192, 52)):
    """Foto del plato a pantalla completa con el título encima."""
    from PIL import ImageDraw, ImageFilter
    from generador import W, anton, mont, pastilla, pie, terminar, CREMA, OSCURO, DORADO
    T, h, o = g.tt(), D.H(), D.oy()
    esc = W / foto.width
    hs = int(foto.height * esc)
    if hs < h and h / foto.height <= 1.95:
        b = D.llenar(foto, W, h, cx, cy).convert("RGBA")
        hs = h
        listo = True
    else:
        listo = False
    ph = foto.resize((W, hs), Image.LANCZOS).filter(ImageFilter.UnsharpMask(2, 60, 3)).convert("RGBA")
    if listo:
        pass
    elif hs >= h:
        y0 = int((hs - h) * cy)
        b = ph.crop((0, y0, W, y0 + h))
    else:
        b = D.llenar(foto, W, h, 0.5, 0.5).filter(ImageFilter.GaussianBlur(30)).convert("RGBA")
        b.alpha_composite(Image.new("RGBA", (W, h), (0, 0, 0, 70)))
        m = Image.new("L", (W, hs), 255)
        f = 70
        for k in range(f):
            v = int(255 * k / f)
            ImageDraw.Draw(m).line((0, k, W, k), fill=v)
            ImageDraw.Draw(m).line((0, hs - 1 - k, W, hs - 1 - k), fill=v)
        ph.putalpha(m)
        b.alpha_composite(ph, (0, int((h - hs) * (0.52 if T else 0.5))))
    b.alpha_composite(D.degradado_v(W, h, 0, int(h * (0.34 if T else 0.36)), (12, 6, 5), 225, 0))
    b.alpha_composite(D.degradado_v(W, h, int(h * (0.52 if T else 0.62)), h, (12, 6, 5), 0, 250))
    d = ImageDraw.Draw(b)
    pastilla(d, 70, o + (70 if T else 50), dia_txt, mont(32 if T else 30, "ExtraBold"), OSCURO, DORADO)
    ft = anton(210 if T else 185)
    tam = ft.size
    from generador import ancho
    while ancho(d, forma, anton(tam)) > W - 110:
        tam -= 6
    y = o + (150 if T else 130)
    d.text((66, y), forma, font=anton(tam), fill=CREMA, stroke_width=4, stroke_fill=(20, 10, 8))
    fc = mont(44 if T else 40, "SemiBold")
    lin = g._lineas(d, texto, fc, W - 160)
    fondo = 1490 if T else h - 120
    yy = fondo - len(lin) * int(fc.size * 1.4)
    for l in lin:
        d.text((80, yy), l, font=fc, fill=(250, 240, 226)); yy += int(fc.size * 1.4)
    if not T:
        pie(d, CREMA, n, total)
    return terminar(b)


def laminas():
    pasta = D.cargar("pasta.png")
    arepa = D.cargar("arepa_limpia.png")
    panini = D.cargar("panini_ref.png").crop((0, 0, 683, 405))
    pizza_ft = D.cargar("pizza.png")
    parri = D.cargar("parrilla_ref.png")
    pizza = Image.open(f"{D.FOT}/pizza_recorte.png").convert("RGBA")
    total = 7
    T = g.tt()
    return [
        lambda: portada_packs("5 FORMAS", "DE COMERLA", "ESTA SEMANA", ["UNA POR", "DÍA"],
                              [(1, -330, 50, -12, 0.66), (4, 330, 50, 12, 0.66), (3, -170, 20, -6, 0.78),
                               (2, 170, 20, 6, 0.78), (5, 0, -10, 0, 0.92)],
                              D.mesa_bg if False else (lambda h: D._mesa_oscura(h, 4, 70)), total),
        lambda: plato_grande("LUNES", "EN AREPA", "Asada y en rodajas, dentro de la arepa calientita. Desayuno venezolano con sabor siciliano.", arepa, 2, total, cy=0.12, cx=0.3),
        lambda: plato_grande("MARTES", "EN PASTA", "Dorada en trozos y mezclada con salsa de tomate. Lista en 20 minutos.", pasta, 3, total, cy=0.45, cx=0.5),
        lambda: plato_grande("MIÉRCOLES", "EN PANINI", "Con pimentones asados y pan crujiente. El almuerzo rápido que sí llena.", panini, 4, total),
        lambda: plato_grande("JUEVES", "EN PIZZA", "Sobre la masa, con queso y salsa. La pizza de jueves sube de nivel.", pizza_ft, 5, total),
        lambda: plato_grande("VIERNES A DOMINGO", "A LA PARRILLA", "Entera, en espiral y con los panas. La forma clásica de comerla.", parri, 6, total, cy=0.4),
        lambda: D.lamina_cierre_parrilla("¿CUÁL PRUEBAS\nPRIMERO?", ENTREGA + [WA], "PIDE DIRECTO CON NOSOTROS", total,
                                         fotos=(3, 4, 1), fondo="ambar"),
    ]


def render(salida="dia06_v4"):
    for fmt, carpeta in (("ig", salida), ("tt", salida + "_tt")):
        g.usar_formato(fmt)
        os.makedirs(carpeta, exist_ok=True)
        ims = []
        for i, f in enumerate(laminas(), 1):
            im = f()
            im.save(f"{carpeta}/{i:02d}.jpg", quality=90)
            ims.append(im)
        w = 300
        th = [im.resize((w, int(im.height * w / im.width))) for im in ims]
        S = Image.new("RGB", (len(th) * (w + 8), th[0].height), (20, 20, 20))
        for k, t in enumerate(th):
            S.paste(t, (k * (w + 8), 0))
        S.save(f"/tmp/dia06_v4_{fmt}.jpg", quality=85)
        print(fmt, len(ims))


if __name__ == "__main__":
    render()
