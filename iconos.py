"""Biblioteca de ilustraciones planas (stickers vectoriales) dibujadas con código.
icono(nombre, size) -> RGBA con contorno oscuro. Sirven cuando no hay foto del plato."""
import math
from estilos import *
import estilos as E

INK = (32, 24, 20)
O = INK + (255,)
GW = 11


def P(c, a=255):
    c = tuple(c)
    return c if len(c) == 4 else c + (a,)


def _union(aa, circulos, fill, outline=O, w=GW):
    for cx, cy, r in circulos:
        aa.ellipse((cx - r - w / 2, cy - r - w / 2, cx + r + w / 2, cy + r + w / 2), fill=outline)
    for cx, cy, r in circulos:
        aa.ellipse((cx - r, cy - r, cx + r, cy + r), fill=fill)


def _bez_ribbon(p0, p1, p2, w0, w1, n=30):
    pts = bezier(p0, p1, p2, n)
    L, R = [], []
    for i, (x, y) in enumerate(pts):
        j = min(i + 1, len(pts) - 1); k = max(i - 1, 0)
        dx, dy = pts[j][0] - pts[k][0], pts[j][1] - pts[k][1]
        l = math.hypot(dx, dy) or 1
        nx, ny = -dy / l, dx / l
        t = i / n
        ww = w0 + (w1 - w0) * t
        L.append((x + nx * ww, y + ny * ww)); R.append((x - nx * ww, y - ny * ww))
    return L + R[::-1]


def limon(aa):
    aa.ellipse((45, 45, 355, 355), fill=P((250, 214, 60)), outline=O, w=GW)
    aa.ellipse((82, 82, 318, 318), fill=P((255, 243, 168)))
    for i in range(8):
        a = math.pi / 8 + i * math.pi / 4
        pts = [(200, 200), (200 + 112 * math.cos(a - 0.26), 200 + 112 * math.sin(a - 0.26)),
               (200 + 112 * math.cos(a + 0.26), 200 + 112 * math.sin(a + 0.26))]
        aa.poly(pts, fill=P((252, 226, 105)))
    aa.ellipse((186, 186, 214, 214), fill=P((250, 214, 60)))


def papa(aa):
    for (cx, cy, ang, col) in ((180, 250, -18, (240, 190, 70)), (225, 185, 14, (246, 204, 88)), (170, 130, -6, (236, 180, 64))):
        a = math.radians(ang)
        pts = []
        for t in range(0, 181, 12):
            tt_ = math.radians(t)
            pts.append((math.cos(tt_) * 130, -math.sin(tt_) * 60))
        for t in range(180, 361, 12):
            tt_ = math.radians(t)
            pts.append((math.cos(tt_) * 130, -math.sin(tt_) * 34 - 12))
        rp = [(cx + x * math.cos(a) - y * math.sin(a), cy + x * math.sin(a) + y * math.cos(a)) for x, y in pts]
        aa.poly(rp, fill=P(col), outline=O, w=GW - 2)
        for dx in (-50, -5, 45):
            x, y = dx, -10
            aa.ellipse((cx + x * math.cos(a) - y * math.sin(a) - 6, cy + x * math.sin(a) + y * math.cos(a) - 6,
                        cx + x * math.cos(a) - y * math.sin(a) + 6, cy + x * math.sin(a) + y * math.cos(a) + 6), fill=P((196, 136, 40)))


def tomate(aa):
    aa.ellipse((55, 85, 345, 345), fill=P((224, 48, 36)), outline=O, w=GW)
    aa.ellipse((100, 125, 150, 175), fill=P((255, 255, 255, 140)))
    estrella(aa, 200, 100, 70, 26, 5, fill=P((72, 160, 72)), outline=O, w=GW - 3, rot=-math.pi / 2)


def chile(aa):
    pts = _bez_ribbon((120, 100), (330, 110), (300, 340), 44, 4)
    aa.poly(pts, fill=P((226, 40, 28)), outline=O, w=GW)
    aa.poly([(92, 70), (150, 70), (158, 118), (104, 124)], fill=P((72, 160, 72)), outline=O, w=GW - 3)
    aa.line([(150, 130), (250, 140), (284, 240)], P((255, 255, 255, 120)), 10)


def hoja(aa):
    up = bezier((80, 320), (120, 120), (330, 70), 30)
    dn = bezier((330, 70), (330, 280), (80, 320), 30)
    aa.poly(up + dn, fill=P((84, 168, 70)), outline=O, w=GW)
    aa.line([(85, 315), (325, 76)], P((40, 110, 40)), 8)
    for t in (0.3, 0.5, 0.7):
        x = 85 + 240 * t; y = 315 - 239 * t
        aa.line([(x, y), (x + 40, y + 14)], P((40, 110, 40)), 6)
        aa.line([(x, y), (x - 10, y - 46)], P((40, 110, 40)), 6)


def ajo(aa):
    pts = bezier((200, 40), (30, 170), (90, 340), 30) + bezier((90, 340), (200, 380), (310, 340), 20)[1:] + bezier((310, 340), (370, 170), (200, 40), 30)[1:]
    aa.poly(pts, fill=P((250, 240, 218)), outline=O, w=GW)
    for c in ((120, 200), (200, 130), (280, 200)):
        aa.line(bezier((200, 50), (c[0], c[1]), (200 + (c[0] - 200) * 0.6, 345), 20), P((205, 185, 150)), 7)


def cebolla(aa):
    pts = bezier((200, 40), (20, 170), (90, 340), 30) + bezier((90, 340), (200, 380), (310, 340), 20)[1:] + bezier((310, 340), (380, 170), (200, 40), 30)[1:]
    aa.poly(pts, fill=P((214, 130, 170)), outline=O, w=GW)
    for c in (90, 150, 210, 270, 330):
        aa.line(bezier((200, 50), (c * 0.85 + 30, 200), (200 + (c - 200) * 0.45, 350), 20), P((240, 190, 214)), 7)
    aa.poly([(190, 44), (210, 44), (214, 8), (186, 8)], fill=P((160, 100, 50)), outline=O, w=GW - 4)


def fuego(aa):
    f1 = [(200, 20), (250, 90), (300, 140), (340, 220), (320, 300), (260, 360), (200, 378), (140, 360), (80, 300), (60, 220), (100, 150), (130, 190), (150, 120), (175, 80)]
    aa.poly(f1, fill=P((255, 120, 30)), outline=O, w=GW)
    f2 = [(200, 150), (236, 210), (268, 260), (255, 320), (200, 350), (145, 320), (132, 262), (160, 230), (178, 190)]
    aa.poly(f2, fill=P((255, 210, 60)))
    f3 = [(200, 250), (225, 290), (218, 330), (200, 345), (182, 330), (175, 290)]
    aa.poly(f3, fill=P((255, 245, 180)))


def copo(aa):
    for col, w in ((O, 30), (P((150, 210, 250)), 16)):
        for i in range(6):
            a = math.pi / 3 * i
            dx, dy = math.cos(a), math.sin(a)
            aa.line([(200, 200), (200 + 160 * dx, 200 + 160 * dy)], col, w)
            for r in (90, 125):
                px, py = 200 + r * dx, 200 + r * dy
                for s in (-1, 1):
                    b = a + s * 0.85
                    aa.line([(px, py), (px + 46 * math.cos(b), py + 46 * math.sin(b))], col, w)


def termometro(aa):
    aa.rect((155, 30, 245, 270), fill=P((255, 255, 255)), outline=O, w=GW, r=45)
    aa.ellipse((120, 210, 280, 370), fill=P((255, 255, 255)), outline=O, w=GW)
    aa.ellipse((150, 240, 250, 340), fill=P((226, 48, 36)))
    aa.rect((186, 90, 214, 260), fill=P((226, 48, 36)), r=14)
    for y in (80, 120, 160, 200):
        aa.line([(262, y), (310, y)], O, 9)


def reloj(aa):
    aa.ellipse((40, 40, 360, 360), fill=P((255, 255, 255)), outline=O, w=GW)
    for i in range(12):
        a = math.pi / 6 * i
        aa.line([(200 + 130 * math.cos(a), 200 + 130 * math.sin(a)), (200 + 148 * math.cos(a), 200 + 148 * math.sin(a))], O, 8)
    aa.line([(200, 200), (200, 100)], O, 14)
    aa.line([(200, 200), (268, 240)], P((226, 48, 36)), 12)
    aa.ellipse((184, 184, 216, 216), fill=O)


def calendario(aa):
    aa.rect((40, 60, 360, 350), fill=P((255, 255, 255)), outline=O, w=GW, r=26)
    aa.rect((40, 60, 360, 150), fill=P((226, 48, 36)), outline=O, w=GW, r=26)
    aa.rect((44, 110, 356, 152), fill=P((226, 48, 36)))
    for x in (110, 290):
        aa.rect((x - 12, 30, x + 12, 96), fill=O, r=12)


def queso(aa):
    aa.poly([(40, 310), (360, 310), (360, 110)], fill=P((255, 204, 58)), outline=O, w=GW)
    for cx, cy, r in ((260, 240, 28), (170, 280, 20), (320, 170, 18), (300, 285, 14)):
        aa.ellipse((cx - r, cy - r, cx + r, cy + r), fill=P((230, 168, 30)), outline=O, w=7)


def cuchillo(aa):
    aa.poly([(178, 20), (238, 54), (238, 250), (178, 250)], fill=P((216, 224, 230)), outline=O, w=GW)
    aa.line([(200, 50), (200, 230)], P((255, 255, 255, 200)), 8)
    aa.rect((172, 246, 244, 384), fill=P((122, 70, 40)), outline=O, w=GW, r=16)
    for y in (280, 330):
        aa.ellipse((198, y - 7, 218, y + 13), fill=P((230, 200, 140)))


def espiral_sal(aa, col=(206, 98, 66)):
    pts = []
    for i in range(0, 361, 4):
        t = i / 360
        r = 30 + 110 * t
        a = t * 4.6 * math.pi
        pts.append((200 + r * math.cos(a), 200 + r * math.sin(a)))
    aa.line(pts, O, 50)
    aa.line(pts, P(col), 34)
    aa.line([(x, y - 6) for x, y in pts], P((236, 140, 100, 150)), 10)


def sarten(aa):
    aa.rect((290, 192, 392, 226), fill=P((74, 74, 80)), outline=O, w=GW - 2, r=14)
    aa.ellipse((40, 60, 320, 340), fill=P((62, 62, 68)), outline=O, w=GW)
    aa.ellipse((70, 88, 290, 312), fill=P((36, 36, 40)))
    pts = []
    for i in range(0, 361, 4):
        t = i / 360; r = 14 + 74 * t; a = t * 4.2 * math.pi
        pts.append((180 + r * math.cos(a), 200 + r * math.sin(a)))
    aa.line(pts, P((206, 98, 66)), 28)


def pan_baguette(aa):
    aa.rect((25, 130, 375, 270), fill=P((236, 176, 100)), outline=O, w=GW, r=68)
    for x in (95, 160, 225, 290):
        aa.line([(x, 160), (x + 38, 240)], P((252, 218, 150)), 18)


def sandwich(aa, rx=160, relleno=(255, 240, 200)):
    top = [(200 + rx * math.cos(math.radians(t)), 205 - 110 * math.sin(math.radians(t))) for t in range(180, 361, 6)]
    top = [(200 + rx * math.cos(math.radians(t)), 205 + 110 * math.sin(math.radians(t))) for t in range(180, 361, 6)]
    aa.poly(top, fill=P((226, 172, 96)), outline=O, w=GW)
    bot = [(200 + rx * math.cos(math.radians(t)), 240 + 62 * math.sin(math.radians(t))) for t in range(0, 181, 6)]
    aa.poly(bot, fill=P((226, 172, 96)), outline=O, w=GW)
    aa.rect((200 - rx + 5, 205, 200 + rx - 5, 242), fill=P(relleno), outline=O, w=GW - 3, r=10)
    for cx in (110, 170, 230, 290):
        aa.ellipse((cx - 24, 210, cx + 24, 244), fill=P((206, 70, 52)), outline=O, w=7)
    for x, y in ((150, 140), (200, 115), (250, 145), (190, 160)):
        aa.ellipse((x - 6, y - 4, x + 6, y + 4), fill=P((252, 228, 170)))


def pizza(aa):
    aa.poly([(58, 112), (342, 112), (200, 362)], fill=P((250, 200, 80)), outline=O, w=GW)
    aa.rect((42, 70, 358, 130), fill=P((226, 160, 84)), outline=O, w=GW, r=26)
    for cx, cy in ((150, 175), (240, 195), (198, 268)):
        aa.ellipse((cx - 32, cy - 32, cx + 32, cy + 32), fill=P((204, 62, 48)), outline=O, w=8)
        aa.ellipse((cx - 10, cy - 12, cx + 4, cy - 2), fill=P((230, 110, 90)))
    aa.ellipse((182, 152, 200, 168), fill=P((72, 160, 72)))


def check(aa):
    aa.ellipse((40, 40, 360, 360), fill=P((70, 170, 92)), outline=O, w=GW)
    aa.line([(110, 205), (175, 268), (295, 130)], O, 44)
    aa.line([(110, 205), (175, 268), (295, 130)], P((255, 255, 255)), 28)


def cruz(aa):
    aa.ellipse((40, 40, 360, 360), fill=P((226, 54, 42)), outline=O, w=GW)
    for a, b in (((125, 125), (275, 275)), ((275, 125), (125, 275))):
        aa.line([a, b], O, 44)
    for a, b in (((125, 125), (275, 275)), ((275, 125), (125, 275))):
        aa.line([a, b], P((255, 255, 255)), 28)


def estrella_i(aa):
    estrella(aa, 200, 205, 175, 80, 5, fill=P((255, 210, 50)), outline=O, w=GW, rot=-math.pi / 2)


def corazon(aa):
    pts = []
    for i in range(0, 361, 6):
        t = math.radians(i)
        x = 16 * math.sin(t) ** 3
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        pts.append((200 + x * 10.5, 185 - y * 10.5))
    aa.poly(pts, fill=P((230, 50, 80)), outline=O, w=GW)
    aa.ellipse((100, 100, 140, 138), fill=P((255, 255, 255, 150)))


def medalla(aa):
    aa.poly([(120, 230), (90, 380), (150, 350), (190, 384), (200, 230)], fill=P((226, 54, 42)), outline=O, w=GW - 3)
    aa.poly([(280, 230), (310, 380), (250, 350), (210, 384), (200, 230)], fill=P((180, 30, 26)), outline=O, w=GW - 3)
    aa.ellipse((50, 30, 350, 330), fill=P((255, 200, 50)), outline=O, w=GW)
    aa.ellipse((88, 68, 312, 292), fill=P((255, 226, 110)), outline=O, w=7)


def bocadillo(aa):
    aa.poly([(100, 270), (80, 370), (190, 280)], fill=P((255, 255, 255)), outline=O, w=GW)
    aa.rect((30, 50, 370, 290), fill=P((255, 255, 255)), outline=O, w=GW, r=60)
    aa.rect((90, 268, 200, 290), fill=P((255, 255, 255)))
    for x in (120, 200, 280):
        aa.ellipse((x - 18, 152, x + 18, 188), fill=O)


def lupa(aa):
    aa.line([(240, 240), (350, 350)], O, 70)
    aa.line([(240, 240), (350, 350)], P((122, 70, 40)), 46)
    aa.ellipse((40, 40, 270, 270), fill=P((196, 228, 250)), outline=O, w=GW + 4)
    aa.ellipse((80, 80, 130, 130), fill=P((255, 255, 255, 170)))


def pinzas(aa):
    for a, b in (((110, 372), (270, 40)), ((290, 372), (130, 40))):
        aa.line([a, b], O, 54)
    for a, b in (((110, 372), (270, 40)), ((290, 372), (130, 40))):
        aa.line([a, b], P((196, 204, 212)), 34)
    aa.ellipse((175, 170, 225, 220), fill=P((226, 54, 42)), outline=O, w=8)


def camion(aa):
    aa.rect((14, 100, 256, 280), fill=P((255, 255, 255)), outline=O, w=GW, r=14)
    aa.poly([(256, 150), (320, 150), (378, 214), (378, 280), (256, 280)], fill=P((226, 54, 42)), outline=O, w=GW)
    aa.poly([(278, 168), (314, 168), (350, 210), (278, 210)], fill=P((196, 228, 250)), outline=O, w=7)
    for cx in (90, 300):
        aa.ellipse((cx - 38, 252, cx + 38, 328), fill=O)
        aa.ellipse((cx - 14, 276, cx + 14, 304), fill=P((190, 190, 196)))
    aa.rect((50, 140, 110, 200), fill=P((226, 54, 42)), r=8)


def tienda(aa):
    aa.rect((50, 150, 350, 352), fill=P((250, 240, 215)), outline=O, w=GW, r=8)
    aa.rect((80, 210, 170, 352), fill=P((110, 150, 120)), outline=O, w=8)
    aa.rect((205, 210, 320, 300), fill=P((196, 228, 250)), outline=O, w=8)
    for i in range(6):
        x0 = 28 + i * 57
        col = P((226, 54, 42)) if i % 2 == 0 else P((255, 255, 255))
        aa.poly([(x0, 60), (x0 + 57, 60), (x0 + 57, 150), (x0, 150)], fill=col)
        aa.ellipse((x0, 122, x0 + 57, 178), fill=col)
    aa.line([(28, 60), (372, 60)], O, 10)
    aa.line([(28, 60), (28, 150)], O, 8); aa.line([(372, 60), (372, 150)], O, 8)


def codigo(aa):
    aa.rect((30, 80, 370, 320), fill=P((255, 255, 255)), outline=O, w=GW, r=12)
    import random
    r = random.Random(4)
    x = 62
    while x < 330:
        w_ = r.choice((6, 6, 10, 14));
        aa.rect((x, 110, x + w_, 270), fill=O)
        x += w_ + r.choice((6, 9, 12))


def caja(aa):
    aa.poly([(40, 130), (200, 200), (200, 352), (40, 282)], fill=P((196, 150, 96)), outline=O, w=GW)
    aa.poly([(360, 130), (200, 200), (200, 352), (360, 282)], fill=P((172, 128, 76)), outline=O, w=GW)
    aa.poly([(200, 58), (360, 130), (200, 200), (40, 130)], fill=P((226, 184, 124)), outline=O, w=GW)
    aa.poly([(178, 68), (232, 92), (112, 146), (60, 120)], fill=P((246, 222, 170)))


def olla(aa):
    aa.rect((30, 190, 82, 214), fill=P((80, 80, 88)), outline=O, w=8, r=8)
    aa.rect((318, 190, 370, 214), fill=P((80, 80, 88)), outline=O, w=8, r=8)
    aa.rect((62, 150, 338, 330), fill=P((120, 124, 134)), outline=O, w=GW, r=30)
    aa.rect((50, 128, 350, 172), fill=P((150, 154, 164)), outline=O, w=GW, r=20)
    aa.rect((176, 96, 224, 130), fill=O, r=12)
    aa.rect((92, 176, 120, 300), fill=P((255, 255, 255, 90)), r=12)


def nevera(aa):
    aa.rect((100, 20, 300, 380), fill=P((236, 244, 248)), outline=O, w=GW, r=26)
    aa.line([(100, 150), (300, 150)], O, 9)
    aa.rect((124, 60, 138, 120), fill=O, r=6)
    aa.rect((124, 180, 138, 260), fill=O, r=6)
    copo_mini = [(230, 250)]
    aa.line([(230, 215), (230, 285)], P((110, 180, 230)), 9); aa.line([(195, 250), (265, 250)], P((110, 180, 230)), 9)
    aa.line([(205, 225), (255, 275)], P((110, 180, 230)), 9); aa.line([(255, 225), (205, 275)], P((110, 180, 230)), 9)


def globo(aa):
    aa.ellipse((40, 40, 360, 360), fill=P((84, 160, 226)), outline=O, w=GW)
    for pts in ([(110, 120), (170, 100), (200, 150), (160, 210), (120, 190)], [(220, 190), (290, 170), (310, 240), (250, 300), (220, 250)],
                [(200, 70), (250, 80), (260, 120), (220, 110)]):
        aa.poly(pts, fill=P((94, 180, 94)), outline=O, w=6)


def brote(aa):
    aa.line([(200, 360), (200, 190)], O, 30)
    aa.line([(200, 360), (200, 190)], P((72, 140, 60)), 14)
    hj = bezier((200, 200), (100, 60), (40, 90), 20) + bezier((40, 90), (80, 230), (200, 200), 20)
    aa.poly(hj, fill=P((96, 180, 80)), outline=O, w=GW - 2)
    hj2 = bezier((200, 190), (300, 40), (370, 70), 20) + bezier((370, 70), (330, 210), (200, 190), 20)
    aa.poly(hj2, fill=P((120, 200, 90)), outline=O, w=GW - 2)


def frasco(aa):
    aa.rect((112, 70, 288, 116), fill=P((240, 190, 60)), outline=O, w=GW, r=12)
    aa.rect((102, 106, 298, 360), fill=P((216, 238, 244)), outline=O, w=GW, r=34)
    aa.rect((126, 170, 274, 300), fill=P((226, 54, 42)), outline=O, w=8, r=10)
    chispa(aa, 200, 235, 34, P((255, 240, 200)))


def lata(aa):
    aa.ellipse((80, 40, 320, 110), fill=P((200, 204, 212)), outline=O, w=GW)
    aa.rect((80, 75, 320, 330), fill=P((200, 204, 212)), outline=O, w=GW)
    aa.rect((83, 140, 317, 270), fill=P((226, 54, 42)))
    aa.ellipse((80, 295, 320, 365), fill=P((200, 204, 212)), outline=O, w=GW)
    aa.rect((83, 80, 317, 330), fill=P((200, 204, 212)))
    aa.rect((83, 140, 317, 270), fill=P((226, 54, 42)))
    aa.line([(80, 75), (80, 330)], O, GW); aa.line([(320, 75), (320, 330)], O, GW)
    aa.ellipse((80, 40, 320, 110), fill=P((216, 220, 226)), outline=O, w=GW)
    chispa(aa, 200, 205, 40, P((255, 240, 200)))


def aguacate(aa):
    _union(aa, [(200, 130, 88), (200, 235, 128)], P((96, 150, 70)))
    _union(aa, [(200, 135, 62), (200, 238, 100)], P((196, 224, 120)), outline=P((196, 224, 120)), w=0)
    aa.ellipse((160, 210, 240, 290), fill=P((140, 84, 50)), outline=O, w=8)


def flecha_g(aa):
    aa.poly([(40, 150), (220, 150), (220, 70), (370, 200), (220, 330), (220, 250), (40, 250)], fill=P((255, 210, 50)), outline=O, w=GW)


def rayo(aa):
    aa.poly([(230, 20), (90, 220), (180, 220), (150, 380), (320, 160), (220, 160)], fill=P((255, 210, 50)), outline=O, w=GW)


def bolsa(aa):
    aa.poly([(90, 120), (310, 120), (340, 360), (60, 360)], fill=P((226, 184, 120)), outline=O, w=GW)
    aa.line([(140, 120), (140, 70), (260, 70), (260, 120)], O, 12)
    chispa(aa, 200, 240, 54, P((255, 250, 235)))


def tenedor(aa):
    for x in (150, 185, 220, 255):
        aa.rect((x - 7, 30, x + 7, 170), fill=P((216, 224, 230)), outline=O, w=7, r=6)
    aa.rect((140, 140, 270, 200), fill=P((216, 224, 230)), outline=O, w=GW - 3, r=26)
    aa.rect((185, 190, 225, 380), fill=P((216, 224, 230)), outline=O, w=GW - 3, r=20)


def pasta_nido(aa):
    aa.ellipse((40, 130, 360, 350), fill=P((255, 250, 240)), outline=O, w=GW)
    for i in range(7):
        r = 100 - i * 12
        aa.ellipse((200 - r * 1.3, 240 - r * 0.6, 200 + r * 1.3, 240 + r * 0.6), outline=P((240, 200, 90)), w=11)
    aa.ellipse((165, 215, 235, 265), fill=P((226, 54, 42)), outline=O, w=7)


def cerveza(aa):
    aa.rect((260, 120, 350, 280), outline=O, w=GW + 4, r=40)
    aa.rect((70, 80, 290, 360), fill=P((250, 190, 50)), outline=O, w=GW, r=22)
    aa.rect((70, 40, 290, 130), fill=P((255, 255, 255)), outline=O, w=GW, r=34)
    for x, y in ((120, 200), (170, 250), (220, 210), (150, 300)):
        aa.ellipse((x - 9, y - 9, x + 9, y + 9), fill=P((255, 230, 140)))


def plato(aa):
    aa.ellipse((30, 30, 370, 370), fill=P((255, 255, 255)), outline=O, w=GW)
    aa.ellipse((80, 80, 320, 320), fill=P((240, 244, 248)), outline=P((200, 206, 214)), w=6)


def sol(aa):
    for i in range(14):
        a = math.pi * 2 / 14 * i
        aa.line([(200 + 120 * math.cos(a), 200 + 120 * math.sin(a)), (200 + 175 * math.cos(a), 200 + 175 * math.sin(a))], O, 30)
    for i in range(14):
        a = math.pi * 2 / 14 * i
        aa.line([(200 + 122 * math.cos(a), 200 + 122 * math.sin(a)), (200 + 170 * math.cos(a), 200 + 170 * math.sin(a))], P((255, 210, 50)), 16)
    aa.ellipse((90, 90, 310, 310), fill=P((255, 210, 50)), outline=O, w=GW)


ICONOS = {k: v for k, v in list(globals().items()) if callable(v) and k in (
    "limon papa tomate chile hoja ajo cebolla fuego copo termometro reloj calendario queso cuchillo espiral_sal sarten pan_baguette "
    "sandwich pizza check cruz estrella_i corazon medalla bocadillo lupa pinzas camion tienda codigo caja olla nevera globo brote "
    "frasco lata aguacate flecha_g rayo bolsa tenedor pasta_nido cerveza plato sol").split()}
ICONOS["estrella"] = estrella_i
ROT = {"cuchillo": 38, "pinzas": 0}


def icono(nombre, size=300, ang=None, contorno_blanco=0, sombra=True, **kw):
    S = 400
    L = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    with AA(L, k=3) as aa:
        ICONOS[nombre](aa, **kw)
    L = recortar(L)
    L = escalar(L, alto=size) if L.height >= L.width else escalar(L, ancho=size)
    a = ROT.get(nombre, 0) if ang is None else ang
    if a:
        L = rotar(L, a)
    if contorno_blanco:
        L = contorno(L, contorno_blanco, (255, 255, 255))
    return sombra_suave(L, 8, 70, 7) if sombra else L


if __name__ == "__main__":
    usar("ig")
    nombres = sorted(ICONOS)
    cols = 8
    cel = 200
    rows = (len(nombres) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * cel, rows * (cel + 30)), (235, 226, 205))
    d = ImageDraw.Draw(sheet)
    for i, n in enumerate(nombres):
        ic = icono(n, 150, sombra=False)
        x = (i % cols) * cel + (cel - ic.width) // 2
        y = (i // cols) * (cel + 30) + 10
        sheet.paste(ic, (x, y), ic)
        d.text(((i % cols) * cel + 10, (i // cols) * (cel + 30) + cel + 4), n, fill=(0, 0, 0), font=F("montm", 18))
    sheet.save("/tmp/iconos.jpg", quality=88)
    print(len(nombres), "iconos")
