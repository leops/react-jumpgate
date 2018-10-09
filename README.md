# react-jumpgate

A generic implementation of portals for React, for platforms where ReactDOM is not available
(eg. this could be used in a React Native application to add buttons to the toolbar from any component in the tree)

```js
import createJumpgate from 'react-jumpgate';

// A jumpgate is made of 3 components: an anchor, a consumer and a provider
const { Anchor, Consumer, Provider } = createJumpgate();

const App = () => (
    <div class="app">
        {/* Place the anchor near the root of your component tree */}
        <Anchor>
            <div class="header">
                {/* The consumer acts as a placeholder for the component you want to teleport */}
                <Consumer />
            </div>
            <div class="content">
                {/* The provider will send its children through the jumpgate to the consumer */}
                <Provider>
                    <h1>Title</h1>
                </Provider>
            </div>
        </Anchor>
    </div>
);

/* <App /> will render as
    <div class="app">
        <div class="header">
            <h1>Title</h1>
        </div>
        <div class="content" />
    </div>
*/
```
