# Informe de auditoría — TreintaClone

Fecha: 2026-10-04. Alcance: lectura de todo el código, `tsc` y `vite build`. No se probó la app en vivo.
**No se modificó ningún dato en Firestore.** Respaldo previo de solo lectura (165 registros + contador) guardado en la máquina del dueño.

## 1. Qué está bien

- **Ventas con transacción**: `POS.handleCheckout` usa `runTransaction` para el número de factura, la venta, el saldo del cliente y el stock a la vez. Si algo falla, no queda nada a medias.
- **Producción y reversos** (`Manufacturing`) usan `writeBatch` + `increment`, así que dos operaciones simultáneas no pisan el stock.
- **Costo de ventas guardado en cada venta** (`items[].cost`), por lo que el margen histórico no cambia si cambia el costo después.
- **Abonos** con `arrayUnion` + `increment` (historial de pagos y saldo en la misma operación).
- Código organizado por pantallas, carga diferida (`React.lazy`), búsqueda sin tildes, soporte de venta de muestra, precio mayor/detal y ticket térmico.
- Typecheck y build pasan.

## 2. Qué estaba mal

### Corregido en la rama `fix/auditoria-ventas`
| # | Problema | Efecto |
|---|---|---|
| 1 | Venta nueva pasaba `createdAt` como marcador del servidor al recibo → `Invalid Date` → error | Pantalla en blanco tras vender |
| 2 | Sin ErrorBoundary | Cualquier error dejaba la app en blanco |
| 3 | `ReceiptPage` sin `export default` | Ruta `/receipt/:id` no cargaba |
| 4 | "+{amount} Años." escrito a mano | Etiqueta incorrecta en Producción |
| 5 | Selector de unidades de receta mostraba objetos | Opciones ilegibles |
| 6 | Eliminar venta a crédito con abonos restaba el total al saldo del cliente | Saldo del cliente menor al real |
| 7 | Abonos sin redondeo a centavos, `\|\|` en vez de `??` | Residuos decimales |
| 8 | Eliminar venta/compra con un producto ya borrado fallaba todo el lote | No se podían borrar |
| 9 | Abonar a una venta de un cliente eliminado fallaba | No se podía cobrar |
| 10 | Se podía eliminar un cliente con deuda | Ventas a crédito huérfanas |
| 11 | "Nuevo producto" reiniciaba el formulario sin `recipe`/`isBajoPedido` | Estado incompleto |
| 12 | HTML del ticket sin escapar (`document.write`) | XSS con nombres maliciosos |
| 13 | `@types/react` no instalado | `npm run lint` no revisaba los componentes |

### Pendiente (no corregido)
| Gravedad | Problema | Por qué sigue pendiente |
|---|---|---|
| CRÍTICO | `firestore.rules` = `allow read, write: if true` | Cerrarlas sin migrar `ownerId` deja sin acceso a los datos |
| CRÍTICO | Rutas administrativas sin login; datos bajo `public_traviani` | Depende de la migración |
| CRÍTICO | Clave de Gemini incrustada en el bundle (`vite.config.ts`, `DemandAnalysis`) | Requiere mover la llamada a un servidor y rotar la clave |
| ALTO | Importación CSV (`Inventory.processImport`): `parseFloat` puede guardar `NaN`, un lote de más de 500 filas falla, todo entra como producto terminado (los insumos aparecen en el POS) | La corrección quedó bloqueada en esta sesión; pendiente |
| ALTO | Catálogo público `/catalog/public_traviani` dejará de mostrar productos al migrar | Hay que ajustar antes de migrar |
| MEDIO | Eliminar un producto no revisa si está en recetas o ventas | Propuesta |
| MEDIO | `MigrationTool` pone todo en `public_traviani` y lee sin filtro | Quitarlo tras la migración |
| MEDIO | `server.ts` sin `helmet`, sin límites, puerto fijo; Vercel no ejecuta `server.ts` | Elegir un modo de despliegue |
| MEDIO | `vite` duplicado, nombre `react-example`, dependencias sin uso (`@simplewebauthn/*`, `firebase-admin`) | Limpieza |
| MEDIO | Archivos de 1000–1500 líneas (`POS`, `Manufacturing`, `Inventory`) | Refactor |
| BAJO | Sin tests ni CI | Propuesta |

## 3. Propuestas (ordenadas por valor)

### Seguridad y datos (antes de todo lo demás)
1. Migrar `ownerId` a la cuenta real, desplegar, y recién entonces cerrar las reglas de Firestore por dueño. Catálogo público con regla de solo lectura limitada.
2. `ProtectedRoute` + eliminar `DEFAULT_OWNER_ID`.
3. Copias de seguridad automáticas diarias (export programado de Firestore).
4. Registro de auditoría: quién cambió qué y cuándo (ventas anuladas, ajustes de stock).
5. Anular ventas en vez de borrarlas (estado `anulada`), para conservar numeración y trazabilidad.

### Calidad
6. Mover reglas de negocio (venta, abono, producción) a funciones del servidor (Cloud Functions) para que el stock y los saldos no dependan del navegador.
7. Pruebas automáticas de los cálculos: costo de receta, utilidad, saldos, conversiones de unidades.
8. Dividir `POS.tsx`, `Manufacturing.tsx` e `Inventory.tsx` en componentes y hooks.
9. Costo promedio ponderado en compras (hoy el costo se sobrescribe con el último).
10. Modo sin conexión (PWA) para seguir vendiendo si cae internet.

### Con IA (todo con la clave del lado del servidor)
11. **Pronóstico de demanda y sugerencia de producción**: ya existe una base en `DemandAnalysis`; llevarla a un modelo con ventas por día, estacionalidad y stock mínimo recomendado.
12. **Alertas de reposición**: aviso diario por WhatsApp de lo que se agota en X días según el ritmo de venta.
13. **Precio sugerido**: proponer precio según costo de receta, margen objetivo y precio de la competencia.
14. **Cobranza inteligente**: priorizar clientes a cobrar, redactar el mensaje de WhatsApp personalizado y predecir riesgo de mora.
15. **Carga por foto o voz**: fotografiar una factura de proveedor para crear la compra, o dictar la venta ("2 kilos de panceta a Juan, a crédito").
16. **Asistente en lenguaje natural**: preguntar "¿cuánto vendí esta semana de chorizo?" o "¿quién me debe más de 30 días?" y obtener la respuesta con gráfico.
17. **Detección de anomalías**: ventas con descuentos raros, costos que se disparan, mermas inusuales en producción.
18. **Optimización de recetas**: sugerir sustitución de insumos o tamaño de tanda para bajar el costo manteniendo el margen.
19. **Resumen semanal automático** con utilidad, gastos, cuentas por cobrar y 3 acciones recomendadas.

Hasta dónde se puede llegar: las propuestas 11–19 son viables con los datos que ya tienes (ventas, costos, stock, abonos). Su calidad depende de acumular historial y de corregir primero los datos inconsistentes (flags guardados como texto, productos sin costo).

## 4. Orden recomendado
1. Revisar y probar la rama `fix/auditoria-ventas`.
2. Resolver el catálogo público y migrar `ownerId` (con respaldo ya hecho).
3. Login obligatorio + reglas cerradas.
4. Mover Gemini al servidor y rotar la clave.
5. Corregir la importación CSV.
6. Pruebas automáticas y luego las funciones de IA.
