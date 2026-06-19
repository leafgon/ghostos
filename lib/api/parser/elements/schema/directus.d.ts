export default schema;
declare namespace schema {
    export let $schema: string;
    export let $id: string;
    export let title: string;
    export let description: string;
    export let type: string;
    export namespace properties {
        namespace nodeuuid {
            let description_1: string;
            export { description_1 as description };
            let type_1: string;
            export { type_1 as type };
        }
        namespace status {
            let description_2: string;
            export { description_2 as description };
            let type_2: string;
            export { type_2 as type };
        }
        namespace config {
            let type_3: string;
            export { type_3 as type };
            export namespace properties_1 {
                namespace KEY {
                    let type_4: string;
                    export { type_4 as type };
                }
                namespace SECRET {
                    let type_5: string;
                    export { type_5 as type };
                }
                namespace ADMIN_EMAIL {
                    let type_6: string;
                    export { type_6 as type };
                }
                namespace ADMIN_PASSWORD {
                    let type_7: string;
                    export { type_7 as type };
                }
                namespace DB_CLIENT {
                    let type_8: string;
                    export { type_8 as type };
                }
                namespace DB_HOST {
                    let type_9: string;
                    export { type_9 as type };
                }
                namespace DB_PORT {
                    let type_10: string;
                    export { type_10 as type };
                }
                namespace DB_DATABASE {
                    let type_11: string;
                    export { type_11 as type };
                }
                namespace DB_USER {
                    let type_12: string;
                    export { type_12 as type };
                }
                namespace DB_PASSWORD {
                    let type_13: string;
                    export { type_13 as type };
                }
            }
            export { properties_1 as properties };
            export let required: string[];
        }
    }
    let required_1: string[];
    export { required_1 as required };
}
