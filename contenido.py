"""Contenido lámina por lámina de los días 2-30 (octubre 2026).
Cada día: pilar, lista de láminas (funciones del generador) y texto de la publicación."""
import generador as g

WA = "WhatsApp +58 422 646 8537"
ENTREGA = ["Delivery gratis desde 4 paquetes", "Despachos solo en Caracas"]
MAYOR = ["Precio al mayor por WhatsApp", "Despachamos en Caracas"]
HASH = "#salchichasiciliana #traviani #caracas #comidaitaliana #hechoamano #emprendimientovenezolano"
HASH_TT = "#salchichasiciliana #traviani #caracas #recetasfaciles #fyp"
F = {"FINOCCHIO": 1, "TRADIZIONALE": 2, "PEPERONCINO": 3, "PECORINO": 4, "PARRILLERA": 5}


def P(*a, **k): return lambda n, t: g.lamina_paso(*a, n, t, **k)
def V(*a): return lambda n, t: g.lamina_vs(*a, n, t)
def S(nombre, i, desc, ideal): return lambda n, t: g.lamina_sabor(nombre, i, desc, ideal, n, t)
def C(*a, **k): return lambda n, t: g.lamina_cierre(*a, t, **k)
def Portada(*a, **k): return lambda n, t: g.portada_tema(*a, t, **k)


DIAS = {
    2: dict(pilar="emocional", laminas=[
        Portada("emocional", "¿CANSADO DE\nTODA LA SEMANA?", "Este viernes el plan es otro.", [5], sticker_txt=["ES", "VIERNES", "POR FIN"]),
        P("emocional", "1", "Suelta el trabajo", "Apaga la laptop, deja el teléfono a un lado. La semana ya pasó."),
        P("emocional", "2", "Llama a tus panas", "Unas cervezas bien frías y la gente con la que te ríes de verdad."),
        P("emocional", "3", "Prende la parrilla", "La espiral Parrillera se dora en minutos y se comparte fácil.", foto=5),
        C("emocional", "TE LO GANASTE", ENTREGA, WA, fotos=(5, 3, 5)),
    ], texto="¿Cansado de toda la semana? 🍻 Este viernes el plan es simple: tus panas, unas cervezas frías y la Parrillera en la parrilla. Te lo ganaste.\n\n📲 Pide directo con nosotros: +58 422 646 8537\n🚚 Delivery gratis desde 4 paquetes (solo Caracas)"),

    3: dict(pilar="receta", laminas=[
        Portada("receta", "PASTA CON\nFINOCCHIO", "Lista en 20 minutos. Guárdala para hoy.", [1], sticker_txt=["SOLO", "20 MIN", "FÁCIL"]),
        P("receta", "", "Ingredientes", "1 paquete Finocchio (500 g)\n400 g de pasta corta\n1 lata de tomate triturado\n2 dientes de ajo\nAceite de oliva, sal y queso rallado", foto=1, claro=True),
        P("receta", "1", "Dora la salchicha", "Córtala en trozos y dórala en una sartén con un chorrito de aceite, 6 a 8 minutos."),
        P("receta", "2", "Haz la salsa", "Agrega el ajo picado y el tomate. Cocina 10 minutos a fuego bajo."),
        P("receta", "3", "Mezcla con la pasta", "Cocina la pasta al dente y únela a la salsa con un poco del agua de cocción. Queso rallado al servir."),
        P("receta", "TIP", "El secreto está en el hinojo", "El Finocchio lleva hinojo: perfuma la salsa sin agregar nada más.", foto=1),
        C("receta", "PIDE TU FINOCCHIO", ENTREGA, WA, fotos=(1, 4, 1)),
    ], texto="Pasta con Finocchio en 20 minutos 🍝 Guarda esta receta para el fin de semana.\n\nEl hinojo del Finocchio perfuma la salsa sin agregar nada más.\n\n📲 Pide por WhatsApp: +58 422 646 8537\n🚚 Delivery gratis desde 4 paquetes (solo Caracas)"),

    4: dict(pilar="emocional", laminas=[
        Portada("emocional", "EL DOMINGO\nNO ES DOMINGO", "sin la familia alrededor de la parrilla.", [5, 3, 1]),
        P("emocional", "", "La mesa llena", "Los primos, los abuelos, el que llega tarde. La parrilla es la excusa para reunirse."),
        P("emocional", "", "¿Cuánto pedir?", "4 personas: 2 paquetes\n6 personas: 3 paquetes\n8 personas: 4 paquetes (con delivery gratis)", foto=5, claro=True),
        C("emocional", "ARMA TU DOMINGO", ENTREGA, WA),
    ], texto="El domingo no es domingo sin la familia alrededor de la parrilla 🔥\n\n¿Cuánto pedir? 4 personas: 2 paquetes · 6 personas: 3 · 8 personas: 4 (y el delivery es gratis).\n\n📲 +58 422 646 8537"),

    5: dict(pilar="tip", laminas=[
        Portada("tip", "QUE NO SE TE\nDESARME", "Cómo asar la espiral siciliana perfecta.", [5]),
        P("tip", "1", "Dos pinchos en cruz", "Atraviesa la espiral con dos pinchos formando una X. Así se voltea entera."),
        P("tip", "2", "Fuego medio", "Con fuego muy alto se quema por fuera y queda cruda por dentro."),
        P("tip", "3", "Voltea una sola vez", "Unos 8 a 10 minutos por lado, según el fuego. Moverla mucho la rompe."),
        P("tip", "", "Dorada y jugosa", "Sácala cuando esté bien cocida por dentro y déjala reposar 2 minutos.", foto=5),
    ], texto="El error que desarma tu salchicha en la parrilla 😱 Dos pinchos en cruz, fuego medio y voltear una sola vez. Guarda este tip.\n\n📲 Pide la tuya: +58 422 646 8537"),

    6: dict(pilar="uso", laminas=[
        Portada("uso", "5 FORMAS\nDE COMERLA", "Una para cada día de la semana.", [2, 1, 3]),
        P("uso", "L", "Lunes: en arepa", "En rodajas con queso blanco. Desayuno resuelto.", foto=2),
        P("uso", "M", "Martes: en pasta", "En trozos, con salsa de tomate. 20 minutos.", foto=1),
        P("uso", "X", "Miércoles: en panini", "Abierta a lo largo, con queso fundido.", foto=3),
        P("uso", "J", "Jueves: en pizza", "En rodajas finas sobre la masa antes del horno.", foto=4),
        P("uso", "V", "Fin de semana: parrilla", "La espiral completa, al centro de la mesa.", foto=5),
        C("uso", "¿CUÁL PRUEBAS PRIMERO?", ENTREGA, WA),
    ], texto="5 formas de comer salchicha siciliana esta semana 🗓️ Arepa, pasta, panini, pizza y parrilla. ¿Cuál pruebas primero? Comenta 👇\n\n📲 +58 422 646 8537"),

    7: dict(pilar="mayorista", laminas=[
        Portada("mayorista", "¿TU PIZZERÍA\nQUIERE ALGO\nDISTINTO?", "Restaurantes y pizzerías de Caracas.", [3, 1, 4]),
        P("mayorista", "", "Salchicha siciliana artesanal", "Enrollada en espiral, hecha a mano en Caracas. Un ingrediente que no tiene la competencia."),
        P("mayorista", "5", "Cinco sabores", "Finocchio, Tradizionale, Peperoncino, Pecorino y Parrillera. Para pizza, pasta y antipasto.", foto=4),
        P("mayorista", "", "Etiqueta limpia", "Sin nitritos, sin conservantes químicos y sin gluten. Un argumento más para tu carta."),
        C("mayorista", "HABLEMOS", MAYOR, WA, precio=None),
    ], texto="¿Tienes una pizzería o un restaurante en Caracas? 🍕 Salchicha siciliana artesanal en 5 sabores, sin nitritos ni conservantes químicos. Un ingrediente que tu competencia no tiene.\n\nEscríbenos para precio al mayor: +58 422 646 8537"),

    8: dict(pilar="viral", laminas=[
        Portada("viral", "MITO:\nTODAS LLEVAN\nNITRITOS", "Desliza y te contamos la realidad.", [3], sticker_txt=["MITO", "O", "REALIDAD"]),
        V("viral", ("MITO", ["Todas las salchichas llevan nitritos", "Sin conservantes se daña enseguida"]),
          ("REALIDAD", ["La nuestra no lleva nitritos", "Congelada dura hasta 3 meses"]), "MITO VS. REALIDAD"),
        P("viral", "?", "¿Qué son los nitritos?", "Aditivos que se usan en muchos embutidos para conservar el color y alargar la vida del producto."),
        P("viral", "", "¿Qué lleva la nuestra?", "Carne seleccionada, especias y sabor. Molida, aderezada y embutida a mano.", foto=2),
        C("viral", "COMENTA OTRO MITO", ["Lo aclaramos en el próximo post", "Pide por WhatsApp"], WA),
    ], texto="Mito: todas las salchichas llevan nitritos ❌ Realidad: la nuestra no. Desliza 👉\n\n¿Qué otro mito quieres que aclaremos? Comenta 👇\n📲 +58 422 646 8537"),

    9: dict(pilar="receta", laminas=[
        Portada("receta", "AREPA CON\nTRADIZIONALE", "El desayuno venezolano con acento siciliano.", [2], sticker_txt=["DESAYUNO", "10 MIN", "EN CASA"]),
        P("receta", "", "Ingredientes", "1 Tradizionale\n2 arepas recién hechas\nQueso blanco rallado\nAguacate (opcional)", foto=2, claro=True),
        P("receta", "1", "Asa la salchicha", "En sartén o plancha a fuego medio, 12 a 15 minutos volteando, hasta que esté bien cocida."),
        P("receta", "2", "Córtala en rodajas", "Rodajas finas para que quepan bien en la arepa."),
        P("receta", "3", "Rellena y a comer", "Arepa abierta, queso blanco, rodajas y aguacate si quieres."),
        C("receta", "PIDE TU TRADIZIONALE", ENTREGA, WA, fotos=(2, 5, 2)),
    ], texto="Arepa con Tradizionale 🫓 El desayuno venezolano con acento siciliano. Sabor suave, sin hinojo, que le gusta a toda la familia.\n\n📲 +58 422 646 8537\n🚚 Delivery gratis desde 4 paquetes"),

    10: dict(pilar="tip", laminas=[
        Portada("tip", "¿NO LA VAS A\nUSAR HOY?", "Así se conserva sin perder sabor.", [1]),
        P("tip", "3", "Congelada: hasta 3 meses", "Guárdala en su empaque al vacío, sin abrir, en el congelador."),
        P("tip", "4°", "Refrigerada: máximo 3 días", "En la nevera a 4 °C o menos. Después de eso, al congelador."),
        P("tip", "", "Cómo descongelar", "Pásala del congelador a la nevera la noche anterior. Nunca al sol ni en agua caliente."),
        P("tip", "", "Guarda este post", "Y compártelo con quien siempre deja la carne afuera para descongelar.", foto=4),
    ], texto="¿La compraste y no la vas a usar hoy? ❄️ Congelada dura hasta 3 meses; refrigerada a 4 °C, máximo 3 días. Descongela en la nevera la noche anterior.\n\nGuarda este post 📌"),

    11: dict(pilar="efemeride", laminas=[
        Portada("efemeride", "SE VIENE\nEL PUENTE", "El lunes 12 es feriado. ¿Ya tienes el plan?", [5, 3, 1], sticker_txt=["LUNES", "12", "FERIADO"]),
        P("efemeride", "", "Lista para la parrilla", "Salchichas (1 paquete por cada 2 personas)\nPan\nCarbón\nBebidas frías\nLimón y ají", claro=True),
        P("efemeride", "", "¿Qué sabores llevar?", "Parrillera para los clásicos, Peperoncino para los que piden picante y Tradizionale para los niños.", foto=5),
        C("efemeride", "PIDE HOY", ["Y tenla a tiempo para el puente"] + ENTREGA[:1], WA),
    ], texto="Se viene el puente 🔥 El lunes 12 es feriado. Arma tu parrilla: Parrillera para los clásicos, Peperoncino para los del picante y Tradizionale para los niños.\n\nPide hoy: +58 422 646 8537"),

    12: dict(pilar="efemeride", laminas=[
        Portada("efemeride", "LUNES\nFERIADO", "Hoy no hay apuro. Cocina algo rico en casa.", [2]),
        P("efemeride", "", "Una comida sin complicaciones", "Un plato al horno mientras descansas: salchicha con papas doradas."),
        P("efemeride", "", "La idea", "Papas en gajos, la espiral encima y 45 minutos de horno. Sirve con limón.", foto=5),
        C("efemeride", "¿QUÉ COCINAS HOY?", ["Comenta tu plan del feriado", "Pide por WhatsApp"], WA),
    ], texto="Lunes feriado 😌 Hoy no hay apuro. Idea fácil: salchicha con papas doradas al horno. ¿Qué vas a cocinar hoy? Comenta 👇"),

    13: dict(pilar="viral", laminas=[
        Portada("viral", "¿SABES LO\nQUE COMES?", "Industrial vs. artesanal.", [4]),
        V("viral", ("INDUSTRIAL (SUELE LLEVAR)", ["Nitritos y conservantes", "Rellenos y harinas", "Sabor a fábrica"]),
          ("TRAVIANI", ["Sin nitritos ni conservantes químicos", "Sin gluten", "Hecha a mano en Caracas"]), "LA DIFERENCIA"),
        P("viral", "", "Se nota en la parrilla", "Una salchicha artesanal se dora, no suelta agua y sabe a especias de verdad.", foto=5),
        C("viral", "HAZ LA PRUEBA", ENTREGA, WA),
    ], texto="Industrial vs. artesanal 🔍 Lee la etiqueta de lo que comes. La nuestra: sin nitritos, sin conservantes químicos y sin gluten.\n\nHaz la prueba: +58 422 646 8537"),

    14: dict(pilar="mayorista", laminas=[
        Portada("mayorista", "¿TIENES UN\nBODEGÓN EN\nCARACAS?", "Un producto artesanal para tu nevera.", [1, 2, 5]),
        P("mayorista", "500", "Empaque al vacío de 500 g", "Presentación lista para exhibir, con etiqueta a color por sabor.", foto=2),
        P("mayorista", "", "Código de barras incluido", "Cada paquete trae su código de barras para pasar directo por tu caja."),
        P("mayorista", "5", "Cinco sabores que rotan", "Tu cliente prueba uno y vuelve por los otros cuatro.", foto=3),
        C("mayorista", "SÚMATE", MAYOR, WA, precio=None),
    ], texto="¿Tienes un bodegón o charcutería en Caracas? 🛒 Salchicha siciliana artesanal en empaque al vacío de 500 g, con código de barras y 5 sabores.\n\nPrecio al mayor: +58 422 646 8537"),

    15: dict(pilar="receta", laminas=[
        Portada("receta", "PANINI CON\nPEPERONCINO", "Almuerzo picante en 20 minutos.", [3], sticker_txt=["PICA", "RICO", "OJO"]),
        P("receta", "", "Ingredientes", "1 Peperoncino\n1 pan tipo baguette o ciabatta\nQueso mozzarella\nPimentón asado (opcional)", foto=3, claro=True),
        P("receta", "1", "Asa y abre", "Asa la salchicha 12 a 15 minutos a fuego medio y ábrela a lo largo."),
        P("receta", "2", "Arma el pan", "Pan abierto, queso, salchicha y pimentón."),
        P("receta", "3", "A la plancha", "3 a 4 minutos presionando hasta que el queso se funda."),
        C("receta", "PIDE TU PEPERONCINO", ENTREGA, WA, fotos=(3, 5, 3)),
    ], texto="Panini con Peperoncino 🌶️ Almuerzo picante en 20 minutos. Guarda la receta.\n\n📲 +58 422 646 8537"),

    16: dict(pilar="efemeride", laminas=[
        Portada("efemeride", "DÍA MUNDIAL DE\nLA ALIMENTACIÓN", "16 de octubre. Comer rico también es comer limpio.", [4, 2, 1]),
        P("efemeride", "", "Lee la etiqueta", "Si no entiendes la mitad de los ingredientes, vale la pena preguntarse qué estás comiendo."),
        V("efemeride", ("LO QUE NO LLEVA", ["Nitritos", "Conservantes químicos", "Gluten"]),
          ("LO QUE SÍ LLEVA", ["Carne seleccionada", "Especias", "Trabajo hecho a mano"]), "NUESTRA ETIQUETA"),
        C("efemeride", "RICO Y LIMPIO", ENTREGA, WA),
    ], texto="16 de octubre, Día Mundial de la Alimentación 🌎 Comer rico también es comer limpio: sin nitritos, sin conservantes químicos y sin gluten."),

    17: dict(pilar="viral", laminas=[
        Portada("viral", "ADIVINA\nEL SABOR", "3 pistas. ¿Cuántas aciertas?", [1, 3, 4], sticker_txt=["JUEGO", "3", "PISTAS"]),
        P("viral", "1", "Pista 1", "Lleva hinojo y perfuma cualquier salsa."),
        P("viral", "2", "Pista 2", "Pica. Para los que la prefieren con carácter."),
        P("viral", "3", "Pista 3", "Lleva queso, perejil y tomate."),
        P("viral", "", "Respuestas", "1. Finocchio\n2. Peperoncino\n3. Pecorino", claro=True, foto=4),
        C("viral", "¿CUÁNTAS ACERTASTE?", ["Comenta tu resultado", "Pide tu favorito"], WA),
    ], texto="Adivina el sabor 🤔 3 pistas, respuestas en la última lámina. Comenta cuántas acertaste 👇"),

    18: dict(pilar="receta", laminas=[
        Portada("receta", "PIZZA CON\nPECORINO", "Domingo de pizza casera en familia.", [4]),
        P("receta", "", "Ingredientes", "1 Pecorino\n1 masa para pizza\nSalsa de tomate\nQueso mozzarella\nOrégano", foto=4, claro=True),
        P("receta", "1", "Masa y salsa", "Extiende la masa y cúbrela con una capa fina de salsa."),
        P("receta", "2", "Salchicha y queso", "Dora la salchicha 5 minutos, córtala en rodajas y repártela con la mozzarella."),
        P("receta", "3", "Al horno", "220 °C por 12 a 15 minutos, hasta que el borde esté dorado. Orégano al salir."),
        C("receta", "PIDE TU PECORINO", ENTREGA, WA, fotos=(4, 1, 4)),
    ], texto="Pizza casera con Pecorino 🍕 Queso, perejil y tomate dentro de la salchicha. Plan perfecto de domingo.\n\n📲 +58 422 646 8537"),

    19: dict(pilar="tip", laminas=[
        Portada("tip", "3 ERRORES\nAL ASAR", "Casi todos los cometemos.", [5]),
        P("tip", "1", "Fuego muy alto", "Se quema por fuera y queda cruda por dentro. Fuego medio siempre."),
        P("tip", "2", "Pincharla", "Cada hueco deja escapar el jugo. Usa pinzas, no tenedor."),
        P("tip", "3", "Servirla de una vez", "Déjala reposar 2 minutos: el jugo se reparte y queda más sabrosa."),
        P("tip", "", "Así queda perfecta", "Fuego medio, pinzas y 2 minutos de reposo. Guarda este post.", foto=5),
    ], texto="3 errores al asar salchichas 🔥 Fuego muy alto, pincharla y servirla sin reposar. Guarda este post 📌"),

    20: dict(pilar="marca", laminas=[
        Portada("marca", "ASÍ LA\nHACEMOS", "De la carne a la espiral, a mano en Caracas.", [1, 5, 3]),
        P("marca", "1", "Corte", "Seleccionamos y cortamos la carne."),
        P("marca", "2", "Molienda", "Molida al tamaño justo para que tenga textura."),
        P("marca", "3", "Aderezo", "Cada sabor con su receta de especias."),
        P("marca", "4", "Embutido en espiral", "La enrollamos en espiral, como se hace en Sicilia.", foto=2),
        C("marca", "HECHA A MANO", ENTREGA, WA),
    ], texto="Así hacemos nuestra salchicha siciliana 🇮🇹 Corte, molienda, aderezo y embutido en espiral. Hecha a mano en Caracas."),

    21: dict(pilar="mayorista", laminas=[
        Portada("mayorista", "PARRILLERAS\nDE CARACAS", "Algo distinto en tu menú.", [5]),
        P("mayorista", "", "¿Tu menú es igual al de todos?", "Chorizo, morcilla, lo de siempre. Tus clientes ya lo conocen."),
        P("mayorista", "", "Una espiral en el plato", "Se ve distinta, sabe distinta y se vuelve la foto que tus clientes suben.", foto=5),
        P("mayorista", "", "Pensada para el carbón", "El sabor Parrillera tiene sabor criollo y se dora parejo."),
        C("mayorista", "HABLEMOS", MAYOR, WA, precio=None, fotos=(5, 3, 5)),
    ], texto="¿Tienes una parrillera en Caracas? 🔥 Pon una espiral siciliana en tu menú. Se ve distinta, sabe distinta.\n\nPrecio al mayor: +58 422 646 8537"),

    22: dict(pilar="uso", laminas=[
        Portada("uso", "¿CUÁL PEDIR?", "Un sabor para cada ocasión.", [1, 3, 5]),
        S("FINOCCHIO", 1, "Para pasta. El hinojo perfuma la salsa.", "pasta"),
        S("TRADIZIONALE", 2, "Para desayunos y para los niños.", "arepa"),
        S("PEPERONCINO", 3, "Para los que piden picante.", "panini y pizza"),
        S("PECORINO", 4, "Para pizza y platos al horno.", "horno"),
        S("PARRILLERA", 5, "Para la parrilla del fin de semana.", "parrilla"),
        C("uso", "GUARDA ESTA GUÍA", ENTREGA, WA),
    ], texto="¿No sabes cuál pedir? 🤔 Guía rápida: pasta → Finocchio · desayuno → Tradizionale · picante → Peperoncino · horno → Pecorino · parrilla → Parrillera. Guárdala 📌"),

    23: dict(pilar="emocional", laminas=[
        Portada("emocional", "POV: LLEGASTE\nCANSADO", "Y no quieres cocinar nada complicado.", [2]),
        P("emocional", "", "El día fue largo", "Tráfico, trabajo, mil cosas. Lo último que quieres es una receta de una hora."),
        P("emocional", "15", "15 minutos", "La salchicha al sartén, un pan o una arepa, y listo."),
        P("emocional", "", "Cena sin estrés", "Rica, rápida y hecha con ingredientes limpios.", foto=3),
        C("emocional", "PIDE PARA EL FINDE", ENTREGA, WA),
    ], texto="POV: llegaste cansado del trabajo 😮‍💨 15 minutos y la cena está lista. Pide para el fin de semana 👇\n\n📲 +58 422 646 8537"),

    24: dict(pilar="receta", laminas=[
        Portada("receta", "SALSA ROJA\nCON PECORINO", "Mañana es el Día Mundial de la Pasta.", [4], sticker_txt=["MAÑANA", "25", "OCTUBRE"]),
        P("receta", "", "Ingredientes", "1 Pecorino\n1 cebolla\n1 lata de tomate triturado\nOrégano, sal y aceite de oliva", foto=4, claro=True),
        P("receta", "1", "Desmenuza y dora", "Saca la carne de la tripa, desmenúzala y dórala 6 minutos."),
        P("receta", "2", "Cebolla y tomate", "Agrega la cebolla picada, luego el tomate y el orégano."),
        P("receta", "3", "Fuego bajo", "15 minutos tapada. Lista para tu pasta favorita."),
        C("receta", "PIDE HOY, COCINA MAÑANA", ENTREGA, WA, fotos=(4, 1, 4)),
    ], texto="Mañana es el Día Mundial de la Pasta 🍝 Adelántate con esta salsa roja con Pecorino. Pide hoy y cocina mañana.\n\n📲 +58 422 646 8537"),

    25: dict(pilar="efemeride", laminas=[
        Portada("efemeride", "DÍA MUNDIAL\nDE LA PASTA", "25 de octubre. 3 ideas con salchicha siciliana.", [1, 4, 3], sticker_txt=["HOY", "25", "OCTUBRE"]),
        P("efemeride", "1", "Finocchio y tomate", "La clásica: salsa de tomate con el perfume del hinojo.", foto=1),
        P("efemeride", "2", "Pecorino y perejil", "Pasta corta con la salchicha desmenuzada y un toque de aceite de oliva.", foto=4),
        P("efemeride", "3", "Peperoncino picante", "Para los valientes: salsa roja con el picante de la Peperoncino.", foto=3),
        C("efemeride", "¿CUÁL PREPARAS?", ["Comenta tu favorita"] + ENTREGA[:1], WA),
    ], texto="25 de octubre, Día Mundial de la Pasta 🍝🇮🇹 3 ideas con salchicha siciliana. ¿Cuál preparas hoy? Comenta 👇"),

    26: dict(pilar="tip", laminas=[
        Portada("tip", "¿CÓMO LA\nCORTAS?", "Cada plato pide un corte distinto.", [2]),
        P("tip", "1", "En rodajas", "Para arepas y pizza. Mejor cuando ya está cocida."),
        P("tip", "2", "En trozos", "Para pasta y salteados. Córtala antes de dorarla."),
        P("tip", "3", "Desmenuzada", "Para salsas: saca la carne de la tripa y dórala suelta."),
        P("tip", "", "Guarda este post", "Y dinos en los comentarios cuál es tu corte favorito.", foto=1),
    ], texto="¿Cómo cortas tu salchicha? 🔪 Rodajas para arepa y pizza, trozos para pasta y desmenuzada para salsas. Guarda este post 📌"),

    27: dict(pilar="viral", laminas=[
        Portada("viral", "VOTA TU\nFAVORITO", "Comenta el número de tu sabor.", [1, 5, 3], sticker_txt=["VOTA", "1-5", "COMENTA"]),
        S("FINOCCHIO", 1, "Comenta 1 si es tu favorito.", "pasta"),
        S("TRADIZIONALE", 2, "Comenta 2 si es tu favorito.", "arepa"),
        S("PEPERONCINO", 3, "Comenta 3 si es tu favorito.", "pizza"),
        S("PECORINO", 4, "Comenta 4 si es tu favorito.", "horno"),
        S("PARRILLERA", 5, "Comenta 5 si es tu favorito.", "parrilla"),
        C("viral", "RESULTADO EN HISTORIAS", ["Comenta el número de tu favorito"], WA),
    ], texto="Ranking de sabores 🏆 Comenta el número de tu favorito (1 al 5). Te contamos el resultado en nuestras historias."),

    28: dict(pilar="mayorista", laminas=[
        Portada("mayorista", "¿TRAVIANI EN\nTU NEGOCIO?", "Así empezamos a trabajar juntos.", [1, 2, 3]),
        P("mayorista", "1", "Escríbenos", "Por WhatsApp. Cuéntanos qué tipo de negocio tienes."),
        P("mayorista", "2", "Prueba el producto", "Coordinamos para que conozcas los sabores."),
        P("mayorista", "3", "Primer pedido", "Te pasamos precios al mayor y armas tu pedido."),
        P("mayorista", "4", "Despacho en Caracas", "Te lo llevamos a tu local.", foto=5),
        C("mayorista", "ESCRÍBENOS HOY", MAYOR, WA, precio=None),
    ], texto="¿Quieres Traviani en tu negocio? 🤝 Restaurantes, pizzerías, bodegones y parrilleras de Caracas: escríbenos y te pasamos precios al mayor.\n\n📲 +58 422 646 8537"),

    29: dict(pilar="receta", laminas=[
        Portada("receta", "SALCHICHA CON\nPAPAS DORADAS", "Un plato, cero complicaciones.", [5]),
        P("receta", "", "Ingredientes", "1 espiral (tu sabor favorito)\n4 papas medianas\nAceite, sal y romero\n1 limón", foto=5, claro=True),
        P("receta", "1", "Papas al horno", "Córtalas en gajos, con aceite y sal. 200 °C por 20 minutos."),
        P("receta", "2", "La espiral encima", "Colócala sobre las papas y hornea 20 a 25 minutos más, volteándola a la mitad."),
        P("receta", "3", "Sirve con limón", "Bien cocida por dentro, dorada por fuera y un toque de limón."),
        C("receta", "PIDE TU FAVORITA", ENTREGA, WA),
    ], texto="Salchicha con papas doradas al horno 🥔 Un plato, cero complicaciones. Guarda la receta.\n\n📲 +58 422 646 8537"),

    30: dict(pilar="marca", laminas=[
        Portada("marca", "¿YA PROBASTE\nLOS 5?", "Un mes de recetas, tips y sabor siciliano.", [1, 5, 3]),
        P("marca", "5", "Cinco sabores", "Finocchio, Tradizionale, Peperoncino, Pecorino y Parrillera."),
        P("marca", "4", "Delivery gratis", "Desde 4 paquetes. Arma tu combinación y pruébalos todos.", foto=4),
        C("marca", "PIDE DIRECTO CON NOSOTROS", ENTREGA, WA),
    ], texto="Un mes de recetas, tips y sabor siciliano 🇮🇹 ¿Ya probaste los 5? Arma tu combinación con delivery gratis desde 4 paquetes.\n\n📲 +58 422 646 8537"),
}


def texto_ig(d):
    return DIAS[d]["texto"] + "\n\n" + HASH


def texto_tt(d):
    t = DIAS[d]["texto"].split("\n")[0]
    return t + " " + HASH_TT


FOTO = {2: 5, 3: 1, 4: 5, 5: 5, 6: 2, 7: 3, 8: 3, 9: 2, 10: 1, 11: 5, 12: 5, 13: 4, 14: 1, 15: 3, 16: 4,
        17: 1, 18: 4, 19: 5, 20: 1, 21: 5, 22: 1, 23: 2, 24: 4, 25: 1, 26: 2, 27: 1, 28: 2, 29: 5, 30: 3}


def generar(d, formato):
    g.usar_formato(formato)
    g.FOTO_DEFECTO[0] = FOTO[d]
    lams = DIAS[d]["laminas"]
    return [f(i + 1, len(lams)) for i, f in enumerate(lams)]
