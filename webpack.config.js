const EXTERNAL_MODULES = ['sqlite3'];
const isProduction = process.env.NODE_ENV !== 'production';

module.exports = [
    {
        entry: [
            'babel-polyfill',
            './app/renderer.js'
        ],
        output: {
            path: __dirname + '/app/dist',
            filename: 'renderer.js'
        },
        devtool: isProduction ? 'inline-source-map': 'eval',
        module: {
            rules: [
                {
                    test: /\.jsx?$/,
                    use: 'babel-loader',
                    exclude: /node_modules/
                },
            ]
        },
        target: 'electron-renderer'
    },
    {
        entry: [
            'babel-polyfill',
            './app/main.js'
        ],

        output: {
            path: __dirname + '/app/dist',
            filename: 'main.js'
        },
        devtool: isProduction ? 'inline-source-map': 'eval',
        externals: [
            (context, request, callback) => {
                if (EXTERNAL_MODULES.indexOf(request) >= 0) {
                    return callback(null, 'commonjs ' + request);
                }
                return callback();
            }
        ],
        module: {
            rules: [
                {
                    test: /\.jsx?$/,
                    use: 'babel-loader',
                    exclude: /node_modules/
                }
            ]
        },
        target: 'electron'
    }
];
