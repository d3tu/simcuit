import Component from "../component"
import Engine from "../engine"
import Pin from "../io"
import { calcPathBBox, Side } from "../utils"

export default class Output extends Component {
  constructor(init?: Partial<Component>) {
    const path = 'M0 1A1 1 0 002 1 1 1 0 000 1'
    const { width, height } = calcPathBBox(path)

    super({
      type: 'output',
      offset: [0, 0],
      scale: 5 + 1.75,
      rotation: 0,
      size: [width, height],
      path: new Path2D(path),
      pins: [new Pin('in', Side.Left)],
      ...init
    })
  }

  paint(engine: Engine): void {
    if (this.pins[0].value) {
      engine.context.save()
      engine.context.fillStyle = 'green'
      engine.context.fill(this.transformedPath)
      engine.context.restore()
    }

    super.paint(engine)
  }
}