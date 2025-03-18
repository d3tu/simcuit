// renderer.ts
class Renderer2D {
  canvas;
  context;
  constructor(canvas) {
    this.canvas = canvas;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error;
    }
    this.context = context;
  }
  resize([width, height]) {
    this.canvas.width = width;
    this.canvas.height = height;
  }
  clear([r, g, b, a]) {
    this.context.fillStyle = `rgba(${r * 255}, ${g * 255}, ${b * 255}, ${a})`;
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  text(text, [x, y], [r, g, b, a]) {
    this.context.font = "monospace 16px";
    this.context.fillStyle = `rgba(${r * 255}, ${g * 255}, ${b * 255}, ${a})`;
    this.context.fillText(text, x, y);
  }
}
function createRenderer(canvas) {
  return new Renderer2D(canvas);
}

// test.ts
var canvas = document.createElement("canvas");
var renderer = createRenderer(canvas);
var resize = () => renderer.resize([window.innerWidth, window.innerHeight]);
resize();
document.addEventListener("resize", resize);
document.body.appendChild(canvas);
renderer.text("test", [10, 10], [0, 0, 0, 1]);
