# Cosmic Girl

Un juego web donde atrapas estrellas fugaces bajo el cielo real de Quito.

## Sobre el juego

Cosmic Girl es un juego de 10 niveles hecho con HTML5 Canvas. Cada nivel representa una fecha especial, y el cielo que ves es una simulación del cielo real sobre Quito, Ecuador en esa noche, con estrellas y constelaciones reales.

### Como jugar

- Toca las estrellas fugaces doradas para atraparlas
- Necesitas atrapar 7 en cada nivel antes de que se acabe el tiempo
- Las estrellas se mueven mas rapido en cada nivel
- De vez en cuando aparece una snitch dorada — si la atrapas, ganas el nivel de inmediato
- En la parte inferior de la pantalla hay pixel art diferente en cada nivel

### Dificultad

El juego tiene dos modos: **Facil** y **Dificil**. El modo dificil aumenta la velocidad, reduce el tiempo, y hace que las estrellas sean mas dificiles de atrapar.

## Tecnologia

- HTML5 Canvas para todo el renderizado
- Motor astronomico real (RA/Dec → Alt/Az) para simular el cielo de Quito
- Web Audio API para efectos de sonido
- Pixel art procedural para las decoraciones de cada nivel
- Vanilla JS, sin frameworks ni dependencias

## Ejecutar localmente

```bash
python3 -m http.server 8000
# Abrir http://localhost:8000
```

No requiere instalacion, build, ni dependencias. Solo abrir `index.html`.
