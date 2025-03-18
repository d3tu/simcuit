import createRenderer from "./renderer"

const canvas = document.createElement("canvas")

const renderer = createRenderer(canvas)

const resize = () => renderer.resize([window.innerWidth, window.innerHeight])

resize()

document.addEventListener("resize", resize)

document.body.appendChild(canvas)

type Offset = [x: number, y: number];

export const enum Side { Top, Right, Bottom, Left };

export class Joint {
  static #nextId = 0;
  readonly id = Joint.#nextId++;
  readonly connections: Joint[] = [];

  #value = 0;
  #maxValue = 0;
  #isDirty = true;

  constructor(public offset: Offset = [0, 0], value = 0) {
    this.write(value);
  }

  get value(): number {
    if (this.#isDirty) {
      this.#maxValue = this.#computeMaxValue();
      this.#isDirty = false;
    }
    return this.#maxValue;
  }

  connect(joint: Joint): void {
    if (this.connections.indexOf(joint) > -1) return;

    this.connections.push(joint);
    joint.connections.push(this);
    this.#markDirty();
  }

  disconnect(joint: Joint): void {
    const index = this.connections.indexOf(joint);
    if (index === -1) return;

    const lastIndex = this.connections.length - 1;
    if (index !== lastIndex) {
      this.connections[index] = this.connections[lastIndex];
    }
    this.connections.pop();

    const otherIndex = joint.connections.indexOf(this);
    if (otherIndex !== joint.connections.length - 1) {
      joint.connections[otherIndex] = joint.connections[joint.connections.length - 1];
    }
    joint.connections.pop();

    this.#markDirty();
  }

  write(value: number): void {
    if (this.#value === value) return;

    this.#value = value;
    this.#markDirty();
  }

  #markDirty(): void {
    if (!this.#isDirty) {
      this.#isDirty = true;

      const conns = this.connections;
      for (let i = 0; i < conns.length; i++) {
        conns[i].#markDirty();
      }
    }
  }

  #computeMaxValue(): number {
    let max = this.#value;

    for (const currentJoint of this) {
      if (currentJoint.#value > max) max = currentJoint.#value;
    }

    return max;
  }

  *[Symbol.iterator](): Iterator<Joint> {
    const visited = new WeakSet<Joint>();
    const queue: Joint[] = [this];
    let queueIndex = 0;

    while (queueIndex < queue.length) {
      const currentJoint = queue[queueIndex++];
      if (visited.has(currentJoint)) continue;

      visited.add(currentJoint);
      yield currentJoint;

      const connections = currentJoint.connections;
      for (let i = 0; i < connections.length; i++) {
        const neighborJoint = connections[i];
        if (!visited.has(neighborJoint)) {
          queue.push(neighborJoint);
        }
      }
    }
  }
}

export class Pin extends Joint {
  constructor(public label: string, public side: Side, offset: Offset = [0, 0], value = 0) {
    super(offset, value);
  }
}