import { PLNumber } from '../number/PLNumber'
import { assertNothing, typeCheck } from '../../utils/assert'
import { plNumber } from '../number/numberFn'
import { add, multiple } from '../../typeClasses'
import { PLString } from '../string/PLString'
import { plString } from '../string/stringFn'
import { PLBase } from '../PLBase'
import { PLVector } from './PLVector'
import { StrictArray } from '../types'
//import { Nothing } from '../maybe/Nothing'

export function plVector<T extends PLBase>(...value: StrictArray<T>): PLVector<T> {
  return new PLVector<T>(value)
}

export const sum: (list: PLVector<PLNumber>) => PLNumber = (list) => {
  typeCheck(PLVector, list)
  return list.reduce(plNumber(0), add)
}

export const prod: (list: PLVector<PLNumber>) => PLNumber = (list) => {
  typeCheck(PLVector, list)
  return list.reduce(plNumber(1), multiple)
}

export const intersperse: <T extends PLBase>(separator: T, list: PLVector<T>) => PLVector<T> = (separator, list) => {
  typeCheck(PLVector, list)
  return list.intersperse(separator)
}

export const join: (list: PLVector<PLString>) => PLString = (list) => {
  typeCheck(PLVector, list)
  return list.reduce(plString(''), add)
}

export const joinWith: (separator: PLString, list: PLVector<PLString>) => PLString = (separator, list) => {
  typeCheck(PLVector, list)
  return list.intersperse(separator).reduce(plString(''), add)
}

export const numList: (separator: PLString, list: PLVector<PLNumber>) => PLString = (separator, list) => {
  typeCheck(PLVector, list)
  return list.map(x => plString(x.toString())).intersperse(separator).reduce(plString(''), add)
}

// spark_dev_note: try catch block for returning Nothing upon hitting non-existent data
// typescript type checking is picky about return types
// making returning Nothing a potentially messy solution
// so reverted back and decided to introduce try catch block upstream
export const head: <T extends PLBase>(list: PLVector<T>) => T = (list) => {
  typeCheck(PLVector, list);
  const value = assertNothing(list.value[0], 'Vector is empty')
  //value = list.value[0];
  return value;
}

// spark_dev_note: try catch block for returning Nothing upon hitting non-existent data
export const tail: <T extends PLBase>(list: PLVector<T>) => PLVector<T> = (list) => {
  typeCheck(PLVector, list)
  assertNothing(list.value.length, 'Vector is not defined correctly')
  const value = plVector(...(list.value.slice(1) as StrictArray<any>));
  return value;
}

export const reverse: <T extends PLBase>(list: PLVector<T>) => PLVector<T> = (list) => {
  typeCheck(PLVector, list)
  return plVector(...(list.value.reverse() as StrictArray<any>))
}

// spark_dev_note: other vector keymap retrieval operators
// including head, tail, index were refactored to return Nothing
// upon unsuccessful retrieval, except slice here as
// it would make more sense to get error raised for its use.
// at least for now. (17 Mar 2022)
export const slice: <T extends PLBase>(list: PLVector<T>, start: PLNumber, end: PLNumber) => PLVector<T> = (
  list,
  start,
  end,
) => {
  typeCheck(PLVector, list)
  typeCheck(PLNumber, end)
  typeCheck(PLNumber, start)
  assertNothing(list.value.length, 'Vector is not defined correctly')
  return plVector(...(list.value.slice(start.value, end.value) as StrictArray<any>))
}

export default {
  sum,
  prod,
  intersperse,
  join,
  'join-with': joinWith,
  'num-list': numList,
  head,
  reverse,
  slice,
  tail,
}
