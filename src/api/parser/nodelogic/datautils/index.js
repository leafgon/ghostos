import { _leaflabel } from "./leaflabel.js";
import { _leafdelabel } from "./leafdelabel.js";
import { _leafbottle } from "./leafbottle.js";
import { _leafunbottle } from "./leafunbottle.js";
import { _leafcrate } from "./leafcrate.js";
import { _leafconfig } from "./leafconfig.js";

//const doBottle = (key, data, blabel={}) => {
//    return {_bname: key, _content: data, _label: blabel};
//};
//
//const doUnbottle = (key, data, blabel={}) => {
//    return (isBottle(data) && (key !== undefined ? (key.includes(data._bname) || key === "*") : true)) ? data._content : undefined; // {_bname: key, _content: data, _label: blabel}
//};

export { _leaflabel, _leafdelabel, _leafbottle, _leafunbottle, _leafcrate, _leafconfig };