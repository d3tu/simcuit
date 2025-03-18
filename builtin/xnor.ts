import Component from "../component"
import Pin from "../io"
import { calcPathBBox, Side } from "../utils"

export default class Xnor extends Component {
  constructor(init?: Partial<Component>) {
    const path = 'M1 0Q3 4 1 8 5 8 9 4 5 0 1 0M0 0Q2 4 0 8M9 4A1 1 0 0011 4 1 1 0 009 4'
    const { width, height } = calcPathBBox(path)

    super({
      type: 'xnor',
      offset: [0, 0],
      scale: 2.5,
      rotation: 0,
      size: [width, height],
      path: new Path2D(path),
      pins: [new Pin('in1', Side.Left), new Pin('in2', Side.Left), new Pin('out', Side.Right)],
      ...init
    })
  }

  tick = () => this.pins[2].write(1 - ((this.pins[0].value + this.pins[1].value) % 2))
}