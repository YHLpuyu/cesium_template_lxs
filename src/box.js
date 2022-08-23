/// <reference path="../cesium/Build/Cesium/Cesium.d.ts"/>

import { viewer } from "./view";
import { BoxGeometry, VertexFormat, Matrix4, Transforms, Cartesian3,Color } from "cesium";

const geometry = BoxGeometry.fromDimensions({
    vertexFormat: VertexFormat.POSITION_AND_ST,
    dimensions: new Cartesian3(1, 1, 1)
});
const primitive_modelMatrix = Matrix4.multiplyByTranslation(
    Transforms.eastNorthUpToFixedFrame(
        Cartesian3.fromDegrees(
            124.21936679679918,
            45.85136872098397
        )
    ),
    new Cartesian3(0.0, 0.0, 80.0),
    new Matrix4()
);

viewer.entities.add({
    name: "Yellow box outline",
    position: Cartesian3.fromDegrees(124.21936679679918,
        45.85136872098397, 80.0),
    box: {
        dimensions: new Cartesian3(1.0, 1.0, 1.0),
        fill: false,
        outline: true,
        outlineColor: Color.YELLOW,
    },
});

viewer.camera.lookAt(new Cartesian3.fromDegrees(124.21936679679918,
    45.85136872098397, 80), new Cartesian3(2, 2, 2));