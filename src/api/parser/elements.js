import { leafElementPopupCenterWindowLambda } from "../leafui/elements/popupwin";

const _breezyforestelements = {
    popup: leafElementPopupCenterWindowLambda,
}

const _leafelementslib = (elementname, args = {}) => {

    if (elementname in _breezyforestelements) {
        const LEAFElement = _breezyforestelements[elementname]; // spark_dev_note: react quirks: first letter of a jsx object name should be capitalized prior to instantiation.  

        return <LEAFElement {...args} />

    }
    else {
        return undefined;
    }
};

export {_leafelementslib};