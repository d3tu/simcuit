import Component from "../component"
import Pin from "../io"
import { calcPathBBox, Side } from "../utils"

export default class Inverter extends Component {
  constructor(init?: Partial<Component>) {
    const path = 'M0 0 8 4 0 8ZM8 4A1 1 0 0010 4 1 1 0 008 4'
    const { width, height } = calcPathBBox(path)

    super({
      type: 'inverter',
      offset: [0, 0],
      scale: 1.25 + 0.4375,
      rotation: 0,
      size: [width, height],
      path: new Path2D(path),
      pins: [new Pin('in', Side.Left), new Pin('out', Side.Right)],
      ...init
    })
  }

  tick(): void {
    this.pins[1].write(1 - this.pins[0].value)
  }
}