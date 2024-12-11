import * as THREE from '../build/three.module.js';
import {getRandomNum} from './utilFunctions.js';

/**
 * This class is for each member of a boid
 * @param {*} color 
 * @param {*} geometry 
 * @param {*} id 
 */
export function Creature(color, geometry, id){
    
    this.id = id;
    this.headOut; //direction the creature looks
    
    var color = new THREE.Color(color);
    const material = new THREE.MeshLambertMaterial({
        wireframe: false, 
        color: color
    });
    this.mesh = new THREE.Mesh(geometry, material);

    this.mesh.position.set(getRandomNum(50, -50), getRandomNum(50, -50), getRandomNum(50, -50));

    //create bounding box
    this.bb = new THREE.BoundingBoxHelper(this.mesh, 0x000000); 

    this.velocity = new THREE.Vector3(getRandomNum(100, -100) * 0.1, getRandomNum(100, -100) * 0.1, getRandomNum(100, -100) * 0.1);
    this.acceleration = new THREE.Vector3();
    this.wonderTheta = 0;
    this.maxSpeed = 5;
    this.boost = new THREE.Vector3();

    //Variables for .glTF object animations
    this.model;
    this.mixer;
    this.action;

    //Rotation offsets
    this.defaultRotation = new THREE.Vector3();
    this.rotationOffset = new THREE.Vector3();

    this.upperRotationLimit = [];
    this.lowerRotationLimit = [];
}

Creature.prototype.applyForce = function(f){
    this.acceleration.add(f.clone());
}

//Called every clock cycle
Creature.prototype.update = function(){
    
    //update bounding box
    this.bb.update();
    
    const maxSpeed = this.maxSpeed;

    //boost
    this.applyForce(this.boost);
    this.boost.multiplyScalar(0.9);
    if (this.boost.length() < 0.01){
        this.boost = new THREE.Vector3();
    }

    //update vel
    this.velocity.add(this.acceleration);

    //limit
    if (this.velocity.length()>maxSpeed){
        this.velocity.clampLength(0, maxSpeed);
    }

    //update position 
    this.mesh.position.add(this.velocity);

  

    //reset acceleration
    this.acceleration.multiplyScalar(0);

    //heading 
    const head = this.velocity.clone();
    head.multiplyScalar(10);
    head.add(this.mesh.position);
    this.mesh.lookAt(head);
    //this.headOut = head;


    //update position and rotation of object
    if (this.model !== undefined)
    {
        //change the position
        this.model.scene.children[0].position.x = this.mesh.position.x;
        this.model.scene.children[0].position.y = this.mesh.position.y;
        this.model.scene.children[0].position.z = this.mesh.position.z;
        

        //Change the direction the mesh and object face
        let myhead = this.velocity.clone();
        myhead.multiplyScalar(5);
        myhead.add(this.mesh.position);
        this.model.scene.children[0].lookAt(myhead);

        //offset the rotation of models
        this.model.scene.children[0].rotation.x -= this.defaultRotation.x;
        this.model.scene.children[0].rotation.y -= this.defaultRotation.y;
        this.model.scene.children[0].rotation.z -= this.defaultRotation.z;
        
        //Rotation stuff - testing
        //head.multiplyScalar(0.5);
        // this.model.scene.children[0].lookAt(0, head.y, head.z);
        //  this.model.scene.children[0].rotation.x = this.defaultRotation.x;
        // this.model.scene.children[0].rotation.z = this.mesh.rotation.x;
    }
}


Creature.prototype.updateColor = function()
{
    let acc = this.acceleration;
    let vel = this.velocity;
    let fin = new THREE.Vector3();

    fin.add(acc);
    fin.add(vel);
    
    //console.log(fin);
    let col = new THREE.Color(fin.x, fin.y, fin.z);

    this.mesh.material.color = col;
}

//Applies a .glTF model to this creature
Creature.prototype.setModel = function(m)
{
    this.model = m;
    this.defaultRotation = m.scene.children[0].rotation;
    this.mixer = new THREE.AnimationMixer(this.model.scene);
    this.action = this.mixer.clipAction(this.model.animations[ 0 ]);
    this.action.play();
    
}

Creature.prototype.setScale = function(s)
{
    if (this.model !== undefined){

        this.model.scene.children[ 0 ].scale.set(s,s,s);
    }
    
}

//Rotation offset required by .glTF object
Creature.prototype.setRotationOffset = function(x, y, z)
{
    this.rotationOffset.x = x;
    this.rotationOffset.y = y;
    this.rotationOffset.z = z;
}

//Clamp rotation to avoid gimbal lock
Creature.prototype.setRotationLimit = function(input, output)
{
    this.lowerRotationLimit = input; 
    this.upperRotationLimit = output;
}