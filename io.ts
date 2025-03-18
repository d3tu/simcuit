import { Offset, Side } from "./utils";

export class Joint {
  // value: number
  offset: Offset
  joints: Joint[] = []

  #value: number
  #maxValue: number
  #isDirty: boolean = false

  get value(): number {
    if (this.#isDirty) {
      this.#updateMaxValue()
    }

    return this.#maxValue
  }

  constructor(offset: Offset = [0, 0], value: number = 0) {
    this.#value = value
    this.#maxValue = value
    this.offset = offset
  }

  #markDirty() {
    if (!this.#isDirty) {
      this.#isDirty = true

      for (const joint of this) {
        joint.#markDirty()
      }
    }
  }

  #updateMaxValue() {
    this.#maxValue = this.#value

    for (const joint of this) {
      if (joint.#value > this.#maxValue) {
        this.#maxValue = joint.#value
      }
    }

    this.#isDirty = false
  }

  connect(joint: Joint) {
    this.joints.push(joint)
    joint.joints.push(this)
    this.#markDirty()
    joint.#markDirty()
  }

  disconnect(joint: Joint) {
    const i0 = this.joints.indexOf(joint)
    const i1 = joint.joints.indexOf(this)

    if (i0 > -1) {
      this.joints[i0] = this.joints[this.joints.length - 1]
      this.joints.pop()
      this.#markDirty()
    }

    if (i1 > -1) {
      joint.joints[i1] = joint.joints[joint.joints.length - 1]
      joint.joints.pop()
      joint.#markDirty()
    }
  }

  write(value: number) {
    if (this.value != this.#value) {
      this.#markDirty()
    }

    this.#value = value
  }

  *[Symbol.iterator]() {
    const queue: Joint[] = [this]
    const visited = new Set<Joint>()
    let index = 0

    while (index < queue.length) {
      const current = queue[index++]
      if (!visited.has(current)) {
        visited.add(current)
        yield current
        for (const joint of current.joints) {
          if (!visited.has(joint)) {
            queue.push(joint)
          }
        }
      }
    }
  }
}

export default class Pin extends Joint {
  constructor(public label: string, public side: Side, value: number = 0, offset: Offset = [0, 0]) {
    super(offset, value)
  }
}
