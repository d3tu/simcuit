import Component from "../component"
import Pin from "../io"
import { calcPathBBox, Side } from "../utils"

export default class Buffer extends Component {
  constructor(init?: Partial<Component>) {
    const path = 'M0 0 2 1 0 2Z'
    const { width, height } = calcPathBBox(path)

    super({
      type: 'buffer',
      offset: [0, 0],
      scale: 5 + 1.75,
      rotation: 0,
      size: [width, height],
      path: new Path2D(path),
      pins: [new Pin('in', Side.Left), new Pin('out', Side.Right)],
      ...init
    })
  }

  tick(): void {
    this.pins[1].write(this.pins[0].value)
  }
}