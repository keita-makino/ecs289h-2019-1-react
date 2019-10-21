import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';
import React, { useEffect, useRef } from 'react';
import data from '../data/lesmis-3d.json';

interface Props {
  hoge?: number;
}

// Taken from https://stackoverflow.com/questions/5623838/
// Author: Michał Perłakowski - https://stackoverflow.com/users/3853934/
const hexToRgb = (hex: string) =>
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  hex
    .replace(
      /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
      (m, r, g, b) => '#' + r + r + g + g + b + b
    )
    .substring(1)
    .match(/.{2}/g)!
    .map(x => parseInt(x, 16) / 256);

const onSceneLoaded = (
  engine: BABYLON.Engine,
  scene: BABYLON.Scene,
  canvas: HTMLCanvasElement
) => {
  const camera = new BABYLON.ArcRotateCamera(
    'camera',
    0,
    0,
    1,
    new BABYLON.Vector3(0, 0, -4),
    scene
  );
  camera.wheelPrecision = 50;
  camera.setTarget(BABYLON.Vector3.Zero());
  camera.attachControl(canvas);

  const light = new BABYLON.HemisphericLight(
    'light',
    new BABYLON.Vector3(1, 1, 1),
    scene
  );
  light.intensity = 0.6;

  const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI');
  const label = GUI.Button.CreateSimpleButton('label', 'hogehoge');
  label.width = '175px';
  label.height = '50px';
  label.color = 'white';
  label.alpha = 0;
  label.background = 'blue';
  label.fontSize = 20;
  advancedTexture.addControl(label);

  const toolTipMesh = new BABYLON.Mesh('toolTipMesh');
  label.linkWithMesh(toolTipMesh);

  const nodes = data.nodes.map(item => {
    const sphere = BABYLON.Mesh.CreateSphere(item.id, 16, 0.2, scene);
    sphere.position = new BABYLON.Vector3(item.x, item.y, item.z);
    const material = new BABYLON.StandardMaterial('white', scene);
    material.emissiveColor = new BABYLON.Color3(
      hexToRgb(item.color)[0],
      hexToRgb(item.color)[1],
      hexToRgb(item.color)[2]
    );
    sphere.material = material;

    sphere.actionManager = new BABYLON.ActionManager(scene);
    sphere.actionManager.registerAction(
      new BABYLON.InterpolateValueAction(
        BABYLON.ActionManager.OnPointerOverTrigger,
        toolTipMesh,
        'position',
        new BABYLON.Vector3(item.x, item.y, item.z).add(
          new BABYLON.Vector3(0, 0.25, 0)
        ),
        125
      )
    );
    sphere.actionManager.registerAction(
      new BABYLON.SetValueAction(
        BABYLON.ActionManager.OnPointerOverTrigger,
        label,
        'textBlock.text',
        item.id
      )
    );
    sphere.actionManager.registerAction(
      new BABYLON.InterpolateValueAction(
        BABYLON.ActionManager.OnPointerOverTrigger,
        label,
        'alpha',
        1,
        125
      )
    );
    sphere.actionManager.registerAction(
      new BABYLON.InterpolateValueAction(
        BABYLON.ActionManager.OnPointerOutTrigger,
        label,
        'alpha',
        0,
        125
      )
    );
    return { ...item, mesh: sphere };
  });

  const links = data.links.map(item => {
    const posStart = new BABYLON.Vector3(
      nodes[item.source].x,
      nodes[item.source].y,
      nodes[item.source].z
    );
    const posEnd = new BABYLON.Vector3(
      nodes[item.target].x,
      nodes[item.target].y,
      nodes[item.target].z
    );

    const cylinder = BABYLON.Mesh.CreateCylinder(
      'link',
      BABYLON.Vector3.Distance(posStart, posEnd),
      0.018,
      0.018,
      16,
      16,
      scene
    );
    cylinder.position = posEnd;
    cylinder.setPivotMatrix(
      BABYLON.Matrix.Translation(
        0,
        -BABYLON.Vector3.Distance(posStart, posEnd) / 2,
        0
      ),
      false
    );

    const vec1 = posEnd.subtract(posStart);
    vec1.normalize();
    const vec2 = new BABYLON.Vector3(0, 1, 0);
    const ax = BABYLON.Vector3.Cross(vec2, vec1);
    ax.normalize();
    const angle = Math.acos(BABYLON.Vector3.Dot(vec1, vec2));
    cylinder.rotationQuaternion = BABYLON.Quaternion.RotationAxis(ax, angle);

    const material = new BABYLON.StandardMaterial('white', scene);
    material.emissiveColor = new BABYLON.Color3(1, 1, 1);
    cylinder.material = material;

    return { ...item, mesh: cylinder };
  });

  engine.runRenderLoop(() => {
    if (scene) {
      scene.render();
    }
  });
};

const Scene: React.FC<Props> = ({ hoge = 35 }: Props) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current as HTMLCanvasElement;
    const engine = new BABYLON.Engine(canvas, true);
    const scene = new BABYLON.Scene(engine);
    onSceneLoaded(engine, scene, canvas);
  });

  return <canvas width="1280px" height="720px" ref={ref} />;
};

export default Scene;
