export function createGQLClient(options: any): {
    query: (queryOptions: any, successCallback: any, errorCallback: any) => Promise<any>;
    subscribe: (subscriptionOptions: any, successCallback: any, errorCallback: any) => {
        stop: () => void;
    } | undefined;
    updateHeaders: (newHeaders: any) => void;
    establishWS: () => void;
    clientContext: {
        endpoint: any;
        headers: any;
        websocket: any;
    };
};
