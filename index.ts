import builtIn, { And, IC, Xor } from "./builtin"
import Engine, { State } from "./engine"
import Pin from "./io"
import { Circuit, Data, LocalDB, Offset, Side } from "./utils"
import Wire from "./wire"

const version = 1

if (LocalDB.get("version") != version) {
  localStorage.clear()
  LocalDB.set("version", version)
}

const canvas = document.querySelector('canvas')!

const localCircuit = LocalDB.get<Data.Full>("circuit")

// const circuit = localCircuit ? Circuit.parseJSON(localCircuit) : null

// const __ = {"components":[{"type":"ic","offset":[19.015551294952665,-4.509128339686228],"scale":20,"rotation":0,"circuit":{"components":[{"type":"xor","offset":[0,0],"scale":2.5,"rotation":0},{"type":"and","offset":[0,0],"scale":5,"rotation":0}],"joints":[],"pins":[{"offset":[14.015551294952665,2.157538326980439],"side":3,"label":"A"},{"offset":[14.015551294952665,8.824204993647106],"side":3,"label":"B"},{"offset":[44.015551294952665,2.157538326980439],"side":1,"label":"S"},{"offset":[44.015551294952665,8.824204993647106],"side":1,"label":"C"}],"wires":[{"from":{"type":2,"indexes":[0]},"to":{"type":0,"indexes":[0,0]},"path":[]},{"from":{"type":2,"indexes":[1]},"to":{"type":0,"indexes":[0,1]},"path":[]},{"from":{"type":2,"indexes":[0]},"to":{"type":0,"indexes":[1,0]},"path":[]},{"from":{"type":2,"indexes":[1]},"to":{"type":0,"indexes":[1,1]},"path":[]},{"from":{"type":0,"indexes":[0,2]},"to":{"type":2,"indexes":[2]},"path":[]},{"from":{"type":0,"indexes":[1,2]},"to":{"type":2,"indexes":[3]},"path":[]}]}},{"type":"ic","offset":[69.75494278134728,-17.206279987868964],"scale":20,"rotation":0,"circuit":{"components":[{"type":"xor","offset":[0,0],"scale":2.5,"rotation":0},{"type":"and","offset":[0,0],"scale":5,"rotation":0}],"joints":[],"pins":[{"offset":[64.75494278134728,-10.539613321202296],"side":3,"label":"A"},{"offset":[64.75494278134728,-3.87294665453563],"side":3,"label":"B"},{"offset":[94.75494278134728,-10.539613321202296],"side":1,"label":"S"},{"offset":[94.75494278134728,-3.87294665453563],"side":1,"label":"C"}],"wires":[{"from":{"type":2,"indexes":[0]},"to":{"type":0,"indexes":[0,0]},"path":[]},{"from":{"type":2,"indexes":[1]},"to":{"type":0,"indexes":[0,1]},"path":[]},{"from":{"type":2,"indexes":[0]},"to":{"type":0,"indexes":[1,0]},"path":[]},{"from":{"type":2,"indexes":[1]},"to":{"type":0,"indexes":[1,1]},"path":[]},{"from":{"type":0,"indexes":[0,2]},"to":{"type":2,"indexes":[2]},"path":[]},{"from":{"type":0,"indexes":[1,2]},"to":{"type":2,"indexes":[3]},"path":[]}]}},{"type":"or","offset":[122.44738366094018,43.828292140562425],"scale":5,"rotation":0}],"joints":[],"pins":[{"offset":[-26.8571660633267,18.214052090534505],"side":1,"label":""},{"offset":[-26.32277848095437,-12.78042768706077],"side":1,"label":""},{"offset":[39.406894150842504,-26.674504828741412],"side":1,"label":""},{"offset":[119.56503150669235,-19.19307867552876],"side":1,"label":""},{"offset":[178.88205315002125,17.14527692578984],"side":1,"label":""}],"wires":[{"from":{"type":0,"indexes":[0,2]},"to":{"type":0,"indexes":[1,1]},"path":[[64.75494278134728,2.157538326980439]]},{"from":{"type":0,"indexes":[1,3]},"to":{"type":0,"indexes":[2,0]},"path":[[117.44738366094018,-3.87294665453563]]},{"from":{"type":0,"indexes":[2,1]},"to":{"type":0,"indexes":[0,3]},"path":[[44.015551294952665,57.16162547389576]]},{"from":{"type":0,"indexes":[2,2]},"to":{"type":2,"indexes":[4]},"path":[[147.44738366094018,17.14527692578984]]},{"from":{"type":0,"indexes":[1,2]},"to":{"type":2,"indexes":[3]},"path":[[119.56503150669235,-10.539613321202296]]},{"from":{"type":0,"indexes":[1,0]},"to":{"type":2,"indexes":[2]},"path":[[39.406894150842504,-10.539613321202296]]},{"from":{"type":0,"indexes":[0,0]},"to":{"type":2,"indexes":[1]},"path":[[-26.32277848095437,2.157538326980439]]},{"from":{"type":0,"indexes":[0,1]},"to":{"type":2,"indexes":[0]},"path":[[-26.8571660633267,8.824204993647106]]}]}

const circuit = localCircuit ? Circuit.parseJSON(localCircuit) : null

// function mergeDeep(target: any, source: any) {
//   for (const key in source) {
//     if (source[key] instanceof Object && key in target) {
//       target[key] = mergeDeep(target[key], source[key]);
//     } else {
//       target[key] = source[key];
//     }
//   }
//   return target;
// }

if (!circuit?.components.filter((component) => component instanceof IC).length) {
  console.log('...')
  // const components = [new Xor(), new And()]
  // const pins = [new Pin("A", Side.Left), new Pin("B", Side.Left), new Pin("S", Side.Right), new Pin("C", Side.Right)]
  // const c = new Circuit({
  //   components: components,
  //   joints: [],
  //   pins: pins,
  //   wires: [
  //     new Wire(pins[0], components[0].pins[0]),
  //     new Wire(pins[1], components[0].pins[1]),
  //     new Wire(pins[0], components[1].pins[0]),
  //     new Wire(pins[1], components[1].pins[1]),
  //     new Wire(components[0].pins[2], pins[2]),
  //     new Wire(components[1].pins[2], pins[3])
  //   ]
  // })

  // const ___: any = __
  
  // circuit?.components.push(new IC(undefined, new Circuit(Circuit.parseJSON(___))))

  // circuit && LocalDB.set("circuit", new Circuit(circuit).toJSON())
}

const engine = circuit ? new Engine(canvas, circuit) : new Engine(canvas)

engine.offset = LocalDB.get<Offset>("offset", [0, 0])!
engine.scale = LocalDB.get<number>("scale", 1)!

function resize() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}

resize()

window.addEventListener('resize', resize)

for (const component of engine.components) {
  component.calc()
}

const render = () => {
  engine.tick()
  engine.paint()
  requestAnimationFrame(render)
}

requestAnimationFrame(render)

// window.requestAnimationFrame(function callback() {
//   engine.tick()
//   engine.paint()
//   window.requestAnimationFrame(callback)
// })

const panelEl = document.querySelector<HTMLDivElement>("#panel")!

const modeEl = document.querySelector<HTMLButtonElement>("#mode")!

modeEl.addEventListener("click", () => {
  const mode = modeEl.dataset.mode

  const newMode = mode == "0" ? "1" : "0"

  modeEl.dataset.mode = newMode

  if (newMode == "1") {
    panelEl.style.display = "none"
    modeEl.textContent = "Editar"
    engine.state = State.Interacting
  } else {
    panelEl.style.display = "flex"
    modeEl.textContent = "Interagir"
    engine.state = State.None
  }
})

const getfile = (c: (_: any) => void) => {
  const inputEl = document.querySelector<HTMLInputElement>("#file")!
  // document.querySelector<HTMLButtonElement>("#load")!.addEventListener("click", () => {
    const ev = () => {
      const selectedFile = inputEl.files?.[0]
    
      if (selectedFile) {
        const reader = new FileReader()
    
        reader.onload = () => {
          const data = JSON.parse(reader.result as string)
          c(data)
        }
    
        reader.readAsText(selectedFile)
      }
  
      inputEl?.removeEventListener("change", ev)
    }
  
    inputEl?.addEventListener("change", ev)
  
    inputEl?.click()
  // })
}

document.querySelectorAll<HTMLButtonElement>("[data-id]").forEach((element) => {
  element.addEventListener("mousedown", (event) => {
    if (element.dataset.id == "ic") {
      getfile((_) => {
        const scaledX = (event.offsetX - engine.offset[0]) / engine.scale
        const scaledY = (event.offsetY - engine.offset[1]) / engine.scale
        const component = builtIn(element.dataset.id ?? "", { offset: [scaledX, scaledY] }, new Circuit(Circuit.parseJSON(_)))
        if (!component) return
        engine.components.push(component)
        engine.selectedComponent = component
        engine.start = [0, 0]
        engine.pressed = true
        component.calc?.()
      })

      return
    }
    const scaledX = (event.offsetX - engine.offset[0]) / engine.scale
    const scaledY = (event.offsetY - engine.offset[1]) / engine.scale
    const component = builtIn(element.dataset.id ?? "", { offset: [scaledX, scaledY] })
    if (!component) return
    engine.components.push(component)
    engine.selectedComponent = component
    engine.start = [0, 0]
    engine.pressed = true
    component.calc?.()
  })
})

function clear() {
  localStorage.clear()
  window.location.reload()
}

function saveFile() {
  const blob = new Blob([JSON.stringify(engine)], { type: 'application/json' })
  const jsonObjectUrl = URL.createObjectURL(blob)
  const filename = document.querySelector<HTMLInputElement>("#label")!.value || 'circuit.json'
  const anchorEl = document.querySelector<HTMLAnchorElement>('#download')!
  anchorEl.href = jsonObjectUrl
  anchorEl.download = filename
  anchorEl.click()
  URL.revokeObjectURL(jsonObjectUrl)
}

document.querySelector<HTMLInputElement>("#label")!.value = engine.label

document.querySelector<HTMLInputElement>("#label")!.addEventListener("input", (ev) => {
  engine.label = document.querySelector<HTMLInputElement>("#label")!.value
  LocalDB.set("circuit", engine.toJSON())
})

document.querySelector<HTMLButtonElement>("#clear")!.addEventListener("click", clear)
document.querySelector<HTMLButtonElement>("#save")!.addEventListener("click", saveFile)

const inputEl = document.querySelector<HTMLInputElement>("#file")!
document.querySelector<HTMLButtonElement>("#load")!.addEventListener("click", () => {
 getfile((_) => {
  LocalDB.remove("offset")
        LocalDB.remove("scale")
        LocalDB.set("circuit", _)
        window.location.reload()
 })
})

// export const _ = {"components":[{"type":"ic","offset":[-6.080610365600679,-12.13219491745686],"scale":2,"rotation":0,"circuit":{"components":[{"type":"xor","offset":[0,0],"scale":2.5,"rotation":0},{"type":"and","offset":[0,0],"scale":5,"rotation":0}],"joints":[],"pins":[{"offset":[-11.080610365600679,-1.4655282507901948],"side":3,"label":"A"},{"offset":[-11.080610365600679,9.201138415876471],"side":3,"label":"B"},{"offset":[30.919389634399323,-1.4655282507901948],"side":1,"label":"S"},{"offset":[30.919389634399323,9.201138415876471],"side":1,"label":"C"}],"wires":[{"from":{"type":2,"indexes":[0]},"to":{"type":0,"indexes":[0,0]},"path":[]},{"from":{"type":2,"indexes":[1]},"to":{"type":0,"indexes":[0,1]},"path":[]},{"from":{"type":2,"indexes":[0]},"to":{"type":0,"indexes":[1,0]},"path":[]},{"from":{"type":2,"indexes":[1]},"to":{"type":0,"indexes":[1,1]},"path":[]},{"from":{"type":0,"indexes":[0,2]},"to":{"type":2,"indexes":[2]},"path":[]},{"from":{"type":0,"indexes":[1,2]},"to":{"type":2,"indexes":[3]},"path":[]}]}},{"type":"ic","offset":[65.87024817874453,-28.860363795677202],"scale":2,"rotation":0,"circuit":{"components":[{"type":"xor","offset":[0,0],"scale":2.5,"rotation":0},{"type":"and","offset":[0,0],"scale":5,"rotation":0}],"joints":[],"pins":[{"offset":[60.87024817874453,-18.193697129010538],"side":3,"label":"A"},{"offset":[60.87024817874453,-7.52703046234387],"side":3,"label":"B"},{"offset":[102.87024817874453,-18.193697129010538],"side":1,"label":"S"},{"offset":[102.87024817874453,-7.52703046234387],"side":1,"label":"C"}],"wires":[{"from":{"type":2,"indexes":[0]},"to":{"type":0,"indexes":[0,0]},"path":[]},{"from":{"type":2,"indexes":[1]},"to":{"type":0,"indexes":[0,1]},"path":[]},{"from":{"type":2,"indexes":[0]},"to":{"type":0,"indexes":[1,0]},"path":[]},{"from":{"type":2,"indexes":[1]},"to":{"type":0,"indexes":[1,1]},"path":[]},{"from":{"type":0,"indexes":[0,2]},"to":{"type":2,"indexes":[2]},"path":[]},{"from":{"type":0,"indexes":[1,2]},"to":{"type":2,"indexes":[3]},"path":[]}]}},{"type":"or","offset":[130.5775839267049,6.7072445955857845],"scale":5,"rotation":0}],"joints":[{"offset":[178.88205315002125,17.14527692578984]},{"offset":[119.56503150669235,-19.19307867552876]},{"offset":[39.406894150842504,-26.674504828741412]},{"offset":[-26.32277848095437,-12.78042768706077]},{"offset":[-26.8571660633267,18.214052090534505]}],"pins":[],"wires":[{"from":{"type":0,"indexes":[0,2]},"to":{"type":0,"indexes":[1,1]},"path":[[60.87024817874453,-1.4655282507901948]]},{"from":{"type":0,"indexes":[1,3]},"to":{"type":0,"indexes":[2,0]},"path":[[125.5775839267049,-7.52703046234387]]},{"from":{"type":0,"indexes":[2,1]},"to":{"type":0,"indexes":[0,3]},"path":[[30.919389634399323,20.04057792891912]]},{"from":{"type":0,"indexes":[2,2]},"to":{"type":1,"indexes":[0]},"path":[[178.88205315002125,16.707244595585784]]},{"from":{"type":0,"indexes":[1,2]},"to":{"type":1,"indexes":[1]},"path":[[119.56503150669235,-18.193697129010538]]},{"from":{"type":0,"indexes":[1,0]},"to":{"type":1,"indexes":[2]},"path":[[39.406894150842504,-18.193697129010538]]},{"from":{"type":0,"indexes":[0,0]},"to":{"type":1,"indexes":[3]},"path":[[-26.32277848095437,-1.4655282507901948]]},{"from":{"type":0,"indexes":[0,1]},"to":{"type":1,"indexes":[4]},"path":[[-26.8571660633267,9.201138415876471]]}]}