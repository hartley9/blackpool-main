import * as THREE from '../build/three.module.js';

import {OrbitControls} from '../jsm/controls/OrbitControls.js';
import {GLTFLoader} from '../jsm/loaders/GLTFLoader.js';
import { Water } from '../jsm/objects/Water2.js'
//GUI not yet used...
import { GUI } from '../jsm/libs/dat.gui.module.js';

import {Boid} from './boids.js';
import {Creature} from './boids.js';
import {BoxContainer} from './boids.js';

//Import class for storing objects and all associated data
//import glObj from '../glObj.js';

let H = window.innerHeight;
let W = window.innerWidth;

//user set dimensions
let myH = 500;
let myW = 500;

let scene, camera, renderer, clock, water;
let loader, object, mixer;

//video texture variables
let container;
let video, videoImage, videoImageContext, videoTexture, movieScreen;
let videoOn = true;

//Boxcontainer
let boxContainer = new BoxContainer(myW+300, myH+300, 1000, 0x0000ff);

/*
Fish Variables 
*/


/*
    Arrays for different model types.
    Make into javaScript object with multiple instance variable arrays
*/
let models = {
    bream: [],
    whale: [], 
}
//Arrays for animations of objects
//As with above, make into object, 
//and store these values in custom arrays 
let mixers = [];
let actions = [];

//Bream
let breamNum = 30;
//Intialise random starting locations for fish here
let breamLocations = [];
for (let i=0; i<breamNum; i++){
   //                                                           x                           y                          z
    breamLocations.push(new THREE.Vector3(getRandomArbitrary(-60,60), getRandomArbitrary(-100,-20), getRandomArbitrary(-60,60)));
}

//variables for curve
let matrix = new THREE.Matrix4();
let axis = new THREE.Vector3( );
let up = new THREE.Vector3( 0, 1, 0 );
let pt, radians, tangent;

//GUI
var gui = new GUI();

//Stats
(function(){var script=document.createElement('script');script.onload=function(){var stats=new Stats();document.body.appendChild(stats.dom);requestAnimationFrame(function loop(){stats.update();requestAnimationFrame(loop)});};script.src='//mrdoob.github.io/stats.js/build/stats.min.js';document.head.appendChild(script);})()


//

//load object functions
/*
    Used to load GLTF objects, 
    takes array where object will be stored as a parameter.

    Invoked as follows >
    loader.load('objects/bream/scene.gltf', gltf => onLoad( gltf, breamLocations[i], 0.025), onProgress, onError);
*/
function loadModels(arr, mixers, actions, scene)
{
    const loader = new GLTFLoader();

    //reusable functions ot set up the bream_models
    const onLoad = ( gltf, position, scale ) => {
        
        let model = gltf;
        arr.push(model);
       //console.log('No. of objects: ' + models.length);

        var mixer = new THREE.AnimationMixer( model.scene );
        mixers.push( mixer );
        var action = mixer.clipAction(model.animations[ 0 ]);
        action.play();
        actions.push(action);
        
        //
        model = arr[(arr.length-1)].scene.children[ 0 ];
        model.position.copy( position );
        model.scale.set(scale, scale, scale);


        //Aniimation and mixers
        scene.add(arr[(arr.length-1)].scene);
    };

    const onProgress = () => {};

    const onError = ( errorMessage ) => {console.log( errorMessage );};

    /* add models here */

    //var bream;
    for (let i=0; i<breamNum; i++)
    {
        loader.load('objects/bream/scene.gltf', gltf => onLoad( gltf, breamLocations[i], 0.085), onProgress, onError);
        console.log('bream locations: ' + breamLocations[i]);
    }
    /*
    var loc = new THREE.Vector3(getRandomNum(-30, 30), getRandomNum(-30, 0), getRandomNum(-30, 30));
    loader.load('objects/blue_whale/scene.gltf', gltf => onLoad(gltf, loc, 0.05), onProgress, onError);
    */
}


const getRandomNum = (max = 0 , min = 0) => Math.floor(Math.random() * (max + 1 - min)) + min;

let creatureMeshGroup;
let creatureNum = breamNum;
let boid;
//creatures
const generateBoid = () => {
    const creatures = [];
    scene.remove(creatureMeshGroup);
    creatureMeshGroup = new THREE.Group();
    for (let i = 0; i<creatureNum; i++)
    {
        const creature = new Creature();
        creatureMeshGroup.add(creature.mesh);
        creatures.push(creature);
    }
    boid = new Boid(creatures);
    scene.add(creatureMeshGroup);
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
    //Scene
    scene = new THREE.Scene();
    
    //Camera
    camera = new THREE.PerspectiveCamera(55,
        window.innerWidth / window.innerHeight, 
        0.1, 
        2500);
    camera.position.set(0,1500,0);

    //Renderer
    renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(renderer.domElement);
    
    document.body.addEventListener('click', printCoords, true);
    document.body.addEventListener('mousemove', onMouseMove, true);
    document.body.addEventListener('keydown', onKeyPress, true);
    
    //clock for animations
    clock = new THREE.Clock();

    //Light NEED TO HAVE ANOTHER LOOK AT THIS, SPRUCE IT UP A BIT... 
    //-maybe sources of light for boid objects, if this can be manipulated
    var ambientLight = new THREE.AmbientLight( 0xcccccc, 0.4 );
	scene.add( ambientLight );

    var pointLight = new THREE.PointLight( 0xffffff, 0.8 );
    camera.add( pointLight );
    scene.add( camera );
   
    scene.background = new THREE.Color( 0xffffff );

    //Axis helper
    var axesHelper = new THREE.AxesHelper( 5000 );
    scene.add( axesHelper );

    //controls
    var controls = new OrbitControls( camera, renderer.domElement);
    
    //setting the camera position
    

    //event listeniner for window resize
    window.addEventListener('resize', onWindowResize, false);
 
    loader = new GLTFLoader(); //instantitate loader for gltf objects
    loadModels(models.bream, mixers, actions, scene); //Function call to load all objects

    //video
    backgroundTexture();

    boxContainer.mesh.position.y = -1000;
    scene.add(boxContainer);
    
    generateBoid();
    
}

/*
LOOPING - Animate() function
*/
function animate()
{   
    window.requestAnimationFrame( animate );
    renderer.render( scene, camera );
    //moveModels(models.bream);
    
    //Animations
    var delta = clock.getDelta();
    for (let i = 0; i < mixers.length; i++)
    {
        if (mixers[i]) mixers[i].update( delta );
    }
    renderVideo();
    boid.update(boxContainer);
    moveModels(models.bream);
    //models.bream[0].scene.children[ 0 ].rotation.x += 5;

}

//Main
init();
animate();

/*
Other functions for updating other elements
*/
var currModel;
function moveModels(arr)
{
   for (let i =0; i<arr.length; i++)
   {

        //Move fish with creature
        currModel = arr[ i ].scene.children[ 0 ];
        currModel.position.x = boid.creatures[i].mesh.position.x;
        currModel.position.y = boid.creatures[i].mesh.position.y;
        currModel.position.z = boid.creatures[i].mesh.position.z;

        currModel.rotation.x = boid.creatures[i].mesh.rotation.x;
        currModel.rotation.y = boid.creatures[i].mesh.rotation.y;
        currModel.rotation.z = boid.creatures[i].mesh.rotation.z;
        currModel.rotateX(80);

       
        //Rotation of model with movement
        /*
        var head = boid.creatures[i].velocity.clone();
        head.multiplyScalar(10);
        head.add(boid.creatures[i].mesh.position);
        currModel.lookAt(head);
        */
   }

}

function webcamUpdate()
{
    if ( navigator.mediaDevices && navigator.mediaDevices.getUserMedia ) {

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
    if (videoOn === true){
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
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
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
    videoImage.width = 1920;
    videoImage.height = 1080;

    videoImageContext = videoImage.getContext( '2d' );
    videoImageContext.fillStyle = '#808080';
    videoImageContext.fillRect( 0, 0, videoImage.width, videoImage.height );

    videoTexture = new THREE.Texture( videoImage );
    videoTexture.minFilter = THREE.LinearFilter; 
    videoTexture.magFilter = THREE.LinearFilter; 
    
    var movieMaterial = new THREE.MeshBasicMaterial({ map: videoTexture, overdraw: true, side: THREE.DoubleSide});

    var movieGeometry = new THREE.PlaneBufferGeometry( 1920, 1080, myH, 4, 4);
    movieScreen = new THREE.Mesh( movieGeometry, movieMaterial );
 
    movieScreen.position.set(0, -300, 0);
    movieScreen.rotation.x = Math.PI * - 0.5;
    scene.add(movieScreen);
    video.play();
}

function onKeyPress(){
    var keyCode = event.which;
    if (keyCode == 87) {
        console.log(movieScreen);
        movieScreen.material.color = new THREE.Color(0xffffff);
        console.log('keypress');
        videoOn = false;

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

function printCoords()
{
    var temp_arr = [];
    for (let i = 0; i < this.breamBoids; i++)
    {   
        temp_arr.push(breamBoids.boids[i].position);
       // console.log(temp_arr);
    }
}




/*
CURRENTLY UNUSED/PREVIOUSLY USED FUNCTIONS


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