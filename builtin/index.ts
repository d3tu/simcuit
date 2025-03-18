// Importando os componentes
import Component from "../component";
import { Circuit } from "../utils";
import And from "./and";
import Buffer from "./buffer";
import IC from "./ic";
import Input from "./input";
import Inverter from "./inverter";
import Nand from "./nand";
import Nor from "./nor";
import Or from "./or";
import Output from "./output";
import SevenDisplay from "./sevendisplay";
import ThreeAnd from "./three-and";
import ThreeNand from "./three-nand";
import ThreeNor from "./three-nor";
import ThreeOr from "./three-or";
import Xnor from "./xnor";
import Xor from "./xor";

// Exportando todos os componentes
export {
  Component,
  Circuit,
  And,
  Buffer,
  IC,
  Input,
  Inverter,
  Nand,
  Nor,
  Or,
  Output,
  SevenDisplay,
  ThreeAnd,
  ThreeNand,
  ThreeNor,
  ThreeOr,
  Xnor,
  Xor
};

// Função padrão para criar componentes
export default function builtIn<T>(type: string, init?: Partial<Component>, extra?: Circuit): Component | null {
  switch (type) {
    case "input": return new Input(init);
    case "output": return new Output(init);
    case "buffer": return new Buffer(init);
    case "inverter": return new Inverter(init);
    case "and": return new And(init);
    case "nand": return new Nand(init);
    case "or": return new Or(init);
    case "nor": return new Nor(init);
    case "xor": return new Xor(init);
    case "xnor": return new Xnor(init);
    case "three-and": return new ThreeAnd(init);
    case "three-nand": return new ThreeNand(init);
    case "three-or": return new ThreeOr(init);
    case "three-nor": return new ThreeNor(init);
    case "seven-display": return new SevenDisplay(init);
    case "ic": return new IC(init, extra);
    default: return null;
  }
}