import * as THREE from '../build/three.module.js';

import {OrbitControls} from '../jsm/controls/OrbitControls.js';
import {GLTFLoader} from '../jsm/loaders/GLTFLoader.js';
//GUI not yet used...
import { GUI } from '../jsm/libs/dat.gui.module.js';
import {Boid} from './boids.js';
import {Creature} from './boids.js';
import {BoxContainer} from './boids.js';
import {Walker} from './Walker.js'

//seeker/predator import
import {SeekingCreature} from './SeekingCreature.js';

//Import class for storing objects and all associated data
//import glObj from '../glObj.js';

let H = window.innerHeight;
let W = window.innerWidth;

let windowHalfX = W / 2;
let windowHalfY = H / 2;

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
let boxContainer = new BoxContainer(1500, 1500, 1500, 0x0000ff);


//Keep track of seekers
let seekers = [];

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

//Bream
let breamNum = 15;
//Intialise random starting locations for fish here
let breamLocations = [];
for (let i=0; i<breamNum; i++){
   //                                                           x                           y                          z
    breamLocations.push(new THREE.Vector3(getRandomArbitrary(-60,60), getRandomArbitrary(-100,-20), getRandomArbitrary(-60,60)));
}

var seeker;

/*
// TO BE IMPLEMENTED
//variables for curve
let matrix = new THREE.Matrix4();
let axis = new THREE.Vector3( );
let up = new THREE.Vector3( 0, 1, 0 );
let pt, radians, tangent;
*/

//GUI
var gui = new GUI();

//Stats
(function(){var script=document.createElement('script');script.onload=function(){var stats=new Stats();document.body.appendChild(stats.dom);requestAnimationFrame(function loop(){stats.update();requestAnimationFrame(loop)});};script.src='//mrdoob.github.io/stats.js/build/stats.min.js';document.head.appendChild(script);})()

//Array to hold the camera views
let views = [];

function View( canvas, fullWidth, fullHeight, viewX, viewY, viewWidth, viewHeight ) {

    canvas.width = viewWidth * window.devicePixelRatio;
    canvas.height = viewHeight * window.devicePixelRatio;

    var context = canvas.getContext( '2d' );

    var camera = new THREE.PerspectiveCamera( 45, viewWidth / viewHeight, 1, 5000 );

    var pointLight = new THREE.PointLight( 0xffffff, 0.8 );
    camera.add( pointLight );

    camera.setViewOffset( fullWidth, fullHeight, viewX, viewY, viewWidth, viewHeight );
    camera.position.y += 1000;
    camera.rotation.x = Math.PI * - 0.5;
   // camera.position.x += 700;

    this.render = function () {

       // camera.position.x = (camera.position.x ) * 0.05;
        //camera.position.y = (camera.position.y ) * 0.05;
        //console.log('pos:' + scene.position);
        //camera.lookAt( 0,0,0 );
        
       // camera.lookAt( scene.position );

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
function loadModels(mixers, actions, scene)
{
    const loader = new GLTFLoader();

    //reusable functions ot set up the bream_models
    const onLoad = ( arr, gltf, position, scale ) => {
        
        let model = gltf;
        arr.push(model);
        
        var mixer = new THREE.AnimationMixer( model.scene );
        mixers.push( mixer );
        var action = mixer.clipAction(model.animations[ 0 ]);
        action.play();
        actions.push(action);
        
        //adds the models to the array
        model = arr[(arr.length-1)].scene.children[ 0 ];
        model.position.copy( position );
        model.scale.set(scale, scale, scale);

        //console.log(dumpObject(arr[(arr.length-1)].scene));
        //Aniimation and mixers
        scene.add(arr[(arr.length-1)].scene);
    };

    const onProgress = () => {};

    const onError = ( errorMessage ) => {console.log( errorMessage );};

    /* add models here */
    // bream;
    for (let i=0; i<breamNum; i++)
    {
        loader.load('objects/bream/scene.gltf', gltf => onLoad( models.bream, gltf, breamLocations[i], 0.085), onProgress, onError);
        //console.log('bream locations: ' + breamLocations[i]);
    }
    
    //whale
    var loc = new THREE.Vector3(getRandomArbitrary(-60,60), getRandomArbitrary(-100,-20), getRandomArbitrary(-60,60));
    loader.load('objects/blue_whale/scene.gltf', gltf => onLoad(models.whale, gltf, loc, 30), onProgress, onError);
    
    //discus
    for (let i=0; i<breamNum; i++){
        loc = new THREE.Vector3(getRandomArbitrary(-60,60), getRandomArbitrary(-100,-20), getRandomArbitrary(-60,60));
        loader.load('objects/discus/scene.gltf', gltf => onLoad(models.discus, gltf, loc, 0.50), onProgress, onError);
    }
    
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

let flageBoid; 
let flageMeshGroup;
let flageRotate = new THREE.Vector3(0,0,0);

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

function getRandomArbitrary(min, max) {
return Math.random() * (max - min) + min;
}


/*
function which returns vector3 of mouse location where y is 0 bc of viewpoint
*/
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
function onMouseMove( event ) {
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientX / window.innerHeight) * 2 + 1 ; 
    let vec = new THREE.Vector3(mouse.x, 0, mouse.y);
   // console.log(vec);
    return vec
}


function init()
{

    var canvas1 = document.getElementById( 'canvas1' );
    var canvas2 = document.getElementById( 'canvas2' );
    var canvas3 = document.getElementById( 'canvas3' );

    var w = 700, h = 700;

    var fullWidth = w * 3; //w * x. Where x is no. of columns
    var fullHeight = h * 1; ////h * x. Where x is no. of rows

    views.push( new View( canvas1, fullWidth, fullHeight, w * 0, h * 0, w, h ) );
    views.push( new View( canvas2, fullWidth, fullHeight, w * 1, h * 0, w, h ) );
    views.push( new View( canvas3, fullWidth, fullHeight, w * 2, h * 0, w, h ) );
    //Scene
    scene = new THREE.Scene();
    
    //Camera
    /*
    mainCamera = new THREE.PerspectiveCamera(55,
        window.innerWidth / window.innerHeight, 
        0.1, 
        2500);
    mainCamera.position.set(0,1500,0);
    */

    //Renderer
    renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(w, h);
    
    var page = document.getElementById('mainDiv');
    if (page !== null && page !== undefined)
    {
        page.appendChild(renderer.domElement);   
    }
    
    
   //document.body.addEventListener('click', printCoords, true);
    document.body.addEventListener('mousemove', onMouseMove, true);
    document.body.addEventListener('keydown', onKeyPress, true);

    
    //clock for animations
    clock = new THREE.Clock();

    //Light NEED TO HAVE ANOTHER LOOK AT THIS, SPRUCE IT UP A BIT... 
    //-maybe sources of light for boid objects, if this can be manipulated
    var ambientLight = new THREE.AmbientLight( 0xcccccc, 0.4 );
	scene.add( ambientLight );

    
    scene.add( mainCamera );
   
    scene.background = new THREE.Color( 0xffffff );

    //Axis helper
    var axesHelper = new THREE.AxesHelper( 5000 );
    //scene.add( axesHelper );

    //controls
   // var controls = new OrbitControls( mainCamera, renderer.domElement);
    
    //setting the camera position
    
    //event listeniner for window resize
    //window.addEventListener('resize', onWindowResize, false);
 
    loader = new GLTFLoader(); //instantitate loader for gltf objects
    //loadModels(mixers, actions, scene); //Function call to load all objects

    //video
    backgroundTexture();

    boxContainer.mesh.position.y = -1500;
    scene.add(boxContainer);
    
    //Boids...
    //create geometry for the boids
    //One boid per type of fish 
    //Cylinder geometries
    const cylGeo = new THREE.CylinderGeometry(1, 8, 25, 12);
    cylGeo.rotateX(THREE.Math.degToRad(90));
    breamBoid = generateBoid(breamBoid, 25, breamMeshGroup, 0xff522c, cylGeo);
    discusBoid = generateBoid(discusBoid, 25, discusMeshGroup, 0x22bddd, cylGeo);
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
    
    //flageBoid = generateBoid(flageBoid, flageMeshGroup, 0x82f63f, cylGeo);
    
    
    var pointLight = new THREE.PointLight( 0xffffff, 0.8 );
    scene.add( pointLight );
    pointLight.position.set(0,1000,0);

    //predator/seeker behaviour
    for (let i =0; i<10; i++){
       // seeker = new SeekingCreature(getRandomArbitrary(-100,100), getRandomArbitrary(-30,-10), getRandomArbitrary(-100,100), scene);
    }

    //seekers.push(seeker);
    
    //Create walkers
    for (var i = 0; i<5; i++)
    {
        let w = new Walker(1920,1080, scene);
        walkers.push(w);
       // scene.add(w.plane);
    }
    
}

/*
LOOPING - Animate() function
*/
function animate()
{   
 
   // renderer.render( scene, mainCamera );
    //moveModels(models.bream);
    
    //Animations
    var delta = clock.getDelta();
    for (let i = 0; i < mixers.length; i++)
    {
        if (mixers[i]) mixers[i].update( delta );
    }
    
    //Render video
    renderVideo();
    
    //Model Movement 
    moveModels(models.bream, breamBoid, breamRotate);
    moveModels(models.discus, discusBoid, discusRotate);
    moveModels(models.flage, flageBoid, flageRotate);
    moveModels(models.flage, thirdBoid, thirdRoate);
    
    //moveCrude(models.whale);

    //Update seeker 
    coords = new THREE.Vector2(mouse.x, 0, mouse.y);
   // updateSeekers(coords);

   for (let i = 0; i<5 ; i++)
   {
       //walkers[i].move(10);
       walkers[i].moveAlongCurve();
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
function moveModels(arr, boid, rotation)
{
    boid.update(boxContainer); 

   for (let i =0; i<arr.length; i++)
   {

    if (arr[i] !== null && arr[i] !== undefined){
        //Move fish with creature
        currModel = arr[ i ].scene.children[ 0 ];
        currModel.position.x = boid.creatures[i].mesh.position.x;
        currModel.position.y = boid.creatures[i].mesh.position.y;
        currModel.position.z = boid.creatures[i].mesh.position.z;

        currModel.rotation.x = boid.creatures[i].mesh.rotation.x;
        currModel.rotation.y = boid.creatures[i].mesh.rotation.y;
        currModel.rotation.z = boid.creatures[i].mesh.rotation.z;
        
        currModel.rotateX(rotation.x);
        currModel.rotateY(rotation.y);
        currModel.rotateZ(rotation.z);
        
       
        //Rotation of model with movement
        /*

        var head = boid.creatures[i].velocity.clone();
        head.multiplyScalar(10);
        head.add(boid.creatures[i].mesh.position);
        currModel.lookAt(head);
    
        */
    }
    }

}

function updateSeekers(target)
{
    
    for (var i = 0; i< seekers.length; i++)
    {
       // console.log('updating...');
        seekers[i].update(target);
    }
}

function webcamUpdate()
{
    if ( navi444gator.mediaDevices && navigator.mediaDevices.getUserMedia ) {

        var constraints = { video: { width: 1280, height: 720, facingMode: 'user' } };

        navigator.mediaDevices.getUserMedia( constraints ).then( function ( stream ) {

            // apply the stream to the video element used in the texture

            video.srcObject = stream;
            video.play();

        } ).catch( function ( error ) {

            console.error( 'Unable to access the camera/webcam.', error );

        } );

    } else {

        console.error( 'MediaDevices interface not available.' );

    }
}

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
/*
function onWindowResize()
{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}
*/


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

    var movieGeometry = new THREE.PlaneBufferGeometry( 1980+1000, 1080, 100, 4, 4);
    movieScreen = new THREE.Mesh( movieGeometry, movieMaterial );
 
    movieScreen.position.set(0, -200, 0);
    movieScreen.rotation.x = Math.PI * - 0.5;
    scene.add(movieScreen);
    //console.log('ms pos' + movieScreen.position.x + movieScreen.position.y + movieScreen.position.z);
    video.play();
}

function onKeyPress(){
    var keyCode = event.which;
    //console.log(models.whale);
    if (keyCode == 87) {
        if (toggle===true){
          //  console.log(movieScreen);
           // scene.remove(movieScreen);
            console.log('keypress');
            toggle = false;
        } else {
            //backgroundTexture();
            //scene.add(movieScreen);
            toggle = true;
        }

        movieScreen.material.color = new THREE.Color(0xffffff);
        movieScreen.material.map = null;
    }
   
}

function addGUI(){


    gui.add(breamBoids, "flockmateRadius", 0, 500).step(1);
    gui.add(breamBoids, "separationDistance", 0, 100).step(1);
    gui.add(breamBoids, "maxVelocity", 0, 5).step(0.25);
    gui.add(breamBoids, "cohesionForce", 0, 0.25);
    gui.add(breamBoids, "alignmentForce", 0, 0.25);
    gui.add(breamBoids, "separationForce", 0, 0.25);
}

/*
function printCoords()
{
    var temp_arr = [];
    for (let i = 0; i < this.breamBoids; i++)
    {   
        temp_arr.push(breamBoids.boids[i].position);
       // console.log(temp_arr);
    }
    console.log('clicked');
    coneole.log(dumpObject(models.bream[0].scene));
}
*/
var breamX = 10.5;
function moveCrude(models){
    
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