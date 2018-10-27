import React, {
    PureComponent,
    ReactNode,
    ComponentType,
    Context,
    ReactElement,
    version,

    // @ts-ignore
    useState,
    // @ts-ignore
    useCallback,
    // @ts-ignore
    useContext,
    // @ts-ignore
    useRef,
    // @ts-ignore
    useMemo,
    // @ts-ignore
    useEffect,
} from 'react';

const versionParts = version.split('.') as [string, string, string];
const hasStaticContext =
    Number(versionParts[0]) >= 16 && Number(versionParts[1]) >= 6;
const hasHooks = Number(versionParts[0]) >= 16 && Number(versionParts[1]) >= 7;

enum Lifecycle {
    Mount = 0,
    Update = 1,
    Unmount = 2,
}

type Render = (node: ReactNode, isMount: Lifecycle) => void;

const through = (fallback: ReactNode) => (node: ReactNode): ReactNode => {
    if (node instanceof Error) {
        throw node;
    }

    return node || fallback;
};

const consumerError = new Error(
    'Attempted to render a <Consumer /> without an <Anchor />',
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

interface ImplProps extends ProviderProps {
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

let createAnchor: (
    NodeContext: Context<ReactNode>,
    RenderContext: Context<Render>,
) => ComponentType<{}>;
let createConsumer: (NodeContext: Context<ReactNode>) => ComponentType<{}>;
let createProvider: (
    RenderContext: Context<Render>,
) => ComponentType<ProviderProps>;

if (hasHooks) {
    createAnchor = ({ Provider: NodeProvider }, { Provider: RenderProvider }) =>
        function Anchor({ children }) {
            const [node, setState] = useState(null);

            const setNode = useCallback(
                (node: ReactNode, lifecycle: Lifecycle) => {
                    setState((state: ReactNode) => {
                        if (lifecycle === Lifecycle.Mount && state !== null) {
                            console.warn(mountError);
                        }
                        if (lifecycle === Lifecycle.Update && state === null) {
                            console.warn(updateError);
                        }
                        if (lifecycle === Lifecycle.Unmount && state === null) {
                            console.warn(unmountError);
                        }

                        return node;
                    });
                },
                [setState],
            );

            return (
                <RenderProvider value={setNode}>
                    <NodeProvider value={node}>{children}</NodeProvider>
                </RenderProvider>
            );
        };

    createConsumer = Context =>
        function Consumer({ children }) {
            const node = useContext(Context);
            return (through(children)(node) as ReactElement<any>) || null;
        };

    createProvider = Context =>
        function Provider({ children }: ProviderProps) {
            const render = useContext(Context);

            const isMounted = useRef(false);
            useMemo(
                () => {
                    render(
                        children,
                        isMounted.current ? Lifecycle.Update : Lifecycle.Mount,
                    );
                    isMounted.current = true;
                },
                [children, render],
            );

            useEffect(
                () => () => {
                    render(null, Lifecycle.Unmount);
                    isMounted.current = false;
                },
                [],
            );

            return null;
        };
} else {
    createAnchor = ({ Provider: NodeProvider }, { Provider: RenderProvider }) =>
        class Anchor extends PureComponent<{}, AnchorState> {
            state = {
                node: null,
            };

            setNode = (node: ReactNode, lifecycle: Lifecycle) => {
                this.setState(state => {
                    if (lifecycle === Lifecycle.Mount && state.node !== null) {
                        console.warn(mountError);
                    }
                    if (lifecycle === Lifecycle.Update && state.node === null) {
                        console.warn(updateError);
                    }
                    if (
                        lifecycle === Lifecycle.Unmount &&
                        state.node === null
                    ) {
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
        };

    createConsumer = ({ Consumer }) => ({ children }) => (
        <Consumer>{through(children)}</Consumer>
    );

    if (hasStaticContext) {
        createProvider = RenderContext =>
            class Provider extends PureComponent<ProviderProps> {
                static contextType = RenderContext;

                componentDidMount() {
                    this.context(this.props.children, Lifecycle.Mount);
                }

                componentDidUpdate() {
                    this.context(this.props.children, Lifecycle.Update);
                }

                componentWillUnmount() {
                    this.context(null, Lifecycle.Unmount);
                }

                render() {
                    return null;
                }
            };
    } else {
        createProvider = ({ Consumer }) => {
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

            return ({ children }: ProviderProps) => (
                <Consumer>
                    {render => (
                        <ProviderImpl render={render} children={children} />
                    )}
                </Consumer>
            );
        };
    }
}

export default function createJumpgate(): Jumpgate {
    const RenderContext = React.createContext<Render>(providerError);
    const NodeContext = React.createContext<ReactNode>(consumerError);

    return {
        Anchor: createAnchor(NodeContext, RenderContext),
        Consumer: createConsumer(NodeContext),
        Provider: createProvider(RenderContext),
    };
}
