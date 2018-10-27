import { TestRendererOptions, ReactTestRenderer } from 'react-test-renderer';
import { Jumpgate } from '../src';
import { ReactElement } from 'react';

interface Renderer {
    create(
        nextElement: ReactElement<any>,
        options?: TestRendererOptions,
    ): ReactTestRenderer;
}

for (const reactVersion of ['16.3.0', '16.6.0', '16.7.0-alpha.0']) {
    describe(`works with React ${reactVersion}`, () => {
        let React;
        let renderer: Renderer;
        let createJumpgate: () => Jumpgate;

        {
            jest.resetModules();
            // @ts-ignore
            React = require('react');
            // @ts-ignore
            Object.assign(React, { version: reactVersion });
            // @ts-ignore
            createJumpgate = require('../src').default;
            // @ts-ignore
            renderer = require('react-test-renderer');
        }

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
                </div>,
            );

            expect(tree.toJSON()).toMatchInlineSnapshot(`
<div
  className="root"
>
  <div
    className="consumer"
  >
    <div
      className="jump"
    />
  </div>
  <div
    className="provider"
  />
</div>
`);

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
                </div>,
            );

            expect(tree.toJSON()).toMatchInlineSnapshot(`
<div
  className="root"
>
  <div
    className="consumer"
  >
    <div
      className="jump-update"
    />
  </div>
  <div
    className="provider"
  />
</div>
`);

            // componentWillUnmount
            tree.update(
                <div className="root">
                    <Anchor>
                        <div className="consumer">
                            <Consumer />
                        </div>
                        <div className="provider" />
                    </Anchor>
                </div>,
            );

            expect(tree.toJSON()).toMatchInlineSnapshot(`
<div
  className="root"
>
  <div
    className="consumer"
  />
  <div
    className="provider"
  />
</div>
`);
        });

        test('fallback', () => {
            const { Anchor, Provider, Consumer } = createJumpgate();

            // default
            const tree = renderer.create(
                <div className="root">
                    <Anchor>
                        <div className="consumer">
                            <Consumer>
                                <div className="default" />
                            </Consumer>
                        </div>
                        <div className="provider" />
                    </Anchor>
                </div>,
            );

            expect(tree.toJSON()).toMatchInlineSnapshot(`
<div
  className="root"
>
  <div
    className="consumer"
  >
    <div
      className="default"
    />
  </div>
  <div
    className="provider"
  />
</div>
`);

            // telefrag
            tree.update(
                <div className="root">
                    <Anchor>
                        <div className="consumer">
                            <Consumer>
                                <div className="default" />
                            </Consumer>
                        </div>
                        <div className="provider">
                            <Provider>
                                <div className="jump" />
                            </Provider>
                        </div>
                    </Anchor>
                </div>,
            );

            expect(tree.toJSON()).toMatchInlineSnapshot(`
<div
  className="root"
>
  <div
    className="consumer"
  >
    <div
      className="jump"
    />
  </div>
  <div
    className="provider"
  />
</div>
`);

            // restore
            tree.update(
                <div className="root">
                    <Anchor>
                        <div className="consumer">
                            <Consumer>
                                <div className="default" />
                            </Consumer>
                        </div>
                        <div className="provider" />
                    </Anchor>
                </div>,
            );

            expect(tree.toJSON()).toMatchInlineSnapshot(`
<div
  className="root"
>
  <div
    className="consumer"
  >
    <div
      className="default"
    />
  </div>
  <div
    className="provider"
  />
</div>
`);
        });

        test('anchor-less <Provider />', () => {
            const { Provider } = createJumpgate();

            console.error = jest.fn();

            const render = () => {
                renderer.create(
                    <Provider>
                        <div className="jump" />
                    </Provider>,
                );
            };

            expect(render).toThrowErrorMatchingInlineSnapshot(
                `"Attempted to render a <Provider /> without an <Anchor />"`,
            );
        });

        test('anchor-less <Consumer />', () => {
            const { Consumer } = createJumpgate();

            console.error = jest.fn();

            const render = () => {
                renderer.create(<Consumer />);
            };

            expect(render).toThrowErrorMatchingInlineSnapshot(
                `"Attempted to render a <Consumer /> without an <Anchor />"`,
            );
        });

        test('multiple <Provider />', () => {
            const { Anchor, Provider, Consumer } = createJumpgate();

            // cache
            const elem1 = <div className="jump-1" />;
            const elem2 = <div className="jump-2" />;

            const messages: string[] = [];
            console.warn = jest
                .fn()
                .mockImplementation(message => messages.push(message));

            // create
            const tree = renderer.create(
                <div className="root">
                    <Anchor>
                        <div className="consumer">
                            <Consumer />
                        </div>
                        <div className="provider">
                            <Provider>{elem1}</Provider>
                        </div>
                    </Anchor>
                </div>,
            );

            expect(messages).toMatchInlineSnapshot(`Array []`);

            // mountError
            messages.length = 0;

            tree.update(
                <div className="root">
                    <Anchor>
                        <div className="consumer">
                            <Consumer />
                        </div>
                        <div className="provider">
                            <Provider>{elem1}</Provider>
                            <Provider>{elem2}</Provider>
                        </div>
                    </Anchor>
                </div>,
            );

            expect(messages).toMatchInlineSnapshot(`
Array [
  "Tried to use an already-full Jumpgate. Did you render multiple <Provider /> ?",
]
`);

            // unmountOk
            messages.length = 0;

            tree.update(
                <div className="root">
                    <Anchor>
                        <div className="consumer">
                            <Consumer />
                        </div>
                        <div className="provider">
                            <Provider>{elem1}</Provider>
                        </div>
                    </Anchor>
                </div>,
            );

            expect(messages).toMatchInlineSnapshot(`Array []`);

            // updateError
            messages.length = 0;

            tree.update(
                <div className="root">
                    <Anchor>
                        <div className="consumer">
                            <Consumer />
                        </div>
                        <div className="provider">
                            <Provider>{elem2}</Provider>
                        </div>
                    </Anchor>
                </div>,
            );

            expect(messages).toMatchInlineSnapshot(`
Array [
  "Tried to update an empty Jumpgate. Did you render multiple <Provider /> ?",
]
`);

            // remountError
            messages.length = 0;

            tree.update(
                <div className="root">
                    <Anchor>
                        <div className="consumer">
                            <Consumer />
                        </div>
                        <div className="provider">
                            <Provider>{elem1}</Provider>
                            <Provider>{elem2}</Provider>
                        </div>
                    </Anchor>
                </div>,
            );

            expect(messages).toMatchInlineSnapshot(`
Array [
  "Tried to use an already-full Jumpgate. Did you render multiple <Provider /> ?",
]
`);

            // unmountError
            messages.length = 0;

            tree.update(
                <div className="root">
                    <Anchor>
                        <div className="consumer">
                            <Consumer />
                        </div>
                        <div className="provider" />
                    </Anchor>
                </div>,
            );

            expect(messages).toMatchInlineSnapshot(`
Array [
  "Tried to clear an empty Jumpgate. Did you render multiple <Provider /> ?",
]
`);
        });
    });
}
