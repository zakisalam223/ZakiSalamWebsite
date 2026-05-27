import './mainstyle.css';
import * as THREE from 'three';

import vertexShader from './shaders/vertex.glsl?raw';
import fragmentShader from './shaders/fragment.glsl?raw';

import { Creature } from './Creature.js';
import { Limb } from './Limb';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(10, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

var objs = [];
var objMinSize = 0.4;
var objMaxSize = 0.5;
var objMat;
const numOfObjs = 30;


const styles = getComputedStyle(document.documentElement);
const background_color = styles.getPropertyValue('--background').trim();
const primary_color = styles.getPropertyValue('--primary').trim();
const secondary_color = styles.getPropertyValue('--secondary').trim();

// for frag shader lighting
const lightPosition = new THREE.Vector3(0, 0, -15);
const ambientStrength = 0.9;
const specularStrength = 0.1;
const shininess = 10.0;

// for 2D stuff
const canvas2D = document.createElement('canvas');
canvas2D.style.position = 'fixed';
canvas2D.style.top = '0';
canvas2D.style.left = '0';
canvas2D.style.zIndex = '2';
canvas2D.style.pointerEvents = 'none';
document.body.appendChild(canvas2D);

let salamander;

const ctx2D = canvas2D.getContext('2d');
const salamanderBox = '.box--big'
const salamanderBodySizes = [
    // head
    21, 21, 21, 21,

    // neck
    19, 18,

    // body
    19, 21, 23, 24, 25,
    26, 26, 26, 25, 24, 23,
    22, 20, 18, 16,

    // tail
    14, 13, 13, 12, 12,
    11, 11, 10, 10, 9, 9,
    8, 7, 6, 5, 4, 3, 2, 1
];

const limbLength = 15;
const limbEffectors = 3;
const salamanderLimbs = [
    new Limb(8, 1, limbEffectors, limbLength, secondary_color),
    new Limb(8, -1, limbEffectors, limbLength, secondary_color),
    new Limb(18, 1, limbEffectors, limbLength, secondary_color),
    new Limb(18, -1, limbEffectors, limbLength, secondary_color),
];
salamanderLimbs[1].stepProgress = 0.5;
salamanderLimbs[3].stepProgress = 0.5;

const mouse = { x: 0, y: 0 };
window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

init();

function animate(time) {
    animate3D(time);
    animate2D(time);
}

renderer.setAnimationLoop(animate);

async function init() {
    scene.background = new THREE.Color(background_color);
    createMaterial();
    createGeometry();

    const box = document.querySelector(salamanderBox);
    const rect = box.getBoundingClientRect();

    salamander = new Creature(rect.left + (rect.width / 2), rect.top + (1.5 * rect.height / 2), secondary_color, salamanderBodySizes.length, salamanderBodySizes, rect);
}

function generateRandomVector(magnitude) {
    const vec = new THREE.Vector3(
        (Math.random() * 2 - 1) * magnitude,
        (Math.random() * 2 - 1) * magnitude,
        ((Math.random() * 2 - 1) * magnitude * 1.5) - 25
    );

    return vec;
}

function createGeometry() {

    for (let i = 0; i < numOfObjs; i++) {

        const objMatInstance = objMat.clone();
        objMatInstance.uniforms = THREE.UniformsUtils.clone(objMat.uniforms);
        objMatInstance.uniforms.morphSpeed.value = generateRandomFloatInRange(1.0, 3.0);

        const objSize = generateRandomFloatInRange(objMinSize, objMaxSize);
        const geometry = new THREE.SphereGeometry(objSize, 64, 64);

        var obj = new THREE.Mesh(geometry, objMatInstance);
        const pos = generateRandomVector(10);
        obj.position.copy(pos);
        objs.push({
            mesh: obj,
            offsetX: Math.random() * Math.PI * 2,
            offsetY: Math.random() * Math.PI * 2,
            speedX: generateRandomFloatInRange(0.1, 0.2),
            speedY: generateRandomFloatInRange(0.1, 0.2),
            amplitude: Math.random() * 2 + 1,

            rotationXSpeed: generateRandomFloatInRange(0.05, 0.2),
            rotationYSpeed: generateRandomFloatInRange(0.05, 0.2)
        });
        scene.add(obj);
    }

}

function createMaterial() {
    objMat = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 1.0 },
            resolution: { value: new THREE.Vector2() },
            color: { value: new THREE.Color(secondary_color) },
            fogColor: { value: new THREE.Color(background_color) },

            lightPosition: { value: lightPosition },
            viewPosition: { value: camera.position },
            ambientStrength: { value: ambientStrength },
            specularStrength: { value: specularStrength },
            shininess: { value: shininess },
            morphSpeed: { value: 1.0 },
        },
        transparent: false,
        blending: THREE.MultiplyBlending,
        vertexShader,
        fragmentShader
    });
}

function generateRandomFloatInRange(min, max) {
    return (Math.random() * (max - min) + min);
}

function animate3D(time) {
    objs.forEach(({ mesh }) => {
        mesh.material.uniforms.time.value = time / 1000; // seconds
        objMat.uniforms.viewPosition.value.copy(camera.position);
    });

    objs.forEach(({ mesh, offsetX, offsetY, speedX, speedY, amplitude, rotationXSpeed, rotationYSpeed }) => {

        mesh.position.x = Math.sin((time / 1000) * speedX + offsetX) * amplitude;
        mesh.position.y = Math.sin((time / 1000) * speedY + offsetY) * amplitude;

        mesh.rotation.x = (time / 2000) * rotationXSpeed;
        mesh.rotation.y = (time / 1000) * rotationYSpeed;
    });

    renderer.render(scene, camera);
}

function animate2D(time) {
    canvas2D.width = window.innerWidth;
    canvas2D.height = window.innerHeight;
    ctx2D.clearRect(0, 0, canvas2D.width, canvas2D.height);

    if (!salamander) return;

    for (var i = 0; i < salamanderLimbs.length; i++) {
        var limb = salamanderLimbs[i];
        limb.updateRoot(salamander.body[limb.segmentIndex]);
        limb.update();
        limb.draw(ctx2D);
    }

    const box = document.querySelector(salamanderBox);
    const rect = box.getBoundingClientRect();

    salamander.update(time, mouse, rect);
    salamander.display(ctx2D);
    salamander.drawBody(ctx2D);



}