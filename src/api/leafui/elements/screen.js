

const leafElementgnavLambda = () => {

    const graph_options = {
        'layout': '3d'
    };

    return (props) => <LEAT3DNavigator {...props} graph_options={{...graph_options}} />;
};