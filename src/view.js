/// <reference path="../cesium-main/Source/Cesium.js"/>

import * as Cesium from "cesium";
import "cesium/Widgets/widgets.css";

const viewer = new Cesium.Viewer("cesiumContainer",
    {
        infoBox: false,
        timeline:false,
        animation:false,
        baseLayerPicker:false,
        sceneModePicker:false,
        selectionIndicator: true,
        shadows: true,
        shouldAnimate: true,
        scene3DOnly: true,
        contextOptions:{
            requestWebgl2:true
        }
    });
viewer.scene.logarithmicDepthBuffer=true;

export { viewer };