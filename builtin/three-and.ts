import Component from "../component"
import Pin from "../io"
import { calcPathBBox, Side } from "../utils"

export default class ThreeAnd extends Component {
  constructor(init?: Partial<Component>) {
    const path = 'M0 0 2 0Q4 0 4 2 4 4 2 4L0 4Z'
    const { width, height } = calcPathBBox(path)

    super({
      type: 'three-and',
      offset: [0, 0],
      scale: 5 + 1.25,
      rotation: 0,
      size: [width, height],
      path: new Path2D(path),
      pins: [new Pin('in1', Side.Left), new Pin('in2', Side.Left), new Pin('in3', Side.Left), new Pin('out', Side.Right)],
      ...init
    })
  }

  tick = () => this.pins[3].write(this.pins[0].value * this.pins[1].value * this.pins[2].value)
}