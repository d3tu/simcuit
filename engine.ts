import Component from "./component";
import builtIn, { IC } from "./builtin";
import Pin from "./io";
import IO, { Joint } from "./io";
import { ArrayUtils, calculateIntermediatePoint, Circuit, Data, findWireSegmentIndex, isPointInComponent, isPointInJoint, LocalDB, Offset, Side } from "./utils";
import Wire from "./wire";

export enum State { None, Wiring, Interacting, Dragging }

export interface EngineOptions {
  components?: Component[];
  wires?: Wire[];
  joints?: Joint[];
  pins?: Pin[];
}

export default class Engine extends Circuit {
  state: State = State.None;

  private canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;

  offset: Offset = [50, 50];
  scale: number = 2;

  start: Offset = [0, 0];
  pressed: boolean = false;

  selectedComponent: Component | null = null;
  private selectedJoint: Joint | null = null;
  private selectedWire: Wire | null = null;

  private position: Offset = [0, 0];

  private path: Offset[] = [];
  private index: number = -1;

  _selectedComponent: Component | null = null;
  _selectedJoint: Joint | null = null;
  _selectedWire: Wire | null = null;

  constructor(canvas: HTMLCanvasElement, options: Omit<Circuit, 'tick' | 'toJSON'> = {
    label: '',
    components: [],
    wires: [],
    joints: [],
    pins: [],
  }) {
    super(options)

    this.canvas = canvas;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Unable to get 2D rendering context');
    }

    this.context = context;

    this.initEventListeners();
  }

  private initEventListeners(): void {
    this.canvas.addEventListener("mousedown", this.onMouseDown.bind(this));
    this.canvas.addEventListener("mouseup", this.onMouseUp.bind(this));
    this.canvas.addEventListener("mouseleave", this.onMouseUp.bind(this));
    this.canvas.addEventListener("mousemove", this.onMouseMove.bind(this));
    this.canvas.addEventListener("wheel", this.onWheel.bind(this));
    window.addEventListener("keydown", this.onKeyDown.bind(this));
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (event.key === "Delete" || event.key === "Backspace") {
      this.deleteSelectedElement();
    } else if (event.key === "Escape") {
      this.cancelWiring();
    } else if (event.ctrlKey || event.metaKey) {
      console.log('...')
      // console.log(event.key)
      switch (event.key.toLowerCase()) {
        case 'arrowup':
          case 'arrowdown':
          case 'arrowleft':
          case 'arrowright':
        // case 'space':
          // if (this._selectedJoint instanceof Pin) this.toJoint(this._selectedJoint)
          if (this._selectedJoint) this.toPin(this._selectedJoint, event.key.toLowerCase())
          break
          case ' ':
            if (this._selectedComponent) {
              this._selectedComponent.rotation += 90
              if (this._selectedComponent.rotation > 270) this._selectedComponent.rotation = 0
              this._selectedComponent.calc()
            }
          if (this._selectedJoint instanceof Pin) this.toJoint(this._selectedJoint)
          break
        case 'c':
          this.copySelectedComponent();
          break;
        case 'x':
          this.cutSelectedComponent();
          break;
        case 'v':
          this.pasteComponent();
          break;
        // case 'z':
        //   this.undo();
        //   break;
        // case 'y':
        //   this.redo();
          break;
      }
    }
    LocalDB.set("circuit", this.toJSON());
  }

  toPin(joint: Joint, key: string) {
    const side = (): Side => {
      switch (key) {
        case 'arrowup': return Side.Top
          case 'arrowdown': return Side.Bottom
          case 'arrowleft': return Side.Left
          case 'arrowright': return Side.Right
          default: throw new Error('')
      }
    }
    if (joint instanceof Pin) {
      joint.side = side()
      ArrayUtils.remove(this.pins, (j) => j == joint)
      this.pins.push(joint)
      return
    }
    const pin = new Pin(prompt('Nome do pino:') ?? '', side(), 0, joint.offset)
    joint.joints.forEach((j) => {
      pin.connect(j)
      joint.disconnect(j)
    })
    const wire = this.wires.find((wire) => wire.from == joint || wire.to == joint)
    if (wire) {
      if (wire.from == joint) wire.from = pin
      if (wire.to == joint) wire.to = pin
    }
    ArrayUtils.remove(this.joints, (j) => j == joint)
    this.pins.push(pin)
    this._selectedJoint = pin
  }

  toJoint(pin: Joint) {
    const joint = new Joint(pin.offset)
    pin.joints.forEach((j) => {
      joint.connect(j)
      pin.disconnect(j)
    })
    const wire = this.wires.find((wire) => wire.from == pin || wire.to == pin)
    if (wire) {
      if (wire.from == pin) wire.from = joint
      if (wire.to == pin) wire.to = joint
    }
    ArrayUtils.remove(this.pins, (j) => j == pin)
    this.joints.push(joint)
    this._selectedJoint = joint
  }

  private clipboard: Component | null = null;

  private copySelectedComponent(): void {
    if (this._selectedComponent) {
      this.clipboard = this._selectedComponent
    }
  }

  private cutSelectedComponent(): void {
    if (this._selectedComponent) {
      this.copySelectedComponent();
      this.deleteComponent(this._selectedComponent);
      this._selectedComponent = null;
      LocalDB.set("circuit", this.toJSON());
    }
  }

  private pasteComponent(): void {
    // const getCircuit = (circuit: Circuit) => {
    //   circuit.components.map((component) => {})
    // }
    if (this.clipboard) {
      const component = builtIn(this.clipboard.type, {
        offset: this.position
      }, this.clipboard instanceof IC ? new Circuit(Circuit.parseJSON(this.clipboard.circuit.toJSON())) : undefined)!
      this.components.push(component);
      component.calc()
      // this.addToHistory();
      LocalDB.set("circuit", this.toJSON());
    }
  }

  private history: any[] = [];
  private historyIndex: number = -1;

  private undo(): void {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.loadState(this.history[this.historyIndex]);
    }
  }

  private redo(): void {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.loadState(this.history[this.historyIndex]);
    }
  }

  private loadState(state: any): void {
    Object.assign(this, state);
  }

  private addToHistory(): void {
    const currentState = JSON.stringify(this);
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(currentState);
    this.historyIndex = this.history.length - 1;
  }

  private cancelWiring(): void {
    if (this.state === State.Wiring) {
      this.selectedJoint = null;
      this.state = State.None;
      this.path = [];
    }
  }

  private deleteSelectedElement(): void {
    if (this.state == State.None) {
      if (this._selectedWire) this.deleteWire(this._selectedWire)
      if (this._selectedJoint) this.deleteJoint(this._selectedJoint)
      if (this._selectedComponent) this.deleteComponent(this._selectedComponent)
    }
    this.selectedComponent = this._selectedComponent = null
    this.selectedJoint = this._selectedJoint = null
    this.selectedWire = this._selectedWire = null
    this.state = State.None
  }

  private deleteComponent(component: Component): void {
    component.pins.forEach((joint) => {
      this.wires.filter(wire => wire.from === joint || wire.to === joint).forEach((w) => this.deleteWire(w))
    })
    ArrayUtils.remove(this.components, (c) => c == component)
  }

  private deleteJoint(joint: Joint): void {
    const connectedWires = this.wires.filter(wire => wire.from === joint || wire.to === joint)

    if (connectedWires.length == 2 && joint.joints.length == 2) {
      this.mergeWires(connectedWires[0], connectedWires[1], joint)
      ArrayUtils.remove(this.joints, (j) => j == joint)
      ArrayUtils.remove(this.pins, (j) => j == joint)
    } else if (connectedWires.length > 0) {
      connectedWires.forEach((w) => this.deleteWire(w))
    } else {
      ArrayUtils.remove(this.joints, (j) => j == joint)
      ArrayUtils.remove(this.pins, (j) => j == joint)
    }
    // if (connectedWires.length === 2) {
    //   this.mergeWires(connectedWires[0], connectedWires[1], joint);
    // } else {
    //   this.wires = this.wires.filter(wire => wire.from !== joint && wire.to !== joint);
    // }

    // this.joints = this.joints.filter(j => j !== joint);
  }

  private deleteWire(wire: Wire): void {
    ArrayUtils.remove(this.wires, (w) => w == wire)
    if (wire.from instanceof Joint && wire.from.joints.length <= 1) {
      ArrayUtils.remove(this.joints, (j) => j == wire.from)
      ArrayUtils.remove(this.pins, (j) => j == wire.from)
    }
    if (wire.to instanceof Joint && wire.to.joints.length <= 1) {
      ArrayUtils.remove(this.joints, (j) => j == wire.to)
      ArrayUtils.remove(this.pins, (j) => j == wire.to)
    }
    wire.from.disconnect(wire.to)
  }

  private mergeWires(wire1: Wire, wire2: Wire, jointToRemove: Joint): void {
    const [wireFromJoint, wireToJoint] = wire1.from === jointToRemove ? [wire1, wire2] : [wire2, wire1];
    this.wires.push(new Wire(
      wireToJoint.from === jointToRemove ? wireToJoint.to : wireToJoint.from,
      wireFromJoint.to === jointToRemove ? wireFromJoint.from : wireFromJoint.to,
      [...wireToJoint.path, jointToRemove.offset, ...wireFromJoint.path]
    ));
    jointToRemove.disconnect(wire1.from == jointToRemove ? wire1.to : wire1.from)
    jointToRemove.disconnect(wire2.from == jointToRemove ? wire2.to : wire2.from)
    ArrayUtils.remove(this.wires, (w) => w == wire1 || w == wire2)
  }

  // private isPointInComponent(component: Component, x: number, y: number): boolean {
  //   const { offset, size, scale } = component;
  //   return (
  //     x >= offset[0] &&
  //     x <= offset[0] + size[0] * scale &&
  //     y >= offset[1] &&
  //     y <= offset[1] + size[1] * scale
  //   );
  // }

  // private isPointInJoint(joint: Joint, x: number, y: number): boolean {
  //   const [jx, jy] = joint.offset;
  //   return Math.abs(x - jx) <= 2 && Math.abs(y - jy) <= 2;
  // }

  // private calculatePath(from: Offset, to: Offset): Offset {
  //   return Math.abs(to[0] - from[0]) > Math.abs(to[1] - from[1]) ? [to[0], from[1]] : [from[0], to[1]]
  // }

  private onMouseDown(event: MouseEvent): void {
    this.pressed = true;
    const [scaledX, scaledY] = this.getScaledCoordinates(event);

    this.start = [event.offsetX - this.offset[0], event.offsetY - this.offset[1]];

    if (this.state == State.Interacting) return;

    if (this.handlePinSelection(scaledX, scaledY)) return
    if (this.handleJointSelection(scaledX, scaledY)) return;
    if (this.handleComponentSelection(scaledX, scaledY)) return;
    if (this.handleWireSelection(scaledX, scaledY)) return;

    if (this.selectedJoint && this.path.length > 0) {
      const lastPoint = calculateIntermediatePoint(this.path[this.path.length - 1], [scaledX, scaledY])
      
      if (Math.abs(scaledX - lastPoint[0]) <= 2 && Math.abs(scaledY - lastPoint[1]) <= 2) {
        const joint = new Joint(lastPoint)
        const wire = new Wire(this.selectedJoint, joint, this.path)
        this.joints.push(joint)
        this.wires.push(wire)
        this.selectedJoint = null
        this.state = State.None
        this.path = []
      }
    }

    this.handlePathCreation(scaledX, scaledY);

    LocalDB.set("circuit", this.toJSON())
  }

  private handlePinSelection(x: number, y: number): boolean {
    for (const pin of this.pins) {
      if (isPointInJoint(pin, x, y)) {
        if (this.selectedJoint && pin !== this.selectedJoint) {
          this.createWire(this.selectedJoint, pin);
          this.selectedJoint = null;
          this.state = State.None;
          return true;
        }
        this.selectedJoint = pin;
        this._selectedJoint = pin;
        this._selectedComponent = null;
        this._selectedWire = null;
        this.path = [];
        return true;
      }
    }
    return false;
  }
  
  private handleJointSelection(x: number, y: number): boolean {
    for (const joint of this.joints) {
      if (isPointInJoint(joint, x, y)) {
        if (this.selectedJoint && joint !== this.selectedJoint) {
          this.createWire(this.selectedJoint, joint);
          this.selectedJoint = null;
          this.state = State.None;
          return true;
        }
        this.selectedJoint = joint;
        this._selectedJoint = joint;
        this._selectedComponent = null;
        this._selectedWire = null;
        this.path = [];
        return true;
      }
    }
    return false;
  }

  private handleComponentSelection(x: number, y: number): boolean {
    for (const component of this.components) {
      if (this.state == State.Interacting) {
        if (isPointInComponent(component, x, y)) {
          component.click?.(this);
          return true;
        }
        continue;
      }

      for (const pin of component.pins) {
        if (isPointInJoint(pin, x, y)) {
          if (this.state === State.Wiring) {
            if (pin !== this.selectedJoint) {
              this.createWire(this.selectedJoint!, pin);
              this.selectedJoint = null;
              this.state = State.None;
              return true;
            }
            return true;
          }
          this.selectedJoint = pin;
          this._selectedJoint = null;
          this._selectedComponent = null;
          this._selectedWire = null;
          this.path = [];
          return true;
        }
      }

      if (this.state !== State.Wiring && isPointInComponent(component, x, y)) {
        this.selectedComponent = component;
        this._selectedComponent = component;
        this._selectedJoint = null;
        this._selectedWire = null;
        this.start = [x - component.offset[0], y - component.offset[1]];
        return true;
      }
    }
    return false;
  }

  private handleWireSelection(x: number, y: number): boolean {
    for (const wire of this.wires) {
      const index = findWireSegmentIndex(wire, x, y);
      if (index !== -1) {
        if (this.state === State.Wiring) {
          this.splitAndCreateWire(wire, index, x, y);
          return true;
        }
        this.index = index
        this.selectedWire = wire;
        this._selectedWire = wire;
        this._selectedJoint = null;
        this._selectedComponent = null;
        this.start = [x, y];

        return true;
      }
    }
    return false;
  }

  private handlePathCreation(x: number, y: number): void {
    if (this.selectedJoint) {
      const lastPoint = this.path[this.path.length - 1] ?? this.selectedJoint.offset;
      this.path.push(calculateIntermediatePoint(lastPoint, [x, y]));
    }
  }

  private onMouseUp(event: MouseEvent): void {
    const [scaledX, scaledY] = this.getScaledCoordinates(event)
    let inJoint = false
    this.joints.forEach((joint) => {
      if (isPointInJoint(joint, scaledX, scaledY)) inJoint = true
    })
    this.pins.forEach((pin) => {
      if (isPointInJoint(pin, scaledX, scaledY)) inJoint = true
    })
    if (!inJoint) {
      this.handleComponentSelection(scaledX, scaledY)
      this.handleWireSelection(scaledX, scaledY)
      LocalDB.set("circuit", this.toJSON())
    }
    this.pressed = false
    if (this.state != State.None) return
    this.selectedComponent = null
    this.selectedWire = null
    this.selectedJoint = null
  }

  __selectedJoint: typeof this._selectedJoint = null
  __selectedComponent: typeof this._selectedComponent = null

  private onMouseMove(event: MouseEvent): void {
    const [scaledX, scaledY] = this.getScaledCoordinates(event)
    
    this.__selectedJoint = null
    this.__selectedComponent = null
    for (const component of this.components) {
      if (isPointInComponent(component, scaledX, scaledY)) this.__selectedComponent = component
      for (const pin of component.pins) {
        if (isPointInJoint(pin, scaledX, scaledY)) this.__selectedJoint = pin
      }
    }
    for (const pin of this.pins) {
      if (isPointInJoint(pin, scaledX, scaledY)) this.__selectedJoint = pin
    }

    this.position = [scaledX, scaledY]
    
    if (!this.pressed) return;

    if (this.selectedWire) {
      this.selectedJoint = this.splitWire(this.start, this.selectedWire, this.index);
      this._selectedJoint = this.selectedJoint;
      this._selectedComponent = null;
      this._selectedWire = null;
      this.selectedWire = null;
      this.path = [];
    } else if (this.selectedJoint) {
      this.state = State.Wiring;
    } else if (this.selectedComponent) {
      this.moveComponent(scaledX, scaledY);
    } else if (this.state == State.None || this.state == State.Interacting) {
      this.offset = [event.offsetX - this.start[0], event.offsetY - this.start[1]];
    }
    LocalDB.set("offset", this.offset)
    LocalDB.set("circuit", this.toJSON())
  }

  private onWheel(event: WheelEvent): void {
    const scaleFactor = 1 - (event.deltaY > 0 ? 0.1 : -0.1);
    this.updateScale(event.offsetX, event.offsetY, scaleFactor);
    LocalDB.set("offset", this.offset)
    LocalDB.set("scale", this.scale)
  }

  private updateScale(x: number, y: number, scaleFactor: number): void {
    this.offset = [x - (x - this.offset[0]) * scaleFactor, y - (y - this.offset[1]) * scaleFactor]
    this.scale *= scaleFactor
  }

  paintText(text: string, offset: Offset) {
    this.context.save()
    this.context.fillStyle = "white"
    this.context.font = "bold 5px monospace"
    const metrics = this.context.measureText(text)
    const height = Math.abs(metrics.actualBoundingBoxAscent) + Math.abs(metrics.actualBoundingBoxDescent)
    this.context.beginPath()
    this.context.roundRect(offset[0] - 1 + 2, offset[1] - height - 1 - 2, metrics.width + 2, height + 2, 1)
    this.context.fill()
    this.context.fillStyle = "black"
    this.context.fillText(text, offset[0] + 2, offset[1] - 2 - 0.5)
    this.context.restore()
  }

  public paint(): void {
    this.setupContext();
    this.clearCanvas();
    this.paintGrid();

    this.context.save();
    this.context.translate(...this.offset);
    this.context.scale(this.scale, this.scale);

    this.paintWires();
    this.paintJoints();
    this.paintComponents();
    this.paintPins();
    this.paintPath();

    if (this.__selectedComponent) {
      this.paintText(this.__selectedComponent instanceof IC ? this.__selectedComponent.circuit.label : this.__selectedComponent.type, this.position)
    }

    if (this.__selectedJoint instanceof Pin) {
      this.paintText(this.__selectedJoint.label, this.position)
    }

    this.context.restore();

    const info = () => {
      const side = (side: Side) => {
        switch (side) {
          case Side.Top: return "topo"
          case Side.Right: return "direita"
          case Side.Bottom: return "base"
          case Side.Left: return "esquerda"
        }
      }

      if (this._selectedJoint instanceof Pin) {
        return `${JSON.parse(JSON.stringify(this._selectedJoint.label))} (${side(this._selectedJoint.side)})`
      }

      if (this._selectedJoint) {
        return 'Clique e arraste sobre a junta para criar um fio'
      }

      if (this._selectedComponent) {
        return `${this._selectedComponent.type}:<br />` + [this._selectedComponent.pins.map((pin, i) => (
          `${JSON.parse(JSON.stringify(pin.label))} (${side(pin.side)}) [${i}]`
        )).join('<br />')]
      }

      return 'Selecione algum elemento'
    }

    // document.querySelector<HTMLDivElement>("#info")!.innerHTML = info()
  }

  private setupContext(): void {
    this.context.lineCap = 'round'
    this.context.lineJoin = 'round'
    this.context.lineWidth = 1
    this.context.strokeStyle = 'white'
    this.context.fillStyle = 'white'
  }

  private clearCanvas(): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  private paintGrid(): void {
    this.context.save()
    this.context.strokeStyle = '#111'
    const gridSize = 50 * this.scale
    for (let x = this.offset[0] % gridSize; x < this.canvas.width; x += gridSize) {
      this.context.beginPath()
      this.context.moveTo(x, 0)
      this.context.lineTo(x, this.canvas.height)
      this.context.stroke()
    }
    for (let y = this.offset[1] % gridSize; y < this.canvas.height; y += gridSize) {
      this.context.beginPath()
      this.context.moveTo(0, y)
      this.context.lineTo(this.canvas.width, y)
      this.context.stroke()
    }
    this.context.restore()
  }

  private paintWires(): void {
    for (const wire of this.wires) {
      this.context.save()
      this.context.strokeStyle = wire.from.value || wire.to.value ? 'green' : 'white'
      this.context.beginPath()
      this.context.moveTo(...wire.from.offset)
      wire.path.forEach((point) => this.context.lineTo(...point))
      this.context.lineTo(...wire.to.offset)
      this.context.stroke()
      this.context.restore()
    }
  }

  private paintJoints(): void {
    for (const joint of this.joints) {
      this.context.save()
      this.context.beginPath()
      this.context.arc(joint.offset[0], joint.offset[1], 2, 0, Math.PI * 2)
      this.context.fillStyle = joint.value ? 'green' : 'white'
      this.context.fill()
      this.context.restore()
    }
  }

  private paintComponents(): void {
    this.components.forEach((component) => component.paint(this))
  }

  private paintPins(): void {
    for (const pin of this.pins) {
      this.context.beginPath()
      this.context.save()
      this.context.arc(pin.offset[0], pin.offset[1], 1, 0, Math.PI * 2)
      this.context.strokeStyle = pin.value ? 'green' : 'white'
      this.context.lineWidth = 2
      this.context.stroke()
      this.context.arc(pin.offset[0], pin.offset[1], 1, 0, Math.PI * 2)
      this.context.fillStyle = 'black'
      this.context.fill()
      this.context.restore()
    }
  }

  private paintPath(): void {
    if (this.state != State.Wiring || !this.selectedJoint) return
    this.context.beginPath()
    this.context.moveTo(...this.selectedJoint.offset)
    this.path.forEach((point) => this.context.lineTo(...point))
    this.context.lineTo(...calculateIntermediatePoint(this.path[this.path.length - 1] ?? this.selectedJoint.offset, this.position))
    this.context.lineTo(...this.position)
    this.context.stroke()
  }

  private getScaledCoordinates(event: MouseEvent): Offset {
    return [(event.offsetX - this.offset[0]) / this.scale, (event.offsetY - this.offset[1]) / this.scale]
  }

  private createWire(from: Joint, to: Joint): void {
    this.path.push(calculateIntermediatePoint(this.path[this.path.length - 1] ?? from.offset, to.offset))
    this.wires.push(new Wire(from, to, this.path))
    this.path = []
  }

  private splitAndCreateWire(wire: Wire, index: number, x: number, y: number): void {
    this.createWire(this.selectedJoint!, this.splitWire([x, y], wire, index))
    this.selectedJoint = null
    this.state = State.None
  }

  private splitWire(point: Offset, wire: Wire, pathIndex: number): Joint {
    const joint = new Joint(this.snapToWire(point, wire, pathIndex))
    this.joints.push(joint)
    this.wires.push(new Wire(joint, wire.to, wire.path.slice(pathIndex)))
    wire.path = wire.path.slice(0, pathIndex)
    wire.from.disconnect(wire.to)
    wire.to = joint
    wire.from.connect(joint)
    return joint
  }

  private snapToWire(point: Offset, wire: Wire, pathIndex: number): Offset {
    const start = pathIndex === 0 ? wire.from.offset : wire.path[pathIndex - 1]
    const end = pathIndex === wire.path.length ? wire.to.offset : wire.path[pathIndex]
    return Math.abs(end[0] - start[0]) > Math.abs(end[1] - start[1]) ? [point[0], start[1]] : [start[0], point[1]]
  }

  private moveComponent(x: number, y: number): void {
    this.selectedComponent!.offset = [x - this.start[0], y - this.start[1]]
    this.selectedComponent!.calc()
    this.adjustConnectedWires(this.selectedComponent!)
  }

  private adjustConnectedWires(component: Component): void {
    component.pins.forEach((pin) => this.wires.filter(wire => wire.from === pin || wire.to === pin).forEach((wire) => this.adjustWire(wire, pin)))
  }
  
  private adjustWire(wire: Wire, movedPin: Pin): void {
    if (wire.path.length === 0) wire.path = [calculateIntermediatePoint(wire.from.offset, wire.to.offset)]
    else if (wire.from == movedPin) wire.path[0] = calculateIntermediatePoint(wire.from.offset, wire.path[1] ?? wire.to.offset)
    else wire.path[wire.path.length - 1] = calculateIntermediatePoint(wire.path[wire.path.length - 2] ?? wire.from.offset, wire.to.offset)
  }
}