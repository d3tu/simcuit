import Component from "../component"
import Pin from "../io"
import { calcPathBBox, Side } from "../utils"
import Engine from "../engine"

export default class SevenDisplay extends Component {
  segments: Path2D[]

  constructor(init?: Partial<Component>) {
    const path = 'M2 2 3 1 7 1 8 2 7 3 3 3ZM8 2 9 3 9 7 8 8 7 7 7 3ZM8 8 9 9 9 13 8 14 7 13 7 9ZM8 14 7 15 3 15 2 14 3 13 7 13ZM2 14 1 13 1 9 2 8 3 9 3 13ZM2 8 1 7 1 3 2 2 3 3 3 7ZM2 8 3 7 7 7 8 8 7 9 3 9ZM10 14A1 1 0 0112 14 1 1 0 0110 14ZM1 0A1 1 0 000 1L0 15A1 1 0 001 16L12 16A1 1 0 0013 15L13 1A1 1 0 0012 0Z'
    const { width, height } = calcPathBBox(path)

    super({
      type: 'seven-display',
      offset: [0, 0],
      scale: 3.5,
      rotation: 0,
      size: [width, height],
      path: new Path2D(path),
      pins: Array.from({ length: 8 }, (_, i) => new Pin('abcdefgh'[i], Side.Left)),
      ...init
    })

    this.segments = path.split(/(?=M)/).map((path) => new Path2D(path))
  }

  paint(engine: Engine): void {
    const path = this.path
    const transformedPath = this.transformedPath
    
    for (const i in this.pins) {
      if (this.pins[i].value) {
        this.path = this.segments[i]
        engine.context.save()
        engine.context.fillStyle = 'green'
        this.transformPath()
        engine.context.fill(this.transformedPath)
        engine.context.restore()
      }
    }

    this.path = path
    this.transformedPath = transformedPath
    super.paint(engine)
  }
}