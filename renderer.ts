export type Color = [r: number, g: number, b: number, a: number]
export type Size = [width: number, height: number]
export type Position = [x: number, y: number]
export type Rectangle = [x: number, y: number, width: number, height: number]
export type Circle = [x: number, y: number, radius: number]
export type Line = [x1: number, y1: number, x2: number, y2: number]
export type TextOptions = {
  font?: string;
  size?: number;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
}
export type ImageOptions = {
  sourceRect?: Rectangle;
  alpha?: number;
  rotation?: number;
  scale?: [scaleX: number, scaleY: number];
}

export interface IRenderer {
  resize(size: Size): void
  clear(color: Color): void
  text(text: string, position: Position, color: Color, options?: TextOptions): void
  fillRect(rect: Rectangle, color: Color): void
  strokeRect(rect: Rectangle, color: Color, lineWidth?: number): void
  fillCircle(circle: Circle, color: Color): void
  strokeCircle(circle: Circle, color: Color, lineWidth?: number): void
  drawLine(line: Line, color: Color, lineWidth?: number): void
  drawImage(image: HTMLImageElement, position: Position, options?: ImageOptions): void
  drawImageRect(image: HTMLImageElement, rect: Rectangle, options?: ImageOptions): void
  setCompositeOperation(operation: GlobalCompositeOperation): void
  resetCompositeOperation(): void
  save(): void
  restore(): void
  translate(position: Position): void
  rotate(angle: number): void
  scale(scale: [number, number]): void
  beginPath(): void
  moveTo(position: Position): void
  lineTo(position: Position): void
  closePath(): void
  stroke(color: Color, lineWidth?: number): void
  fill(color: Color): void
  drawPath(points: Position[], color: Color, closed?: boolean, lineWidth?: number): void
  fillPath(points: Position[], color: Color): void
  setAlpha(alpha: number): void
  resetAlpha(): void
}

export class Renderer2D implements IRenderer {
  private canvas: HTMLCanvasElement
  private context: CanvasRenderingContext2D
  private defaultCompositeOperation: GlobalCompositeOperation = 'source-over'
  private defaultAlpha: number = 1.0

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas

    const context = canvas.getContext("2d")

    if (!context) {
      throw new Error("Failed to get 2D context from canvas")
    }

    this.context = context
  }

  resize([width, height]: Size): void {
    this.canvas.width = width
    this.canvas.height = height
  }

  clear([r, g, b, a]: Color): void {
    this.context.fillStyle = `rgba(${r * 255}, ${g * 255}, ${b * 255}, ${a})`
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  text(text: string, [x, y]: Position, [r, g, b, a]: Color, options?: TextOptions): void {
    this.context.font = `${options?.size || 16}px ${options?.font || 'monospace'}`
    this.context.fillStyle = `rgba(${r * 255}, ${g * 255}, ${b * 255}, ${a})`

    if (options?.align) {
      this.context.textAlign = options.align
    }

    if (options?.baseline) {
      this.context.textBaseline = options.baseline
    }

    this.context.fillText(text, x, y)
  }

  fillRect([x, y, width, height]: Rectangle, [r, g, b, a]: Color): void {
    this.context.fillStyle = `rgba(${r * 255}, ${g * 255}, ${b * 255}, ${a})`
    this.context.fillRect(x, y, width, height)
  }

  strokeRect([x, y, width, height]: Rectangle, [r, g, b, a]: Color, lineWidth: number = 1): void {
    this.context.strokeStyle = `rgba(${r * 255}, ${g * 255}, ${b * 255}, ${a})`
    this.context.lineWidth = lineWidth
    this.context.strokeRect(x, y, width, height)
  }

  fillCircle([x, y, radius]: Circle, [r, g, b, a]: Color): void {
    this.context.fillStyle = `rgba(${r * 255}, ${g * 255}, ${b * 255}, ${a})`
    this.context.beginPath()
    this.context.arc(x, y, radius, 0, Math.PI * 2)
    this.context.fill()
  }

  strokeCircle([x, y, radius]: Circle, [r, g, b, a]: Color, lineWidth: number = 1): void {
    this.context.strokeStyle = `rgba(${r * 255}, ${g * 255}, ${b * 255}, ${a})`
    this.context.lineWidth = lineWidth
    this.context.beginPath()
    this.context.arc(x, y, radius, 0, Math.PI * 2)
    this.context.stroke()
  }

  drawLine([x1, y1, x2, y2]: Line, [r, g, b, a]: Color, lineWidth: number = 1): void {
    this.context.strokeStyle = `rgba(${r * 255}, ${g * 255}, ${b * 255}, ${a})`
    this.context.lineWidth = lineWidth
    this.context.beginPath()
    this.context.moveTo(x1, y1)
    this.context.lineTo(x2, y2)
    this.context.stroke()
  }

  drawImage(image: HTMLImageElement, [x, y]: Position, options?: ImageOptions): void {
    this.save()

    const { sourceRect, alpha, rotation, scale } = options || {}

    if (alpha !== undefined) {
      this.setAlpha(alpha)
    }

    if (rotation !== undefined || scale !== undefined) {
      this.translate([x, y])

      if (rotation !== undefined) {
        this.rotate(rotation)
      }

      if (scale !== undefined) {
        this.scale(scale)
      }

      if (sourceRect) {
        const [sx, sy, sw, sh] = sourceRect
        this.context.drawImage(image, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh)
      } else {
        this.context.drawImage(image, -image.width / 2, -image.height / 2)
      }
    } else {
      if (sourceRect) {
        const [sx, sy, sw, sh] = sourceRect
        this.context.drawImage(image, sx, sy, sw, sh, x, y, sw, sh)
      } else {
        this.context.drawImage(image, x, y)
      }
    }

    this.restore()
  }

  drawImageRect(image: HTMLImageElement, [x, y, width, height]: Rectangle, options?: ImageOptions): void {
    this.save()

    const { sourceRect, alpha, rotation, scale } = options || {}

    if (alpha !== undefined) {
      this.setAlpha(alpha)
    }

    if (rotation !== undefined || scale !== undefined) {
      this.translate([x + width / 2, y + height / 2])

      if (rotation !== undefined) {
        this.rotate(rotation)
      }

      if (scale !== undefined) {
        this.scale(scale)
      }

      if (sourceRect) {
        const [sx, sy, sw, sh] = sourceRect
        this.context.drawImage(image, sx, sy, sw, sh, -width / 2, -height / 2, width, height)
      } else {
        this.context.drawImage(image, -width / 2, -height / 2, width, height)
      }
    } else {
      if (sourceRect) {
        const [sx, sy, sw, sh] = sourceRect
        this.context.drawImage(image, sx, sy, sw, sh, x, y, width, height)
      } else {
        this.context.drawImage(image, x, y, width, height)
      }
    }

    this.restore()
  }

  setCompositeOperation(operation: GlobalCompositeOperation): void {
    this.context.globalCompositeOperation = operation
  }

  resetCompositeOperation(): void {
    this.context.globalCompositeOperation = this.defaultCompositeOperation
  }

  save(): void {
    this.context.save()
  }

  restore(): void {
    this.context.restore()
  }

  translate([x, y]: Position): void {
    this.context.translate(x, y)
  }

  rotate(angle: number): void {
    this.context.rotate(angle)
  }

  scale([scaleX, scaleY]: [number, number]): void {
    this.context.scale(scaleX, scaleY)
  }

  beginPath(): void {
    this.context.beginPath()
  }

  moveTo([x, y]: Position): void {
    this.context.moveTo(x, y)
  }

  lineTo([x, y]: Position): void {
    this.context.lineTo(x, y)
  }

  closePath(): void {
    this.context.closePath()
  }

  stroke([r, g, b, a]: Color, lineWidth: number = 1): void {
    this.context.strokeStyle = `rgba(${r * 255}, ${g * 255}, ${b * 255}, ${a})`
    this.context.lineWidth = lineWidth
    this.context.stroke()
  }

  fill([r, g, b, a]: Color): void {
    this.context.fillStyle = `rgba(${r * 255}, ${g * 255}, ${b * 255}, ${a})`
    this.context.fill()
  }

  drawPath(points: Position[], [r, g, b, a]: Color, closed: boolean = false, lineWidth: number = 1): void {
    if (points.length < 2) return

    this.context.strokeStyle = `rgba(${r * 255}, ${g * 255}, ${b * 255}, ${a})`
    this.context.lineWidth = lineWidth
    this.context.beginPath()

    const [startX, startY] = points[0]
    this.context.moveTo(startX, startY)

    for (let i = 1; i < points.length; i++) {
      const [x, y] = points[i]
      this.context.lineTo(x, y)
    }

    if (closed) {
      this.context.closePath()
    }

    this.context.stroke()
  }

  fillPath(points: Position[], [r, g, b, a]: Color): void {
    if (points.length < 3) return

    this.context.fillStyle = `rgba(${r * 255}, ${g * 255}, ${b * 255}, ${a})`
    this.context.beginPath()

    const [startX, startY] = points[0]
    this.context.moveTo(startX, startY)

    for (let i = 1; i < points.length; i++) {
      const [x, y] = points[i]
      this.context.lineTo(x, y)
    }

    this.context.closePath()
    this.context.fill()
  }

  setAlpha(alpha: number): void {
    this.context.globalAlpha = alpha
  }

  resetAlpha(): void {
    this.context.globalAlpha = this.defaultAlpha
  }
}

export default function createRenderer(canvas: HTMLCanvasElement): IRenderer {
  return new Renderer2D(canvas)
}