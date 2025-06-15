import { isBottle } from "../../predicates.js";

const doBottle = (key, data, blabel={}) => {
    return {_bname: key, _content: data, _label: blabel};
};

const doUnbottle = (key, data, blabel={}) => {
    return (isBottle(data) && (key !== undefined ? (key.includes(data._bname) || key === "*") : true)) ? data._content : undefined; // {_bname: key, _content: data, _label: blabel}
};

const EmptyBottle = doBottle("empty_bottle", "empty_data");

export { doBottle, doUnbottle, EmptyBottle };