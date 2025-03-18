import builtIn from "./builtin"
// import IC from "./builtin/ic"
import Component from "./component"
import Engine from "./engine"
import Pin, { Joint } from "./io"
import Wire from "./wire"
import {IC} from "./builtin"

export type Offset = [x: number, y: number]
export type Size = [width: number, height: number]

export const calculateIntermediatePoint = (from: Offset, to: Offset): Offset => (
  Math.abs(to[0] - from[0]) > Math.abs(to[1] - from[1]) ? [to[0], from[1]] : [from[0], to[1]]
)


export const isPointInComponent = (component: Component, x: number, y: number): boolean => {
  const { offset, size, scale, rotation } = component
  
  const centerX = offset[0] + (size[0] * scale) / 2
  const centerY = offset[1] + (size[1] * scale) / 2
  
  const translatedX = x - centerX
  const translatedY = y - centerY
  
  const angle = -rotation * Math.PI / 180
  const rotatedX = translatedX * Math.cos(angle) - translatedY * Math.sin(angle)
  const rotatedY = translatedX * Math.sin(angle) + translatedY * Math.cos(angle)
  
  const halfWidth = (size[0] * scale) / 2
  const halfHeight = (size[1] * scale) / 2
  
  return (
    rotatedX >= -halfWidth &&
    rotatedX <= halfWidth &&
    rotatedY >= -halfHeight &&
    rotatedY <= halfHeight
  )
}

export const isPointInJoint = (joint: Joint, x: number, y: number, tolerance = 2): boolean => (
  Math.abs(x - joint.offset[0]) <= tolerance && Math.abs(y - joint.offset[1]) <= tolerance
)

export const findWireSegmentIndex = (wire: Wire, x: number, y: number, tolerance = 2): number => {
  let from = wire.from.offset
  for (let i = 0; i < wire.path.length; i++) {
    if (distanceToLineSegment(x, y, ...from, ...wire.path[i]) <= tolerance) {
      return i
    }
    from = wire.path[i]
  }
  if (distanceToLineSegment(x, y, ...from, ...wire.to.offset) <= tolerance) {
    return wire.path.length
  }
  return -1
}

export abstract class ArrayUtils {
  static remove<T>(array: T[], predicate: (value: T, index: number, array: T[]) => boolean): void {
    if (array.length === 0) return
    
    let writeIndex = 0
    let readIndex = 0

    while (readIndex < array.length) {
      if (!predicate(array[readIndex], readIndex, array)) {
        if (writeIndex !== readIndex) {
          array[writeIndex] = array[readIndex]
        }
        writeIndex++
      }
      readIndex++
    }
    
    if (writeIndex < array.length) {
      array.length = writeIndex
    }
  }
}

export const enum Side { Top, Right, Bottom, Left }

export const calcPathBBox = (path: string) => {
  const svgNS = 'http://www.w3.org/2000/svg'
  const svgEl = document.createElementNS(svgNS, 'svg')
  svgEl.style.position = 'absolute'
  svgEl.style.width = '0px'
  svgEl.style.height = '0px'
  const pathEl = document.createElementNS(svgNS, 'path')
  pathEl.setAttributeNS(null, 'd', path)
  svgEl.appendChild(pathEl)
  document.body.appendChild(svgEl)
  const result = svgEl.getBBox()
  svgEl.remove()
  return result
}

export const distanceToLineSegment = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
  const dx = x2 - x1
  const dy = y2 - y1

  if (dx === 0 && dy === 0) {
    return (px - x1) ** 2 + (py - y1) ** 2
  }

  const t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)

  if (t <= 0) return (px - x1) ** 2 + (py - y1) ** 2
  if (t >= 1) return (px - x2) ** 2 + (py - y2) ** 2

  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  
  return (px - projX) ** 2 + (py - projY) ** 2
}

export namespace Data {
  export const enum Type { Component, Joint, Pin }

  export type Indexed = {
    type: Type.Component
    indexes: [number, number]
  } | {
    type: Type.Joint
    indexes: [number]
  } | {
    type: Type.Pin
    indexes: [number]
  }

  export interface Wire {
    from: Indexed
    to: Indexed
    path: Offset[]
  }

  export interface Joint {
    offset: Offset
  }

  export interface Pin extends Joint {
    side: Side
    label: string
  }

  export interface Component {
    type: string
    offset: Offset
    rotation: number
  }

  export interface IC extends Component {
    type: 'ic'
    circuit: Full
  }

  export interface Full {
    label: string
    components: (Component | IC)[]
    pins: Pin[]
    joints: Joint[]
    wires: Wire[]
  }
}

export interface Circuit {
  label: string
  pins: Pin[]
  joints: Joint[]
  components: Component[]
  wires: Wire[]
}

export class Circuit {
  constructor(init: Omit<Circuit, 'tick' | 'toJSON'>) {
    Object.assign(this, init)
  }

  public tick(): void {
    for (const component of this.components) {
      component.tick?.();
    }
  }

  toJSON(): Data.Full {
    // console.log(this.components)
    return {
      label: this.label,
      components: this.components.map((component) => ({
        type: component.type,
        offset: component.offset,
        scale: component.scale,
        rotation: component.rotation,
        ...(component instanceof IC ? { circuit: component.circuit.toJSON() } : {})
      })),
      joints: this.joints.map((joint) => ({
        offset: joint.offset,
      })),
      pins: this.pins.map((pin) => ({
        offset: pin.offset,
        side: pin.side,
        label: pin.label
      })),
      wires: this.wires.map((wire) => {
        const _ = (joint: Joint) => {
          if (joint instanceof Pin) {
            const i = this.pins.indexOf(joint)
            if (i > -1) {
              return <Data.Indexed> {
                type: Data.Type.Pin,
                indexes: [i]
              }
            } else {
              for (const i in this.components) {
                for (const j in this.components[i].pins) {
                  if (this.components[i].pins[j] == joint) {
                    return <Data.Indexed> {
                      type: Data.Type.Component,
                      indexes: [+i, +j]
                    }
                  }
                }
              }
            }
          } else {
            const i = this.joints.indexOf(joint)
            if (i > -1) {
              return <Data.Indexed> {
                type: Data.Type.Joint,
                indexes: [i]
              }
            }
          }
          return null
        }
  
        return {
          from: _(wire.from)!,
          to: _(wire.to)!,
          path: wire.path
        }
      })
    }
  }

  static parseJSON(data: Data.Full): Omit<Circuit, 'tick' | 'toJSON'> {
    const components = data.components.map((component) => {
      const c = builtIn(component.type, {
        offset: component.offset,
        rotation: component.rotation,
      }, component.type == 'ic' ? new Circuit(Circuit.parseJSON((component as Data.IC).circuit)) : undefined)
  
      if (!c) {
        throw new Error("component not found")
      }

      c.calc()
  
      return c
    })
    
    const joints = data.joints.map((joint) => {
      return new Joint(joint.offset)
    })
    
    const pins = data.pins.map((pin) => {
      return new Pin(pin.label, pin.side, 0, pin.offset)
    })
    
    // console.log(components, joints)
    
    const wires = data.wires.map((wire) => {
      const fromIndexed = (indexed: Data.Indexed) => {
        switch (indexed.type) {
          case Data.Type.Component: return components[indexed.indexes[0]].pins[indexed.indexes[1]]
          case Data.Type.Joint: return joints[indexed.indexes[0]]
          case Data.Type.Pin: return pins[indexed.indexes[0]]
        }
      }
      const from = Data.Type.Pin
      return new Wire(
        fromIndexed(wire.from),
        fromIndexed(wire.to),
        wire.path
      )
    })
  
    return { label: data.label, components, joints, wires, pins }
  }
}

export class LocalDB {
  static set<T>(key: string, value: T) {
    localStorage.setItem(key, JSON.stringify(value))
  }

  static get<T>(key: string, defaultValue: T | null = null) {
    const value = localStorage.getItem(key)

    if (value) {
      return JSON.parse(value) as T
    }

    return defaultValue
  }

  static remove(key: string) {
    localStorage.removeItem(key)
  }
}