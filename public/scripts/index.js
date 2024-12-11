import * as THREE from '../build/three.module.js';


import {GLTFLoader} from '../jsm/loaders/GLTFLoader.js';


import {Boid} from './Boid.js';
import {Creature} from './Creature.js';
import {Bounds} from './Bounds.js';

import {Predator} from './Predator.js';

import {Walker} from './Walker.js';

import {getRandomNum} from './utilFunctions.js';

//user set dimensions
let scene, mainCamera, renderer, clock;
let loader, object, mixer;


//video texture variables
let video, videoImage, videoImageContext, videoTexture, movieScreen;
let toggle = false;

//Bounds for boids
let bounds; 

//Keep track of seekers
let predators = [];

//Array to hold all walkers
let walkers = [];

/*
Arrays to hold all gltf models
*/
//Fish models
let models = {
    bream: [],
    whale: [],
    discus: [],
    flage: [], 
}
//Arrays for animations of objects
//As with above, make into object, 
//and store these values in custom arrays 
let mixers = [];


//Stats
(function(){var script=document.createElement('script');script.onload=function(){var stats=new Stats();document.body.appendChild(stats.dom);requestAnimationFrame(function loop(){stats.update();requestAnimationFrame(loop)});};script.src='//mrdoob.github.io/stats.js/build/stats.min.js';document.head.appendChild(script);})()

//Array to hold the camera views
let views = [];

function View( canvas, fullWidth, fullHeight, viewX, viewY, viewWidth, viewHeight ) {

    canvas.width = viewWidth * window.devicePixelRatio;
    canvas.height = viewHeight * window.devicePixelRatio;

    var context = canvas.getContext( '2d' );

    var camera = new THREE.PerspectiveCamera( 45, viewWidth / viewHeight, 1, 5000 ); //Create new perspectiveCamera

    var pointLight = new THREE.PointLight( 0xffffff, 0.8 ); //Light for each camera to increase visibility
    camera.add( pointLight );

    //Shifts camera along given offset in line with the number of views the total area is split into
    camera.setViewOffset( fullWidth, fullHeight, viewX, viewY, viewWidth, viewHeight );
    camera.position.y += 750;
    camera.rotation.x = Math.PI * - 0.5; //Camera looks down on rendered area

    //Render each view from the camera onto the canvas
    this.render = function () {

        renderer.render( scene, camera );

        context.drawImage( renderer.domElement, 0, 0 );
    };

}

//load object functions
/*
    Used to load GLTF objects, 
    takes array where object will be stored as a parameter.
-----------------------------------------------------------------------------------------
    Invoked as follows >
    loader.load('objects/bream/scene.gltf', gltf => onLoad( gltf, breamLocations[i], 0.025), onProgress, onError);
*/
function loadModels()
{
    const loader = new GLTFLoader();

    
    const onLoad = (gltf, scale, rotationOffset, objArr, index) => {
        
        let model = gltf;

        objArr[index].setModel(model);
    
        //set scale
        objArr[index].setScale(scale);

        //set rotation offset
        objArr[index].setRotationOffset(rotationOffset[0], rotationOffset[1], rotationOffset[2]);
       
        //add object to scene
        scene.add(objArr[index].model.scene);
    };

    const onProgress = () => {};

    const onError = ( errorMessage ) => {console.log( errorMessage );};

    /* add models here */
    // bream
    let breamRotation = [80,80,0];
    for (let i=0; i<breamNum; i++)
    {
        loader.load('objects/bream/scene.gltf', gltf => onLoad(gltf, 0.085, breamRotation, breamBoid.creatures, i), onProgress, onError);
    }
    
    //discus
    let discusRotation = [80, 0, 80];
    for (let i=0; i<discusNum; i++){
        loader.load('objects/discus/scene.gltf', gltf => onLoad(gltf, 0.5, discusRotation, discusBoid.creatures, i), onProgress, onError);
    }
    
    //whale - no rotation offset required here
    var loc = new THREE.Vector3(getRandomNum(-60,60), getRandomNum(-100,-20), getRandomNum(-60,60));
    loader.load('objects/blue_whale/scene.gltf', gltf => onLoad(), onProgress, onError);
    
}


let breamMeshGroup;
let breamBoid;
let breamNum = 50;
let breamRotate = new THREE.Vector3(80,0,0);

let discusBoid;
let discusNum = 50;
let discusMeshGroup;
let discusRotate = new THREE.Vector3(80,0,80);

let thirdBoid;
let thirdNum = 50;
let thirdMeshGroup;
let thirdRoate = new THREE.Vector3(0,0,0);

let flageBoid; 
let flageNum = 25;
let flageMeshGroup;
let flageRotate = new THREE.Vector3(0,0,0);

let floatBoid;
let floatNum = 25;
let floatMeshGroup;
let floatRotate = new THREE.Vector3(0,0,0);

let predatorLocs = [];

//should put these into list/object


let creatureNum = breamNum;
//creatures
const generateBoid = (boid, boidSize, creatureMeshGroup, color, geo) => {
    const creatures = [];
    scene.remove(creatureMeshGroup);
    creatureMeshGroup = new THREE.Group();
    for (let i = 0; i<boidSize; i++)
    {
        const creature = new Creature(color, geo);
        creatureMeshGroup.add(creature.mesh);
        creatures.push(creature);
    }
    boid = new Boid(creatures);
    scene.add(creatureMeshGroup);
    return boid;
};


function init()
{
    var w = 1920, h = 1080;

    var fullWidth = w * 3; //w * x. Where x is no. of columns
    var fullHeight = h * 1; ////h * x. Where x is no. of rows

    //Create view to be 'projected' onto each canvas
    views.push( new View( canvas1, fullWidth, fullHeight, w * 0, h * 0, w, h ) );
    views.push( new View( canvas2, fullWidth, fullHeight, w * 1, h * 0, w, h ) );
    views.push( new View( canvas3, fullWidth, fullHeight, w * 2, h * 0, w, h ) );


    //Scene
    scene = new THREE.Scene();

    //Renderer
    renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(w, h);
    
    var page = document.getElementById('mainDiv');
    if (page !== null && page !== undefined)
    {
        page.appendChild(renderer.domElement);   
    }
    
    //Check for keypress to play background visualisation
    document.body.addEventListener('keydown', onKeyPress, true);

    
    //clock for animations
    clock = new THREE.Clock();

    //Lighting
    var ambientLight = new THREE.AmbientLight( 0xcccccc, 0.4 );
	scene.add( ambientLight );
    var pointLight = new THREE.PointLight( 0xffffff, 0.8 );
    scene.add( pointLight );
    pointLight.position.set(0,1000,0);

    //Scene background color
    scene.background = new THREE.Color( 0xcdcdcd );
    
    //background visualisation
    backgroundTexture();

    //bounds
    bounds = new Bounds(2500, 750, 1200, 0x0000ff);
    bounds.mesh.position.y = -1000;
    scene.add(bounds);
    
    //Boids...
    //create geometry for the boids
    //One boid per type of fish 
    //Cylinder geometries
    const cylGeo = new THREE.CylinderGeometry(1, 8, 25, 12);
    cylGeo.rotateX(THREE.Math.degToRad(90));
    breamBoid = generateBoid(breamBoid, breamNum, breamMeshGroup, 0xff522c, cylGeo);
    discusBoid = generateBoid(discusBoid, discusNum, discusMeshGroup, 0x22bddd, cylGeo);
    thirdBoid = generateBoid(thirdBoid, thirdNum, thirdMeshGroup, 0xe71cad, cylGeo);
    
    //Dinoflaggelites slow moing
    const sphGeo = new THREE.SphereGeometry(7, 7, 7);
    flageBoid = generateBoid(flageBoid, flageNum, flageMeshGroup, 0x82f63f, sphGeo);
    
    //Change movement behaviour of flageBoid
    flageBoid.params.maxSpeed = 0.5;
    flageBoid.params.separate.maxForce = 0.5;
    flageBoid.params.separate.effectiveRange = 55;
    flageBoid.params.cohesion.effectiveRange = 5500;
    flageBoid.params.walkerThresh = 300;
    flageBoid.params.avoid.boost = 10;
    //models.flage.length = 50;

    //Dinoflaggelites slow moing
    const sphGeoFloat = new THREE.SphereGeometry(7, 7, 7);
    floatBoid = generateBoid(floatBoid, floatNum, floatMeshGroup, 0x22f46f, sphGeo);
    
    //Change movement behaviour of floatBoid
    floatBoid.params.maxSpeed = 0.5;
    floatBoid.params.separate.maxForce = 0.5;
    floatBoid.params.separate.effectiveRange = 55;
    floatBoid.params.cohesion.effectiveRange = 500;
    floatBoid.params.walkerThresh = 300;
    floatBoid.params.avoid.boost = 10;
    //models.floatBoid.length = 50;
    
    //predator/seeker behaviour
    for (let i =0; i<5; i++){
       let predator = new Predator(i);
       predators.push(predator);
       scene.add(predator.mesh);
    }

    //Create walkers
    for (var i = 0; i<5; i++)
    {
        let w = new Walker(i, 1920,1080, scene);
        walkers.push(w);
    }

    
    //Give the predators prey now walkers created
    predators.forEach(p => p.newPreyId(walkers.length));
    
    //Instantiate a GLTFLoader
    loader = new GLTFLoader(); //instantitate loader for gltf objects
    //loadModels();
    
}

/*
LOOPING - Animate() function
*/
function animate()
{      
    //Object Animations
    var delta = clock.getDelta();
    for (let i = 0; i < mixers.length; i++)
    {
        if (mixers[i]) mixers[i].update( delta );
    }
    
    //Render video
    renderVideo();
    
    /*********  Update all the creatures ************/
    /******Update Boids ******/
    breamBoid.update(bounds, walkers);
    for (let i = 0; i<breamBoid.creatures.length; i++)
    {
        breamBoid.creatures[i].setRotationOffset()
        if (breamBoid.creatures[i].mixer){breamBoid.creatures[i].mixer.update(delta);}
    }
    discusBoid.update(bounds, walkers);
    for (let i = 0; i<discusBoid.creatures.length; i++)
    {
        if (discusBoid.creatures[i].mixer){discusBoid.creatures[i].mixer.update(delta);}
    }

    flageBoid.update(bounds, walkers);
    for (let i = 0; i<flageBoid.creatures.length; i++)
    {
        if (flageBoid.creatures[i].mixer){flageBoid.creatures[i].mixer.update(delta);}
    }

    thirdBoid.update(bounds, walkers);

    floatBoid.update(bounds, walkers);

    /****** update predator/seeker *****/
    predators.forEach(p => p.update(walkers[p.getPreyId()].plane.position));

    /****** update walkers *****/
    walkers.forEach(w => w.moveAlongCurve());

    //Update each of the camera views
    views.forEach(v => v.render()); 
   
   window.requestAnimationFrame( animate );
}

//Main
init();
animate();

/*
Other functions for updating other elements
*/

//Function is playing video texture
function renderVideo(){
    if (toggle === true){
        /*play video texture at bottom */
        if ( video.readyState === video.HAVE_ENOUGH_DATA )
        {
            videoImageContext.drawImage( video, 0, 0 );
            if ( videoTexture )
            {
                videoTexture.needsUpdate = true;
                video.play();
            }
        }
    }
}

function backgroundTexture()
{
    video = document.createElement( 'video' );
    video.autoplay = true;
    video.src = '../video/background.mp4';
    video.load();
    video.play();

    videoImage = document.createElement( 'canvas' );
    videoImage.width = 960;
    videoImage.height = 540;

    videoImageContext = videoImage.getContext( '2d' );
    videoImageContext.fillStyle = '#0xcdcdcd';
    videoImageContext.fillRect( 0, 0, videoImage.width, videoImage.height );

    videoTexture = new THREE.Texture( videoImage );
    videoTexture.minFilter = THREE.LinearFilter; 
    videoTexture.magFilter = THREE.LinearFilter; 
    
    var movieMaterial = new THREE.MeshBasicMaterial({ map: videoTexture, overdraw: true, side: THREE.DoubleSide});

    var movieGeometry = new THREE.PlaneBufferGeometry( 1980+10000, 10800, 100, 4, 4);
    movieScreen = new THREE.Mesh( movieGeometry, movieMaterial );
 
    movieScreen.position.set(0, -1000, 0);
    movieScreen.rotation.x = Math.PI * - 0.5;
    scene.add(movieScreen);
    video.play();
}

function onKeyPress(){
    var keyCode = event.which;
    
    if (keyCode == 87) {
        if (toggle===true){
            toggle = false;
        } else {
            toggle = true;
        }

        movieScreen.material.color = new THREE.Color(0xffffff);
        movieScreen.material.map = null;
    }
}

