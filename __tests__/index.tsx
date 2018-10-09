import * as React from 'react';
import renderer from 'react-test-renderer';

import createJumpgate from '../src';

test('basic', () => {
    const { Anchor, Provider, Consumer } = createJumpgate();

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
