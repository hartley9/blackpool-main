import * as THREE from './build/three.module.js';


class Vehicle {
    constructor( x, y, z ){
        this.pos = new THREE.Vector3(x, y, z);
        this.vel = new THREE.Vector3( x, y, z );
        this.acc = new THREE.Vector3( x, y, z );
        this.maxSpeed = 5;
        this.maxSteer = 0.1;
        this.angle = 0;
    }

    display()
    {
        //fill in this function
        
        sphere.position.set(this.pos);
    }
    //update position of agent
    update(){
        debugger;
        this.vel.addVectors(this.vel, this.acc, 0);
        this.pos.addVectors(this.pos, this.vel, 0);
        this.acc.set(0,0,0);
        let vc = new THREE.Vector3(0,0,0);
        this.angle = this.vel.angleTo(vc);
        debugger;
    }

    applyForce(f){
        let force = new THREE.Vector3();
        force.copy(f);
        
        this.acc.addVectors(this.acc, force);
        
    }
    seek(target)
    {
        let desired = new THREE.Vector3();
        desired.subVectors(target, this.pos);
        desired.normalize();
        
        desired.multiplyScalar(this.maxSpeed);
        
        let steer = new THREE.Vector3();
        steer.subVectors(desired, this.vel);
        
        steer.clampScalar(0.25, this.maxSteer);
        
        this.applyForce(steer);
    }
}
let mouse = new THREE.Vector2();
function onDocumentMouseMove( event )
{
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

let camera, scene, renderer, numAgents, sphere, v;
function init(){
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xffffff );

    camera = new THREE.PerspectiveCamera( 
        75, 
        window.innerWidth / window.innerHeight,
        0.1,
        1000 );
    
    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight);
    
    document.body.appendChild( renderer.domElement );
    
    //make geometry and material for spheres
    var geometry = new THREE.SphereGeometry( 5, 32 );
    var material = new THREE.MeshBasicMaterial ( { color: 0xffff00 } );

    v = new Vehicle(window.innerWidth/2, window.innerHeight/2, 0);
    let f = new THREE.Vector3(1, 1, 1);
    v.applyForce(f);


    numAgents = 1;
    sphere = new THREE.Mesh( geometry, material );
    scene.add(sphere);


}
let target = new THREE.Vector3();
function animate(){
    requestAnimationFrame( animate );
    //Put loop code within here

    target.set(mouse.x, mouse.y, 0);

    v.seek(target);

    v.update();

    v.display();


    renderer.render( scene, camera );

}

init();
animate();