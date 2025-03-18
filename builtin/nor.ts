import Component from "../component"
import Pin from "../io"
import { calcPathBBox, Side } from "../utils"

export default class Nor extends Component {
  constructor(init?: Partial<Component>) {
    const path = 'M0 0Q2 4 0 8 4 8 8 4 4 0 0 0M8 4A1 1 0 0010 4 1 1 0 008 4'
    const { width, height } = calcPathBBox(path)

    super({
      type: 'nor',
      offset: [0, 0],
      scale: 2.5,
      rotation: 0,
      size: [width, height],
      path: new Path2D(path),
      pins: [new Pin('in1', Side.Left), new Pin('in2', Side.Left), new Pin('out', Side.Right)],
      ...init
    })
  }

  tick = () => this.pins[2].write(1 - Math.max(this.pins[0].value, this.pins[1].value))
}