import Engine from "./engine"
import Pin from "./io"
import IO from "./io"
import { Offset, Side, Size } from "./utils"

export default interface Component {
  type: string
  offset: Offset
  scale: number
  rotation: number
  size: Size
  pins: Pin[]
  path: Path2D
  tick?(): void
  click?(engine: Engine): void
}

export default abstract class Component {
  constructor(init: Omit<Component, 'transformedPath' | 'calc' | 'paint' | 'transformPath'> & Partial<Pick<Component, 'calc' | 'paint' | 'transformPath'>>) {
    Object.assign(this, init ?? {})
    this.transformPath()
  }

  calc() {
    const [width, height] = [this.size[0] * this.scale, this.size[1] * this.scale]
    const [halfWidth, halfHeight] = [width / 2, height / 2]
    const [offsetX, offsetY] = this.offset
    const rotationRad = (this.rotation * Math.PI) / 180

    const rotatePoint = (x: number, y: number) => ([
      x * Math.cos(rotationRad) - y * Math.sin(rotationRad),
      x * Math.sin(rotationRad) + y * Math.cos(rotationRad),
    ])

    const calculate = (pins: IO[], side: Side) => {
      const gap = ((side == Side.Top || side == Side.Bottom) ? width : height) / (pins.length + 1)

      pins.forEach((pin, index) => {
        const offsetIndex = gap + gap * index

        let x: number, y: number

        switch (side) {
          case Side.Left:
            [x, y] = [-5, offsetIndex]
            break
          case Side.Top:
            [x, y] = [offsetIndex, -5]
            break
          case Side.Right:
            [x, y] = [width + 5, offsetIndex]
            break
          case Side.Bottom:
            [x, y] = [offsetIndex, height + 5]
            break
        }

        const [rotatedX, rotatedY] = rotatePoint(x - halfWidth, y - halfHeight)

        pin.offset = [
          offsetX + halfWidth + rotatedX,
          offsetY + halfHeight + rotatedY,
        ]
      })
    }

    [Side.Top, Side.Left, Side.Right, Side.Bottom].forEach((side) => (
      calculate(this.pins.filter(pin => pin.side === side), side)
    ))

    this.transformPath()
  }

  paint(engine: Engine) {
    for (const pin of this.pins) {
      engine.context.save()
      engine.context.beginPath()
      engine.context.arc(pin.offset[0], pin.offset[1], 2, 0, Math.PI * 2)
      if (pin.value) {
        engine.context.fillStyle = 'green'
      }
      engine.context.fill()
      engine.context.restore()
    }

    engine.context.stroke(this.transformedPath)
  }

  transformedPath!: Path2D

  transformPath() {
    const halfWidth = this.size[0] * this.scale / 2
    const halfHeight = this.size[1] * this.scale / 2

    const transform = new DOMMatrix()
      .translate(this.offset[0] + halfWidth, this.offset[1] + halfHeight)
      .rotate(this.rotation)
      .translate(-halfWidth, -halfHeight)
      .scale(this.scale)

    const path = new Path2D()

    path.addPath(this.path, transform)

    this.transformedPath = path
  }
}