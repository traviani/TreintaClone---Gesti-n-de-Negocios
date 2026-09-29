from generador import *
T=8
s=[portada('5 SABORES','DE SICILIA','DESLIZA Y ELIGE EL TUYO  →',T),
lamina_sabor('FINOCCHIO',1,'Con hinojo. La receta clásica de Sicilia, aromática y tradicional.','pasta y panini',2,T),
lamina_sabor('TRADIZIONALE',2,'Sin hinojo. Sabor suave que le gusta a toda la familia.','arepa y desayuno',3,T),
lamina_sabor('PEPERONCINO',3,'Picante. Para los que la prefieren con carácter.','parrilla y pizza',4,T),
lamina_sabor('PECORINO',4,'Con queso pecorino, perejil y tomate.','pasta y horno',5,T),
lamina_sabor('PARRILLERA',5,'Sabor criollo, pensada para la parrilla del fin de semana.','la parrilla',6,T),
lamina_lista('LIMPIA Y NATURAL',[('0 NITRITOS','CERO'),('0 QUÍMICOS','CONSERVANTES'),('SIN GLUTEN','APTA'),('PROTEÍNA','ALTA EN')],'Delgada, en espiral y lista en pocos minutos.',7,T),
lamina_cta(['PIDE DIRECTO','CON NOSOTROS'],['Delivery gratis desde 4 paquetes','Despachos solo en Caracas'],'WhatsApp +58 422 646 8537','$10',8,T)]
for i,im in enumerate(s,1): im.save(f'dia01/{i:02d}.jpg',quality=92)
from PIL import Image
c=Image.new('RGB',(4*360,2*450),'white')
for i,im in enumerate(s): c.paste(im.resize((360,450)),((i%4)*360,(i//4)*450))
c.save('/tmp/dia01_v2.jpg')
