import Component from "../component"
import Engine from "../engine"
import Pin from "../io"
import { calcPathBBox, Side } from "../utils"

export default class Input extends Component {
  constructor(init?: Partial<Component>) {
    const path = 'M0 0 1 0 1 1 0 1Z'
    const { width, height } = calcPathBBox(path)

    super({
      type: 'input',
      offset: [0, 0],
      scale: 10 + 3.5,
      rotation: 0,
      size: [width, height],
      path: new Path2D(path),
      pins: [new Pin('out', Side.Right)],
      ...init
    })
  }

  #state = 0

  click(engine: Engine): void {
    this.#state = 1 - this.#state
    this.pins[0].write(this.#state)
  }

  tick = () => this.pins[0].write(this.#state)

  paint(engine: Engine): void {
    if (this.#state) {
      engine.context.save()
      engine.context.fillStyle = 'green'
      engine.context.fill(this.transformedPath)
      engine.context.restore()
    }

    super.paint(engine)
  }
}