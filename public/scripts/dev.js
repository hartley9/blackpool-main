import * as THREE from '../build/three.module.js';

import {OrbitControls} from '../jsm/controls/OrbitControls.js';
import {GLTFLoader} from '../jsm/loaders/GLTFLoader.js';
//GUI not yet used...
import { GUI } from '../jsm/libs/dat.gui.module.js';
import {Boid} from './boids.js';
import {Creature} from './boids.js';
import {BoxContainer} from './boids.js';
import {Walker} from './Walker.js'
import {Predator} from './Predator.js';
import {Store} from './Store.js';

//Import class for storing objects and all associated data
//import glObj from '../glObj.js';

let H = window.innerHeight;
let W = window.innerWidth;

//user set dimensions
let myH = 500;
let myW = 500;

let scene, mainCamera, renderer, clock;
let loader, object, mixer;

let coords; //mouse coordinates

//video texture variables
let video, videoImage, videoImageContext, videoTexture, movieScreen;
let toggle = false;

//Boxcontainer for boids
let boxContainer; 

//Keep track of seekers
//let seekers = [];
let predators = [];

//dataStore for walker locations
let walkerStore = new Store();
let predatorStore = new Store();

//walkers
let walkers = [];

/*
Fish Variables 
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
let actions = [];

/*Bream
let breamNum = 25;
//Intialise random starting locations for fish here
let breamLocations = [];
for (let i=0; i<breamNum; i++){
   //                                                           x                           y                          z
    breamLocations.push(new THREE.Vector3(getRandomArbitrary(-60,60), getRandomArbitrary(-100,-20), getRandomArbitrary(-60,60)));
}
*/

//Stats
(function(){var script=document.createElement('script');script.onload=function(){var stats=new Stats();document.body.appendChild(stats.dom);requestAnimationFrame(function loop(){stats.update();requestAnimationFrame(loop)});};script.src='//mrdoob.github.io/stats.js/build/stats.min.js';document.head.appendChild(script);})()

//Array to hold the camera views
let views = [];

function View( canvas, fullWidth, fullHeight, viewX, viewY, viewWidth, viewHeight ) {

    canvas.width = viewWidth * window.devicePixelRatio;
    canvas.height = viewHeight * window.devicePixelRatio;

    var context = canvas.getContext( '2d' );

    var camera = new THREE.PerspectiveCamera( 20, viewWidth / viewHeight, 1, 10000 );


    camera.setViewOffset( fullWidth, fullHeight, viewX, viewY, viewWidth, viewHeight );
    camera.position.z = 1800;

    this.render = function () {

        camera.position.x = (camera.position.x ) * 0.05;
        camera.position.y = (camera.position.y ) * 0.05;
        camera.lookAt( scene.position );

        renderer.render( scene, camera );

        context.drawImage( renderer.domElement, 0, 0 );

    };

}

//boids

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

    //reusable functions ot set up the bream_models
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
    
    //whale
    var loc = new THREE.Vector3(getRandomArbitrary(-60,60), getRandomArbitrary(-100,-20), getRandomArbitrary(-60,60));
    //loader.load('objects/blue_whale/scene.gltf', gltf => onLoad(), onProgress, onError);

    
}

const getRandomNum = (max = 0 , min = 0) => Math.floor(Math.random() * (max + 1 - min)) + min;

let breamMeshGroup;
let breamBoid;
let breamRotate = new THREE.Vector3(80,0,0);

let discusBoid;
let discusMeshGroup;
let discusRotate = new THREE.Vector3(80,0,80);

let thirdBoid;
let thirdMeshGroup;
let thirdRoate = new THREE.Vector3(0,0,0);

//floating ones
let flageBoid; 
let flageMeshGroup;
let flageRotate = new THREE.Vector3(0,0,0);

let breamNum = 25;
let discusNum = 25;

// let creatureNum = breamNum;
//creatures
export const generateBoid = (boid, boidSize, creatureMeshGroup, color, geo) => {
    const creatures = [];
    scene.remove(creatureMeshGroup);
    creatureMeshGroup = new THREE.Group();
    for (let i = 0; i<boidSize; i++)
    {
        const creature = new Creature(color, geo, i);
        creatureMeshGroup.add(creature.mesh);
        creatures.push(creature);
    }
    boid = new Boid(creatures);
    scene.add(creatureMeshGroup);
    return boid;
};

function getRandomArbitrary(min, max) {
return Math.random() * (max - min) + min;
}


function init()
{
    //Scene
    scene = new THREE.Scene();
    
    //Camera
    mainCamera = new THREE.PerspectiveCamera(55,
        window.innerWidth / window.innerHeight, 
        0.1, 
        2500);
    mainCamera.position.set(0,1500,0);

    //Renderer
    renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(renderer.domElement);
    document.body.addEventListener('keydown', onKeyPress, true);
    
    //clock for animations
    clock = new THREE.Clock();

    //Light NEED TO HAVE ANOTHER LOOK AT THIS, SPRUCE IT UP A BIT... 
    //-maybe sources of light for boid objects, if this can be manipulated
    var ambientLight = new THREE.AmbientLight( 0xcccccc, 0.4 );
	scene.add( ambientLight );

    var pointLight = new THREE.PointLight( 0xffffff, 0.8 );
    mainCamera.add( pointLight );
    scene.add( mainCamera );
   
    scene.background = new THREE.Color( 0xcdcdcd );

    //Axis helper
    var axesHelper = new THREE.AxesHelper( 5000 );
    scene.add( axesHelper );

    //controls
    var controls = new OrbitControls( mainCamera, renderer.domElement);
    
    //setting the camera position
    
    //event listeniner for window resize
    window.addEventListener('resize', onWindowResize, false);

    //video
    backgroundTexture();

    //boxContainer
    boxContainer = new BoxContainer(1920, 500, 1080, 0x0000ff);
    boxContainer.mesh.position.set(0,-500, 0);
    scene.add(boxContainer.mesh);
    
    //Boids...
    //create geometry for the boids
    //One boid per type of fish 
    //Cylinder geometries
    const cylGeo = new THREE.CylinderGeometry(1, 8, 25, 12);
    cylGeo.rotateX(THREE.Math.degToRad(90));
    breamBoid = generateBoid(breamBoid, breamNum, breamMeshGroup, 0xff522c, cylGeo);
    discusBoid = generateBoid(discusBoid, discusNum, discusMeshGroup, 0x22bddd, cylGeo);
    
    thirdBoid = generateBoid(thirdBoid, 25, thirdMeshGroup, 0xe71cad, cylGeo);
    //Dinoflaggelites slow moing
    const sphGeo = new THREE.SphereGeometry(7, 7, 7);
    flageBoid = generateBoid(flageBoid, 50, flageMeshGroup, 0x82f63f, sphGeo);
    //Change movement behaviour of flageBoid
    flageBoid.params.maxSpeed = 0.5;
    flageBoid.params.separate.maxForce = 0.5;
    flageBoid.params.separate.effectiveRange = 75;

    //flageBoid.params.separate.effectiveRange = 20;
    models.flage.length = 50;
    
    
    //predator/seeker behaviour
    for (let i =0; i<3; i++){
        let predator = new Predator(i);
        predators.push(predator);
        scene.add(predator.mesh);
    }

    //Create walkers
    for (var i = 0; i<5; i++)
    {
        let w = new Walker(i, 1920,1080, scene);
        w.setStore(walkerStore);
        walkers.push(w);
       // scene.add(w.plane);
    }
    console.log()
    predators.forEach(p => p.newPreyId(walkers.length));
    console.log(predators[1].getPreyId());

    //instantiate the loader
    loader = new GLTFLoader(); //instantitate loader for gltf objects
    //load the models here
    //loadModels();

}

/*
LOOPING - Animate() function
*/
function animate()
{   

    renderer.render( scene, mainCamera );

    //Animations
    var delta = clock.getDelta();
    for (let i = 0; i < mixers.length; i++)
    {
        if (mixers[i]) mixers[i].update( delta );
    }
    
    //Render video texture
    renderVideo();
    
    let allWalkers = walkerStore.getAll();

    /*********  Update all the creatures ************/
    /******Update Boids ******/
    breamBoid.update(boxContainer, walkers);
    for (let i = 0; i<breamBoid.creatures.length; i++)
    {
        breamBoid.creatures[i].setRotationOffset()
        if (breamBoid.creatures[i].mixer){breamBoid.creatures[i].mixer.update(delta);}
    }
    discusBoid.update(boxContainer, walkers);
    for (let i = 0; i<discusBoid.creatures.length; i++)
    {
        if (discusBoid.creatures[i].mixer){discusBoid.creatures[i].mixer.update(delta);}
    }

    flageBoid.update(boxContainer, walkers);
    for (let i = 0; i<flageBoid.creatures.length; i++)
    {
        if (flageBoid.creatures[i].mixer){flageBoid.creatures[i].mixer.update(delta);}
    }

    thirdBoid.update(boxContainer, walkers);
    /*   for (let i = 0; i<flageBoid.creatures.length; i++)
    {
        if (thirdBoid.creatures[i].mixer){thirdBoid.creatures[i].mixer.update(delta);}
    }
    */
    
    /****** update predator/seeker *****/
    for (let i = 0; i<predators.length; i++)
    {
        predators[i].update(walkerStore.returnVector(predators[i].getPreyId()));
        predators[i].behaviours();
        let coords = predators[i].getCoords();
        predatorStore.setValue(coords[0], coords[1], coords[2], coords[3]);
    }
      /****** update walkers *****/
   for (let i = 0; i<walkers.length ; i++)
   {
       walkers[i].moveAlongCurve();
       let coords = walkers[i].getCoords();
       walkerStore.setValue(coords[0], coords[1], coords[2], coords[3]);
   }

   //testing
   if (breamBoid.creatures[3].model !== undefined){
       // console.log(breamBoid.creatures[3].model.scene.children[0].rotation);
   }
   
   views.forEach(v => v.render()); //Update each of the camera views

   window.requestAnimationFrame( animate );
}

//Main
init();
animate();

/*
Other functions for updating other elements
*/
var currModel;



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

function onWindowResize()
{
    mainCamera.aspect = window.innerWidth / window.innerHeight;
    mainCamera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}


function backgroundTexture()
{
    video = document.createElement( 'video' );
    video.autoplay = true;
    video.src = './scripts/videos/fish.mp4';
    video.load();
    video.play();

    videoImage = document.createElement( 'canvas' );
    videoImage.width = 960;
    videoImage.height = 540;

    videoImageContext = videoImage.getContext( '2d' );
    videoImageContext.fillStyle = '#808080';
    videoImageContext.fillRect( 0, 0, videoImage.width, videoImage.height );

    videoTexture = new THREE.Texture( videoImage );
    videoTexture.minFilter = THREE.LinearFilter; 
    videoTexture.magFilter = THREE.LinearFilter; 
    
    var movieMaterial = new THREE.MeshBasicMaterial({ map: videoTexture, overdraw: true, side: THREE.DoubleSide});

    var movieGeometry = new THREE.PlaneBufferGeometry( 1920, 1080, myH, 4, 4);
    movieScreen = new THREE.Mesh( movieGeometry, movieMaterial );
 
    movieScreen.position.set(0, -600, 0);
    movieScreen.rotation.x = Math.PI * - 0.5;
    scene.add(movieScreen);
    video.play();
}

function onKeyPress(){
    var keyCode = event.which;
   
    if (keyCode == 87) {
        if (toggle===true){
          
            console.log('keypress');
            toggle = false;
        } else {
        
            toggle = true;
        }

        movieScreen.material.color = new THREE.Color(0xffffff);
        movieScreen.material.map = null;
    }
   
}


function moveCrude(models){
    var breamX = 10.5;
    for (let i = 0; i < models.length; i++)
    {
        if (models[i] !== undefined){
            currModel = models[ i ].scene.children[ 0 ];
            currModel.position.x = currModel.position.x += breamX;
            
            if (currModel.position.x >= 1920/2){
                breamX = -3.5;
                changeRotation(models, 1);
            } else if (currModel.position.x <= -(1920/2))
            {
                breamX = 3.5;
                changeRotation(models, 0);
                
            }
        }
    }
    
}

function changeRotation(models, type)
{
    for (let i = 0; i<models.length; i++){
        var model = models[i].scene.children[ 0 ]; 
        if (type === 0)
        {
            model.rotation.z = -80;
        }
        else if (type === 1)
        {
            model.rotation.z = 80;
        }
    }   
}


//dump gltf object tree
function dumpObject(obj, lines = [], isLast = true, prefix = '') {
    const localPrefix = isLast ? '└─' : '├─';
    lines.push(`${prefix}${prefix ? localPrefix : ''}${obj.name || '*no-name*'} [${obj.type}]`);
    const newPrefix = prefix + (isLast ? '  ' : '│ ');
    const lastNdx = obj.children.length - 1;
    obj.children.forEach((child, ndx) => {
      const isLast = ndx === lastNdx;
      dumpObject(child, lines, isLast, newPrefix);
    });
    return lines;
}

/*
CURRENTLY UNUSED/PREVIOUSLY USED FUNCTIONS
//Function to visualise curve for which a given object will follow repeatedly
    
       function makeCurve(){
        var randomPoints = [];
    
        randomPoints.push(
            new THREE.Vector3(400, -40, 300), 
            new THREE.Vector3(-300,-40,-250),
            new THREE.Vector3(-700,-40,500),
            new THREE.Vector3(400, -40, 300)
        );
        
        var spline = new THREE.CatmullRomCurve3(randomPoints);
        var points = spline.getPoints(10);
        
        //Visualise curve
        var material = new THREE.LineBasicMaterial({
            color: 0xff00f0,
        });
    
        var geometry = new THREE.Geometry();
        for(var i = 0; i < points.length; i++){
            geometry.vertices.push(points[i]);  
        }
    
        var line = new THREE.Line(geometry, material);
        //Add line to scene
        scene.add(line);
        //console.log(points);
        return spline;
      }
    
    
    //Place object on a path and move the object around the path
    var t = 0;
    function placeObjectOnCurve( gltf, curve )
    {
        //get point
        pt = curve.getPoint( t );
        //console.log('point - ' + pt.x + ', ' + pt.y + ', ' + pt.z);
        
        const newPos = new THREE.Vector3(pt.x, pt.y, pt.z);
        gltf.position.copy(newPos);
    
        //get tangent to curve
        tangent = curve.getTangent( t ).normalize();
    
        //calculate the axis of rotation
        axis.crossVectors( up ,tangent ).normalize();
    
        //calculate the angle
        radians = Math.acos( up.dot( tangent ) );
    
        //wtf are radians
        //set the quaterniion
        gltf.quaternion.setFromAxisAngle( axis, radians );
    
        t = (t >= 1) ? 0 : t += 0.002;
    
        renderer.render(scene, camera);
    } 


*/