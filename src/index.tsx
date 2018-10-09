import React, { PureComponent, ReactNode, ComponentType } from 'react';

type Render = (node: ReactNode) => void;

const through = (node: ReactNode) => {
    if (node instanceof Error) {
        throw node;
    }

    return node;
};

const consumerError = new Error(
    'Attempted to render a <Consumer /> without an <Anchor />'
);

const providerError = (node: ReactNode) => {
    throw new Error('Attempted to render a <Provider /> without an <Anchor />');
};

export interface ProviderProps {
    children: ReactNode;
}

export interface Jumpgate {
    Anchor: ComponentType<{}>;
    Consumer: ComponentType<{}>;
    Provider: ComponentType<ProviderProps>;
}

export default function createJumpgate(): Jumpgate {
    const {
        Provider: RenderProvider,
        Consumer: RenderConsumer
    } = React.createContext<Render>(providerError);
    const {
        Provider: NodeProvider,
        Consumer: NodeConsumer
    } = React.createContext<ReactNode>(consumerError);

    class Anchor extends PureComponent {
        state = {
            node: null
        };

        setNode = (node: ReactNode) => {
            this.setState({ node });
            return null;
        };

        render() {
            return (
                <RenderProvider value={this.setNode}>
                    <NodeProvider value={this.state.node}>
                        {this.props.children}
                    </NodeProvider>
                </RenderProvider>
            );
        }
    }

    const Consumer = () => <NodeConsumer>{through}</NodeConsumer>;

    interface ImplProps {
        render: Render;
    }

    class ProviderImpl extends PureComponent<ImplProps> {
        componentDidMount() {
            this.props.render(this.props.children);
        }

        componentWillUnmount() {
            this.props.render(null);
        }

        render() {
            return null;
        }
    }

    const Provider = ({ children }: ProviderProps) => (
        <RenderConsumer>
            {render => <ProviderImpl render={render} children={children} />}
        </RenderConsumer>
    );

    return { Anchor, Consumer, Provider };
}
