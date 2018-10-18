import * as React from 'react';
import renderer from 'react-test-renderer';

import createJumpgate from '../src';

test('lifecycle', () => {
    const { Anchor, Provider, Consumer } = createJumpgate();

    // componentDidMount
    const tree = renderer.create(
        <div className="root">
            <Anchor>
                <div className="consumer">
                    <Consumer />
                </div>
                <div className="provider">
                    <Provider>
                        <div className="jump" />
                    </Provider>
                </div>
            </Anchor>
        </div>
    );

    expect(tree.toJSON()).toMatchSnapshot();

    // componentDidUpdate
    tree.update(
        <div className="root">
            <Anchor>
                <div className="consumer">
                    <Consumer />
                </div>
                <div className="provider">
                    <Provider>
                        <div className="jump-update" />
                    </Provider>
                </div>
            </Anchor>
        </div>
    );

    expect(tree.toJSON()).toMatchSnapshot();

    // componentWillUnmount
    tree.update(
        <div className="root">
            <Anchor>
                <div className="consumer">
                    <Consumer />
                </div>
                <div className="provider" />
            </Anchor>
        </div>
    );

    expect(tree.toJSON()).toMatchSnapshot();
});

test('anchor-less <Provider />', () => {
    const { Provider } = createJumpgate();

    console.error = jest.fn();

    const render = () => {
        renderer.create(
            <Provider>
                <div className="jump" />
            </Provider>
        );
    };

    expect(render).toThrowErrorMatchingSnapshot();
});

test('anchor-less <Consumer />', () => {
    const { Consumer } = createJumpgate();

    console.error = jest.fn();

    const render = () => {
        renderer.create(<Consumer />);
    };

    expect(render).toThrowErrorMatchingSnapshot();
});

test('multiple <Provider />', () => {
    const { Anchor, Provider, Consumer } = createJumpgate();

    // mountError
    let msg;
    console.warn = jest.fn().mockImplementation(message => (msg = message));

    const tree = renderer.create(
        <div className="root">
            <Anchor>
                <div className="consumer">
                    <Consumer />
                </div>
                <div className="provider">
                    <Provider>
                        <div className="jump-1" />
                    </Provider>
                    <Provider>
                        <div className="jump-2" />
                    </Provider>
                </div>
            </Anchor>
        </div>
    );

    expect(console.warn).toHaveBeenCalled();
    expect(msg).toMatchSnapshot();

    // updateError
    msg = undefined;
    console.warn = jest.fn().mockImplementation(message => (msg = message));

    tree.update(
        <div className="root">
            <Anchor>
                <div className="consumer">
                    <Consumer />
                </div>
                <div className="provider">
                    <Provider>
                        <div className="jump-1" />
                    </Provider>
                </div>
            </Anchor>
        </div>
    );

    expect(console.warn).toHaveBeenCalled();
    expect(msg).toMatchSnapshot();
});
