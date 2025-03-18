// io.ts
class Joint {
  offset;
  joints = [];
  #value;
  #maxValue;
  #isDirty = false;
  get value() {
    if (this.#isDirty) {
      this.#updateMaxValue();
    }
    return this.#maxValue;
  }
  constructor(offset = [0, 0], value = 0) {
    this.#value = value;
    this.#maxValue = value;
    this.offset = offset;
  }
  #markDirty() {
    if (!this.#isDirty) {
      this.#isDirty = true;
      for (const joint of this) {
        joint.#markDirty();
      }
    }
  }
  #updateMaxValue() {
    this.#maxValue = this.#value;
    for (const joint of this) {
      if (joint.#value > this.#maxValue) {
        this.#maxValue = joint.#value;
      }
    }
    this.#isDirty = false;
  }
  connect(joint) {
    this.joints.push(joint);
    joint.joints.push(this);
    this.#markDirty();
    joint.#markDirty();
  }
  disconnect(joint) {
    const i0 = this.joints.indexOf(joint);
    const i1 = joint.joints.indexOf(this);
    if (i0 > -1) {
      this.joints[i0] = this.joints[this.joints.length - 1];
      this.joints.pop();
      this.#markDirty();
    }
    if (i1 > -1) {
      joint.joints[i1] = joint.joints[joint.joints.length - 1];
      joint.joints.pop();
      joint.#markDirty();
    }
  }
  write(value) {
    if (this.value != this.#value) {
      this.#markDirty();
    }
    this.#value = value;
  }
  *[Symbol.iterator]() {
    const queue = [this];
    const visited = new Set;
    let index = 0;
    while (index < queue.length) {
      const current = queue[index++];
      if (!visited.has(current)) {
        visited.add(current);
        yield current;
        for (const joint of current.joints) {
          if (!visited.has(joint)) {
            queue.push(joint);
          }
        }
      }
    }
  }
}

class Pin extends Joint {
  label;
  side;
  constructor(label, side, value = 0, offset = [0, 0]) {
    super(offset, value);
    this.label = label;
    this.side = side;
  }
}

// wire.ts
class Wire {
  from;
  to;
  path;
  constructor(from, to, path = []) {
    this.from = from;
    this.to = to;
    this.path = path;
    this.from.connect(this.to);
  }
}

// utils.ts
var calculateIntermediatePoint = (from, to) => Math.abs(to[0] - from[0]) > Math.abs(to[1] - from[1]) ? [to[0], from[1]] : [from[0], to[1]];
var isPointInComponent = (component, x, y) => {
  const { offset, size, scale, rotation } = component;
  const centerX = offset[0] + size[0] * scale / 2;
  const centerY = offset[1] + size[1] * scale / 2;
  const translatedX = x - centerX;
  const translatedY = y - centerY;
  const angle = -rotation * Math.PI / 180;
  const rotatedX = translatedX * Math.cos(angle) - translatedY * Math.sin(angle);
  const rotatedY = translatedX * Math.sin(angle) + translatedY * Math.cos(angle);
  const halfWidth = size[0] * scale / 2;
  const halfHeight = size[1] * scale / 2;
  return rotatedX >= -halfWidth && rotatedX <= halfWidth && rotatedY >= -halfHeight && rotatedY <= halfHeight;
};
var isPointInJoint = (joint, x, y, tolerance = 2) => Math.abs(x - joint.offset[0]) <= tolerance && Math.abs(y - joint.offset[1]) <= tolerance;
var findWireSegmentIndex = (wire, x, y, tolerance = 2) => {
  let from = wire.from.offset;
  for (let i = 0;i < wire.path.length; i++) {
    if (distanceToLineSegment(x, y, ...from, ...wire.path[i]) <= tolerance) {
      return i;
    }
    from = wire.path[i];
  }
  if (distanceToLineSegment(x, y, ...from, ...wire.to.offset) <= tolerance) {
    return wire.path.length;
  }
  return -1;
};

class ArrayUtils {
  static remove(array, predicate) {
    if (array.length === 0)
      return;
    let writeIndex = 0;
    let readIndex = 0;
    while (readIndex < array.length) {
      if (!predicate(array[readIndex], readIndex, array)) {
        if (writeIndex !== readIndex) {
          array[writeIndex] = array[readIndex];
        }
        writeIndex++;
      }
      readIndex++;
    }
    if (writeIndex < array.length) {
      array.length = writeIndex;
    }
  }
}
var calcPathBBox = (path) => {
  const svgNS = "http://www.w3.org/2000/svg";
  const svgEl = document.createElementNS(svgNS, "svg");
  svgEl.style.position = "absolute";
  svgEl.style.width = "0px";
  svgEl.style.height = "0px";
  const pathEl = document.createElementNS(svgNS, "path");
  pathEl.setAttributeNS(null, "d", path);
  svgEl.appendChild(pathEl);
  document.body.appendChild(svgEl);
  const result = svgEl.getBBox();
  svgEl.remove();
  return result;
};
var distanceToLineSegment = (px, py, x1, y1, x2, y2) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) {
    return (px - x1) ** 2 + (py - y1) ** 2;
  }
  const t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
  if (t <= 0)
    return (px - x1) ** 2 + (py - y1) ** 2;
  if (t >= 1)
    return (px - x2) ** 2 + (py - y2) ** 2;
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return (px - projX) ** 2 + (py - projY) ** 2;
};
var Data;
((Data) => {
  let Type;
  ((Type2) => {
    Type2[Type2["Component"] = 0] = "Component";
    Type2[Type2["Joint"] = 1] = "Joint";
    Type2[Type2["Pin"] = 2] = "Pin";
  })(Type = Data.Type ||= {});
})(Data ||= {});

class Circuit {
  constructor(init) {
    Object.assign(this, init);
  }
  tick() {
    for (const component of this.components) {
      component.tick?.();
    }
  }
  toJSON() {
    return {
      label: this.label,
      components: this.components.map((component) => ({
        type: component.type,
        offset: component.offset,
        scale: component.scale,
        rotation: component.rotation,
        ...component instanceof IC ? { circuit: component.circuit.toJSON() } : {}
      })),
      joints: this.joints.map((joint) => ({
        offset: joint.offset
      })),
      pins: this.pins.map((pin) => ({
        offset: pin.offset,
        side: pin.side,
        label: pin.label
      })),
      wires: this.wires.map((wire) => {
        const _ = (joint) => {
          if (joint instanceof Pin) {
            const i = this.pins.indexOf(joint);
            if (i > -1) {
              return {
                type: 2 /* Pin */,
                indexes: [i]
              };
            } else {
              for (const i2 in this.components) {
                for (const j in this.components[i2].pins) {
                  if (this.components[i2].pins[j] == joint) {
                    return {
                      type: 0 /* Component */,
                      indexes: [+i2, +j]
                    };
                  }
                }
              }
            }
          } else {
            const i = this.joints.indexOf(joint);
            if (i > -1) {
              return {
                type: 1 /* Joint */,
                indexes: [i]
              };
            }
          }
          return null;
        };
        return {
          from: _(wire.from),
          to: _(wire.to),
          path: wire.path
        };
      })
    };
  }
  static parseJSON(data) {
    const components = data.components.map((component) => {
      const c = builtIn(component.type, {
        offset: component.offset,
        rotation: component.rotation
      }, component.type == "ic" ? new Circuit(Circuit.parseJSON(component.circuit)) : undefined);
      if (!c) {
        throw new Error("component not found");
      }
      c.calc();
      return c;
    });
    const joints = data.joints.map((joint) => {
      return new Joint(joint.offset);
    });
    const pins = data.pins.map((pin) => {
      return new Pin(pin.label, pin.side, 0, pin.offset);
    });
    const wires = data.wires.map((wire) => {
      const fromIndexed = (indexed) => {
        switch (indexed.type) {
          case 0 /* Component */:
            return components[indexed.indexes[0]].pins[indexed.indexes[1]];
          case 1 /* Joint */:
            return joints[indexed.indexes[0]];
          case 2 /* Pin */:
            return pins[indexed.indexes[0]];
        }
      };
      const from = 2 /* Pin */;
      return new Wire(fromIndexed(wire.from), fromIndexed(wire.to), wire.path);
    });
    return { label: data.label, components, joints, wires, pins };
  }
}

class LocalDB {
  static set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  static get(key, defaultValue = null) {
    const value = localStorage.getItem(key);
    if (value) {
      return JSON.parse(value);
    }
    return defaultValue;
  }
  static remove(key) {
    localStorage.removeItem(key);
  }
}

// component.ts
class Component {
  constructor(init) {
    Object.assign(this, init ?? {});
    this.transformPath();
  }
  calc() {
    const [width, height] = [this.size[0] * this.scale, this.size[1] * this.scale];
    const [halfWidth, halfHeight] = [width / 2, height / 2];
    const [offsetX, offsetY] = this.offset;
    const rotationRad = this.rotation * Math.PI / 180;
    const rotatePoint = (x, y) => [
      x * Math.cos(rotationRad) - y * Math.sin(rotationRad),
      x * Math.sin(rotationRad) + y * Math.cos(rotationRad)
    ];
    const calculate = (pins, side) => {
      const gap = (side == 0 /* Top */ || side == 2 /* Bottom */ ? width : height) / (pins.length + 1);
      pins.forEach((pin, index) => {
        const offsetIndex = gap + gap * index;
        let x, y;
        switch (side) {
          case 3 /* Left */:
            [x, y] = [-5, offsetIndex];
            break;
          case 0 /* Top */:
            [x, y] = [offsetIndex, -5];
            break;
          case 1 /* Right */:
            [x, y] = [width + 5, offsetIndex];
            break;
          case 2 /* Bottom */:
            [x, y] = [offsetIndex, height + 5];
            break;
        }
        const [rotatedX, rotatedY] = rotatePoint(x - halfWidth, y - halfHeight);
        pin.offset = [
          offsetX + halfWidth + rotatedX,
          offsetY + halfHeight + rotatedY
        ];
      });
    };
    [0 /* Top */, 3 /* Left */, 1 /* Right */, 2 /* Bottom */].forEach((side) => calculate(this.pins.filter((pin) => pin.side === side), side));
    this.transformPath();
  }
  paint(engine) {
    for (const pin of this.pins) {
      engine.context.save();
      engine.context.beginPath();
      engine.context.arc(pin.offset[0], pin.offset[1], 2, 0, Math.PI * 2);
      if (pin.value) {
        engine.context.fillStyle = "green";
      }
      engine.context.fill();
      engine.context.restore();
    }
    engine.context.stroke(this.transformedPath);
  }
  transformedPath;
  transformPath() {
    const halfWidth = this.size[0] * this.scale / 2;
    const halfHeight = this.size[1] * this.scale / 2;
    const transform = new DOMMatrix().translate(this.offset[0] + halfWidth, this.offset[1] + halfHeight).rotate(this.rotation).translate(-halfWidth, -halfHeight).scale(this.scale);
    const path = new Path2D;
    path.addPath(this.path, transform);
    this.transformedPath = path;
  }
}

// builtin/and.ts
class And extends Component {
  constructor(init) {
    const path = "M0 0 2 0Q4 0 4 2 4 4 2 4L0 4Z";
    const { width, height } = calcPathBBox(path);
    super({
      type: "and",
      offset: [0, 0],
      scale: 5,
      rotation: 0,
      size: [width, height],
      path: new Path2D(path),
      pins: [new Pin("in1", 3 /* Left */), new Pin("in2", 3 /* Left */), new Pin("out", 1 /* Right */)],
      ...init
    });
  }
  tick = () => this.pins[2].write(this.pins[0].value * this.pins[1].value);
}

// builtin/buffer.ts
class Buffer extends Component {
  constructor(init) {
    const path = "M0 0 2 1 0 2Z";
    const { width, height } = calcPathBBox(path);
    super({
      type: "buffer",
      offset: [0, 0],
      scale: 5 + 1.75,
      rotation: 0,
      size: [width, height],
      path: new Path2D(path),
      pins: [new Pin("in", 3 /* Left */), new Pin("out", 1 /* Right */)],
      ...init
    });
  }
  tick() {
    this.pins[1].write(this.pins[0].value);
  }
}

// builtin/ic.ts
class IC extends Component {
  circuit;
  constructor(init, circuit = new Circuit({ label: "", components: [], joints: [], pins: [], wires: [] })) {
    const path = "M0 1A1 1 0 011 0L7 0A1 1 0 018 1L8 7A1 1 0 017 8L1 8A1 1 0 010 7ZM1 2A1 1 0 012 1L6 1A1 1 0 017 2L7 6 6 7 2 7A1 1 0 011 6Z";
    const { width, height } = calcPathBBox(path);
    let length = Math.max(...[0 /* Top */, 3 /* Left */, 1 /* Right */, 2 /* Bottom */].map((side) => circuit.pins.filter((pin) => pin.side === side).length));
    super({
      type: "ic",
      offset: [0, 0],
      scale: 1 + length * 0.75,
      rotation: 0,
      size: [width, height],
      path: new Path2D(path),
      pins: circuit.pins.map((pin) => {
        const newPin = new Pin(pin.label, pin.side, 0, pin.offset);
        newPin.connect(pin);
        return newPin;
      }),
      ...init
    });
    this.circuit = circuit;
  }
  tick() {
    this.circuit.tick();
  }
}

// builtin/input.ts
class Input extends Component {
  constructor(init) {
    const path = "M0 0 1 0 1 1 0 1Z";
    const { width, height } = calcPathBBox(path);
    super({
      type: "input",
      offset: [0, 0],
      scale: 10 + 3.5,
      rotation: 0,
      size: [width, height],
      path: new Path2D(path),
      pins: [new Pin("out", 1 /* Right */)],
      ...init
    });
  }
  #state = 0;
  click(engine) {
    this.#state = 1 - this.#state;
    this.pins[0].write(this.#state);
  }
  tick = () => this.pins[0].write(this.#state);
  paint(engine) {
    if (this.#state) {
      engine.context.save();
      engine.context.fillStyle = "green";
      engine.context.fill(this.transformedPath);
      engine.context.restore();
    }
    super.paint(engine);
  }
}

// builtin/inverter.ts
class Inverter extends Component {
  constructor(init) {
    const path = "M0 0 8 4 0 8ZM8 4A1 1 0 0010 4 1 1 0 008 4";
    const { width, height } = calcPathBBox(path);
    super({
      type: "inverter",
      offset: [0, 0],
      scale: 1.25 + 0.4375,
      rotation: 0,
      size: [width, height],
      path: new Path2D(path),
      pins: [new Pin("in", 3 /* Left */), new Pin("out", 1 /* Right */)],
      ...init
    });
  }
  tick() {
    this.pins[1].write(1 - this.pins[0].value);
  }
}

// builtin/nand.ts
class Nand extends Component {
  constructor(init) {
    const path = "M0 0 4 0Q8 0 8 4 8 8 4 8L0 8ZM8 4A1 1 0 0010 4 1 1 0 008 4";
    const { width, height } = calcPathBBox(path);
    super({
      type: "nand",
      offset: [0, 0],
      scale: 2.5,
      rotation: 0,
      size: [width, height],
      path: new Path2D(path),
      pins: [new Pin("in1", 3 /* Left */), new Pin("in2", 3 /* Left */), new Pin("out", 1 /* Right */)],
      ...init
    });
  }
  tick = () => this.pins[2].write(1 - this.pins[0].value * this.pins[1].value);
}

// builtin/nor.ts
class Nor extends Component {
  constructor(init) {
    const path = "M0 0Q2 4 0 8 4 8 8 4 4 0 0 0M8 4A1 1 0 0010 4 1 1 0 008 4";
    const { width, height } = calcPathBBox(path);
    super({
      type: "nor",
      offset: [0, 0],
      scale: 2.5,
      rotation: 0,
      size: [width, height],
      path: new Path2D(path),
      pins: [new Pin("in1", 3 /* Left */), new Pin("in2", 3 /* Left */), new Pin("out", 1 /* Right */)],
      ...init
    });
  }
  tick = () => this.pins[2].write(1 - Math.max(this.pins[0].value, this.pins[1].value));
}

// builtin/or.ts
class Or extends Component {
  constructor(init) {
    const path = "M0 0Q1 2 0 4 2 4 4 2 2 0 0 0";
    const { width, height } = calcPathBBox(path);
    super({
      type: "or",
      offset: [0, 0],
      scale: 5,
      rotation: 0,
      size: [width, height],
      path: new Path2D(path),
      pins: [new Pin("in1", 3 /* Left */), new Pin("in2", 3 /* Left */), new Pin("out", 1 /* Right */)],
      ...init
    });
  }
  tick = () => this.pins[2].write(Math.max(this.pins[0].value, this.pins[1].value));
}

// builtin/output.ts
class Output extends Component {
  constructor(init) {
    const path = "M0 1A1 1 0 002 1 1 1 0 000 1";
    const { width, height } = calcPathBBox(path);
    super({
      type: "output",
      offset: [0, 0],
      scale: 5 + 1.75,
      rotation: 0,
      size: [width, height],
      path: new Path2D(path),
      pins: [new Pin("in", 3 /* Left */)],
      ...init
    });
  }
  paint(engine) {
    if (this.pins[0].value) {
      engine.context.save();
      engine.context.fillStyle = "green";
      engine.context.fill(this.transformedPath);
      engine.context.restore();
    }
    super.paint(engine);
  }
}

// builtin/sevendisplay.ts
class SevenDisplay extends Component {
  segments;
  constructor(init) {
    const path = "M2 2 3 1 7 1 8 2 7 3 3 3ZM8 2 9 3 9 7 8 8 7 7 7 3ZM8 8 9 9 9 13 8 14 7 13 7 9ZM8 14 7 15 3 15 2 14 3 13 7 13ZM2 14 1 13 1 9 2 8 3 9 3 13ZM2 8 1 7 1 3 2 2 3 3 3 7ZM2 8 3 7 7 7 8 8 7 9 3 9ZM10 14A1 1 0 0112 14 1 1 0 0110 14ZM1 0A1 1 0 000 1L0 15A1 1 0 001 16L12 16A1 1 0 0013 15L13 1A1 1 0 0012 0Z";
    const { width, height } = calcPathBBox(path);
    super({
      type: "seven-display",
      offset: [0, 0],
      scale: 3.5,
      rotation: 0,
      size: [width, height],
      path: new Path2D(path),
      pins: Array.from({ length: 8 }, (_, i) => new Pin("abcdefgh"[i], 3 /* Left */)),
      ...init
    });
    this.segments = path.split(/(?=M)/).map((path2) => new Path2D(path2));
  }
  paint(engine) {
    const path = this.path;
    const transformedPath = this.transformedPath;
    for (const i in this.pins) {
      if (this.pins[i].value) {
        this.path = this.segments[i];
        engine.context.save();
        engine.context.fillStyle = "green";
        this.transformPath();
        engine.context.fill(this.transformedPath);
        engine.context.restore();
      }
    }
    this.path = path;
    this.transformedPath = transformedPath;
    super.paint(engine);
  }
}

// builtin/three-and.ts
class ThreeAnd extends Component {
  constructor(init) {
    const path = "M0 0 2 0Q4 0 4 2 4 4 2 4L0 4Z";
    const { width, height } = calcPathBBox(path);
    super({
      type: "three-and",
      offset: [0, 0],
      scale: 5 + 1.25,
      rotation: 0,
      size: [width, height],
      path: new Path2D(path),
      pins: [new Pin("in1", 3 /* Left */), new Pin("in2", 3 /* Left */), new Pin("in3", 3 /* Left */), new Pin("out", 1 /* Right */)],
      ...init
    });
  }
  tick = () => this.pins[3].write(this.pins[0].value * this.pins[1].value * this.pins[2].value);
}

// builtin/three-nand.ts
class ThreeNand extends Component {
  constructor(init) {
    const path = "M0 0 4 0Q8 0 8 4 8 8 4 8L0 8ZM8 4A1 1 0 0010 4 1 1 0 008 4";
    const { width, height } = calcPathBBox(path);
    super({
      type: "three-nand",
      offset: [0, 0],
      scale: 3,
      rotation: 0,
      size: [width, height],
      path: new Path2D(path),
      pins: [new Pin("in1", 3 /* Left */), new Pin("in2", 3 /* Left */), new Pin("in3", 3 /* Left */), new Pin("out", 1 /* Right */)],
      ...init
    });
  }
  tick = () => this.pins[3].write(1 - this.pins[0].value * this.pins[1].value * this.pins[2].value);
}

// builtin/three-nor.ts
class ThreeNor extends Component {
  constructor(init) {
    const path = "M0 0Q2 4 0 8 4 8 8 4 4 0 0 0M8 4A1 1 0 0010 4 1 1 0 008 4";
    const { width, height } = calcPathBBox(path);
    super({
      type: "three-nor",
      offset: [0, 0],
      scale: 3,
      rotation: 0,
      size: [width, height],
      path: new Path2D(path),
      pins: [new Pin("in1", 3 /* Left */), new Pin("in2", 3 /* Left */), new Pin("in3", 3 /* Left */), new Pin("out", 1 /* Right */)],
      ...init
    });
  }
  tick = () => this.pins[3].write(1 - Math.max(this.pins[0].value, this.pins[1].value, this.pins[2].value));
}

// builtin/three-or.ts
class ThreeOr extends Component {
  constructor(init) {
    const path = "M0 0Q1 2 0 4 2 4 4 2 2 0 0 0";
    const { width, height } = calcPathBBox(path);
    super({
      type: "three-or",
      offset: [0, 0],
      scale: 5 + 1.25,
      rotation: 0,
      size: [width, height],
      path: new Path2D(path),
      pins: [new Pin("in1", 3 /* Left */), new Pin("in2", 3 /* Left */), new Pin("in3", 3 /* Left */), new Pin("out", 1 /* Right */)],
      ...init
    });
  }
  tick = () => this.pins[3].write(Math.max(this.pins[0].value, this.pins[1].value, this.pins[2].value));
}

// builtin/xnor.ts
class Xnor extends Component {
  constructor(init) {
    const path = "M1 0Q3 4 1 8 5 8 9 4 5 0 1 0M0 0Q2 4 0 8M9 4A1 1 0 0011 4 1 1 0 009 4";
    const { width, height } = calcPathBBox(path);
    super({
      type: "xnor",
      offset: [0, 0],
      scale: 2.5,
      rotation: 0,
      size: [width, height],
      path: new Path2D(path),
      pins: [new Pin("in1", 3 /* Left */), new Pin("in2", 3 /* Left */), new Pin("out", 1 /* Right */)],
      ...init
    });
  }
  tick = () => this.pins[2].write(1 - (this.pins[0].value + this.pins[1].value) % 2);
}

// builtin/xor.ts
class Xor extends Component {
  constructor(init) {
    const path = "M1 0Q3 4 1 8 5 8 9 4 5 0 1 0M0 0Q2 4 0 8";
    const { width, height } = calcPathBBox(path);
    super({
      type: "xor",
      offset: [0, 0],
      scale: 2.5,
      rotation: 0,
      size: [width, height],
      path: new Path2D(path),
      pins: [new Pin("in1", 3 /* Left */), new Pin("in2", 3 /* Left */), new Pin("out", 1 /* Right */)],
      ...init
    });
  }
  tick = () => this.pins[2].write((this.pins[0].value + this.pins[1].value) % 2);
}

// builtin/index.ts
function builtIn(type, init, extra) {
  switch (type) {
    case "input":
      return new Input(init);
    case "output":
      return new Output(init);
    case "buffer":
      return new Buffer(init);
    case "inverter":
      return new Inverter(init);
    case "and":
      return new And(init);
    case "nand":
      return new Nand(init);
    case "or":
      return new Or(init);
    case "nor":
      return new Nor(init);
    case "xor":
      return new Xor(init);
    case "xnor":
      return new Xnor(init);
    case "three-and":
      return new ThreeAnd(init);
    case "three-nand":
      return new ThreeNand(init);
    case "three-or":
      return new ThreeOr(init);
    case "three-nor":
      return new ThreeNor(init);
    case "seven-display":
      return new SevenDisplay(init);
    case "ic":
      return new IC(init, extra);
    default:
      return null;
  }
}

// engine.ts
class Engine extends Circuit {
  state = 0 /* None */;
  canvas;
  context;
  offset = [50, 50];
  scale = 2;
  start = [0, 0];
  pressed = false;
  selectedComponent = null;
  selectedJoint = null;
  selectedWire = null;
  position = [0, 0];
  path = [];
  index = -1;
  _selectedComponent = null;
  _selectedJoint = null;
  _selectedWire = null;
  constructor(canvas, options = {
    label: "",
    components: [],
    wires: [],
    joints: [],
    pins: []
  }) {
    super(options);
    this.canvas = canvas;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Unable to get 2D rendering context");
    }
    this.context = context;
    this.initEventListeners();
  }
  initEventListeners() {
    this.canvas.addEventListener("mousedown", this.onMouseDown.bind(this));
    this.canvas.addEventListener("mouseup", this.onMouseUp.bind(this));
    this.canvas.addEventListener("mouseleave", this.onMouseUp.bind(this));
    this.canvas.addEventListener("mousemove", this.onMouseMove.bind(this));
    this.canvas.addEventListener("wheel", this.onWheel.bind(this));
    window.addEventListener("keydown", this.onKeyDown.bind(this));
  }
  onKeyDown(event) {
    if (event.key === "Delete" || event.key === "Backspace") {
      this.deleteSelectedElement();
    } else if (event.key === "Escape") {
      this.cancelWiring();
    } else if (event.ctrlKey || event.metaKey) {
      console.log("...");
      switch (event.key.toLowerCase()) {
        case "arrowup":
        case "arrowdown":
        case "arrowleft":
        case "arrowright":
          if (this._selectedJoint)
            this.toPin(this._selectedJoint, event.key.toLowerCase());
          break;
        case " ":
          if (this._selectedComponent) {
            this._selectedComponent.rotation += 90;
            if (this._selectedComponent.rotation > 270)
              this._selectedComponent.rotation = 0;
            this._selectedComponent.calc();
          }
          if (this._selectedJoint instanceof Pin)
            this.toJoint(this._selectedJoint);
          break;
        case "c":
          this.copySelectedComponent();
          break;
        case "x":
          this.cutSelectedComponent();
          break;
        case "v":
          this.pasteComponent();
          break;
          break;
      }
    }
    LocalDB.set("circuit", this.toJSON());
  }
  toPin(joint, key) {
    const side = () => {
      switch (key) {
        case "arrowup":
          return 0 /* Top */;
        case "arrowdown":
          return 2 /* Bottom */;
        case "arrowleft":
          return 3 /* Left */;
        case "arrowright":
          return 1 /* Right */;
        default:
          throw new Error("");
      }
    };
    if (joint instanceof Pin) {
      joint.side = side();
      ArrayUtils.remove(this.pins, (j) => j == joint);
      this.pins.push(joint);
      return;
    }
    const pin = new Pin(prompt("Nome do pino:") ?? "", side(), 0, joint.offset);
    joint.joints.forEach((j) => {
      pin.connect(j);
      joint.disconnect(j);
    });
    const wire = this.wires.find((wire2) => wire2.from == joint || wire2.to == joint);
    if (wire) {
      if (wire.from == joint)
        wire.from = pin;
      if (wire.to == joint)
        wire.to = pin;
    }
    ArrayUtils.remove(this.joints, (j) => j == joint);
    this.pins.push(pin);
    this._selectedJoint = pin;
  }
  toJoint(pin) {
    const joint = new Joint(pin.offset);
    pin.joints.forEach((j) => {
      joint.connect(j);
      pin.disconnect(j);
    });
    const wire = this.wires.find((wire2) => wire2.from == pin || wire2.to == pin);
    if (wire) {
      if (wire.from == pin)
        wire.from = joint;
      if (wire.to == pin)
        wire.to = joint;
    }
    ArrayUtils.remove(this.pins, (j) => j == pin);
    this.joints.push(joint);
    this._selectedJoint = joint;
  }
  clipboard = null;
  copySelectedComponent() {
    if (this._selectedComponent) {
      this.clipboard = this._selectedComponent;
    }
  }
  cutSelectedComponent() {
    if (this._selectedComponent) {
      this.copySelectedComponent();
      this.deleteComponent(this._selectedComponent);
      this._selectedComponent = null;
      LocalDB.set("circuit", this.toJSON());
    }
  }
  pasteComponent() {
    if (this.clipboard) {
      const component = builtIn(this.clipboard.type, {
        offset: this.position
      }, this.clipboard instanceof IC ? new Circuit(Circuit.parseJSON(this.clipboard.circuit.toJSON())) : undefined);
      this.components.push(component);
      component.calc();
      LocalDB.set("circuit", this.toJSON());
    }
  }
  history = [];
  historyIndex = -1;
  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.loadState(this.history[this.historyIndex]);
    }
  }
  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.loadState(this.history[this.historyIndex]);
    }
  }
  loadState(state) {
    Object.assign(this, state);
  }
  addToHistory() {
    const currentState = JSON.stringify(this);
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(currentState);
    this.historyIndex = this.history.length - 1;
  }
  cancelWiring() {
    if (this.state === 1 /* Wiring */) {
      this.selectedJoint = null;
      this.state = 0 /* None */;
      this.path = [];
    }
  }
  deleteSelectedElement() {
    if (this.state == 0 /* None */) {
      if (this._selectedWire)
        this.deleteWire(this._selectedWire);
      if (this._selectedJoint)
        this.deleteJoint(this._selectedJoint);
      if (this._selectedComponent)
        this.deleteComponent(this._selectedComponent);
    }
    this.selectedComponent = this._selectedComponent = null;
    this.selectedJoint = this._selectedJoint = null;
    this.selectedWire = this._selectedWire = null;
    this.state = 0 /* None */;
  }
  deleteComponent(component) {
    component.pins.forEach((joint) => {
      this.wires.filter((wire) => wire.from === joint || wire.to === joint).forEach((w) => this.deleteWire(w));
    });
    ArrayUtils.remove(this.components, (c) => c == component);
  }
  deleteJoint(joint) {
    const connectedWires = this.wires.filter((wire) => wire.from === joint || wire.to === joint);
    if (connectedWires.length == 2 && joint.joints.length == 2) {
      this.mergeWires(connectedWires[0], connectedWires[1], joint);
      ArrayUtils.remove(this.joints, (j) => j == joint);
      ArrayUtils.remove(this.pins, (j) => j == joint);
    } else if (connectedWires.length > 0) {
      connectedWires.forEach((w) => this.deleteWire(w));
    } else {
      ArrayUtils.remove(this.joints, (j) => j == joint);
      ArrayUtils.remove(this.pins, (j) => j == joint);
    }
  }
  deleteWire(wire) {
    ArrayUtils.remove(this.wires, (w) => w == wire);
    if (wire.from instanceof Joint && wire.from.joints.length <= 1) {
      ArrayUtils.remove(this.joints, (j) => j == wire.from);
      ArrayUtils.remove(this.pins, (j) => j == wire.from);
    }
    if (wire.to instanceof Joint && wire.to.joints.length <= 1) {
      ArrayUtils.remove(this.joints, (j) => j == wire.to);
      ArrayUtils.remove(this.pins, (j) => j == wire.to);
    }
    wire.from.disconnect(wire.to);
  }
  mergeWires(wire1, wire2, jointToRemove) {
    const [wireFromJoint, wireToJoint] = wire1.from === jointToRemove ? [wire1, wire2] : [wire2, wire1];
    this.wires.push(new Wire(wireToJoint.from === jointToRemove ? wireToJoint.to : wireToJoint.from, wireFromJoint.to === jointToRemove ? wireFromJoint.from : wireFromJoint.to, [...wireToJoint.path, jointToRemove.offset, ...wireFromJoint.path]));
    jointToRemove.disconnect(wire1.from == jointToRemove ? wire1.to : wire1.from);
    jointToRemove.disconnect(wire2.from == jointToRemove ? wire2.to : wire2.from);
    ArrayUtils.remove(this.wires, (w) => w == wire1 || w == wire2);
  }
  onMouseDown(event) {
    this.pressed = true;
    const [scaledX, scaledY] = this.getScaledCoordinates(event);
    this.start = [event.offsetX - this.offset[0], event.offsetY - this.offset[1]];
    if (this.state == 2 /* Interacting */)
      return;
    if (this.handlePinSelection(scaledX, scaledY))
      return;
    if (this.handleJointSelection(scaledX, scaledY))
      return;
    if (this.handleComponentSelection(scaledX, scaledY))
      return;
    if (this.handleWireSelection(scaledX, scaledY))
      return;
    if (this.selectedJoint && this.path.length > 0) {
      const lastPoint = calculateIntermediatePoint(this.path[this.path.length - 1], [scaledX, scaledY]);
      if (Math.abs(scaledX - lastPoint[0]) <= 2 && Math.abs(scaledY - lastPoint[1]) <= 2) {
        const joint = new Joint(lastPoint);
        const wire = new Wire(this.selectedJoint, joint, this.path);
        this.joints.push(joint);
        this.wires.push(wire);
        this.selectedJoint = null;
        this.state = 0 /* None */;
        this.path = [];
      }
    }
    this.handlePathCreation(scaledX, scaledY);
    LocalDB.set("circuit", this.toJSON());
  }
  handlePinSelection(x, y) {
    for (const pin of this.pins) {
      if (isPointInJoint(pin, x, y)) {
        if (this.selectedJoint && pin !== this.selectedJoint) {
          this.createWire(this.selectedJoint, pin);
          this.selectedJoint = null;
          this.state = 0 /* None */;
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
  handleJointSelection(x, y) {
    for (const joint of this.joints) {
      if (isPointInJoint(joint, x, y)) {
        if (this.selectedJoint && joint !== this.selectedJoint) {
          this.createWire(this.selectedJoint, joint);
          this.selectedJoint = null;
          this.state = 0 /* None */;
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
  handleComponentSelection(x, y) {
    for (const component of this.components) {
      if (this.state == 2 /* Interacting */) {
        if (isPointInComponent(component, x, y)) {
          component.click?.(this);
          return true;
        }
        continue;
      }
      for (const pin of component.pins) {
        if (isPointInJoint(pin, x, y)) {
          if (this.state === 1 /* Wiring */) {
            if (pin !== this.selectedJoint) {
              this.createWire(this.selectedJoint, pin);
              this.selectedJoint = null;
              this.state = 0 /* None */;
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
      if (this.state !== 1 /* Wiring */ && isPointInComponent(component, x, y)) {
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
  handleWireSelection(x, y) {
    for (const wire of this.wires) {
      const index = findWireSegmentIndex(wire, x, y);
      if (index !== -1) {
        if (this.state === 1 /* Wiring */) {
          this.splitAndCreateWire(wire, index, x, y);
          return true;
        }
        this.index = index;
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
  handlePathCreation(x, y) {
    if (this.selectedJoint) {
      const lastPoint = this.path[this.path.length - 1] ?? this.selectedJoint.offset;
      this.path.push(calculateIntermediatePoint(lastPoint, [x, y]));
    }
  }
  onMouseUp(event) {
    const [scaledX, scaledY] = this.getScaledCoordinates(event);
    let inJoint = false;
    this.joints.forEach((joint) => {
      if (isPointInJoint(joint, scaledX, scaledY))
        inJoint = true;
    });
    this.pins.forEach((pin) => {
      if (isPointInJoint(pin, scaledX, scaledY))
        inJoint = true;
    });
    if (!inJoint) {
      this.handleComponentSelection(scaledX, scaledY);
      this.handleWireSelection(scaledX, scaledY);
      LocalDB.set("circuit", this.toJSON());
    }
    this.pressed = false;
    if (this.state != 0 /* None */)
      return;
    this.selectedComponent = null;
    this.selectedWire = null;
    this.selectedJoint = null;
  }
  __selectedJoint = null;
  __selectedComponent = null;
  onMouseMove(event) {
    const [scaledX, scaledY] = this.getScaledCoordinates(event);
    this.__selectedJoint = null;
    this.__selectedComponent = null;
    for (const component of this.components) {
      if (isPointInComponent(component, scaledX, scaledY))
        this.__selectedComponent = component;
      for (const pin of component.pins) {
        if (isPointInJoint(pin, scaledX, scaledY))
          this.__selectedJoint = pin;
      }
    }
    for (const pin of this.pins) {
      if (isPointInJoint(pin, scaledX, scaledY))
        this.__selectedJoint = pin;
    }
    this.position = [scaledX, scaledY];
    if (!this.pressed)
      return;
    if (this.selectedWire) {
      this.selectedJoint = this.splitWire(this.start, this.selectedWire, this.index);
      this._selectedJoint = this.selectedJoint;
      this._selectedComponent = null;
      this._selectedWire = null;
      this.selectedWire = null;
      this.path = [];
    } else if (this.selectedJoint) {
      this.state = 1 /* Wiring */;
    } else if (this.selectedComponent) {
      this.moveComponent(scaledX, scaledY);
    } else if (this.state == 0 /* None */ || this.state == 2 /* Interacting */) {
      this.offset = [event.offsetX - this.start[0], event.offsetY - this.start[1]];
    }
    LocalDB.set("offset", this.offset);
    LocalDB.set("circuit", this.toJSON());
  }
  onWheel(event) {
    const scaleFactor = 1 - (event.deltaY > 0 ? 0.1 : -0.1);
    this.updateScale(event.offsetX, event.offsetY, scaleFactor);
    LocalDB.set("offset", this.offset);
    LocalDB.set("scale", this.scale);
  }
  updateScale(x, y, scaleFactor) {
    this.offset = [x - (x - this.offset[0]) * scaleFactor, y - (y - this.offset[1]) * scaleFactor];
    this.scale *= scaleFactor;
  }
  paintText(text, offset) {
    this.context.save();
    this.context.fillStyle = "white";
    this.context.font = "bold 5px monospace";
    const metrics = this.context.measureText(text);
    const height = Math.abs(metrics.actualBoundingBoxAscent) + Math.abs(metrics.actualBoundingBoxDescent);
    this.context.beginPath();
    this.context.roundRect(offset[0] - 1 + 2, offset[1] - height - 1 - 2, metrics.width + 2, height + 2, 1);
    this.context.fill();
    this.context.fillStyle = "black";
    this.context.fillText(text, offset[0] + 2, offset[1] - 2 - 0.5);
    this.context.restore();
  }
  paint() {
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
      this.paintText(this.__selectedComponent instanceof IC ? this.__selectedComponent.circuit.label : this.__selectedComponent.type, this.position);
    }
    if (this.__selectedJoint instanceof Pin) {
      this.paintText(this.__selectedJoint.label, this.position);
    }
    this.context.restore();
    const info = () => {
      const side = (side2) => {
        switch (side2) {
          case 0 /* Top */:
            return "topo";
          case 1 /* Right */:
            return "direita";
          case 2 /* Bottom */:
            return "base";
          case 3 /* Left */:
            return "esquerda";
        }
      };
      if (this._selectedJoint instanceof Pin) {
        return `${JSON.parse(JSON.stringify(this._selectedJoint.label))} (${side(this._selectedJoint.side)})`;
      }
      if (this._selectedJoint) {
        return "Clique e arraste sobre a junta para criar um fio";
      }
      if (this._selectedComponent) {
        return `${this._selectedComponent.type}:<br />` + [this._selectedComponent.pins.map((pin, i) => `${JSON.parse(JSON.stringify(pin.label))} (${side(pin.side)}) [${i}]`).join("<br />")];
      }
      return "Selecione algum elemento";
    };
  }
  setupContext() {
    this.context.lineCap = "round";
    this.context.lineJoin = "round";
    this.context.lineWidth = 1;
    this.context.strokeStyle = "white";
    this.context.fillStyle = "white";
  }
  clearCanvas() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  paintGrid() {
    this.context.save();
    this.context.strokeStyle = "#111";
    const gridSize = 50 * this.scale;
    for (let x = this.offset[0] % gridSize;x < this.canvas.width; x += gridSize) {
      this.context.beginPath();
      this.context.moveTo(x, 0);
      this.context.lineTo(x, this.canvas.height);
      this.context.stroke();
    }
    for (let y = this.offset[1] % gridSize;y < this.canvas.height; y += gridSize) {
      this.context.beginPath();
      this.context.moveTo(0, y);
      this.context.lineTo(this.canvas.width, y);
      this.context.stroke();
    }
    this.context.restore();
  }
  paintWires() {
    for (const wire of this.wires) {
      this.context.save();
      this.context.strokeStyle = wire.from.value || wire.to.value ? "green" : "white";
      this.context.beginPath();
      this.context.moveTo(...wire.from.offset);
      wire.path.forEach((point) => this.context.lineTo(...point));
      this.context.lineTo(...wire.to.offset);
      this.context.stroke();
      this.context.restore();
    }
  }
  paintJoints() {
    for (const joint of this.joints) {
      this.context.save();
      this.context.beginPath();
      this.context.arc(joint.offset[0], joint.offset[1], 2, 0, Math.PI * 2);
      this.context.fillStyle = joint.value ? "green" : "white";
      this.context.fill();
      this.context.restore();
    }
  }
  paintComponents() {
    this.components.forEach((component) => component.paint(this));
  }
  paintPins() {
    for (const pin of this.pins) {
      this.context.beginPath();
      this.context.save();
      this.context.arc(pin.offset[0], pin.offset[1], 1, 0, Math.PI * 2);
      this.context.strokeStyle = pin.value ? "green" : "white";
      this.context.lineWidth = 2;
      this.context.stroke();
      this.context.arc(pin.offset[0], pin.offset[1], 1, 0, Math.PI * 2);
      this.context.fillStyle = "black";
      this.context.fill();
      this.context.restore();
    }
  }
  paintPath() {
    if (this.state != 1 /* Wiring */ || !this.selectedJoint)
      return;
    this.context.beginPath();
    this.context.moveTo(...this.selectedJoint.offset);
    this.path.forEach((point) => this.context.lineTo(...point));
    this.context.lineTo(...calculateIntermediatePoint(this.path[this.path.length - 1] ?? this.selectedJoint.offset, this.position));
    this.context.lineTo(...this.position);
    this.context.stroke();
  }
  getScaledCoordinates(event) {
    return [(event.offsetX - this.offset[0]) / this.scale, (event.offsetY - this.offset[1]) / this.scale];
  }
  createWire(from, to) {
    this.path.push(calculateIntermediatePoint(this.path[this.path.length - 1] ?? from.offset, to.offset));
    this.wires.push(new Wire(from, to, this.path));
    this.path = [];
  }
  splitAndCreateWire(wire, index, x, y) {
    this.createWire(this.selectedJoint, this.splitWire([x, y], wire, index));
    this.selectedJoint = null;
    this.state = 0 /* None */;
  }
  splitWire(point, wire, pathIndex) {
    const joint = new Joint(this.snapToWire(point, wire, pathIndex));
    this.joints.push(joint);
    this.wires.push(new Wire(joint, wire.to, wire.path.slice(pathIndex)));
    wire.path = wire.path.slice(0, pathIndex);
    wire.from.disconnect(wire.to);
    wire.to = joint;
    wire.from.connect(joint);
    return joint;
  }
  snapToWire(point, wire, pathIndex) {
    const start = pathIndex === 0 ? wire.from.offset : wire.path[pathIndex - 1];
    const end = pathIndex === wire.path.length ? wire.to.offset : wire.path[pathIndex];
    return Math.abs(end[0] - start[0]) > Math.abs(end[1] - start[1]) ? [point[0], start[1]] : [start[0], point[1]];
  }
  moveComponent(x, y) {
    this.selectedComponent.offset = [x - this.start[0], y - this.start[1]];
    this.selectedComponent.calc();
    this.adjustConnectedWires(this.selectedComponent);
  }
  adjustConnectedWires(component) {
    component.pins.forEach((pin) => this.wires.filter((wire) => wire.from === pin || wire.to === pin).forEach((wire) => this.adjustWire(wire, pin)));
  }
  adjustWire(wire, movedPin) {
    if (wire.path.length === 0)
      wire.path = [calculateIntermediatePoint(wire.from.offset, wire.to.offset)];
    else if (wire.from == movedPin)
      wire.path[0] = calculateIntermediatePoint(wire.from.offset, wire.path[1] ?? wire.to.offset);
    else
      wire.path[wire.path.length - 1] = calculateIntermediatePoint(wire.path[wire.path.length - 2] ?? wire.from.offset, wire.to.offset);
  }
}

// index.ts
var version = 1;
if (LocalDB.get("version") != version) {
  localStorage.clear();
  LocalDB.set("version", version);
}
var canvas = document.querySelector("canvas");
var localCircuit = LocalDB.get("circuit");
var circuit = localCircuit ? Circuit.parseJSON(localCircuit) : null;
if (!circuit?.components.filter((component) => component instanceof IC).length) {
  console.log("...");
}
var engine = circuit ? new Engine(canvas, circuit) : new Engine(canvas);
engine.offset = LocalDB.get("offset", [0, 0]);
engine.scale = LocalDB.get("scale", 1);
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);
for (const component of engine.components) {
  component.calc();
}
var render = () => {
  engine.tick();
  engine.paint();
  requestAnimationFrame(render);
};
requestAnimationFrame(render);
var panelEl = document.querySelector("#panel");
var modeEl = document.querySelector("#mode");
modeEl.addEventListener("click", () => {
  const mode = modeEl.dataset.mode;
  const newMode = mode == "0" ? "1" : "0";
  modeEl.dataset.mode = newMode;
  if (newMode == "1") {
    panelEl.style.display = "none";
    modeEl.textContent = "Editar";
    engine.state = 2 /* Interacting */;
  } else {
    panelEl.style.display = "flex";
    modeEl.textContent = "Interagir";
    engine.state = 0 /* None */;
  }
});
var getfile = (c) => {
  const inputEl = document.querySelector("#file");
  const ev = () => {
    const selectedFile = inputEl.files?.[0];
    if (selectedFile) {
      const reader = new FileReader;
      reader.onload = () => {
        const data = JSON.parse(reader.result);
        c(data);
      };
      reader.readAsText(selectedFile);
    }
    inputEl?.removeEventListener("change", ev);
  };
  inputEl?.addEventListener("change", ev);
  inputEl?.click();
};
document.querySelectorAll("[data-id]").forEach((element) => {
  element.addEventListener("mousedown", (event) => {
    if (element.dataset.id == "ic") {
      getfile((_) => {
        const scaledX2 = (event.offsetX - engine.offset[0]) / engine.scale;
        const scaledY2 = (event.offsetY - engine.offset[1]) / engine.scale;
        const component2 = builtIn(element.dataset.id ?? "", { offset: [scaledX2, scaledY2] }, new Circuit(Circuit.parseJSON(_)));
        if (!component2)
          return;
        engine.components.push(component2);
        engine.selectedComponent = component2;
        engine.start = [0, 0];
        engine.pressed = true;
        component2.calc?.();
      });
      return;
    }
    const scaledX = (event.offsetX - engine.offset[0]) / engine.scale;
    const scaledY = (event.offsetY - engine.offset[1]) / engine.scale;
    const component = builtIn(element.dataset.id ?? "", { offset: [scaledX, scaledY] });
    if (!component)
      return;
    engine.components.push(component);
    engine.selectedComponent = component;
    engine.start = [0, 0];
    engine.pressed = true;
    component.calc?.();
  });
});
function clear() {
  localStorage.clear();
  window.location.reload();
}
function saveFile() {
  const blob = new Blob([JSON.stringify(engine)], { type: "application/json" });
  const jsonObjectUrl = URL.createObjectURL(blob);
  const filename = document.querySelector("#label").value || "circuit.json";
  const anchorEl = document.querySelector("#download");
  anchorEl.href = jsonObjectUrl;
  anchorEl.download = filename;
  anchorEl.click();
  URL.revokeObjectURL(jsonObjectUrl);
}
document.querySelector("#label").value = engine.label;
document.querySelector("#label").addEventListener("input", (ev) => {
  engine.label = document.querySelector("#label").value;
  LocalDB.set("circuit", engine.toJSON());
});
document.querySelector("#clear").addEventListener("click", clear);
document.querySelector("#save").addEventListener("click", saveFile);
var inputEl = document.querySelector("#file");
document.querySelector("#load").addEventListener("click", () => {
  getfile((_) => {
    LocalDB.remove("offset");
    LocalDB.remove("scale");
    LocalDB.set("circuit", _);
    window.location.reload();
  });
});
