"""Plan de 30 días de carruseles — Il Siciliano Gourmet (octubre 2026).
Fuente única del plan: la usa el generador y la página de revisión."""
import json

PILARES = {
    "receta":    ("Receta", "Paso a paso con un sabor"),
    "tip":       ("Tip de cocina", "Cocinar, conservar, servir"),
    "uso":       ("Formas de usarla", "Ideas de combinación"),
    "emocional": ("Conexión", "Momentos y planes"),
    "viral":     ("Formato viral", "Mito, reto, comparación, encuesta"),
    "efemeride": ("Fecha especial", "Efeméride real del día"),
    "mayorista": ("Mayoristas Caracas", "Restaurantes, bodegones, pizzerías"),
    "marca":     ("Marca", "Proceso y cierre"),
}

DIAS = [
    (1, "2026-10-01", "marca", "5 sabores de Sicilia", "Presentación de los 5 sabores, uno por lámina", ["Portada: 5 sabores de Sicilia", "Una lámina por sabor", "Limpia y natural", "Pide directo con nosotros"], "LISTO"),
    (2, "2026-10-02", "emocional", "Viernes de desconexión", "Semana larga: cervezas, tus panas y la parrilla", ["¿Cansado de una semana completa de trabajo?", "Este viernes olvídate de todo", "Cervezas frías + tus panas + parrilla", "El sabor para hoy: Parrillera", "Te lo ganaste. Pide directo con nosotros"], ""),
    (3, "2026-10-03", "receta", "Pasta con Finocchio en 20 minutos", "Receta paso a paso de pasta con salsa roja", ["Portada con el plato terminado", "Ingredientes", "Paso 1: dora la salchicha en trozos", "Paso 2: salsa de tomate", "Paso 3: mezcla con la pasta", "Tip: el hinojo perfuma la salsa", "Pide tu Finocchio"], ""),
    (4, "2026-10-04", "emocional", "El domingo no es domingo sin parrilla", "Familia reunida, parrilla y pan", ["El domingo no es domingo sin esto", "La familia, la parrilla y el pan", "Cuántos paquetes para 4, 6 u 8 personas", "Delivery gratis desde 4 paquetes"], ""),
    (5, "2026-10-05", "tip", "Cómo asar la espiral sin que se desarme", "Técnica de los dos pinchos cruzados y fuego medio", ["El error que desarma tu salchicha", "Clava 2 pinchos en cruz", "Fuego medio, no alto", "Voltea una sola vez", "Resultado: dorada y jugosa"], ""),
    (6, "2026-10-06", "uso", "5 formas de comerla esta semana", "Arepa, pasta, panini, pizza y parrilla", ["5 formas de comerla esta semana", "Lunes: en arepa", "Martes: en pasta", "Miércoles: en panini", "Jueves: en pizza", "Fin de semana: a la parrilla", "¿Cuál pruebas primero?"], ""),
    (7, "2026-10-07", "mayorista", "Para restaurantes y pizzerías de Caracas", "Un ingrediente que diferencia tu carta", ["¿Tu pizzería quiere algo que nadie más tenga?", "Salchicha siciliana artesanal", "5 sabores para pizza, pasta y antipasto", "Sin nitritos ni conservantes químicos", "Precio al mayor: escríbenos"], ""),
    (8, "2026-10-08", "viral", "Mito o realidad: todas las salchichas llevan nitritos", "Formato mito vs. realidad", ["Mito: todas las salchichas llevan nitritos", "Realidad: la nuestra no", "Qué son los nitritos (explicado simple)", "Qué sí lleva: carne, especias y tripa natural", "Comenta otro mito que quieras que aclaremos"], ""),
    (9, "2026-10-09", "receta", "Arepa con Tradizionale", "Desayuno venezolano con salchicha siciliana", ["Desayuno de campeones", "Ingredientes", "Paso 1: asa la salchicha", "Paso 2: córtala en rodajas", "Paso 3: rellena la arepa", "Pide tu Tradizionale"], ""),
    (10, "2026-10-10", "tip", "Cómo conservarla bien", "Congelado 3 meses, refrigerado 3 días a 4 °C", ["¿La compraste y no la vas a usar hoy?", "Congelada: hasta 3 meses", "Refrigerada: máximo 3 días a 4 °C", "Cómo descongelar sin perder sabor", "Guarda este post"], ""),
    (11, "2026-10-11", "efemeride", "Se viene el puente: arma tu parrilla", "Previa del feriado del lunes 12 de octubre", ["Mañana es feriado", "Lista de compras para la parrilla", "Qué sabores llevar", "Pide hoy para tenerla a tiempo"], ""),
    (12, "2026-10-12", "efemeride", "Lunes feriado en casa", "Día de la Resistencia Indígena: plan tranquilo en casa", ["Lunes feriado: nada de apuro", "Una comida sin complicaciones", "Idea: salchicha con papas al horno", "¿Qué vas a cocinar hoy? Comenta"], ""),
    (13, "2026-10-13", "viral", "Supermercado vs. artesanal", "Comparación de ingredientes lado a lado", ["¿Sabes lo que comes?", "Salchicha industrial: qué suele llevar", "Salchicha Traviani: qué lleva", "La diferencia se nota en la parrilla", "Haz la prueba tú mismo"], ""),
    (14, "2026-10-14", "mayorista", "Bodegones y charcuterías de Caracas", "Producto listo para tu nevera", ["¿Tienes un bodegón en Caracas?", "Empaque al vacío de 500 g", "Código de barras listo para tu caja", "5 sabores que rotan", "Escríbenos para precio al mayor"], ""),
    (15, "2026-10-15", "receta", "Panini con Peperoncino", "Almuerzo rápido y picante", ["Almuerzo en 10 minutos", "Ingredientes", "Paso 1: asa y abre la salchicha", "Paso 2: arma el pan", "Paso 3: plancha", "Pide tu Peperoncino"], ""),
    (16, "2026-10-16", "efemeride", "Día Mundial de la Alimentación", "Comer rico también es comer limpio", ["16 de octubre: Día Mundial de la Alimentación", "Lee la etiqueta de lo que comes", "Lo que no lleva la nuestra", "Lo que sí lleva", "Comer rico y limpio sí se puede"], ""),
    (17, "2026-10-17", "viral", "Adivina el sabor", "Juego: pista por pista", ["¿Cuánto sabes de nuestros sabores?", "Pista 1: lleva hinojo", "Pista 2: pica", "Pista 3: lleva queso", "Respuestas en la última lámina", "Comenta cuántas acertaste"], ""),
    (18, "2026-10-18", "receta", "Pizza casera con Pecorino", "Domingo de pizza en familia", ["Pizza de domingo", "Ingredientes", "Paso 1: masa y salsa", "Paso 2: salchicha en rodajas", "Paso 3: horno", "Pide tu Pecorino"], ""),
    (19, "2026-10-19", "tip", "3 errores al asar salchichas", "Lo que casi todos hacemos mal", ["3 errores que arruinan tu salchicha", "Error 1: fuego muy alto", "Error 2: pincharla", "Error 3: servirla sin reposar", "Así queda perfecta"], ""),
    (20, "2026-10-20", "marca", "Así la hacemos", "Proceso real: corte, molienda, aderezo y embutido", ["¿Cómo se hace una salchicha siciliana?", "1. Corte de la carne", "2. Molienda al tamaño justo", "3. Aderezo con especias", "4. Embutido en espiral", "Hecha a mano en Caracas"], ""),
    (21, "2026-10-21", "mayorista", "Parrilleras de Caracas: algo distinto en tu menú", "La espiral como plato estrella", ["¿Tu parrillera tiene lo mismo que todas?", "Una espiral siciliana en el plato", "Se ve distinta, sabe distinta", "Sabor Parrillera: pensada para el carbón", "Escríbenos para precio al mayor"], ""),
    (22, "2026-10-22", "uso", "¿Qué sabor para cada ocasión?", "Guía rápida para elegir", ["¿No sabes cuál pedir?", "Para pasta: Finocchio o Pecorino", "Para desayuno: Tradizionale", "Para los que les gusta el picante: Peperoncino", "Para la parrilla: Parrillera", "Guarda esta guía"], ""),
    (23, "2026-10-23", "emocional", "POV: llegaste cansado y la cena está en 15 min", "Viernes sin complicaciones", ["POV: llegaste cansado del trabajo", "No quieres cocinar nada complicado", "15 minutos y lista", "La cena resuelta, sin estrés", "Pide para el fin de semana"], ""),
    (24, "2026-10-24", "receta", "Salsa roja con Pecorino", "Previa del Día Mundial de la Pasta", ["Mañana es el Día Mundial de la Pasta", "La salsa que necesitas", "Ingredientes", "Paso a paso", "Pide hoy, cocina mañana"], ""),
    (25, "2026-10-25", "efemeride", "Día Mundial de la Pasta", "3 pastas con salchicha siciliana", ["25 de octubre: Día Mundial de la Pasta", "Pasta 1: Finocchio y tomate", "Pasta 2: Pecorino y perejil", "Pasta 3: Peperoncino picante", "¿Cuál preparas hoy?"], ""),
    (26, "2026-10-26", "tip", "Cómo cortarla para servir", "Rodajas, trozos o desmenuzada", ["¿Cómo la cortas?", "En rodajas: para arepa y pizza", "En trozos: para pasta", "Desmenuzada: para salsas", "Guarda este post"], ""),
    (27, "2026-10-27", "viral", "Ranking: ¿cuál es tu favorito?", "Encuesta de sabores", ["Vota tu sabor favorito", "Los 5 sabores, uno por lámina", "Comenta el número de tu favorito", "Resultado en nuestras historias"], ""),
    (28, "2026-10-28", "mayorista", "Cómo vendernos al mayor en Caracas", "Pasos para empezar a trabajar juntos", ["¿Quieres Traviani en tu negocio?", "1. Escríbenos por WhatsApp", "2. Te llevamos una muestra", "3. Haces tu primer pedido", "4. Despachamos en Caracas", "Escríbenos hoy"], ""),
    (29, "2026-10-29", "receta", "Salchicha con papas doradas", "Plato completo al horno", ["Un plato, cero complicaciones", "Ingredientes", "Paso 1: papas al horno", "Paso 2: salchicha encima", "Paso 3: sirve con limón", "Pide tu sabor favorito"], ""),
    (30, "2026-10-30", "marca", "Cierre de mes: ¿ya probaste los 5?", "Resumen y llamado a pedir para el fin de semana", ["Un mes de recetas y tips", "¿Ya probaste los 5?", "Delivery gratis desde 4 paquetes", "Pide directo con nosotros"], ""),
]

if __name__ == "__main__":
    json.dump([dict(dia=d, fecha=f, pilar=p, titulo=t, idea=i, laminas=l, estado=e) for d, f, p, t, i, l, e in DIAS],
              open("plan.json", "w"), ensure_ascii=False, indent=1)
    print(len(DIAS), "días")
