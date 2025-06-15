const fetchMultiKeyedData = (keylist, dataobj) => {
    if (keylist.length > 0 && keylist[0] in dataobj) {
        if (keylist.length === 1)
            return dataobj[keylist[0]];
        else // (keylist.length > 1)
            return fetchMultiKeyedData(keylist.slice(1), dataobj[keylist[0]]);
    }
}

const setMultiKeyedData = (keylist, dataobj, value) => {
    if (keylist.length > 0 && keylist[0] in dataobj) {
        if (keylist.length === 1)
            dataobj[keylist[0]] = value;
        else // (keylist.length > 1)
            setMultiKeyedData(keylist.slice(1), dataobj[keylist[0]], value);
    }
}

export { fetchMultiKeyedData, setMultiKeyedData }