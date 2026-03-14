import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

let scene, camera, renderer;
let controls;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
const velocity = new THREE.Vector3();
let speed = 200;
const clock = new THREE.Clock();

const BLOCK_SIZE = 8;
const BLOCK_HEIGHT = 180;
const DOOR_HEIGHT = 15;

const loader = new THREE.TextureLoader();
const wallTexture = loader.load('wall.jpg');
const floorTexture = loader.load('floor.jpg');
const doorTexture = loader.load('door.jpg');
wallTexture.colorSpace = THREE.SRGBColorSpace;
floorTexture.colorSpace = THREE.SRGBColorSpace;
doorTexture.colorSpace = THREE.SRGBColorSpace;

const wallMaterial = new THREE.MeshStandardMaterial({ map: wallTexture });
const floorMaterial = new THREE.MeshStandardMaterial({ map: floorTexture });
const doorMaterial = new THREE.MeshStandardMaterial({ map: doorTexture, side: THREE.DoubleSide });

let objects = [];
let obstacleBoxes = [];

const ambientStream = "music.wav"
const walkingStream = "walking_on_wood_sound.wav"
const doorStream = "door.wav";

let audioLoader = new THREE.AudioLoader();
let listener = new THREE.AudioListener();

let audioAmbient = new THREE.Audio(listener);
audioLoader.load(ambientStream, function(buffer) {
    audioAmbient.setBuffer(buffer);
    audioAmbient.setLoop(true);
});
audioAmbient.setVolume(0.3);

let audioWalking = new THREE.Audio(listener);
audioLoader.load(walkingStream, function(buffer) {
    audioWalking.setBuffer(buffer);
    audioWalking.setLoop(true);
});

let audioDoor = new THREE.Audio(listener);
audioLoader.load(doorStream, function(buffer) {
    audioDoor.setBuffer(buffer);
    audioDoor.setLoop(false);
});

const map = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 3, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

const color = "#030303";
const intensity = 1;
const lightColor = "#ffffff";
let light, lightTarget, helper, ambientLight;

const pause = document.getElementById('pause');
const instruction = document.getElementById('instruction');

let startPosition = new THREE.Vector3();

function onKeyDown(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = true;
            break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = false;
            break;
    }
}

function onLock() {
    if(!audioAmbient.isPlaying)
    {
        audioAmbient.play();
    }
    instruction.style.display = 'none';
    pause.style.display = 'none';
}

function onUnlock() {
    if(audioAmbient.isPlaying)
    {
        audioAmbient.stop();
    }
    pause.style.display = 'block';
    instruction.style.display = '';
}

function startGame() {
    controls.lock();
}

function endGame() {
    if(audioAmbient.isPlaying) {
        audioAmbient.stop();
    }
    if(audioWalking.isPlaying) {
        audioWalking.stop();
    }
    instruction.textContent = 'You Won! Click to play again';
    controls.unlock();
    instruction.removeEventListener('click', startGame);
    instruction.addEventListener('click', restartGame);
}

function restartGame() {
    init();
    instruction.textContent = 'Click to start';
    instruction.removeEventListener('click', restartGame);
    instruction.addEventListener('click', startGame);
}

function checkCollision(x, z) {
    const playerBox = new THREE.Box3();
    playerBox.setFromCenterAndSize(
        new THREE.Vector3(x, 4, z),
        new THREE.Vector3(1.5, 3, 1.5)
    );

    for (let obstacle of obstacleBoxes) {
        obstacle.box.setFromObject(obstacle.mesh);

        if (playerBox.intersectsBox(obstacle.box)) {
            if (obstacle.mesh.material === doorMaterial) {
                audioDoor.play();
                setTimeout(() => {
                    endGame();
                }, 100);
            }
            return true;
        }
    }
    return false;
}

function init() {
    if (scene) {
        while (scene.children.length > 0) {
            scene.remove(scene.children[0]);
        }
    }

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111122);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
    scene.add(camera);
    if (renderer && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    controls = new PointerLockControls(camera, document.body);

    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    controls.removeEventListener('lock', onLock);
    controls.removeEventListener('unlock', onUnlock);
    instruction.removeEventListener('click', startGame);
    instruction.removeEventListener('click', restartGame);

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    controls.addEventListener('lock', onLock);
    controls.addEventListener('unlock', onUnlock);
    instruction.addEventListener('click', startGame);

    moveForward = false;
    moveBackward = false;
    moveLeft = false;
    moveRight = false;
    velocity.set(0, 0, 0);
    objects = [];
    obstacleBoxes = [];

    for (let row = 0; row < map.length; row++) {
        for (let col = 0; col < map[row].length; col++) {
            let x = col * BLOCK_SIZE;
            let z = row * BLOCK_SIZE;

            if (map[row][col] === 1) {
                let wall = new THREE.Mesh(
                    new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_HEIGHT, BLOCK_SIZE),
                    wallMaterial
                );
                wall.position.set(x, BLOCK_HEIGHT / 2, z);
                scene.add(wall);
                objects.push(wall);
            } else {
                if (map[row][col] === 2) {
                    startPosition.set(x, 8, z);
                    camera.position.copy(startPosition);
                    camera.lookAt(0, 0, 180);
                }
                if (map[row][col] === 3) {
                    let door = new THREE.Mesh(
                        new THREE.BoxGeometry(BLOCK_SIZE, DOOR_HEIGHT, BLOCK_SIZE),
                        doorMaterial
                    );
                    door.position.set(x, DOOR_HEIGHT / 2, z);
                    scene.add(door);
                    objects.push(door);
                }

                let floor = new THREE.Mesh(
                    new THREE.BoxGeometry(BLOCK_SIZE, 0.2, BLOCK_SIZE),
                    floorMaterial
                );
                floor.position.set(x, 0, z);
                scene.add(floor);
            }
        }
    }

    objects.forEach(obj => {
        const box = new THREE.Box3().setFromObject(obj);
        obstacleBoxes.push({ mesh: obj, box: box });
    });

    if (ambientLight) scene.remove(ambientLight);
    if (light) camera.remove(light);
    if (lightTarget) camera.remove(lightTarget);

    ambientLight = new THREE.AmbientLight(color, intensity);
    scene.add(ambientLight);

    light = new THREE.SpotLight(lightColor, intensity);
    light.angle = 0.5;
    light.penumbra = 0.2;
    light.decay = 5;

    camera.add(light);
    light.position.set(0, 0, 0);

    lightTarget = new THREE.Object3D();
    lightTarget.position.set(0, 0, -10);
    camera.add(lightTarget);
    light.target = lightTarget

    window.addEventListener( 'resize', onWindowResize );
}

function animate() {
    requestAnimationFrame(animate);

    if (controls && controls.isLocked) {
        const delta = Math.min(clock.getDelta(), 0.1);

        const cameraDir = new THREE.Vector3();
        camera.getWorldDirection(cameraDir);
        cameraDir.y = 0;
        cameraDir.normalize();

        const cameraRight = new THREE.Vector3();
        cameraRight.crossVectors(new THREE.Vector3(0, 1, 0), cameraDir).normalize();

        const moveInput = new THREE.Vector3();
        if (moveForward) moveInput.add(cameraDir);
        if (moveBackward) moveInput.sub(cameraDir);
        if (moveRight) moveInput.sub(cameraRight);
        if (moveLeft) moveInput.add(cameraRight);

        if (moveInput.length() > 0) {
            moveInput.normalize();
        }
        else
        {
            if(audioWalking.isPlaying)
                audioWalking.stop();
        }

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.x += moveInput.x * speed * delta;
        velocity.z += moveInput.z * speed * delta;

        const moveX = velocity.x * delta;
        if (Math.abs(moveX) > 0.0001) {
            const newX = camera.position.x + moveX;
            if (!checkCollision(newX, camera.position.z)) {
                if(!audioWalking.isPlaying)
                    audioWalking.play();
                camera.position.x = newX;
            } else {
                if(audioWalking.isPlaying)
                    audioWalking.stop();
                velocity.x = 0;
            }
        }

        const moveZ = velocity.z * delta;
        if (Math.abs(moveZ) > 0.0001) {
            const newZ = camera.position.z + moveZ;
            if (!checkCollision(camera.position.x, newZ)) {
                if(!audioWalking.isPlaying)
                    audioWalking.play();
                camera.position.z = newZ;
            } else {
                if(audioWalking.isPlaying)
                    audioWalking.stop();
                velocity.z = 0;
            }
        }

        controls.getObject().position.copy(camera.position);
    }
    else
    {
        if(audioWalking.isPlaying)
            audioWalking.stop();
    }

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.onload = function() {
    init();
    animate();
};