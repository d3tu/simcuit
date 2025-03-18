import Component from "../component"
import Engine from "../engine"
import Pin, { Joint } from "../io"
import { calcPathBBox, Circuit, Data, Side } from "../utils"
import Wire from "../wire"


export default class IC extends Component {
  circuit: Circuit
  
  constructor(init?: Partial<Component>, circuit: Circuit = new Circuit({ label: '', components: [], joints: [], pins: [], wires: [] })) {
    const path = 'M0 1A1 1 0 011 0L7 0A1 1 0 018 1L8 7A1 1 0 017 8L1 8A1 1 0 010 7ZM1 2A1 1 0 012 1L6 1A1 1 0 017 2L7 6 6 7 2 7A1 1 0 011 6Z'
    const { width, height } = calcPathBBox(path)

    // console.log(circuit.toJSON())

    let length = Math.max(...[Side.Top, Side.Left, Side.Right, Side.Bottom].map((side) => (
      circuit.pins.filter(pin => pin.side === side).length
    )))

    super({
      type: 'ic',
      offset: [0, 0],
      scale: 1 + length * 0.75,
      rotation: 0,
      size: [width, height],
      path: new Path2D(path),
      pins: circuit.pins.map((pin) => {
        const newPin = new Pin(pin.label, pin.side, 0, pin.offset)
        newPin.connect(pin)
        return newPin
      }),
      ...init
    })

    this.circuit = circuit
  }

  tick(): void {
    this.circuit.tick()
  }
}