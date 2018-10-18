import React, { PureComponent, ReactNode, ComponentType } from 'react';

enum Lifecycle {
    Mount = 0,
    Update = 1,
    Unmount = 2
}

type Render = (node: ReactNode, isMount: Lifecycle) => void;

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

const helpMessage = ' Jumpgate. Did you render multiple <Provider /> ?';
const mountError = 'Tried to use an already-full' + helpMessage;
const updateError = 'Tried to update an empty' + helpMessage;
const unmountError = 'Tried to clear an empty' + helpMessage;

interface AnchorState {
    node: ReactNode;
}

interface ImplProps {
    render: Render;
}

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

    class Anchor extends PureComponent<{}, AnchorState> {
        state = {
            node: null
        };

        setNode = (node: ReactNode, lifecycle: Lifecycle) => {
            this.setState(state => {
                if (lifecycle === Lifecycle.Mount && state.node !== null) {
                    console.warn(mountError);
                }
                if (lifecycle === Lifecycle.Update && state.node === null) {
                    console.warn(updateError);
                }
                if (lifecycle === Lifecycle.Unmount && state.node === null) {
                    console.warn(unmountError);
                }

                return { node };
            });
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

    class ProviderImpl extends PureComponent<ImplProps> {
        componentDidMount() {
            this.props.render(this.props.children, Lifecycle.Mount);
        }

        componentDidUpdate() {
            this.props.render(this.props.children, Lifecycle.Update);
        }

        componentWillUnmount() {
            this.props.render(null, Lifecycle.Unmount);
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
