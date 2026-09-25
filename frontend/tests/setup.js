import '@testing-library/jest-dom'

// ---------------------------------------------------------------------------
// Mock de canvas para jsdom.
//
// jsdom declara getContext pero no lo implementa: sin este doble, cualquier
// componente que dibuje lanzaria un error. Se sobrescribe siempre (no solo
// cuando falta) para que el codigo de dibujo se ejecute de verdad en las pruebas.
// ---------------------------------------------------------------------------
const noop = () => {}

HTMLCanvasElement.prototype.getContext = function getContext() {
  return {
    canvas: this,
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    fillRect: noop,
    clearRect: noop,
    beginPath: noop,
    moveTo: noop,
    lineTo: noop,
    stroke: noop,
    arc: noop,
    fill: noop,
    strokeRect: noop,
    closePath: noop,
    save: noop,
    restore: noop,
    setTransform: noop,
    translate: noop,
    scale: noop,
    rotate: noop,
    transform: noop,
    drawImage: noop,
    fillText: noop,
    measureText: () => ({ width: 0 }),
    putImageData: noop,
    createLinearGradient: () => ({ addColorStop: noop }),
    createPattern: () => ({}),
    createRadialGradient: () => ({ addColorStop: noop }),
    getImageData: () => ({}),
    getLineDash: () => [],
    setLineDash: noop,
  }
}

// getBoundingClientRect devuelve ceros en jsdom; se fija un tamano para poder
// convertir las coordenadas de un click a coordenadas del lienzo.
HTMLCanvasElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
  return {
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: this.width,
    bottom: this.height,
    width: this.width,
    height: this.height,
    toJSON: () => ({}),
  }
}
