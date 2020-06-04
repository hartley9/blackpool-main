/*
class for seeker/predator behaviour
*/
import * as THREE from '../build/three.module.js';
import {getRandomNum} from './utilFunctions.js';
export function Predator(id)
{

    this.id = id; 
    this.preyId; //index of current prey location in store obj
    this.numPrey;
    
    this.pos = new THREE.Vector3(); 
    this.vel = new THREE.Vector3();
    this.vel.set(getRandomNum(-2, 2), getRandomNum(-2, 2), getRandomNum(-2, 2));
    this.acc = new THREE.Vector3();

    this.maxspeed = 5;
    this.maxforce = 0.075;

    this.perception = 20; //how far can you see

    //Booleans used for checking predator attention
    this.distThresh = 5;
    this.bored = false;
    this.boredTimer = false;


    var geometry = new THREE.CylinderGeometry(1, 8, 25, 12);
    //
    geometry.rotateX(THREE.Math.degToRad(90));
    const material = new THREE.MeshLambertMaterial({
        wireframe: false, 
        color: '#808080',
    });                                                                 
    //heading for the cones
    this.mesh = new THREE.Mesh(geometry, material);
    console.log('created Predator');

    this.model;
    this.mixer;
    this.action; 
    
}

Predator.prototype.behaviours = function()
{

    var seek = this.seek(this.target);
    this.applyForce(seek);

}

Predator.prototype.applyForce = function(f)
{
    this.acc.add(f);
}

Predator.prototype.update = function(target){
    this.target = target;
    this.pos.add(this.vel);
    this.vel.add(this.acc);
    this.acc.set(0,0,0);
    this.mesh.position.set(this.pos.x, this.pos.y, this.pos.z);
 
    //heading - error with stationary position
    var head = this.vel.clone();
    head.multiplyScalar(10);
    head.add(this.pos);
    this.mesh.lookAt(head);


    var dist = this.getDistance(this.target);
    this.checkAttention(dist);

    this.behaviours();

    //update the position of the model
    if (this.model !== undefined)
    {
        this.model.position = this.pos;
    }
}

Predator.prototype.seek = function(target) {
    var desired = new THREE.Vector3();
    desired.subVectors(target, this.pos);
    //desired.
    desired.clampLength(0, this.maxspeed);
    var steer = new THREE.Vector3();
    steer.subVectors(desired, this.vel);
    steer.clampLength(0, this.maxforce);
    return steer;
}

Predator.prototype.avoid = function(object = new THREE.Vector3())
{
    let futurePos = new THREE.Vector3().addVectors(this.applyForce, object);
    let dist = new THREE.Vector3.subVectors(object, futurePos);
    let dlen = dist.length();

    if (dlen <= this.perception)
    {
        let repelVector = new THREE.Vector3().subVectors(this.pos, object);
        repelVector.normalize();
        if (dlen != 0)
        {
            let scale = 1.0/dlen;
            repelVector.normalize();
            repelVector.multiplyScalar((this.maxforce*10)*scale);
            if (repelVector.length()<0)
            {
                repelVector.z = 0;
            }
        }
        return repelVector;
    }
}

Predator.prototype.getDistance = function(target)
{
    let toTarget = new THREE.Vector3().subVectors(target, this.mesh.position);
    let distance = toTarget.length();
    return distance; 
}

Predator.prototype.checkAttention = function(distance)
{   
    //needs to get bored...
    //some kind of logical timer???
    if (this.boredTimer ===false){
        if (distance < this.distThresh && this.bored===false)
        {
                //startTimer for random duration - then reassign target
                let time = getRandomNum(3000, 10000);
                let t = setTimeout(() => {
                    this.newPreyId(this.numPrey)
                }, time);  
                this.boredTimer = true; 
                
        }
    }
    else{} //timer is already on       

}

Predator.prototype.setTarget = function(t)
{
    this.target = t;
}
Predator.prototype.setPrey = function(prey)
{
    this.prey = prey;
}

Predator.prototype.newPreyId = function(length) {
    this.numPrey = length; //for most recent size of prey array
    let rand = Math.floor(Math.random() * length);
    this.bored, this.boredTimer =false;
    //console.log('predator is now interested.');  
    this.preyId = rand;
    //console.log(this.preyId);
    
}

Predator.prototype.getPreyId = function()
{
    return this.preyId;
}

Predator.prototype.getCoords = function()
{
    let coords = [];
    coords.push(this.id);
    coords.push(this.mesh.position.x);
    coords.push(this.mesh.position.y);
    coords.push(this.mesh.position.z);
    return coords;
}

Predator.prototype.setModel = function(m)
{
    this.model = m;
    this.mixer = new THREE.AnimationMixer(this.model.scene);
}


//Come back and check
Predator.prototype.avoidPredators = function(predators) 
{
    const sumVec = new THREE.Vector3();
    for (let i=0; i<predators.length-1; i++)
    {
        let pos = predators[i].mesh.position;
        sumVec.add(this.avoidPred(pos))
    }
    return sumVec;
}
//look at this
Predator.prototype.avoidPred = function(pos) 
{
    this.mesh.geometry.computeBoundingSphere();
    const boundingSphere = this.mesh.geometry.boundingSphere;

    const toMeVector = new THREE.Vector3();
    toMeVector.subVectors(this.mesh.position, pos);

    const distance = toMeVector.length() - boundingSphere.radius * 1;
    if (distance <= 50){
        const steerVector = toMeVector.clone();
        steerVector.normalize();
        steerVector.multiplyScalar(1 / Math.pow(distance, 1));
        return steerVector;
    } else{return new THREE.Vector3(0,0,0);}
}
