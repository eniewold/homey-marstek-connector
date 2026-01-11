# Conector Marstek Venus

Esta app de Homey se conecta a un sistema de baterías Marstek Venus ya sea a través de la red local o mediante el servicio en la nube de Marstek y obtiene estadísticas de la batería. Te permite monitorizar el estado de la batería, el nivel de carga y otra información relevante directamente desde tu sistema inteligente Homey. Usando flujos, puedes enviar comandos a la batería para cambiar de modo (solo con la API local). Hay un algoritmo de detección automática que intenta encontrar tus baterías Marstek Venus.

## CARACTERÍSTICAS

Cuando se detecta un dispositivo y la comunicación funciona, el dispositivo mostrará varias estadísticas como:
- Nivel de carga de la batería
- Estado (cargando, descargando, en reposo)
- Energía restante (en kilovatios/horas)
- Energía de la red/fuera de la red
- Salida o entrada de energía actual (Vatios)
- Temperatura de la batería
- Totales de carga y descarga (kWh)

También puedes enviar comandos a la batería para cambiar el modo de operación a 'Manual', 'IA', 'Pasivo' o 'Auto'. Estos comandos se pueden transmitir usando flujos de Homey ('Entonces...').

## REQUISITOS

Esta app requiere Homey y un sistema de baterías Marstek Venus.

- Al usar el **controlador API local**, el Homey y la batería deben estar conectados a la misma red con la API local habilitada (ver abajo). La detección automática de las baterías Marstek Venus es compatible en la misma red local y cuando el rango de IP es 192.168.x.y; buscará dentro del último octeto (y) de 1 a 254.
- Al usar el **controlador en la nube**, necesitas una cuenta activa en la nube/app de Marstek. Durante el emparejamiento, Homey te pedirá el nombre de usuario y la contraseña para autenticarte con el servicio en la nube de Marstek.

### EMPAREJAMIENTO DE DISPOSITIVOS (CLOUD)

Elige el dispositivo "Marstek Venus (Cloud)" durante el emparejamiento, inicia sesión con tus credenciales de la nube de Marstek y selecciona el sitio/dispositivo que deseas agregar. Las credenciales se almacenan de forma segura en el almacén de dispositivos y se utilizan únicamente para actualizar las estadísticas de la batería desde los puntos finales en la nube de Marstek.

### EMPAREJAMIENTO DE DISPOSITIVOS (API LOCAL)

La API local está deshabilitada por defecto, esto debe habilitarse en el sistema de baterías Marstek Venus. Esto se puede hacer de dos formas:
- Usa la herramienta de prueba BLE (https://rweijnen.github.io/marstek-venus-monitor/latest/) en tu smartphone (o portátil) cerca de la batería. Conéctate y usa el botón 'Enable Local API (30000)' en la pestaña 'System'.
- Contacta con el soporte de Marstek para que habiliten la API local por ti. Esto puede tardar unos días.

*La API local debe estar habilitada para el número de puerto 30000 (en cada dispositivo). Actualmente no se soportan otros números de puerto.*

## INSTRUCCIONES PASO A PASO

1. Instala la app MarstekHomey desde la tienda de apps de Homey.
2. Agrega un nuevo dispositivo usando el Conector de Batería Marstek.
3. Selecciona el tipo de conexión a realizar:
- Para API: el sistema detectará automáticamente
- Para Cloud: ingresa tus credenciales de App/Cloud y deja que detecte automáticamente
4. Selecciona/verifica todos los dispositivos a agregar y haz clic en continuar para añadirlos a Homey.
5. Observa cómo se da la magia mientras se recuperan y muestran las estadísticas de la batería en la(s) tarjeta(s) de dispositivo.

Puedes agregar dispositivos tanto de API como de Cloud. Ve la configuración de cada batería para obtener detalles adicionales.

## HISTORIAL DE VERSIONES

- 0.8.10 - Aplicadas correcciones a factores predeterminados para combinaciones de hardware/firmware, basadas en comentarios de la comunidad. La configuración de transmisión ahora se establece en verdadero por defecto durante el descubrimiento del dispositivo. Los factores faltantes ahora se establecen por defecto al actualizar la app.
- 0.8.9 - Se hicieron configurables todos los factores que se aplican al recibir datos de la API. También se incluyeron factores predeterminados para diferentes versiones de hardware y firmware.
- 0.8.8 - La transmisión UDP o el envío de paquetes UDP individuales a baterías individuales ahora es configurable (por defecto en transmisión).
- 0.8.7 - Los mensajes 'ES.GetStatus' ya no usan transmisión UDP pero ahora se dirigen directamente a la dirección IP del dispositivo, enviando una solicitud por dispositivo.
- 0.8.6 - Se agregó depuración cuando la fuente de los detalles del mensaje no coincide con la(s) fuente(s) configurada(s).
- 0.8.5 - Se agregaron registros de depuración adicionales para mejorar la compatibilidad con Marstek Venus, solo para la versión de PRUEBA de esta app.
- 0.8.4 - El intervalo de sondeo no siempre se podía determinar al actualizar la app de Homey desde versiones anteriores, se agregó un valor de intervalo de respaldo.
- 0.8.3 - Se eliminó un error que causaba que no se procesaran datos de la API local. La bandera de depuración ahora siempre está configurada para las versiones de PRUEBA de la app.
- 0.8.2 - Se pueden dar configuraciones predeterminadas durante el emparejamiento de dispositivos API locales. Se agregó escape de cadenas durante el inicio de sesión en la nube. El id único para mensajes se limita a un entero de 16 bits.
- 0.8.1 - **[versión ACTUAL en vivo]** Se agregaron configuraciones para deshabilitar el sondeo de datos de la API local, pero los flujos que envían comandos a la batería aún son posibles, para aliviar problemas de comunicación cuando se usa junto con CT002/CT003.
- 0.8.0 - Cambios en la estructura de código y limpieza de github. Convertido el código fuente solo a TypeScript.
- 0.7.6 - Los datos en la nube dejaron de actualizarse cuando la respuesta inicial del servicio en la nube de Marstek era lenta, causando un problema de concurrencia.
- 0.7.5 - No se podía corregir una contraseña incorrecta para la nube de Marstek sin eliminar primero la app. Los errores técnicos en el servicio en la nube de Marstek no se detectan correctamente.
- 0.7.4 - La temperatura reportada por el mismo firmware tiene un multiplicador diferente; se agregó cálculo de coherencia. Los problemas de inicio de sesión en la nube de Marstek no se manejaron correctamente.
- 0.7.3 - El inicio de sesión en la nube podría fallar para usuarios con múltiples dispositivos. Se agregaron algunas traducciones.
- 0.7.2 - La temperatura para el firmware 154 se reportó incorrectamente. Se agregó un mecanismo de reintento a las tarjetas de flujo que establecen el modo de la batería. Mejorada la legibilidad de algunas clases de bibliotecas.
- 0.7.1 - Se agregó una tarjeta de flujo para cambiar el modo de carga de la batería a través de la API local.
- 0.7.0 - Se agregó soporte para un controlador de nube de Marstek que recupera estadísticas de batería usando tus credenciales de cuenta en la nube de Marstek.
- 0.6.3 - Se añadió una propiedad que monitorea el número de segundos desde que se recibió el último mensaje de la batería. Se añadieron íconos para capacidades personalizadas.
- 0.6.2 - La configuración del firmware se almacenó como un tipo de configuración incorrecto.
- 0.6.1 - El firmware 154 parece comunicar valores con diferentes multiplicadores. La app ahora detecta el firmware y lo corrige.
- 0.6.0 - Implementado reconectar automático; reintentar enlace de puerto en cada transmisión cuando el receptor ya no está disponible. Se corrigieron errores en múltiples dispositivos intentando comenzar a conectar al mismo tiempo. Se corrigieron algunos otros errores menores en varios lugares.
- 0.5.7 - Implementación correcta de ajustes de capacidades de Homey como llamadas asíncronas.
- 0.5.6 - Parece que el alcance ya no está disponible durante el manejo del evento de cierre, por lo que el evento de cierre se registra ahora a la consola.
- 0.5.5 - El socket UDP dgram no tiene una función de destrucción, llamarla provocó un fallo durante la desinstalación de la app.
- 0.5.4 - Estructura de registro cambiada para intentar captar problemas de conectividad. Solucionado problema en la función de limpieza.
- 0.5.3 - Se aplicó corrección de error para el descubrimiento de direcciones IP de difusión (causó problemas cuando no se encontró ninguna dirección).
- 0.5.2 - Se añadió un ID único incrementado a todos los mensajes hacia la batería. Se reestructuró la forma en que los detalles se obtienen de mensajes en valores de capacidad de Homey. Manejo adicional de onUninit para la eliminación del receptor UDP. Se añadieron más capacidades recibidas de la batería (no verificadas).
- 0.5.1 - Manejo de errores en la vinculación de sockets y configuración de banderas de difusión para una mejor depuración de futuros errores de vinculación de puertos. Se eliminaron algunas configuraciones obligatorias que causaban problemas durante el descubrimiento.
- 0.5.0 - Se añadieron lecturas adicionales de la API de la batería y el sistema de energía que ahora se visualizan en Homey como sus guías para baterías.
(Detalles del historial más antiguos no están incluidos)

## NOTAS

- Esta app usa las funciones de 'API sobre UDP' mencionadas en la documentación de la API.
- La app está desarrollada y probada con un sistema de batería Venus E v2.0 (firmware v153, módulo de comunicación 202409090159). ¡Hazme saber si funcionan otros modelos también!
- Cuando no se puede detectar automáticamente el dispositivo, verifica si la batería Marstek Venus está encendida y conectada a la misma red que Homey.
- El soporte para múltiples baterías Marstek Venus está implementado, pero como solo tengo una batería para probar, algo es desconocido.
- Solo se soporta el puerto UDP 30000 actualmente en la API local.
- Al actualizar la app, puede ser necesario eliminar primero los dispositivos de batería ya agregados y luego agregarlos nuevamente.
- La API en la nube de Marstek no está documentada, por lo que las cosas pueden cambiar sin previo aviso.
- Los cambios de modo de batería tienen un reintento automático para un máximo de 5 intentos con un tiempo de espera de 15 segundos.

## PROBLEMAS CONOCIDOS

- A veces, la comunicación UDP se detiene después de un tiempo (sin excepción, advertencia).
- No todos los paquetes UDP transmitidos son respondidos por la batería (los ignora silenciosamente).
- No parece funcionar bien junto con CT002 o CT003, la batería parece dejar de comunicarse.
- Los datos en la nube no tienen en cuenta correctamente el puerto de energía de respaldo (muestra 1 Watt).
- El uso del dispositivo Cloud parece cerrar la sesión de la app (solo se permite un token de inicio de sesión único por parte de Marstek).

# SOLUCIÓN DE PROBLEMAS

La API local de la batería tiene algunos problemas de comunicación. No todos los mensajes UDP son respondidos y parece haber algunos conflictos al usar otros métodos para comunicarse con la batería al mismo tiempo. La comunicación parece deteriorarse con el tiempo hasta que se detiene por completo. Usuarios con el firmware 154 reportan menos problemas. La comunicación puede reactivarse usando la herramienta de prueba BLE (https://rweijnen.github.io/marstek-venus-monitor/latest/) v2.0 bajo la pestaña 'Avanzado' usando la función 'System Reset'. Ten en cuenta que la entrega de energía se interrumpirá por un breve momento, y después de eso, la pila de comunicación responderá nuevamente a todos los mensajes.