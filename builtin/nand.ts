import Component from "../component"
import Pin from "../io"
import { calcPathBBox, Side } from "../utils"

export default class Nand extends Component {
  constructor(init?: Partial<Component>) {
    const path = 'M0 0 4 0Q8 0 8 4 8 8 4 8L0 8ZM8 4A1 1 0 0010 4 1 1 0 008 4'
    const { width, height } = calcPathBBox(path)

    super({
      type: 'nand',
      offset: [0, 0],
      scale: 2.5,
      rotation: 0,
      size: [width, height],
      path: new Path2D(path),
      pins: [new Pin('in1', Side.Left), new Pin('in2', Side.Left), new Pin('out', Side.Right)],
      ...init
    })
  }

  tick = () => this.pins[2].write(1 - this.pins[0].value * this.pins[1].value)
}