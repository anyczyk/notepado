const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';

    return {
        entry: './src/index.tsx',
        output: {
            path: path.resolve(__dirname, 'www'),
            filename: 'bundle.js',
        },
        mode: isProduction ? 'production' : 'development',
        module: {
            rules: [
                // Reguła dla plików JavaScript/TypeScript
                {
                    test: /\.(js|jsx|ts|tsx)$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'ts-loader',
                    },
                },
                // **Nowa reguła dla plików CSS**
                {
                    test: /\.css$/,
                    use: [
                        'style-loader', // Wstrzykuje style do DOM
                        'css-loader',   // Interpretuje @import i url()
                    ],
                },
                // Reguła dla plików SCSS
                {
                    test: /\.scss$/,
                    use: [
                        'style-loader', // Wstrzykuje style do DOM
                        'css-loader',   // Interpretuje @import i url()
                        'sass-loader',  // Kompiluje Sass do CSS
                    ],
                },
                // **Nowa reguła dla plików fontów i obrazów**
                {
                    test: /\.(woff|woff2|eot|ttf|otf|svg)$/,
                    type: 'asset/resource',
                },
            ],
        },
        resolve: {
            extensions: ['.ts', '.tsx', '.js', '.jsx'],
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: './public/index.html',
                favicon: './public/favicon.ico'
            }),
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: 'public',
                        to: '.',
                        // Wykluczamy index.html, bo generuje go HtmlWebpackPlugin
                        filter: (resourcePath) => {
                            return !resourcePath.endsWith('index.html');
                        },
                    },
                ],
            }),
        ],
        devServer: {
            static: {
                directory: path.join(__dirname, 'public'),
            },
            port: 3000,
            open: true,
            historyApiFallback: true,
        },
    };
};
