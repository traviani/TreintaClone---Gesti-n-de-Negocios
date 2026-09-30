"""Días 8 a 30 — diseño v3 (un estilo distinto por día, sin precios).
Uso: python3 dias_8_30.py 8 9 10   (renderiza esos días a diaNN_v3 y diaNN_v3_tt)"""
import sys
import estilos as E
import runner
from skins import Collage, Brutal, Revista, Italiano, Riso, Cuaderno

WA = E.WA
ENT = ["Delivery gratis desde 4 paquetes", "Despachos solo en Caracas"]
MAYOR = ["Atención por WhatsApp", "Despachamos en Caracas"]
BTN = f"ESCRÍBENOS · {WA}"


def cl(*items):
    return ("cluster", list(items))


def packs(*ns):
    k = len(ns)
    return cl(*[(n, (i - (k - 1) / 2) * 0.3, 0.04 * abs(i - (k - 1) / 2), 0.78, (i - (k - 1) / 2) * 9) for i, n in enumerate(ns)])


# ------------------------------------------------------------------ DÍA 8 · Brutal lima
def d08():
    S = Brutal(BG=(196, 255, 70), C1=(255, 84, 48), C2=(70, 110, 255), C3=(255, 130, 204), TXT=(16, 16, 16))
    T = 5
    return [
        lambda: S.portada(["MITO:", "TODAS LLEVAN", "NITRITOS"], "Desliza y te contamos la realidad.", 3, ["cruz", "lupa"], ["MITO", "O", "REALIDAD"], T, seed=81),
        lambda: S.vs("MITO VS. REALIDAD", ("MITO", ["Todas las salchichas llevan nitritos", "Sin conservantes se daña enseguida"]),
                     ("REALIDAD", ["La nuestra no lleva nitritos", "Congelada dura hasta 3 meses"]), 2, T, seed=82,
                     hero=cl(("frasco", -0.3, 0, 0.8, -6), ("nevera", 0.3, 0, 0.8, 6))),
        lambda: S.paso("?", "¿QUÉ SON LOS NITRITOS?", "Aditivos que se usan en muchos embutidos para conservar el color y alargar la vida del producto.", 3, T,
                       cl(("frasco", -0.1, 0, 0.8, -6), ("lupa", 0.26, 0.12, 0.55, 8)), ["cruz", "estrella"], v=0, seed=83, bloque_col=(70, 110, 255)),
        lambda: S.paso("", "¿QUÉ LLEVA LA NUESTRA?", "Carne seleccionada, especias y sabor. Molida, aderezada y embutida a mano.", 4, T, 2, ["hoja", "ajo"], v=1, seed=84, bloque_col=(255, 130, 204)),
        lambda: S.cierre("COMENTA OTRO\nMITO", ["Lo aclaramos en el próximo post", "Pide por WhatsApp"], BTN, [2, 5, 3], T, seed=85),
    ]


# ------------------------------------------------------------------ DÍA 9 · Cuaderno
def d09():
    S = Cuaderno()
    T = 6
    return [
        lambda: S.portada(["AREPA CON", "TRADIZIONALE"], "El desayuno venezolano con acento siciliano.",
                          cl((2, 0.12, 0, 0.9, 4), ("sandwich", -0.26, 0.3, 0.42, -8)), ["aguacate", "queso"], ["DESAYUNO", "10 MIN"], T, seed=91),
        lambda: S.lista("INGREDIENTES", ["1 Tradizionale", "2 arepas recién hechas", "Queso blanco rallado", "Aguacate (opcional)"], 2, T,
                        cl(("sandwich", -0.1, 0, 0.75, -4), ("queso", 0.28, 0.2, 0.4, 10), ("aguacate", -0.3, -0.25, 0.35, -10)), ["hoja", "tomate"], seed=92),
        lambda: S.paso("1", "ASA LA SALCHICHA", "En sartén o plancha a fuego medio, 12 a 15 minutos volteando, hasta que esté bien cocida.", 3, T,
                       cl(("sarten", 0, 0, 0.8, 0), ("fuego", 0.3, 0.3, 0.3, 8)), ["tomate", "hoja"], v=0, seed=93),
        lambda: S.paso("2", "CÓRTALA EN RODAJAS", "Rodajas finas para que quepan bien en la arepa.", 4, T,
                       cl(("espiral_sal", -0.12, 0, 0.7, 0), ("cuchillo", 0.25, 0.02, 0.7, 0)), ["limon", "hoja"], v=1, seed=94),
        lambda: S.paso("3", "RELLENA Y A COMER", "Arepa abierta, queso blanco, rodajas y aguacate si quieres.", 5, T,
                       cl(("sandwich", 0, 0, 0.85, 0), ("aguacate", -0.25, -0.3, 0.3, -10)), ["queso", "estrella"], v=2, seed=95, nota="¡buen provecho!"),
        lambda: S.cierre("PIDE TU\nTRADIZIONALE", ENT, BTN, [2, 5, 2], T, seed=96),
    ]


# ------------------------------------------------------------------ DÍA 10 · Riso hielo
def d10():
    S = Riso(BG=(84, 168, 255), C1=(255, 80, 140), C2=(255, 230, 80), C3=(255, 255, 255), INK=(16, 22, 80))
    T = 5
    return [
        lambda: S.portada(["¿NO LA VAS", "A USAR HOY?"], "Así se conserva sin perder sabor.", cl((1, 0.1, 0.05, 0.8, 4), ("copo", -0.32, -0.25, 0.4, -8)), ["nevera", "reloj"], ["FRESCA", "SIEMPRE"], T, seed=101),
        lambda: S.paso("3", "CONGELADA: HASTA 3 MESES", "Guárdala en su empaque al vacío, sin abrir, en el congelador.", 2, T,
                       cl(("nevera", 0, 0, 0.9, 0), ("copo", 0.3, -0.25, 0.4, 10)), ["copo", "estrella"], v=0, seed=102),
        lambda: S.paso("4°", "REFRIGERADA: MÁXIMO 3 DÍAS", "En la nevera a 4 °C o menos. Después de eso, al congelador.", 3, T,
                       cl(("termometro", -0.1, 0, 0.9, 0), ("calendario", 0.28, 0.1, 0.5, 8)), ["copo", "reloj"], v=1, seed=103),
        lambda: S.paso("", "CÓMO DESCONGELAR", "Pásala del congelador a la nevera la noche anterior. Nunca al sol ni en agua caliente.", 4, T,
                       cl(("nevera", -0.15, 0, 0.85, 0), ("reloj", 0.3, 0.15, 0.5, 6)), ["cruz", "sol"], v=2, seed=104),
        lambda: S.frase(["GUARDA", "ESTE POST"], "Y compártelo con quien siempre deja la carne afuera para descongelar.", 5, T, 4, ["corazon", "estrella"], seed=105),
    ]


# ------------------------------------------------------------------ DÍA 11 · Collage kraft
def d11():
    S = Collage(BG=(203, 168, 124))
    T = 4
    return [
        lambda: S.portada(["SE VIENE", "EL PUENTE"], "El lunes 12 es feriado. ¿Ya tienes el plan?", 5, ["fuego", "cerveza", "limon"], ["LUNES", "12", "FERIADO"], T, seed=111),
        lambda: S.lista("LISTA PARA LA PARRILLA", ["Salchichas (1 paquete por cada 2)", "Pan", "Carbón", "Bebidas frías", "Limón y ají"], 2, T,
                        cl(("cerveza", -0.22, 0, 0.7, -8), ("fuego", 0.22, 0.05, 0.6, 8), ("limon", 0.05, -0.3, 0.3, 0)), ["chile", "pan_baguette"], seed=112),
        lambda: S.paso("", "¿QUÉ SABORES LLEVAR?", "Parrillera para los clásicos, Peperoncino para los que piden picante y Tradizionale para los niños.", 3, T,
                       packs(5, 3, 2), ["fuego", "chile"], v=1, seed=113, bloque_col=(214, 57, 36)),
        lambda: S.cierre("PIDE HOY", ["Y tenla a tiempo para el puente", "Delivery gratis desde 4 paquetes"], BTN, [5, 3, 1], T, seed=114),
    ]


# ------------------------------------------------------------------ DÍA 12 · Revista terracota
def d12():
    S = Revista(BG=(240, 232, 216), C1=(166, 66, 40), C2=(222, 190, 140), C3=(110, 130, 90), NUM_REVISTA="Nº 12")
    T = 4
    return [
        lambda: S.portada(["LUNES", "FERIADO"], "Hoy no hay apuro. Cocina algo rico en casa.", cl(("papa", 0, 0.05, 0.9, -6), ("sol", 0.3, -0.3, 0.4, 0), ("limon", -0.3, 0.3, 0.35, 8)), ["hoja", "tomate"], ["SIN", "APURO"], T, seed=121),
        lambda: S.paso("", "UNA COMIDA SIN COMPLICACIONES", "Un plato al horno mientras descansas: salchicha con papas doradas.", 2, T,
                       cl(("papa", 0, 0, 0.85, -6), ("fuego", 0.3, 0.28, 0.32, 8)), ["limon", "hoja"], v=0, seed=122),
        lambda: S.paso("", "LA IDEA", "Papas en gajos, la espiral encima y 45 minutos de horno. Sirve con limón.", 3, T, ("foto", "espiral"), ["papa", "limon"], v=1, seed=123),
        lambda: S.cierre("¿QUÉ COCINAS\nHOY?", ["Comenta tu plan del feriado", "Pide por WhatsApp"], BTN, [2, 5], T, seed=124),
    ]


# ------------------------------------------------------------------ DÍA 13 · Brutal amarillo
def d13():
    S = Brutal(BG=(255, 222, 50), C1=(255, 84, 48), C2=(70, 110, 255), C3=(255, 130, 204))
    T = 4
    return [
        lambda: S.portada(["¿SABES LO", "QUE COMES?"], "Industrial vs. artesanal.", 4, ["lupa", "check"], ["LEE LA", "ETIQUETA"], T, seed=131),
        lambda: S.vs("LA DIFERENCIA", ("INDUSTRIAL (SUELE LLEVAR)", ["Nitritos y conservantes", "Rellenos y harinas", "Sabor a fábrica"]),
                     ("TRAVIANI", ["Sin nitritos ni conservantes químicos", "Sin gluten", "Hecha a mano en Caracas"]), 2, T, seed=132, hero=packs(1, 4, 5)),
        lambda: S.paso("", "SE NOTA EN LA PARRILLA", "Una salchicha artesanal se dora, no suelta agua y sabe a especias de verdad.", 3, T, ("foto", "espiral"), ["fuego", "estrella"], v=0, seed=133, bloque_col=(70, 110, 255)),
        lambda: S.cierre("HAZ LA\nPRUEBA", ENT, BTN, [4, 5, 1], T, seed=134),
    ]


# ------------------------------------------------------------------ DÍA 14 · Italiano verde
def d14():
    S = Italiano(C1=(74, 110, 66), C3=(196, 58, 40), C2=(238, 190, 60))
    T = 5
    return [
        lambda: S.portada(["¿TIENES UN", "BODEGÓN EN", "CARACAS?"], "Un producto artesanal para tu nevera.", cl(("tienda", -0.1, 0.12, 0.7, 0), (1, 0.3, 0.25, 0.5, 8)), ["caja", "codigo"], ["PARA TU", "NEVERA"], T, seed=141),
        lambda: S.paso("500", "EMPAQUE AL VACÍO DE 500 G", "Presentación lista para exhibir, con etiqueta a color por sabor.", 2, T, 2, ["estrella", "check"], v=0, seed=142),
        lambda: S.paso("", "CÓDIGO DE BARRAS INCLUIDO", "Cada paquete trae su código de barras para pasar directo por tu caja.", 3, T,
                       cl(("codigo", 0, 0, 0.9, -5), ("check", 0.3, 0.25, 0.3, 8)), ["caja", "estrella"], v=1, seed=143),
        lambda: S.paso("5", "CINCO SABORES QUE ROTAN", "Tu cliente prueba uno y vuelve por los otros cuatro.", 4, T, packs(1, 3, 4), ["corazon", "estrella"], v=0, seed=144),
        lambda: S.cierre("SÚMATE", MAYOR, BTN, [1, 2, 5], T, seed=145),
    ]


# ------------------------------------------------------------------ DÍA 15 · Riso rojo
def d15():
    S = Riso(BG=(255, 84, 60), C1=(30, 70, 235), C2=(255, 226, 60), C3=(255, 150, 190), INK=(22, 20, 70))
    T = 6
    return [
        lambda: S.portada(["PANINI CON", "PEPERONCINO"], "Almuerzo picante en 20 minutos.", 3, ["chile", "queso", "pan_baguette"], ["PICA", "RICO", "OJO"], T, seed=151),
        lambda: S.lista("INGREDIENTES", ["1 Peperoncino", "1 pan baguette o ciabatta", "Queso mozzarella", "Pimentón asado (opcional)"], 2, T,
                        cl(("pan_baguette", -0.1, 0.1, 0.6, -10), ("queso", 0.28, 0.0, 0.5, 8), ("chile", -0.3, -0.25, 0.35, -8)), ["hoja", "tomate"], seed=152),
        lambda: S.paso("1", "ASA Y ABRE", "Asa la salchicha 12 a 15 minutos a fuego medio y ábrela a lo largo.", 3, T, cl(("sarten", 0, 0, 0.8, 0), ("fuego", 0.3, 0.3, 0.3, 8)), ["chile", "cuchillo"], v=0, seed=153),
        lambda: S.paso("2", "ARMA EL PAN", "Pan abierto, queso, salchicha y pimentón.", 4, T, cl(("sandwich", 0, 0, 0.85, 0), ("queso", -0.28, -0.3, 0.3, -8)), ["chile", "hoja"], v=1, seed=154),
        lambda: S.paso("3", "A LA PLANCHA", "3 a 4 minutos presionando hasta que el queso se funda.", 5, T, cl(("sandwich", 0, 0, 0.8, 0), ("fuego", 0.3, 0.3, 0.3, 8)), ["reloj", "estrella"], v=2, seed=155),
        lambda: S.cierre("PIDE TU\nPEPERONCINO", ENT, BTN, [3, 5, 3], T, seed=156),
    ]


# ------------------------------------------------------------------ DÍA 16 · Revista burdeos
def d16():
    S = Revista(NUM_REVISTA="Nº 16")
    T = 4
    return [
        lambda: S.portada(["COMER", "LIMPIO"], "16 de octubre, Día Mundial de la Alimentación.", cl(("globo", 0, 0, 0.85, 0), ("brote", 0.3, 0.3, 0.4, 8)), ["tomate", "hoja"], ["16", "OCT"], T, seed=161),
        lambda: S.paso("", "LEE LA ETIQUETA", "Si no entiendes la mitad de los ingredientes, vale la pena preguntarse qué estás comiendo.", 2, T,
                       cl(("lata", -0.1, 0, 0.85, -6), ("lupa", 0.26, 0.1, 0.55, 8)), ["tomate", "limon"], v=0, seed=162),
        lambda: S.vs("NUESTRA ETIQUETA", ("LO QUE NO LLEVA", ["Nitritos", "Conservantes químicos", "Gluten"]), ("LO QUE SÍ LLEVA", ["Carne seleccionada", "Especias", "Trabajo hecho a mano"]), 3, T, seed=163,
                     hero=packs(2, 4, 1)),
        lambda: S.cierre("RICO Y\nLIMPIO", ENT, BTN, [4, 2, 1], T, seed=164),
    ]


# ------------------------------------------------------------------ DÍA 17 · Brutal violeta
def d17():
    S = Brutal(BG=(150, 110, 255), C1=(190, 255, 60), C2=(255, 226, 60), C3=(255, 130, 204), TXT=(255, 255, 255), BAND=((255, 226, 60), (16, 16, 16)))
    T = 6
    return [
        lambda: S.portada(["ADIVINA", "EL SABOR"], "3 pistas. ¿Cuántas aciertas?", packs(1, 3, 4), ["lupa", "estrella"], ["JUEGO", "3", "PISTAS"], T, seed=171),
        lambda: S.paso("1", "PISTA 1", "Lleva hinojo y perfuma cualquier salsa.", 2, T, cl(("hoja", -0.1, 0, 0.8, 0), ("lupa", 0.28, 0.2, 0.5, 8)), ["brote", "estrella"], v=0, seed=172, bloque_col=(255, 130, 204)),
        lambda: S.paso("2", "PISTA 2", "Pica. Para los que la prefieren con carácter.", 3, T, cl(("chile", -0.1, 0, 0.8, 0), ("fuego", 0.28, 0.2, 0.4, 8)), ["chile", "estrella"], v=1, seed=173, bloque_col=(255, 84, 48)),
        lambda: S.paso("3", "PISTA 3", "Lleva queso, perejil y tomate.", 4, T, cl(("queso", -0.15, 0.05, 0.65, -6), ("tomate", 0.25, 0.1, 0.5, 8), ("hoja", 0.05, -0.3, 0.35, 0)), ["estrella", "lupa"], v=2, seed=174, bloque_col=(70, 110, 255)),
        lambda: S.lista("RESPUESTAS", ["1. Finocchio", "2. Peperoncino", "3. Pecorino"], 5, T, packs(1, 3, 4), ["check", "estrella"], seed=175),
        lambda: S.cierre("¿CUÁNTAS\nACERTASTE?", ["Comenta tu resultado", "Pide tu favorito"], BTN, [1, 3, 4], T, seed=176),
    ]


# ------------------------------------------------------------------ DÍA 18 · Italiano rojo
def d18():
    S = Italiano()
    T = 6
    return [
        lambda: S.portada(["PIZZA CON", "PECORINO"], "Domingo de pizza casera en familia.", ("foto", "pizza"), ["tomate", "hoja", "queso"], ["DOMINGO", "DE PIZZA"], T, seed=181),
        lambda: S.lista("INGREDIENTES", ["1 Pecorino", "1 masa para pizza", "Salsa de tomate", "Queso mozzarella", "Orégano"], 2, T,
                        cl(("queso", -0.2, 0, 0.6, -6), ("tomate", 0.25, 0.1, 0.5, 8), ("hoja", 0.05, -0.3, 0.35, 0)), ["pizza", "limon"], seed=182),
        lambda: S.paso("1", "MASA Y SALSA", "Extiende la masa y cúbrela con una capa fina de salsa.", 3, T, cl(("lata", -0.15, 0, 0.75, -6), ("tomate", 0.25, 0.1, 0.5, 8)), ["hoja", "ajo"], v=0, seed=183),
        lambda: S.paso("2", "SALCHICHA Y QUESO", "Dora la salchicha 5 minutos, córtala en rodajas y repártela con la mozzarella.", 4, T, cl((4, -0.1, 0, 0.8, -4), ("queso", 0.28, 0.25, 0.4, 10)), ["pizza", "estrella"], v=1, seed=184),
        lambda: S.paso("3", "AL HORNO", "220 °C por 12 a 15 minutos, hasta que el borde esté dorado. Orégano al salir.", 5, T, ("foto", "pizza"), ["fuego", "reloj"], v=2, seed=185),
        lambda: S.cierre("PIDE TU\nPECORINO", ENT, BTN, [4, 1, 4], T, seed=186),
    ]


# ------------------------------------------------------------------ DÍA 19 · Collage oscuro
def d19():
    S = Collage(BG=(52, 48, 46), C1=(214, 57, 36), C2=(238, 190, 40), TXT=(250, 244, 230), FOOT=(240, 230, 210))
    T = 5
    return [
        lambda: S.portada(["3 ERRORES", "AL ASAR"], "Casi todos los cometemos.", 5, ["cruz", "fuego"], ["NO LO", "HAGAS"], T, seed=191, bloque_col=(214, 57, 36)),
        lambda: S.paso("1", "FUEGO MUY ALTO", "Se quema por fuera y queda cruda por dentro. Fuego medio siempre.", 2, T, cl(("fuego", -0.05, 0, 0.9, 0), ("cruz", 0.3, 0.3, 0.35, 8)), ["termometro", "estrella"], v=0, seed=192),
        lambda: S.paso("2", "PINCHARLA", "Cada hueco deja escapar el jugo. Usa pinzas, no tenedor.", 3, T, cl(("tenedor", -0.2, 0, 0.8, -8), ("cruz", 0.0, 0.3, 0.35, 8), ("pinzas", 0.3, 0, 0.7, 0)), ["check", "estrella"], v=1, seed=193, bloque_col=(214, 57, 36)),
        lambda: S.paso("3", "SERVIRLA DE UNA VEZ", "Déjala reposar 2 minutos: el jugo se reparte y queda más sabrosa.", 4, T, cl(("reloj", -0.1, -0.05, 0.75, 0), ("plato", 0.25, 0.25, 0.5, 8)), ["espiral_sal", "estrella"], v=2, seed=194),
        lambda: S.frase(["ASÍ QUEDA", "PERFECTA"], "Fuego medio, pinzas y 2 minutos de reposo. Guarda este post.", 5, T, ("foto", "espiral"), ["check", "fuego"], seed=195, cols=[((214, 57, 36), (250, 244, 230)), ((250, 244, 230), (32, 24, 20))]),
    ]


# ------------------------------------------------------------------ DÍA 20 · Revista blanco y negro
def d20():
    S = Revista(BG=(238, 237, 232), PAPEL=(238, 237, 232), INK=(20, 20, 20), C1=(214, 80, 30), C2=(40, 40, 40), C3=(90, 90, 90), NUM_REVISTA="Nº 20")
    T = 6
    return [
        lambda: S.portada(["ASÍ LA", "HACEMOS"], "De la carne a la espiral, a mano en Caracas.", ("foto", "espiral"), ["cuchillo", "frasco"], ["HECHA", "A MANO"], T, seed=201),
        lambda: S.paso("1", "CORTE", "Seleccionamos y cortamos la carne.", 2, T, cl(("cuchillo", 0, 0, 0.9, 0), ("estrella", 0.3, -0.3, 0.3, 8)), ["tomate", "hoja"], v=0, seed=202),
        lambda: S.paso("2", "MOLIENDA", "Molida al tamaño justo para que tenga textura.", 3, T, cl(("olla", 0, 0, 0.8, 0), ("espiral_sal", 0.3, 0.3, 0.4, 8)), ["chile", "ajo"], v=1, seed=203),
        lambda: S.paso("3", "ADEREZO", "Cada sabor con su receta de especias.", 4, T, cl(("frasco", -0.1, 0, 0.85, -6), ("chile", 0.28, 0.2, 0.5, 8), ("ajo", 0.25, -0.3, 0.4, 0)), ["hoja", "limon"], v=2, seed=204),
        lambda: S.paso("4", "EMBUTIDO EN ESPIRAL", "La enrollamos en espiral, como se hace en Sicilia.", 5, T, ("foto", "espiral"), ["estrella", "corazon"], v=0, seed=205),
        lambda: S.cierre("HECHA A\nMANO", ENT, BTN, [1, 5, 3], T, seed=206),
    ]


# ------------------------------------------------------------------ DÍA 21 · Brutal negro
def d21():
    S = Brutal(BG=(24, 24, 24), C1=(255, 110, 30), C2=(255, 226, 60), C3=(255, 84, 48), TXT=(255, 255, 255), BAND=((255, 226, 60), (16, 16, 16)))
    T = 5
    return [
        lambda: S.portada(["PARRILLERAS", "DE CARACAS"], "Algo distinto en tu menú.", 5, ["fuego", "estrella"], ["NUEVO", "EN TU", "MENÚ"], T, seed=211, bloque_col=(255, 110, 30)),
        lambda: S.paso("", "¿TU MENÚ ES IGUAL AL DE TODOS?", "Chorizo, morcilla, lo de siempre. Tus clientes ya lo conocen.", 2, T, cl(("plato", 0, 0, 0.9, 0), ("tenedor", 0.3, 0.2, 0.6, 10)), ["cruz", "estrella"], v=0, seed=212, bloque_col=(255, 84, 48)),
        lambda: S.paso("", "UNA ESPIRAL EN EL PLATO", "Se ve distinta, sabe distinta y se vuelve la foto que tus clientes suben.", 3, T, ("foto", "espiral"), ["corazon", "estrella"], v=1, seed=213, bloque_col=(255, 226, 60)),
        lambda: S.paso("", "PENSADA PARA EL CARBÓN", "El sabor Parrillera tiene sabor criollo y se dora parejo.", 4, T, cl((5, -0.1, 0, 0.85, -4), ("fuego", 0.28, 0.25, 0.4, 8)), ["chile", "estrella"], v=2, seed=214, bloque_col=(255, 110, 30)),
        lambda: S.cierre("HABLEMOS", MAYOR, BTN, [5, 3, 5], T, seed=215),
    ]


# ------------------------------------------------------------------ DÍA 22 · Riso amarillo
SABOR = {1: ("FINOCCHIO", "Para pasta. El hinojo perfuma la salsa.", "pasta", (132, 190, 40)),
         2: ("TRADIZIONALE", "Para desayunos y para los niños.", "arepa", (228, 40, 120)),
         3: ("PEPERONCINO", "Para los que piden picante.", "panini y pizza", (226, 40, 28)),
         4: ("PECORINO", "Para pizza y platos al horno.", "horno", (30, 180, 168)),
         5: ("PARRILLERA", "Para la parrilla del fin de semana.", "parrilla", (240, 176, 40))}


def d22():
    S = Riso(BG=(255, 226, 60), C1=(30, 70, 235), C2=(255, 98, 150), C3=(90, 200, 120), INK=(22, 20, 70))
    T = 7
    f = lambda k, n: (lambda: S.sabor(SABOR[k][0], k, SABOR[k][1], SABOR[k][2], n, T, seed=220 + k, color=SABOR[k][3]))
    return [
        lambda: S.portada(["¿CUÁL", "PEDIR?"], "Un sabor para cada ocasión.", packs(1, 3, 5), ["estrella", "corazon"], ["5", "SABORES"], T, seed=221),
        f(1, 2), f(2, 3), f(3, 4), f(4, 5), f(5, 6),
        lambda: S.cierre("GUARDA ESTA\nGUÍA", ENT, BTN, [1, 2, 3], T, seed=229),
    ]


# ------------------------------------------------------------------ DÍA 23 · Brutal azul
def d23():
    S = Brutal(BG=(70, 110, 255), C1=(255, 84, 48), C2=(255, 226, 60), C3=(255, 130, 204), TXT=(255, 255, 255), BAND=((255, 226, 60), (16, 16, 16)))
    T = 5
    return [
        lambda: S.portada(["POV:", "LLEGASTE", "CANSADO"], "Y no quieres cocinar nada complicado.", cl(("reloj", -0.05, 0, 0.85, 0), ("sarten", 0.3, 0.3, 0.45, 8)), ["cerveza", "estrella"], ["15", "MIN"], T, seed=231, bloque_col=(255, 226, 60)),
        lambda: S.paso("", "EL DÍA FUE LARGO", "Tráfico, trabajo, mil cosas. Lo último que quieres es una receta de una hora.", 2, T, cl(("camion", 0, 0, 0.8, 0), ("reloj", 0.3, -0.3, 0.4, 8)), ["cruz", "estrella"], v=0, seed=232, bloque_col=(255, 130, 204)),
        lambda: S.paso("15", "15 MINUTOS", "La salchicha al sartén, un pan o una arepa, y listo.", 3, T, cl(("sarten", -0.05, 0, 0.85, 0), ("reloj", 0.3, 0.25, 0.45, 8)), ["fuego", "estrella"], v=1, seed=233, bloque_col=(255, 84, 48)),
        lambda: S.paso("", "CENA SIN ESTRÉS", "Rica, rápida y hecha con ingredientes limpios.", 4, T, cl((3, -0.1, 0, 0.8, -4), ("sandwich", 0.28, 0.25, 0.45, 8)), ["check", "corazon"], v=2, seed=234, bloque_col=(255, 226, 60)),
        lambda: S.cierre("PIDE PARA\nEL FINDE", ENT, BTN, [2, 3, 5], T, seed=235),
    ]


# ------------------------------------------------------------------ DÍA 24 · Cuaderno tomate
def d24():
    S = Cuaderno()
    T = 6
    return [
        lambda: S.portada(["SALSA ROJA", "CON PECORINO"], "Mañana es el Día Mundial de la Pasta.", 4, ["tomate", "cebolla", "hoja"], ["MAÑANA", "25", "OCTUBRE"], T, seed=241),
        lambda: S.lista("INGREDIENTES", ["1 Pecorino", "1 cebolla", "1 lata de tomate triturado", "Orégano, sal y aceite de oliva"], 2, T,
                        cl(("lata", -0.2, 0.05, 0.7, -6), ("cebolla", 0.25, 0.1, 0.5, 8), ("hoja", 0.0, -0.3, 0.35, 0)), ["tomate", "ajo"], seed=242),
        lambda: S.paso("1", "DESMENUZA Y DORA", "Saca la carne de la tripa, desmenúzala y dórala 6 minutos.", 3, T, cl(("sarten", 0, 0, 0.8, 0), ("cuchillo", 0.3, 0.1, 0.6, 0)), ["tomate", "hoja"], v=0, seed=243),
        lambda: S.paso("2", "CEBOLLA Y TOMATE", "Agrega la cebolla picada, luego el tomate y el orégano.", 4, T, cl(("cebolla", -0.2, 0, 0.6, -6), ("tomate", 0.2, 0.05, 0.6, 8), ("hoja", 0.0, -0.3, 0.35, 0)), ["ajo", "lata"], v=1, seed=244),
        lambda: S.paso("3", "FUEGO BAJO", "15 minutos tapada. Lista para tu pasta favorita.", 5, T, cl(("olla", 0, 0, 0.8, 0), ("fuego", 0.3, 0.3, 0.3, 8)), ["reloj", "estrella"], v=2, seed=245),
        lambda: S.cierre("PIDE HOY,\nCOCINA MAÑANA", ENT, BTN, [4, 1, 4], T, seed=246),
    ]


# ------------------------------------------------------------------ DÍA 25 · Italiano liso turquesa
def d25():
    S = Italiano(FONDO="liso", BG=(250, 240, 218), C1=(30, 112, 122), C3=(196, 58, 40), C2=(238, 190, 60))
    T = 5
    return [
        lambda: S.portada(["DÍA MUNDIAL", "DE LA PASTA"], "25 de octubre. 3 ideas con salchicha siciliana.", ("foto", "pasta"), ["tomate", "hoja", "tenedor"], ["HOY", "25", "OCTUBRE"], T, seed=251),
        lambda: S.paso("1", "FINOCCHIO Y TOMATE", "La clásica: salsa de tomate con el perfume del hinojo.", 2, T, cl((1, -0.1, 0, 0.8, -4), ("tomate", 0.3, 0.25, 0.4, 8)), ["hoja", "estrella"], v=0, seed=252),
        lambda: S.paso("2", "PECORINO Y PEREJIL", "Pasta corta con la salchicha desmenuzada y un toque de aceite de oliva.", 3, T, cl((4, -0.1, 0, 0.8, -4), ("hoja", 0.3, 0.25, 0.4, 8)), ["pasta_nido", "estrella"], v=1, seed=253),
        lambda: S.paso("3", "PEPERONCINO PICANTE", "Para los valientes: salsa roja con el picante de la Peperoncino.", 4, T, cl((3, -0.1, 0, 0.8, -4), ("chile", 0.3, 0.25, 0.4, 8)), ["fuego", "estrella"], v=2, seed=254),
        lambda: S.cierre("¿CUÁL\nPREPARAS?", ["Comenta tu favorita", "Delivery gratis desde 4 paquetes"], BTN, [1, 4, 3], T, seed=255),
    ]


# ------------------------------------------------------------------ DÍA 26 · Revista salvia
def d26():
    S = Revista(BG=(226, 232, 214), C1=(62, 96, 62), C2=(168, 190, 146), C3=(120, 140, 100), NUM_REVISTA="Nº 26")
    T = 5
    return [
        lambda: S.portada(["¿CÓMO LA", "CORTAS?"], "Cada plato pide un corte distinto.", cl(("cuchillo", -0.15, 0, 0.9, 0), ("espiral_sal", 0.22, 0.2, 0.6, 0)), ["limon", "hoja"], ["3", "CORTES"], T, seed=261),
        lambda: S.paso("1", "EN RODAJAS", "Para arepas y pizza. Mejor cuando ya está cocida.", 2, T, cl(("espiral_sal", -0.05, 0, 0.8, 0), ("sandwich", 0.3, 0.3, 0.45, 8)), ["cuchillo", "pizza"], v=0, seed=262),
        lambda: S.paso("2", "EN TROZOS", "Para pasta y salteados. Córtala antes de dorarla.", 3, T, cl(("pasta_nido", -0.05, 0, 0.85, 0), ("cuchillo", 0.3, 0.1, 0.6, 0)), ["tomate", "hoja"], v=1, seed=263),
        lambda: S.paso("3", "DESMENUZADA", "Para salsas: saca la carne de la tripa y dórala suelta.", 4, T, cl(("sarten", 0, 0, 0.8, 0), ("tomate", 0.3, 0.3, 0.35, 8)), ["olla", "hoja"], v=2, seed=264),
        lambda: S.frase(["GUARDA", "ESTE POST"], "Y dinos en los comentarios cuál es tu corte favorito.", 5, T, 1, ["corazon", "estrella"], seed=265),
    ]


# ------------------------------------------------------------------ DÍA 27 · Collage salvia (ranking)
def d27():
    S = Collage(BG=(150, 176, 132), C1=(214, 57, 36), C2=(238, 178, 36))
    T = 7
    f = lambda k, n: (lambda: S.sabor(SABOR[k][0], k, f"Comenta {k} si es tu favorito.", SABOR[k][2], n, T, seed=270 + k, color=SABOR[k][3]))
    return [
        lambda: S.portada(["VOTA TU", "FAVORITO"], "Comenta el número de tu sabor.", packs(1, 5, 3), ["estrella", "corazon"], ["VOTA", "1-5", "COMENTA"], T, seed=271),
        f(1, 2), f(2, 3), f(3, 4), f(4, 5), f(5, 6),
        lambda: S.cierre("RESULTADO EN\nHISTORIAS", ["Comenta el número de tu favorito"], BTN, [1, 2, 3, 4, 5], T, seed=279),
    ]


# ------------------------------------------------------------------ DÍA 28 · Revista azul marino
def d28():
    S = Revista(BG=(232, 238, 246), PAPEL=(232, 238, 246), C1=(20, 60, 140), C2=(186, 206, 236), C3=(60, 100, 170), INK=(16, 24, 48), NUM_REVISTA="Nº 28")
    T = 6
    return [
        lambda: S.portada(["¿TRAVIANI EN", "TU NEGOCIO?"], "Así empezamos a trabajar juntos.", cl(("tienda", -0.1, 0.12, 0.7, 0), (1, 0.3, 0.25, 0.5, 8)), ["camion", "caja"], ["PASO A", "PASO"], T, seed=281),
        lambda: S.paso("1", "ESCRÍBENOS", "Por WhatsApp. Cuéntanos qué tipo de negocio tienes.", 2, T, cl(("bocadillo", 0, 0, 0.85, -4), ("estrella", 0.3, -0.3, 0.3, 8)), ["check", "estrella"], v=0, seed=282),
        lambda: S.paso("2", "PRUEBA EL PRODUCTO", "Coordinamos para que conozcas los sabores.", 3, T, packs(1, 3, 5), ["check", "estrella"], v=1, seed=283),
        lambda: S.paso("3", "PRIMER PEDIDO", "Armamos tu primer pedido juntos.", 4, T, cl(("caja", 0, 0, 0.85, 0), ("check", 0.3, 0.3, 0.35, 8)), ["estrella", "check"], v=2, seed=284),
        lambda: S.paso("4", "DESPACHO EN CARACAS", "Te lo llevamos a tu local.", 5, T, cl(("camion", 0, 0, 0.8, 0), ("tienda", 0.3, -0.3, 0.45, 8)), ["check", "estrella"], v=0, seed=285),
        lambda: S.cierre("ESCRÍBENOS\nHOY", MAYOR, BTN, [1, 2, 3], T, seed=286),
    ]


# ------------------------------------------------------------------ DÍA 30 · Collage mostaza
def d30():
    S = Collage(BG=(236, 178, 44), C1=(214, 57, 36), C2=(250, 244, 230), TXT=(32, 24, 20))
    T = 4
    cinco = cl((1, -0.36, 0.1, 0.55, -10), (2, -0.18, -0.02, 0.6, -5), (3, 0, 0.05, 0.65, 0), (4, 0.18, -0.02, 0.6, 5), (5, 0.36, 0.1, 0.55, 10))
    return [
        lambda: S.portada(["¿YA PROBASTE", "LOS 5?"], "Un mes de recetas, tips y sabor siciliano.", cinco, ["estrella", "corazon"], ["UN MES", "DE SABOR"], T, seed=301, bloque_col=(214, 57, 36)),
        lambda: S.paso("5", "CINCO SABORES", "Finocchio, Tradizionale, Peperoncino, Pecorino y Parrillera.", 2, T, cinco, ["estrella", "check"], v=0, seed=302, bloque_col=(150, 176, 132)),
        lambda: S.paso("4", "DELIVERY GRATIS", "Desde 4 paquetes. Arma tu combinación y pruébalos todos.", 3, T, cl(("camion", 0, 0, 0.8, 0), ("caja", 0.3, -0.3, 0.4, 8)), ["check", "estrella"], v=1, seed=303, bloque_col=(214, 57, 36)),
        lambda: S.cierre("PIDE DIRECTO\nCON NOSOTROS", ENT, BTN, [1, 5, 3], T, seed=304),
    ]


DIAS = {8: d08, 9: d09, 10: d10, 11: d11, 12: d12, 13: d13, 14: d14, 15: d15, 16: d16, 17: d17, 18: d18, 19: d19,
        20: d20, 21: d21, 22: d22, 23: d23, 24: d24, 25: d25, 26: d26, 27: d27, 28: d28, 30: d30}

if __name__ == "__main__":
    solo = None
    args = [a for a in sys.argv[1:]]
    fm = [a for a in args if a in ("ig", "tt")]
    nums = [int(a) for a in args if a.isdigit()] or sorted(DIAS)
    for n in nums:
        runner.render(n, DIAS[n](), solo=fm or None)
