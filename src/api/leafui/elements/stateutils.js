// #spark_dev_note: findSetDifference() currently only works based on element's uuid. 
// in some usage scenarios, uuid may be blindly and randomly program-generated and may not necessarily reflect the truth as to
// whether the element's content is never-before-seen or not sheerly based on uuid. 
// A yet to be added feature to mitigate this issue is to provide an option to
// do the comparision based on element's content instead of uuid by looking at its hash value (25 Feb 2022).
// chosen implementation strategy: the content hash could be supplied in lieu of uuid upstream (by the data source or the data generator), 
// so that findSetDifference() can be freed from the burden of differentiating between different scenarios itself.
/* as per https://stackoverflow.com/questions/41972353/same-uuid-based-on-seed-string-in-js uuid can be generated from a seed string (ie hash value)
 * making the uuid generation deterministic. #action_point: implement this upstream as shown in the following.
const uuidv5 = require('uuid/v5');

// ... using a custom namespace
//
// Note: Custom namespaces should be a UUID string specific to your application!
// E.g. the one here was generated using this modules `uuid` CLI.
const MY_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341';
uuidv5('Hello, World!', MY_NAMESPACE); // ⇨ '630eb68f-e0fa-5ecc-887a-7c7a62614681'
*/
// given set1 = {1,2,3,4} and set2 = {3,4,5,6}, it would return {1,2}
const findSetDifference = (list1, list2) => {
    const list2_uuid_set = new Set(list2.map(x => x.uuid));
  
    let diff = list1.reduce((_diff, elem) => {
      if (!list2_uuid_set.has(elem.uuid)) { // if the set does NOT have the uuid
        _diff.push(elem);
      }
      return _diff;
    }, []); // the final _diff returned is [] + whatever elem pushed into it. 
  
    return diff;
};

// return JSON items added to obj2 in comparision to obj1
const findAddedJSON = (obj1, obj2) => {
  
    const new_item_list = findSetDifference(obj2, obj1);
    return new_item_list; // return list of new items
    //let ret = {};
    //for(let i in obj2) {
    //  if(!obj1.hasOwnProperty(i)) { //|| obj2[i] !== obj1[i]) 
    //    console.log(i);
    //    ret[i] = obj2[i];
    //  }
    //}
    //return ret;
}
  
// return JSON items removed from obj2 in comparision to obj1
const findRemovedJSON = (obj1, obj2) => {
    const removed_item_list = findSetDifference(obj1, obj2);
    return removed_item_list; // return list of removed items
    //let ret = {};
    //for(let i in obj1) {
    //  if(!obj2.hasOwnProperty(i)) { //|| obj2[i] !== obj1[i]) {
    //    console.log(i);
    //    ret[i] = obj1[i];
    //  }
    //}
    //return ret;
}

export {findAddedJSON, findRemovedJSON};