const cesiumSource = "cesium/Source";
const cesiumWorkers = "../Build/Cesium/Workers"
const path = require("path")
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin=require("copy-webpack-plugin")

module.exports = {
    context:__dirname,
    entry:{
        app:"./src/index.js"
    },
    output:{
        filename:"boundle.js",
        path:path.resolve(__dirname,"dist"),
    },
    amd:{
        toUrlUndefined:true
    },
    resolve:{
        alias:{
            cesium:path.resolve(__dirname,cesiumSource)
        },
        mainFiles:["module","main","Cesium"]
    },
    module:{
        rules:[
            {
                test:/\.css$/,
                use:["style-loader","css-loader"]
            },
            {
                test:/\.(png|gif|jpg|jpeg|svg|xml|json)$/,
                use:["url-loader"]
            }
        ]
    },
    plugins:[
        new HtmlWebpackPlugin({
            template:"src/index.html"
        }),
        new CopyWebpackPlugin({
            patterns:[
                {from:path.join(cesiumSource,cesiumWorkers),to:"Workers"},
                {from:path.join(cesiumSource,"Assets"),to:"Assets"},
                {from:path.join(cesiumSource,"Widgets"),to:"Widgets"}
            ]
        }),
        new webpack.DefinePlugin({
            CESIUM_BASE_URL:JSON.stringify("")
        })
    ],
    mode:"development",
    devtool:"eval"//source maps
}