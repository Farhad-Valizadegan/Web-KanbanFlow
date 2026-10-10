const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { AxiosError } = require('axios');

// Exercise the actual route component with controlled session-query outcomes.
function renderRoute(query) {
    const source = fs.readFileSync(path.join(__dirname, '../src/components/auth/ProtectedRoute.tsx'), 'utf8');
    const compiled = ts.transpileModule(source, { compilerOptions: {
        module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
    } }).outputText;
    const exports = {};
    vm.runInNewContext(compiled, { exports, require(name) {
        if (name === '@tanstack/react-query') return { useQuery: () => query };
        if (name === 'react-router-dom') return {
            Navigate: ({ to }) => React.createElement('span', { 'data-redirect': to }),
            Outlet: () => React.createElement('span', null, 'Protected content'),
        };
        if (name.endsWith('/features/auth/api')) return { getCurrentUser() {} };
        return require(name);
    } });
    const tree = exports.default();
    return { tree, html: renderToStaticMarkup(tree) };
}

function failure(status) {
    return new AxiosError('Session request failed', undefined, undefined, undefined,
        status === undefined ? undefined : { status, data: {} });
}

test('confirmed 401 redirects to login', () => {
    assert.match(renderRoute({ isError: true, error: failure(401) }).html, /data-redirect="\/login"/);
});
for (const status of [undefined, 403, 419, 429, 500, 503]) {
    test(`session failure ${status ?? 'offline'} preserves retry instead of redirecting`, () => {
        let retried = 0;
        const result = renderRoute({ isError: true, error: failure(status), refetch: () => { retried++; } });
        assert.match(result.html, /Unable to check your session/);
        assert.doesNotMatch(result.html, /data-redirect|Protected content/);
        const button = React.Children.toArray(result.tree.props.children).find(child => child.type === 'button');
        button.props.onClick();
        assert.equal(retried, 1);
    });
}
test('retry is disabled while checking', () => {
    assert.match(renderRoute({ isError: true, error: failure(500), isFetching: true }).html, /disabled=""/);
});
test('loading does not expose protected content', () => {
    const { html } = renderRoute({ isPending: true });
    assert.match(html, /Loading session/);
    assert.doesNotMatch(html, /Protected content|data-redirect/);
});
test('successful session shows protected content', () => {
    assert.match(renderRoute({ isSuccess: true }).html, /Protected content/);
});
